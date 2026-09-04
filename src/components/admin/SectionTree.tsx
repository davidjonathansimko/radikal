'use client';

/**
 * Pasul 0409f — ARBORELE RUBRICILOR.
 *
 * Rubricile stau strânse, una peste alta, ca într-un cuprins. Săgeata din
 * stânga deschide ce e înăuntru. Cu o sută de rubrici vezi tot dintr-o
 * privire, fără să derulezi la nesfârșit.
 */

import React, { useMemo, useState } from 'react';

export interface TreeNode {
  id: string;
  parentId: string | null;
  name: string;
  published: boolean;
  sortOrder: number;
}

interface SectionTreeProps {
  items: TreeNode[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  /** Rubrica aflată în editare, ca să se vadă pe care o schimbi. */
  activeId?: string | null;
  emptyText?: string;
}

export default function SectionTree({
  items,
  onEdit,
  onDelete,
  activeId,
  emptyText = 'Nicio rubrică încă.',
}: SectionTreeProps) {
  const [open, setOpen] = useState<Set<string>>(new Set());

  const byParent = useMemo(() => {
    const map = new Map<string | null, TreeNode[]>();
    items.forEach((n) => {
      const key = n.parentId ?? null;
      map.set(key, [...(map.get(key) ?? []), n]);
    });
    map.forEach((list) => list.sort((a, b) => a.sortOrder - b.sortOrder));
    return map;
  }, [items]);

  const allIds = useMemo(() => items.map((i) => i.id), [items]);
  const parents = useMemo(
    () => new Set(items.filter((i) => i.parentId).map((i) => i.parentId as string)),
    [items],
  );

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (items.length === 0) {
    return <p className="text-sm text-black/50 dark:text-white/50">{emptyText}</p>;
  }

  const renderLevel = (parentId: string | null, depth: number): React.ReactNode => {
    // Oprim la 12 niveluri: o rubrica pusa din greseala in ea insasi ar
    // invarti pagina la nesfarsit.
    if (depth > 12) return null;
    const list = byParent.get(parentId) ?? [];
    if (list.length === 0) return null;

    return list.map((node) => {
      const hasChildren = parents.has(node.id);
      const isOpen = open.has(node.id);

      return (
        <React.Fragment key={node.id}>
          <div
            className={`group flex items-center gap-1 rounded-md py-1 pr-1 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06] ${
              activeId === node.id ? 'bg-black/[0.06] dark:bg-white/[0.09]' : ''
            }`}
            style={{ paddingLeft: `${depth * 14 + 4}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggle(node.id)}
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-xs text-black/45 transition-colors hover:bg-black/10 dark:text-white/45 dark:hover:bg-white/10"
                aria-label={isOpen ? 'Strânge' : 'Desfă'}
                aria-expanded={isOpen}
              >
                {isOpen ? '▾' : '▸'}
              </button>
            ) : (
              <span className="h-5 w-5 flex-shrink-0" />
            )}

            <span className="min-w-0 flex-1 truncate text-sm text-black dark:text-white">
              <span className={node.published ? '' : 'opacity-50'}>{node.name}</span>
              {!node.published && (
                <span className="ml-2 text-[11px] text-black/45 dark:text-white/45">ascunsă</span>
              )}
            </span>

            <span className="flex-shrink-0 pr-1 text-[11px] tabular-nums text-black/30 dark:text-white/30">
              {node.sortOrder}
            </span>

            <button
              type="button"
              onClick={() => onEdit(node.id)}
              title="Editează"
              aria-label={`Editează ${node.name}`}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-black/50 transition-colors hover:bg-black/10 hover:text-black dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => onDelete(node.id)}
              title="Șterge"
              aria-label={`Șterge ${node.name}`}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-black/40 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-white/40 dark:hover:text-red-400"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          </div>

          {hasChildren && isOpen && renderLevel(node.id, depth + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[11px] text-black/40 dark:text-white/40">
        <span>{items.length} rubrici</span>
        <span className="flex gap-3">
          <button
            type="button"
            onClick={() => setOpen(new Set(allIds))}
            className="transition-colors hover:text-black dark:hover:text-white"
          >
            Desfă tot
          </button>
          <button
            type="button"
            onClick={() => setOpen(new Set())}
            className="transition-colors hover:text-black dark:hover:text-white"
          >
            Strânge tot
          </button>
        </span>
      </div>

      <div className="rounded-lg border border-black/10 p-1 dark:border-white/10">
        {renderLevel(null, 0)}
      </div>
    </div>
  );
}
