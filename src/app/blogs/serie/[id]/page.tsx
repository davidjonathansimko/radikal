'use client';

// Pagina unei serii: blogurile in ordine, cu cate ai citit si un buton „Continua". Se vede doar daca e pornita din admin.

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { useLanguage } from '@/hooks/useLanguage';
import { useRowTitles } from '@/hooks/useRowTitles';
import { getSupabaseClient } from '@/lib/supabase';
import { useBlogSeries, useSeriesTitle } from '@/lib/blogSeries';
import { useUiSettings } from '@/lib/uiSettings';
import { useReadItems } from '@/lib/readState';
import { ReadTick } from '@/components/ReadMark';

interface Row {
  id: string;
  slug: string;
  title: string;
}

const COLUMNS = 'id, slug, title, title_de, title_en, title_ro, title_ru';

const T = {
  de: { of: 'von', read: 'gelesen', cont: 'Weiterlesen', start: 'Beginnen', done: 'Alles gelesen', missing: 'Diese Serie gibt es nicht.', back: 'Alle Blogs' },
  en: { of: 'of', read: 'read', cont: 'Continue', start: 'Start', done: 'All read', missing: 'This series does not exist.', back: 'All blogs' },
  ro: { of: 'din', read: 'citite', cont: 'Continuă', start: 'Începe', done: 'Totul citit', missing: 'Această serie nu există.', back: 'Toate blogurile' },
  ru: { of: 'из', read: 'прочитано', cont: 'Продолжить', start: 'Начать', done: 'Всё прочитано', missing: 'Такой серии нет.', back: 'Все блоги' },
} as const;

export default function SeriePage() {
  const { isAllowed, isChecking } = useRouteProtection();
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const lang = (['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de') as keyof typeof T;
  const t = T[lang];
  const ui = useUiSettings();
  const all = useBlogSeries();
  const seriesTitle = useSeriesTitle(all, lang);
  const { isRead } = useReadItems();
  const series = useMemo(() => all?.find((s) => s.id === id) ?? null, [all, id]);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!series || series.ids.length === 0) return;
    let alive = true;
    void (async () => {
      const sb = getSupabaseClient();
      const run = (cols: string) => sb.from('blog_posts').select(cols).in('id', series.ids).eq('published', true);
      let { data, error } = await run(COLUMNS);
      if (error) ({ data, error } = await run('id, slug, title'));
      if (alive && !error) setRows((data ?? []) as unknown as Row[]);
    })();
    return () => {
      alive = false;
    };
  }, [series]);

  const titleOf = useRowTitles(rows, lang);
  const ordered = useMemo(() => (series ? series.ids.map((i) => rows.find((r) => r.id === i)).filter((r): r is Row => Boolean(r)) : []), [series, rows]);

  if (isChecking || !isAllowed) return null;

  const readCount = ordered.filter((r) => isRead(`/blogs/${r.slug}`)).length;
  const next = ordered.find((r) => !isRead(`/blogs/${r.slug}`)) ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      {!ui.seriesProgress || (all && !series) ? (
        <div className="py-16 text-center">
          <p className="text-black/60 dark:text-white/60">{t.missing}</p>
          <Link href="/blogs" className="mt-4 inline-block text-sm underline">{t.back}</Link>
        </div>
      ) : (
        <>
          <p className="text-center font-cinzel text-xs font-semibold uppercase tracking-[0.3em] text-black/50 dark:text-white/50">Serie</p>
          <h1 className="mt-2 text-center font-cinzel text-3xl font-bold text-black dark:text-white">{series ? seriesTitle(series) || '\u00a0' : '\u00a0'}</h1>

          <div className="mt-6">
            <div className="flex items-baseline justify-between text-xs text-black/60 dark:text-white/60">
              <span>{readCount} {t.of} {ordered.length} {t.read}</span>
              <span className="tabular-nums">{ordered.length ? Math.round((readCount / ordered.length) * 100) : 0}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
              <div className="h-full rounded-full bg-black transition-all dark:bg-white" style={{ width: `${ordered.length ? (readCount / ordered.length) * 100 : 0}%` }} />
            </div>
          </div>

          {ordered.length > 0 && (
            <div className="mt-6 flex justify-center">
              {next ? (
                <Link href={`/blogs/${next.slug}`} className="btn-solid rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black">
                  {readCount > 0 ? t.cont : t.start}
                </Link>
              ) : (
                <span className="text-sm text-black/55 dark:text-white/55">{t.done} ✓</span>
              )}
            </div>
          )}

          <ol className="mt-8 divide-y divide-black/10 dark:divide-white/10">
            {ordered.map((r, i) => (
              <li key={r.id}>
                <Link href={`/blogs/${r.slug}`} className="flex items-center gap-3 px-2 py-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]">
                  <span className="w-6 shrink-0 text-right text-sm tabular-nums text-black/45 dark:text-white/45">{i + 1}</span>
                  <span className="min-w-0 flex-1 font-cinzel text-base font-semibold text-black dark:text-white">{titleOf(r)}</span>
                  <ReadTick href={`/blogs/${r.slug}`} />
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
