'use client';

// Prima pagina: versetul zilei in locul versetului fix (Apocalipsa 3:16), daca adminul a pornit optiunea
// si exista un verset publicat pentru azi. Altfel returneaza null si ramane versetul fix.

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useTranslation } from '@/hooks/useTranslation';

function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useHeroDailyVerse(enabled: boolean, language: string): { text: string; reference: string } | null {
  const lang = ['ro', 'de', 'en', 'ru'].includes(language) ? language : 'de';
  const { translateBatch } = useTranslation();
  const [verse, setVerse] = useState<{ text: string; reference: string } | null>(null);

  useEffect(() => {
    if (!enabled) {
      setVerse(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const { data } = await getSupabaseClient()
          .from('daily_verses')
          .select('*')
          .eq('for_day', isoToday())
          .eq('published', true)
          .maybeSingle();
        if (!alive || !data) {
          if (alive) setVerse(null);
          return;
        }
        const row = data as Record<string, unknown>;
        const str = (k: string) => (typeof row[k] === 'string' ? (row[k] as string).trim() : '');
        const mine = str(`content_${lang}`);
        const original = mine || str('content_ro');
        if (!original) {
          setVerse(null);
          return;
        }
        const refOriginal = str(`reference_${lang}`) || str('reference_ro');
        if (mine || lang === 'ro') {
          setVerse({ text: original, reference: refOriginal });
          return;
        }
        // Fara text scris pentru limba asta: traducere automata, ca pe pagina versetului.
        try {
          const out = await translateBatch([original, refOriginal].filter(Boolean), lang, 'ro');
          if (alive) setVerse({ text: out[0] || original, reference: refOriginal ? out[1] || refOriginal : '' });
        } catch {
          if (alive) setVerse({ text: original, reference: refOriginal });
        }
      } catch {
        if (alive) setVerse(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [enabled, lang, translateBatch]);

  return verse;
}
