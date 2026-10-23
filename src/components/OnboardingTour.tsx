'use client';

// Pasul 2210014 - scurta prezentare la prima intrare (o singura data pe dispozitiv).
// Se vede doar pe pagina principala, dupa logo/login. Se poate sari oricand.

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useHaptic } from '@/hooks/useHaptic';

const STORAGE_KEY = 'radikalOnboardingDone';

type Lang = 'de' | 'en' | 'ro' | 'ru';

interface Step {
  icon: string;
  title: Record<Lang, string>;
  text: Record<Lang, string>;
}

const STEPS: Step[] = [
  {
    icon: '✝',
    title: {
      de: 'Willkommen bei RADIKAL.',
      en: 'Welcome to RADIKAL.',
      ro: 'Bine ai venit la RADIKAL.',
      ru: 'Добро пожаловать в RADIKAL.',
    },
    text: {
      de: 'Blogs, Zeugnisse, tägliche Andacht und Bibelverse – alles an einem Ort.',
      en: 'Blogs, testimonies, a daily devotion and Bible verses – all in one place.',
      ro: 'Bloguri, mărturii, Andacht zilnic și versete biblice – totul într-un singur loc.',
      ru: 'Блоги, свидетельства, ежедневное размышление и стихи из Библии – всё в одном месте.',
    },
  },
  {
    icon: '☰',
    title: {
      de: 'Navigation',
      en: 'Navigation',
      ro: 'Navigare',
      ru: 'Навигация',
    },
    text: {
      de: 'Unten findest du das Menü. Mit der Zurück-Taste deines Handys kommst du immer eine Seite zurück.',
      en: 'The menu is at the bottom. Your phone’s back button always takes you one page back.',
      ro: 'Meniul este jos. Butonul „înapoi” al telefonului te duce mereu o pagină în urmă.',
      ru: 'Меню находится внизу. Кнопка «назад» на телефоне всегда возвращает на одну страницу.',
    },
  },
  {
    icon: '🔍',
    title: {
      de: 'Suche, Sprache, Design',
      en: 'Search, language, theme',
      ro: 'Căutare, limbă, temă',
      ru: 'Поиск, язык, тема',
    },
    text: {
      de: 'Suche in Blogs, Zeugnissen und Andacht, wechsle die Sprache und das helle oder dunkle Design.',
      en: 'Search blogs, testimonies and devotions, switch the language and the light or dark theme.',
      ro: 'Caută în bloguri, mărturii și Andacht, schimbă limba și tema luminoasă sau întunecată.',
      ru: 'Ищи по блогам, свидетельствам и размышлениям, меняй язык и светлую или тёмную тему.',
    },
  },
  {
    icon: '▶',
    title: {
      de: 'Anhören und teilen',
      en: 'Listen and share',
      ro: 'Ascultă și împărtășește',
      ru: 'Слушай и делись',
    },
    text: {
      de: 'Jeder Artikel kann vorgelesen werden. Verse und Reels lassen sich als Bild teilen.',
      en: 'Every article can be read aloud. Verses and reels can be shared as an image.',
      ro: 'Fiecare articol poate fi ascultat. Versetele și reels-urile se pot trimite ca imagine.',
      ru: 'Каждую статью можно прослушать. Стихи и рилсы можно отправить как картинку.',
    },
  },
];

const LABELS: Record<Lang, { next: string; start: string; skip: string }> = {
  de: { next: 'Weiter', start: 'Los geht’s', skip: 'Überspringen' },
  en: { next: 'Next', start: 'Let’s go', skip: 'Skip' },
  ro: { next: 'Înainte', start: 'Începe', skip: 'Sari peste' },
  ru: { next: 'Далее', start: 'Начать', skip: 'Пропустить' },
};

export default function OnboardingTour() {
  const { language } = useLanguage();
  const { tapLight } = useHaptic();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    // Asteptam sa se rezolve bannerul de cookie-uri, ca sa nu se suprapuna, apoi o mica pauza.
    let openTimer: ReturnType<typeof setTimeout> | undefined;
    const poll = setInterval(() => {
      try {
        if (!localStorage.getItem('cookie-consent')) return;
      } catch {
        return;
      }
      clearInterval(poll);
      openTimer = setTimeout(() => setOpen(true), 900);
    }, 600);
    return () => {
      clearInterval(poll);
      if (openTimer) clearTimeout(openTimer);
    };
  }, []);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignoram */
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const lang = (['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de') as Lang;
  const labels = LABELS[lang];
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={current.title[lang]}
    >
      <div className="w-full max-w-sm rounded-3xl border border-black/10 bg-white p-6 text-center text-black shadow-2xl dark:border-white/15 dark:bg-neutral-950 dark:text-white animate-fadeIn">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black/5 text-2xl dark:bg-white/10" aria-hidden="true">
          {current.icon}
        </div>
        <h2 key={`t${step}`} className="mb-2 font-cinzel text-xl font-bold animate-fadeIn">
          {current.title[lang]}
        </h2>
        <p key={`p${step}`} className="mb-5 min-h-[5.5rem] text-sm leading-relaxed text-black/70 dark:text-white/70 animate-fadeIn">
          {current.text[lang]}
        </p>

        <div className="mb-5 flex items-center justify-center gap-2" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-black dark:bg-white' : 'w-1.5 bg-black/20 dark:bg-white/25'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => { tapLight(); finish(); }}
            className="min-h-0 min-w-0 rounded-xl px-3 py-2 text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            {labels.skip}
          </button>
          <button
            type="button"
            onClick={() => {
              tapLight();
              if (last) finish();
              else setStep((s) => s + 1);
            }}
            className="min-h-0 min-w-0 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition-transform active:scale-95 dark:bg-white dark:text-black"
          >
            {last ? labels.start : labels.next}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
