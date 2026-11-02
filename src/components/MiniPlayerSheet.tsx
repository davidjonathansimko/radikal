'use client';

// Fereastra noua a playerului mic. Mai multe infatisari (admin), toate in culorile RADIKAL (negru / alb, fara accent colorat):
// copertă, titlu cu defilare, buton spre articol, anterior/urmator (apasat lung = derulare), optiuni de redare,
// lista de ascultare cu imagini si categorii, apoi recomandate, ultimele si serii.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { hub, useAudioHub, getNav, type HubTrack, type HubMode } from '@/lib/audioHub';
import { fetchCatalog, type Catalog, type CatalogTrack } from '@/lib/audioCatalog';
import { useUiSettings, type MiniSheetStyle } from '@/lib/uiSettings';
import { useLanguage } from '@/hooks/useLanguage';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useTrackTitles, useCategories, categoryOf } from '@/hooks/useTrackTitles';
import { useSeriesTitle } from '@/lib/blogSeries';
import AnimatedPlayIcon from '@/components/AnimatedPlayIcon';
import { Cover, PlayIcon, fmt } from '@/components/MiniPlayerParts';

const T = {
  de: { queue: 'Hörliste', recommended: 'Empfohlene Blogs', latest: 'Letzte Blogs', series: 'Serie', random: 'Zufälligen Artikel wiedergeben', stop: 'Beenden', open: 'Zum Artikel', close: 'Schließen', sleep: 'Einschlafen', off: 'Aus', end: 'Bis zum Ende', min: 'Min.', offline: 'Offline speichern', offlineOn: 'Offline gespeichert', empty: 'Keine Audiodatei verfügbar. Tippe auf Play, um es erneut zu versuchen.', modeStop: 'Danach Ende', modeContinue: 'Weiter abspielen', modeRepeat: 'Artikel wiederholen', prev: 'Zurück', next: 'Weiter', hold: 'Gedrückt halten zum Spulen' },
  en: { queue: 'Listening list', recommended: 'Recommended blogs', latest: 'Latest blogs', series: 'Series', random: 'Play a random article', stop: 'Stop', open: 'Go to article', close: 'Close', sleep: 'Sleep timer', off: 'Off', end: 'Until the end', min: 'min', offline: 'Save offline', offlineOn: 'Saved offline', empty: 'No audio available. Tap Play to try again.', modeStop: 'Stop after', modeContinue: 'Keep playing', modeRepeat: 'Repeat article', prev: 'Previous', next: 'Next', hold: 'Hold to seek' },
  ro: { queue: 'Lista de ascultare', recommended: 'Bloguri recomandate', latest: 'Ultimele bloguri', series: 'Serie', random: 'Redă un articol aleatoriu', stop: 'Oprește', open: 'Spre articol', close: 'Închide', sleep: 'Temporizator de somn', off: 'Oprit', end: 'Până la sfârșit', min: 'min', offline: 'Salvează pe telefon', offlineOn: 'Salvat pe telefon', empty: 'Nu există audio. Atinge Play ca să încerci din nou.', modeStop: 'Apoi se oprește', modeContinue: 'Continuă', modeRepeat: 'Repetă articolul', prev: 'Înapoi', next: 'Înainte', hold: 'Ține apăsat ca să derulezi' },
  ru: { queue: 'Список прослушивания', recommended: 'Рекомендуемые блоги', latest: 'Последние блоги', series: 'Серия', random: 'Случайная статья', stop: 'Остановить', open: 'К статье', close: 'Закрыть', sleep: 'Таймер сна', off: 'Выкл.', end: 'До конца', min: 'мин', offline: 'Сохранить офлайн', offlineOn: 'Сохранено офлайн', empty: 'Аудио недоступно. Нажмите Play, чтобы повторить.', modeStop: 'Потом стоп', modeContinue: 'Дальше', modeRepeat: 'Повторить статью', prev: 'Назад', next: 'Далее', hold: 'Удерживайте для перемотки' },
} as const;

type Variant = Exclude<MiniSheetStyle, 'classic'>;

