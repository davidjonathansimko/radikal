// Pasul 231026a — functii care se pot porni sau opri din admin (tabelul `page_settings`).
// Fara rand salvat = pornit, ca sa nu dispara nimic existent.

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export type FeatureKey = 'resume' | 'swipe' | 'shareSelection' | 'fontControls' | 'scrollReveal' | 'todayCard' | 'listenPill' | 'eveningMode' | 'remainingTime' | 'kidsParentMode' | 'protectText' | 'legacyBrowse' | 'homeButton';

const ROW_ID: Record<FeatureKey, string> = {
  resume: 'feat_resume',
  swipe: 'feat_swipe',
  shareSelection: 'feat_share_selection',
  fontControls: 'feat_font_controls',
  scrollReveal: 'feat_scroll_reveal',
  todayCard: 'feat_today_card',
  listenPill: 'feat_listen_pill',
  eveningMode: 'feat_evening_mode',
  remainingTime: 'feat_remaining_time',
  kidsParentMode: 'feat_kids_parent_mode',
  protectText: 'feat_protect_text',
  legacyBrowse: 'feat_legacy_browse',
  homeButton: 'feat_home_button',
};

export const FEATURE_DEFAULTS: Record<FeatureKey, boolean> = {
  resume: true,
  swipe: true,
  shareSelection: true,
  fontControls: true,
  scrollReveal: true,
  todayCard: true,
  listenPill: true,
  eveningMode: true,
  remainingTime: true,
  kidsParentMode: true,
  protectText: true,
  // Porneste OPRITA: pe telefon se vede doar banda noua de pastile.
  legacyBrowse: false,
  homeButton: false,
};

let cache: Promise<Record<FeatureKey, boolean>> | null = null;

export function fetchFeatureFlags(force = false): Promise<Record<FeatureKey, boolean>> {
  if (cache && !force) return cache;
  cache = (async () => {
    const flags = { ...FEATURE_DEFAULTS };
    try {
      const { data, error } = await getSupabaseClient()
        .from('page_settings')
        .select('page_id, enabled')
        .in('page_id', Object.values(ROW_ID));
      if (error || !data) return flags;
      for (const row of data as { page_id: string; enabled: boolean }[]) {
        const key = (Object.keys(ROW_ID) as FeatureKey[]).find((k) => ROW_ID[k] === row.page_id);
        if (key) flags[key] = Boolean(row.enabled);
      }
    } catch {
      /* ramane pornit */
    }
    return flags;
  })();
  return cache;
}

export async function setFeatureFlag(key: FeatureKey, enabled: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await getSupabaseClient()
      .from('page_settings')
      .upsert({ page_id: ROW_ID[key], enabled, updated_at: new Date().toISOString() }, { onConflict: 'page_id' });
    cache = null;
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'eroare' };
  }
}

export function useFeatureFlags(): Record<FeatureKey, boolean> {
  const [flags, setFlags] = useState(FEATURE_DEFAULTS);
  useEffect(() => {
    let alive = true;
    fetchFeatureFlags().then((f) => alive && setFlags(f));
    return () => {
      alive = false;
    };
  }, []);
  return flags;
}
