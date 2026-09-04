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
    const withText = rows.map((r) => ({
      row: r,
      title: pickTestimonyText(r, 'title', lang),
      excerpt: pickTestimonyText(r, 'excerpt', lang),
    }));
    return withText.sort((a, b) => {
      const da = new Date(a.row.created_at ?? 0).getTime();
      const db = new Date(b.row.created_at ?? 0).getTime();
      return db - da;
    });
  }, [rows, lang]);

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
        {/* Pasul 0409b — DRUMUL, pe un singur rând. */}
        <nav aria-label="Drum" className="mb-5 flex flex-wrap items-center gap-1.5 text-sm">
          <Link
            href="/"
            className="text-black/50 transition-colors hover:text-black dark:text-white/50 dark:hover:text-white"
          >
            {t.home}
          </Link>
          <span aria-hidden="true" className="text-black/25 dark:text-white/25">›</span>
          <Link
            href="/marturii"
            className="text-black/50 transition-colors hover:text-black dark:text-white/50 dark:hover:text-white"
          >
            {t.back}
          </Link>
          {trail.map((s) => (
            <React.Fragment key={s.slug}>
              <span aria-hidden="true" className="text-black/25 dark:text-white/25">›</span>
              <Link
                href={`/marturii/${s.slug}`}
                className="text-black/50 transition-colors hover:text-black dark:text-white/50 dark:hover:text-white"
              >
                {s.name}
              </Link>
            </React.Fragment>
          ))}
          <span aria-hidden="true" className="text-black/25 dark:text-white/25">›</span>
          <span className="font-medium text-black dark:text-white">{sectionName}</span>
        </nav>

        <header className="mb-6 text-center">
          <h1 className="font-cinzel text-3xl font-bold text-black dark:text-white sm:text-4xl">
            {sectionName}
          </h1>
        </header>

        {/* Pasul 2708002 — rasfoire alfabetica / dupa data, prin toate marturiile.
            Ramane la vedere cat timp cobori prin lista. */}
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

        {/* Rubricile dinăuntru, ca file pe un singur rând */}
        {children.length > 0 && (
          <div className="scrollbar-hide mb-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
            {children.map((c) => (
              <Link
                key={c.id}
                href={`/marturii/${c.slug}`}
                title={c.description || undefined}
                className="flex-shrink-0 whitespace-nowrap rounded-full border border-black/15 px-4 py-1.5 text-sm text-black/70 transition-colors hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-center text-black/50 dark:text-white/50">{t.loading}</p>
        ) : visible.length === 0 ? (
          /* Pasul 2708023 — dacă rubrica are doar rubrici în ea, e firesc să nu
             aibă și mărturii. Mesajul „nu există nimic" ar fi doar zgomot. */
          children.length === 0 ? (
            <p className="glass-effect rounded-2xl p-8 text-center text-black/70 dark:text-white/70">
              {t.empty}
            </p>
          ) : null
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
                      <Image src={row.image_url} alt="" fill sizes="64px" className="object-cover" />
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
