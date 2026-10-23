'use client';

import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useReadItems } from '@/lib/readState';

const LABELS: Record<string, { mark: string; done: string }> = {
  de: { mark: 'Als gelesen markieren', done: 'Gelesen' },
  en: { mark: 'Mark as read', done: 'Read' },
  ro: { mark: 'Marchează ca citit', done: 'Citit' },
  ru: { mark: 'Отметить как прочитанное', done: 'Прочитано' },
};

/** Buton din pagina articolului: bifeaza sau debifeaza „citit". */
export function ReadToggle({ href, className = '' }: { href: string; className?: string }) {
  const { language } = useLanguage();
  const { isRead, setRead } = useReadItems();
  const t = LABELS[language] ?? LABELS.de;
  const read = isRead(href);

  return (
    <button
      type="button"
      onClick={() => setRead(href, !read)}
      aria-pressed={read}
      className={`btn-solid inline-flex h-6 min-h-0 min-w-0 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-medium tracking-wide transition-colors ${
        read
          ? 'border-transparent bg-black/80 text-white dark:bg-white/85 dark:text-black'
          : 'border-black/10 text-black/55 hover:bg-black/5 dark:border-white/15 dark:text-white/55 dark:hover:bg-white/10'
      } ${className}`}
    >
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {read ? t.done : t.mark}
    </button>
  );
}

/** Bifa mica pentru liste. Nu arata nimic daca nu e citit. */
export function ReadTick({ href, className = '' }: { href: string; className?: string }) {
  const { isRead } = useReadItems();
  if (!isRead(href)) return null;
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 text-black/45 dark:text-white/45 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="✓"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
