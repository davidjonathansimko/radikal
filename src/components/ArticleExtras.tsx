'use client';

// Pasul 231026b — doua butoane mici pentru articole: „Lectura de seara" si „Citeste cu copilul".

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

const EVENING_KEY = 'radikalEveningMode';

const EVENING: Record<string, string> = { de: 'Abend', en: 'Evening', ro: 'Seara', ru: 'Вечер' };
const EVENING_TITLE: Record<string, string> = { de: 'Abendlesen', en: 'Evening reading', ro: 'Lectură de seară', ru: 'Вечернее чтение' };
const KIDS: Record<string, string> = { de: 'Mit dem Kind lesen', en: 'Read with your child', ro: 'Citește cu copilul', ru: 'Читать с ребёнком' };

const btn = (active: boolean) =>
  `flex min-h-0 min-w-0 flex-shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors duration-300 ${
    active
      ? 'bg-amber-500 text-black'
      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/20'
  }`;

export function EveningModeToggle() {
  const { language } = useLanguage();
  const [on, setOn] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        setOn(localStorage.getItem(EVENING_KEY) === '1');
      } catch {
        /* ignora */
      }
    };
    read();
    // Butonul apare de doua ori (telefon + desktop): le tinem la fel.
    window.addEventListener('radikal-evening', read);
    return () => window.removeEventListener('radikal-evening', read);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('evening-mode', on);
    return () => document.documentElement.classList.remove('evening-mode');
  }, [on]);

  const toggle = () => {
    const next = !on;
    setOn(next);
    try {
      localStorage.setItem(EVENING_KEY, next ? '1' : '0');
    } catch {
      /* ignora */
    }
    window.dispatchEvent(new Event('radikal-evening'));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title={EVENING_TITLE[language] ?? EVENING_TITLE.de}
      className={`flex min-h-0 min-w-0 flex-shrink-0 items-center gap-0.5 xs:gap-1 rounded-lg px-1 xs:px-2 py-0.5 xs:py-1 sm:py-1.5 transition-colors duration-300 ${
        on
          ? 'bg-amber-500 text-black'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/20'
      }`}
    >
      <svg className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <span className="hidden xs:inline whitespace-nowrap text-[0.6rem] font-semibold leading-tight xs:text-xs sm:text-sm">
        {EVENING[language] ?? EVENING.de}
      </span>
    </button>
  );
}

export function KidsReadToggle() {
  const { language } = useLanguage();
  const [on, setOn] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('kids-read', on);
    return () => document.documentElement.classList.remove('kids-read');
  }, [on]);

  return (
    <button type="button" onClick={() => setOn((v) => !v)} aria-pressed={on} className={btn(on)}>
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
      </svg>
      <span>{KIDS[language] ?? KIDS.de}</span>
    </button>
  );
}
