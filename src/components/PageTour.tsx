'use client';

// Prezentare scurta, o singura data, pentru o pagina (de pilda Blogs): scoate in evidenta pe rand cateva elemente,
// cu un deget care arata gestul (glisare sau atingere). Apare doar pe telefon/tableta, dupa tutorialul de la inceput.

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/hooks/useLanguage';

export interface TourStep {
  /** Selector CSS al elementului evidentiat. */
  target: string;
  title: Record<string, string>;
  text: Record<string, string>;
  gesture: 'swipe' | 'tap';
}

const UI = {
  next: { de: 'Weiter', en: 'Next', ro: 'Mai departe', ru: 'Далее' },
  done: { de: 'Fertig', en: 'Done', ro: 'Gata', ru: 'Готово' },
  skip: { de: 'Überspringen', en: 'Skip', ro: 'Sari peste', ru: 'Пропустить' },
} as const;

export default function PageTour({ id, steps }: { id: string; steps: TourStep[] }) {
  const { language } = useLanguage();
  const lang = ['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de';
  const key = `radikalTour:${id}`;
  const [index, setIndex] = useState(-1);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Porneste cand tutorialul de la inceput s-a terminat si elementele sunt pe ecran.
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      return;
    }
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (tries > 60) {
        window.clearInterval(timer);
        return;
      }
      let onboardingDone = false;
      try {
        onboardingDone = localStorage.getItem('radikalOnboardingDone') === '1' || localStorage.getItem('radikalOnboardingDone') === 'true';
        if (!onboardingDone) onboardingDone = Boolean(localStorage.getItem('radikalOnboardingDone'));
      } catch {
        /* ignora */
      }
      if (!onboardingDone || document.querySelector('[role="dialog"]')) return;
      if (steps.every((s) => document.querySelector(s.target))) {
        window.clearInterval(timer);
        window.setTimeout(() => setIndex(0), 600);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [key, steps]);

  const measure = useCallback(() => {
    const step = steps[index];
    const el = step ? document.querySelector<HTMLElement>(step.target) : null;
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [index, steps]);

  useEffect(() => {
    if (index < 0) return;
    const el = document.querySelector<HTMLElement>(steps[index].target);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setRect(null);
    const t = window.setTimeout(measure, 550);
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [index, steps, measure]);

  const finish = () => {
    try {
      localStorage.setItem(key, '1');
    } catch {
      /* ignora */
    }
    setIndex(-1);
  };

  if (index < 0 || !rect) return null;
  const step = steps[index];
  const last = index === steps.length - 1;
  const pad = 8;
  const below = rect.top + rect.height / 2 < window.innerHeight / 2;
  const cardTop = below ? Math.min(rect.top + rect.height + pad + 14, window.innerHeight - 230) : Math.max(16, rect.top - pad - 14 - 190);

  return createPortal(
    <div className="fixed inset-0 z-[9995]" role="dialog" aria-modal="true" aria-label={step.title[lang]}>
      <div className="absolute inset-0" />
      <div
        className="pointer-events-none absolute rounded-2xl border-2 border-white/90 transition-all duration-300"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.78)',
        }}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute h-9 w-9 rounded-full bg-white/90 shadow-[0_0_18px_rgba(255,255,255,0.6)] ${step.gesture === 'swipe' ? 'tour-finger-swipe' : 'tour-finger-tap'}`}
        style={{ top: rect.top + rect.height / 2 - 18, left: rect.left + rect.width / 2 - 18 }}
      />
      <div
        className="absolute left-1/2 w-[min(340px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-white/15 bg-neutral-950 p-5 text-center text-white shadow-2xl"
        style={{ top: cardTop }}
      >
        <h2 className="mb-1.5 font-cinzel text-lg font-bold" style={{ color: '#fff' }}>{step.title[lang]}</h2>
        <p className="mb-4 text-sm leading-relaxed text-white/75">{step.text[lang]}</p>
        <div className="mb-3 flex items-center justify-center gap-1.5" aria-hidden="true">
          {steps.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`} />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={finish}
            style={{ minHeight: 44 }}
            className="px-3 text-sm text-white/55 hover:text-white"
          >
            {UI.skip[lang]}
          </button>
          <button
            type="button"
            onClick={() => (last ? finish() : setIndex(index + 1))}
            style={{ minHeight: 44 }}
            className="rounded-full bg-white px-6 text-sm font-semibold text-black"
          >
            {last ? UI.done[lang] : UI.next[lang]}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
