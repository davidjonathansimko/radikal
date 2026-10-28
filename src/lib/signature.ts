'use client';

// Semnatura „RADIKAL." de jos (Reels, Play Blog). Setarile se aleg din admin si stau in `site_content`, cheia `signature`.

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export type SignatureStyle = 'text' | 'logo';
export interface SignatureSettings {
  reels: boolean;
  playBlog: boolean;
  style: SignatureStyle;
}

export const SIGNATURE_KEY = 'signature';
export const SIGNATURE_DEFAULTS: SignatureSettings = { reels: true, playBlog: true, style: 'text' };

let cache: Promise<SignatureSettings> | null = null;

export function fetchSignature(force = false): Promise<SignatureSettings> {
  if (cache && !force) return cache;
  cache = (async () => {
    try {
      const { data } = await getSupabaseClient().from('site_content').select('value').eq('key', SIGNATURE_KEY).maybeSingle();
      const v = (data?.value ?? {}) as Partial<SignatureSettings>;
      return {
        reels: typeof v.reels === 'boolean' ? v.reels : SIGNATURE_DEFAULTS.reels,
        playBlog: typeof v.playBlog === 'boolean' ? v.playBlog : SIGNATURE_DEFAULTS.playBlog,
        style: v.style === 'logo' ? 'logo' : 'text',
      };
    } catch {
      return SIGNATURE_DEFAULTS;
    }
  })();
  return cache;
}

export async function saveSignature(next: SignatureSettings): Promise<void> {
  const { error } = await getSupabaseClient().from('site_content').upsert({ key: SIGNATURE_KEY, value: next }, { onConflict: 'key' });
  if (error) throw error;
  cache = null;
}

export function useSignature(): SignatureSettings {
  const [s, setS] = useState(SIGNATURE_DEFAULTS);
  useEffect(() => {
    let alive = true;
    void fetchSignature().then((v) => alive && setS(v));
    return () => {
      alive = false;
    };
  }, []);
  return s;
}
