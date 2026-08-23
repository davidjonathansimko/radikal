// =====================================================================
// Pasul 2308004 (B) — text animat SUB logo, la intrarea in RADIKAL
// ---------------------------------------------------------------------
// Adminul poate alege un text care apare dedesubtul logo-ului, DUPA ce
// logo-ul a aparut — nu odata cu el. Daca optiunea e oprita, totul
// ramane exact ca pana acum.
//
// STOCARE: acelasi tabel `site_content`, cheia `intro_logo_text`.
// Nu este nevoie de SQL nou.
// =====================================================================

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export const INTRO_TEXT_KEY = 'intro_logo_text';

export type IntroLanguage = 'ro' | 'de' | 'en' | 'ru';

export interface IntroTextSettings {
  /** Sa apara textul sub logo? */
  enabled: boolean;
  /** Textul, pe limbi */
  text: Partial<Record<IntroLanguage, string>>;
}

export const DEFAULT_INTRO_TEXT: IntroTextSettings = {
  enabled: false,
  text: {},
};

let cached: IntroTextSettings | null = null;
let inFlight: Promise<IntroTextSettings> | null = null;

export async function fetchIntroText(): Promise<IntroTextSettings> {
  if (cached) return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('site_content')
        .select('value')
        .eq('key', INTRO_TEXT_KEY)
        .maybeSingle();

      if (error || !data?.value) {
        cached = DEFAULT_INTRO_TEXT;
        return cached;
      }

      cached = { ...DEFAULT_INTRO_TEXT, ...(data.value as Partial<IntroTextSettings>) };
      return cached;
    } catch {
      cached = DEFAULT_INTRO_TEXT;
      return cached;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export function clearIntroTextCache() {
  cached = null;
}

/**
 * Hook pentru WelcomeModal.
 *
 * IMPORTANT pentru viteza: NU blocheaza nimic. Logo-ul apare instant,
 * ca pana acum. Textul se adauga dupa ce raspunsul soseste — si oricum
 * el trebuie sa apara mai tarziu decat logo-ul.
 */
export function useIntroText(language: string) {
  const [settings, setSettings] = useState<IntroTextSettings>(DEFAULT_INTRO_TEXT);

  useEffect(() => {
    let cancelled = false;
    fetchIntroText().then((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const lang = (['ro', 'de', 'en', 'ru'].includes(language) ? language : 'de') as IntroLanguage;
  const value = (settings.text?.[lang] || '').trim();

  return {
    /** Textul de afisat, sau sirul gol daca nu e cazul */
    introText: settings.enabled && value ? value : '',
  };
}

export default useIntroText;
