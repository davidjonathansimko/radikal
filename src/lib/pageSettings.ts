/**
 * Pasul 2708018 — pagini pornite sau oprite.
 *
 * O pagină oprită nu se vede de nimeni: nici în meniu, nici pe adresa ei.
 * „Tägliche Andacht" și „Pentru copii" încep oprite, ca să nu apară goale pe
 * site înainte să scrii ceva în ele.
 *
 * Dacă tabelul `page_settings` nu există încă, totul răspunde „oprit" — deci
 * nimic nu apare din greșeală.
 */

import { getSupabaseClient } from '@/lib/supabase';

export type TogglablePage = 'andacht' | 'copii';

/** Ce pagini sunt pornite acum. */
export async function fetchEnabledPages(): Promise<Set<string>> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('page_settings')
      .select('page_id, enabled');
    if (error || !data) return new Set();
    return new Set(
      (data as { page_id: string; enabled: boolean }[])
        .filter((r) => r.enabled)
        .map((r) => r.page_id),
    );
  } catch {
    return new Set();
  }
}

export async function isPageEnabled(pageId: TogglablePage): Promise<boolean> {
  const on = await fetchEnabledPages();
  return on.has(pageId);
}

export async function setPageEnabled(
  pageId: TogglablePage,
  enabled: boolean,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await getSupabaseClient()
      .from('page_settings')
      .upsert(
        { page_id: pageId, enabled, updated_at: new Date().toISOString() },
        { onConflict: 'page_id' },
      );
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'eroare' };
  }
}
