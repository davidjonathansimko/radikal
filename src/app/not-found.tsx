// Pagina care apare când o adresă nu există.
// Fără ea, vizitatorul primea ecranul gol standard al Next.js.

'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';

const T: Record<string, { title: string; text: string; home: string; blogs: string }> = {
  de: {
    title: 'Seite nicht gefunden',
    text: 'Diese Seite gibt es nicht — vielleicht wurde sie verschoben oder die Adresse ist falsch geschrieben.',
    home: 'Zur Startseite',
    blogs: 'Zu den Blogs',
  },
  en: {
    title: 'Page not found',
    text: 'This page does not exist — it may have moved, or the address is misspelled.',
    home: 'Go to home page',
    blogs: 'Go to blogs',
  },
  ro: {
    title: 'Pagina nu a fost găsită',
    text: 'Această pagină nu există — poate a fost mutată sau adresa e scrisă greșit.',
    home: 'Mergi la pagina principală',
    blogs: 'Mergi la bloguri',
  },
  ru: {
    title: 'Страница не найдена',
    text: 'Этой страницы не существует — возможно, она перемещена или адрес написан с ошибкой.',
    home: 'На главную',
    blogs: 'К блогам',
  },
};

export default function NotFound() {
  const { language } = useLanguage();
  const t = T[language] || T.de;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glass-effect w-full max-w-md rounded-2xl p-8 text-center">
        <p className="mb-4 font-cinzel text-5xl font-bold text-black dark:text-white">404</p>
        <h1 className="mb-3 text-xl font-bold text-black dark:text-white">{t.title}</h1>
        <p className="mb-6 text-sm leading-relaxed text-black/70 dark:text-white/70">{t.text}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            {t.home}
          </Link>
          <Link href="/blogs" className="btn-secondary">
            {t.blogs}
          </Link>
        </div>
      </div>
    </div>
  );
}
