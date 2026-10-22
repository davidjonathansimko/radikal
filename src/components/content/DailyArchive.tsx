'use client';

// Pasul 2210004 — arhiva: an -> luna -> zi, dupa data textelor.

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import BackToTopButton from '@/components/BackToTopButton';
import CategoryFilterBar from '@/components/CategoryFilterBar';
import { CONTENT_KINDS, type ContentKind } from '@/lib/contentKinds';
import { fetchItems, pickContentText, type ContentItemRow } from '@/lib/contentPublic';
import { fetchEnabledPages } from '@/lib/pageSettings';
import { matchesSelectedCategories } from '@/lib/categories';
import { usePageText } from '@/lib/pageContent';
import { ANDACHT_TEXTS, COPII_TEXTS } from '@/lib/pageTexts/daily';

const LOCALES: Record<string, string> = { de: 'de-DE', en: 'en-GB', ro: 'ro-RO', ru: 'ru-RU' };

export default function DailyArchive({ kind }: { kind: ContentKind }) {
  const def = CONTENT_KINDS[kind];
  const router = useRouter();
  const { language } = useLanguage();
  const lang = ['ro', 'de', 'en', 'ru'].includes(language) ? language : 'de';
  const t = usePageText(kind, kind === 'andacht' ? ANDACHT_TEXTS : COPII_TEXTS, language) as Record<string, string>;

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<ContentItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    fetchEnabledPages().then(async (on) => {
      if (!alive) return;
      const ok = on.has(kind);
      setAllowed(ok);
      if (!ok) {
        router.replace('/');
        return;
      }
      const items = await fetchItems(kind);
      if (!alive) return;
      setRows(items);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [kind, router]);

  // an -> luna (0-11) -> articole
  const tree = useMemo(() => {
    const years = new Map<number, Map<number, ContentItemRow[]>>();
    rows
      .filter((r) => matchesSelectedCategories(r.category_ids as string[] | null, categoryIds))
      .forEach((r) => {
        const d = new Date(r.created_at ?? 0);
        const months = years.get(d.getFullYear()) ?? new Map<number, ContentItemRow[]>();
        const list = months.get(d.getMonth()) ?? [];
        list.push(r);
        months.set(d.getMonth(), list);
        years.set(d.getFullYear(), months);
      });
    return [...years.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, months]) => ({
        year,
        months: [...months.entries()].sort((a, b) => b[0] - a[0]),
      }));
  }, [rows, categoryIds]);

  if (allowed === null || allowed === false) return null;

  const monthName = (m: number) =>
    new Date(2000, m, 1).toLocaleDateString(LOCALES[lang] ?? 'de-DE', { month: 'long' });

  return (
    <div className="min-h-screen py-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <Link
          href={def.basePath}
          className="mb-4 inline-block text-sm text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          ← {t.back}
        </Link>

        <h1 className="mb-6 text-center font-cinzel text-2xl font-bold text-black dark:text-white sm:text-3xl">
          {t.archiveTitle}
        </h1>

        <CategoryFilterBar value={categoryIds} onChange={setCategoryIds} className="mb-6" />

        {loading ? (
          <p className="text-center text-black/50 dark:text-white/50">{t.loading}</p>
        ) : tree.length === 0 ? (
          <p className="text-center text-black/60 dark:text-white/60">{t.archiveEmpty}</p>
        ) : (
          <div className="space-y-3">
            {tree.map(({ year, months }, yi) => (
              <details
                key={year}
                open={yi === 0}
                className="rounded-2xl border border-black/10 dark:border-white/10"
              >
                <summary className="cursor-pointer select-none px-4 py-3 font-cinzel text-lg font-bold text-black dark:text-white">
                  {year}
                </summary>
                <div className="space-y-2 px-2 pb-3">
                  {months.map(([month, list], mi) => (
                    <details key={month} open={yi === 0 && mi === 0} className="rounded-xl">
                      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold capitalize text-black/80 dark:text-white/80">
                        {monthName(month)} <span className="text-black/40 dark:text-white/40">({list.length})</span>
                      </summary>
                      <ul className="divide-y divide-black/10 dark:divide-white/10">
                        {list.map((row) => (
                          <li key={row.id}>
                            <Link
                              href={`${def.itemPath}/${row.slug}`}
                              className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                            >
                              <span className="w-8 shrink-0 text-right text-sm tabular-nums text-black/45 dark:text-white/45">
                                {new Date(row.created_at ?? 0).getDate()}
                              </span>
                              <span className="min-w-0 flex-1 truncate font-cinzel text-base font-semibold text-black dark:text-white">
                                {pickContentText(row, 'title', lang)}
                              </span>
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
