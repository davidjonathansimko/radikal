'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { fetchBlogsHome, saveBlogsHome, BLOGS_HOME_DEFAULT, type BlogsHomeMode } from '@/lib/blogsHome';

interface Row {
  id: string;
  title: string;
}

const MODES: { id: BlogsHomeMode; title: string; text: string }[] = [
  { id: 1, title: '1 · Ultimele 6 bloguri', text: 'Ca până acum: „Angezeigt werden die letzten 6 Blogbeiträge”.' },
  { id: 2, title: '2 · Bloguri recomandate', text: 'Același design, dar apar blogurile alese de tine, în ordinea aleasă, cu titlul „Bloguri recomandate”.' },
  { id: 3, title: '3 · Recomandate + ultimele 6, cu descriere', text: 'Două benzi, carduri puțin mai mici. Sub card: „Categorie: …” și descrierea (extrasul blogului).' },
  { id: 4, title: '4 · Recomandate + ultimele 6, text obișnuit', text: 'Două benzi, carduri puțin mai mici. Sub card rămâne textul de acum: Blog, titlu, cât timp a trecut.' },
];

export default function BlogsHomeAdmin() {
  const [mode, setMode] = useState<BlogsHomeMode>(BLOGS_HOME_DEFAULT.mode);
  const [ids, setIds] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [pick, setPick] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const cfg = await fetchBlogsHome(true);
      const { data } = await createClient().from('blog_posts').select('id, title').eq('published', true).order('created_at', { ascending: false });
      if (!alive) return;
      setMode(cfg.mode);
      setIds(cfg.recommended);
      setRows((data ?? []) as Row[]);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const available = rows.filter((r) => !ids.includes(r.id));

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    const next = [...ids];
    [next[i], next[j]] = [next[j], next[i]];
    setIds(next);
  };

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      await saveBlogsHome({ mode, recommended: ids });
      setMsg(mode > 1 && ids.length === 0 ? 'Salvat. Fără nicio recomandare rămâne lista cu ultimele 6.' : 'Salvat.');
    } catch {
      setMsg('Nu am putut salva.');
    } finally {
      setBusy(false);
    }
  };

  const btn = 'btn-solid rounded-lg px-3 py-1.5 text-xs font-semibold';
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {MODES.map((m) => (
          <label key={m.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-black/10 p-3 dark:border-white/15">
            <input type="radio" name="blogs-home-mode" checked={mode === m.id} onChange={() => setMode(m.id)} className="mt-1" />
            <span>
              <span className="block text-sm font-semibold text-black dark:text-white">{m.title}</span>
              <span className="block text-xs text-black/55 dark:text-white/55">{m.text}</span>
            </span>
          </label>
        ))}
      </div>

      {mode > 1 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-black dark:text-white">Blogurile recomandate (în ordine)</p>
          {ids.length === 0 && <p className="text-xs text-black/55 dark:text-white/55">Nimic ales încă. Adaugă mai jos.</p>}
          <ol className="space-y-1">
            {ids.map((id, i) => (
              <li key={id} className="flex items-center gap-2 rounded-lg border border-black/10 px-2 py-1.5 dark:border-white/15">
                <span className="w-5 text-center text-xs text-black/50 dark:text-white/50">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-black dark:text-white">{byId.get(id)?.title ?? id}</span>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={`${btn} border border-black/15 text-black disabled:opacity-30 dark:border-white/15 dark:text-white`} aria-label="Mai sus">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === ids.length - 1} className={`${btn} border border-black/15 text-black disabled:opacity-30 dark:border-white/15 dark:text-white`} aria-label="Mai jos">↓</button>
                <button type="button" onClick={() => setIds(ids.filter((x) => x !== id))} className={`${btn} border border-red-500/40 text-red-600 dark:text-red-400`} aria-label="Scoate">✕</button>
              </li>
            ))}
          </ol>
          {ids.length < 6 && (
            <div className="flex gap-2">
              <select value={pick} onChange={(e) => setPick(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-black/15 bg-transparent px-2 py-2 text-sm text-black dark:border-white/15 dark:text-white">
                <option value="">Alege un blog…</option>
                {available.map((r) => (
                  <option key={r.id} value={r.id} className="text-black">{r.title}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!pick}
                onClick={() => {
                  setIds([...ids, pick]);
                  setPick('');
                }}
                className={`${btn} bg-black text-white disabled:opacity-40 dark:bg-white dark:text-black`}
              >
                Adaugă
              </button>
            </div>
          )}
          <p className="text-xs text-black/50 dark:text-white/50">Maximum 6 bloguri recomandate.</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="button" disabled={busy} onClick={() => void save()} className={`${btn} bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black`}>
          Salvează
        </button>
        {msg && <span className="text-xs text-black/60 dark:text-white/60" role="status">{msg}</span>}
      </div>
    </div>
  );
}
