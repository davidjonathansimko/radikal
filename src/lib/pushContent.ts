// Pasul 261026 — continutul notificarilor push: ce e nou, in ce limbi exista textul, traducerea lipsa si trimiterea.
// Textul din fiecare limba vine din (1) coloanele scrise de admin, (2) `translation_cache` (aceeasi cheie ca /api/translate) sau (3) DeepL, cand adminul cere.

import crypto from 'crypto';
import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';

export type PLang = 'de' | 'en' | 'ro' | 'ru';
export const PLANGS: PLang[] = ['de', 'en', 'ro', 'ru'];
export type Kind = 'blogs' | 'marturii' | 'reels' | 'verse' | 'andacht' | 'copii';

/** Optiunea din fereastra de notificari care controleaza acest tip (Andacht si Pentru copii tin de „Neue Blogs"). */
export const prefKind = (k: Kind): 'blogs' | 'marturii' | 'reels' | 'verse' => (k === 'andacht' || k === 'copii' ? 'blogs' : k);

export const HEAD: Record<Kind, Record<PLang, string>> = {
  andacht: { de: 'Neue Andacht', en: 'New devotion', ro: 'Meditație nouă', ru: '\u041d\u043e\u0432\u043e\u0435 \u0440\u0430\u0437\u043c\u044b\u0448\u043b\u0435\u043d\u0438\u0435' },
  copii: { de: 'Neu für Kinder', en: 'New for children', ro: 'Nou pentru copii', ru: '\u041d\u043e\u0432\u043e\u0435 \u0434\u043b\u044f \u0434\u0435\u0442\u0435\u0439' },
  blogs: { de: 'Neuer Blog', en: 'New blog', ro: 'Blog nou', ru: '\u041d\u043e\u0432\u0430\u044f \u0441\u0442\u0430\u0442\u044c\u044f' },
  marturii: { de: 'Neues Zeugnis', en: 'New testimony', ro: 'M\u0103rturie nou\u0103', ru: '\u041d\u043e\u0432\u043e\u0435 \u0441\u0432\u0438\u0434\u0435\u0442\u0435\u043b\u044c\u0441\u0442\u0432\u043e' },
  reels: { de: 'Neues Reel', en: 'New reel', ro: 'Reel nou', ru: '\u041d\u043e\u0432\u044b\u0439 \u0440\u0438\u043b\u0441' },
  verse: { de: 'Vers des Tages', en: 'Verse of the day', ro: 'Versetul zilei', ru: '\u0421\u0442\u0438\u0445 \u0434\u043d\u044f' },
};

export interface PushItem {
  kind: Kind;
  id: string;
  key: string;
  url: string;
  label: string;
  /** Textele in romana care se traduc */
  src: string[];
  /** Ce a scris adminul / ce exista deja pe randul din baza de date, pe limbi */
  manual: Partial<Record<PLang, string[]>>;
  compose: (parts: string[]) => string;
  /** Versetul se traduce singur la trimitere; restul asteapta aprobarea adminului. */
  autoTranslate?: boolean;
}

export interface ResolvedItem extends PushItem {
  texts: Record<PLang, string | null>;
  missing: PLang[];
}

const md5 = (s: string) => crypto.createHash('md5').update(s).digest('hex');