/** Culorile ferestrei: totul monocrom, adaptat temei (hartie = ton cald fix; cover = mereu inchis). */
function palette(variant: Variant) {
  if (variant === 'cover') {
    return {
      forced: true,
      panel: 'bg-neutral-950 text-white border-white/10',
      ink: 'text-white',
      soft: 'text-white/65',
      card: 'bg-white/10',
      line: 'border-white/15',
      primary: 'bg-white text-black',
      activeRow: 'border-white/60 bg-white/15',
      idleRow: 'border-white/10 bg-white/[0.06]',
      seg: 'bg-white/10',
      accent: '#ffffff',
    };
  }
  if (variant === 'paper') {
    return {
      forced: false,
      panel: 'bg-[#f3ead7] text-[#3a2c1c] dark:text-[#3a2c1c] border-[#3a2c1c]/15 font-serif',
      ink: 'text-[#3a2c1c] dark:text-[#3a2c1c]',
      soft: 'text-[#3a2c1c]/65 dark:text-[#3a2c1c]/65',
      card: 'bg-[#3a2c1c]/[0.08]',
      line: 'border-[#3a2c1c]/25',
      primary: 'bg-[#3a2c1c] text-[#f3ead7] dark:text-[#f3ead7]',
      activeRow: 'border-[#3a2c1c]/60 bg-[#3a2c1c]/10',
      idleRow: 'border-[#3a2c1c]/15 bg-[#3a2c1c]/[0.04]',
      seg: 'bg-[#3a2c1c]/[0.08]',
      accent: '#3a2c1c',
    };
  }
  const glass = variant === 'glass';
  return {
    forced: false,
    panel: `${glass ? 'bg-white/60 dark:bg-black/45 backdrop-blur-2xl backdrop-saturate-150' : 'bg-white dark:bg-neutral-950'} text-black dark:text-white border-black/10 dark:border-white/15`,
    ink: 'text-black dark:text-white',
    soft: 'text-black/55 dark:text-white/55',
    card: 'bg-black/[0.05] dark:bg-white/10',
    line: 'border-black/15 dark:border-white/20',
    primary: 'bg-black text-white dark:bg-white dark:text-black',
    activeRow: 'border-black/50 bg-black/[0.07] dark:border-white/50 dark:bg-white/10',
    idleRow: 'border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.05]',
    seg: 'bg-black/[0.05] dark:bg-white/10',
    accent: '',
  };
}
type Pal = ReturnType<typeof palette>;

/** Titlul pe un rand; daca e mai lung decat spatiul, se misca stanga-dreapta in bucla. */
function Marquee({ text, className = '' }: { text: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);
  useEffect(() => {
    const b = box.current;
    const i = inner.current;
    if (!b || !i) return;
    const d = i.offsetWidth - b.clientWidth;
    setShift(d > 2 ? d : 0);
  }, [text]);
  return (
    <div ref={box} className={`overflow-hidden whitespace-nowrap ${className}`}>
      <span
        ref={inner}
        className={`inline-block ${shift ? 'mini-marquee' : ''}`}
        style={shift ? ({ '--mq': `-${shift}px`, animationDuration: `${Math.max(6, shift / 16 + 4)}s` } as React.CSSProperties) : undefined}
      >
        {text || '\u00a0'}
      </span>
    </div>
  );
}

/** Atingere = pas inainte/inapoi; tinut apasat = derulare in acelasi sens. */
function HoldSeek({ dir, onTap, label, children }: { dir: 1 | -1; onTap: () => void; label: string; children: React.ReactNode }) {
  const timer = useRef<number>();
  const iv = useRef<number>();
  const held = useRef(false);
  const stop = () => {
    window.clearTimeout(timer.current);
    window.clearInterval(iv.current);
  };
  useEffect(() => stop, []);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={() => {
        held.current = false;
        timer.current = window.setTimeout(() => {
          held.current = true;
          let n = 0;
          iv.current = window.setInterval(() => {
            n += 1;
            hub.seekBy(dir * (n < 10 ? 4 : 10));
          }, 180);
        }, 400);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (held.current) {
          held.current = false;
          return;
        }
        onTap();
      }}
      style={{ touchAction: 'manipulation', WebkitTouchCallout: 'none', userSelect: 'none' }}
      className="flex h-12 w-12 items-center justify-center rounded-full text-current active:scale-95"
    >
      {children}
    </button>
  );
}

