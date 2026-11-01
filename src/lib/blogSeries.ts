'use client';

// Serii de bloguri („Păcate mici", „Drumul credinței"). Le face adminul; sunt salvate in `site_content`, cheia `blog_series`.
// Fiecare serie are un nume (romana; celelalte limbi se completeaza automat, dar pot fi corectate) si o lista ordonata de bloguri.

import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useTranslation } from '@/hooks/useTranslation';

export interface BlogSeries {
  id: string;
  /** Numele de baza (romana). */
  name: string;
  /** Nume in alte limbi; daca lipsesc, se traduc automat la afisare. */
  names?: Partial<Record<'de' | 'en' | 'ru', string>>;
  /** Id-urile blogurilor, in ordinea seriei. */
  ids: string[];
}

/** plain = „Serie: nume"; numbered = „Serie: nume · 2/5"; stamp = stampila mica. */
export type SeriesLabelStyle = 'plain' | 'numbered' | 'stamp';
export interface BlogSeriesConfig {
  series: BlogSeries[];
  style: SeriesLabelStyle;
}

export const BLOG_SERIES_KEY = 'blog_series';
const STYLES: SeriesLabelStyle[] = ['plain', 'numbered', 'stamp'];

let cache: Promise<BlogSeriesConfig> | null = null;

function ownName(s: BlogSeries, lang: string): string {
  if (lang === 'ro') return s.name;
  return (s.names as Record<string, string | undefined> | undefined)?.[lang]?.trim() ?? '';
}

export function fetchBlogSeriesConfig(force = false): Promise<BlogSeriesConfig> {
  if (cache && !force) return cache;
  cache = (async (): Promise<BlogSeriesConfig> => {
    try {
      const { data } = await getSupabaseClient().from('site_content').select('value').eq('key', BLOG_SERIES_KEY).maybeSingle();
      const v = (data?.value ?? {}) as { series?: unknown; style?: unknown };
      const style = STYLES.includes(v.style as SeriesLabelStyle) ? (v.style as SeriesLabelStyle) : 'numbered';
      if (!Array.isArray(v.series)) return { series: [], style };
      const series = v.series
        .map((x): BlogSeries | null => {
          const o = x as Partial<BlogSeries>;
          if (!o || typeof o.id !== 'string' || typeof o.name !== 'string' || !o.name.trim()) return null;
          return {
            id: o.id,
            name: o.name.trim(),
            names: o.names && typeof o.names === 'object' ? o.names : undefined,
            ids: Array.isArray(o.ids) ? o.ids.filter((i): i is string => typeof i === 'string') : [],
          };
        })
        .filter((x): x is BlogSeries => x !== null);
      return { series, style };
    } catch {
      return { series: [], style: 'numbered' };
    }
  })();
  return cache;
}

export async function saveBlogSeries(series: BlogSeries[], style: SeriesLabelStyle): Promise<void> {
  const { error } = await getSupabaseClient().from('site_content').upsert({ key: BLOG_SERIES_KEY, value: { series, style } }, { onConflict: 'key' });
  if (error) throw error;
  cache = null;
}

/** `null` cat timp se incarca; apoi seriile + stilul etichetei. */
export function useBlogSeriesConfig(): BlogSeriesConfig | null {
  const [c, setC] = useState<BlogSeriesConfig | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchBlogSeriesConfig().then((v) => alive && setC(v));
    return () => {
      alive = false;
    };
  }, []);
  return c;
}

export function useBlogSeries(): BlogSeries[] | null {
  return useBlogSeriesConfig()?.series ?? null;
}

/** Numele seriei in limba cititorului: cel scris de admin, altfel tradus automat; pana vine traducerea intoarce gol. */
export function useSeriesTitle(series: BlogSeries[] | null, lang: string): (s: BlogSeries) => string {
  const { translateBatch } = useTranslation();
  const [translated, setTranslated] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!series || lang === 'ro') return;
    const missing = series.filter((s) => !ownName(s, lang) && translated[`${s.id}:${lang}`] === undefined);
    if (missing.length === 0) return;
    let alive = true;
    translateBatch(missing.map((s) => s.name), lang, 'ro')
      .catch(() => [] as string[])
      .then((out) => {
        if (!alive) return;
        setTranslated((prev) => {
          const next = { ...prev };
          missing.forEach((s, i) => {
            next[`${s.id}:${lang}`] = (out[i] || '').trim() || s.name;
          });
          return next;
        });
      });
    return () => {
      alive = false;
    };
  }, [series, lang, translateBatch, translated]);

  return useCallback(
    (s: BlogSeries) => (lang === 'ro' ? s.name : ownName(s, lang) || translated[`${s.id}:${lang}`] || ''),
    [lang, translated],
  );
}
