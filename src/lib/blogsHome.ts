'use client';

// Pagina Blogs: ce arata banda cu carduri. Setarea sta in `site_content`, cheia `blogs_home`.
//  1 = ultimele 6 bloguri (ca pana acum)
//  2 = „Bloguri recomandate", alese din admin
//  3 = doua randuri (recomandate + ultimele 6), cu categorie si descriere sub carduri
//  4 = doua randuri, cu textul obisnuit sub carduri

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export type BlogsHomeMode = 1 | 2 | 3 | 4;
export interface BlogsHomeConfig {
  mode: BlogsHomeMode;
  recommended: string[];
}

export const BLOGS_HOME_KEY = 'blogs_home';
export const BLOGS_HOME_DEFAULT: BlogsHomeConfig = { mode: 1, recommended: [] };

let cache: Promise<BlogsHomeConfig> | null = null;

export function fetchBlogsHome(force = false): Promise<BlogsHomeConfig> {
  if (cache && !force) return cache;
  cache = (async () => {
    try {
      const { data } = await getSupabaseClient().from('site_content').select('value').eq('key', BLOGS_HOME_KEY).maybeSingle();
      const v = (data?.value ?? {}) as Partial<BlogsHomeConfig>;
      const mode = ([1, 2, 3, 4] as number[]).includes(Number(v.mode)) ? (Number(v.mode) as BlogsHomeMode) : 1;
      const recommended = Array.isArray(v.recommended) ? v.recommended.filter((x): x is string => typeof x === 'string').slice(0, 12) : [];
      // Fara nicio recomandare, ramane lista cu ultimele 6 (nu apare un rand gol).
      return { mode: recommended.length === 0 ? 1 : mode, recommended };
    } catch {
      return BLOGS_HOME_DEFAULT;
    }
  })();
  return cache;
}

export async function saveBlogsHome(next: BlogsHomeConfig): Promise<void> {
  const { error } = await getSupabaseClient().from('site_content').upsert({ key: BLOGS_HOME_KEY, value: next }, { onConflict: 'key' });
  if (error) throw error;
  cache = null;
}

export function useBlogsHome(): BlogsHomeConfig | null {
  const [c, setC] = useState<BlogsHomeConfig | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchBlogsHome().then((v) => alive && setC(v));
    return () => {
      alive = false;
    };
  }, []);
  return c;
}
