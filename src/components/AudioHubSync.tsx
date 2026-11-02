'use client';

// Tine playerul audio la zi cu limba aplicatiei: titlul si categoria in limba curenta (si in notificarea telefonului),
// iar la schimbarea limbii blogul care ruleaza reincepe de la inceput in limba noua. Nu deseneaza nimic.

import { useEffect } from 'react';
import { hub, useAudioHub } from '@/lib/audioHub';
import { useUiSettings } from '@/lib/uiSettings';
import { useLanguage } from '@/hooks/useLanguage';
import { useTrackTitles, useCategories, categoryOf } from '@/hooks/useTrackTitles';
import { touchStreak } from '@/lib/streak';

export default function AudioHubSync() {
  const { language } = useLanguage();
  const ui = useUiSettings();
  const s = useAudioHub();
  const cats = useCategories();
  const track = s.track;
  const titleOf = useTrackTitles(track ? [track] : [], language);

  useEffect(() => {
    hub.setLanguage(language);
  }, [language]);

  useEffect(() => {
    if (ui.miniPlayer !== 'off') hub.restoreLast();
  }, [ui.miniPlayer]);

  useEffect(() => {
    if (ui.todayStreak) touchStreak();
  }, [ui.todayStreak]);

  const title = track ? titleOf(track) : '';
  const category = track ? categoryOf(cats, track, language) : '';
  useEffect(() => {
    if (!track) {
      if (s.display) hub.setDisplay(null);
      return;
    }
    if (!title) return;
    if (s.display?.title !== title || s.display?.category !== category) hub.setDisplay({ title, category });
  }, [track, title, category, s.display]);

  return null;
}
