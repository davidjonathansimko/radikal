'use client';

/**
 * Pasul 2308006-F — starea rubricii NEWS din meniu.
 *
 * Regula, exact cum ai cerut-o:
 *   • ai comutatorul STINS               → rubrica nu apare deloc, nicaieri
 *   • ai comutatorul PORNIT, dar toate
 *     stirile sunt ciorne                → rubrica tot nu apare
 *   • ai comutatorul PORNIT si macar o
 *     stire publicata                    → rubrica apare, cu semnul rosu (!)
 *
 * Daca `STEP_2308006_NEWS_MENU.sql` nu a fost inca rulat, raspunsul este
 * „nu arata" — deci nu apare nimic si nimic nu se strica.
 */

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { fetchEnabledPages } from '@/lib/pageSettings';

export interface NewsMenuState {
  /** Se arata rubrica in meniu? */
  visible: boolean;
  /** Cate stiri publicate exista (pentru semnul rosu) */
  count: number;
}

/** Titlul rubricii in cele 4 limbi */
export const NEWS_MENU_LABELS: Record<string, string> = {
  de: 'Neuigkeiten',
  en: 'News',
  ro: 'Noutăți',
  ru: 'Новости',
};

export function newsMenuLabel(lang: string): string {
  return NEWS_MENU_LABELS[lang] ?? NEWS_MENU_LABELS.de;
}

export function useNewsMenu(): NewsMenuState {
  const [state, setState] = useState<NewsMenuState>({ visible: false, count: 0 });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Pasul 0809004 — butonul din Setări → Pagini hotărăște singur dacă
      // rubrica apare. Înainte mai era nevoie și de un al doilea comutator,
      // ascuns în baza de date, iar rubrica nu apărea deși scria că e pornită.
      let allowed = false;
      try {
        const pages = await fetchEnabledPages();
        allowed = pages.has('news');
      } catch {
        /* fara tabelul de setari, rubrica ramane ascunsa */
      }

      let count = 0;
      try {
        const { data, error } = await getSupabaseClient().rpc('news_menu_state');
        if (!error && data) {
          const row = Array.isArray(data) ? data[0] : data;
          count = Number(row?.item_count ?? 0);
        }
      } catch {
        /* fara functia din baza de date, numaram zero stiri */
      }

      if (cancelled) return;
      setState({ visible: allowed, count });
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}
