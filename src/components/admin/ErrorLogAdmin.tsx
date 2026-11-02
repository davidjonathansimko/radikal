'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

interface Row {
  id: string;
  message: string;
  stack: string | null;
  url: string | null;
  user_agent: string | null;
  count: number;
  last_seen: string;
}

async function call(method: 'GET' | 'DELETE') {
  const { data } = await getSupabaseClient().auth.getSession();
  const res = await fetch('/api/client-error', { method, headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` } });
  return { ok: res.ok, data: (await res.json().catch(() => ({}))) as { errors?: Row[]; error?: string } };
}

export default function ErrorLogAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await call('GET');
    if (!r.ok) setMsg(r.data.error === 'unauthorized' ? 'Doar adminul poate vedea erorile.' : 'Nu pot citi erorile. Ai rulat STEP_021126A_CLIENT_ERRORS.sql?');
    else {
      setRows(r.data.errors ?? []);
      setMsg('');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const btn = 'btn-solid rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold text-black dark:border-white/15 dark:text-white';
  return (
    <div className="space-y-3">
      <p className="text-xs text-black/60 dark:text-white/60">
        Erorile neprinse din aplicație apar aici, grupate: mesajul, de câte ori s-a întâmplat și pe ce pagină. Nu se trimit date personale.
      </p>
      <div className="flex gap-2">
        <button type="button" className={btn} onClick={() => void load()}>Reîncarcă</button>
        <button
          type="button"
          className={`${btn} text-red-600 dark:text-red-400`}
          onClick={async () => {
            if (!window.confirm('Ștergi toate erorile din listă?')) return;
            await call('DELETE');
            await load();
          }}
        >
          Golește lista
        </button>
      </div>
      {msg && <p className="text-xs text-black/60 dark:text-white/60">{msg}</p>}
      {!msg && rows.length === 0 && <p className="text-xs text-black/55 dark:text-white/55">Nicio eroare înregistrată.</p>}
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-lg border border-black/10 p-2.5 dark:border-white/15">
            <button type="button" className="w-full text-left" onClick={() => setOpen(open === r.id ? null : r.id)} style={{ minHeight: 0 }}>
              <span className="block text-sm font-semibold text-black dark:text-white">{r.message}</span>
              <span className="block text-[11px] text-black/55 dark:text-white/55">
                ×{r.count} · {r.url || '—'} · {new Date(r.last_seen).toLocaleString()}
              </span>
            </button>
            {open === r.id && (
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-[10px] text-black/65 dark:text-white/65">{r.stack || '(fără detalii)'}{'\n'}{r.user_agent}</pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
