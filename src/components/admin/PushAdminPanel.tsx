'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { pushAdminCall } from '@/lib/pushTrigger';

interface ItemView {
  key: string;
  kind: string;
  label: string;
  texts: Record<string, string | null>;
  missing: string[];
}

const LANGS = ['de', 'en', 'ro', 'ru'];
const KIND: Record<string, string> = { blogs: 'Blog', marturii: 'Mărturie', reels: 'Reel', verse: 'Verset' };

export default function PushAdminPanel() {
  const [stats, setStats] = useState<{ total: number; mine: number } | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<ItemView[]>([]);
  const [ready, setReady] = useState<ItemView[]>([]);

  const refreshStats = useCallback(async () => {
    try {
      const r = await pushAdminCall('GET', '/api/push/test');
      if (r.ok) setStats({ total: Number(r.data.total) || 0, mine: Number(r.data.mine) || 0 });
    } catch {
      /* ignorat */
    }
  }, []);

  const lists = (d: Record<string, unknown>) => {
    setPending((d.pending as ItemView[]) ?? []);
    setReady((d.ready as ItemView[]) ?? []);
  };

  const check = useCallback(async () => {
    const r = await pushAdminCall('POST', '/api/push/cron', { action: 'preview' });
    if (!r.ok) {
      setMsg(`Eroare ${r.status}: ${String(r.data.error ?? '')}`);
      return;
    }
    lists(r.data);
  }, []);

  useEffect(() => {
    void refreshStats();
    void check();
  }, [refreshStats, check]);

  const test = async () => {
    setBusy(true);
    setMsg('');
    try {
      const r = await pushAdminCall('POST', '/api/push/test');
      const d = r.data as { sent?: number; failed?: number; dead?: number; note?: string; errors?: string[]; error?: string };
      if (!r.ok) setMsg(`Eroare ${r.status}: ${d.error ?? ''}`);
      else if (d.note === 'no_device') setMsg('Contul tău nu are niciun dispozitiv abonat. Intră logat pe telefon, Meniu → Benachrichtigungen.');
      else if (d.dead) setMsg(`Trimis: ${d.sent}. ${d.dead} dispozitiv(e) nu mai sunt valide (aplicația reinstalată sau permisiunea retrasă) și au fost șterse. Deschide Meniu → Benachrichtigungen pe telefon ca să te abonezi din nou.`);
      else setMsg(`Trimis: ${d.sent}, eșuat: ${d.failed}${d.errors?.length ? ` — ${d.errors.join(' | ')}` : ''}`);
      await refreshStats();
    } finally {
      setBusy(false);
    }
  };

  const act = async (action: 'translate' | 'send') => {
    setBusy(true);
    setMsg('');
    try {
      const r = await pushAdminCall('POST', '/api/push/cron', { action });
      if (!r.ok) {
        setMsg(`Eroare ${r.status}: ${String(r.data.error ?? '')}`);
        return;
      }
      lists(r.data);
      if (action === 'send') {
        const sent = (r.data.sent as string[]) ?? [];
        const rep = (r.data.report ?? {}) as Record<string, { sent: number; errors?: string[] }>;
        setMsg(
          sent.length
            ? `Trimise: ${sent.map((k) => `${KIND[k.split(':')[0]] ?? k} → ${rep[k]?.sent ?? 0} dispozitive${rep[k]?.errors?.length ? ` (${rep[k].errors![0]})` : ''}`).join('; ')}.`
            : 'Nimic de trimis acum.',
        );
      } else {
        setMsg('Traducerile lipsă au fost generate. Verifică textele de mai jos, apoi apasă „Trimite”.');
      }
    } finally {
      setBusy(false);
    }
  };

  const item = (it: ItemView, ok: boolean) => (
    <li key={it.key} className="rounded-lg border border-black/10 p-2 dark:border-white/15">
      <p className="text-xs font-semibold text-black dark:text-white">
        {KIND[it.kind] ?? it.kind}: {it.label || '—'}
        <span className={`ml-2 ${ok ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {ok ? 'gata de trimis' : `lipsesc: ${it.missing.join(', ')}`}
        </span>
      </p>
      <ul className="mt-1 space-y-0.5">
        {LANGS.map((l) => (
          <li key={l} className="truncate text-[11px] text-black/60 dark:text-white/60">
            <strong>{l.toUpperCase()}</strong> {it.texts[l] ?? '— lipsește —'}
          </li>
        ))}
      </ul>
    </li>
  );

  const btn = 'btn-solid rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50';
  return (
    <div className="space-y-3">
      <p className="text-xs text-black/60 dark:text-white/60">
        Dispozitive abonate: <strong>{stats ? stats.total : '…'}</strong> · ale contului tău: <strong>{stats ? stats.mine : '…'}</strong>.
        Blogurile, mărturiile și reels-urile noi pleacă <strong>doar când textul există în toate cele 4 limbi</strong>, ca fiecare cititor să primească notificarea în limba lui.
        Versetul zilei se traduce singur și pleacă după ora 07:00 (Berlin).
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void test()} className={`${btn} bg-black text-white dark:bg-white dark:text-black`}>
          Notificare de test (telefoanele mele)
        </button>
        <button type="button" disabled={busy} onClick={() => void check()} className={`${btn} border border-black/15 text-black dark:border-white/15 dark:text-white`}>
          Verifică conținutul nou
        </button>
      </div>

      {(pending.length > 0 || ready.length > 0) && (
        <div className="space-y-2">
          <ul className="space-y-2">
            {ready.map((it) => item(it, true))}
            {pending.map((it) => item(it, false))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {pending.length > 0 && (
              <button type="button" disabled={busy} onClick={() => void act('translate')} className={`${btn} border border-black/15 text-black dark:border-white/15 dark:text-white`}>
                Generează traducerile lipsă (DeepL)
              </button>
            )}
            <button type="button" disabled={busy || ready.length === 0} onClick={() => void act('send')} className={`${btn} bg-black text-white dark:bg-white dark:text-black`}>
              Trimite ce e gata
            </button>
          </div>
        </div>
      )}
      {pending.length === 0 && ready.length === 0 && <p className="text-xs text-black/55 dark:text-white/55">Nimic nou de trimis (ultimele 3 zile).</p>}
      {msg && <p className="text-xs text-black/70 dark:text-white/70" role="status">{msg}</p>}
    </div>
  );
}
