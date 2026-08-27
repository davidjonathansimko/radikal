// Ecranul care apare dacă o pagină se strică în timpul folosirii.
// Fără el, cititorul rămânea cu ecranul alb și nu mai avea nicio cale înapoi.

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

const T: Record<string, { title: string; text: string; retry: string; home: string }> = {
  de: {
    title: 'Etwas ist schiefgelaufen',
    text: 'Die Seite konnte nicht geladen werden. Versuche es noch einmal.',
    retry: 'Erneut versuchen',
    home: 'Zur Startseite',
  },
  en: {
    title: 'Something went wrong',
    text: 'This page could not be loaded. Please try again.',
    retry: 'Try again',
    home: 'Go to home page',
  },
  ro: {
    title: 'Ceva nu a mers bine',
    text: 'Pagina nu a putut fi încărcată. Încearcă din nou.',
    retry: 'Încearcă din nou',
    home: 'Mergi la pagina principală',
  },
  ru: {
    title: 'Что-то пошло не так',
    text: 'Страницу не удалось загрузить. Попробуйте ещё раз.',
    retry: 'Попробовать снова',
    home: 'На главную',
  },
};

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[RADIKAL]', error);
  }, [error]);

  // Limba se citeste direct: aici nu ne putem baza pe context, pentru ca
  // tocmai ce s-a stricat poate fi chiar el.
  const lang =
    (typeof window !== 'undefined' && localStorage.getItem('radikal-language')) || 'de';
  const t = T[lang] || T.de;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glass-effect w-full max-w-md rounded-2xl p-8 text-center">
        <h1 className="mb-3 text-xl font-bold text-black dark:text-white">{t.title}</h1>
        <p className="mb-6 text-sm leading-relaxed text-black/70 dark:text-white/70">{t.text}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="btn-primary">
            {t.retry}
          </button>
          <Link href="/" className="btn-secondary">
            {t.home}
          </Link>
        </div>
      </div>
    </div>
  );
}
