// Pasul 231026a — functii care se pot porni sau opri din admin (tabelul `page_settings`).
// Fara rand salvat = pornit, ca sa nu dispara nimic existent.

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export type FeatureKey = 'resume' | 'swipe' | 'shareSelection' | 'fontControls' | 'scrollReveal' | 'todayCard' | 'listenPill' | 'eveningMode' | 'remainingTime' | 'kidsParentMode' | 'protectText' | 'legacyBrowse' | 'homeButton' | 'archiveStacked' | 'heroDailyVerse' | 'homeVerseSection' | 'bottomBarAutoHide' | 'homeThankyouSection';

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
  archiveStacked: 'feat_archive_stacked',
  heroDailyVerse: 'feat_hero_daily_verse',
  homeVerseSection: 'feat_home_verse_section',
  bottomBarAutoHide: 'feat_bottom_bar_autohide',
  homeThankyouSection: 'feat_home_thankyou_section',
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
  archiveStacked: true,
  // Oprit = ramane Apocalipsa 3:16, ca pana acum.
  heroDailyVerse: false,
  // Pornit = sectiunea „Vers des Tages” ramane pe pagina principala (pagina /verset exista oricum).
  homeVerseSection: true,
  // Oprit = bara de jos ramane mereu vizibila.
  bottomBarAutoHide: false,
  homeThankyouSection: true,
};

let cache: Promise<Record<FeatureKey, boolean>> | null = null;
let lastForceAt = 0;

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
    if (!error && typeof window !== 'undefined') window.dispatchEvent(new Event('radikal-flags'));
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'eroare' };
  }
}

export function useFeatureFlags(): Record<FeatureKey, boolean> {
  const [flags, setFlags] = useState(FEATURE_DEFAULTS);
  useEffect(() => {
    let alive = true;
    const load = (force: boolean) => {
      // Setarile din admin se vad si fara sa redeschizi aplicatia: la revenirea in aplicatie si dupa o schimbare.
      if (force) {
        if (Date.now() - lastForceAt < 4000) {
          void fetchFeatureFlags().then((f) => alive && setFlags(f));
          return;
        }
        lastForceAt = Date.now();
      }
      void fetchFeatureFlags(force).then((f) => alive && setFlags(f));
    };
    load(false);
    const onVisible = () => document.visibilityState === 'visible' && load(true);
    const onChange = () => load(true);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('radikal-flags', onChange);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('radikal-flags', onChange);
    };
  }, []);
  return flags;
}
