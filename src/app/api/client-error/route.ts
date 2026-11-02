// Erorile din aplicatie, adunate de `ErrorReporter` (monitorizare proprie).
//  POST   — public, cu limita de cereri; salveaza sau creste contorul unei erori deja vazute
//  GET    — doar admin: ultimele erori
//  DELETE — doar admin: goleste lista

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminClient, getUserFromRequest } from '@/lib/serverSupabase';

export const dynamic = 'force-dynamic';

const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  return h.n > 8;
}

const cut = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (limited(ip)) return NextResponse.json({ ok: false }, { status: 429 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ ok: false }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const message = cut(body.message, 400);
  if (!message) return NextResponse.json({ ok: false }, { status: 400 });
  const stack = cut(body.stack, 2000);
  const url = cut(body.url, 300);
  const firstFrame = stack.split('\n').find((l) => l.includes('at ')) ?? '';
  const key = crypto.createHash('sha1').update(`${message}|${firstFrame}`).digest('hex');

  const { data: existing } = await admin.from('client_errors').select('id, count').eq('key', key).maybeSingle();
  if (existing) {
    await admin.from('client_errors').update({ count: (existing.count as number) + 1, last_seen: new Date().toISOString(), url }).eq('id', existing.id);
  } else {
    await admin.from('client_errors').insert({
      key,
      message,
      stack,
      url,
      user_agent: cut(req.headers.get('user-agent'), 200),
      lang: cut(body.lang, 8),
    });
  }
  return NextResponse.json({ ok: true });
}

async function adminOnly(req: NextRequest) {
  const admin = getAdminClient();
  if (!admin) return { error: NextResponse.json({ error: 'not_configured' }, { status: 503 }) };
  const user = await getUserFromRequest(admin, req);
  if (!user?.isAdmin) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  return { admin };
}

export async function GET(req: NextRequest) {
  const ctx = await adminOnly(req);
  if ('error' in ctx) return ctx.error;
  const { data, error } = await ctx.admin.from('client_errors').select('id, message, stack, url, user_agent, count, last_seen').order('last_seen', { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: error.message, errors: [] }, { status: 500 });
  return NextResponse.json({ errors: data ?? [] });
}

export async function DELETE(req: NextRequest) {
  const ctx = await adminOnly(req);
  if ('error' in ctx) return ctx.error;
  await ctx.admin.from('client_errors').delete().not('id', 'is', null);
  return NextResponse.json({ ok: true });
}
