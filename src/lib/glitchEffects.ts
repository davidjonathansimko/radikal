// Efect „glitch" pentru schimbarea temei: felii din ecranul nou apar pe rand, culorile se
// despart in rosu/cian, iar cuvintele si butoanele de pe ecran tremura si se imprastie o clipa.

const RED = '#ff2a6d';
const CYAN = '#05d9e8';

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function inViewport(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
}

/** Cuvintele si butoanele vizibile tremura cu despartire de culori. Nu atinge `transform`, deci nu strica alte animatii. */
export function scatterGlitch(duration = 750): void {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>('h1, h2, h3, button, a, p, label, [role="button"]'),
  )
    .filter(inViewport)
    .slice(0, 90);

  nodes.forEach((el) => {
    const dx = rand(6, 26) * (Math.random() < 0.5 ? -1 : 1);
    const dy = rand(0, 6) * (Math.random() < 0.5 ? -1 : 1);
    const s = rand(2, 5);
    try {
      el.animate(
        [
          { translate: '0 0', textShadow: 'none', offset: 0 },
          { translate: `${dx}px ${dy}px`, textShadow: `${s}px 0 ${RED}, -${s}px 0 ${CYAN}`, offset: 0.18 },
          { translate: `${-dx * 0.6}px 0`, textShadow: `-${s}px 0 ${RED}, ${s}px 0 ${CYAN}`, offset: 0.38 },
          { translate: `${dx * 0.3}px ${-dy}px`, textShadow: `${s / 2}px 0 ${RED}, -${s / 2}px 0 ${CYAN}`, offset: 0.62 },
          { translate: '0 0', textShadow: 'none', offset: 1 },
        ],
        { duration: duration * rand(0.7, 1), delay: rand(0, 160), easing: 'steps(7, end)' },
      );
    } catch {
      /* browserele vechi fara `translate` animabil: sarim peste */
    }
  });
}

/** Felii din ecranul NOU se dezvaluie pe rand, cu culori care trec din saturate in normale. */
export function glitchViewTransition(duration = 900): void {
  const common = { duration, easing: 'linear', fill: 'both' as const };
  try {
    document.documentElement.animate(
      [
        { clipPath: 'inset(0 0 100% 0)', filter: 'hue-rotate(90deg) saturate(3)', transform: 'translateX(-10px)', offset: 0 },
        { clipPath: 'inset(8% 0 78% 0)', filter: 'hue-rotate(-70deg) saturate(2.6)', transform: 'translateX(12px)', offset: 0.14 },
        { clipPath: 'inset(52% 0 22% 0)', filter: 'hue-rotate(140deg) saturate(2.2)', transform: 'translateX(-8px)', offset: 0.28 },
        { clipPath: 'inset(0 0 48% 0)', filter: 'hue-rotate(-40deg) saturate(2)', transform: 'translateX(6px)', offset: 0.44 },
        { clipPath: 'inset(30% 0 0 0)', filter: 'hue-rotate(60deg) saturate(1.6)', transform: 'translateX(-4px)', offset: 0.6 },
        { clipPath: 'inset(0 0 0 0)', filter: 'hue-rotate(-20deg) saturate(1.3)', transform: 'translateX(3px)', offset: 0.78 },
        { clipPath: 'inset(0 0 0 0)', filter: 'none', transform: 'none', offset: 1 },
      ],
      { ...common, pseudoElement: '::view-transition-new(root)' },
    );
    document.documentElement.animate(
      [
        { filter: 'none', opacity: 1, offset: 0 },
        { filter: 'hue-rotate(-90deg) saturate(3)', opacity: 1, offset: 0.3 },
        { filter: 'hue-rotate(120deg) saturate(2)', opacity: 0.8, offset: 0.7 },
        { filter: 'none', opacity: 0, offset: 1 },
      ],
      { ...common, pseudoElement: '::view-transition-old(root)' },
    );
  } catch {
    /* fara suport pentru pseudoElement: schimbarea ramane simpla */
  }
}