export function clip(s: string, n = 110): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}\u2026` : t;
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

// ---------------------------------------------------------------------
// Ce e nou
// ---------------------------------------------------------------------
async function alreadySent(admin: SupabaseClient, kind: Kind, ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const { data, error } = await admin.from('push_sent').select('item_id').eq('kind', kind).in('item_id', ids);
  if (error) throw new Error('push_sent');
  return new Set((data || []).map((r: { item_id: string }) => r.item_id));
}

export function berlinNow(): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) };
}

function manualFrom(row: Record<string, unknown>, field: string): Partial<Record<PLang, string[]>> {
  const out: Partial<Record<PLang, string[]>> = {};
  for (const l of PLANGS) {
    const v = str(row[`${field}_${l}`]);
    if (v && l !== 'ro') out[l] = [v];
  }
  return out;
}

export async function collectItems(admin: SupabaseClient): Promise<PushItem[]> {
  const items: PushItem[] = [];
  const since = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();

  const { data: blogs } = await admin.from('blog_posts').select('*').eq('published', true)
    .gte('created_at', since).order('created_at', { ascending: false }).limit(5);
  const bDone = await alreadySent(admin, 'blogs', (blogs || []).map((b) => String(b.id)));
  for (const b of blogs || []) {
    if (bDone.has(String(b.id)) || !b.slug) continue;
    items.push({
      kind: 'blogs', id: String(b.id), key: `blogs:${b.id}`, url: `/blogs/${b.slug}`, label: str(b.title),
      src: [str(b.title)], manual: manualFrom(b, 'title'), compose: (p) => clip(p[0]),
    });
  }

  const { data: tests } = await admin.from('testimonies').select('*').eq('published', true)
    .gte('created_at', since).order('created_at', { ascending: false }).limit(5);
  const tDone = await alreadySent(admin, 'marturii', (tests || []).map((b) => String(b.id)));
  for (const b of tests || []) {
    if (tDone.has(String(b.id)) || !b.slug) continue;
    items.push({
      kind: 'marturii', id: String(b.id), key: `marturii:${b.id}`, url: `/marturii/${b.slug}`, label: str(b.title),
      src: [str(b.title)], manual: manualFrom(b, 'title'), compose: (p) => clip(p[0]),
    });
  }

  const { data: reels } = await admin.from('reels').select('*').eq('published', true)
    .gte('created_at', since).order('created_at', { ascending: false }).limit(5);
  const rDone = await alreadySent(admin, 'reels', (reels || []).map((b) => String(b.id)));
  for (const r of reels || []) {
    if (rDone.has(String(r.id))) continue;
    items.push({
      kind: 'reels', id: String(r.id), key: `reels:${r.id}`, url: '/blogs?reels=1', label: clip(str(r.content), 60),
      src: [str(r.content)], manual: manualFrom(r, 'content'), compose: (p) => clip(p[0]),
    });
  }

  const { data: devotions } = await admin.from('content_items').select('*').in('kind', ['andacht', 'copii']).eq('published', true)
    .gte('created_at', since).order('created_at', { ascending: false }).limit(5);
  const dAndacht = await alreadySent(admin, 'andacht', (devotions || []).filter((d) => d.kind === 'andacht').map((d) => String(d.id)));
  const dCopii = await alreadySent(admin, 'copii', (devotions || []).filter((d) => d.kind === 'copii').map((d) => String(d.id)));
  for (const d of devotions || []) {
    const kind: Kind = d.kind === 'copii' ? 'copii' : 'andacht';
    if ((kind === 'andacht' ? dAndacht : dCopii).has(String(d.id)) || !d.slug) continue;
    items.push({
      kind, id: String(d.id), key: `${kind}:${d.id}`, url: `/${kind}/a/${d.slug}`, label: str(d.title),
      src: [str(d.title)], manual: manualFrom(d, 'title'), compose: (p) => clip(p[0]),
    });
  }

  const { date, hour } = berlinNow();
  if (hour >= 7) {
    const vDone = await alreadySent(admin, 'verse', [date]);
    if (!vDone.has(date)) {
      const { data: v } = await admin.from('daily_verses').select('*').eq('for_day', date).eq('published', true).maybeSingle();
      if (v) {
        const manual: Partial<Record<PLang, string[]>> = {};
        for (const l of PLANGS) {
          if (l === 'ro') continue;
          const c = str(v[`content_${l}`]);
          if (c) manual[l] = [c, str(v[`reference_${l}`]) || str(v.reference_ro)];
        }
        items.push({
          kind: 'verse', id: date, key: `verse:${date}`, url: '/verset', label: clip(str(v.content_ro), 60),
          src: [str(v.content_ro), str(v.reference_ro)], manual,
          compose: (p) => clip(`${p[0]}${p[1] ? ` \u2014 ${p[1]}` : ''}`, 140),
          autoTranslate: true,
        });
      }
    }
  }
  return items;
}

// ---------------------------------------------------------------------
// Textul pe limbi
// ---------------------------------------------------------------------
async function cacheLookup(admin: SupabaseClient, texts: string[], lang: PLang): Promise<(string | null)[]> {
  const hashes = texts.map((t) => (t ? md5(t) : ''));
  const wanted = hashes.filter(Boolean);
  if (!wanted.length) return texts.map(() => null);
  const { data } = await admin.from('translation_cache').select('original_text_hash, translated_text')
    .eq('source_lang', 'ro').eq('target_lang', lang).in('original_text_hash', wanted);
  const map = new Map((data || []).map((r: { original_text_hash: string; translated_text: string }) => [r.original_text_hash, r.translated_text]));
  return hashes.map((h) => (h ? map.get(h) ?? null : null));
}

export async function resolveItem(admin: SupabaseClient, item: PushItem): Promise<ResolvedItem> {
  const texts = {} as Record<PLang, string | null>;
  const missing: PLang[] = [];
  for (const l of PLANGS) {
    if (l === 'ro') {
      texts.ro = item.compose(item.src);
      continue;
    }
    const manual = item.manual[l];
    let parts: (string | null)[];
    if (manual && manual[0]) {
      parts = item.src.map((_, i) => manual[i] || null);
      // referinta lipsa (verset): ramane cea romaneasca
      if (item.kind === 'verse' && !parts[1]) parts[1] = item.src[1] || '';
    } else {
      parts = await cacheLookup(admin, item.src, l);
      // un text sursa gol nu cere traducere
      parts = parts.map((p, i) => (p === null && !item.src[i] ? '' : p));
    }
    if (parts.every((p) => p !== null)) texts[l] = item.compose(parts as string[]);
    else {
      texts[l] = null;
      missing.push(l);
    }
  }
  return { ...item, texts, missing };
}

/** Traduce prin DeepL ce lipseste (o singura data; ramane in `translation_cache`). */
export async function translateMissing(admin: SupabaseClient, item: ResolvedItem): Promise<void> {
  const key = process.env.DEEPL_API_KEY;
  if (!key || item.missing.length === 0) return;
  for (const l of item.missing) {
    const needed = item.src.filter((t) => t);
    if (!needed.length) continue;
    const res = await fetch('https://api.deepl.com/v2/translate', {
      method: 'POST',
      headers: { Authorization: `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: needed, target_lang: l.toUpperCase(), source_lang: 'RO' }),
    });
    if (!res.ok) continue;
    const data = (await res.json()) as { translations?: { text: string }[] };
    const out = data.translations ?? [];
    for (let i = 0; i < needed.length; i++) {
      const tr = out[i]?.text;
      if (!tr) continue;
      await admin.from('translation_cache').upsert({
        original_text_hash: md5(needed[i]),
        source_lang: 'ro',
        target_lang: l,
        original_text: needed[i].slice(0, 1000),
        translated_text: tr,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'original_text_hash,source_lang,target_lang' });
    }
  }
}

