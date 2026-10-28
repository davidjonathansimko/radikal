'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { pushAdminCall } from '@/lib/pushTrigger';

export default function PushAdminPanel() {
  const [stats, setStats] = useState<{ total: number; mine: number } | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await pushAdminCall('GET', '/api/push/test');
      if (r.ok) setStats({ total: Number(r.data.total) || 0, mine: Number(r.data.mine) || 0 });
    } catch {
      /* ignorat */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const test = async () => {
    setBusy(true);
    setMsg('');
    try {
      const r = await pushAdminCall('POST', '/api/push/test');
      const d = r.data as { sent?: number; failed?: number; note?: string; errors?: string[]; error?: string };
      if (!r.ok) setMsg(`Eroare ${r.status}: ${d.error ?? ''}`);
      else if (d.note === 'no_device') setMsg('Contul tău nu are niciun dispozitiv abonat. Intră logat pe telefon, Meniu → Benachrichtigungen, și pornește o opțiune.');
      else setMsg(`Trimis: ${d.sent}, eșuat: ${d.failed}${d.errors?.length ? ` — ${d.errors.join(' | ')}` : ''}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const sendNew = async () => {
    setBusy(true);
    setMsg('');
    try {
      const r = await pushAdminCall('POST', '/api/push/cron');
      const d = r.data as { items?: number; report?: Record<string, { sent: number; errors?: string[] }>; error?: string };
      if (!r.ok) setMsg(`Eroare ${r.status}: ${d.error ?? ''}`);
      else if (!d.items) setMsg('Nimic nou de trimis (tot ce e publicat în ultimele 3 zile a fost deja trimis).');
      else setMsg(`Conținut nou: ${d.items}. ` + Object.entries(d.report ?? {}).map(([k, v]) => `${k.split(':')[0]}: ${v.sent} trimise${v.errors?.length ? ` (${v.errors[0]})` : ''}`).join('; '));
    } finally {
      setBusy(false);
    }
  };

  const btn = 'btn-solid rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50';
  return (
    <div className="space-y-3">
      <p className="text-xs text-black/60 dark:text-white/60">
        Dispozitive abonate: <strong>{stats ? stats.total : '…'}</strong> · ale contului tău: <strong>{stats ? stats.mine : '…'}</strong>.
        Notificările pentru bloguri, mărturii și reels pleacă imediat după ce salvezi un articol publicat. Versetul zilei pleacă după ora 07:00 (Berlin).
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void test()} className={`${btn} bg-black text-white dark:bg-white dark:text-black`}>
          Trimite o notificare de test (telefoanele mele)
        </button>
        <button type="button" disabled={busy} onClick={() => void sendNew()} className={`${btn} border border-black/15 text-black dark:border-white/15 dark:text-white`}>
          Trimite acum conținutul nou
        </button>
      </div>
      {msg && <p className="text-xs text-black/70 dark:text-white/70" role="status">{msg}</p>}
    </div>
  );
}
