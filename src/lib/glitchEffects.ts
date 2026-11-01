// Schimbarea temei: ecranul nou se formeaza din fum (pete moi din colturi si din mijloc), in alb-negru
// care capata incet culoare, iar cuvintele si butoanele tremura si se imprastie o clipa.

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function inViewport(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
}

/** Cuvintele si butoanele vizibile tremura. Nu atinge `transform`, deci nu strica alte animatii. */
export function scatterGlitch(duration = 1000): void {
  // Culorile urmeaza tema curenta: pe fundal luminos umbra e inchisa, pe fundal intunecat e deschisa.
  const lightTheme = document.documentElement.classList.contains('light');
  const LIGHT = lightTheme ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.75)';
  const GRAY = lightTheme ? 'rgba(90,90,90,0.7)' : 'rgba(120,120,120,0.85)';
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

/** Schimbarea temei: ecranul nou apare lin peste cel vechi (fara tremur si fara decupaje). */
export function themeCrossfade(duration = 560): void {
  try {
    document.documentElement.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'both', pseudoElement: '::view-transition-new(root)' },
    );
  } catch {
    /* fara suport pentru pseudoElement: schimbarea ramane simpla */
  }
}

/** Efectul ales in admin pentru schimbarea temei; `origin` = unde a apasat cititorul (pentru cerc). */
export function runThemeFx(fx: string, origin: { x: number; y: number }): void {
  const root = document.documentElement;
  const ease = 'cubic-bezier(0.4, 0, 0.2, 1)';
  const anim = (target: 'new' | 'old', frames: Keyframe[], duration: number) => {
    try {
      root.animate(frames, { duration, easing: ease, fill: 'both', pseudoElement: `::view-transition-${target}(root)` });
    } catch {
      /* fara suport: schimbarea ramane simpla */
    }
  };
  const w = window.innerWidth;
  const h = window.innerHeight;
  switch (fx) {
    case 'circle': {
      const r = Math.hypot(Math.max(origin.x, w - origin.x), Math.max(origin.y, h - origin.y));
      anim('new', [{ clipPath: `circle(0px at ${origin.x}px ${origin.y}px)` }, { clipPath: `circle(${r}px at ${origin.x}px ${origin.y}px)` }], 720);
      break;
    }
    case 'wipe':
      anim('new', [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], 650);
      break;
    case 'curtain':
      anim('new', [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], 650);
      break;
    case 'shake':
      themeCrossfade(520);
      scatterGlitch(900);
      break;
    case 'dissolve':
      anim('new', [{ opacity: 0, filter: 'blur(16px)' }, { opacity: 1, filter: 'blur(0px)' }], 760);
      break;
    case 'zoom':
      anim('new', [{ opacity: 0, transform: 'scale(1.06)' }, { opacity: 1, transform: 'scale(1)' }], 640);
      anim('old', [{ transform: 'scale(1)' }, { transform: 'scale(0.97)' }], 640);
      break;
    case 'iris': {
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.hypot(cx, cy);
      anim('new', [{ clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(${r}px at ${cx}px ${cy}px)` }], 760);
      break;
    }
    case 'wipeR':
      anim('new', [{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)' }], 650);
      break;
    case 'rise':
      anim('new', [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], 650);
      break;
    case 'split':
      anim('new', [{ clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0 0 0)' }], 700);
      break;
    case 'vsplit':
      anim('new', [{ clipPath: 'inset(50% 0 50% 0)' }, { clipPath: 'inset(0 0 0 0)' }], 700);
      break;
    case 'diagonal':
      anim('new', [{ clipPath: 'polygon(0 0, 0 0, 0 0)' }, { clipPath: 'polygon(0 0, 250% 0, 0 250%)' }], 760);
      break;
    case 'slide':
      anim('new', [{ transform: 'translateX(-100%)' }, { transform: 'translateX(0)' }], 650);
      anim('old', [{ transform: 'translateX(0)' }, { transform: 'translateX(28%)' }], 650);
      break;
    case 'flash':
      anim('new', [{ opacity: 0, filter: 'brightness(2.4)' }, { opacity: 1, filter: 'brightness(1)' }], 720);
      break;
    default:
      themeCrossfade();
  }
}

/** Efectul ales in admin pentru schimbarea limbii. */
export function runLangFx(fx: string): void {
  if (fx === 'none') return;
  if (fx === 'shake') {
    requestAnimationFrame(() => scatterGlitch(700));
    return;
  }
  requestAnimationFrame(() => {
    const el = document.getElementById('main-content');
    if (!el) return;
    try {
      if (fx === 'blur') el.animate([{ filter: 'blur(0px)' }, { filter: 'blur(9px)', offset: 0.4 }, { filter: 'blur(0px)' }], { duration: 620, easing: 'ease-in-out' });
      else if (fx === 'rise') el.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0.15, transform: 'translateY(14px)', offset: 0.4 }, { opacity: 1, transform: 'translateY(0)' }], { duration: 600, easing: 'ease-in-out' });
      else el.animate([{ opacity: 1 }, { opacity: 0.1, offset: 0.35 }, { opacity: 1 }], { duration: 520, easing: 'ease-in-out' });
    } catch {
      /* fara Web Animations: limba se schimba simplu */
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
