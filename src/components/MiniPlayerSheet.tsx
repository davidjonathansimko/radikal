'use client';

// Fereastra noua a playerului mic: copertă mare, titlu cu defilare, buton spre articol, anterior/urmator (apasat lung = derulare),
// optiuni de redare, lista de ascultare cu imagini si categorii, apoi recomandate, ultimele si serii.

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
import { Cover, PlayIcon, fmt } from '@/components/MiniPlayerParts';

const T = {
  de: { queue: 'Hörliste', recommended: 'Empfohlene Blogs', latest: 'Letzte Blogs', series: 'Serie', random: 'Zufälligen Artikel wiedergeben', stop: 'Beenden', open: 'Zum Artikel', close: 'Schließen', sleep: 'Einschlafen', off: 'Aus', end: 'Bis zum Ende', min: 'Min.', offline: 'Offline speichern', offlineOn: 'Offline gespeichert', empty: 'Keine Audiodatei verfügbar. Tippe auf Play, um es erneut zu versuchen.', modeStop: 'Danach Ende', modeContinue: 'Weiter abspielen', modeRepeat: 'Artikel wiederholen', prev: 'Zurück', next: 'Weiter', hold: 'Gedrückt halten zum Spulen', category: 'Kategorie' },
  en: { queue: 'Listening list', recommended: 'Recommended blogs', latest: 'Latest blogs', series: 'Series', random: 'Play a random article', stop: 'Stop', open: 'Go to article', close: 'Close', sleep: 'Sleep timer', off: 'Off', end: 'Until the end', min: 'min', offline: 'Save offline', offlineOn: 'Saved offline', empty: 'No audio available. Tap Play to try again.', modeStop: 'Stop after', modeContinue: 'Keep playing', modeRepeat: 'Repeat article', prev: 'Previous', next: 'Next', hold: 'Hold to seek', category: 'Category' },
  ro: { queue: 'Lista de ascultare', recommended: 'Bloguri recomandate', latest: 'Ultimele bloguri', series: 'Serie', random: 'Redă un articol aleatoriu', stop: 'Oprește', open: 'Spre articol', close: 'Închide', sleep: 'Temporizator de somn', off: 'Oprit', end: 'Până la sfârșit', min: 'min', offline: 'Salvează pe telefon', offlineOn: 'Salvat pe telefon', empty: 'Nu există audio. Atinge Play ca să încerci din nou.', modeStop: 'Apoi se oprește', modeContinue: 'Continuă', modeRepeat: 'Repetă articolul', prev: 'Înapoi', next: 'Înainte', hold: 'Ține apăsat ca să derulezi', category: 'Categorie' },
  ru: { queue: 'Список прослушивания', recommended: 'Рекомендуемые блоги', latest: 'Последние блоги', series: 'Серия', random: 'Случайная статья', stop: 'Остановить', open: 'К статье', close: 'Закрыть', sleep: 'Таймер сна', off: 'Выкл.', end: 'До конца', min: 'мин', offline: 'Сохранить офлайн', offlineOn: 'Сохранено офлайн', empty: 'Аудио недоступно. Нажмите Play, чтобы повторить.', modeStop: 'Потом стоп', modeContinue: 'Дальше', modeRepeat: 'Повторить статью', prev: 'Назад', next: 'Далее', hold: 'Удерживайте для перемотки', category: 'Категория' },
} as const;

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
      className="flex h-12 w-12 items-center justify-center rounded-full text-current hover:bg-black/10 dark:hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function Row({
  n,
  track,
  active,
  title,
  category,
  onPlay,
  onRemove,
}: {
  n: number;
  track: CatalogTrack;
  active: boolean;
  title: string;
  category: string;
  onPlay: () => void;
  onRemove?: () => void;
}) {
  return (
    <li className={`flex items-center gap-1 rounded-2xl border ${active ? 'border-red-600/60 bg-red-600/10' : 'border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.05]'}`}>
      <button type="button" onClick={onPlay} className="flex min-w-0 flex-1 items-center gap-3 p-2 text-left" style={{ minHeight: 0 }}>
        <span className={`w-5 shrink-0 text-center text-sm ${active ? 'font-bold text-red-600 dark:text-red-400' : 'text-black/45 dark:text-white/45'}`}>{n}</span>
        <Cover src={track.imageUrl} size={46} radius={10} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{title || '\u00a0'}</span>
          {category && <span className="block truncate text-xs text-red-700 dark:text-red-400">{category}</span>}
        </span>
        {!onRemove && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-700/80 text-white" aria-hidden="true">
            <PlayIcon playing={false} size={14} />
          </span>
        )}
      </button>
      {onRemove && (
        <button type="button" onClick={onRemove} className="h-10 w-10 shrink-0 text-black/50 dark:text-white/50" aria-label="Remove">✕</button>
      )}
    </li>
  );
}

