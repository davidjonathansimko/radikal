'use client';

// Cere serverului sa trimita acum notificarile pentru continutul nou publicat (doar daca esti admin).

import { getSupabaseClient } from '@/lib/supabase';

export async function triggerPush(): Promise<Record<string, unknown> | null> {
  try {
    const { data } = await getSupabaseClient().auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;
    const res = await fetch('/api/push/cron', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    return res.ok ? ((await res.json()) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function pushAdminCall(
  method: 'GET' | 'POST',
  path: '/api/push/test' | '/api/push/cron',
  body?: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const { data } = await getSupabaseClient().auth.getSession();
  const token = data.session?.access_token ?? '';
  const res = await fetch(path, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data: json };
}
