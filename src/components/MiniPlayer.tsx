'use client';

// Playerul mic: apare cat timp se asculta ceva (si ramane cand schimbi pagina). Stilul si functiile se aleg din admin.

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { hub, useAudioHub } from '@/lib/audioHub';
import { useUiSettings } from '@/lib/uiSettings';
import { useLanguage } from '@/hooks/useLanguage';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useTrackTitles, useCategories, categoryOf } from '@/hooks/useTrackTitles';
import { Cover, PlayIcon, fmt } from '@/components/MiniPlayerParts';
import ModernSheet from '@/components/MiniPlayerSheet';

const T = {
  de: { queue: 'Hörliste', sleep: 'Einschlafen', off: 'Aus', end: 'Bis zum Ende', offline: 'Offline speichern', offlineOn: 'Offline gespeichert', open: 'Artikel öffnen', stop: 'Beenden', empty: 'Die Liste ist leer.', min: 'Min.', next: 'Nächster', category: 'Kategorie', close: 'Schließen', unavailable: 'kein Audio' },
  en: { queue: 'Listening list', sleep: 'Sleep timer', off: 'Off', end: 'Until the end', offline: 'Save offline', offlineOn: 'Saved offline', open: 'Open article', stop: 'Stop', empty: 'The list is empty.', min: 'min', next: 'Next', category: 'Category', close: 'Close', unavailable: 'no audio' },
  ro: { queue: 'Lista de ascultare', sleep: 'Temporizator de somn', off: 'Oprit', end: 'Până la sfârșit', offline: 'Salvează pe telefon', offlineOn: 'Salvat pe telefon', open: 'Deschide articolul', stop: 'Oprește', empty: 'Lista este goală.', min: 'min', next: 'Următorul', category: 'Categorie', close: 'Închide', unavailable: 'fără audio' },
  ru: { queue: 'Список прослушивания', sleep: 'Таймер сна', off: 'Выкл.', end: 'До конца', offline: 'Сохранить офлайн', offlineOn: 'Сохранено офлайн', open: 'Открыть статью', stop: 'Остановить', empty: 'Список пуст.', min: 'мин', next: 'Далее', category: 'Категория', close: 'Закрыть', unavailable: 'нет аудио' },
} as const;

