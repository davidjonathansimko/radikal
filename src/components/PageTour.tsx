'use client';

// Prezentare scurta, o singura data, pentru o pagina (Blogs, articol): scoate in evidenta pe rand cateva elemente,
// cu un deget care arata gestul (glisare, derulare sau atingere). Apare doar pe telefon/tableta, dupa tutorialul de la inceput.

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useTourLock } from '@/hooks/useTourLock';

export interface TourStep {
  /** Selector CSS al elementului evidentiat (se alege primul element vizibil). */
  target: string;
  title: Record<string, string>;
  text: Record<string, string>;
  gesture: 'swipe' | 'tap' | 'scroll';
  /** Pasul se arata doar daca elementul exista (de pilda butonul Serii, care apare doar daca exista serii). */
  optional?: boolean;
  /** Elementul apare abia dupa ce pasul il provoaca (sageata „sus" apare dupa derulare): pasul ramane in lista cat timp exista in pagina. */
  late?: boolean;
  /** Inainte de pas, pagina se deruleaza pana la aceasta pozitie (px). */
  scrollDown?: number;
}

const UI = {
  next: { de: 'Weiter', en: 'Next', ro: 'Mai departe', ru: 'Далее' },
  done: { de: 'Fertig', en: 'Done', ro: 'Gata', ru: 'Готово' },
  skip: { de: 'Überspringen', en: 'Skip', ro: 'Sari peste', ru: 'Пропустить' },
} as const;

const HAND =
  'M373.961,177.868h-11.99c-10.98,0-20.882,4.706-27.793,12.208c-6.91-7.502-16.811-12.208-27.791-12.208h-11.992 c-10.979,0-20.88,4.706-27.791,12.208c-6.911-7.502-16.811-12.208-27.791-12.208H226.82c-6.428,0-12.486,1.613-17.791,4.456 v-20.098c26.825-15.561,43.237-43.833,43.237-75.219C252.267,39.031,213.235,0,165.26,0c-47.978,0-87.01,39.031-87.01,87.008 c0.002,31.367,16.402,59.632,43.205,75.197v290.003c0,20.839,16.953,37.792,37.792,37.792h214.714 c20.837,0,37.789-16.953,37.789-37.792V215.659C411.75,194.821,394.798,177.868,373.961,177.868z M98.25,87.008 C98.25,50.06,128.311,20,165.26,20c36.947,0,67.007,30.06,67.007,67.008c0,19.949-8.615,38.261-23.237,50.79V93.592 c0-20.838-16.953-37.791-37.792-37.791h-11.99c-20.839,0-37.792,16.953-37.792,37.791v44.175 C106.854,125.236,98.252,106.938,98.25,87.008z M391.75,452.208c0,9.81-7.98,17.792-17.789,17.792H159.247 c-9.811,0-17.792-7.982-17.792-17.792V93.592c0-9.811,7.981-17.791,17.792-17.791h11.99c9.811,0,17.792,7.98,17.792,17.791 l0.033,143.88c0,5.522,4.478,10,10,10c5.522,0,10-4.478,10-10v-22.468c0.349-9.505,8.17-17.136,17.758-17.136h11.992 c9.81,0,17.791,7.981,17.791,17.791v26.451c0,5.522,4.478,10,10,10c5.523,0,10-4.478,10-10v-26.451 c0-9.81,7.981-17.791,17.791-17.791h11.992c9.81,0,17.791,7.981,17.791,17.791v26.451c0,5.522,4.478,10,10,10 c5.522,0,10-4.478,10-10v-26.451c0-9.81,7.982-17.791,17.793-17.791h11.99c9.809,0,17.789,7.981,17.789,17.791V452.208z';

const FINGER = 64;
/** Varful degetului in desen: ~34% din latime, sus. */
const TIP_X = Math.round(FINGER * 0.34);
const RADIUS = 16;

