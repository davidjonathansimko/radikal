'use client';

// Butonul „Archiv" (pictograma animata + text) care deschide arhiva intr-o fereastra: an -> luna -> texte.
// Aceeasi componenta la bloguri, marturii, Andacht si Pentru copii.

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import ArchiveIcon from '@/components/ArchiveIcon';
import { ReadTick } from '@/components/ReadMark';
import { useLanguage } from '@/hooks/useLanguage';
import { useRowTitles } from '@/hooks/useRowTitles';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useFeatureFlags } from '@/lib/featureFlags';
import { getSupabaseClient } from '@/lib/supabase';

type Table = 'blog_posts' | 'testimonies' | 'content_items';

interface Row {
  id: string;
  slug: string;
  title: string;
  created_at: string;
}

interface Props {
  table: Table;
  /** Doar pentru `content_items`: 'andacht' sau 'copii'. */
  kind?: string;
  /** Inceputul adresei unui text, de pilda `/blogs`. */
  itemPath: string;
  className?: string;
}

const LABEL: Record<string, string> = { de: 'Archiv', en: 'Archive', ro: 'Arhivă', ru: 'Архив' };
const EMPTY: Record<string, string> = {
  de: 'Das Archiv ist noch leer.',
  en: 'The archive is still empty.',
  ro: 'Arhiva este încă goală.',
  ru: 'Архив пока пуст.',
};
const LOCALES: Record<string, string> = { de: 'de-DE', en: 'en-GB', ro: 'ro-RO', ru: 'ru-RU' };
const COLUMNS = 'id, slug, title, title_de, title_en, title_ro, title_ru, created_at';
const FALLBACK_COLUMNS = 'id, slug, title, created_at';

function ArchiveSheet({ table, kind, itemPath, onClose }: Omit<Props, 'className'> & { onClose: () => void }) {
  const { language } = useLanguage();
  const lang = ['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de';
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useBodyScrollLock(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = getSupabaseClient();
      const run = (cols: string) => {
        let q = sb.from(table).select(cols).eq('published', true);
        if (kind) q = q.eq('kind', kind);
        return q.order('created_at', { ascending: false }).limit(2000);
      };
      let { data, error } = await run(COLUMNS);
      if (error) ({ data, error } = await run(FALLBACK_COLUMNS));
      if (!alive) return;
      setRows(error ? [] : ((data ?? []) as unknown as Row[]));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [table, kind]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const titleOf = useRowTitles(rows, lang);

  const tree = useMemo(() => {
    const years = new Map<number, Map<number, Row[]>>();
    rows.forEach((r) => {
      const d = new Date(r.created_at);
      const months = years.get(d.getFullYear()) ?? new Map<number, Row[]>();
      const list = months.get(d.getMonth()) ?? [];
      list.push(r);
      months.set(d.getMonth(), list);
      years.set(d.getFullYear(), months);
    });
    return [...years.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, months]) => ({ year, months: [...months.entries()].sort((a, b) => b[0] - a[0]) }));
  }, [rows]);

  const monthName = (m: number) => new Date(2000, m, 1).toLocaleDateString(LOCALES[lang], { month: 'long' });

  return createPortal(
    <div className="fixed inset-0 z-[9990] flex items-end justify-center p-3 pb-[calc(env(safe-area-inset-bottom,0px)+22px)] sm:items-center sm:pb-3" role="dialog" aria-modal="true" aria-label={LABEL[lang]}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-sm animate-fadeIn"
      />
      <div className="relative flex max-h-[78vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-black/10 bg-white text-black shadow-2xl dark:border-white/15 dark:bg-neutral-950 dark:text-white animate-fadeIn">
        <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-3 dark:border-white/10">
          <div className="flex items-center gap-3">
            <ArchiveIcon size={34} />
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
          ) : tree.length === 0 ? (
            <p className="py-10 text-center text-black/60 dark:text-white/60">{EMPTY[lang]}</p>
          ) : (
            <div className="space-y-2">
              {tree.map(({ year, months }, yi) => (
                <details key={year} open={yi === 0} className="rounded-2xl border border-black/10 dark:border-white/10">
                  <summary className="cursor-pointer select-none px-4 py-3 font-cinzel text-lg font-bold">{year}</summary>
                  <div className="space-y-1 px-2 pb-3">
                    {months.map(([month, list], mi) => (
                      <details key={month} open={yi === 0 && mi === 0}>
                        <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold capitalize text-black/80 dark:text-white/80">
                          {monthName(month)} <span className="text-black/40 dark:text-white/40">({list.length})</span>
                        </summary>
                        <ul className="divide-y divide-black/10 dark:divide-white/10">
                          {list.map((r) => (
                            <li key={r.id}>
                              <Link
                                href={`${itemPath}/${r.slug}`}
                                onClick={onClose}
                                className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                              >
                                <span className="w-7 shrink-0 text-right text-sm tabular-nums text-black/45 dark:text-white/45">
                                  {new Date(r.created_at).getDate()}
                                </span>
                                <span className="min-w-0 flex-1 truncate font-cinzel text-base font-semibold">{titleOf(r)}</span>
                                <ReadTick href={`${itemPath}/${r.slug}`} />
                                <span aria-hidden="true" className="shrink-0 text-black/30 dark:text-white/30">›</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function ArchiveButton({ table, kind, itemPath, className = '' }: Props) {
  const { language } = useLanguage();
  const lang = ['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de';
  const [open, setOpen] = useState(false);
  const flags = useFeatureFlags();

  return (
    <div className={`flex justify-center ${className}`} data-tour="archive">
      {flags.archiveStacked ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-1 rounded-2xl px-8 py-2 text-black transition-opacity hover:opacity-80 dark:text-white"
        >
          <ArchiveIcon size={58} />
          <span className="font-cinzel text-sm font-semibold uppercase tracking-[0.25em]">{LABEL[lang]}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-3 rounded-full border border-black/15 bg-black/[0.04] px-6 py-2 text-sm font-semibold text-black transition-colors hover:bg-black/10 dark:border-white/20 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/10"
        >
          <ArchiveIcon size={34} />
          <span className="font-cinzel text-base tracking-wide">{LABEL[lang]}</span>
        </button>
      )}
      {open && <ArchiveSheet table={table} kind={kind} itemPath={itemPath} onClose={() => setOpen(false)} />}
    </div>
  );
}