// ---------------------------------------------------------------------
// Trimiterea
// ---------------------------------------------------------------------
export function setupWebPush(): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:radikal@radikal.blog', pub, priv);
  return true;
}

export async function sendItem(admin: SupabaseClient, item: ResolvedItem): Promise<{ sent: number; removed: number; errors: string[] }> {
  const { data: subs } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth, lang')
    .contains('prefs', { [prefKind(item.kind)]: true });

  let sent = 0;
  const dead: string[] = [];
  const errors: string[] = [];
  const list = subs || [];
  for (let i = 0; i < list.length; i += 25) {
    await Promise.all(list.slice(i, i + 25).map(async (s) => {
      const lang = (PLANGS as string[]).includes(s.lang) ? (s.lang as PLang) : 'de';
      const payload = JSON.stringify({
        title: HEAD[item.kind][lang],
        body: item.texts[lang] || item.texts.de || item.texts.ro || '',
        url: item.url,
        tag: `radikal-${item.kind}`,
      });
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 12 });
        sent += 1;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.id);
        else errors.push(`${code ?? '?'} ${(e as Error).message?.slice(0, 120) ?? ''}`.trim());
      }
    }));
  }
  if (dead.length) await admin.from('push_subscriptions').delete().in('id', dead);
  if (list.length === 0 || sent > 0 || dead.length === list.length) {
    await admin.from('push_sent').upsert({ kind: item.kind, item_id: item.id }, { onConflict: 'kind,item_id' });
  }
  return { sent, removed: dead.length, errors: errors.slice(0, 3) };
}
