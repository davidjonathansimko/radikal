// Pasul 261026 — textul versiunii din meniu, editabil din admin.
// STOCARE: tabelul `site_content`, cheia `app_version`, valoare { text: string }.
// Gol / lipsa => se arata textul automat (Version X · data build).

'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export const APP_VERSION_KEY = 'app_version';

export function defaultVersionText(language: string): string {
  const word = language === 'ro' ? 'Versiune' : language === 'ru' ? '\u0412\u0435\u0440\u0441\u0438\u044f' : 'Version';
  const v = process.env.NEXT_PUBLIC_APP_VERSION || '';
  const d = process.env.NEXT_PUBLIC_APP_BUILD_DATE || '';
  return `${word} ${v}${d ? ` \u00b7 ${d}` : ''}`.trim();
}

export async function fetchVersionOverride(): Promise<string> {
  try {
    const { data } = await getSupabaseClient()
      .from('site_content')
      .select('value')
      .eq('key', APP_VERSION_KEY)
      .maybeSingle();
    const t = (data?.value as { text?: string } | null)?.text;
    return typeof t === 'string' ? t : '';
  } catch {
    return '';
  }
}

export async function saveVersionOverride(text: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('site_content')
    .upsert({ key: APP_VERSION_KEY, value: { text } }, { onConflict: 'key' });
  if (error) throw error;
}

/** Textul de afisat: cel din admin, daca exista, altfel cel automat. */
export function useVersionText(language: string): string {
  const [override, setOverride] = useState('');
  useEffect(() => {
    let alive = true;
    fetchVersionOverride().then((t) => {
      if (alive) setOverride(t.trim());
    });
    return () => {
      alive = false;
    };
  }, []);
  return override || defaultVersionText(language);
}
