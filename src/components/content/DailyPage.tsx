'use client';

// Pasul 2210004 — pagina zilnica pentru „Tägliche Andacht" si „Pentru copii":
// data de azi + cardul de azi, ultimele 4, buton catre arhiva.
// Dupa miezul noptii, cat timp nu exista un text nou, apare „Se actualizeaza".

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import UpLink from '@/components/content/UpLink';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import BackToTopButton from '@/components/BackToTopButton';
import CategoryFilterBar from '@/components/CategoryFilterBar';
import ContinueReading from '@/components/ContinueReading';
import { useFeatureFlags } from '@/lib/featureFlags';
import { ReadTick } from '@/components/ReadMark';
import { CONTENT_KINDS, type ContentKind } from '@/lib/contentKinds';
import { fetchItems, pickContentText, type ContentItemRow } from '@/lib/contentPublic';
import { fetchEnabledPages } from '@/lib/pageSettings';
import { matchesSelectedCategories } from '@/lib/categories';
import { usePageText } from '@/lib/pageContent';
import { ANDACHT_TEXTS, COPII_TEXTS } from '@/lib/pageTexts/daily';

const LOCALES: Record<string, string> = { de: 'de-DE', en: 'en-GB', ro: 'ro-RO', ru: 'ru-RU' };

const PARENT_HINT: Record<string, string> = {
  de: 'Für Eltern: Lest gemeinsam mit eurem Kind. Mit „Mit dem Kind lesen“ wird der Text groß und gut lesbar.',
  en: 'For parents: read together with your child. “Read with your child” makes the text large and easy to read.',
  ro: 'Pentru părinți: citiți împreună cu copilul. Cu „Citește cu copilul” textul devine mare și ușor de citit.',
  ru: 'Для родителей: читайте вместе с ребёнком. Режим «Читать с ребёнком» делает текст крупным.',
};

/** Ziua calendaristica locala, ca „2026-10-22". */
export function dayKey(value: string | Date | null | undefined): string {
  const d = value ? new Date(value) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDay(value: string | Date | null | undefined, lang: string, long = true): string {
  const d = value ? new Date(value) : new Date();
  return d.toLocaleDateString(LOCALES[lang] ?? 'de-DE', {
    weekday: long ? 'long' : undefined,
    day: 'numeric',
    month: long ? 'long' : 'short',
    year: 'numeric',
  });
}

export default function DailyPage({ kind }: { kind: ContentKind }) {
  const def = CONTENT_KINDS[kind];
  const router = useRouter();
  const { language } = useLanguage();
  const lang = ['ro', 'de', 'en', 'ru'].includes(language) ? language : 'de';
  const flags = useFeatureFlags();
  const t = usePageText(kind, kind === 'andacht' ? ANDACHT_TEXTS : COPII_TEXTS, language) as Record<string, string>;

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<ContentItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [today, setToday] = useState(() => dayKey(null));

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
    setRows(await fetchItems(kind));
    setLoading(false);
  }, [kind]);

  useEffect(() => {
    if (allowed) void load();
  }, [allowed, load]);

  // La miezul noptii se schimba ziua: reincarcam, poate a aparut textul nou.
  useEffect(() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const id = window.setTimeout(() => {
      setToday(dayKey(null));
      void load();
    }, next.getTime() - now.getTime());
    return () => window.clearTimeout(id);
  }, [today, load]);

  const todayRow = useMemo(() => rows.find((r) => dayKey(r.created_at) === today) ?? null, [rows, today]);

  const recent = useMemo(
    () =>
      rows
        .filter((r) => r.id !== todayRow?.id)
        .filter((r) => matchesSelectedCategories(r.category_ids as string[] | null, categoryIds))
        .slice(0, 4),
    [rows, todayRow, categoryIds],
  );

  if (allowed === null || allowed === false) return null;

  const heading = t.heading;
  const upper = kind === 'andacht';

  return (
    <div className="min-h-screen py-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <UpLink
          href="/"
          className="mb-4 inline-block text-sm text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          ← {t.home}
        </UpLink>

        <h1
          className={`mb-3 text-center font-cinzel text-2xl font-bold text-black dark:text-white sm:text-3xl ${
            upper ? 'uppercase tracking-widest' : ''
          }`}
        >
          {heading}
        </h1>
        <p className="mb-8 text-center text-sm capitalize text-black/55 dark:text-white/55">
          {formatDay(null, lang)}
        </p>

        <ContinueReading className="mb-6" />

        {kind === 'copii' && flags.kidsParentMode && (
          <div className="mx-auto mb-6 max-w-md rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm leading-relaxed text-black/75 dark:text-white/75">
            {PARENT_HINT[lang] ?? PARENT_HINT.de}
          </div>
        )}

        {loading ? (
          <p className="text-center text-black/50 dark:text-white/50">{t.loading}</p>
        ) : (
          <>
            {/* Cardul de azi */}
            {todayRow ? (
              <Link
                href={`${def.itemPath}/${todayRow.slug}`}
                className="group relative mb-10 block overflow-hidden rounded-2xl border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.04]"
              >
                {todayRow.image_url && (
                  <span className="relative block aspect-[16/9] w-full">
                    <Image
                      src={todayRow.image_url}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 672px"
                      priority
                    />
                  </span>
                )}
                <span className="block p-5">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/45 dark:text-white/45">
                    {t.today}
                  </span>
                  <span className="block font-cinzel text-xl font-bold leading-snug text-black dark:text-white">
                    {pickContentText(todayRow, 'title', lang)}
                  </span>
                  {pickContentText(todayRow, 'excerpt', lang) && (
                    <span className="mt-2 line-clamp-2 block text-sm text-black/60 dark:text-white/60">
                      {pickContentText(todayRow, 'excerpt', lang)}
                    </span>
                  )}
                  <span className="mt-3 inline-block text-sm font-medium text-black/70 underline dark:text-white/70">
                    {t.read} ›
                  </span>
                </span>
              </Link>
            ) : (
              <div className="mb-10 rounded-2xl border border-dashed border-black/15 p-8 text-center dark:border-white/15">
                <p className="text-black/60 dark:text-white/60">
                  {rows.length === 0 ? t.empty : t.updating}
                </p>
              </div>
            )}

            <CategoryFilterBar value={categoryIds} onChange={setCategoryIds} table="content_items" kind={kind} className="mb-6" />

            {/* Ultimele 4 */}
            {recent.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                  {t.recent}
                </h2>
                <ul className="divide-y divide-black/10 overflow-hidden rounded-2xl border border-black/10 dark:divide-white/10 dark:border-white/10">
                  {recent.map((row) => (
                    <li key={row.id}>
                      <Link
                        href={`${def.itemPath}/${row.slug}`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                      >
                        <span className="w-24 shrink-0 text-xs text-black/45 dark:text-white/45">
                          {formatDay(row.created_at, lang, false)}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-cinzel text-base font-semibold text-black dark:text-white">
                          {pickContentText(row, 'title', lang)}
                        </span>
                        <ReadTick href={`${def.itemPath}/${row.slug}`} />
                        <span aria-hidden="true" className="shrink-0 text-black/30 dark:text-white/30">
                          ›
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="text-center">
              <Link
                href={`${def.basePath}/arhiva`}
                className="inline-block rounded-full border border-black/20 px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
              >
                {t.archive}
              </Link>
            </div>
          </>
        )}
      </div>

      <BackToTopButton />
    </div>
  );
}
