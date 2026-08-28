'use client';

// Pasul 2708018 — pagina unei rubrici noi („Tägliche Andacht", „Pentru copii").
// Aceeași componentă pentru amândouă; ce diferă vine din `kind`.
// Dacă pagina este oprită din Setări → Pagini, vizitatorul nu vede nimic.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import BackToTopButton from '@/components/BackToTopButton';
import BlogBrowse from '@/components/BlogBrowse';
import { CONTENT_ITEMS_TABLE, CONTENT_KINDS, type ContentKind } from '@/lib/contentKinds';
import {
  fetchChildSections,
  fetchItems,
  fetchRootSections,
  fetchSectionBySlug,
  fetchTrail,
  pickContentText,
  type ContentItemRow,
  type PublicSection,
} from '@/lib/contentPublic';
import { fetchEnabledPages } from '@/lib/pageSettings';

type SortKey = 'newest' | 'oldest' | 'az';

const T: Record<string, Record<string, string>> = {
  de: {
    loading: 'Wird geladen …',
    empty: 'Hier gibt es noch nichts.',
    search: 'Suchen …',
    newest: 'Neueste zuerst',
    oldest: 'Älteste zuerst',
    az: 'A → Z',
    read: 'Weiterlesen',
    sections: 'Rubriken',
    all: 'Alle Beiträge',
    results: 'Gefunden',
    browse: 'Beiträge durchsuchen',
    notFound: 'Diese Rubrik gibt es nicht.',
  },
  en: {
    loading: 'Loading …',
    empty: 'There is nothing here yet.',
    search: 'Search …',
    newest: 'Newest first',
    oldest: 'Oldest first',
    az: 'A → Z',
    read: 'Read more',
    sections: 'Sections',
    all: 'All posts',
    results: 'Found',
    browse: 'Browse posts',
    notFound: 'This section does not exist.',
  },
  ro: {
    loading: 'Se încarcă …',
    empty: 'Aici nu există încă nimic.',
    search: 'Caută …',
    newest: 'Cele mai noi',
    oldest: 'Cele mai vechi',
    az: 'A → Z',
    read: 'Citește mai departe',
    sections: 'Rubrici',
    all: 'Toate articolele',
    results: 'Găsite',
    browse: 'Răsfoiește articolele',
    notFound: 'Această rubrică nu există.',
  },
  ru: {
    loading: 'Загрузка …',
    empty: 'Здесь пока ничего нет.',
    search: 'Поиск …',
    newest: 'Сначала новые',
    oldest: 'Сначала старые',
    az: 'A → Z',
    read: 'Читать далее',
    sections: 'Рубрики',
    all: 'Все записи',
    results: 'Найдено',
    browse: 'Просмотр записей',
    notFound: 'Такой рубрики нет.',
  },
};

export default function ContentListPage({
  kind,
  sectionSlug,
}: {
  kind: ContentKind;
  /** Gol = pagina principală a rubricii. Altfel, o rubrică anume. */
  sectionSlug?: string;
}) {
  const def = CONTENT_KINDS[kind];
  const router = useRouter();
  const { language } = useLanguage();
  const lang = ['ro', 'de', 'en', 'ru'].includes(language) ? language : 'de';
  const t = T[lang];

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [sections, setSections] = useState<PublicSection[]>([]);
  const [section, setSection] = useState<PublicSection | null>(null);
  const [trail, setTrail] = useState<PublicSection[]>([]);
  const [missing, setMissing] = useState(false);
  const [rows, setRows] = useState<ContentItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');

  // Pagina oprită = vizitatorul e trimis acasă.
  useEffect(() => {
    let alive = true;
    fetchEnabledPages().then((on) => {
      if (!alive) return;
      const ok = on.has(kind);
      setAllowed(ok);
      if (!ok) router.replace('/');
    });
    return () => {
      alive = false;
    };
  }, [kind, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (sectionSlug) {
        const sec = await fetchSectionBySlug(kind, sectionSlug, lang);
        if (!sec) {
          setMissing(true);
          return;
        }
        setSection(sec);
        setSections(await fetchChildSections(sec.id, lang));
        setTrail(await fetchTrail(sec, lang));
        setRows(await fetchItems(kind, sec.id));
      } else {
        setSections(await fetchRootSections(kind, lang));
        setRows(await fetchItems(kind));
      }
    } finally {
      setLoading(false);
    }
  }, [kind, sectionSlug, lang]);

  useEffect(() => {
    if (allowed) void load();
  }, [allowed, load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const withText = rows.map((r) => ({
      row: r,
      title: pickContentText(r, 'title', lang),
      excerpt: pickContentText(r, 'excerpt', lang),
      content: pickContentText(r, 'content', lang),
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
  }, [rows, search, sort, lang]);

  const field =
    'rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:focus:border-white/40 transition-colors';

  if (allowed === null || allowed === false) return null;

  if (missing) {
    return (
      <div className="min-h-screen py-20 text-center">
        <p className="text-black/70 dark:text-white/70">{t.notFound}</p>
        <Link href={def.basePath} className="mt-4 inline-block text-black/60 underline dark:text-white/60">
          ← {def.title[lang] || def.title.de}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {sectionSlug && (
          <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-black/50 dark:text-white/50">
            <Link href={def.basePath} className="transition-colors hover:text-black dark:hover:text-white">
              {def.title[lang] || def.title.de}
            </Link>
            {trail.map((p) => (
              <span key={p.slug} className="flex items-center gap-1">
                <span className="opacity-50">›</span>
                <Link
                  href={`${def.basePath}/${p.slug}`}
                  className="transition-colors hover:text-black dark:hover:text-white"
                >
                  {p.name}
                </Link>
              </span>
            ))}
          </nav>
        )}

        <header className="mb-10 text-center">
          <h1 className="font-cinzel text-3xl font-bold text-black dark:text-white sm:text-4xl">
            {section ? section.name : def.title[lang] || def.title.de}
          </h1>
          {!section && (
            <p className="mx-auto mt-3 max-w-2xl text-black/70 dark:text-white/70">
              {def.intro[lang] || def.intro.de}
            </p>
          )}
        </header>

        <div className="mb-6 flex justify-center">
          <BlogBrowse
            table={CONTENT_ITEMS_TABLE}
            basePath={def.itemPath}
            browseLabel={{
              ro: T.ro.browse,
              de: T.de.browse,
              en: T.en.browse,
              ru: T.ru.browse,
            }}
          />
        </div>

        {sections.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-4 text-center text-lg font-bold text-black dark:text-white">
              {t.sections}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {sections.map((s) => (
                <Link
                  key={s.id}
                  href={`${def.basePath}/${s.slug}`}
                  className="glass-effect rounded-2xl p-5 transition-transform hover:scale-[1.02]"
                >
                  <p className="font-cinzel text-lg font-bold text-black dark:text-white">{s.name}</p>
                  {s.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-black/60 dark:text-white/60">
                      {s.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

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
            {t.empty}
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
                    href={`${def.itemPath}/${row.slug}`}
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
