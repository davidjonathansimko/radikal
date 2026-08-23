'use client';

// =====================================================================
// Pasul 2308005 (D) — cine este sub-admin și ce drepturi are
// ---------------------------------------------------------------------
// Adaugi pe cineva după email. Bifezi exact ce poate face.
// Orice ar face el rămâne CIORNĂ până când tu aprobi din „Notificări".
// =====================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { PERMISSIONS, type AdminRole } from '@/lib/adminRoles';

export default function AdminUsersPanel() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from('admin_roles')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setRoles((data as AdminRole[]) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nu am putut citi lista.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // --- Adaugă un sub-admin ------------------------------------------
  const addRole = useCallback(async () => {
    const clean = email.trim().toLowerCase();
    if (!clean) return;

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const supabase = createClient();

      // Găsim utilizatorul după email în `profiles`.
      // (Tabelul `auth.users` nu e accesibil din browser — pe bună dreptate.)
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', clean)
        .maybeSingle();

      if (pErr) throw pErr;
      if (!profile) {
        throw new Error(
          'Nu găsesc acest email. Persoana trebuie să își facă întâi cont pe RADIKAL.',
        );
      }

      const { error: iErr } = await supabase.from('admin_roles').upsert(
        {
          user_id: (profile as { id: string }).id,
          email: clean,
          permissions: [],
          active: true,
        },
        { onConflict: 'user_id' },
      );
      if (iErr) throw iErr;

      setEmail('');
      setMessage('Adăugat. Acum bifează-i drepturile mai jos.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Adăugarea a eșuat.');
    } finally {
      setBusy(false);
    }
  }, [email, load]);

  // --- Bifează / debifează un drept ----------------------------------
  const togglePermission = useCallback(async (role: AdminRole, permId: string) => {
    const next = role.permissions.includes(permId)
      ? role.permissions.filter((p) => p !== permId)
      : [...role.permissions, permId];

    // Actualizăm imediat pe ecran, ca să nu pară blocat
    setRoles((rs) => rs.map((r) => (r.user_id === role.user_id ? { ...r, permissions: next } : r)));

    try {
      const supabase = createClient();
      const { error: err } = await supabase
        .from('admin_roles')
        .update({ permissions: next, updated_at: new Date().toISOString() })
        .eq('user_id', role.user_id);
      if (err) throw err;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Salvarea dreptului a eșuat.');
      await load(); // punem la loc starea reală
    }
  }, [load]);

  const toggleActive = useCallback(async (role: AdminRole) => {
    try {
      const supabase = createClient();
      const { error: err } = await supabase
        .from('admin_roles')
        .update({ active: !role.active })
        .eq('user_id', role.user_id);
      if (err) throw err;
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Schimbarea a eșuat.');
    }
  }, [load]);

  const removeRole = useCallback(async (role: AdminRole) => {
    if (!window.confirm(`Îi retragi complet drepturile lui ${role.email}?`)) return;
    try {
      const supabase = createClient();
      const { error: err } = await supabase
        .from('admin_roles')
        .delete()
        .eq('user_id', role.user_id);
      if (err) throw err;
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ștergerea a eșuat.');
    }
  }, [load]);

  return (
    <div className="space-y-5">
      {/* --- Adăugare --- */}
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplu.com"
          className="min-w-[240px] flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/25"
        />
        <button
          type="button"
          onClick={() => void addRole()}
          disabled={busy || !email.trim()}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {busy ? 'Se adaugă…' : 'Adaugă sub-admin'}
        </button>
      </div>

      <p className="text-[11px] text-white/40">
        Persoana trebuie să aibă deja cont pe RADIKAL. Orice ar face un sub-admin
        rămâne <strong>ciornă</strong> până când tu aprobi din rubrica „Notificări&ldquo;.
      </p>

      {loading && <p className="text-sm text-white/50">Se încarcă…</p>}

      {!loading && roles.length === 0 && (
        <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/50">
          Niciun sub-admin. Ești singurul care poate modifica site-ul.
        </p>
      )}

      {/* --- Lista --- */}
      <ul className="space-y-4">
        {roles.map((role) => (
          <li key={role.user_id} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-white">{role.email}</p>
                <p className="text-[11px] text-white/50">
                  {role.active ? 'Activ' : 'Suspendat'} ·{' '}
                  {role.permissions.length} drept(uri)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void toggleActive(role)}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                >
                  {role.active ? 'Suspendă' : 'Reactivează'}
                </button>
                <button
                  type="button"
                  onClick={() => void removeRole(role)}
                  className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                >
                  Retrage tot
                </button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {PERMISSIONS.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-start gap-2 rounded-lg bg-black/30 p-2"
                >
                  <input
                    type="checkbox"
                    checked={role.permissions.includes(p.id)}
                    onChange={() => void togglePermission(role, p.id)}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 accent-purple-500"
                  />
                  <span>
                    <span className="block text-xs text-white">{p.label}</span>
                    <span className="block text-[10px] text-white/45">{p.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {message && <p className="text-xs text-green-300">{message}</p>}
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
