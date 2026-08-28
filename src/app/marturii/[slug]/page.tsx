// Pagina unei rubrici de mărturii — pasul 2608005 (pasul 3)
//
// Arată mărturiile publicate din rubrica aleasă, cele mai noi întâi.
// Se poate căuta după cuvânt și sorta după dată sau alfabetic.

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { getSupabaseClient } from '@/lib/supabase';
import BackToTopButton from '@/components/BackToTopButton';
import BlogBrowse from '@/components/BlogBrowse';
import { pickTestimonyText, type TestimonyRow } from '@/lib/testimonies';

type Lang = 'ro' | 'de' | 'en' | 'ru';

const T: Record<Lang, Record<string, string>> = {
  de: {
    loading: 'Wird geladen …',
    empty: 'In dieser Rubrik gibt es noch keine Zeugnisse.',
    search: 'In den Zeugnissen suchen …',
    newest: 'Neueste zuerst',
    oldest: 'Älteste zuerst',
    az: 'A → Z',
    read: 'Weiterlesen',
    back: 'Zurück zu den Zeugnissen',
    notFound: 'Diese Rubrik gibt es nicht.',
    home: 'Startseite',
    results: 'Gefunden',
  },
  en: {
    loading: 'Loading …',
    empty: 'There are no testimonies in this section yet.',
    search: 'Search the testimonies …',
    newest: 'Newest first',
    oldest: 'Oldest first',
    az: 'A → Z',
    read: 'Read more',
    back: 'Back to testimonies',
    notFound: 'This section does not exist.',
    home: 'Home',
    results: 'Found',
  },
  ro: {
    loading: 'Se încarcă …',
    empty: 'În această rubrică nu există încă nicio mărturie.',
    search: 'Caută în mărturii …',
    newest: 'Cele mai noi',
    oldest: 'Cele mai vechi',
    az: 'A → Z',
    read: 'Citește mai departe',
    back: 'Înapoi la mărturii',
    notFound: 'Această rubrică nu există.',
    home: 'Pagina principală',
    results: 'Găsite',
  },
  ru: {
    loading: 'Загрузка …',
    empty: 'В этой рубрике пока нет свидетельств.',
    search: 'Поиск в свидетельствах …',
    newest: 'Сначала новые',
    oldest: 'Сначала старые',
    az: 'А → Я',
    read: 'Читать дальше',
    back: 'Назад к свидетельствам',
    notFound: 'Такой рубрики нет.',
    home: 'Главная',
    results: 'Найдено',
  },
};

type SortKey = 'newest' | 'oldest' | 'az';