/** Numele categoriei, cu litere mari Cinzel. */
function Cat({ name, className = '' }: { name: string; className?: string }) {
  if (!name) return null;
  return <span className={`block truncate font-cinzel text-[10px] font-semibold uppercase tracking-[0.16em] ${className}`}>{name}</span>;
}

function Row({
  n,
  track,
  active,
  title,
  category,
  pal,
  onPlay,
  onRemove,
}: {
  n: number;
  track: CatalogTrack;
  active: boolean;
  title: string;
  category: string;
  pal: Pal;
  onPlay: () => void;
  onRemove?: () => void;
}) {
  return (
    <li className={`flex items-center gap-1 rounded-2xl border ${active ? pal.activeRow : pal.idleRow}`}>
      <button type="button" onClick={onPlay} className="flex min-w-0 flex-1 items-center gap-3 p-2 text-left" style={{ minHeight: 0 }}>
        <span className={`w-5 shrink-0 text-center text-sm ${active ? `font-bold ${pal.ink}` : pal.soft}`}>{n}</span>
        <Cover src={track.imageUrl} size={46} radius={10} />
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-sm font-semibold ${pal.ink}`}>{title || '\u00a0'}</span>
          <Cat name={category} className={pal.soft} />
        </span>
        {!onRemove && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${pal.primary}`} aria-hidden="true">
            <PlayIcon playing={false} size={15} />
          </span>
        )}
      </button>
      {onRemove && (
        <button type="button" onClick={onRemove} className={`h-10 w-10 shrink-0 ${pal.soft}`} aria-label="Remove">✕</button>
      )}
    </li>
  );
}

function DiceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
    </svg>
  );
}

