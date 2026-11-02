'use client';

// Titlul si categoria unei piese din playerul audio, MEREU in limba cititorului:
// titlul scris de admin in limba aceea, altfel tradus (DeepL, cu cache); pana vine traducerea intoarce gol.

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { fetchCategories, categoryName, type Category } from '@/lib/categories';
import type { HubTrack, HubLang } from '@/lib/audioHub';

function written(t: HubTrack, lang: string): string {
  if (lang === 'ro') return t.title;
  const mine = t.titles?.[lang as HubLang];
  return typeof mine === 'string' && mine.trim() && mine.trim() !== t.title.trim() ? mine.trim() : '';
}

export function useTrackTitles(tracks: HubTrack[], lang: string): (t: HubTrack) => string {
  const { translateBatch } = useTranslation();
  const [translated, setTranslated] = useState<Record<string, string>>({});
  const key = (t: HubTrack) => `${t.slug}:${lang}`;
  const signature = tracks.map((t) => t.slug).join('|');

  useEffect(() => {
    if (lang === 'ro') return;
    const missing = tracks.filter((t) => t.title && !written(t, lang) && translated[`${t.slug}:${lang}`] === undefined);
    if (missing.length === 0) return;
    let alive = true;
    translateBatch(missing.map((t) => t.title), lang, 'ro')
      .catch(() => [] as string[])
      .then((out) => {
        if (!alive) return;
        setTranslated((prev) => {
          const next = { ...prev };
          missing.forEach((t, i) => {
            next[`${t.slug}:${lang}`] = (out[i] || '').trim() || t.title;
          });
          return next;
        });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, lang, translateBatch, translated]);

  return useCallback((t: HubTrack) => (lang === 'ro' ? t.title : written(t, lang) || translated[key(t)] || ''), [lang, translated]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useCategories(): Category[] {
  const [cats, setCats] = useState<Category[]>([]);
  useEffect(() => {
    let alive = true;
    void fetchCategories().then((c) => alive && setCats(c));
    return () => {
      alive = false;
    };
  }, []);
  return cats;
}

/** Numele primei categorii a piesei, in limba data. */
export function categoryOf(cats: Category[], t: HubTrack | null, lang: string): string {
  if (!t?.categoryIds?.length) return '';
  const c = cats.find((x) => t.categoryIds!.includes(x.id));
  return c ? categoryName(c, lang) : '';
}
