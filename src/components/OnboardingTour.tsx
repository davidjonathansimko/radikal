'use client';

// Pasul 2210014 - scurta prezentare la prima intrare (o singura data pe dispozitiv).
// Se vede doar pe pagina principala, dupa logo/login. Se poate sari oricand.

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useHaptic } from '@/hooks/useHaptic';
import TriangleLoader from '@/components/TriangleLoader';
import { WriteLetterIcon, ToggleIcon } from '@/components/OnboardingIcons';

const STORAGE_KEY = 'radikalOnboardingDone';

type Lang = 'de' | 'en' | 'ro' | 'ru';

interface Step {
  icon: 'write' | 'toggle' | 'play';
  title: Record<Lang, string>;
  text: Record<Lang, string>;
}

const STEPS: Step[] = [
  {
    icon: 'write',
    title: {
      de: 'Willkommen bei RADIKAL.',
      en: 'Welcome to RADIKAL.',
      ro: 'Bine ai venit la RADIKAL.',
      ru: 'Добро пожаловать в RADIKAL.',
    },
    text: {
      de: 'Blogs, Zeugnisse und biblische Lehre.',
      en: 'Blogs, testimonies and Biblical teaching.',
      ro: 'Bloguri, mărturii și învățături biblice.',
      ru: 'Блоги, свидетельства и библейские учения.',
    },
  },
  {
    icon: 'toggle',
    title: {
      de: 'Navigation',
      en: 'Navigation',
      ro: 'Navigare',
      ru: 'Навигация',
    },
    text: {
      de: 'Unten die Einstellungsleiste: Sprache, Suche, Design und Reels. Oben rechts das Menü, oben links das Logo – es bringt dich überall zurück zur Startseite.',
      en: 'The settings bar below: language, search, theme and reels. Menu at the top right; the logo at the top left always takes you home.',
      ro: 'Jos găsești bara de setări: limbă, căutare, temă și reels. Sus în dreapta e meniul, iar logo-ul din stânga te duce oricând acasă.',
      ru: 'Внизу панель настроек: язык, поиск, тема и рилсы. Справа вверху меню, а логотип слева всегда возвращает на главную.',
    },
  },
  {
    icon: 'play',
    title: {
      de: 'Anhören und lesen',
      en: 'Listen and read',
      ro: 'Ascultă și citește',
      ru: 'Слушай и читай',
    },
    text: {
      de: 'Jeder Artikel kann vorgelesen oder im Fokus-Modus gelesen werden – für mehr Konzentration. Schriftgröße und Vorlesegeschwindigkeit lassen sich anpassen.',
      en: 'Every article can be read aloud or read in focus mode for better concentration. Text size and reading speed can be adjusted.',
      ro: 'Fiecare articol poate fi ascultat sau citit în modul Focus, pentru mai multă concentrare. Mărimea textului și viteza vocii se pot regla.',
      ru: 'Каждую статью можно прослушать или читать в режиме фокуса — для лучшей концентрации. Размер шрифта и скорость чтения можно настроить.',
    },
  },
];

const LABELS: Record<Lang, { next: string; start: string; skip: string }> = {
  de: { next: 'Weiter', start: 'Los geht’s', skip: 'Überspringen' },
  en: { next: 'Next', start: 'Let’s go', skip: 'Skip' },
  ro: { next: 'Înainte', start: 'Începe', skip: 'Sari peste' },
  ru: { next: 'Далее', start: 'Начать', skip: 'Пропустить' },
};

function StepIcon({ kind }: { kind: Step['icon'] }) {
  if (kind === 'write') return <WriteLetterIcon className="h-10 w-10" />;
  if (kind === 'toggle') return <ToggleIcon className="h-10 w-10" />;
  return <TriangleLoader size={34} rotate={90} />;
}

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
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black/5 text-black dark:bg-white/10 dark:text-white" aria-hidden="true">
          <StepIcon key={step} kind={current.icon} />
        </div>
        <h2 key={`t${step}`} className="mb-2 font-cinzel text-xl font-bold animate-fadeIn">
          {current.title[lang]}
        </h2>
        <p key={`p${step}`} className="mb-5 min-h-[6.5rem] text-sm leading-relaxed text-black/70 dark:text-white/70 animate-fadeIn">
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
