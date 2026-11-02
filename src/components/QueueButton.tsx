'use client';

// „În lista de ascultare": apare doar daca functia e pornita din admin si blogul are audio pregenerat in limba curenta.

import React, { useEffect, useState } from 'react';
import { hub, useAudioHub, type HubTrack } from '@/lib/audioHub';
import { useUiSettings } from '@/lib/uiSettings';
import { useLanguage } from '@/hooks/useLanguage';

const LABEL = {
  de: { add: 'In die Hörliste', added: 'In der Hörliste ✓', now: 'Jetzt hören' },
  en: { add: 'Add to listening list', added: 'In the listening list ✓', now: 'Listen now' },
  ro: { add: 'În lista de ascultare', added: 'În lista de ascultare ✓', now: 'Ascultă acum' },
  ru: { add: 'В список прослушивания', added: 'В списке ✓', now: 'Слушать' },
} as const;

export default function QueueButton({ track }: { track: Omit<HubTrack, 'lang'> }) {
  const ui = useUiSettings();
  const { language } = useLanguage();
  const lang = (['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de') as keyof typeof LABEL;
  const s = useAudioHub();
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!ui.queue) return;
    let alive = true;
    void fetch(`/api/blog-audio?slug=${encodeURIComponent(track.audioSlug ?? track.slug)}&language=${lang}`)
      .then((r) => r.json())
      .then((d) => alive && setAvailable(Boolean(d?.audioUrl)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ui.queue, track.audioSlug, track.slug, lang]);

  if (!ui.queue || !available) return null;
  const full: HubTrack = { ...track, lang };
  const queued = s.queue.some((q) => q.slug === full.slug && q.lang === lang);
  const t = LABEL[lang];

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => (queued ? hub.removeFromQueue(s.queue.findIndex((q) => q.slug === full.slug && q.lang === lang)) : hub.enqueue(full))}
        className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium text-black/75 dark:border-white/20 dark:text-white/75"
        style={{ minHeight: 0 }}
      >
        {queued ? t.added : t.add}
      </button>
      {ui.miniPlayer !== 'off' && (
        <button
          type="button"
          onClick={() => void hub.playPrebuilt(full)}
          className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium text-black/75 dark:border-white/20 dark:text-white/75"
          style={{ minHeight: 0 }}
        >
          ▶ {t.now}
        </button>
      )}
    </div>
  );
}
