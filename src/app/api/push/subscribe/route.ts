// Pasul 261026 — abonare / dezabonare la notificari push.
// GET  -> cheia publica VAPID (sau 503 daca serverul nu e configurat)
// POST -> { subscription, prefs, lang }  (optional: Authorization: Bearer <token>)
// DELETE -> { endpoint }

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, getUserFromRequest } from '@/lib/serverSupabase';

export const dynamic = 'force-dynamic';

const LANGS = ['de', 'en', 'ro', 'ru'];
const KINDS = ['blogs', 'marturii', 'verse', 'reels'] as const;

export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY;
  const missing = [
    !key && 'VAPID_PUBLIC_KEY',
    !process.env.VAPID_PRIVATE_KEY && 'VAPID_PRIVATE_KEY',
    !process.env.SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter(Boolean);
  if (missing.length || !key || !getAdminClient()) {
    return NextResponse.json({ error: 'not_configured', missing }, { status: 503 });
  }
  return NextResponse.json({ publicKey: key });
}

export async function POST(req: NextRequest) {
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  let body: { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }; prefs?: Record<string, unknown>; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  const sub = body.subscription;
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (
    typeof endpoint !== 'string' || !endpoint.startsWith('https://') || endpoint.length > 1000 ||
    typeof p256dh !== 'string' || p256dh.length > 200 ||
    typeof auth !== 'string' || auth.length > 100
  ) {
    return NextResponse.json({ error: 'bad_subscription' }, { status: 400 });
  }

  const prefs: Record<string, boolean> = {};
  for (const k of KINDS) prefs[k] = body.prefs?.[k] === undefined ? true : Boolean(body.prefs[k]);
  const lang = LANGS.includes(body.lang || '') ? (body.lang as string) : 'de';
  const user = await getUserFromRequest(admin, req);

  const { error } = await admin.from('push_subscriptions').upsert(
    {
      endpoint,
      p256dh,
      auth,
      user_id: user?.id ?? null,
      lang,
      prefs,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  );
  if (error) return NextResponse.json({ error: 'db' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  let endpoint: unknown;
  try {
    endpoint = (await req.json())?.endpoint;
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }
  if (typeof endpoint !== 'string') return NextResponse.json({ error: 'bad_endpoint' }, { status: 400 });
  await admin.from('push_subscriptions').delete().eq('endpoint', endpoint);
  return NextResponse.json({ ok: true });
}
