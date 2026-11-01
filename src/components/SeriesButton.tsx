'use client';

// Butonul „Serii" (langa „Archiv"): deschide o fereastra cu seriile de bloguri, fiecare cu blogurile ei in ordine.

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { ReadTick } from '@/components/ReadMark';
import { useLanguage } from '@/hooks/useLanguage';
import { useRowTitles } from '@/hooks/useRowTitles';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useFeatureFlags } from '@/lib/featureFlags';
import { getSupabaseClient } from '@/lib/supabase';
import { useBlogSeries, seriesName, type BlogSeries } from '@/lib/blogSeries';

interface Row {
  id: string;
  slug: string;
  title: string;
}

const LABEL: Record<string, string> = { de: 'Serien', en: 'Series', ro: 'Serii', ru: 'Серии' };
const COLUMNS = 'id, slug, title, title_de, title_en, title_ro, title_ru';
const FALLBACK_COLUMNS = 'id, slug, title';

function SeriesIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="8" y="5" width="24" height="9" rx="2" opacity="0.45" />
      <rect x="6" y="15" width="28" height="10" rx="2" opacity="0.75" />
      <rect x="4" y="26" width="32" height="10" rx="2" />
    </svg>
  );
}

function SeriesSheet({ series, onClose }: { series: BlogSeries[]; onClose: () => void }) {
  const { language } = useLanguage();
  const lang = ['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de';
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  useBodyScrollLock(true);

  const ids = useMemo(() => Array.from(new Set(series.flatMap((s) => s.ids))), [series]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = getSupabaseClient();
      const run = (cols: string) => sb.from('blog_posts').select(cols).in('id', ids).eq('published', true);
      let { data, error } = await run(COLUMNS);
      if (error) ({ data, error } = await run(FALLBACK_COLUMNS));
      if (!alive) return;
      setRows(error ? [] : ((data ?? []) as unknown as Row[]));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [ids]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const titleOf = useRowTitles(rows, lang);
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  return createPortal(
    <div className="fixed inset-0 z-[9990] flex items-end justify-center p-3 pb-[calc(env(safe-area-inset-bottom,0px)+22px)] sm:items-center sm:pb-3" role="dialog" aria-modal="true" aria-label={LABEL[lang]}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-sm animate-fadeIn" />
      <div className="relative flex max-h-[78vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-black/10 bg-white text-black shadow-2xl dark:border-white/15 dark:bg-neutral-950 dark:text-white animate-fadeIn">
        <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-3 dark:border-white/10">
          <div className="flex items-center gap-3">
            <SeriesIcon size={30} />
            <h2 className="font-cinzel text-xl font-bold">{LABEL[lang]}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ touchAction: 'manipulation', minHeight: 44, minWidth: 44 }}
            className="flex h-11 w-11 items-center justify-center rounded-full text-lg text-black/55 hover:bg-black/10 dark:text-white/55 dark:hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6 pt-3">
          {loading ? (
            <p className="py-10 text-center text-black/50 dark:text-white/50">…</p>
          ) : (
            <div className="space-y-2">
              {series.map((s, si) => {
                const list = s.ids.map((id) => byId.get(id)).filter((r): r is Row => Boolean(r));
                if (list.length === 0) return null;
                return (
                  <details key={s.id} open={si === 0} className="rounded-2xl border border-black/10 dark:border-white/10">
                    <summary className="cursor-pointer select-none px-4 py-3 font-cinzel text-lg font-bold">
                      {seriesName(s, lang)} <span className="text-sm font-normal text-black/40 dark:text-white/40">({list.length})</span>
                    </summary>
                    <ol className="divide-y divide-black/10 px-2 pb-2 dark:divide-white/10">
                      {list.map((r, i) => (
                        <li key={r.id}>
                          <Link
                            href={`/blogs/${r.slug}`}
                            onClick={onClose}
                            className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                          >
                            <span className="w-6 shrink-0 text-right text-sm tabular-nums text-black/45 dark:text-white/45">{i + 1}</span>
                            <span className="min-w-0 flex-1 truncate font-cinzel text-base font-semibold">{titleOf(r)}</span>
                            <ReadTick href={`/blogs/${r.slug}`} />
                            <span aria-hidden="true" className="shrink-0 text-black/30 dark:text-white/30">›</span>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </details>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function SeriesButton() {
  const { language } = useLanguage();
  const lang = ['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de';
  const series = useBlogSeries();
  const flags = useFeatureFlags();
  const [open, setOpen] = useState(false);

  const usable = (series ?? []).filter((s) => s.ids.length > 0);
  if (usable.length === 0) return null;

  return (
    <div className="flex justify-center">
      {flags.archiveStacked ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-0.5 rounded-2xl px-8 py-1 text-black transition-opacity hover:opacity-80 dark:text-white"
        >
          <SeriesIcon size={42} />
          <span className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.25em]">{LABEL[lang]}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-3 rounded-full border border-black/15 bg-black/[0.04] px-6 py-2 text-sm font-semibold text-black transition-colors hover:bg-black/10 dark:border-white/20 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/10"
        >
          <SeriesIcon size={30} />
          <span className="font-cinzel text-base tracking-wide">{LABEL[lang]}</span>
        </button>
      )}
      {open && <SeriesSheet series={usable} onClose={() => setOpen(false)} />}
    </div>
  );
}
