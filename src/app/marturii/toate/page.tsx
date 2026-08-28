// Toate mărturiile la un loc — pasul 2708017.
// Aici ajunge meniul: „Toate" sau o lună anume. Rubricile nu contează aici,
// e lista întreagă, ca la bloguri.

'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { getSupabaseClient } from '@/lib/supabase';
import BackToTopButton from '@/components/BackToTopButton';
import BlogBrowse from '@/components/BlogBrowse';
import { pickTestimonyText, type TestimonyRow } from '@/lib/testimonies';

type Lang = 'ro' | 'de' | 'en' | 'ru';
type SortKey = 'newest' | 'oldest' | 'az';

const T: Record<Lang, Record<string, string>> = {
  de: {
    title: 'Alle Zeugnisse',
    loading: 'Wird geladen …',
    empty: 'Es gibt noch keine Zeugnisse.',
    emptyMonth: 'In diesem Monat gibt es keine Zeugnisse.',
    search: 'In den Zeugnissen suchen …',
    newest: 'Neueste zuerst',
    oldest: 'Älteste zuerst',
    az: 'A → Z',
    read: 'Weiterlesen',
    back: 'Zurück zu den Zeugnissen',
    results: 'Gefunden',
    clear: 'Ganze Liste zeigen',
  },
  en: {
    title: 'All testimonies',
    loading: 'Loading …',
    empty: 'There are no testimonies yet.',
    emptyMonth: 'No testimonies in this month.',
    search: 'Search the testimonies …',
    newest: 'Newest first',
    oldest: 'Oldest first',
    az: 'A → Z',
    read: 'Read more',
    back: 'Back to testimonies',
    results: 'Found',
    clear: 'Show the whole list',
  },
  ro: {
    title: 'Toate mărturiile',
    loading: 'Se încarcă …',
    empty: 'Nu există încă nicio mărturie.',
    emptyMonth: 'În luna asta nu există nicio mărturie.',
    search: 'Caută în mărturii …',
    newest: 'Cele mai noi',
    oldest: 'Cele mai vechi',
    az: 'A → Z',
    read: 'Citește mai departe',
    back: 'Înapoi la mărturii',
    results: 'Găsite',
    clear: 'Arată lista întreagă',
  },
  ru: {
    title: 'Все свидетельства',
    loading: 'Загрузка …',
    empty: 'Свидетельств пока нет.',
    emptyMonth: 'В этом месяце свидетельств нет.',
    search: 'Поиск в свидетельствах …',
    newest: 'Сначала новые',
    oldest: 'Сначала старые',
    az: 'A → Z',
    read: 'Читать далее',
    back: 'Назад к свидетельствам',
    results: 'Найдено',
    clear: 'Показать весь список',
  },
};

function MarturiiToateInner() {
  const { language } = useLanguage();
  const params = useSearchParams();
  const lang: Lang = (['ro', 'de', 'en', 'ru'] as const).includes(language as Lang)
    ? (language as Lang)
    : 'de';
  const t = T[lang];

  const year = Number(params.get('year')) || null;
  const month = Number(params.get('month')) || null;

  const [rows, setRows] = useState<TestimonyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getSupabaseClient()
        .from('testimonies')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });
      setRows((data || []) as unknown as TestimonyRow[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    let base = rows;
    if (year && month) {
      base = rows.filter((r) => {
        const d = new Date(r.created_at ?? 0);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
    }

    const withText = base.map((r) => ({
      row: r,
      title: pickTestimonyText(r, 'title', lang),
      excerpt: pickTestimonyText(r, 'excerpt', lang),
      content: pickTestimonyText(r, 'content', lang),
    }));

    const filtered = q
      ? withText.filter((x) => `${x.title} ${x.excerpt} ${x.content}`.toLowerCase().includes(q))
      : withText;

    const sorted = [...filtered];
    if (sort === 'az') {
      sorted.sort((a, b) => a.title.localeCompare(b.title, lang));
    } else {
      sorted.sort((a, b) => {
        const da = new Date(a.row.created_at ?? 0).getTime();
        const db = new Date(b.row.created_at ?? 0).getTime();
        return sort === 'newest' ? db - da : da - db;
      });
    }
    return sorted;
  }, [rows, search, sort, lang, year, month]);

  const field =
    'rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:focus:border-white/40 transition-colors';

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/marturii"
          className="mb-6 inline-block text-sm text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          ← {t.back}
        </Link>

        <header className="mb-8 text-center">
          <h1 className="font-cinzel text-3xl font-bold text-black dark:text-white sm:text-4xl">
            {t.title}
          </h1>
          {year && month && (
            <Link
              href="/marturii/toate"
              className="mt-2 inline-block text-xs text-black/50 underline dark:text-white/50"
            >
              {t.clear}
            </Link>
          )}
        </header>

        <div className="mb-6 flex justify-center">
          <BlogBrowse
            table="testimonies"
            basePath="/marturii/m"
            browseLabel={{
              ro: 'Răsfoiește Mărturii',
              de: 'Zeugnisse durchsuchen',
              en: 'Browse Testimonies',
              ru: 'Просмотр свидетельств',
            }}
          />
        </div>

        <div className="mb-8 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className={field}
          />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={field}>
            <option value="newest">{t.newest}</option>
            <option value="oldest">{t.oldest}</option>
            <option value="az">{t.az}</option>
          </select>
        </div>

        {loading ? (
          <p className="text-center text-black/50 dark:text-white/50">{t.loading}</p>
        ) : visible.length === 0 ? (
          <p className="glass-effect rounded-2xl p-8 text-center text-black/70 dark:text-white/70">
            {year && month ? t.emptyMonth : t.empty}
          </p>
        ) : (
          <>
            {search.trim() && (
              <p className="mb-4 text-xs text-black/50 dark:text-white/50">
                {t.results}: {visible.length}
              </p>
            )}
            <ul className="grid gap-4">
              {visible.map(({ row, title, excerpt }) => (
                <li key={row.id}>
                  <Link
                    href={`/marturii/m/${row.slug}`}
                    className="glass-effect flex gap-4 rounded-2xl p-4 transition-transform hover:scale-[1.01]"
                  >
                    {row.image_url && (
                      <span className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-xl sm:block">
                        <Image src={row.image_url} alt="" fill className="object-cover" sizes="112px" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block font-cinzel text-lg font-bold text-black dark:text-white">
                        {title}
                      </span>
                      {excerpt && (
                        <span className="mt-1 line-clamp-2 block text-sm text-black/60 dark:text-white/60">
                          {excerpt}
                        </span>
                      )}
                      <span className="mt-2 block text-xs text-black/45 dark:text-white/45">
                        {t.read} →
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <BackToTopButton />
    </div>
  );
}

export default function MarturiiToatePage() {
  return (
    <Suspense fallback={null}>
      <MarturiiToateInner />
    </Suspense>
  );
}
