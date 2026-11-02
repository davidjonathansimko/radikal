'use client';

// Vocea unui blog, construita direct de playerul mic (fara sa fie deschisa pagina articolului):
// textul (tradus la nevoie) -> bucati -> /api/tts -> un singur fisier audio.

import { getSupabaseClient } from '@/lib/supabase';

/** Acelasi curatat ca la ascultarea simpla din articol. */
export function cleanSpeech(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(p|div|h[1-6]|li|ul|ol|blockquote|section|article|header|footer|tr|td|th)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_`~]/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-zA-Z]+;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim();
}

const CHUNK = 900;

/** Aceleasi granite de bucati ca la ascultarea simpla, ca bucatile deja generate sa fie refolosite din cache. */
export function splitSpeech(full: string): string[] {
  if (full.length <= CHUNK) return [full];
  const chunks: string[] = [];
  let remaining = full;
  while (remaining.length > 0) {
    if (remaining.length <= CHUNK) {
      chunks.push(remaining);
      break;
    }
    let splitAt = CHUNK;
    const from = Math.floor(CHUNK * 0.6);
    const win = remaining.substring(from, CHUNK);
    const ends = win.match(/[.!?]\s/g);
    if (ends) {
      const last = win.lastIndexOf(ends[ends.length - 1]);
      if (last >= 0) splitAt = from + last + 2;
    } else {
      const sp = remaining.lastIndexOf(' ', CHUNK);
      if (sp > CHUNK * 0.3) splitAt = sp + 1;
    }
    chunks.push(remaining.substring(0, splitAt).trim());
    remaining = remaining.substring(splitAt).trim();
  }
  return chunks;
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const ENCODER_DELAY = 1105;

/** Lipeste bucatile MP3 intr-un singur WAV (durata exacta, derulare precisa). */
async function mp3PartsToWav(parts: Uint8Array[]): Promise<Blob | null> {
  const Ctx: typeof AudioContext | undefined = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  try {
    const decoded: Float32Array[] = [];
    let rate = 0;
    let total = 0;
    for (const bytes of parts) {
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const buf = await ctx.decodeAudioData(copy.buffer);
      if (!rate) rate = buf.sampleRate;
      const mono = new Float32Array(buf.length);
      for (let c = 0; c < buf.numberOfChannels; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < buf.length; i++) mono[i] += d[i];
      }
      if (buf.numberOfChannels > 1) for (let i = 0; i < buf.length; i++) mono[i] /= buf.numberOfChannels;
      const slice = mono.subarray(Math.min(ENCODER_DELAY, buf.length));
      const fade = Math.min(Math.round(buf.sampleRate * 0.006), Math.floor(slice.length / 4));
      for (let i = 0; i < fade; i++) {
        const g = i / fade;
        slice[i] *= g;
        slice[slice.length - 1 - i] *= g;
      }
      decoded.push(slice);
      total += slice.length;
    }
    if (!rate || !total) return null;
    const out = new ArrayBuffer(44 + total * 2);
    const v = new DataView(out);
    const w = (o: number, s: string) => {
      for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
    };
    w(0, 'RIFF');
    v.setUint32(4, 36 + total * 2, true);
    w(8, 'WAVE');
    w(12, 'fmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, rate, true);
    v.setUint32(28, rate * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    w(36, 'data');
    v.setUint32(40, total * 2, true);
    const soft = (x: number) => {
      const a = Math.abs(x);
      return a <= 0.95 ? x : Math.sign(x) * (0.95 + 0.05 * Math.tanh((a - 0.95) / 0.05));
    };
    let off = 44;
    for (const chunk of decoded) {
      for (let i = 0; i < chunk.length; i++) {
        const s = soft(chunk[i]);
        v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        off += 2;
      }
    }
    return new Blob([out], { type: 'audio/wav' });
  } catch {
    return null;
  } finally {
    ctx.close().catch(() => {});
  }
}

/** Textul de citit al unui blog (din `blog_posts`), tradus in limba ceruta. `null` daca nu se poate. */
export async function loadSpeechText(rawSlug: string, lang: string): Promise<string | null> {
  const { data } = await getSupabaseClient().from('blog_posts').select('content').eq('slug', rawSlug).maybeSingle();
  const content = (data as { content?: string } | null)?.content;
  if (!content) return null;
  let text = cleanSpeech(content);
  if (lang !== 'ro') {
    const r = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang: lang, sourceLang: 'ro' }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || typeof d?.translatedText !== 'string' || !d.translatedText.trim()) return null;
    text = d.translatedText.trim();
  }
  return text || null;
}

/** Construieste vocea (Blob URL). `isCancelled` opreste lucrul daca intre timp s-a cerut altceva. */
export async function buildSpeechUrl(
  text: string,
  lang: string,
  meta: { slug: string; title: string },
  onProgress: (pct: number) => void,
  isCancelled: () => boolean,
): Promise<string | null> {
  const chunks = splitSpeech(text);
  const parts: string[] = new Array(chunks.length);
  let cursor = 0;
  let done = 0;
  const worker = async () => {
    for (;;) {
      const i = cursor++;
      if (i >= chunks.length || isCancelled()) return;
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunks[i], language: lang, speakingRate: 1, blogSlug: meta.slug, blogTitle: meta.title }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.audioContent) throw new Error('tts');
      parts[i] = data.audioContent as string;
      done += 1;
      onProgress(Math.round((done / chunks.length) * 100));
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, chunks.length) }, worker));
  if (isCancelled() || parts.some((p) => !p)) return null;
  const mp3s = parts.map(b64ToBytes);
  const wav = await mp3PartsToWav(mp3s);
  if (isCancelled()) return null;
  return URL.createObjectURL(wav ?? new Blob(mp3s as BlobPart[], { type: 'audio/mpeg' }));
}
