// Potrivirea cuvintelor cu vocea: gasim pauzele reale din audio (la punct, virgula etc.) si le legam de semnele
// de punctuatie din text. Asa textul isi re-ancoreaza pozitia la fiecare propozitie si nu mai ramane in urma
// (sau in fata) vocii nici la texte lungi. Daca ceva nu merge, intoarce null si se foloseste estimarea veche.

export interface WeightedWord {
  text: string;
  weight: number;
}

const STRONG = /[.!?…]["»”')\]]*$/;
const WEAK = /[:;,—–]["»”')\]]*$/;

interface Pause {
  start: number;
  end: number;
}

async function decode(src: string): Promise<AudioBuffer | null> {
  try {
    const res = await fetch(src);
    const data = await res.arrayBuffer();
    const Ctx =
      window.OfflineAudioContext ||
      (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
    if (!Ctx) return null;
    // 8 kHz mono: de ~6 ori mai putina memorie decat la 48 kHz, suficient pentru pauze.
    const ctx = new Ctx(1, 8000, 8000);
    return await new Promise<AudioBuffer | null>((resolve) => {
      const p = ctx.decodeAudioData(data, resolve, () => resolve(null));
      if (p && typeof p.catch === 'function') p.catch(() => resolve(null));
    });
  } catch {
    return null;
  }
}

function findPauses(ch: Float32Array, rate: number): { start: number; end: number; pauses: Pause[] } | null {
  const win = Math.round(rate * 0.02);
  const n = Math.floor(ch.length / win);
  if (n < 50) return null;

  const rms = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let k = i * win; k < (i + 1) * win; k++) s += ch[k] * ch[k];
    rms[i] = Math.sqrt(s / win);
  }
  const sorted = Array.from(rms).sort((a, b) => a - b);
  const p90 = sorted[Math.floor(n * 0.9)];
  const thr = Math.max(p90 * 0.1, 0.004);

  let first = 0;
  while (first < n && rms[first] <= thr) first++;
  let last = n - 1;
  while (last > first && rms[last] <= thr) last--;
  if (last - first < 50) return null;

  const pauses: Pause[] = [];
  let runStart = -1;
  for (let i = first; i <= last; i++) {
    if (rms[i] <= thr) {
      if (runStart < 0) runStart = i;
    } else if (runStart >= 0) {
      if (i - runStart >= 8) pauses.push({ start: runStart * 0.02, end: i * 0.02 });
      runStart = -1;
    }
  }
  return { start: first * 0.02, end: (last + 1) * 0.02, pauses };
}

/** Timpul (in secunde audio) la care se rosteste mijlocul fiecarui cuvant, sau null daca nu putem fi siguri. */
export async function alignWordsToAudio(src: string, words: WeightedWord[]): Promise<number[] | null> {
  if (typeof window === 'undefined' || words.length < 8) return null;
  const buf = await decode(src);
  if (!buf) return null;
  return alignFromChannel(buf.getChannelData(0), buf.sampleRate, words);
}

/** Partea de calcul, separata ca sa poata fi testata fara browser. */
export function alignFromChannel(channel: Float32Array, sampleRate: number, words: WeightedWord[]): number[] | null {
  if (words.length < 8) return null;
  const found = findPauses(channel, sampleRate);
  if (!found || found.pauses.length < 2) return null;
  const { start: S, end: E, pauses } = found;

  // Greutatea fiecarui cuvant, fara partea de pauza de dupa el.
  const pauseWeight = (w: string) => (STRONG.test(w) ? 7 : /[:;]["»”')\]]*$/.test(w) ? 5 : WEAK.test(w) ? 3 : 0);
  const total = words.reduce((s, w) => s + w.weight, 0) || 1;
  const span = E - S;

  // Limitele din text (dupa cuvinte cu punctuatie), cu momentul estimat.
  interface Bound {
    word: number;
    at: number;
    strong: boolean;
  }
  const bounds: Bound[] = [];
  let cum = 0;
  words.forEach((w, i) => {
    cum += w.weight;
    if (i < words.length - 1 && (STRONG.test(w.text) || WEAK.test(w.text))) {
      bounds.push({ word: i, at: S + ((cum - pauseWeight(w.text)) / total) * span, strong: STRONG.test(w.text) });
    }
  });
  const n = bounds.length;
  const m = pauses.length;
  if (n < 2) return null;

  // Aliniere monotona (ca la „diff"): limita din text <-> pauza din audio, cu sarituri permise.
  const SKIP_TEXT = 1.2;
  const SKIP_PAUSE = 0.35;
  const cost = (i: number, j: number) => {
    const b = bounds[i];
    const p = pauses[j];
    const dur = p.end - p.start;
    return Math.abs(b.at - p.start) + 0.5 * Math.abs((b.strong ? 0.55 : 0.3) - dur);
  };
  const dp: Float32Array[] = Array.from({ length: n + 1 }, () => new Float32Array(m + 1));
  for (let i = 1; i <= n; i++) dp[i][0] = i * SKIP_TEXT;
  for (let j = 1; j <= m; j++) dp[0][j] = j * SKIP_PAUSE;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = Math.min(dp[i - 1][j - 1] + cost(i - 1, j - 1), dp[i - 1][j] + SKIP_TEXT, dp[i][j - 1] + SKIP_PAUSE);
    }
  }
  const matches: { b: Bound; p: Pause }[] = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    const here = dp[i][j];
    if (Math.abs(here - (dp[i - 1][j - 1] + cost(i - 1, j - 1))) < 1e-4) {
      matches.push({ b: bounds[i - 1], p: pauses[j - 1] });
      i--;
      j--;
    } else if (Math.abs(here - (dp[i - 1][j] + SKIP_TEXT)) < 1e-4) i--;
    else j--;
  }
  matches.reverse();

  // Prea putine potriviri sau potriviri nesigure: nu ne bazam pe analiza.
  const strongTotal = bounds.filter((b) => b.strong).length || 1;
  const strongMatched = matches.filter((x) => x.b.strong).length;
  if (matches.length < 3 || strongMatched < strongTotal * 0.5) return null;
  // Potrivirile care contrazic estimarea cu mult (pauze inselatoare) se ignora.
  const good = matches.filter((x) => Math.abs(x.b.at - x.p.start) < Math.max(8, span * 0.08));
  if (good.length < 3) return null;

  // Segmente intre pauzele potrivite: cuvintele se impart proportional in fereastra lor reala.
  const times = new Array<number>(words.length).fill(0);
  let wordFrom = 0;
  let segStart = S;
  const segments = [
    ...good.map((x) => ({ lastWord: x.b.word, end: x.p.start, nextStart: x.p.end })),
    { lastWord: words.length - 1, end: E, nextStart: E },
  ];
  for (const seg of segments) {
    if (seg.lastWord < wordFrom) continue;
    const ws = words.slice(wordFrom, seg.lastWord + 1).map((w, k, arr) => {
      const isLast = k === arr.length - 1;
      return Math.max(1, w.weight - (isLast ? pauseWeight(w.text) : 0));
    });
    const sum = ws.reduce((a, b) => a + b, 0);
    const len = seg.end - segStart;
    if (len <= 0) return null;
    let acc = 0;
    ws.forEach((w, k) => {
      times[wordFrom + k] = segStart + ((acc + w / 2) / sum) * len;
      acc += w;
    });
    wordFrom = seg.lastWord + 1;
    segStart = seg.nextStart;
  }

  // Timpii trebuie sa creasca; altfel analiza e suspecta.
  for (let k = 1; k < times.length; k++) if (times[k] < times[k - 1] - 1e-6) return null;
  return times;
}
