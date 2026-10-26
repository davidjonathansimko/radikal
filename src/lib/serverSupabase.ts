// Pasul 261026 — client Supabase DOAR pentru server (cheia service-role).
// Nu se importa niciodata din componente de browser.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Utilizatorul din antetul „Authorization: Bearer <token>", sau null. */
export async function getUserFromRequest(
  admin: SupabaseClient,
  req: Request,
): Promise<{ id: string; email: string | null; isAdmin: boolean } | null> {
  const header = req.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email ?? null, isAdmin: data.user.app_metadata?.role === 'admin' };
}
