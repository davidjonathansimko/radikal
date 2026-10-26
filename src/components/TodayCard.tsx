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

  if (!andacht && !(hasRead && flags.resume)) return null;

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
      <ContinueReading />
    </div>
  );
}
