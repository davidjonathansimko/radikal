// Audio pregenerat cu momentele EXACTE ale cuvintelor.
//
// Textul se taie in propozitii scurte (la virgula, punct etc.), fiecare se transforma separat in voce
// (PCM), iar fisierul final se asambleaza aici. Asa stim la milisecunda cand incepe si cand se termina
// fiecare propozitie scurta; in interiorul ei cuvintele se aseaza dupa greutate si se „lipesc" de
// micile pauze reale din semnal. Rezultatul se salveaza langa mp3, ca fisier .json.

import { Mp3Encoder } from '@breezystack/lamejs';

export const SAMPLE_RATE = 24000;
// Fisierul MP3 fara antet LAME porneste cu ~1105 de esantioane de „liniste” la redare.
const ENCODER_DELAY_S = 1105 / SAMPLE_RATE;
const FRAME = SAMPLE_RATE / 100; // 10 ms

export interface Unit {
  text: string;
  /** Indicele global al primului cuvant */
  first: number;
  words: string[];
  /** Pauza (ms) care urmeaza dupa unitate */
  pauseMs: number;
}

export interface AudioTimings {
  v: 1;
  duration: number;
  words: string[];
  /** Secunda la care incepe fiecare cuvant */
  times: number[];
}

// ---------------------------------------------------------------------
// 1) Taierea textului
// ---------------------------------------------------------------------
const END = /[.!?\u2026]["\u00BB\u201D')\]]*$/;
const SEMI = /[:;]["\u00BB\u201D')\]]*$/;
const COMMA = /[,\u2014\u2013]["\u00BB\u201D')\]]*$/;

function pauseFor(lastWord: string, paragraphEnd: boolean): number {
  if (paragraphEnd) return 720;
  if (/\u2026["\u00BB\u201D')\]]*$/.test(lastWord)) return 460;
  if (/[!?]["\u00BB\u201D')\]]*$/.test(lastWord)) return 420;
  if (END.test(lastWord)) return 380;
  if (SEMI.test(lastWord)) return 230;
  if (COMMA.test(lastWord)) return 150;
  return 120;
}

const MIN_WORDS = 3;
const MAX_WORDS = 22;

export function splitUnits(text: string): { units: Unit[]; words: string[] } {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const units: Unit[] = [];
  const all: string[] = [];

  for (const para of paragraphs) {
    const tokens = para.split(' ');
    let cur: string[] = [];
    const flush = (paragraphEnd: boolean) => {
      if (!cur.length) return;
      units.push({
        text: cur.join(' '),
        first: all.length - cur.length,
        words: cur,
        pauseMs: pauseFor(cur[cur.length - 1], paragraphEnd),
      });
      cur = [];
    };
    tokens.forEach((tok, i) => {
      all.push(tok);
      cur.push(tok);
      const isLast = i === tokens.length - 1;
      const boundary = END.test(tok) || ((SEMI.test(tok) || COMMA.test(tok)) && cur.length >= MIN_WORDS);
      if (isLast) flush(true);
      else if (boundary || cur.length >= MAX_WORDS) flush(false);
    });
  }
  return { units, words: all };
}

// ---------------------------------------------------------------------
// 2) PCM: citire WAV, taierea linistii
// ---------------------------------------------------------------------
export function pcmFromWav(buf: Buffer): Int16Array {
  let offset = 0;
  if (buf.length > 44 && buf.toString('ascii', 0, 4) === 'RIFF') {
    let p = 12;
    offset = 44;
    while (p + 8 <= buf.length) {
      const id = buf.toString('ascii', p, p + 4);
      const size = buf.readUInt32LE(p + 4);
      if (id === 'data') {
        offset = p + 8;
        break;
      }
      p += 8 + size;
    }
  }
  const bytes = buf.length - offset;
  const out = new Int16Array(Math.floor(bytes / 2));
  for (let i = 0; i < out.length; i++) out[i] = buf.readInt16LE(offset + i * 2);
  return out;
}

function frameRms(pcm: Int16Array): number[] {
  const n = Math.ceil(pcm.length / FRAME);
  const env: number[] = new Array(n);
  for (let f = 0; f < n; f++) {
    let s = 0;
    const a = f * FRAME;
    const b = Math.min(pcm.length, a + FRAME);
    for (let i = a; i < b; i++) s += pcm[i] * pcm[i];
    env[f] = Math.sqrt(s / Math.max(1, b - a));
  }
  return env;
}

export interface Clip {
  pcm: Int16Array;
  /** Energia pe cadre de 10 ms, dupa taiere */
  env: number[];
}

/** Taie linistea de la inceput si de la sfarsit (pastreaza 20 ms de jur imprejur). */
export function trimClip(pcm: Int16Array): Clip {
  const env = frameRms(pcm);
  const sorted = [...env].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 1;
  const thr = Math.max(p95 * 0.05, 60);
  let a = env.findIndex((e) => e > thr);
  let b = env.length - 1;
  while (b > 0 && env[b] <= thr) b--;
  if (a < 0) return { pcm, env };
  a = Math.max(0, a - 2);
  b = Math.min(env.length - 1, b + 2);
  const trimmed = pcm.slice(a * FRAME, Math.min(pcm.length, (b + 1) * FRAME));
  const out = new Int16Array(trimmed);
  // intrare/iesire usoara, ca sa nu pocneasca la lipire
  const fade = Math.min(Math.floor(SAMPLE_RATE * 0.008), Math.floor(out.length / 4));
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    out[i] = Math.round(out[i] * g);
    out[out.length - 1 - i] = Math.round(out[out.length - 1 - i] * g);
  }
  return { pcm: out, env: env.slice(a, b + 1) };
}

// ---------------------------------------------------------------------
// 3) Momentele cuvintelor in interiorul unei unitati
// ---------------------------------------------------------------------
function weightOf(word: string): number {
  const bare = word.replace(/[^A-Za-z0-9\u0103\u00E2\u00EE\u0219\u021B\u0102\u00C2\u00CE\u0218\u021A\u00E4\u00F6\u00FC\u00DF\u00C4\u00D6\u00DC\u00E9\u00E8\u00EA\u00E0\u00E7\u0410-\u042F\u0430-\u044F\u0401\u0451]/g, '');
  const syl = (bare.match(/[aeiouy\u0103\u00E2\u00EE\u00E4\u00F6\u00FC\u00E9\u00E8\u00EA\u00E0\u0430\u0435\u0451\u0438\u043E\u0443\u044B\u044D\u044E\u044F]+/gi) || []).length || 1;
  return 1 + syl * 2.2 + Math.max(0, bare.length - syl * 3) * 0.25;
}

/** Secundele (in interiorul clipului, 0 = inceputul vorbirii) la care incepe fiecare cuvant. */
export function placeWords(words: string[], clip: Clip): number[] {
  const env = clip.env;
  const total = Math.max(env.length, 1);
  const weights = words.map(weightOf);
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const framePos: number[] = [];
  let acc = 0;
  for (let i = 0; i < words.length; i++) {
    framePos.push((acc / sum) * total);
    acc += weights[i];
  }
  // Doar o pauza adevarata (cel putin 20 ms de aproape-liniste) muta granita: cuvantul urmator incepe cand vorbirea reincepe.
  const sorted = [...env].sort((a, b) => a - b);
  const quiet = (sorted[Math.floor(sorted.length * 0.95)] || 1) * 0.12;
  for (let i = 1; i < words.length; i++) {
    const wordLen = (weights[i - 1] / sum) * total;
    const radius = Math.max(2, Math.min(12, Math.floor(wordLen * 0.4)));
    const c = Math.round(framePos[i]);
    const from = Math.max(1, c - radius);
    const to = Math.min(env.length - 2, c + radius);
    let bestEnd = -1;
    let bestDist = Infinity;
    let f = from;
    while (f <= to) {
      if (env[f] >= quiet) {
        f++;
        continue;
      }
      let g = f;
      while (g <= to + 1 && g < env.length && env[g] < quiet) g++;
      if (g - f >= 2) {
        const dist = Math.abs((f + g) / 2 - c);
        if (dist < bestDist) {
          bestDist = dist;
          bestEnd = g;
        }
      }
      f = g;
    }
    if (bestEnd >= 0 && bestEnd < env.length) framePos[i] = bestEnd;
    if (framePos[i] < framePos[i - 1] + 3) framePos[i] = framePos[i - 1] + 3;
  }
  framePos[0] = 0;
  return framePos.map((f) => f / 100);
}

// ---------------------------------------------------------------------
// 4) Asamblare + MP3
// ---------------------------------------------------------------------
export function assemble(units: Unit[], clips: Clip[]): { pcm: Int16Array; timings: AudioTimings['times']; words: string[] } {
  const times: number[] = [];
  const words: string[] = [];
  const pieces: Int16Array[] = [];
  let cursor = 0; // in esantioane
  units.forEach((u, i) => {
    const clip = clips[i];
    const offsets = placeWords(u.words, clip);
    offsets.forEach((o, k) => {
      times.push(cursor / SAMPLE_RATE + o + ENCODER_DELAY_S);
      words.push(u.words[k]);
    });
    pieces.push(clip.pcm);
    cursor += clip.pcm.length;
    if (i < units.length - 1) {
      const gap = Math.round((u.pauseMs / 1000) * SAMPLE_RATE);
      pieces.push(new Int16Array(gap));
      cursor += gap;
    }
  });
  const pcm = new Int16Array(cursor);
  let p = 0;
  for (const piece of pieces) {
    pcm.set(piece, p);
    p += piece.length;
  }
  return { pcm, timings: times, words };
}

export function encodeMp3(pcm: Int16Array, kbps = 96): Buffer {
  const enc = new Mp3Encoder(1, SAMPLE_RATE, kbps);
  const block = 1152 * 10;
  const out: Uint8Array[] = [];
  const bytes = (c: ArrayBufferView) => new Uint8Array(c.buffer, c.byteOffset, c.byteLength);
  for (let i = 0; i < pcm.length; i += block) {
    const chunk = enc.encodeBuffer(pcm.subarray(i, i + block));
    if (chunk.length) out.push(bytes(chunk));
  }
  const tail = enc.flush();
  if (tail.length) out.push(bytes(tail));
  return Buffer.concat(out);
}
