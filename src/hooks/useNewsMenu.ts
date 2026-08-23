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

export interface NewsMenuState {
  /** Se arata rubrica in meniu? */
  visible: boolean;
  /** Cate stiri publicate exista (pentru semnul rosu) */
  count: number;
}

/** Titlul rubricii in cele 4 limbi */
export const NEWS_MENU_LABELS: Record<string, string> = {
  de: 'News',
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
      try {
        const { data, error } = await getSupabaseClient().rpc('news_menu_state');
        if (cancelled || error || !data) return;

        // Functia intoarce un singur rand.
        const row = Array.isArray(data) ? data[0] : data;
        const enabled = Boolean(row?.enabled);
        const count = Number(row?.item_count ?? 0);

        // Amandoua conditiile trebuie indeplinite.
        setState({ visible: enabled && count > 0, count });
      } catch {
        /* fara tabel sau fara internet — rubrica ramane ascunsa */
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}
