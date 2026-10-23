'use client';

// Arhiva blogurilor: an -> luna -> articole. Pentru cine nu vrea sa foloseasca
// „Blogs durchsuchen" si vrea sa rasfoiasca dupa data.

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import UpLink from '@/components/content/UpLink';
import BackToTopButton from '@/components/BackToTopButton';
import CategoryFilterBar from '@/components/CategoryFilterBar';
import { ReadTick } from '@/components/ReadMark';
import { useLanguage } from '@/hooks/useLanguage';
import { getSupabaseClient } from '@/lib/supabase';
import { matchesSelectedCategories } from '@/lib/categories';

interface Row {
  id: string;
  slug: string;
  title: string;
  created_at: string;
  category_ids?: string[] | null;
  [key: string]: unknown;
}

const LOCALES: Record<string, string> = { de: 'de-DE', en: 'en-GB', ro: 'ro-RO', ru: 'ru-RU' };

const TEXTS: Record<string, { title: string; back: string; empty: string; loading: string }> = {
  de: { title: 'Archiv', back: 'Zurück zu den Blogs', empty: 'Das Archiv ist noch leer.', loading: 'Wird geladen …' },
  en: { title: 'Archive', back: 'Back to Blogs', empty: 'The archive is still empty.', loading: 'Loading …' },
  ro: { title: 'Arhivă', back: 'Înapoi la Bloguri', empty: 'Arhiva este încă goală.', loading: 'Se încarcă …' },
  ru: { title: 'Архив', back: 'Назад к блогам', empty: 'Архив пока пуст.', loading: 'Загрузка …' },
};

export default function BlogArchive() {
  const { language } = useLanguage();
  const lang = ['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de';
  const t = TEXTS[lang];

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      // `select('*')` ca la restul listelor: coloanele cu traduceri pot lipsi.
      const { data } = await getSupabaseClient()
        .from('blog_posts')
        .select('id, slug, title, title_de, title_en, title_ro, title_ru, created_at, category_ids')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(2000);
      if (!alive) return;
      setRows((data ?? []) as unknown as Row[]);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const tree = useMemo(() => {
    const years = new Map<number, Map<number, Row[]>>();
    rows
      .filter((r) => matchesSelectedCategories(r.category_ids ?? null, categoryIds))
      .forEach((r) => {
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
  }, [rows, categoryIds]);

  const monthName = (m: number) =>
    new Date(2000, m, 1).toLocaleDateString(LOCALES[lang], { month: 'long' });
  const titleOf = (r: Row) => {
    const mine = r[`title_${lang}`];
    return typeof mine === 'string' && mine.trim() ? mine : r.title;
  };

  return (
    <div className="min-h-screen py-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <UpLink
          href="/blogs"
          className="mb-4 inline-block text-sm text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          ← {t.back}
        </UpLink>

        <h1 className="mb-6 text-center font-cinzel text-2xl font-bold text-black dark:text-white sm:text-3xl">
          {t.title}
        </h1>

        <CategoryFilterBar value={categoryIds} onChange={setCategoryIds} table="blog_posts" className="mb-6" />

        {loading ? (
          <p className="text-center text-black/50 dark:text-white/50">{t.loading}</p>
        ) : tree.length === 0 ? (
          <p className="text-center text-black/60 dark:text-white/60">{t.empty}</p>
        ) : (
          <div className="space-y-3">
            {tree.map(({ year, months }, yi) => (
              <details key={year} open={yi === 0} className="rounded-2xl border border-black/10 dark:border-white/10">
                <summary className="cursor-pointer select-none px-4 py-3 font-cinzel text-lg font-bold text-black dark:text-white">
                  {year}
                </summary>
                <div className="space-y-2 px-2 pb-3">
                  {months.map(([month, list], mi) => (
                    <details key={month} open={yi === 0 && mi === 0}>
                      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold capitalize text-black/80 dark:text-white/80">
                        {monthName(month)} <span className="text-black/40 dark:text-white/40">({list.length})</span>
                      </summary>
                      <ul className="divide-y divide-black/10 dark:divide-white/10">
                        {list.map((r) => (
                          <li key={r.id}>
                            <Link
                              href={`/blogs/${r.slug}`}
                              className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                            >
                              <span className="w-8 shrink-0 text-right text-sm tabular-nums text-black/45 dark:text-white/45">
                                {new Date(r.created_at).getDate()}
                              </span>
                              <span className="min-w-0 flex-1 truncate font-cinzel text-base font-semibold text-black dark:text-white">
                                {titleOf(r)}
                              </span>
                              <ReadTick href={`/blogs/${r.slug}`} />
                              <span aria-hidden="true" className="shrink-0 text-black/30 dark:text-white/30">
                                ›
                              </span>
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
      <BackToTopButton />
    </div>
  );
}