export default function SectionPage() {
  const params = useParams();
  const slug = String(params?.slug ?? '');
  const { language } = useLanguage();
  const lang = (['ro', 'de', 'en', 'ru'].includes(language) ? language : 'de') as Lang;
  const t = T[lang];

  const [sectionName, setSectionName] = useState('');
  const [sectionMissing, setSectionMissing] = useState(false);
  const [children, setChildren] = useState<{ id: string; slug: string; name: string; description: string | null }[]>([]);
  const [trail, setTrail] = useState<{ slug: string; name: string }[]>([]);
  const [rows, setRows] = useState<TestimonyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = getSupabaseClient();

      // O rubrică din interiorul alteia poate purta acelaşi nume ca una din
      // altă parte. Când se întâmplă, alegem întâi rubrica principală.
      const { data: found } = await sb
        .from('testimony_sections')
        .select('*')
        .eq('slug', slug)
        .limit(5);

      const list = (found || []) as unknown as Record<string, unknown>[];
      const sec = list.find((r) => !r.parent_id) ?? list[0];

      if (!sec) {
        setSectionMissing(true);
        return;
      }

      const pickName = (r: Record<string, unknown>) =>
        ((r[`name_${lang}`] as string) || (r.name_ro as string) || '').trim();

      setSectionName(pickName(sec));

      // Pasul 2708015 — rubricile aflate ÎN această rubrică.
      const { data: kids } = await sb
        .from('testimony_sections')
        .select('id, slug, name_ro, name_de, name_en, name_ru, description_ro, description_de, description_en, description_ru')
        .eq('parent_id', sec.id as string)
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      setChildren(
        ((kids || []) as unknown as Record<string, unknown>[]).map((r) => ({
          id: r.id as string,
          slug: r.slug as string,
          name: pickName(r),
          description: ((r[`description_${lang}`] as string) || (r.description_ro as string) || null),
        })),
      );

      // Drumul până aici, ca cititorul să ştie unde se află.
      const path: { slug: string; name: string }[] = [];
      let parent = sec.parent_id as string | null | undefined;
      for (let i = 0; parent && i < 12; i += 1) {
        const { data: p } = await sb
          .from('testimony_sections')
          .select('slug, parent_id, name_ro, name_de, name_en, name_ru')
          .eq('id', parent)
          .maybeSingle();
        if (!p) break;
        const pr = p as unknown as Record<string, unknown>;
        path.unshift({ slug: pr.slug as string, name: pickName(pr) });
        parent = pr.parent_id as string | null;
      }
      setTrail(path);

      const { data } = await sb
        .from('testimonies')
        .select('*')
        .eq('published', true)
        .contains('section_ids', [sec.id as string])
        .order('created_at', { ascending: false });

      setRows((data || []) as unknown as TestimonyRow[]);
    } finally {
      setLoading(false);
    }
  }, [slug, lang]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    const withText = rows.map((r) => ({
      row: r,
      title: pickTestimonyText(r, 'title', lang),
      excerpt: pickTestimonyText(r, 'excerpt', lang),
      content: pickTestimonyText(r, 'content', lang),
    }));

    const filtered = q
      ? withText.filter((x) =>
          `${x.title} ${x.excerpt} ${x.content}`.toLowerCase().includes(q),
        )
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

  if (sectionMissing) {
    return (
      <div className="min-h-screen py-20 text-center">
        <p className="text-black/70 dark:text-white/70">{t.notFound}</p>
        <Link href="/marturii" className="mt-4 inline-block text-black/60 underline dark:text-white/60">
          ← {t.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Pasul 2708022 — un singur buton, care spune unde te duce. */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href={trail.length > 0 ? `/marturii/${trail[trail.length - 1].slug}` : '/marturii'}
            className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2 text-sm text-black/70 transition-colors hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
          >
            <span aria-hidden="true">←</span>
            {trail.length > 0 ? trail[trail.length - 1].name : t.back}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2 text-sm text-black/70 transition-colors hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
          >
            <span aria-hidden="true">←</span>
            {t.home}
          </Link>
        </div>

        <header className="mb-10 text-center">
          <h1 className="font-cinzel text-3xl font-bold text-black dark:text-white sm:text-4xl">
            {sectionName}
          </h1>
        </header>

        {/* Rubricile aflate în această rubrică */}
        {children.length > 0 && (
          <div className="mb-10 grid gap-4 sm:grid-cols-2">
            {children.map((c) => (
              <Link
                key={c.id}
                href={`/marturii/${c.slug}`}
                className="glass-effect rounded-2xl p-5 transition-transform hover:scale-[1.02]"
              >
                <p className="font-cinzel text-lg font-bold text-black dark:text-white">{c.name}</p>
                {c.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-black/60 dark:text-white/60">
                    {c.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Pasul 2708002 — rasfoire alfabetica / dupa data, prin toate marturiile */}
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

        {/* Căutare + sortare */}
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
            <div className="grid gap-5">
              {visible.map(({ row, title, excerpt }) => (
                <Link
                  key={row.id}
                  href={`/marturii/m/${row.slug}`}
                  className="glass-effect group grid gap-4 rounded-2xl p-5 transition-transform duration-300 hover:scale-[1.01] sm:grid-cols-[160px_1fr]"
                >
                  {row.image_url ? (
                    <div className="relative h-32 w-full overflow-hidden rounded-xl sm:h-full">
                      <Image
                        src={row.image_url}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 160px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="hidden sm:block" />
                  )}

                  <div className="min-w-0">
                    <h2 className="font-cinzel text-xl font-semibold text-black dark:text-white">
                      {title}
                    </h2>
                    {excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-black/70 dark:text-white/70">
                        {excerpt}
                      </p>
                    )}
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-black/60 dark:text-white/60">
                      {t.read}
                      <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="mt-14 text-center">
          <Link
            href="/marturii"
            className="text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            ← {t.back}
          </Link>
        </div>
      </div>

      <BackToTopButton />
    </div>
  );
}
