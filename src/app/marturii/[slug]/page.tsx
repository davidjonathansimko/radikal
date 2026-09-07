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
import TrailPills from '@/components/content/TrailPills';
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

  /** Câte rubrici ai coborât până aici. 0 = prima rubrică din listă. */
  const depth = trail.length;

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
        {/* Pasul 0809002 — drumul, adunat în pastile cu ✕. */}
        <TrailPills
          steps={[...trail, { slug, name: sectionName }]}
          rootHref="/marturii"
          rootLabel={t.back}
          hrefFor={(s) => `/marturii/${s}`}
        />

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

        {/* Pasul 0809002 — rubricile dinăuntru, altfel la fiecare adâncime.
            Primul nivel: chipuri, două pe rând. Mai adânc: părți, ca un cuprins. */}
        {children.length > 0 && (
          depth === 0 ? (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {children.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/marturii/${c.slug}`}
                  className="group flex flex-col gap-2 rounded-xl border border-black/10 p-3 transition-colors hover:bg-black/[0.04] dark:border-white/10 dark:hover:bg-white/[0.06]"
                >
                  <span className="flex aspect-square items-center justify-center rounded-lg bg-black/[0.05] font-cinzel text-2xl font-bold text-black/25 dark:bg-white/[0.06] dark:text-white/25">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-cinzel text-sm font-semibold leading-tight text-black dark:text-white">
                    {c.name}
                  </span>
                  {c.description && (
                    <span className="line-clamp-1 text-[11px] text-black/50 dark:text-white/50">
                      {c.description}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <ul className="mb-8 divide-y divide-black/10 overflow-hidden rounded-2xl border border-black/10 dark:divide-white/10 dark:border-white/10">
              {children.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/marturii/${c.slug}`}
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
                        {c.name}
                      </span>
                      {c.description && (
                        <span className="mt-0.5 line-clamp-1 block text-xs text-black/50 dark:text-white/50">
                          {c.description}
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
