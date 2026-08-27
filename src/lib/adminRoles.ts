// =====================================================================
// Pasul 2308005 (D) — roluri, drepturi și cereri de aprobare
// ---------------------------------------------------------------------
// IDEEA, pe scurt:
//   • TU (owner) faci orice, direct.
//   • Un sub-admin nu salvează nimic public. Orice face devine o CERERE.
//   • Tu vezi cererile în admin, apeși „Vezi", apoi „Acceptă" sau „Respinge".
//
// Owner-ul este recunoscut după email — la fel ca în funcția `is_owner()`
// din `STEP_2308005_ADMIN_ROLES.sql`. Cele două TREBUIE să fie identice.
// =====================================================================

'use client';

import { createClient } from '@/lib/supabase';

/** Emailurile care au drepturi depline. Trebuie să fie identice cu SQL-ul. */
export const OWNER_EMAILS = ['davidsimko22@yahoo.com'];

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return OWNER_EMAILS.includes(email.toLowerCase());
}

// ---------------------------------------------------------------------
// Drepturile care pot fi bifate pentru un sub-admin
// ---------------------------------------------------------------------
export interface PermissionDef {
  id: string;
  label: string;
  hint: string;
}

export const PERMISSIONS: PermissionDef[] = [
  { id: 'blog.create', label: 'Creează articole', hint: 'Poate scrie articole noi (ca ciornă).' },
  { id: 'blog.update', label: 'Modifică articole', hint: 'Poate propune schimbări la articole existente.' },
  { id: 'blog.delete', label: 'Șterge articole', hint: 'Poate cere ștergerea unui articol.' },
  { id: 'reel.create', label: 'Creează reels', hint: 'Poate propune reels noi.' },
  { id: 'reel.update', label: 'Modifică reels', hint: 'Poate propune schimbări la reels.' },
  { id: 'reel.delete', label: 'Șterge reels', hint: 'Poate cere ștergerea unui reel.' },
  { id: 'audio.generate', label: 'Generează audio', hint: 'ATENȚIE: costă bani la fiecare generare nouă.' },
  { id: 'comments.moderate', label: 'Moderează comentarii', hint: 'Poate ascunde sau șterge comentarii — se aplică imediat.' },
];

export type RequestAction = 'create' | 'update' | 'delete';
export type RequestEntity = 'blog' | 'reel';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface AdminRole {
  user_id: string;
  email: string;
  permissions: string[];
  active: boolean;
  created_at?: string;
}

export interface AdminRequest {
  id: string;
  requester_id: string;
  requester_email: string;
  action: RequestAction;
  entity: RequestEntity;
  entity_id: string | null;
  title: string | null;
  payload: Record<string, unknown>;
  previous: Record<string, unknown> | null;
  status: RequestStatus;
  review_note: string | null;
  created_at: string;
}

/** Are utilizatorul acest drept? Owner-ul are automat toate drepturile. */
export function can(
  permission: string,
  role: AdminRole | null,
  isOwner: boolean,
): boolean {
  if (isOwner) return true;
  if (!role || !role.active) return false;
  return role.permissions.includes(permission);
}

// ---------------------------------------------------------------------
// Citirea propriului rol
// ---------------------------------------------------------------------
export async function fetchMyRole(): Promise<AdminRole | null> {
  try {
    const supabase = createClient();
    const { data: session } = await supabase.auth.getUser();
    const uid = session.user?.id;
    if (!uid) return null;

    const { data } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    return (data as AdminRole) || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------
// Depunerea unei cereri
// ---------------------------------------------------------------------
export async function submitRequest(params: {
  action: RequestAction;
  entity: RequestEntity;
  entityId?: string | null;
  title?: string | null;
  payload: Record<string, unknown>;
  previous?: Record<string, unknown> | null;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: session } = await supabase.auth.getUser();
    const user = session.user;
    if (!user) return { ok: false, error: 'Nu ești autentificat.' };

    const { error } = await supabase.from('admin_requests').insert({
      requester_id: user.id,
      requester_email: user.email,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      title: params.title ?? null,
      payload: params.payload,
      previous: params.previous ?? null,
      status: 'pending',
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Eroare necunoscută' };
  }
}

/** Câte cereri așteaptă — pentru bulina de notificare din meniu */
export async function countPendingRequests(): Promise<number> {
  try {
    const supabase = createClient();
    const { count } = await supabase
      .from('admin_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    return count ?? 0;
  } catch {
    return 0;
  }
}
