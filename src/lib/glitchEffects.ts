// Schimbarea temei: ecranul nou se formeaza din fum (pete moi din colturi si din mijloc), in alb-negru
// care capata incet culoare, iar cuvintele si butoanele tremura si se imprastie o clipa.

const LIGHT = 'rgba(255,255,255,0.75)';
const GRAY = 'rgba(120,120,120,0.85)';

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function inViewport(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
}

/** Cuvintele si butoanele vizibile tremura. Nu atinge `transform`, deci nu strica alte animatii. */
export function scatterGlitch(duration = 1000): void {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>('h1, h2, h3, button, a, p, label, [role="button"]'),
  )
    .filter(inViewport)
    .slice(0, 100);

  nodes.forEach((el) => {
    const isText = /^(H1|H2|H3|P|LABEL)$/.test(el.tagName);
    const dx = rand(8, 34) * (Math.random() < 0.5 ? -1 : 1);
    const dy = rand(0, 10) * (Math.random() < 0.5 ? -1 : 1);
    const s = rand(2, 5);
    const frames: Keyframe[] = [
      { translate: '0 0', textShadow: 'none', opacity: 1, offset: 0 },
      { translate: `${dx}px ${dy}px`, textShadow: `${s}px 0 ${LIGHT}, -${s}px 0 ${GRAY}`, opacity: 0.35, offset: 0.14 },
      { translate: `${-dx * 0.6}px ${-dy}px`, textShadow: `-${s}px 0 ${LIGHT}, ${s}px 0 ${GRAY}`, opacity: 1, offset: 0.3 },
      { translate: `${dx * 0.35}px ${dy * 0.5}px`, textShadow: `${s / 2}px 0 ${LIGHT}, -${s / 2}px 0 ${GRAY}`, opacity: 0.6, offset: 0.52 },
      { translate: `${-dx * 0.15}px 0`, textShadow: `${s / 3}px 0 ${GRAY}`, opacity: 1, offset: 0.76 },
      { translate: '0 0', textShadow: 'none', opacity: 1, offset: 1 },
    ];
    if (isText) {
      // Textul se „risipeste" ca fumul: se incetoseaza si urca putin.
      frames[1].filter = 'blur(4px)';
      frames[2].filter = 'blur(1px)';
      frames[3].filter = 'blur(2.5px)';
      frames[5].filter = 'blur(0px)';
    }
    try {
      el.animate(frames, { duration: duration * rand(0.75, 1), delay: rand(0, 90), easing: 'steps(9, end)' });
    } catch {
      /* browserele vechi fara `translate` animabil: sarim peste */
    }
  });
}

/** Ecranul NOU creste din fum; la inceput e alb-negru si tremura, apoi capata culoare. */
export function glitchViewTransition(duration = 1300): void {
  try {
    const root = document.documentElement;
    root.animate(
      [{ ['--smoke' as string]: '0%' }, { ['--smoke' as string]: '150%' }],
      { duration, easing: 'cubic-bezier(0.25, 0.7, 0.3, 1)', fill: 'both', pseudoElement: '::view-transition-new(root)' },
    );
    root.animate(
      [
        { filter: 'grayscale(1) contrast(1.35) brightness(1.1)', transform: 'translateX(0)', offset: 0 },
        { filter: 'grayscale(1) contrast(1.2)', transform: 'translateX(-9px)', offset: 0.12 },
        { filter: 'grayscale(1) invert(0.08)', transform: 'translateX(8px)', offset: 0.24 },
        { filter: 'grayscale(0.85)', transform: 'translateX(-5px)', offset: 0.38 },
        { filter: 'grayscale(0.6) contrast(1.1)', transform: 'translateX(4px)', offset: 0.52 },
        { filter: 'grayscale(0.3)', transform: 'translateX(-2px)', offset: 0.7 },
        { filter: 'none', transform: 'none', offset: 1 },
      ],
      { duration, easing: 'steps(12, end)', fill: 'both', pseudoElement: '::view-transition-new(root)' },
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
