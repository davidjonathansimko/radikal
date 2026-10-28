// Pasul 261026 — trimite notificarile push.
//
// GET  (Authorization: Bearer <CRON_SECRET>, pus singur de Vercel Cron) -> trimite ce e gata
// POST (admin sau CRON_SECRET), body { action }:
//   'preview'   -> ce e nou si in ce limbi exista textul
//   'translate' -> traduce prin DeepL ce lipseste (ramane in cache), apoi arata din nou lista
//   'send'      -> trimite ce are textul in toate cele 4 limbi (implicit)
//
// Un articol / reel / marturie nou NU pleaca pana nu exista textul in toate limbile (ca sa nu primeasca nimeni
// romana in loc de limba lui). Versetul zilei se traduce singur la 07:00. `push_sent` tine minte ce a plecat.

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getAdminClient, getUserFromRequest } from '@/lib/serverSupabase';
import { collectItems, resolveItem, translateMissing, sendItem, setupWebPush, PLANGS, type ResolvedItem } from '@/lib/pushContent';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

const view = (it: ResolvedItem) => ({ key: it.key, kind: it.kind, label: it.label, texts: it.texts, missing: it.missing });

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return run('send');
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    const admin = getAdminClient();
    const user = admin ? await getUserFromRequest(admin, req) : null;
    if (!user?.isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  let action: string = 'send';
  try {
    const body = await req.json();
    if (typeof body?.action === 'string') action = body.action;
  } catch {
    /* fara corp: trimite */
  }
  return run(action === 'preview' || action === 'translate' ? action : 'send');
}

async function run(action: 'send' | 'preview' | 'translate') {
  const admin = getAdminClient();
  if (!admin || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }
  setupWebPush();

  const items = await collectItems(admin).catch(() => null);
  if (!items) return NextResponse.json({ error: 'run STEP_261026A_PUSH.sql' }, { status: 503 });

  let resolved: ResolvedItem[] = [];
  for (const it of items) resolved.push(await resolveItem(admin, it));

  // Traducerea (la cererea adminului, sau automat pentru verset)
  if (action === 'translate' || action === 'send') {
    const next: ResolvedItem[] = [];
    for (const it of resolved) {
      if (it.missing.length && (action === 'translate' || it.autoTranslate)) {
        await translateMissing(admin, it);
        next.push(await resolveItem(admin, it));
      } else next.push(it);
    }
    resolved = next;
  }

  const ready = resolved.filter((r) => r.missing.length === 0);
  const pending = resolved.filter((r) => r.missing.length > 0);

  const report: Record<string, { sent: number; removed: number; errors: string[] }> = {};
  if (action === 'send') {
    for (const it of ready) report[it.key] = await sendItem(admin, it);
  }

  return NextResponse.json({
    ok: true,
    action,
    langs: PLANGS,
    items: resolved.length,
    sent: action === 'send' ? ready.map((r) => r.key) : [],
    ready: action === 'send' ? [] : ready.map(view),
    pending: pending.map(view),
    report,
  });
}
