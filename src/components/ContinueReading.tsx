'use client';

// Pasul 2210007 — „Continua de unde ai ramas": un card mic cu ultimul articol
// deschis. Se poate inchide cu ✕.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';

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

  if (!item) return null;

  return (
    <div
      className={`mx-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-black/10 px-4 py-3 dark:border-white/10 ${className}`}
    >
      <Link href={item.href} className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-white/45">
          {LABEL[language] ?? LABEL.de}
        </span>
        <span className="block truncate font-cinzel text-sm font-semibold text-black dark:text-white">
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
        className="btn-solid flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs text-black/50 hover:bg-black/10 dark:text-white/50 dark:hover:bg-white/10"
      >
        ✕
      </button>
    </div>
  );
}
