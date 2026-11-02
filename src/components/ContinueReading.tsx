'use client';

// Pasul 2210007 — „Continua de unde ai ramas": un card mic cu ultimul articol
// deschis. Se poate inchide cu ✕.
// Pasul 231026: card subtire, text centrat, punct rosu care palpaie discret.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { useFeatureFlags } from '@/lib/featureFlags';
import { useReadItems } from '@/lib/readState';
import { useTranslation } from '@/hooks/useTranslation';

export const LAST_READ_KEY = 'radikalLastRead';

interface LastRead {
  href: string;
  title: string;
  at: number;
  /** Limba in care a fost salvat `title`. */
  lang?: string;
  /** Titlurile cunoscute ale articolului, pe limbi. */
  titles?: Record<string, string | undefined>;
}

const LABEL: Record<string, string> = {
  de: 'Weiterlesen',
  en: 'Continue reading',
  ro: 'Continuă lectura',
  ru: 'Продолжить чтение',
};

export default function ContinueReading({ className = '', scope, slim = false }: { className?: string; scope?: string; slim?: boolean }) {
  const { language } = useLanguage();
  const flags = useFeatureFlags();
  const { isRead } = useReadItems();
  const [item, setItem] = useState<LastRead | null>(null);
  const { translateBatch } = useTranslation();
  const [translated, setTranslated] = useState<{ key: string; text: string } | null>(null);

  // Un titlu identic cu cel romanesc nu e o traducere: se traduce din nou.
  const own = item?.titles?.[language]?.trim() || '';
  const sameAsRo = Boolean(own && item?.titles?.ro && own === item.titles.ro.trim());
  const known = (language === 'ro' ? item?.titles?.ro?.trim() || item?.title : '') || (own && !sameAsRo ? own : '') || (item && item.lang === language && item.lang !== 'ro' ? item.title : '');
  const tKey = item ? `${item.href}:${language}` : '';

  // Titlul salvat intr-o alta limba se traduce in limba curenta (DeepL, cu cache; limba sursa se detecteaza singura).
  useEffect(() => {
    if (!item || known || translated?.key === tKey) return;
    let alive = true;
    translateBatch([item.title], language, undefined, true)
      .catch(() => [] as string[])
      .then((out) => alive && setTranslated({ key: tKey, text: (out[0] || '').trim() || item.title }));
    return () => {
      alive = false;
    };
  }, [item, known, translated, tKey, language, translateBatch]);

  const shownTitle = known || (translated?.key === tKey ? translated.text : '');

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
  // Doar textul din sectiunea curenta si doar daca nu a fost citit pana la capat.
  if (scope && !item.href.startsWith(scope)) return null;
  if (isRead(item.href)) return null;

  return (
    <div
      className={`relative mx-auto min-h-[44px] w-full max-w-xs rounded-xl border border-black/10 bg-black/[0.03] pl-11 pr-12 ${slim ? 'py-0' : 'py-1.5'} text-center shadow-sm dark:border-white/15 dark:bg-white/[0.04] ${className}`}
    >
      <Link href={item.href} className={`min-w-0 ${slim ? 'flex min-h-[44px] items-center justify-center gap-2 py-1.5' : 'flex min-h-[44px] flex-col justify-center'}`}>
        <span className="flex shrink-0 items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-black/55 dark:text-white/55">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
          {LABEL[language] ?? LABEL.de}
        </span>
        <span className={`block truncate font-cinzel text-[13px] font-normal text-black dark:text-white ${slim ? '' : 'mt-0.5'}`}>
          {shownTitle || '\u00a0'}
        </span>
      </Link>
      <button
        type="button"
        aria-label="Close"
        // Pe click, nu pe pointerup: daca cardul dispare la pointerup, click-ul ajunge pe cardul de blog de dedesubt si deschide articolul.
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            localStorage.removeItem(LAST_READ_KEY);
          } catch {
            /* ignora */
          }
          setItem(null);
        }}
        // Fara `translate`: regula globala button:active pune transform si muta butonul din loc (de aici „fuga" lui ✕).
        style={{ touchAction: 'manipulation', transform: 'none' }}
        className="absolute inset-y-0 right-0 z-10 flex w-12 items-center justify-center rounded-r-xl text-base text-black/55 active:bg-black/10 dark:text-white/55 dark:active:bg-white/10"
      >
        ✕
      </button>
    </div>
  );
}
