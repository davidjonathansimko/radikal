'use client';

/**
 * Pasul 2708023 — alegerea rubricii, pas cu pas.
 *
 * Înainte, toate rubricile stăteau într-o singură listă. Cu zece rubrici mergea;
 * cu o mie ar fi fost de nefolosit.
 *
 * Acum cobori câte un nivel: alegi rubrica mare, se deschid rubricile ei, alegi
 * mai departe, și tot așa. Sus rămâne drumul parcurs, ca să te poți întoarce.
 * Poți opri oriunde — te oprești unde vrei să pui articolul.
 */

import React, { useMemo, useState } from 'react';

export interface PickerSection {
  id: string;
  parent_id: string | null;
  name: string;
}

export default function SectionTreePicker({
  sections,
  value,
  onChange,
  label = 'În ce rubrici intră',
  emptyHint = 'Nu există încă nicio rubrică.',
}: {
  sections: PickerSection[];
  /** Rubricile bifate */
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  emptyHint?: string;
}) {
  /** Unde ne aflăm acum în arbore. Gol = la rădăcină. */
  const [path, setPath] = useState<PickerSection[]>([]);
  const [search, setSearch] = useState('');

  const currentParent = path.length ? path[path.length - 1].id : null;

  const children = useMemo(
    () => sections.filter((s) => (s.parent_id ?? null) === currentParent),
    [sections, currentParent],
  );

  const hasChildren = useMemo(() => {
    const set = new Set(sections.map((s) => s.parent_id).filter(Boolean) as string[]);
    return (id: string) => set.has(id);
  }, [sections]);

  /** Când cauți, se caută în TOATE rubricile, nu doar în nivelul curent. */
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return sections.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 40);
  }, [sections, search]);

  const nameOf = useMemo(() => {
    const map = new Map(sections.map((s) => [s.id, s]));
    return (id: string) => {
      // Numele întreg, cu drumul lui, ca să știi exact care e.
      const parts: string[] = [];
      let cur = map.get(id);
      for (let i = 0; cur && i < 12; i += 1) {
        parts.unshift(cur.name);
        cur = cur.parent_id ? map.get(cur.parent_id) : undefined;
      }
      return parts.join(' › ');
    };
  }, [sections]);

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  const labelClass =
    'block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1';
  const rowBase =
    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors';

  if (sections.length === 0) {
    return (
      <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <p className={labelClass}>{label}</p>
        <p className="text-sm text-black/50 dark:text-white/50">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <p className={labelClass}>{label}</p>

      {/* Ce ai ales deja */}
      {value.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {value.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className="btn-solid inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-xs text-white dark:bg-white dark:text-black"
              title="Apasă ca să scoți"
            >
              {nameOf(id)}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Caută o rubrică…"
        className="mb-3 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black/40 dark:border-white/15 dark:bg-black dark:text-white dark:focus:border-white/40"
      />

      {results ? (
        <div className="grid gap-1">
          {results.length === 0 ? (
            <p className="text-sm text-black/50 dark:text-white/50">Nicio rubrică găsită.</p>
          ) : (
            results.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className={`${rowBase} ${
                  value.includes(s.id)
                    ? 'bg-black/10 text-black dark:bg-white/15 dark:text-white'
                    : 'text-black/75 hover:bg-black/5 dark:text-white/75 dark:hover:bg-white/10'
                }`}
              >
                <span className="shrink-0">{value.includes(s.id) ? '✓' : '＋'}</span>
                <span className="min-w-0 truncate">{nameOf(s.id)}</span>
              </button>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Drumul până aici */}
          <div className="mb-2 flex flex-wrap items-center gap-1 text-xs text-black/50 dark:text-white/50">
            <button
              type="button"
              onClick={() => setPath([])}
              className="rounded px-1 transition-colors hover:text-black dark:hover:text-white"
            >
              Toate
            </button>
            {path.map((p, i) => (
              <span key={p.id} className="flex items-center gap-1">
                <span className="opacity-50">›</span>
                <button
                  type="button"
                  onClick={() => setPath(path.slice(0, i + 1))}
                  className="rounded px-1 transition-colors hover:text-black dark:hover:text-white"
                >
                  {p.name}
                </button>
              </span>
            ))}
          </div>

          {path.length > 0 && (
            <button
              type="button"
              onClick={() => setPath(path.slice(0, -1))}
              className="mb-2 inline-flex items-center gap-2 text-xs text-black/55 transition-colors hover:text-black dark:text-white/55 dark:hover:text-white"
            >
              <span aria-hidden="true">←</span> Înapoi
            </button>
          )}

          <div className="grid gap-1">
            {children.length === 0 ? (
              <p className="text-sm text-black/50 dark:text-white/50">
                Aici nu mai sunt rubrici.
              </p>
            ) : (
              children.map((s) => {
                const chosen = value.includes(s.id);
                return (
                  <div key={s.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggle(s.id)}
                      className={`${rowBase} flex-1 ${
                        chosen
                          ? 'bg-black/10 text-black dark:bg-white/15 dark:text-white'
                          : 'text-black/75 hover:bg-black/5 dark:text-white/75 dark:hover:bg-white/10'
                      }`}
                    >
                      <span className="shrink-0">{chosen ? '✓' : '＋'}</span>
                      <span className="min-w-0 truncate">{s.name}</span>
                    </button>

                    {hasChildren(s.id) && (
                      <button
                        type="button"
                        onClick={() => setPath([...path, s])}
                        className="shrink-0 rounded-lg px-3 py-2 text-sm text-black/50 transition-colors hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
                        title="Intră în această rubrică"
                      >
                        ›
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
