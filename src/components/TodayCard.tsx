'use client';

// Pasul 231026b — cardul „Azi” de pe pagina principala: Andacht-ul zilei si „Weiterlesen”.
// Apare doar daca exista ceva de aratat si daca este pornit din admin.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { getSupabaseClient } from '@/lib/supabase';
import { CONTENT_KINDS } from '@/lib/contentKinds';
import { fetchItems, pickContentText } from '@/lib/contentPublic';
import ContinueReading from '@/components/ContinueReading';
import { useFeatureFlags } from '@/lib/featureFlags';
import { useUiSettings } from '@/lib/uiSettings';
import { hub } from '@/lib/audioHub';
import { touchStreak } from '@/lib/streak';

const STREAK: Record<string, (n: number) => string> = {
  de: (n) => `${n} Tage in Folge`,
  en: (n) => `${n} days in a row`,
  ro: (n) => `${n} zile la rând`,
  ru: (n) => `${n} дн. подряд`,
};
const LISTEN: Record<string, string> = { de: 'Anhören', en: 'Listen', ro: 'Ascultă', ru: 'Слушать' };

const TITLE: Record<string, string> = { de: 'Heute', en: 'Today', ro: 'Azi', ru: 'Сегодня' };
const ANDACHT: Record<string, string> = { de: 'Tägliche Andacht', en: 'Daily devotion', ro: 'Andacht-ul zilei', ru: 'Размышление дня' };

function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Props {
  enabledPages: Set<string>;
}

export default function TodayCard({ enabledPages }: Props) {
  const { language } = useLanguage();
  const lang = ['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de';
  const [andacht, setAndacht] = useState<{ href: string; title: string } | null>(null);
  const [hasRead, setHasRead] = useState(false);
  const flags = useFeatureFlags();
  const ui = useUiSettings();
  const [streak, setStreak] = useState(0);
  const [listen, setListen] = useState<{ slug: string; title: string; imageUrl: string | null } | null>(null);

  useEffect(() => {
    if (ui.todayStreak) setStreak(touchStreak());
  }, [ui.todayStreak]);

  // Cel mai nou blog care are audio pregenerat in limba curenta.
  useEffect(() => {
    if (!ui.todayListen) {
      setListen(null);
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const { data } = await getSupabaseClient()
          .from('blog_posts')
          .select('slug, title, title_de, title_en, title_ru, image_url')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(6);
        for (const row of (data ?? []) as unknown as Record<string, string | null>[]) {
          const r = await fetch(`/api/blog-audio?slug=${encodeURIComponent(row.slug as string)}&language=${lang}`);
          const d = await r.json();
          if (d?.audioUrl) {
            const own = (row[`title_${lang}`] ?? '').trim();
            const title = lang !== 'ro' && own && own !== row.title ? own : (row.title as string);
            if (alive) setListen({ slug: row.slug as string, title, imageUrl: row.image_url });
            return;
          }
        }
      } catch {
        /* fara buton */
      }
    })();
    return () => {
      alive = false;
    };
  }, [ui.todayListen, lang]);

  const showAndacht = enabledPages.has('andacht');

  useEffect(() => {
    try {
      setHasRead(Boolean(localStorage.getItem('radikalLastRead')));
    } catch {
      /* ignora */
    }
  }, []);

  useEffect(() => {
    if (!showAndacht) {
      setAndacht(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const rows = await fetchItems('andacht');
        const today = isoToday();
        const row = rows.find((r) => {
          const d = new Date(r.created_at ?? 0);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === today;
        });
        if (alive && row) {
          setAndacht({
            href: `${CONTENT_KINDS.andacht.itemPath}/${row.slug}`,
            title: pickContentText(row, 'title', lang),
          });
        }
      } catch {
        /* fara card pentru Andacht */
      }
    })();
    return () => {
      alive = false;
    };
  }, [showAndacht, lang]);

  if (!andacht && !(hasRead && flags.resume) && !listen && !(ui.todayStreak && streak >= 2)) return null;

  const rowClass =
    'block rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-left transition-colors hover:bg-black/[0.06] dark:border-white/15 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]';

  return (
    <div className="mx-auto w-full max-w-md space-y-3 px-4 pb-10 pt-2">
      <p className="text-center font-cinzel text-xs font-semibold uppercase tracking-[0.3em] text-black/50 dark:text-white/50">
        {TITLE[lang]}
      </p>
      {andacht && (
        <Link href={andacht.href} className={rowClass}>
          <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-black/50 dark:text-white/50">{ANDACHT[lang]}</span>
          <span className="mt-1 block truncate font-cinzel text-sm text-black dark:text-white">{andacht.title}</span>
        </Link>
      )}
      {listen && (
        <button
          type="button"
          onClick={() => void hub.playPrebuilt({ slug: listen.slug, audioSlug: listen.slug, lang, title: listen.title, href: `/blogs/${listen.slug}`, imageUrl: listen.imageUrl })}
          className={`${rowClass} flex w-full items-center gap-3`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-black/50 dark:text-white/50">{LISTEN[lang]}</span>
            <span className="mt-0.5 block truncate font-cinzel text-sm text-black dark:text-white">{listen.title}</span>
          </span>
        </button>
      )}
      <ContinueReading />
      {ui.todayStreak && streak >= 2 && (
        <p className="pt-1 text-center text-[11px] text-black/45 dark:text-white/45">{STREAK[lang](streak)}</p>
      )}
    </div>
  );
}
