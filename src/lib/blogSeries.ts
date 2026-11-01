'use client';

// Serii de bloguri („Păcate mici", „Drumul credinței"). Le face adminul; sunt salvate in `site_content`, cheia `blog_series`.
// Fiecare serie are un nume (romana; pentru celelalte limbi se poate scrie separat) si o lista ordonata de bloguri.

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export interface BlogSeries {
  id: string;
  /** Numele de baza (romana). */
  name: string;
  /** Nume optionale in alte limbi; daca lipsesc, se arata numele de baza. */
  names?: Partial<Record<'de' | 'en' | 'ru', string>>;
  /** Id-urile blogurilor, in ordinea seriei. */
  ids: string[];
}

export const BLOG_SERIES_KEY = 'blog_series';

let cache: Promise<BlogSeries[]> | null = null;

export function seriesName(s: BlogSeries, lang: string): string {
  if (lang === 'ro') return s.name;
  const own = (s.names as Record<string, string | undefined> | undefined)?.[lang]?.trim();
  return own || s.name;
}

export function fetchBlogSeries(force = false): Promise<BlogSeries[]> {
  if (cache && !force) return cache;
  cache = (async () => {
    try {
      const { data } = await getSupabaseClient().from('site_content').select('value').eq('key', BLOG_SERIES_KEY).maybeSingle();
      const raw = (data?.value as { series?: unknown } | null)?.series;
      if (!Array.isArray(raw)) return [];
      return raw
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
    } catch {
      return [];
    }
  })();
  return cache;
}

export async function saveBlogSeries(series: BlogSeries[]): Promise<void> {
  const { error } = await getSupabaseClient().from('site_content').upsert({ key: BLOG_SERIES_KEY, value: { series } }, { onConflict: 'key' });
  if (error) throw error;
  cache = null;
}

/** `null` cat timp se incarca; apoi lista (posibil goala). */
export function useBlogSeries(): BlogSeries[] | null {
  const [s, setS] = useState<BlogSeries[] | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchBlogSeries().then((v) => alive && setS(v));
    return () => {
      alive = false;
    };
  }, []);
  return s;
}