function Sheet({ onClose }: { onClose: () => void }) {
  const s = useAudioHub();
  const ui = useUiSettings();
  const { language } = useLanguage();
  const lang = (['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de') as keyof typeof T;
  const t = T[lang];
  const [offline, setOffline] = useState<'idle' | 'busy' | 'saved'>('idle');
  const track = s.track;
  const cats = useCategories();
  const titleOf = useTrackTitles(track ? [track, ...s.queue] : s.queue, lang);
  useBodyScrollLock(true);

  useEffect(() => {
    if (!track || !ui.offlineAudio) return;
    let alive = true;
    void fetch(`/api/blog-audio?slug=${encodeURIComponent(track.audioSlug ?? track.slug)}&language=${lang}`)
      .then((r) => r.json())
      .then((d) => (d?.audioUrl ? hub.isOffline(d.audioUrl) : false))
      .then((v) => alive && setOffline(v ? 'saved' : 'idle'))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [track, ui.offlineAudio, lang]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!track) return null;
  const btn = 'flex h-11 min-w-11 items-center justify-center rounded-full border border-black/15 px-3 text-sm font-semibold text-black dark:border-white/20 dark:text-white';
  const cat = categoryOf(cats, track, lang);

  return createPortal(
    <div className="fixed inset-0 z-[9992] flex items-end justify-center p-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] sm:items-center" role="dialog" aria-modal="true">
      <button type="button" aria-label={t.close} onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm" />
      <div className="scrollbar-hide relative max-h-[82vh] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-black/10 bg-white p-4 text-black shadow-2xl dark:border-white/15 dark:bg-neutral-950 dark:text-white" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center gap-3">
          <Cover src={track.imageUrl} size={64} />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-cinzel text-base font-bold leading-snug">{titleOf(track) || '\u00a0'}</p>
            <p className="truncate text-[11px] text-black/55 dark:text-white/55">
              RADIKAL.{cat ? ` · ${t.category}: ${cat}` : ''}
            </p>
            <Link href={track.href} onClick={onClose} className="text-xs text-black/55 underline dark:text-white/55">{t.open}</Link>
          </div>
          <button type="button" onClick={onClose} aria-label={t.close} className="h-11 w-11 rounded-full text-lg text-black/55 dark:text-white/55">✕</button>
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
            disabled={s.loading || s.restored}
          />
          <div className="flex justify-between text-[11px] tabular-nums text-black/55 dark:text-white/55">
            <span>{fmt(s.position)}</span>
            <span>{s.loading ? `${s.buildPct}%` : fmt(s.duration)}</span>
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
                await hub.removeOffline(track.audioSlug ?? track.slug, lang);
                setOffline('idle');
                return;
              }
              setOffline('busy');
              setOffline((await hub.saveOffline(track.audioSlug ?? track.slug, lang)) ? 'saved' : 'idle');
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
                  <li key={q.slug} className="flex items-center gap-1 rounded-lg border border-black/10 dark:border-white/15">
                    <button type="button" onClick={() => { void hub.playQueueIndex(i); onClose(); }} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left" style={{ minHeight: 0 }}>
                      <span className="w-5 text-center text-xs text-black/50 dark:text-white/50">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm">{titleOf(q) || '\u00a0'}</span>
                    </button>
                    <button type="button" onClick={() => hub.removeFromQueue(i)} className="h-9 w-9 text-black/50 dark:text-white/50" aria-label="Remove">✕</button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        <button type="button" onClick={() => { hub.stop(); onClose(); }} className="mt-5 w-full rounded-xl border border-black/25 px-3 py-2.5 text-sm font-semibold text-black dark:border-white/30 dark:text-white">
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
  const { language } = useLanguage();
  const lang = (['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de') as keyof typeof T;
  const t = T[lang];
  const cats = useCategories();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const titleOf = useTrackTitles(s.track ? [s.track] : [], lang);
  const wrapRef = useRef<HTMLDivElement>(null);
  const visible = mounted && ui.miniPlayer !== 'off' && Boolean(s.track);

  // Sageata „inapoi sus” si alte elemente fixe se ridica deasupra playerului (variabila --mini-raw).
  useEffect(() => {
    const root = document.documentElement;
    const el = wrapRef.current;
    if (!visible || !el) {
      root.style.removeProperty('--mini-raw');
      return;
    }
    const measure = () => root.style.setProperty('--mini-raw', el.offsetHeight > 0 ? `${el.offsetHeight + 8}px` : '0px');
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      root.style.removeProperty('--mini-raw');
    };
  }, [visible, ui.miniPlayer]);

  if (!mounted || ui.miniPlayer === 'off' || !s.track) return null;
  const track = s.track;
  const style = ui.miniPlayer;
  const pct = s.duration > 0 ? Math.min(100, (s.position / s.duration) * 100) : 0;
  const title = titleOf(track) || '\u00a0';
  const cat = categoryOf(cats, track, lang);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    hub.toggle();
  };
  // „Insăla” e mereu închisă la culoare, deci textul ei e alb pe orice temă.
  const dk = style === 'island';
  const inkCls = dk ? 'text-white' : 'text-black dark:text-white';
  const softCls = dk ? 'text-white/60' : 'text-black/55 dark:text-white/55';
  const closeBtn = (size = 30) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        hub.stop();
      }}
      aria-label={t.close}
      style={{ width: size, height: size, minHeight: 0, minWidth: 0 }}
      className={`flex shrink-0 items-center justify-center rounded-full text-[15px] ${dk ? 'text-white/60 hover:bg-white/10' : 'text-black/55 hover:bg-black/10 dark:text-white/55 dark:hover:bg-white/10'}`}
    >
      ✕
    </button>
  );
  const playBtn = (size = 34, extra = '') => (
    <button
      type="button"
      onClick={toggle}
      aria-label="Play/Pause"
      style={{ width: size, height: size, minHeight: 0, minWidth: 0 }}
      className={`flex shrink-0 items-center justify-center rounded-full ${dk ? 'bg-white text-black' : 'bg-black text-white dark:bg-white dark:text-black'} ${extra}`}
    >
      {s.loading ? (
        <span className="block animate-spin rounded-full border-2 border-current border-t-transparent" style={{ width: Math.round(size * 0.45), height: Math.round(size * 0.45) }} />
      ) : (
        <PlayIcon playing={s.playing} size={Math.round(size * 0.5)} />
      )}
    </button>
  );
  const sub = (
    <span className={`block truncate text-[10px] ${softCls}`}>
      RADIKAL.{cat ? ` · ${t.category}: ${cat}` : ''}
      {s.loading ? ` · ${s.buildPct}%` : ''}
      {s.error ? ` · ${t.unavailable}` : ''}
      {s.queue.length > 0 && ui.queue ? ` · +${s.queue.length}` : ''}
    </span>
  );
  const titleBtn = (cls = '') => (
    <button type="button" onClick={() => setOpen(true)} className={`min-w-0 flex-1 text-left ${cls}`} style={{ minHeight: 0, minWidth: 0 }}>
      <span className={`block truncate font-cinzel text-[13px] font-semibold ${inkCls}`}>{title}</span>
      {sub}
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
          {closeBtn(30)}
        </div>
      );
      break;
    case 'pill':
      wrap = 'left-1/2 w-[min(92vw,380px)] -translate-x-1/2 rounded-full border border-black/10 bg-white/90 shadow-lg backdrop-blur-xl dark:border-white/15 dark:bg-black/80';
      body = (
        <div className="relative flex items-center gap-2 overflow-hidden rounded-full p-1.5 pr-1.5">
          <Cover src={track.imageUrl} size={38} round />
          {titleBtn()}
          {playBtn(34)}
          {closeBtn(28)}
        </div>
      );
      break;
    case 'glass':
      wrap = 'left-1/2 w-[min(92vw,380px)] -translate-x-1/2 rounded-full border border-white/20 bg-white/35 shadow-lg backdrop-blur-2xl dark:border-white/10 dark:bg-black/35';
      body = (
        <div className="relative flex items-center gap-2 overflow-hidden rounded-full p-1.5 pr-1.5">
          <Cover src={track.imageUrl} size={38} round />
          {titleBtn()}
          {playBtn(34)}
          {closeBtn(28)}
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
              <span className="line-clamp-2 font-cinzel text-[13px] font-semibold leading-snug text-black dark:text-white">{title}</span>
              {sub}
              <span className="block text-[10px] tabular-nums text-black/55 dark:text-white/55">{fmt(s.position)} / {fmt(s.duration)}</span>
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); hub.seekBy(-15); }} aria-label="-15" className="text-[11px] font-semibold text-black/70 dark:text-white/70" style={{ minHeight: 0, minWidth: 0 }}>−15</button>
            {playBtn(40)}
            <button type="button" onClick={(e) => { e.stopPropagation(); hub.seekBy(30); }} aria-label="+30" className="text-[11px] font-semibold text-black/70 dark:text-white/70" style={{ minHeight: 0, minWidth: 0 }}>+30</button>
            {closeBtn(28)}
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
          {closeBtn(26)}
        </div>
      );
      break;
    case 'island':
      wrap = 'force-white-text left-1/2 w-[min(92vw,360px)] -translate-x-1/2 rounded-full border border-white/15 bg-black shadow-2xl';
      body = (
        <div className="relative flex items-center gap-2 overflow-hidden rounded-full p-1.5">
          <Cover src={track.imageUrl} size={38} round />
          {titleBtn()}
          {playBtn(34)}
          {closeBtn(28)}
        </div>
      );
      break;
    case 'equalizer':
      wrap = 'left-1/2 w-[min(92vw,380px)] -translate-x-1/2 rounded-full border border-black/10 bg-white/90 shadow-lg backdrop-blur-xl dark:border-white/15 dark:bg-black/80';
      body = (
        <div className="relative flex items-center gap-2 overflow-hidden rounded-full p-1.5">
          <span className={`mini-eq mx-2.5 shrink-0 text-black dark:text-white ${s.playing ? '' : 'paused'}`} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          {titleBtn()}
          {playBtn(34)}
          {closeBtn(28)}
        </div>
      );
      break;
    case 'outline':
      wrap = 'left-1/2 w-[min(92vw,380px)] -translate-x-1/2 rounded-full border-[1.5px] border-black bg-white/55 backdrop-blur-md dark:border-white dark:bg-black/40';
      body = (
        <div className="relative flex items-center gap-2 overflow-hidden rounded-full p-1.5">
          <Cover src={track.imageUrl} size={36} round />
          {titleBtn()}
          {playBtn(32)}
          {closeBtn(28)}
        </div>
      );
      break;
    case 'tab':
      wrap = 'right-3 rounded-full border border-black/10 bg-white/90 shadow-lg backdrop-blur-xl dark:border-white/15 dark:bg-black/80';
      body = (
        <div className="flex items-center gap-1.5 p-1.5">
          <button type="button" onClick={() => setOpen(true)} aria-label={title} style={{ minHeight: 0, minWidth: 0 }} className="shrink-0">
            <Cover src={track.imageUrl} size={40} round />
          </button>
          {playBtn(34)}
          {closeBtn(26)}
        </div>
      );
      break;
    case 'ticket':
    case 'ticketglass':
      wrap =
        style === 'ticketglass'
          ? 'left-3 right-3 mx-auto max-w-md overflow-hidden rounded-xl border border-black/10 bg-white/60 shadow-lg backdrop-blur-2xl backdrop-saturate-150 dark:border-white/15 dark:bg-black/45'
          : 'left-3 right-3 mx-auto max-w-md overflow-hidden rounded-xl border border-black/15 bg-white/95 shadow-lg dark:border-white/20 dark:bg-neutral-950/95';
      body = (
        <div className="relative flex items-stretch">
          <div className="flex items-center border-r border-dashed border-black/25 px-2.5 py-2 dark:border-white/25">
            <Cover src={track.imageUrl} size={44} radius={8} />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2">
            {titleBtn()}
            {playBtn(34)}
            {closeBtn(26)}
          </div>
          <span className="absolute bottom-0 left-0 block h-[2px] bg-black dark:bg-white" style={{ width: `${pct}%` }} aria-hidden="true" />
        </div>
      );
      break;
    case 'disc':
      wrap = 'right-3 h-[68px] w-[68px]';
      body = (
        <div className="relative h-full w-full">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={title}
            style={{ minHeight: 0, minWidth: 0 }}
            className={`block h-full w-full overflow-hidden rounded-full border-2 border-black/20 shadow-xl dark:border-white/30 ${s.playing ? 'mini-spin' : 'mini-spin paused'}`}
          >
            <Cover src={track.imageUrl} size={64} round />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label="Play/Pause"
            style={{ minHeight: 0, minWidth: 0 }}
            className="force-white-text absolute inset-0 m-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur"
          >
            {s.loading ? <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <PlayIcon playing={s.playing} size={16} />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              hub.stop();
            }}
            aria-label={t.close}
            style={{ minHeight: 0, minWidth: 0 }}
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-black/15 bg-white text-[12px] text-black dark:text-black"
          >
            ✕
          </button>
        </div>
      );
      break;
    default: // line
      wrap = 'left-0 right-0';
      body = (
        <div className="relative">
          <div className="flex items-center justify-end gap-2 px-3 pb-1">
            <button type="button" onClick={() => setOpen(true)} className="min-w-0 flex-1 truncate text-left font-cinzel text-[11px] font-semibold text-black/80 dark:text-white/80" style={{ minHeight: 0, minWidth: 0 }}>{title}</button>
            {playBtn(32, 'shadow-md')}
            {closeBtn(26)}
          </div>
          <span className="relative block h-[3px] w-full bg-black/10 dark:bg-white/15" aria-hidden="true">
            <span className="block h-full bg-black dark:bg-white" style={{ width: `${pct}%` }} />
          </span>
        </div>
      );
  }

  return (
    <>
      <div ref={wrapRef} className={`mini-player fixed z-[205] ${wrap}`} data-style={style} data-tour="mini-player" style={{ bottom: 'var(--bar-space, 12px)' }}>
        {body}
      </div>
      {open && (ui.miniPlayerSheet === 'classic' ? <Sheet onClose={() => setOpen(false)} /> : <ModernSheet variant={ui.miniPlayerSheet} onClose={() => setOpen(false)} />)}
    </>
  );
}
