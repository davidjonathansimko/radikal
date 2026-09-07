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
import TrailPills from '@/components/content/TrailPills';
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
    backTo: 'Zurück zu',
    home: 'Startseite',
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
    backTo: 'Back to',
    home: 'Home',
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
    backTo: 'Înapoi la',
    home: 'Pagina principală',
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
    backTo: 'Назад к',
    home: 'Главная',
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
    const withText = rows.map((r) => ({
      row: r,
      title: pickContentText(r, 'title', lang),
      excerpt: pickContentText(r, 'excerpt', lang),
    }));
    return withText.sort((a, b) => {
      const da = new Date(a.row.created_at ?? 0).getTime();
      const db = new Date(b.row.created_at ?? 0).getTime();
      return db - da;
    });
  }, [rows, lang]);

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
        {/* Pasul 0809002 — drumul, adunat în pastile cu ✕. */}
        <TrailPills
          steps={section ? [...trail.map((s) => ({ slug: s.slug, name: s.name })), { slug: section.slug, name: section.name }] : []}
          rootHref={def.basePath}
          rootLabel={def.title[lang] || def.title.de}
          hrefFor={(s) => `${def.basePath}/${s}`}
        />

        <header className="mb-6 text-center">
          <h1 className="font-cinzel text-3xl font-bold text-black dark:text-white sm:text-4xl">
            {section ? section.name : def.title[lang] || def.title.de}
          </h1>
          {!section && (
            <p className="mx-auto mt-3 max-w-2xl text-black/70 dark:text-white/70">
              {def.intro[lang] || def.intro.de}
            </p>
          )}
        </header>

        {/* Căutarea rămâne la vedere cât timp cobori prin listă. */}
        <div className="sticky top-14 z-20 -mx-4 mb-5 bg-white/85 px-4 py-2 backdrop-blur-md dark:bg-black/85 sm:-mx-6 sm:px-6 lg:top-20">
          <div className="flex justify-center">
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
        </div>

        {/* Pasul 0809002 — rubricile: chipuri două pe rând la primul nivel,
            apoi părți, ca un cuprins. */}
        {sections.length > 0 && (
          trail.length === 0 && !section ? (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {sections.map((s, i) => (
                <Link
                  key={s.id}
                  href={`${def.basePath}/${s.slug}`}
                  className="flex flex-col gap-2 rounded-xl border border-black/10 p-3 transition-colors hover:bg-black/[0.04] dark:border-white/10 dark:hover:bg-white/[0.06]"
                >
                  <span className="flex aspect-square items-center justify-center rounded-lg bg-black/[0.05] font-cinzel text-2xl font-bold text-black/25 dark:bg-white/[0.06] dark:text-white/25">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-cinzel text-sm font-semibold leading-tight text-black dark:text-white">
                    {s.name}
                  </span>
                  {s.description && (
                    <span className="line-clamp-1 text-[11px] text-black/50 dark:text-white/50">
                      {s.description}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <ul className="mb-8 divide-y divide-black/10 overflow-hidden rounded-2xl border border-black/10 dark:divide-white/10 dark:border-white/10">
              {sections.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`${def.basePath}/${s.slug}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  >
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-black/35 dark:text-white/35"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      aria-hidden="true"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                      <path d="M14 2v6h6" />
                    </svg>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-cinzel text-base font-semibold text-black dark:text-white">
                        {s.name}
                      </span>
                      {s.description && (
                        <span className="mt-0.5 line-clamp-1 block text-xs text-black/50 dark:text-white/50">
                          {s.description}
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
          )
        )}

        {loading ? (
          <p className="text-center text-black/50 dark:text-white/50">{t.loading}</p>
        ) : visible.length === 0 ? (
          // Rubrica poate avea doar rubrici in ea — atunci mesajul nu are rost.
          sections.length === 0 ? (
            <p className="glass-effect rounded-2xl p-8 text-center text-black/70 dark:text-white/70">
              {t.empty}
            </p>
          ) : null
        ) : (
          <ul className="divide-y divide-black/10 overflow-hidden rounded-2xl border border-black/10 dark:divide-white/10 dark:border-white/10">
            {visible.map(({ row, title, excerpt }) => (
              <li key={row.id}>
                <Link
                  href={`${def.itemPath}/${row.slug}`}
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