function findShown(sel: string): HTMLElement | null {
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

/** Ecran incetosat cu o gaura rotunjita exact in jurul elementului. */
function holePath(vw: number, vh: number, l: number, t: number, r: number, b: number, rad: number): string {
  const rr = Math.max(0, Math.min(rad, (r - l) / 2, (b - t) / 2));
  return `path(evenodd, 'M0 0H${vw}V${vh}H0Z M${l + rr} ${t}H${r - rr}A${rr} ${rr} 0 0 1 ${r} ${t + rr}V${b - rr}A${rr} ${rr} 0 0 1 ${r - rr} ${b}H${l + rr}A${rr} ${rr} 0 0 1 ${l} ${b - rr}V${t + rr}A${rr} ${rr} 0 0 1 ${l + rr} ${t}Z')`;
}

/** Textul apare cuvant cu cuvant, din ceata (ca in tutorialul de la inceput). */
function Words({ text, base = 0 }: { text: string; base?: number }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <React.Fragment key={i}>
          <span className="tour-text-in" style={{ animationDelay: `${base + i * 45}ms` }}>
            {w}
          </span>{' '}
        </React.Fragment>
      ))}
    </>
  );
}

export default function PageTour({ id, steps: allSteps }: { id: string; steps: TourStep[] }) {
  const { language } = useLanguage();
  const lang = ['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de';
  const key = `radikalTour:${id}`;
  const [steps, setSteps] = useState<TourStep[]>(allSteps);
  const [index, setIndex] = useState(-1);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [cardH, setCardH] = useState(190);
  const cardRef = useRef<HTMLDivElement>(null);
  useTourLock(index >= 0);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(key, '1');
    } catch {
      /* ignora */
    }
    setIndex(-1);
  }, [key]);

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
      const required = allSteps.filter((s) => !s.optional && !s.late);
      if (required.length > 0 && required.every((s) => findShown(s.target))) {
        window.clearInterval(timer);
        setSteps(allSteps.filter((s) => (!s.optional && !s.late) || (s.late ? document.querySelector(s.target) : findShown(s.target))));
        window.setTimeout(() => setIndex(0), 600);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [key, allSteps]);

  // La fiecare pas: pagina se aseaza, apoi asteptam ca elementul sa stea pe loc inainte de a-l evidentia.
  useEffect(() => {
    if (index < 0) return;
    const step = steps[index];
    setRect(null);
    setReady(false);
    const advance = () => (index + 1 >= steps.length ? finish() : setIndex(index + 1));
    if (step.scrollDown) window.scrollTo({ top: Math.max(window.scrollY, step.scrollDown), behavior: 'smooth' });
    else findShown(step.target)?.scrollIntoView({ block: 'center', behavior: 'smooth' });

    const started = Date.now();
    let last = '';
    let stable = 0;
    const tick = window.setInterval(() => {
      const waited = Date.now() - started;
      const el = findShown(step.target);
      const visible = el && (!step.late || Number(getComputedStyle(el).opacity) > 0.6);
      if (!el || !visible) {
        if (waited > (step.late ? 3000 : 2200)) {
          window.clearInterval(tick);
          advance();
        }
        return;
      }
      const r = el.getBoundingClientRect();
      const sig = `${Math.round(r.top)}|${Math.round(r.left)}|${Math.round(r.width)}|${Math.round(r.height)}`;
      stable = sig === last ? stable + 1 : 0;
      last = sig;
      if ((stable >= 3 && waited > 450) || waited > 2600) {
        window.clearInterval(tick);
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
    }, 100);
    return () => window.clearInterval(tick);
  }, [index, steps, finish]);

  // „Mai departe" se activeaza dupa ce textul a aparut.
  useEffect(() => {
    if (index < 0 || !rect) return;
    const words = (steps[index].text[lang] ?? '').split(' ').length;
    const t = window.setTimeout(() => setReady(true), Math.min(3200, 1100 + words * 40));
    return () => window.clearTimeout(t);
  }, [index, rect, steps, lang]);

  useLayoutEffect(() => {
    const h = cardRef.current?.offsetHeight;
    if (h && Math.abs(h - cardH) > 1) setCardH(h);
  });

  if (index < 0) return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (!rect) {
    return createPortal(<div className="force-white-text fixed inset-0 z-[9995] touch-none bg-black/55 backdrop-blur-[5px]" aria-hidden="true" />, document.body);
  }

  const step = steps[index];
  const last = index === steps.length - 1;
  const pad = 8;
  const hl = {
    top: Math.max(8, rect.top - pad),
    left: Math.max(14, rect.left - pad),
    right: Math.min(vw - 14, rect.left + rect.width + pad),
    bottom: Math.min(vh - 8, rect.top + rect.height + pad),
  };
  // Un element mai inalt decat jumatate din ecran: evidentiem doar o fasie, ca mesajul sa aiba loc.
  if (hl.bottom - hl.top > vh * 0.45) {
    hl.top = vh * 0.46;
    hl.bottom = hl.top + vh * 0.34;
  }
  const hlH = hl.bottom - hl.top;
  const cx = Math.min(vw - 24, Math.max(24, (hl.left + hl.right) / 2));
  const cy = hl.top + hlH / 2;

  // Mesajul nu atinge niciodata chenarul alb: se aseaza deasupra sau dedesubt, unde incape.
  const gap = 16;
  const spaceAbove = hl.top - 8;
  const spaceBelow = vh - hl.bottom - 8;
  let cardAbove = spaceAbove >= spaceBelow;
  if (cardAbove && spaceAbove < cardH + gap && spaceBelow >= cardH + gap) cardAbove = false;
  else if (!cardAbove && spaceBelow < cardH + gap && spaceAbove >= cardH + gap) cardAbove = true;
  const cardTop = cardAbove ? Math.max(8, hl.top - gap - cardH) : Math.min(vh - cardH - 8, hl.bottom + gap);

  // Degetul sta de partea opusa mesajului, cu varful pe element.
  const handBelow = cardAbove ? cy + FINGER + 12 < vh : !(cy - FINGER - 12 > 8);
  const handLeft = step.gesture === 'tap' ? (handBelow ? cx - TIP_X : cx - (FINGER - TIP_X)) : cx - FINGER / 2;
  const handTop = step.gesture === 'tap' ? (handBelow ? cy + 2 : cy - FINGER + 2) : cy - FINGER / 2;
  const fingerClass = step.gesture === 'swipe' ? 'tour-finger-swipe' : step.gesture === 'scroll' ? 'tour-finger-scroll' : '';
  const titleWords = (step.title[lang] ?? '').split(' ').length;

  return createPortal(
    <div className="force-white-text fixed inset-0 z-[9995] touch-none" role="dialog" aria-modal="true" aria-label={step.title[lang]}>
      <div
        className="pointer-events-none absolute inset-0 bg-black/55 backdrop-blur-[5px]"
        style={{ clipPath: holePath(vw, vh, hl.left, hl.top, hl.right, hl.bottom, RADIUS) }}
      />
      <div className="absolute inset-0" />
      <div
        className="pointer-events-none absolute rounded-2xl border-2 border-white/90 shadow-[0_0_24px_rgba(255,255,255,0.25)] transition-all duration-300"
        style={{ top: hl.top, left: hl.left, width: hl.right - hl.left, height: hlH }}
      />
      <div
        key={index}
        ref={cardRef}
        className="tour-card-in absolute inset-x-0 mx-auto w-[min(340px,calc(100vw-32px))] rounded-2xl border border-white/15 bg-neutral-950 p-5 text-center text-white shadow-2xl"
        style={{ top: cardTop }}
      >
        <h2 className="mb-1.5 font-cinzel text-lg font-bold" style={{ color: '#fff' }}>
          <Words text={step.title[lang] ?? ''} />
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-white/75">
          <Words text={step.text[lang] ?? ''} base={titleWords * 45 + 250} />
        </p>
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
      {/* Degetul e desenat ultimul, deasupra mesajului. */}
      <span
        key={`h${index}`}
        aria-hidden="true"
        className={`pointer-events-none absolute ${fingerClass}`}
        style={{ top: handTop, left: handLeft, width: FINGER, height: FINGER }}
      >
        <span className="block" style={{ transform: step.gesture === 'tap' && !handBelow ? 'rotate(180deg)' : undefined }}>
          <svg viewBox="0 0 490 490" width={FINGER} height={FINGER} className="tour-finger-beat drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]" fill="#ffffff">
            <path d={HAND} />
          </svg>
        </span>
      </span>
    </div>,
    document.body,
  );
}
