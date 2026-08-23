'use client';

// =====================================================================
// Pasul 2208001 — Selector de articol cu CĂUTARE
// =====================================================================
// Problema: cu 100 de articole, un <select> obisnuit devine o lista
// interminabila prin care trebuie sa derulezi.
// Solutia: un camp de cautare + maximum 5 rezultate afisate deodata.
// Scrii „W" -> vezi doar articolele care incep cu „W" (apoi cele care
// contin „W", ca sa nu pierzi nimic).
// =====================================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface PostOption {
  id: string;
  title: string;
  /** Pasul 2208002 (punctul 6) — articol dinamic („Play Blog") sau obisnuit */
  isDynamic?: boolean;
}

interface PostSearchSelectProps {
  posts: PostOption[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  emptyLabel?: string;
  /** Cate rezultate se arata simultan */
  maxVisible?: number;
}

export default function PostSearchSelect({
  posts,
  value,
  onChange,
  label = 'Articol legat (opțional)',
  emptyLabel = '— Fără articol (doar like) —',
  maxVisible = 5,
}: PostSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Pasul 2208002 (punctul 6) — filtre pentru tipul articolului.
  // Regula ceruta: daca NICIUNA nu e bifata, se arata TOATE articolele.
  // Daca ambele sunt bifate, tot toate. Bifezi una singura -> doar acelea.
  const [onlyDynamic, setOnlyDynamic] = useState(false);
  const [onlyStatic, setOnlyStatic] = useState(false);

  const selected = useMemo(
    () => posts.find((p) => p.id === value) ?? null,
    [posts, value],
  );

  /** Articolele ramase dupa filtrul Dinamic / Static */
  const byType = useMemo(() => {
    // Niciuna sau amandoua bifate = fara filtrare
    if (onlyDynamic === onlyStatic) return posts;
    if (onlyDynamic) return posts.filter((p) => p.isDynamic === true);
    return posts.filter((p) => !p.isDynamic);
  }, [posts, onlyDynamic, onlyStatic]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return byType.slice(0, maxVisible);

    // Intai cele care INCEP cu textul cautat, apoi cele care il contin.
    const starts: PostOption[] = [];
    const contains: PostOption[] = [];
    for (const p of byType) {
      const t = p.title.toLowerCase();
      if (t.startsWith(q)) starts.push(p);
      else if (t.includes(q)) contains.push(p);
    }
    return [...starts, ...contains].slice(0, maxVisible);
  }, [byType, query, maxVisible]);

  const totalMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return byType.length;
    return byType.filter((p) => p.title.toLowerCase().includes(q)).length;
  }, [byType, query]);

  // Inchidem lista la click in afara
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const inputClass =
    'w-full rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:focus:border-white/40 transition-colors';

  return (
    <div ref={boxRef} className="relative">
      <label className="block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${inputClass} text-left flex items-center justify-between gap-2`}
      >
        <span className="truncate">{selected ? selected.title : emptyLabel}</span>
        <span className="opacity-50 flex-shrink-0">▾</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-black shadow-xl overflow-hidden">
          <div className="p-2 border-b border-black/10 dark:border-white/10">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Scrie ca să cauți…"
              className={inputClass}
            />

            {/* Pasul 2208002 (punctul 6) — filtru dupa tipul articolului */}
            <div className="mt-2 flex items-center gap-3 text-[11px]">
              <label className="flex cursor-pointer items-center gap-1.5 text-black/70 dark:text-white/70">
                <input
                  type="checkbox"
                  checked={onlyDynamic}
                  onChange={(e) => setOnlyDynamic(e.target.checked)}
                  className="h-3.5 w-3.5 accent-black dark:accent-white"
                />
                Dinamice
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-black/70 dark:text-white/70">
                <input
                  type="checkbox"
                  checked={onlyStatic}
                  onChange={(e) => setOnlyStatic(e.target.checked)}
                  className="h-3.5 w-3.5 accent-black dark:accent-white"
                />
                Statice
              </label>
              <span className="ml-auto text-black/40 dark:text-white/40">
                {onlyDynamic === onlyStatic ? 'toate' : onlyDynamic ? 'doar dinamice' : 'doar statice'}
              </span>
            </div>
          </div>

          <ul className="max-h-64 overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); setQuery(''); }}
                className="w-full text-left px-3 py-2 text-sm text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10"
              >
                {emptyLabel}
              </button>
            </li>

            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => { onChange(p.id); setOpen(false); setQuery(''); }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 ${
                    p.id === value
                      ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white font-medium'
                      : 'text-black dark:text-white'
                  }`}
                  title={p.title}
                >
                  <span className="truncate">{p.title}</span>
                  {p.isDynamic && (
                    <span className="ml-auto flex-shrink-0 rounded-full border border-black/20 dark:border-white/25 px-1.5 py-[1px] text-[9px] tracking-wide opacity-70">
                      PLAY
                    </span>
                  )}
                </button>
              </li>
            ))}

            {results.length === 0 && (
              <li className="px-3 py-2 text-sm text-black/50 dark:text-white/50">
                Niciun articol găsit.
              </li>
            )}
          </ul>

          {totalMatches > results.length && (
            <p className="px-3 py-2 text-[11px] text-black/50 dark:text-white/50 border-t border-black/10 dark:border-white/10">
              Se afișează {results.length} din {totalMatches}. Scrie mai multe litere pentru a filtra.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
