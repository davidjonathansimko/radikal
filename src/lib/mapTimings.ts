// Momentele cuvintelor, calculate la generarea audio-ului (`<slug>/<limba>.json`), mutate pe cuvintele afisate.

interface ServerTimings {
  words: string[];
  times: number[];
}

const norm = (w: string) => w.toLowerCase().replace(/[.,;:!?\u2026"'\u00AB\u00BB\u201E\u201C\u201D\u2018\u2019()[\]\-\u2013\u2014]/g, '');

/** Aliniaza cuvintele din fisier cu cele afisate (pot diferi usor la spatii sau ghilimele). */
export function mapTimes(serverWords: string[], serverTimes: number[], clientWords: string[]): number[] | null {
  const n = serverWords.length;
  const m = clientWords.length;
  if (!n || !m || serverTimes.length !== n) return null;

  const a = serverWords.map(norm);
  const b = clientWords.map(norm);

  if (n === m && a.every((w, i) => w === b[i])) return serverTimes.slice();
  if (n * m > 16_000_000) return null;

  // Cel mai lung sir comun de cuvinte
  const w = m + 1;
  const dp = new Uint16Array((n + 1) * w);
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i * w + j] = a[i - 1] === b[j - 1] ? dp[(i - 1) * w + j - 1] + 1 : Math.max(dp[(i - 1) * w + j], dp[i * w + j - 1]);
    }
  }
  const out: (number | null)[] = new Array(m).fill(null);
  let i = n;
  let j = m;
  let matched = 0;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      out[j - 1] = serverTimes[i - 1];
      matched++;
      i--;
      j--;
    } else if (dp[(i - 1) * w + j] >= dp[i * w + j - 1]) i--;
    else j--;
  }
  if (matched < m * 0.7) return null;

  // Cuvintele fara pereche iau un moment intre vecinii lor
  const res: number[] = new Array(m);
  let prev = -1;
  for (let k = 0; k < m; k++) {
    if (out[k] === null) continue;
    const t = out[k] as number;
    if (prev === -1) {
      for (let q = 0; q < k; q++) res[q] = t;
    } else {
      const t0 = res[prev];
      for (let q = prev + 1; q < k; q++) res[q] = t0 + ((t - t0) * (q - prev)) / (k - prev);
    }
    res[k] = t;
    prev = k;
  }
  for (let q = prev + 1; q < m; q++) res[q] = res[prev];
  for (let k = 1; k < m; k++) if (res[k] < res[k - 1]) res[k] = res[k - 1];
  return res;
}

export async function fetchServerTimes(url: string, clientWords: string[]): Promise<number[] | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<ServerTimings>;
    if (!Array.isArray(data.words) || !Array.isArray(data.times)) return null;
    return mapTimes(data.words, data.times, clientWords);
  } catch {
    return null;
  }
}
