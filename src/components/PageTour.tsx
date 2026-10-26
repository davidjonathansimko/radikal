'use client';

// Prezentare scurta, o singura data, pentru o pagina (de pilda Blogs): scoate in evidenta pe rand cateva elemente,
// cu un deget care arata gestul (glisare sau atingere). Apare doar pe telefon/tableta, dupa tutorialul de la inceput.

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useTourLock } from '@/hooks/useTourLock';

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

const HAND =
  'M373.961,177.868h-11.99c-10.98,0-20.882,4.706-27.793,12.208c-6.91-7.502-16.811-12.208-27.791-12.208h-11.992 c-10.979,0-20.88,4.706-27.791,12.208c-6.911-7.502-16.811-12.208-27.791-12.208H226.82c-6.428,0-12.486,1.613-17.791,4.456 v-20.098c26.825-15.561,43.237-43.833,43.237-75.219C252.267,39.031,213.235,0,165.26,0c-47.978,0-87.01,39.031-87.01,87.008 c0.002,31.367,16.402,59.632,43.205,75.197v290.003c0,20.839,16.953,37.792,37.792,37.792h214.714 c20.837,0,37.789-16.953,37.789-37.792V215.659C411.75,194.821,394.798,177.868,373.961,177.868z M98.25,87.008 C98.25,50.06,128.311,20,165.26,20c36.947,0,67.007,30.06,67.007,67.008c0,19.949-8.615,38.261-23.237,50.79V93.592 c0-20.838-16.953-37.791-37.792-37.791h-11.99c-20.839,0-37.792,16.953-37.792,37.791v44.175 C106.854,125.236,98.252,106.938,98.25,87.008z M391.75,452.208c0,9.81-7.98,17.792-17.789,17.792H159.247 c-9.811,0-17.792-7.982-17.792-17.792V93.592c0-9.811,7.981-17.791,17.792-17.791h11.99c9.811,0,17.792,7.98,17.792,17.791 l0.033,143.88c0,5.522,4.478,10,10,10c5.522,0,10-4.478,10-10v-22.468c0.349-9.505,8.17-17.136,17.758-17.136h11.992 c9.81,0,17.791,7.981,17.791,17.791v26.451c0,5.522,4.478,10,10,10c5.523,0,10-4.478,10-10v-26.451 c0-9.81,7.981-17.791,17.791-17.791h11.992c9.81,0,17.791,7.981,17.791,17.791v26.451c0,5.522,4.478,10,10,10 c5.522,0,10-4.478,10-10v-26.451c0-9.81,7.982-17.791,17.793-17.791h11.99c9.809,0,17.789,7.981,17.789,17.791V452.208z';

export default function PageTour({ id, steps }: { id: string; steps: TourStep[] }) {
  const { language } = useLanguage();
  const lang = ['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de';
  const key = `radikalTour:${id}`;
  const [index, setIndex] = useState(-1);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  // „Weiter" se activeaza abia dupa ce animatia pasului a rulat o data.
  const [ready, setReady] = useState(false);
  useTourLock(index >= 0);
  useEffect(() => {
    setReady(false);
    if (index < 0 || !rect) return;
    const t = window.setTimeout(() => setReady(true), 1900);
    return () => window.clearTimeout(t);
  }, [index, rect]);

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
        onboardingDone = Boolean(localStorage.getItem('radikalOnboardingDone'));
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
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = 8;
  // Chenarul nu atinge marginile ecranului.
  const hl = {
    top: Math.max(8, rect.top - pad),
    left: Math.max(14, rect.left - pad),
    right: Math.min(vw - 14, rect.left + rect.width + pad),
    bottom: Math.min(vh - 8, rect.top + rect.height + pad),
  };
  const hlH = hl.bottom - hl.top;
  const below = rect.top + rect.height / 2 < vh / 2;
  const cardTop = below ? Math.min(hl.bottom + 16, vh - 230) : Math.max(16, hl.top - 16 - 190);
  const panel = 'absolute bg-black/55 backdrop-blur-[5px]';
  const fingerSize = 64;
  // Atingerea: degetul sta langa element, ca sa nu acopere pictograma.
  const beside = step.gesture === 'tap';
  const fingerLeft = beside ? Math.min(hl.right - 8, vw - fingerSize - 6) : (hl.left + hl.right) / 2 - fingerSize / 2;
  const fingerTop = beside ? hl.top + hlH / 2 - 8 : hl.top + hlH / 2 - fingerSize / 2;

  return createPortal(
    <div className="fixed inset-0 z-[9995] touch-none" role="dialog" aria-modal="true" aria-label={step.title[lang]}>
      <div className="absolute inset-0" />
      {/* Totul din jur e incetosat; doar elementul evidentiat ramane clar. */}
      <div className={panel} style={{ top: 0, left: 0, width: vw, height: hl.top }} />
      <div className={panel} style={{ top: hl.bottom, left: 0, width: vw, height: Math.max(0, vh - hl.bottom) }} />
      <div className={panel} style={{ top: hl.top, left: 0, width: hl.left, height: hlH }} />
      <div className={panel} style={{ top: hl.top, left: hl.right, width: Math.max(0, vw - hl.right), height: hlH }} />
      <div
        className="pointer-events-none absolute rounded-2xl border-2 border-white/90 shadow-[0_0_24px_rgba(255,255,255,0.25)] transition-all duration-300"
        style={{ top: hl.top, left: hl.left, width: hl.right - hl.left, height: hlH }}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute ${step.gesture === 'swipe' ? 'tour-finger-swipe' : ''}`}
        style={{
          top: fingerTop,
          left: fingerLeft,
          width: fingerSize,
          height: fingerSize,
        }}
      >
        <svg viewBox="0 0 490 490" width={fingerSize} height={fingerSize} className="tour-finger-beat drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]" fill="#ffffff">
          <path d={HAND} />
        </svg>
      </span>
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
          <button type="button" onClick={finish} style={{ minHeight: 44 }} className="px-3 text-sm text-white/55 hover:text-white">
            {UI.skip[lang]}
          </button>
          <button
            type="button"
            onClick={() => (last ? finish() : setIndex(index + 1))}
            disabled={!ready}
            style={{ minHeight: 44 }}
            className="rounded-full bg-white px-6 text-sm font-semibold text-black transition-opacity disabled:opacity-35"
          >
            {last ? UI.done[lang] : UI.next[lang]}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
