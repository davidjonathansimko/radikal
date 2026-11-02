'use client';

// Playerul mic: apare cat timp se asculta ceva (si ramane cand schimbi pagina). Stilul si functiile se aleg din admin.

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { hub, useAudioHub } from '@/lib/audioHub';
import { useUiSettings } from '@/lib/uiSettings';
import { useLanguage } from '@/hooks/useLanguage';

const T = {
  de: { queue: 'Hörliste', sleep: 'Einschlafen', off: 'Aus', end: 'Bis zum Ende', offline: 'Offline speichern', offlineOn: 'Offline gespeichert', open: 'Artikel öffnen', stop: 'Beenden', empty: 'Die Liste ist leer.', min: 'Min.', next: 'Nächster' },
  en: { queue: 'Listening list', sleep: 'Sleep timer', off: 'Off', end: 'Until the end', offline: 'Save offline', offlineOn: 'Saved offline', open: 'Open article', stop: 'Stop', empty: 'The list is empty.', min: 'min', next: 'Next' },
  ro: { queue: 'Lista de ascultare', sleep: 'Temporizator de somn', off: 'Oprit', end: 'Până la sfârșit', offline: 'Salvează pe telefon', offlineOn: 'Salvat pe telefon', open: 'Deschide articolul', stop: 'Oprește', empty: 'Lista este goală.', min: 'min', next: 'Următorul' },
  ru: { queue: 'Список прослушивания', sleep: 'Таймер сна', off: 'Выкл.', end: 'До конца', offline: 'Сохранить офлайн', offlineOn: 'Сохранено офлайн', open: 'Открыть статью', stop: 'Остановить', empty: 'Список пуст.', min: 'мин', next: 'Далее' },
} as const;

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

