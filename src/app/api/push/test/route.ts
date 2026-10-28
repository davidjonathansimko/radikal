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
  return NextResponse.json({ total: total.count ?? 0, mine: mine.count ?? 0 });
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
    .from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', user.id);
  if (!subs?.length) return NextResponse.json({ sent: 0, failed: 0, note: 'no_device' });

  let sent = 0;
  const errors: string[] = [];
  const dead: string[] = [];
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title: 'RADIKAL.', body: 'Test: notificările funcționează.', url: '/', tag: 'radikal-test' }),
        { TTL: 600 },
      );
      sent += 1;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) dead.push(s.id);
      errors.push(`${code ?? '?'} ${(e as Error).message?.slice(0, 120) ?? ''}`.trim());
    }
  }));
  if (dead.length) await admin.from('push_subscriptions').delete().in('id', dead);
  return NextResponse.json({ sent, failed: subs.length - sent, dead: dead.length, errors: errors.slice(0, 3) });
}
