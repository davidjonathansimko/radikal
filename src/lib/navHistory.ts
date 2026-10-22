// Pasul 2210010 — harta istoricului de navigare din aceasta fila.
//
// Browserul nu ne spune cate pagini sunt in urma. Asa ca fiecare intrare noua
// din istoric primeste un numar (`radikalIdx`, pus in `history.state`), iar
// aici tinem lista paginilor pe numere. Cu ea, un buton de tip „inapoi la X"
// stie exact cati pasi trebuie sa faca si se intoarce prin istoric, in loc sa
// adauge o intrare noua. Asa „inapoi" de pe telefon nu se mai invarte in cerc.

const STACK_KEY = 'radikalNavStack';
const IDX_KEY = 'radikalNavIdx';
const MAX = 200;

type Op = 'push' | 'replace' | null;
let lastOp: Op = null;

interface Stamped {
  radikalIdx?: number;
}

function readStack(): (string | null)[] {
  try {
    const raw = sessionStorage.getItem(STACK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStack(stack: (string | null)[]): void {
  try {
    sessionStorage.setItem(STACK_KEY, JSON.stringify(stack.slice(-MAX)));
  } catch {
    /* fila privata */
  }
}

function readIdx(): number {
  try {
    const n = Number(sessionStorage.getItem(IDX_KEY));
    return Number.isFinite(n) && sessionStorage.getItem(IDX_KEY) !== null ? n : -1;
  } catch {
    return -1;
  }
}

function writeIdx(idx: number): void {
  try {
    sessionStorage.setItem(IDX_KEY, String(idx));
  } catch {
    /* fila privata */
  }
}

function plain(path: string): string {
  const clean = path.split(/[?#]/)[0];
  return clean.length > 1 ? clean.replace(/\/$/, '') : clean;
}

let originalReplace: History['replaceState'] | null = null;

/** Se cheama o singura data: aflam daca o schimbare de pagina e push sau replace. */
export function installNavTracking(): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { __radikalNavHooked?: boolean };
  if (w.__radikalNavHooked) return;
  w.__radikalNavHooked = true;

  const push = window.history.pushState.bind(window.history);
  const replace = window.history.replaceState.bind(window.history);
  originalReplace = replace;

  window.history.pushState = (data, unused, url) => {
    lastOp = 'push';
    return push(data, unused, url);
  };
  window.history.replaceState = (data, unused, url) => {
    lastOp = 'replace';
    return replace(data, unused, url);
  };

  // La „inapoi" / „inainte", intrarea tinta isi aduce singura numarul.
  window.addEventListener('popstate', (event) => {
    const idx = (event.state as Stamped | null)?.radikalIdx;
    if (typeof idx === 'number') writeIdx(idx);
  });
}

/** Chemata la fiecare schimbare de pagina. */
export function trackPath(pathname: string): void {
  if (typeof window === 'undefined') return;
  try {
    const stack = readStack();
    const state = (window.history.state ?? {}) as Stamped;
    let idx = readIdx();
    let next = stack;

    if (typeof state.radikalIdx === 'number') {
      // Intrare deja numerotata (reincarcare sau „inapoi").
      idx = state.radikalIdx;
    } else if (lastOp === 'replace' && idx >= 0) {
      // Aceeasi intrare, alta adresa.
    } else {
      // Intrare noua: ce era mai departe in istoric nu mai exista.
      idx += 1;
      next = stack.slice(0, idx);
    }

    while (next.length < idx) next.push(null);
    next[idx] = pathname;
    writeStack(next);
    writeIdx(idx);

    if (state.radikalIdx !== idx && originalReplace) {
      originalReplace(
        { ...(window.history.state ?? {}), radikalIdx: idx },
        '',
      );
    }
  } catch {
    /* nu stricam navigarea daca ceva nu merge */
  } finally {
    lastOp = null;
  }
}

/**
 * Cati pasi inapoi se afla cea mai apropiata pagina care se potriveste?
 * 0 = nu exista, atunci se navigheaza normal.
 */
export function stepsBackTo(match: string | ((path: string) => boolean)): number {
  try {
    const stack = readStack();
    const idx = readIdx();
    const test =
      typeof match === 'string' ? (p: string) => plain(p) === plain(match) : match;
    for (let i = idx - 1; i >= 0; i -= 1) {
      const p = stack[i];
      if (p && test(p)) return idx - i;
    }
  } catch {
    /* ignora */
  }
  return 0;
}

/** Pagina de la care se pleaca (folosit in teste). */
export function currentIndex(): number {
  return readIdx();
}

/** Potrivire pentru „lista" unui articol: lista sau o rubrica, nu alt articol. */
export function listMatcher(listPath: string, articlePrefix: string): (p: string) => boolean {
  return (p) => {
    const path = plain(p);
    const isList = path === plain(listPath) || path.startsWith(`${plain(listPath)}/`);
    return isList && !path.startsWith(`${plain(articlePrefix)}/`);
  };
}

/** Un pas (sau mai multi) inapoi in istoric. */
export function goBackSteps(n: number): void {
  window.history.go(-n);
}