function PlayIcon({ playing, size = 18 }: { playing: boolean; size?: number }) {
  return playing ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function Cover({ src, size, round = false }: { src?: string | null; size: number; round?: boolean }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden bg-black/20 ${round ? 'rounded-full' : 'rounded-md'}`} style={{ width: size, height: size }}>
      {src ? <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" /> : <span className="flex h-full w-full items-center justify-center font-cinzel text-xs font-bold text-white/80">R.</span>}
    </span>
  );
}

function Sheet({ onClose }: { onClose: () => void }) {
  const s = useAudioHub();
  const ui = useUiSettings();
  const { language } = useLanguage();
  const t = T[(['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de') as keyof typeof T];
  const [offline, setOffline] = useState<'idle' | 'busy' | 'saved'>('idle');
  const track = s.track;

  useEffect(() => {
    if (!track || !ui.offlineAudio) return;
    let alive = true;
    void fetch(`/api/blog-audio?slug=${encodeURIComponent(track.audioSlug ?? track.slug)}&language=${track.lang}`)
      .then((r) => r.json())
      .then((d) => (d?.audioUrl ? hub.isOffline(d.audioUrl) : false))
      .then((v) => alive && setOffline(v ? 'saved' : 'idle'))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [track, ui.offlineAudio]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!track) return null;
  const btn = 'flex h-11 min-w-11 items-center justify-center rounded-full border border-black/15 px-3 text-sm font-semibold text-black dark:border-white/20 dark:text-white';

  return createPortal(
    <div className="fixed inset-0 z-[9992] flex items-end justify-center p-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] sm:items-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm" />
      <div className="relative max-h-[82vh] w-full max-w-md overflow-y-auto rounded-3xl border border-black/10 bg-white p-4 text-black shadow-2xl dark:border-white/15 dark:bg-neutral-950 dark:text-white">
        <div className="flex items-center gap-3">
          <Cover src={track.imageUrl} size={64} />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-cinzel text-base font-bold leading-snug">{track.title}</p>
            <Link href={track.href} onClick={onClose} className="text-xs text-black/55 underline dark:text-white/55">{t.open}</Link>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="h-11 w-11 rounded-full text-lg text-black/55 dark:text-white/55">✕</button>
        </div>

        <div className="mt-4">
          <input
            type="range"
            min={0}
            max={Math.max(1, Math.floor(s.duration))}
            value={Math.floor(s.position)}
            onChange={(e) => hub.seek(Number(e.target.value))}
            className="w-full accent-black dark:accent-white"
            aria-label="Seek"
          />
          <div className="flex justify-between text-[11px] tabular-nums text-black/55 dark:text-white/55">
            <span>{fmt(s.position)}</span>
            <span>{fmt(s.duration)}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-3">
          <button type="button" className={btn} onClick={() => hub.seekBy(-15)} aria-label="-15">−15</button>
          <button type="button" className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black" onClick={() => hub.toggle()} aria-label="Play/Pause">
            <PlayIcon playing={s.playing} size={24} />
          </button>
          <button type="button" className={btn} onClick={() => hub.seekBy(30)} aria-label="+30">+30</button>
          {ui.queue && s.queue.length > 0 && (
            <button type="button" className={btn} onClick={() => void hub.playNext()}>{t.next}</button>
          )}
        </div>

        {ui.sleepTimer && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-black/55 dark:text-white/55">{t.sleep}</p>
            <div className="flex flex-wrap gap-2">
              {[null, 15, 30, 45, 60, 'end' as const].map((m) => {
                const active = m === null ? s.sleep === null : m === 'end' ? s.sleep === 'end' : typeof s.sleep === 'number' && Math.abs(s.sleep - Date.now() - m * 60000) < 5 * 60000 && s.sleep > Date.now();
                return (
                  <button
                    key={String(m)}
                    type="button"
                    onClick={() => hub.setSleep(m)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${active ? 'border-transparent bg-black text-white dark:bg-white dark:text-black' : 'border-black/15 dark:border-white/20'}`}
                  >
                    {m === null ? t.off : m === 'end' ? t.end : `${m} ${t.min}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {ui.offlineAudio && (
          <button
            type="button"
            disabled={offline === 'busy'}
            onClick={async () => {
              if (offline === 'saved') {
                await hub.removeOffline(track.audioSlug ?? track.slug, track.lang);
                setOffline('idle');
                return;
              }
              setOffline('busy');
              setOffline((await hub.saveOffline(track.audioSlug ?? track.slug, track.lang)) ? 'saved' : 'idle');
            }}
            className="mt-5 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm dark:border-white/20"
          >
            {offline === 'saved' ? `✓ ${t.offlineOn}` : offline === 'busy' ? '…' : t.offline}
          </button>
        )}

        {ui.queue && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-black/55 dark:text-white/55">{t.queue}</p>
            {s.queue.length === 0 ? (
              <p className="text-xs text-black/50 dark:text-white/50">{t.empty}</p>
            ) : (
              <ol className="space-y-1">
                {s.queue.map((q, i) => (
                  <li key={`${q.slug}-${q.lang}`} className="flex items-center gap-2 rounded-lg border border-black/10 px-2 py-1.5 dark:border-white/15">
                    <span className="w-5 text-center text-xs text-black/50 dark:text-white/50">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{q.title}</span>
                    <button type="button" onClick={() => hub.removeFromQueue(i)} className="h-8 w-8 text-black/50 dark:text-white/50" aria-label="Remove">✕</button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        <button type="button" onClick={() => { hub.stop(); onClose(); }} className="mt-5 w-full rounded-xl border border-red-500/40 px-3 py-2.5 text-sm text-red-600 dark:text-red-400">
          {t.stop}
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default function MiniPlayer() {
  const s = useAudioHub();
  const ui = useUiSettings();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || ui.miniPlayer === 'off' || !s.track) return null;
  const track = s.track;
  const style = ui.miniPlayer;
  const pct = s.duration > 0 ? Math.min(100, (s.position / s.duration) * 100) : 0;
  void pathname;

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    hub.toggle();
  };
  const playBtn = (size = 34, extra = '') => (
    <button
      type="button"
      onClick={toggle}
      aria-label="Play/Pause"
      style={{ width: size, height: size, minHeight: 0, minWidth: 0 }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black ${extra}`}
    >
      <PlayIcon playing={s.playing} size={Math.round(size * 0.5)} />
    </button>
  );
  const titleBtn = (cls = '') => (
    <button type="button" onClick={() => setOpen(true)} className={`min-w-0 flex-1 text-left ${cls}`} style={{ minHeight: 0, minWidth: 0 }}>
      <span className="block truncate font-cinzel text-[13px] font-semibold text-black dark:text-white">{track.title}</span>
      <span className="block truncate text-[10px] text-black/55 dark:text-white/55">RADIKAL.{s.queue.length > 0 && ui.queue ? ` · +${s.queue.length}` : ''}</span>
    </button>
  );
  const bar = (h: string) => (
    <span className={`absolute left-0 top-0 block w-full ${h} bg-black/10 dark:bg-white/15`} aria-hidden="true">
      <span className="block h-full bg-black dark:bg-white" style={{ width: `${pct}%` }} />
    </span>
  );

  let body: React.ReactNode;
  let wrap = '';
  switch (style) {
    case 'bar':
      wrap = 'left-0 right-0 border-t border-black/10 bg-white/95 backdrop-blur dark:border-white/15 dark:bg-black/90';
      body = (
        <div className="relative flex items-center gap-3 px-3 py-1.5">
          {bar('h-[2px]')}
          <Cover src={track.imageUrl} size={38} />
          {titleBtn()}
          {playBtn(36)}
        </div>
      );
      break;
    case 'pill':
      wrap = 'left-1/2 w-[min(92vw,380px)] -translate-x-1/2 rounded-full border border-black/10 bg-white/90 shadow-lg backdrop-blur-xl dark:border-white/15 dark:bg-black/80';
      body = (
        <div className="relative flex items-center gap-2.5 overflow-hidden rounded-full p-1.5 pr-2.5">
          <Cover src={track.imageUrl} size={38} round />
          {titleBtn()}
          {playBtn(34)}
        </div>
      );
      break;
    case 'glass':
      wrap = 'left-1/2 w-[min(92vw,380px)] -translate-x-1/2 rounded-full border border-white/20 bg-white/35 shadow-lg backdrop-blur-2xl dark:border-white/10 dark:bg-black/35';
      body = (
        <div className="relative flex items-center gap-2.5 overflow-hidden rounded-full p-1.5 pr-2.5">
          <Cover src={track.imageUrl} size={38} round />
          {titleBtn()}
          {playBtn(34)}
        </div>
      );
      break;
    case 'card':
      wrap = 'left-3 right-3 mx-auto max-w-md rounded-2xl border border-black/10 bg-white/95 p-2.5 shadow-xl backdrop-blur dark:border-white/15 dark:bg-neutral-950/95';
      body = (
        <div>
          <div className="flex items-center gap-3">
            <Cover src={track.imageUrl} size={56} />
            <button type="button" onClick={() => setOpen(true)} className="min-w-0 flex-1 text-left" style={{ minHeight: 0, minWidth: 0 }}>
              <span className="line-clamp-2 font-cinzel text-[13px] font-semibold leading-snug text-black dark:text-white">{track.title}</span>
              <span className="block text-[10px] tabular-nums text-black/55 dark:text-white/55">{fmt(s.position)} / {fmt(s.duration)}</span>
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); hub.seekBy(-15); }} aria-label="-15" className="text-[11px] font-semibold text-black/70 dark:text-white/70" style={{ minHeight: 0, minWidth: 0 }}>−15</button>
            {playBtn(40)}
            <button type="button" onClick={(e) => { e.stopPropagation(); hub.seekBy(30); }} aria-label="+30" className="text-[11px] font-semibold text-black/70 dark:text-white/70" style={{ minHeight: 0, minWidth: 0 }}>+30</button>
          </div>
          <span className="relative mt-2 block h-[3px] w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15" aria-hidden="true">
            <span className="block h-full bg-black dark:bg-white" style={{ width: `${pct}%` }} />
          </span>
        </div>
      );
      break;
    case 'minimal':
      wrap = 'left-1/2 w-[min(92vw,380px)] -translate-x-1/2';
      body = (
        <div className="flex items-center gap-2 px-2 py-1" style={{ filter: 'drop-shadow(0 1px 4px rgba(128,128,128,0.5))' }}>
          {titleBtn()}
          {playBtn(30)}
        </div>
      );
      break;
    default: // line
      wrap = 'left-0 right-0';
      body = (
        <div className="relative">
          <div className="flex justify-end px-3 pb-1">{playBtn(32, 'shadow-md')}</div>
          <span className="relative block h-[3px] w-full bg-black/10 dark:bg-white/15" aria-hidden="true">
            <span className="block h-full bg-black dark:bg-white" style={{ width: `${pct}%` }} />
          </span>
        </div>
      );
  }

  return (
    <>
      <div className={`mini-player fixed z-[205] ${wrap}`} data-style={style} style={{ bottom: 'var(--bar-space, 12px)' }}>
        {body}
      </div>
      {open && <Sheet onClose={() => setOpen(false)} />}
    </>
  );
}