export default function ModernSheet({ onClose, variant }: { onClose: () => void; variant: Exclude<MiniSheetStyle, 'classic'> }) {
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
  const nav = getNav(s);
  const cat = categoryOf(cats, track, lang);
  const catOf = (x: CatalogTrack) => categoryOf(cats, { ...x, lang }, lang);
  const compact = variant === 'compact';
  const coverVariant = variant === 'cover';
  const ink = coverVariant ? 'text-white' : 'text-black dark:text-white';
  const soft = coverVariant ? 'text-white/65' : 'text-black/55 dark:text-white/55';
  const icon = 'h-7 w-7';
  const modes: { id: HubMode; label: string }[] = [
    { id: 'stop', label: t.modeStop },
    { id: 'continue', label: t.modeContinue },
    { id: 'repeat', label: t.modeRepeat },
  ];
  const play = (x: CatalogTrack) => void hub.playBlog({ ...x, lang });
  const queueActive = ui.queue;

  const listSection = (title: string, rows: React.ReactNode, key: string) => (
    <section key={key} className="mt-6">
      <h3 className={`mb-2 flex items-center gap-2 text-sm font-semibold ${ink}`}>
        <span className="text-red-600 dark:text-red-400" aria-hidden="true">♪</span>
        {title}
      </h3>
      <ol className="space-y-2">{rows}</ol>
    </section>
  );

  return createPortal(
    <div className="fixed inset-0 z-[9992] flex items-end justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label={t.close} onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm" />
      <div
        className={`scrollbar-hide relative max-h-[94vh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-3xl border border-black/10 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-2 shadow-2xl dark:border-white/15 ${coverVariant ? 'bg-neutral-950 text-white' : 'bg-white text-black dark:bg-neutral-950 dark:text-white'}`}
        style={{ scrollbarWidth: 'none' }}
      >
        {coverVariant && track.imageUrl && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-3xl" aria-hidden="true">
            <Image src={track.imageUrl} alt="" fill sizes="448px" className="scale-150 object-cover opacity-45 blur-3xl" />
            <span className="absolute inset-0 bg-black/55" />
          </div>
        )}
        <div className="relative">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-current opacity-25" aria-hidden="true" />
          <div className="flex justify-end">
            <button type="button" onClick={onClose} aria-label={t.close} className={`h-10 w-10 rounded-full text-lg ${soft}`}>✕</button>
          </div>

          {!compact && (
            <div className="mb-4 flex justify-center">
              <Cover src={track.imageUrl} size={Math.min(260, Math.round((typeof window !== 'undefined' ? window.innerWidth : 360) * 0.62))} radius={28} />
            </div>
          )}

          <div className={`flex items-center gap-3 rounded-2xl p-3 ${coverVariant ? 'bg-white/10' : 'bg-black/[0.05] dark:bg-white/10'}`}>
            {compact && <Cover src={track.imageUrl} size={52} radius={12} />}
            <div className="min-w-0 flex-1">
              <Marquee text={titleOf(track)} className={`font-cinzel text-lg font-bold leading-snug ${ink}`} />
              <div className="mt-1 flex min-w-0 items-center gap-2">
                {cat && <span className="truncate rounded-md bg-red-600/90 px-1.5 py-0.5 text-[11px] font-semibold text-white">{cat}</span>}
                <span className={`truncate text-xs ${soft}`}>RADIKAL.</span>
              </div>
            </div>
            <Link
              href={track.href}
              onClick={onClose}
              aria-label={t.open}
              title={t.open}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-red-600 hover:bg-red-600/10 dark:text-red-400"
              style={{ minHeight: 0 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 3h7v7" />
                <path d="M21 3 10 14" />
                <path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
              </svg>
            </Link>
          </div>

          <div className="mt-5">
            <input
              type="range"
              min={0}
              max={Math.max(1, Math.floor(s.duration))}
              value={Math.floor(s.position)}
              onChange={(e) => hub.seek(Number(e.target.value))}
              className="w-full accent-red-600"
              aria-label="Seek"
              disabled={s.loading || s.restored}
            />
            <div className={`flex justify-between text-xs tabular-nums ${soft}`}>
              <span>{fmt(s.position)}</span>
              <span>{s.loading ? `${s.buildPct}%` : fmt(s.duration)}</span>
            </div>
            {s.error && <p className="mt-2 text-center text-xs text-red-600 dark:text-red-400">{t.empty}</p>}
          </div>

          <div className={`mt-2 flex items-center justify-center gap-5 ${ink}`}>
            <div className="h-12 w-12">
              {nav.hasPrev && (
                <HoldSeek dir={-1} onTap={() => void hub.prev()} label={`${t.prev} · ${t.hold}`}>
                  <svg className={icon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>
                </HoldSeek>
              )}
            </div>
            <button
              type="button"
              onClick={() => hub.toggle()}
              aria-label="Play/Pause"
              className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-red-700 text-white shadow-lg shadow-red-900/40"
            >
              {s.loading ? <span className="block h-7 w-7 animate-spin rounded-full border-[3px] border-white border-t-transparent" /> : <PlayIcon playing={s.playing} size={34} />}
            </button>
            <div className="h-12 w-12">
              {nav.hasNext && (
                <HoldSeek dir={1} onTap={() => void hub.next()} label={`${t.next} · ${t.hold}`}>
                  <svg className={icon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l11-7z" /></svg>
                </HoldSeek>
              )}
            </div>
          </div>

          <div className={`mt-4 grid grid-cols-3 gap-1 rounded-2xl p-1 ${coverVariant ? 'bg-white/10' : 'bg-black/[0.05] dark:bg-white/10'}`} role="radiogroup">
            {modes.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={s.mode === m.id}
                onClick={() => hub.setMode(m.id)}
                className={`rounded-xl px-1.5 py-2 text-center text-xs font-semibold leading-tight ${s.mode === m.id ? 'bg-red-700 text-white' : ink}`}
                style={{ minHeight: 44 }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {ui.sleepTimer && (
            <div className="mt-5">
              <p className={`mb-2 text-xs font-semibold uppercase tracking-wider ${soft}`}>{t.sleep}</p>
              <div className="flex flex-wrap gap-2">
                {[null, 15, 30, 45, 60, 'end' as const].map((m) => {
                  const active = m === null ? s.sleep === null : m === 'end' ? s.sleep === 'end' : typeof s.sleep === 'number' && s.sleep > Date.now() && Math.abs(s.sleep - Date.now() - m * 60000) < 5 * 60000;
                  return (
                    <button
                      key={String(m)}
                      type="button"
                      onClick={() => hub.setSleep(m)}
                      className={`rounded-full border px-3 py-1.5 text-xs ${active ? 'border-transparent bg-red-700 text-white' : 'border-current/25'} ${active ? '' : ink}`}
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
              className={`mt-5 w-full rounded-xl border border-current/25 px-3 py-2.5 text-sm ${ink}`}
            >
              {offline === 'saved' ? `✓ ${t.offlineOn}` : offline === 'busy' ? '…' : t.offline}
            </button>
          )}

          {queueActive &&
            listSection(
              t.queue,
              <>
                <Row n={1} track={track} active title={titleOf(track)} category={cat} onPlay={() => hub.toggle()} />
                {s.queue.map((q, i) => (
                  <Row key={q.slug} n={i + 2} track={q} active={false} title={titleOf({ ...q, lang })} category={catOf(q)} onPlay={() => void hub.playQueueIndex(i)} onRemove={() => hub.removeFromQueue(i)} />
                ))}
              </>,
              'queue',
            )}

          {catalog && catalog.recommended.length > 0 &&
            listSection(
              t.recommended,
              catalog.recommended.map((x, i) => (
                <Row key={x.slug} n={i + 1} track={x} active={x.slug === track.slug} title={titleOf({ ...x, lang })} category={catOf(x)} onPlay={() => play(x)} />
              )),
              'rec',
            )}

          {latest.length > 0 &&
            listSection(
              t.latest,
              latest.map((x, i) => (
                <Row key={x.slug} n={i + 1} track={x} active={x.slug === track.slug} title={titleOf({ ...x, lang })} category={catOf(x)} onPlay={() => play(x)} />
              )),
              'latest',
            )}

          {catalog?.series.map((g) =>
            listSection(
              `${t.series}: ${seriesTitle(g.series) || '…'}`,
              g.tracks.map((x, i) => (
                <Row key={x.slug} n={i + 1} track={x} active={x.slug === track.slug} title={titleOf({ ...x, lang })} category={catOf(x)} onPlay={() => play(x)} />
              )),
              `series-${g.series.id}`,
            ),
          )}

          <button
            type="button"
            onClick={() => void hub.playRandom()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-red-600/60 px-3 py-3 text-sm font-semibold text-red-700 dark:text-red-400"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
            {t.random}
          </button>

          <button
            type="button"
            onClick={() => {
              hub.stop();
              onClose();
            }}
            className="mt-3 w-full rounded-2xl border border-red-500/40 px-3 py-3 text-sm font-semibold text-red-600 dark:text-red-400"
          >
            {t.stop}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