export default function ModernSheet({ onClose, variant }: { onClose: () => void; variant: Variant }) {
  const s = useAudioHub();
  const ui = useUiSettings();
  const { language } = useLanguage();
  const lang = (['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de') as keyof typeof T;
  const t = T[lang];
  const cats = useCategories();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [offline, setOffline] = useState<'idle' | 'busy' | 'saved'>('idle');
  useBodyScrollLock(true);

  useEffect(() => {
    let alive = true;
    void fetchCatalog().then((c) => alive && setCatalog(c));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const track = s.track;
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

  const latest = useMemo(() => (catalog?.all ?? []).slice(0, 8), [catalog]);
  const all = useMemo<HubTrack[]>(() => {
    const list: CatalogTrack[] = [...s.queue, ...(catalog?.recommended ?? []), ...latest, ...(catalog?.series.flatMap((x) => x.tracks) ?? [])];
    return [...(track ? [track] : []), ...list.map((x) => ({ ...x, lang }))];
  }, [track, s.queue, catalog, latest, lang]);
  const titleOf = useTrackTitles(all, lang);
  const seriesTitle = useSeriesTitle(catalog ? catalog.series.map((x) => x.series) : null, lang);

  if (!track) return null;
  const pal = palette(variant);
  const nav = getNav(s);
  const cat = categoryOf(cats, track, lang);
  const catOf = (x: CatalogTrack) => categoryOf(cats, { ...x, lang }, lang);
  const title = titleOf(track);
  const fx = ui.miniSheetFx;
  const play = (x: CatalogTrack) => void hub.playBlog({ ...x, lang });
  const modes: { id: HubMode; label: string }[] = [
    { id: 'stop', label: t.modeStop },
    { id: 'continue', label: t.modeContinue },
    { id: 'repeat', label: t.modeRepeat },
  ];
  const coverSize = Math.min(260, Math.round((typeof window !== 'undefined' ? window.innerWidth : 360) * 0.62));
  const sepia = variant === 'paper' ? { filter: 'sepia(0.3)' } : undefined;

  const openLink = (cls = '') => (
    <Link
      href={track.href}
      onClick={onClose}
      aria-label={t.open}
      title={t.open}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${pal.line} ${pal.ink} ${cls}`}
      style={{ minHeight: 0 }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 3h7v7" />
        <path d="M21 3 10 14" />
        <path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
      </svg>
    </Link>
  );

  const catChip = (
    <div className="mt-1 flex min-w-0 items-center gap-2">
      {cat && <span className={`truncate rounded-full border px-2 py-0.5 font-cinzel text-[10px] font-semibold uppercase tracking-[0.16em] ${pal.line} ${pal.ink}`}>{cat}</span>}
      <span className={`truncate text-xs ${pal.soft}`}>RADIKAL.</span>
    </div>
  );

  const titleCard = (
    <div className={`flex items-center gap-3 rounded-2xl p-3 ${pal.card}`}>
      <div className="min-w-0 flex-1">
        <Marquee text={title} className={`font-cinzel text-lg font-bold leading-snug ${pal.ink}`} />
        {catChip}
      </div>
      {openLink()}
    </div>
  );

  const header = (() => {
    switch (variant) {
      case 'compact':
        return (
          <div className={`flex items-center gap-3 rounded-2xl p-3 ${pal.card}`}>
            <Cover src={track.imageUrl} size={56} radius={14} />
            <div className="min-w-0 flex-1">
              <Marquee text={title} className={`font-cinzel text-base font-bold leading-snug ${pal.ink}`} />
              {catChip}
            </div>
            {openLink()}
          </div>
        );
      case 'vinyl':
        return (
          <>
            <div className="mb-5 flex justify-center">
              <div
                className={`relative flex items-center justify-center rounded-full ${s.playing ? 'mini-spin' : 'mini-spin paused'}`}
                style={{ width: coverSize, height: coverSize, background: 'radial-gradient(circle, #151515 0 38%, #0a0a0a 39% 41%, #1a1a1a 42% 60%, #0d0d0d 61% 100%)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' }}
              >
                <Cover src={track.imageUrl} size={Math.round(coverSize * 0.62)} round />
                <span className="absolute h-3 w-3 rounded-full bg-neutral-950 ring-2 ring-white/30" aria-hidden="true" />
              </div>
            </div>
            {titleCard}
          </>
        );
      case 'poster':
        return (
          <div className="force-white-text relative -mx-4 -mt-2 mb-4 overflow-hidden" style={{ height: Math.round(coverSize * 1.05) }}>
            {track.imageUrl ? <Image src={track.imageUrl} alt="" fill sizes="448px" className="object-cover" /> : <span className="absolute inset-0 bg-neutral-800" />}
            <span className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.35) 100%)' }} aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
              <div className="min-w-0 flex-1 text-white">
                {cat && <Cat name={cat} className="mb-1 text-white/75" />}
                <p className="line-clamp-3 font-cinzel text-xl font-bold leading-snug text-white">{title || '\u00a0'}</p>
              </div>
              <Link href={track.href} onClick={onClose} aria-label={t.open} title={t.open} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/50 text-white" style={{ minHeight: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 3h7v7" />
                  <path d="M21 3 10 14" />
                  <path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                </svg>
              </Link>
            </div>
          </div>
        );
      case 'quiet':
        return (
          <div className="mb-1 px-1 pb-2 pt-4 text-center">
            {cat && <Cat name={cat} className={`mb-3 ${pal.soft}`} />}
            <p className={`line-clamp-4 font-cinzel text-2xl font-bold leading-snug ${pal.ink}`}>{title || '\u00a0'}</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className={`h-px w-10 bg-current opacity-25 ${pal.ink}`} />
              <span className={`text-xs ${pal.soft}`}>RADIKAL.</span>
              <span className={`h-px w-10 bg-current opacity-25 ${pal.ink}`} />
            </div>
            <div className="mt-3 flex justify-center">{openLink()}</div>
          </div>
        );
      case 'split':
        return (
          <div className="flex items-center gap-4">
            <Cover src={track.imageUrl} size={128} radius={20} />
            <div className="min-w-0 flex-1">
              {cat && <Cat name={cat} className={`mb-1 ${pal.soft}`} />}
              <p className={`line-clamp-4 font-cinzel text-lg font-bold leading-snug ${pal.ink}`}>{title || '\u00a0'}</p>
              <div className="mt-2">{openLink()}</div>
            </div>
          </div>
        );
      default:
        return (
          <>
            <div className="mb-4 flex justify-center" style={sepia}>
              <Cover src={track.imageUrl} size={coverSize} radius={28} />
            </div>
            {titleCard}
          </>
        );
    }
  })();

  const section = (heading: string, rows: React.ReactNode, key: string) => (
    <section key={key} className="mt-7">
      <h3 className={`mb-3 flex items-center gap-3 font-cinzel text-xs font-semibold uppercase tracking-[0.2em] ${pal.ink}`}>
        <span className="truncate">{heading}</span>
        <span className="h-px flex-1 bg-current opacity-15" aria-hidden="true" />
      </h3>
      <ol className="space-y-2">{rows}</ol>
    </section>
  );

  const bigPlay = variant === 'vinyl' ? 64 : 72;

  return createPortal(
    <div className="fixed inset-0 z-[9992] flex items-end justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label={t.close} onClick={onClose} className={`absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm ${fx !== 'none' ? 'mini-sheet-back' : ''}`} />
      <div
        className={`relative flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border shadow-2xl ${pal.panel} ${pal.forced ? 'force-white-text' : ''} ${fx !== 'none' ? `mini-sheet-fx-${fx}` : ''}`}
      >
        {(variant === 'cover' || variant === 'glass') && track.imageUrl && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <Image src={track.imageUrl} alt="" fill sizes="448px" className={`scale-150 object-cover blur-3xl ${variant === 'glass' ? 'opacity-25' : 'opacity-45'}`} />
            {variant === 'cover' && <span className="absolute inset-0 bg-black/55" />}
          </div>
        )}
        <div className="scrollbar-hide relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-2" style={{ scrollbarWidth: 'none' }}>
          {variant !== 'poster' && <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-current opacity-25" aria-hidden="true" />}
          <div className={variant === 'poster' ? 'absolute right-2 top-2 z-10' : 'flex justify-end'}>
            <button type="button" onClick={onClose} aria-label={t.close} className={`h-10 w-10 rounded-full text-lg ${variant === 'poster' ? 'bg-black/40 text-white' : pal.soft}`}>✕</button>
          </div>

          {header}

          <div className="mt-5">
            <input
              type="range"
              min={0}
              max={Math.max(1, Math.floor(s.duration))}
              value={Math.floor(s.position)}
              onChange={(e) => hub.seek(Number(e.target.value))}
              className={`w-full ${pal.accent ? '' : 'accent-black dark:accent-white'}`}
              style={pal.accent ? { accentColor: pal.accent } : undefined}
              aria-label="Seek"
              disabled={s.loading || s.restored}
            />
            <div className={`flex justify-between text-xs tabular-nums ${pal.soft}`}>
              <span>{fmt(s.position)}</span>
              <span>{s.loading ? `${s.buildPct}%` : fmt(s.duration)}</span>
            </div>
            {s.error && <p className={`mt-2 text-center text-xs ${pal.ink}`}>{t.empty}</p>}
          </div>

          <div className={`mt-2 flex items-center justify-center gap-5 ${pal.ink}`}>
            <div className="h-12 w-12">
              {nav.hasPrev && (
                <HoldSeek dir={-1} onTap={() => void hub.prev()} label={`${t.prev} · ${t.hold}`}>
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>
                </HoldSeek>
              )}
            </div>
            <button
              type="button"
              onClick={() => hub.toggle()}
              aria-label="Play/Pause"
              className={`flex items-center justify-center rounded-full shadow-lg ${pal.primary}`}
              style={{ width: bigPlay, height: bigPlay }}
            >
              {s.loading ? (
                <span className="block h-7 w-7 animate-spin rounded-full border-[3px] border-current border-t-transparent" />
              ) : s.playing ? (
                <PlayIcon playing size={32} />
              ) : (
                <AnimatedPlayIcon className="h-9 w-9" />
              )}
            </button>
            <div className="h-12 w-12">
              {nav.hasNext && (
                <HoldSeek dir={1} onTap={() => void hub.next()} label={`${t.next} · ${t.hold}`}>
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l11-7z" /></svg>
                </HoldSeek>
              )}
            </div>
          </div>

          <div className={`mt-5 grid grid-cols-3 gap-1 rounded-2xl p-1 ${pal.seg}`} role="radiogroup">
            {modes.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={s.mode === m.id}
                onClick={() => hub.setMode(m.id)}
                className={`rounded-xl px-1.5 py-2 text-center text-xs font-semibold leading-tight ${s.mode === m.id ? pal.primary : pal.ink}`}
                style={{ minHeight: 44 }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {ui.sleepTimer && (
            <div className="mt-5">
              <p className={`mb-2 font-cinzel text-[11px] font-semibold uppercase tracking-[0.18em] ${pal.soft}`}>{t.sleep}</p>
              <div className="flex flex-wrap gap-2">
                {[null, 15, 30, 45, 60, 'end' as const].map((m) => {
                  const active = m === null ? s.sleep === null : m === 'end' ? s.sleep === 'end' : typeof s.sleep === 'number' && s.sleep > Date.now() && Math.abs(s.sleep - Date.now() - m * 60000) < 5 * 60000;
                  return (
                    <button
                      key={String(m)}
                      type="button"
                      onClick={() => hub.setSleep(m)}
                      className={`rounded-full border px-3 py-1.5 text-xs ${active ? `border-transparent ${pal.primary}` : `${pal.line} ${pal.ink}`}`}
                      style={{ minHeight: 0 }}
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
              className={`mt-5 w-full rounded-2xl border px-3 py-2.5 text-sm ${pal.line} ${pal.ink}`}
            >
              {offline === 'saved' ? `✓ ${t.offlineOn}` : offline === 'busy' ? '…' : t.offline}
            </button>
          )}

          {ui.queue &&
            section(
              t.queue,
              <>
                <Row n={1} track={track} active title={title} category={cat} pal={pal} onPlay={() => hub.toggle()} />
                {s.queue.map((q, i) => (
                  <Row key={q.slug} n={i + 2} track={q} active={false} title={titleOf({ ...q, lang })} category={catOf(q)} pal={pal} onPlay={() => void hub.playQueueIndex(i)} onRemove={() => hub.removeFromQueue(i)} />
                ))}
              </>,
              'queue',
            )}

          {catalog && catalog.recommended.length > 0 &&
            section(
              t.recommended,
              catalog.recommended.map((x, i) => (
                <Row key={x.slug} n={i + 1} track={x} active={x.slug === track.slug} title={titleOf({ ...x, lang })} category={catOf(x)} pal={pal} onPlay={() => play(x)} />
              )),
              'rec',
            )}

          {latest.length > 0 &&
            section(
              t.latest,
              latest.map((x, i) => (
                <Row key={x.slug} n={i + 1} track={x} active={x.slug === track.slug} title={titleOf({ ...x, lang })} category={catOf(x)} pal={pal} onPlay={() => play(x)} />
              )),
              'latest',
            )}

          {catalog?.series.map((g) =>
            section(
              `${t.series}: ${seriesTitle(g.series) || '…'}`,
              g.tracks.map((x, i) => (
                <Row key={x.slug} n={i + 1} track={x} active={x.slug === track.slug} title={titleOf({ ...x, lang })} category={catOf(x)} pal={pal} onPlay={() => play(x)} />
              )),
              `series-${g.series.id}`,
            ),
          )}

          <button
            type="button"
            onClick={() => void hub.playRandom()}
            className={`mt-7 flex w-full items-center justify-center gap-2.5 rounded-2xl border px-3 py-3 text-sm font-semibold ${pal.line} ${pal.ink}`}
          >
            <DiceIcon />
            {t.random}
          </button>

          <button
            type="button"
            onClick={() => {
              hub.stop();
              onClose();
            }}
            className={`mt-3 w-full rounded-2xl px-3 py-3 text-sm font-semibold ${pal.primary}`}
          >
            {t.stop}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
