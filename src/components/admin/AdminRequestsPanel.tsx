'use client';

// =====================================================================
// Pasul 2308005 (D) — Notificări: cererile care așteaptă aprobarea ta
// ---------------------------------------------------------------------
// Ai cerut, pe bună dreptate, ceva mai simplu decât emailurile:
// vezi totul direct în admin, cu „Vezi" / „Acceptă" / „Respinge".
//
// La APROBARE, cererea se aplică efectiv (se scrie în `blog_posts` sau
// `reels`). Până atunci NIMIC nu ajunge public.
// =====================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { AdminRequest } from '@/lib/adminRoles';

const ACTION_LABEL: Record<string, string> = {
  create: 'Creare',
  update: 'Modificare',
  delete: 'Ștergere',
};

const ENTITY_LABEL: Record<string, string> = {
  blog: 'Articol',
  reel: 'Reel',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ro-RO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminRequestsPanel() {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      let q = supabase
        .from('admin_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter === 'pending') q = q.eq('status', 'pending');

      const { data, error: err } = await q;
      if (err) throw err;
      setRequests((data as AdminRequest[]) || []);
    } catch (e) {
      setError(
        e instanceof Error
          ? `Nu am putut citi cererile: ${e.message}`
          : 'Nu am putut citi cererile.',
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  // -------------------------------------------------------------------
  // APROBARE — abia acum modificarea devine reală
  // -------------------------------------------------------------------
  const approve = useCallback(async (req: AdminRequest) => {
    if (!window.confirm(
      `Aprobi „${ACTION_LABEL[req.action]} ${ENTITY_LABEL[req.entity]}"?\n\n` +
      'După aprobare, schimbarea devine publică.'
    )) return;

    setBusyId(req.id);
    setError('');
    setMessage('');

    try {
      const supabase = createClient();
      const table = req.entity === 'blog' ? 'blog_posts' : 'reels';

      if (req.action === 'create') {
        const { error: err } = await supabase.from(table).insert(req.payload);
        if (err) throw err;
      } else if (req.action === 'update') {
        if (!req.entity_id) throw new Error('Cererea nu are un id de modificat.');
        const { error: err } = await supabase
          .from(table)
          .update(req.payload)
          .eq('id', req.entity_id);
        if (err) throw err;
      } else if (req.action === 'delete') {
        if (!req.entity_id) throw new Error('Cererea nu are un id de șters.');
        // `eq('id', …)` este obligatoriu — fără el s-ar șterge tot tabelul
        const { error: err } = await supabase
          .from(table)
          .delete()
          .eq('id', req.entity_id);
        if (err) throw err;
      }

      const { data: me } = await supabase.auth.getUser();
      const { error: markErr } = await supabase
        .from('admin_requests')
        .update({
          status: 'approved',
          reviewed_by: me.user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', req.id);
      if (markErr) throw markErr;

      setMessage('Aprobat și aplicat.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Aprobarea a eșuat.');
    } finally {
      setBusyId(null);
    }
  }, [load]);

  // -------------------------------------------------------------------
  // RESPINGERE — nu se aplică nimic
  // -------------------------------------------------------------------
  const reject = useCallback(async (req: AdminRequest) => {
    const note = window.prompt('De ce respingi? (opțional — sub-adminul va vedea acest mesaj)');
    if (note === null) return; // a apăsat Anulează

    setBusyId(req.id);
    setError('');
    setMessage('');

    try {
      const supabase = createClient();
      const { data: me } = await supabase.auth.getUser();
      const { error: err } = await supabase
        .from('admin_requests')
        .update({
          status: 'rejected',
          review_note: note || null,
          reviewed_by: me.user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', req.id);
      if (err) throw err;

      setMessage('Respins. Nu s-a schimbat nimic pe site.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Respingerea a eșuat.');
    } finally {
      setBusyId(null);
    }
  }, [load]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
            filter === 'pending' ? 'bg-white/20 text-white' : 'text-white/50 hover:bg-white/10'
          }`}
        >
          În așteptare {pendingCount > 0 && filter === 'pending' ? `(${pendingCount})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
            filter === 'all' ? 'bg-white/20 text-white' : 'text-white/50 hover:bg-white/10'
          }`}
        >
          Toate
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10"
        >
          Reîmprospătează
        </button>
      </div>

      {loading && <p className="text-sm text-white/50">Se încarcă…</p>}

      {!loading && requests.length === 0 && (
        <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/50">
          {filter === 'pending'
            ? 'Nicio cerere în așteptare. Totul e la zi.'
            : 'Nicio cerere înregistrată.'}
        </p>
      )}

      <ul className="space-y-3">
        {requests.map((req) => {
          const open = openId === req.id;
          return (
            <li
              key={req.id}
              className={`rounded-xl border p-4 ${
                req.status === 'pending'
                  ? 'border-amber-400/40 bg-amber-500/5'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">
                    {ACTION_LABEL[req.action]} — {ENTITY_LABEL[req.entity]}
                    {req.title ? `: „${req.title}"` : ''}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/50">
                    {req.requester_email} · {formatDate(req.created_at)}
                  </p>
                  {req.status !== 'pending' && (
                    <p className={`mt-1 text-[11px] ${
                      req.status === 'approved' ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {req.status === 'approved' ? 'Aprobat' : 'Respins'}
                      {req.review_note ? ` — ${req.review_note}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : req.id)}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                  >
                    {open ? 'Ascunde' : 'Vezi'}
                  </button>

                  {req.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => void approve(req)}
                        disabled={busyId === req.id}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {busyId === req.id ? '…' : 'Acceptă'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void reject(req)}
                        disabled={busyId === req.id}
                        className="rounded-lg bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Respinge
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* --- Ce anume se schimbă --- */}
              {open && (
                <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
                  {req.previous && (
                    <div>
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-white/40">
                        Înainte
                      </p>
                      <pre className="max-h-52 overflow-auto rounded-lg bg-black/50 p-3 text-[11px] text-white/60">
                        {JSON.stringify(req.previous, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div>
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-white/40">
                      {req.action === 'delete' ? 'Se va șterge' : 'După aprobare'}
                    </p>
                    <pre className="max-h-52 overflow-auto rounded-lg bg-black/50 p-3 text-[11px] text-white/80">
                      {JSON.stringify(req.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {message && <p className="text-xs text-green-300">{message}</p>}
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
