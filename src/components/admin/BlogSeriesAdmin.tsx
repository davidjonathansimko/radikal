'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { fetchBlogSeries, saveBlogSeries, type BlogSeries } from '@/lib/blogSeries';

interface Row {
  id: string;
  title: string;
}

const LANG_FIELDS: { key: 'de' | 'en' | 'ru'; label: string }[] = [
  { key: 'de', label: 'Nume DE' },
  { key: 'en', label: 'Nume EN' },
  { key: 'ru', label: 'Nume RU' },
];

export default function BlogSeriesAdmin() {
  const [series, setSeries] = useState<BlogSeries[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [pick, setPick] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const cfg = await fetchBlogSeries(true);
      const { data } = await createClient().from('blog_posts').select('id, title').eq('published', true).order('created_at', { ascending: false });
      if (!alive) return;
      setSeries(cfg);
      setRows((data ?? []) as Row[]);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const patch = (id: string, fn: (s: BlogSeries) => BlogSeries) => setSeries((all) => all.map((s) => (s.id === id ? fn(s) : s)));

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    const id = `s${Date.now().toString(36)}`;
    setSeries([...series, { id, name, ids: [] }]);
    setOpenId(id);
    setNewName('');
  };

  const move = (s: BlogSeries, i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= s.ids.length) return;
    const next = [...s.ids];
    [next[i], next[j]] = [next[j], next[i]];
    patch(s.id, (x) => ({ ...x, ids: next }));
  };

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      await saveBlogSeries(series);
      setMsg('Salvat.');
    } catch {
      setMsg('Nu am putut salva.');
    } finally {
      setBusy(false);
    }
  };

  const btn = 'btn-solid rounded-lg px-3 py-1.5 text-xs font-semibold';
  const ghost = `${btn} border border-black/15 text-black disabled:opacity-30 dark:border-white/15 dark:text-white`;
  const input = 'min-w-0 flex-1 rounded-lg border border-black/15 bg-transparent px-2 py-2 text-sm text-black dark:border-white/15 dark:text-white';

  return (
    <div className="space-y-4">
      <p className="text-xs text-black/55 dark:text-white/55">
        O serie grupează blogurile într-o ordine aleasă de tine. Cititorii o văd ca bandă sub „Recomandate / Ultimele”, ca etichetă „Serie: …” deasupra titlului și în fereastra „Serii”. Un blog poate fi în mai multe serii; eticheta arată prima serie în care apare.
      </p>

      <div className="flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nume serie nouă (ex. Păcate mici)" className={input} />
        <button type="button" onClick={add} disabled={!newName.trim()} className={`${btn} bg-black text-white disabled:opacity-40 dark:bg-white dark:text-black`}>
          Creează
        </button>
      </div>

      {series.length === 0 && <p className="text-xs text-black/55 dark:text-white/55">Nicio serie încă.</p>}

      <ul className="space-y-2">
        {series.map((s) => {
          const open = openId === s.id;
          const available = rows.filter((r) => !s.ids.includes(r.id));
          return (
            <li key={s.id} className="rounded-lg border border-black/10 dark:border-white/15">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : s.id)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                aria-expanded={open}
              >
                <span className="min-w-0 truncate text-sm font-semibold text-black dark:text-white">{s.name}</span>
                <span className="shrink-0 text-xs text-black/50 dark:text-white/50">{s.ids.length} bloguri {open ? '▲' : '▼'}</span>
              </button>

              {open && (
                <div className="space-y-3 border-t border-black/10 px-3 py-3 dark:border-white/10">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs text-black/60 dark:text-white/60">
                      Nume (română)
                      <input value={s.name} onChange={(e) => patch(s.id, (x) => ({ ...x, name: e.target.value }))} className={`${input} mt-1 w-full`} />
                    </label>
                    {LANG_FIELDS.map((f) => (
                      <label key={f.key} className="text-xs text-black/60 dark:text-white/60">
                        {f.label} (opțional)
                        <input
                          value={s.names?.[f.key] ?? ''}
                          onChange={(e) => patch(s.id, (x) => ({ ...x, names: { ...x.names, [f.key]: e.target.value } }))}
                          className={`${input} mt-1 w-full`}
                        />
                      </label>
                    ))}
                  </div>

                  <ol className="space-y-1">
                    {s.ids.map((id, i) => (
                      <li key={id} className="flex items-center gap-2 rounded-lg border border-black/10 px-2 py-1.5 dark:border-white/15">
                        <span className="w-5 text-center text-xs text-black/50 dark:text-white/50">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-black dark:text-white">{byId.get(id)?.title ?? id}</span>
                        <button type="button" onClick={() => move(s, i, -1)} disabled={i === 0} className={ghost} aria-label="Mai sus">↑</button>
                        <button type="button" onClick={() => move(s, i, 1)} disabled={i === s.ids.length - 1} className={ghost} aria-label="Mai jos">↓</button>
                        <button type="button" onClick={() => patch(s.id, (x) => ({ ...x, ids: x.ids.filter((y) => y !== id) }))} className={`${btn} border border-red-500/40 text-red-600 dark:text-red-400`} aria-label="Scoate">✕</button>
                      </li>
                    ))}
                  </ol>

                  <div className="flex gap-2">
                    <select value={pick} onChange={(e) => setPick(e.target.value)} className={input}>
                      <option value="">Alege un blog…</option>
                      {available.map((r) => (
                        <option key={r.id} value={r.id} className="text-black">{r.title}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!pick}
                      onClick={() => {
                        patch(s.id, (x) => ({ ...x, ids: [...x.ids, pick] }));
                        setPick('');
                      }}
                      className={`${btn} bg-black text-white disabled:opacity-40 dark:bg-white dark:text-black`}
                    >
                      Adaugă
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Ștergi seria „${s.name}”? Blogurile rămân neatinse.`)) {
                        setSeries(series.filter((x) => x.id !== s.id));
                        setOpenId(null);
                      }
                    }}
                    className={`${btn} border border-red-500/40 text-red-600 dark:text-red-400`}
                  >
                    Șterge seria
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-3">
        <button type="button" disabled={busy} onClick={() => void save()} className={`${btn} bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black`}>
          Salvează
        </button>
        {msg && <span className="text-xs text-black/60 dark:text-white/60" role="status">{msg}</span>}
      </div>
    </div>
  );
}
