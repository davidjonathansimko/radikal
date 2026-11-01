// Pasul 261026 — test pentru notificari (doar admin).
// GET  -> cate dispozitive sunt abonate (total) si cate sunt ale contului tau
// POST -> trimite o notificare de test pe dispozitivele contului tau si raporteaza rezultatul

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { getAdminClient, getUserFromRequest } from '@/lib/serverSupabase';

export const dynamic = 'force-dynamic';

async function adminOnly(req: NextRequest) {
  const admin = getAdminClient();
  if (!admin) return { error: NextResponse.json({ error: 'not_configured' }, { status: 503 }) };
  const user = await getUserFromRequest(admin, req);
  if (!user?.isAdmin) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  return { admin, user };
}

export async function GET(req: NextRequest) {
  const ctx = await adminOnly(req);
  if ('error' in ctx) return ctx.error;
  const { admin, user } = ctx;
  const total = await admin.from('push_subscriptions').select('id', { count: 'exact', head: true });
  const mine = await admin.from('push_subscriptions').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  const recent = await admin.from('push_subscriptions').select('endpoint, lang, user_id, updated_at').order('updated_at', { ascending: false }).limit(6);
  return NextResponse.json({
    total: total.count ?? 0,
    mine: mine.count ?? 0,
    recent: (recent.data ?? []).map((r) => ({
      host: (() => { try { return new URL(r.endpoint as string).host; } catch { return '?'; } })(),
      lang: r.lang,
      account: r.user_id === user.id ? 'tu' : r.user_id ? 'alt cont' : 'vizitator',
      at: r.updated_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  const ctx = await adminOnly(req);
  if ('error' in ctx) return ctx.error;
  const { admin, user } = ctx;

  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:radikal@radikal.blog', pub, priv);

  const { data: subs } = await admin
    .from('push_subscriptions').select('id, endpoint, p256dh, auth, lang, updated_at').eq('user_id', user.id);
  if (!subs?.length) return NextResponse.json({ sent: 0, failed: 0, note: 'no_device' });

  let sent = 0;
  const errors: string[] = [];
  const dead: string[] = [];
  const devices: { host: string; lang: string; since: string; status: string }[] = [];
  await Promise.all(subs.map(async (s) => {
    const info = { host: (() => { try { return new URL(s.endpoint).host; } catch { return '?'; } })(), lang: s.lang as string, since: s.updated_at as string, status: 'ok' };
    try {
      const r = await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title: 'RADIKAL.', body: 'Test: notific\u0103rile func\u021bioneaz\u0103.', url: '/', tag: 'radikal-test' }),
        { TTL: 600 },
      );
      info.status = String(r.statusCode);
      sent += 1;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      info.status = String(code ?? 'error');
      if (code === 404 || code === 410) dead.push(s.id);
      errors.push(`${code ?? '?'} ${(e as Error).message?.slice(0, 120) ?? ''}`.trim());
    }
    devices.push(info);
  }));
  if (dead.length) await admin.from('push_subscriptions').delete().in('id', dead);
  return NextResponse.json({ sent, failed: subs.length - sent, dead: dead.length, errors: errors.slice(0, 3), devices });
}
