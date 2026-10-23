'use client';

// Pasul 2210007 — „Continua de unde ai ramas": un card mic cu ultimul articol
// deschis. Se poate inchide cu ✕.
// Pasul 231026: card subtire, text centrat, punct rosu care palpaie discret.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { useFeatureFlags } from '@/lib/featureFlags';

export const LAST_READ_KEY = 'radikalLastRead';

interface LastRead {
  href: string;
  title: string;
  at: number;
}

const LABEL: Record<string, string> = {
  de: 'Weiterlesen',
  en: 'Continue reading',
  ro: 'Continuă lectura',
  ru: 'Продолжить чтение',
};

export default function ContinueReading({ className = '' }: { className?: string }) {
  const { language } = useLanguage();
  const flags = useFeatureFlags();
  const [item, setItem] = useState<LastRead | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAST_READ_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as LastRead;
      if (parsed?.href && parsed?.title) setItem(parsed);
    } catch {
      /* ignora */
    }
  }, []);

  if (!item || !flags.resume) return null;

  return (
    <div
      className={`relative mx-auto w-full max-w-xs rounded-xl border border-black/10 bg-black/[0.03] px-9 py-1.5 text-center shadow-sm dark:border-white/15 dark:bg-white/[0.04] ${className}`}
    >
      <Link href={item.href} className="block min-w-0">
        <span className="flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-black/55 dark:text-white/55">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
          {LABEL[language] ?? LABEL.de}
        </span>
        <span className="mt-0.5 block truncate font-cinzel text-[13px] font-normal text-black dark:text-white">
          {item.title}
        </span>
      </Link>
      <button
        type="button"
        aria-label="✕"
        onClick={() => {
          try {
            localStorage.removeItem(LAST_READ_KEY);
          } catch {
            /* ignora */
          }
          setItem(null);
        }}
        className="btn-solid absolute right-1.5 top-1/2 flex h-6 min-h-0 w-6 min-w-0 -translate-y-1/2 items-center justify-center rounded-full text-[11px] text-black/45 hover:bg-black/10 dark:text-white/45 dark:hover:bg-white/10"
      >
        ✕
      </button>
    </div>
  );
}
