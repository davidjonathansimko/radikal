// Pasul 261026 — trimite notificarile push.
//
// Cere antetul „Authorization: Bearer <CRON_SECRET>". Vercel Cron il pune singur
// cand variabila CRON_SECRET exista; orice alt planificator il poate trimite la fel.
//
// Ce face la fiecare rulare:
//  * articole / marturii / reels PUBLICATE in ultimele 3 zile si netrimise inca
//  * versetul zilei — dupa ora 07:00 (Berlin), o singura data pe zi
// `push_sent` tine minte ce s-a trimis, deci rularea repetata nu dubleaza nimic.

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAdminClient } from '@/lib/serverSupabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Kind = 'blogs' | 'marturii' | 'reels' | 'verse';
type Lang = 'de' | 'en' | 'ro' | 'ru';
const LANGS: Lang[] = ['de', 'en', 'ro', 'ru'];

const HEAD: Record<Kind, Record<Lang, string>> = {
  blogs: { de: 'Neuer Blog', en: 'New blog', ro: 'Blog nou', ru: '\u041d\u043e\u0432\u0430\u044f \u0441\u0442\u0430\u0442\u044c\u044f' },
  marturii: { de: 'Neues Zeugnis', en: 'New testimony', ro: 'M\u0103rturie nou\u0103', ru: '\u041d\u043e\u0432\u043e\u0435 \u0441\u0432\u0438\u0434\u0435\u0442\u0435\u043b\u044c\u0441\u0442\u0432\u043e' },
  reels: { de: 'Neues Reel', en: 'New reel', ro: 'Reel nou', ru: '\u041d\u043e\u0432\u044b\u0439 \u0440\u0438\u043b\u0441' },
  verse: { de: 'Vers des Tages', en: 'Verse of the day', ro: 'Versetul zilei', ru: '\u0421\u0442\u0438\u0445 \u0434\u043d\u044f' },
};

interface Item {
  kind: Kind;
  id: string;
  url: string;
  /** Textul pe limbi; lipsa unei limbi => se foloseste `fallback` */
  body: Partial<Record<Lang, string>>;
  fallback: string;
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

function berlinNow(): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) };
}

function clip(s: string, n = 110): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}\u2026` : t;
}

async function alreadySent(admin: SupabaseClient, kind: Kind, ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const { data, error } = await admin.from('push_sent').select('item_id').eq('kind', kind).in('item_id', ids);
  if (error) throw new Error('push_sent');
  return new Set((data || []).map((r: { item_id: string }) => r.item_id));
}

async function collect(admin: SupabaseClient): Promise<Item[]> {
  const items: Item[] = [];
  const since = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();

  const { data: blogs } = await admin
    .from('blog_posts').select('id, title, slug').eq('published', true)
    .gte('created_at', since).order('created_at', { ascending: false }).limit(3);
  const bDone = await alreadySent(admin, 'blogs', (blogs || []).map((b) => String(b.id)));
  for (const b of blogs || []) {
    if (!bDone.has(String(b.id)) && b.slug) {
      items.push({ kind: 'blogs', id: String(b.id), url: `/blogs/${b.slug}`, body: {}, fallback: clip(String(b.title || '')) });
    }
  }

  const { data: tests } = await admin
    .from('testimonies').select('id, title, slug').eq('published', true)
    .gte('created_at', since).order('created_at', { ascending: false }).limit(3);
  const tDone = await alreadySent(admin, 'marturii', (tests || []).map((b) => String(b.id)));
  for (const b of tests || []) {
    if (!tDone.has(String(b.id)) && b.slug) {
      items.push({ kind: 'marturii', id: String(b.id), url: `/marturii/${b.slug}`, body: {}, fallback: clip(String(b.title || '')) });
    }
  }

  const { data: reels } = await admin
    .from('reels').select('id, content').eq('published', true)
    .gte('created_at', since).order('created_at', { ascending: false }).limit(3);
  const rDone = await alreadySent(admin, 'reels', (reels || []).map((b) => String(b.id)));
  for (const r of reels || []) {
    if (!rDone.has(String(r.id))) {
      items.push({ kind: 'reels', id: String(r.id), url: '/blogs?reels=1', body: {}, fallback: clip(String(r.content || '')) });
    }
  }

  const { date, hour } = berlinNow();
  if (hour >= 7) {
    const vDone = await alreadySent(admin, 'verse', [date]);
    if (!vDone.has(date)) {
      const { data: v } = await admin
        .from('daily_verses').select('*').eq('for_day', date).eq('published', true).maybeSingle();
      if (v) {
        const body: Partial<Record<Lang, string>> = {};
        for (const l of LANGS) {
          const c = v[`content_${l}`] as string | null;
          const r = v[`reference_${l}`] as string | null;
          if (c) body[l] = clip(`${c}${r ? ` \u2014 ${r}` : ''}`, 140);
        }
        items.push({
          kind: 'verse', id: date, url: '/verset', body,
          fallback: clip(`${v.content_ro}${v.reference_ro ? ` \u2014 ${v.reference_ro}` : ''}`, 140),
        });
      }
    }
  }
  return items;
}

async function sendItem(admin: SupabaseClient, item: Item): Promise<{ sent: number; removed: number }> {
  const { data: subs } = await admin
    .from('push_subscriptions').select('id, endpoint, p256dh, auth, lang')
    .contains('prefs', { [item.kind]: true });

  let sent = 0;
  const dead: string[] = [];
  const list = subs || [];
  for (let i = 0; i < list.length; i += 25) {
    await Promise.all(list.slice(i, i + 25).map(async (s) => {
      const lang = (LANGS as string[]).includes(s.lang) ? (s.lang as Lang) : 'de';
      const payload = JSON.stringify({
        title: HEAD[item.kind][lang],
        body: item.body[lang] || item.fallback,
        url: item.url,
        tag: `radikal-${item.kind}`,
      });
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 12 });
        sent += 1;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.id);
      }
    }));
  }
  if (dead.length) await admin.from('push_subscriptions').delete().in('id', dead);
  await admin.from('push_sent').upsert({ kind: item.kind, item_id: item.id }, { onConflict: 'kind,item_id' });
  return { sent, removed: dead.length };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = getAdminClient();
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!admin || !pub || !priv) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:radikal@radikal.blog', pub, priv);

  const items = await collect(admin).catch(() => null);
  if (!items) return NextResponse.json({ error: 'run STEP_261026A_PUSH.sql' }, { status: 503 });
  const report: Record<string, { sent: number; removed: number }> = {};
  for (const item of items) {
    report[`${item.kind}:${item.id}`] = await sendItem(admin, item);
  }
  return NextResponse.json({ ok: true, items: items.length, report });
}
