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
    }));

    return withText.sort((a, b) => {
      const da = new Date(a.row.created_at ?? 0).getTime();
      const db = new Date(b.row.created_at ?? 0).getTime();
      return db - da;
    });
  }, [rows, lang, year, month]);

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

        {/* Pasul 0409b — o singură căutare, ținută la vedere cât cobori. */}
        <div className="sticky top-14 z-20 -mx-4 mb-5 bg-white/85 px-4 py-2 backdrop-blur-md dark:bg-black/85 sm:-mx-6 sm:px-6 lg:top-20">
          <div className="flex justify-center">
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
        </div>

        {loading ? (
          <p className="text-center text-black/50 dark:text-white/50">{t.loading}</p>
        ) : visible.length === 0 ? (
          <p className="glass-effect rounded-2xl p-8 text-center text-black/70 dark:text-white/70">
            {year && month ? t.emptyMonth : t.empty}
          </p>
        ) : (
          <ul className="divide-y divide-black/10 overflow-hidden rounded-2xl border border-black/10 dark:divide-white/10 dark:border-white/10">
            {visible.map(({ row, title, excerpt }) => (
              <li key={row.id}>
                <Link
                  href={`/marturii/m/${row.slug}`}
                  className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  {row.image_url && (
                    <span className="relative hidden h-12 w-16 shrink-0 overflow-hidden rounded-lg sm:block">
                      <Image src={row.image_url} alt="" fill className="object-cover" sizes="64px" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-cinzel text-base font-semibold text-black dark:text-white">
                      {title}
                    </span>
                    {excerpt && (
                      <span className="mt-0.5 line-clamp-1 block text-xs text-black/55 dark:text-white/55">
                        {excerpt}
                      </span>
                    )}
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-black/30 dark:text-white/30">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
