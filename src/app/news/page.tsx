// Pasul 2308006-F — pagina publica „News".
//
// Aduna doua feluri de continut, intr-o singura lista:
//   1. stirile din tabelul `news_items`   (scrise direct in cele 4 limbi)
//   2. articolele de blog bifate „is_news" (blog obisnuit, dar marcat ca stire)
//
// Daca SQL-ul nu a fost inca rulat, pagina NU se strica: arata pur si simplu
// „momentan nu sunt noutati".

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/hooks/useLanguage';
import { getSupabaseClient } from '@/lib/supabase';
import { usePageText } from '@/lib/pageContent';
import { registerPageDefaults } from '@/lib/pageDefaults';

type Lang = 'ro' | 'de' | 'en' | 'ru';

const T: Record<Lang, Record<string, string>> = {
  de: {
    title: 'News',
    subtitle: 'Neuigkeiten, Einladungen und Ankündigungen von RADIKAL.',
    empty: 'Zurzeit gibt es keine Neuigkeiten.',
    loading: 'Wird geladen …',
    read: 'Weiterlesen',
    open: 'Öffnen',
    back: 'Zurück zur Startseite',
  },
  en: {
    title: 'News',
    subtitle: 'News, invitations and announcements from RADIKAL.',
    empty: 'There is no news at the moment.',
    loading: 'Loading …',
    read: 'Read more',
    open: 'Open',
    back: 'Back to home',
  },
  ro: {
    title: 'Noutăți',
    subtitle: 'Noutăți, invitații și anunțuri de la RADIKAL.',
    empty: 'Momentan nu sunt noutăți.',
    loading: 'Se încarcă …',
    read: 'Citește mai mult',
    open: 'Deschide',
    back: 'Înapoi la pagina principală',
  },
  ru: {
    title: 'Новости',
    subtitle: 'Новости, приглашения и объявления от RADIKAL.',
    empty: 'Сейчас новостей нет.',
    loading: 'Загрузка …',
    read: 'Читать далее',
    open: 'Открыть',
    back: 'На главную',
  },
};

// Pasul 2508000 — anuntam textul original panoului de admin
registerPageDefaults('news', T);

/** Un rand din lista, indiferent de unde vine (stire sau blog). */
interface NewsEntry {
  id: string;
  title: string;
  body: string;
  image: string | null;
  /** Link intern (blog) sau extern (stire cu link) */
  href: string | null;
  external: boolean;
  date: string | null;
}

export default function NewsPage() {
  const { language } = useLanguage();
  const lang = (['ro', 'de', 'en', 'ru'].includes(language) ? language : 'de') as Lang;
  const t = usePageText('news', T, lang);
  const [entries, setEntries] = useState<NewsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const sb = getSupabaseClient();
    const collected: NewsEntry[] = [];

    // 1) Stirile scrise manual in admin → News
    try {
      const { data, error } = await sb
        .from('news_items')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data) {
        for (const row of data as Record<string, unknown>[]) {
          // Daca lipseste textul in limba aleasa, cadem elegant pe romana, apoi germana.
          const pick = (prefix: string) =>
            String(row[`${prefix}_${lang}`] || row[`${prefix}_ro`] || row[`${prefix}_de`] || '');

          collected.push({
            id: String(row.id),
            title: pick('title'),
            body: pick('body'),
            image: (row.image_url as string) || null,
            href: (row.link_url as string) || null,
            external: true,
            date: (row.created_at as string) || null,
          });
        }
      }
    } catch {
      /* tabelul nu exista inca */
    }

    // 2) Articolele de blog bifate „pentru pagina News"
    try {
      const { data, error } = await sb
        .from('blog_posts')
        .select('id, title, excerpt, slug, image_url, news_pinned_at, created_at')
        .eq('published', true)
        .eq('is_news', true)
        .order('news_pinned_at', { ascending: false });

      if (!error && data) {
        for (const row of data as Record<string, unknown>[]) {
          collected.push({
            id: String(row.id),
            title: String(row.title || ''),
            body: String(row.excerpt || ''),
            image: (row.image_url as string) || null,
            href: row.slug ? `/blogs/${row.slug}` : null,
            external: false,
            date: (row.news_pinned_at as string) || (row.created_at as string) || null,
          });
        }
      }
    } catch {
      /* coloana `is_news` nu exista inca */
    }

    // Cele mai noi primele
    collected.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    setEntries(collected);
    setLoading(false);
  }, [lang]);

  useEffect(() => { void load(); }, [load]);

  const hasItems = useMemo(() => entries.length > 0, [entries]);

  return (
    <main className="min-h-screen px-4 pb-24 pt-28 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
          <p className="mt-2 text-sm opacity-70">{t.subtitle}</p>
        </header>

        {loading && <p className="text-sm opacity-60">{t.loading}</p>}

        {!loading && !hasItems && (
          <div className="rounded-2xl border border-current/15 p-8 text-center">
            <p className="text-sm opacity-70">{t.empty}</p>
            <Link href="/" className="mt-4 inline-block text-sm underline opacity-80 hover:opacity-100">
              {t.back}
            </Link>
          </div>
        )}

        <div className="space-y-6">
          {entries.map((item) => (
            <article
              key={`${item.external ? 'n' : 'b'}-${item.id}`}
              className="overflow-hidden rounded-2xl border border-current/15"
            >
              {item.image && (
                <div className="relative h-48 w-full sm:h-60">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 720px"
                    className="object-cover"
                  />
                </div>
              )}

              <div className="p-5">
                <h2 className="text-lg font-semibold">{item.title}</h2>
                {item.body && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed opacity-75">
                    {item.body}
                  </p>
                )}

                {item.href && (
                  item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-sm underline opacity-80 hover:opacity-100"
                    >
                      {t.open}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="mt-4 inline-block text-sm underline opacity-80 hover:opacity-100"
                    >
                      {t.read}
                    </Link>
                  )
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
