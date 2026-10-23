'use client';

// Tutorial la prima intrare (o singura data pe dispozitiv), in mijlocul ecranului.
// Pasul „Navigation" arata, pe rand, butoanele reale din bara si din antet (copii monocrome, care se
// formeaza din ceata); cat dureaza tutorialul, atingerile nu ajung la aplicatie. Textul se schimba din
// Admin -> Setari -> Pagini -> „Tutorial".

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useLanguage } from '@/hooks/useLanguage';
import { useHaptic } from '@/hooks/useHaptic';
import { useTheme } from '@/hooks/useTheme';
import { usePageText } from '@/lib/pageContent';
import { ONBOARDING_TEXTS, type OnboardingTexts } from '@/lib/pageTexts/onboarding';
import TriangleLoader from '@/components/TriangleLoader';
import ReelsIcon from '@/components/ReelsIcon';
import { LanguageFlag } from '@/components/NavigationIcons';
import { WriteLetterIcon, ToggleIcon } from '@/components/OnboardingIcons';

const STORAGE_KEY = 'radikalOnboardingDone';
const STEPS = ['welcome', 'nav', 'listen'] as const;

/** Momentele (ms) la care apare fiecare element din pasul „Navigation". */
const NAV_SCHEDULE = [350, 1100, 1900, 2700, 3500, 4300, 5700, 7100];

function Seg({ show, className = '', children }: { show: boolean; className?: string; children: React.ReactNode }) {
  return <span className={`${show ? 'tour-text-in' : 'opacity-0'} ${className}`}>{children}</span>;
}

function GhostBar({ phase, t, lang }: { phase: number; t: OnboardingTexts; lang: string }) {
  const item = (n: number, label: string, icon: React.ReactNode) => (
    <div className={`flex flex-col items-center gap-0.5 px-3 py-1 text-white/85 ${phase >= n ? 'tour-ghost-in' : 'opacity-0'}`}>
      <span className="flex h-[22px] w-[22px] items-center justify-center">{icon}</span>
      <span className="text-[10px] font-semibold opacity-80">{label}</span>
    </div>
  );
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+18px)] lg:hidden" aria-hidden="true">
      <div
        className={`flex items-end justify-evenly gap-1 rounded-2xl border border-white/20 bg-black/75 px-3 py-0.5 backdrop-blur-xl ${
          phase >= 1 ? 'tour-ghost-in' : 'opacity-0'
        }`}
      >
        {item(2, t.navLang, <LanguageFlag lang={lang} className="h-4 w-5 rounded-sm grayscale" />)}
        {item(
          3,
          t.navSearch,
          <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>,
        )}
        {item(
          4,
          t.navTheme,
          <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
          </svg>,
        )}
        {item(5, t.navReels, <ReelsIcon className="h-[22px] w-[22px]" />)}
      </div>
    </div>
  );
}

function GhostHeader({ phase, dark }: { phase: number; dark: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 flex items-center justify-between px-3 lg:hidden" aria-hidden="true">
      <div className={phase >= 7 ? 'tour-logo-in' : 'opacity-0'}>
        <Image
          src={dark ? '/radikal.logo.weiß.hintergrund.png' : '/radikal.logo.schwarz.hintergrund.png'}
          alt=""
          width={120}
          height={120}
          className="h-auto rounded-sm grayscale"
          style={{ width: 'clamp(65px, 22vw, 95px)', height: 'auto' }}
        />
      </div>
      <div className={`p-2 text-white ${phase >= 6 ? 'tour-burger-in' : 'opacity-0'}`}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path className="tour-burger-bar" d="M3 7h18" />
          <path className="tour-burger-bar" d="M3 12h18" />
          <path className="tour-burger-bar" d="M3 17h18" />
        </svg>
      </div>
    </div>
  );
}

export default function OnboardingTour() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { tapLight } = useHaptic();
  const t = usePageText('onboarding', ONBOARDING_TEXTS, language) as OnboardingTexts;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState(0);

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

  // Coregrafia pasului „Navigation": elementele apar pe rand, in ritmul textului.
  useEffect(() => {
    if (!open || STEPS[step] !== 'nav') {
      setPhase(0);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase(NAV_SCHEDULE.length);
      return;
    }
    const timers = NAV_SCHEDULE.map((ms, i) => window.setTimeout(() => setPhase(i + 1), ms));
    return () => timers.forEach(window.clearTimeout);
  }, [open, step]);

  if (!open) return null;

  const kind = STEPS[step];
  const last = step === STEPS.length - 1;
  const title = kind === 'welcome' ? t.welcomeTitle : kind === 'nav' ? t.navTitle : t.listenTitle;

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {kind === 'nav' && (
        <>
          <GhostHeader phase={phase} dark={theme === 'dark'} />
          <GhostBar phase={phase} t={t} lang={language} />
        </>
      )}

      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-black/10 bg-white p-6 text-center text-black shadow-2xl dark:border-white/15 dark:bg-neutral-950 dark:text-white animate-fadeIn">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center text-black dark:text-white" aria-hidden="true">
          {kind === 'welcome' && <WriteLetterIcon key="w" className="h-14 w-14" />}
          {kind === 'nav' && <ToggleIcon key="n" className="h-14 w-14" />}
          {kind === 'listen' && <TriangleLoader key="l" size={46} rotate={90} />}
        </div>

        <h2 key={`t${step}`} className="mb-2 font-cinzel text-xl font-bold animate-fadeIn">
          {title}
        </h2>

        <div className="mb-5 min-h-[9rem] text-sm leading-relaxed text-black/75 dark:text-white/75">
          {kind === 'welcome' && (
            <div className="space-y-3">
              <p className="tour-text-in">{t.welcomeText}</p>
              <p className="text-xs italic leading-relaxed text-black/55 dark:text-white/55">{t.welcomeNote}</p>
            </div>
          )}

          {kind === 'listen' && <p className="tour-text-in">{t.listenText}</p>}

          {kind === 'nav' && (
            <div className="space-y-3">
              <p>
                <Seg show={phase >= 1}>{t.navIntro}</Seg>
              </p>
              <p className="flex flex-wrap justify-center gap-1.5">
                {[
                  [2, t.navLang],
                  [3, t.navSearch],
                  [4, t.navTheme],
                  [5, t.navReels],
                ].map(([n, label]) => (
                  <Seg
                    key={String(n)}
                    show={phase >= (n as number)}
                    className="rounded-full border border-black/15 px-2.5 py-0.5 text-xs font-semibold dark:border-white/20"
                  >
                    {label}
                  </Seg>
                ))}
              </p>
              <p>
                <Seg show={phase >= 6}>{t.navMenu}</Seg>
              </p>
              <p>
                <Seg show={phase >= 7}>{t.navLogo}</Seg>
              </p>
            </div>
          )}
        </div>

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
            {t.skip}
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
            {last ? t.start : t.next}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
