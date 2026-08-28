// =====================================================================
// Pasul 2508000 — EDITAREA TEXTULUI PAGINILOR, direct din admin
// ---------------------------------------------------------------------
// Ce rezolva:
//   Textul paginilor fixe (Despre, Contact, Impressum, Confidentialitate,
//   News) statea doar in cod. Ca sa schimbi o virgula trebuia programator.
//
// Cum functioneaza acum:
//   1. Textul din COD ramane sursa de adevar si se afiseaza INSTANT.
//      El este, in acelasi timp, copia de siguranta: nu se sterge niciodata.
//   2. Daca ai editat ceva din admin, versiunea ta se incarca in fundal si
//      inlocuieste doar campurile pe care le-ai schimbat. Restul ramane din cod.
//   3. Butonul „Inapoi la original" sterge modificarile tale si pagina revine
//      exact la textul din cod.
//
// STOCARE: acelasi tabel `site_content` (cheie/valoare), cheia `page_texts`.
// Nu este nevoie de SQL nou.
// =====================================================================

'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';

export const PAGE_TEXTS_KEY = 'page_texts';

export type PageLanguage = 'ro' | 'de' | 'en' | 'ru';
export const PAGE_LANGUAGES: PageLanguage[] = ['ro', 'de', 'en', 'ru'];

/** Ce pagini se pot edita. `id` este si cheia din baza de date. */
export const EDITABLE_PAGES = [
  { id: 'main', label: 'Pagina principală', path: '/' },
  { id: 'about', label: 'Despre (About)', path: '/about' },
  { id: 'contact', label: 'Contact', path: '/contact' },
  { id: 'marturii', label: 'Mărturii', path: '/marturii' },
  { id: 'impressum', label: 'Impressum', path: '/impressum' },
  { id: 'datenschutz', label: 'Confidențialitate (Datenschutz)', path: '/datenschutz' },
  { id: 'news', label: 'News', path: '/news' },
] as const;

export type PageId = (typeof EDITABLE_PAGES)[number]['id'];

/** Doar campurile de tip TEXT sunt editabile — listele si obiectele raman din cod. */
export type PageFields = Record<string, string>;
export type PageOverride = Partial<Record<PageLanguage, PageFields>>;
export type AllPageOverrides = Partial<Record<PageId, PageOverride>>;

// ---------------------------------------------------------------------
// Citire — o singura cerere pe sesiune, in fundal
// ---------------------------------------------------------------------
let cached: AllPageOverrides | null = null;
let inFlight: Promise<AllPageOverrides> | null = null;

export async function fetchPageOverrides(): Promise<AllPageOverrides> {
  if (cached) return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('site_content')
        .select('value')
        .eq('key', PAGE_TEXTS_KEY)
        .maybeSingle();

      cached = error || !data?.value ? {} : (data.value as AllPageOverrides);
      return cached;
    } catch {
      // Daca reteaua cade, ramane textul din cod. Pagina NU se strica niciodata.
      cached = {};
      return cached;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export function clearPageOverridesCache() {
  cached = null;
}

/** Salveaza (numai adminul are voie, dupa politicile din `site_content`). */
export async function savePageOverrides(next: AllPageOverrides): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('site_content')
    .upsert({ key: PAGE_TEXTS_KEY, value: next }, { onConflict: 'key' });
  if (error) throw error;
  clearPageOverridesCache();
}

/**
 * Textul paginii, gata de folosit.
 *
 * `defaults` este exact obiectul `translations` din pagina. Se afiseaza
 * imediat, fara nicio asteptare; suprascrierea vine dupa, daca exista.
 */
export function usePageText<T extends Record<string, unknown>>(
  pageId: PageId,
  defaults: Record<string, T>,
  language: string,
): T {
  const lang = (PAGE_LANGUAGES as string[]).includes(language)
    ? (language as PageLanguage)
    : 'de';

  const base = useMemo(
    () => (defaults[lang] ?? defaults.de ?? Object.values(defaults)[0]) as T,
    [defaults, lang],
  );

  const [override, setOverride] = useState<PageFields | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPageOverrides().then((all) => {
      if (!alive) return;
      setOverride(all[pageId]?.[lang] ?? null);
    });
    return () => {
      alive = false;
    };
  }, [pageId, lang]);

  return useMemo(() => {
    if (!override) return base;
    // Doar campurile scrise de admin sunt inlocuite; restul raman din cod.
    const merged: Record<string, unknown> = { ...base };
    Object.entries(override).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim() !== '') merged[key] = value;
    });
    return merged as T;
  }, [base, override]);
}

/** Campurile de tip text dintr-un obiect de traduceri (restul se ignora). */
export function textFieldsOf(source: Record<string, unknown>): PageFields {
  const out: PageFields = {};
  Object.entries(source).forEach(([key, value]) => {
    if (typeof value === 'string') out[key] = value;
  });
  return out;
}
