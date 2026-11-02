'use client';

// Butoanele „Ascultă acum" si „În lista de ascultare" din articol (playerul mic le foloseste pe amandoua).

import React from 'react';
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

  if (ui.miniPlayer === 'off' && !ui.queue) return null;
  const full: HubTrack = { ...track, lang };
  const queued = s.queue.some((q) => q.slug === full.slug);
  const t = LABEL[lang];
  const cls = 'rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium text-black/75 dark:border-white/20 dark:text-white/75';

  return (
    <div className="mt-2 flex flex-wrap gap-2" data-tour="listen-buttons">
      {ui.miniPlayer !== 'off' && (
        <button type="button" onClick={() => void hub.playBlog(full)} className={cls} style={{ minHeight: 0 }}>
          ▶ {t.now}
        </button>
      )}
      {ui.queue && (
        <button
          type="button"
          onClick={() => (queued ? hub.removeFromQueue(s.queue.findIndex((q) => q.slug === full.slug)) : hub.enqueue(full))}
          className={cls}
          style={{ minHeight: 0 }}
        >
          {queued ? t.added : t.add}
        </button>
      )}
    </div>
  );
}
