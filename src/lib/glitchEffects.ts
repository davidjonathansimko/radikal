// Efectul comun pentru schimbarea temei si a limbii: ecranul nou creste din fum (pete moi), in alb-negru care
// capata incet culoare, cu felii care licaresc, iar cuvintele si butoanele tremura si se imprastie o clipa.

import { flushSync } from 'react-dom';

const LIGHT = 'rgba(255,255,255,0.8)';
const GRAY = 'rgba(120,120,120,0.9)';

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function inViewport(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
}

/** Cuvintele si butoanele vizibile tremura. Nu atinge `transform`, deci nu strica alte animatii. */
export function scatterGlitch(duration = 1100): void {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, button, a, p, label, li, span, [role="button"]'),
  )
    .filter(inViewport)
    // Doar elementele cu text direct, ca sa nu tremure de doua ori acelasi cuvant (parinte + copil).
    .filter((el) => Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0))
    .slice(0, 160);

  nodes.forEach((el) => {
    const isText = /^(H1|H2|H3|H4|P|LABEL|LI|SPAN)$/.test(el.tagName);
    const dx = rand(10, 46) * (Math.random() < 0.5 ? -1 : 1);
    const dy = rand(0, 14) * (Math.random() < 0.5 ? -1 : 1);
    const s = rand(2, 6);
    const frames: Keyframe[] = [
      { translate: '0 0', textShadow: 'none', opacity: 1, offset: 0 },
      { translate: `${dx}px ${dy}px`, textShadow: `${s}px 0 ${LIGHT}, -${s}px 0 ${GRAY}`, opacity: 0.25, offset: 0.1 },
      { translate: `${-dx * 0.7}px ${-dy}px`, textShadow: `-${s}px 0 ${LIGHT}, ${s}px 0 ${GRAY}`, opacity: 1, offset: 0.2 },
      { translate: `${dx * 0.5}px ${dy * 0.5}px`, textShadow: `${s}px 0 ${GRAY}`, opacity: 0.4, offset: 0.32 },
      { translate: `${-dx * 0.35}px 0`, textShadow: `-${s / 2}px 0 ${LIGHT}`, opacity: 1, offset: 0.44 },
      { translate: `${dx * 0.25}px ${-dy * 0.5}px`, textShadow: `${s / 2}px 0 ${GRAY}`, opacity: 0.6, offset: 0.58 },
      { translate: `${-dx * 0.1}px 0`, textShadow: `${s / 3}px 0 ${LIGHT}`, opacity: 1, offset: 0.76 },
      { translate: '0 0', textShadow: 'none', opacity: 1, offset: 1 },
    ];
    if (isText) {
      // Textul se „risipeste" ca fumul: se incetoseaza putin si se limpezeste.
      frames[1].filter = 'blur(4px)';
      frames[2].filter = 'blur(1px)';
      frames[3].filter = 'blur(3px)';
      frames[5].filter = 'blur(1.5px)';
      frames[7].filter = 'blur(0px)';
    }
    try {
      el.animate(frames, { duration: duration * rand(0.75, 1), delay: rand(0, 90), easing: 'steps(11, end)' });
    } catch {
      /* browserele vechi fara `translate` animabil: sarim peste */
    }
  });
}

/** Ecranul NOU creste din fum; la inceput e alb-negru, tremura si licareste in felii, apoi capata culoare. */
export function glitchViewTransition(duration = 1300): void {
  try {
    const root = document.documentElement;
    const target = { pseudoElement: '::view-transition-new(root)', fill: 'both' as const };
    root.animate(
      [{ ['--smoke' as string]: '0%' }, { ['--smoke' as string]: '150%' }],
      { duration, easing: 'cubic-bezier(0.25, 0.7, 0.3, 1)', ...target },
    );
    root.animate(
      [
        { filter: 'grayscale(1) contrast(1.4) brightness(1.1)', transform: 'translateX(0)', offset: 0 },
        { filter: 'grayscale(1) contrast(1.25)', transform: 'translateX(-14px)', offset: 0.1 },
        { filter: 'grayscale(1) invert(0.1)', transform: 'translateX(12px)', offset: 0.2 },
        { filter: 'grayscale(1) contrast(1.3)', transform: 'translateX(-8px)', offset: 0.3 },
        { filter: 'grayscale(0.85) invert(0.05)', transform: 'translateX(9px)', offset: 0.4 },
        { filter: 'grayscale(0.6) contrast(1.1)', transform: 'translateX(-5px)', offset: 0.52 },
        { filter: 'grayscale(0.35)', transform: 'translateX(3px)', offset: 0.68 },
        { filter: 'grayscale(0.15)', transform: 'translateX(-1px)', offset: 0.82 },
        { filter: 'none', transform: 'none', offset: 1 },
      ],
      { duration, easing: 'steps(14, end)', ...target },
    );
    // Felii care licaresc in primele momente (dupa aceea ecranul e intreg).
    root.animate(
      [
        { clipPath: 'inset(0 0 0 0)', offset: 0 },
        { clipPath: 'inset(0 0 55% 0)', offset: 0.08 },
        { clipPath: 'inset(40% 0 0 0)', offset: 0.16 },
        { clipPath: 'inset(0 28% 0 0)', offset: 0.24 },
        { clipPath: 'inset(18% 0 38% 0)', offset: 0.32 },
        { clipPath: 'inset(0 0 0 22%)', offset: 0.4 },
        { clipPath: 'inset(62% 0 0 0)', offset: 0.47 },
        { clipPath: 'inset(0 0 0 0)', offset: 0.55 },
        { clipPath: 'inset(0 0 0 0)', offset: 1 },
      ],
      { duration, easing: 'steps(16, end)', ...target },
    );
    root.animate(
      [
        { filter: 'grayscale(0) blur(0px)', opacity: 1, offset: 0 },
        { filter: 'grayscale(1) blur(3px)', opacity: 0.9, offset: 0.35 },
        { filter: 'grayscale(1) blur(8px)', opacity: 0.5, offset: 0.75 },
        { filter: 'grayscale(1) blur(12px)', opacity: 0, offset: 1 },
      ],
      { duration, easing: 'ease-in-out', fill: 'both', pseudoElement: '::view-transition-old(root)' },
    );
  } catch {
    /* fara suport pentru pseudoElement: schimbarea ramane simpla */
  }
}

/** Aplica o schimbare (tema, limba) cu efectul de glitch; fara suport sau cu animatii reduse, schimba simplu. */
export function glitchSwap(apply: () => void, beforeSwap?: () => void): void {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    beforeSwap?.();
    apply();
    return;
  }
  if (!doc.startViewTransition) {
    scatterGlitch();
    apply();
    return;
  }
  const transition = doc.startViewTransition(() => {
    beforeSwap?.();
    flushSync(apply);
  });
  transition.ready
    .then(() => {
      glitchViewTransition();
      scatterGlitch();
    })
    .catch(() => {});
}
