// Pasul 2108002 — editarea textului din About Story Modal direct din admin
//
// PERFORMANTA — foarte important:
//   Textul din cod (`src/data/storyPhrases*`) ramane sursa implicita si este
//   afisat INSTANT, fara nicio cerere de retea. Suprascrierea din baza de date
//   se incarca DUPA aceea, in fundal, si numai daca exista.
//   Pentru vizitatori si utilizatori normali costul este o singura cerere
//   foarte mica, care nu blocheaza nimic si nu intarzie animatia.

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { getStoryPhrases, type LanguageKey, type StoryPhrase } from '@/data/storyPhrases';

export const STORY_CONTENT_KEY = 'about_story_phrases';

/** Textul salvat in baza de date, pe limbi */
export type StoryOverride = Partial<Record<LanguageKey, StoryPhrase[]>>;

/** Cache in memorie, ca sa nu cerem de doua ori in aceeasi sesiune */
let cachedOverride: StoryOverride | null = null;
let inFlight: Promise<StoryOverride> | null = null;

export async function fetchStoryOverride(): Promise<StoryOverride> {
  if (cachedOverride) return cachedOverride;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('site_content')
        .select('value')
        .eq('key', STORY_CONTENT_KEY)
        .maybeSingle();

      if (error || !data?.value) {
        cachedOverride = {};
        return cachedOverride;
      }

      cachedOverride = data.value as StoryOverride;
      return cachedOverride;
    } catch {
      cachedOverride = {};
      return cachedOverride;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/** Goleste cache-ul dupa ce adminul salveaza */
export function clearStoryOverrideCache() {
  cachedOverride = null;
}

/**
 * Returneaza frazele pentru limba data.
 * Porneste IMEDIAT cu textul din cod (zero asteptare), apoi il inlocuieste
 * daca exista o versiune editata din admin.
 */
export function useStoryPhrases(lang: LanguageKey): StoryPhrase[] {
  const [phrases, setPhrases] = useState<StoryPhrase[]>(() => getStoryPhrases(lang));

  useEffect(() => {
    let alive = true;

    // Textul din cod, instant
    setPhrases(getStoryPhrases(lang));

    // Suprascrierea, in fundal
    fetchStoryOverride().then((override) => {
      if (!alive) return;
      const custom = override[lang];
      if (Array.isArray(custom) && custom.length > 0) {
        setPhrases(custom);
      }
    });

    return () => {
      alive = false;
    };
  }, [lang]);

  return phrases;
}

export default useStoryPhrases;
