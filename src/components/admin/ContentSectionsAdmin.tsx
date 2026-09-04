'use client';

// =====================================================================
// Pasul 2708018 — rubricile pentru „Tägliche Andacht" și „Pentru copii".
// ---------------------------------------------------------------------
// Merge exact ca panoul mărturiilor: rubrici în rubrici, pe oricâte
// niveluri. Diferența e o singură coloană, `kind`, care spune de care
// pagină ține fiecare rubrică — așa le vezi separate și în Supabase.
// =====================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SectionTree from './SectionTree';
import { createClient } from '@/lib/supabase';
import { CONTENT_SECTIONS_TABLE, type ContentKind } from '@/lib/contentKinds';

const LANGS = [
  { code: 'ro', name: 'Română' },
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
] as const;

type LangCode = (typeof LANGS)[number]['code'];

export interface ContentSection {
  id: string;
  slug: string;
  sort_order: number;
  published: boolean;
  parent_id: string | null;
  names: Record<LangCode, string>;
  descriptions: Record<LangCode, string>;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .replace(/[ăâ]/g, 'a')
    .replace(/î/g, 'i')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const emptyLangs = (): Record<LangCode, string> => ({ ro: '', de: '', en: '', ru: '' });

export default function ContentSectionsAdmin({
  kind,
  onChanged,
}: {
  kind: ContentKind;
  onChanged?: () => void;
}) {
  const [items, setItems] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [names, setNames] = useState<Record<LangCode, string>>(emptyLangs());
  const [descriptions, setDescriptions] = useState<Record<LangCode, string>>(emptyLangs());
  const [sortOrder, setSortOrder] = useState(0);
  const [published, setPublished] = useState(true);
  const [parentId, setParentId] = useState<string>('');
  const [openLang, setOpenLang] = useState<LangCode>('ro');

  const say = useCallback((k: 'ok' | 'err', text: string) => {
    setNote({ kind: k, text });
    setTimeout(() => setNote(null), 6000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await createClient()
        .from(CONTENT_SECTIONS_TABLE)
        .select('*')
        .eq('kind', kind)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === '42P01') setTableMissing(true);
        setItems([]);
        return;
      }

      setItems(
        ((data || []) as unknown as Record<string, unknown>[]).map((r) => ({
          id: r.id as string,
          slug: r.slug as string,
          sort_order: (r.sort_order as number) ?? 0,
          published: Boolean(r.published),
          parent_id: (r.parent_id as string) ?? null,
          names: {
            ro: (r.name_ro as string) || '',
            de: (r.name_de as string) || '',
            en: (r.name_en as string) || '',
            ru: (r.name_ru as string) || '',
          },
          descriptions: {
            ro: (r.description_ro as string) || '',
            de: (r.description_de as string) || '',
            en: (r.description_en as string) || '',
            ru: (r.description_ru as string) || '',
          },
        })),
      );
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setNames(emptyLangs());
    setDescriptions(emptyLangs());
    setSortOrder(0);
    setPublished(true);
    setParentId('');
    setOpenLang('ro');
  }, []);

  const save = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!names.ro.trim()) {
        say('err', 'Numele în română este obligatoriu — din el se face adresa paginii.');
        return;
      }

      setSaving(true);
      try {
        const sb = createClient();
        const payload: Record<string, unknown> = {
          kind,
          slug: slugify(names.ro),
          sort_order: sortOrder,
          published,
          parent_id: parentId || null,
          updated_at: new Date().toISOString(),
        };
        LANGS.forEach(({ code }) => {
          payload[`name_${code}`] = names[code].trim() || (code === 'ro' ? names.ro.trim() : null);
          payload[`description_${code}`] = descriptions[code].trim() || null;
        });

        const { error } = editingId
          ? await sb.from(CONTENT_SECTIONS_TABLE).update(payload).eq('id', editingId)
          : await sb.from(CONTENT_SECTIONS_TABLE).insert(payload);

        if (error) {
          say(
            'err',
            error.code === '23505'
              ? 'Există deja o rubrică cu acest nume în același loc. Alege alt nume.'
              : `Nu am putut salva: ${error.message}`,
          );
          return;
        }

        say('ok', editingId ? 'Rubrică actualizată.' : 'Rubrică creată.');
        resetForm();
        await load();
        onChanged?.();
      } finally {
        setSaving(false);
      }
    },
    [kind, names, descriptions, sortOrder, published, parentId, editingId, load, resetForm, say, onChanged],
  );

  const startEdit = useCallback((s: ContentSection) => {
    setEditingId(s.id);
    setNames(s.names);
    setDescriptions(s.descriptions);
    setSortOrder(s.sort_order);
    setPublished(s.published);
    setParentId(s.parent_id ?? '');
    setOpenLang('ro');
  }, []);

  const remove = useCallback(
    async (s: ContentSection) => {
      if (
        !window.confirm(
          `Ștergi rubrica „${s.names.ro}"?\n\nSe șterg și rubricile din ea. Articolele NU se șterg.`,
        )
      ) {
        return;
      }
      const { error } = await createClient().from(CONTENT_SECTIONS_TABLE).delete().eq('id', s.id);
      if (error) {
        say('err', `Nu am putut șterge: ${error.message}`);
        return;
      }
      say('ok', 'Rubrică ștearsă.');
      if (editingId === s.id) resetForm();
      await load();
      onChanged?.();
    },
    [editingId, load, resetForm, say, onChanged],
  );

  // Arborele rubricilor: mama înaintea copiilor, cu adâncimea fiecăreia.
  const ordered = useMemo(() => {
    const byParent = new Map<string | null, ContentSection[]>();
    items.forEach((s) => {
      const key = s.parent_id ?? null;
      byParent.set(key, [...(byParent.get(key) ?? []), s]);
    });
    const out: { section: ContentSection; depth: number }[] = [];
    const walk = (parent: string | null, depth: number) => {
      if (depth > 12) return;
      (byParent.get(parent) ?? []).forEach((s) => {
        out.push({ section: s, depth });
        walk(s.id, depth + 1);
      });
    };
    walk(null, 0);
    return out;
  }, [items]);

  const descendantIds = useMemo(() => {
    const found = new Set<string>();
    if (!editingId) return found;
    const add = (parent: string) => {
      items
        .filter((s) => s.parent_id === parent)
        .forEach((s) => {
          if (found.has(s.id)) return;
          found.add(s.id);
          add(s.id);
        });
    };
    add(editingId);
    return found;
  }, [items, editingId]);

  const inputClass =
    'w-full rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:focus:border-white/40 transition-colors';
  const labelClass =
    'block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1';

  if (tableMissing) {
    return (
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-sm text-black dark:text-white">
        <p className="mb-2 font-semibold">Tabelele acestei pagini nu există încă.</p>
        <p className="text-black/70 dark:text-white/70">
          Rulează <code className="rounded bg-black/10 px-1 dark:bg-black/40">STEP_2708018_ANDACHT_COPII.sql</code> în
          Supabase → SQL Editor, apoi reîncarcă pagina.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <p className="mb-1 text-sm font-semibold text-black dark:text-white">Rubricile paginii</p>
      <p className="mb-4 text-xs text-black/50 dark:text-white/50">
        O rubrică poate sta în altă rubrică, oricât de adânc.
      </p>

      {note && (
        <p
          className={`mb-3 rounded-lg px-3 py-2 text-sm ${
            note.kind === 'ok'
              ? 'border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300'
              : 'border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300'
          }`}
        >
          {note.text}
        </p>
      )}

      <form onSubmit={save} className="mb-5 grid gap-3">
        <div className="flex flex-wrap gap-2">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setOpenLang(l.code)}
              className={`btn-solid rounded-full border px-3 py-1 text-xs transition-colors ${
                openLang === l.code
                  ? 'border-transparent bg-black text-white dark:bg-white dark:text-black'
                  : 'border-black/15 text-black/70 hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10'
              }`}
            >
              {l.name}
              {names[l.code].trim() ? ' •' : ''}
            </button>
          ))}
        </div>

        <div>
          <label className={labelClass}>
            Numele rubricii{openLang === 'ro' ? '' : ' (gol = se folosește cel românesc)'}
          </label>
          <input
            type="text"
            value={names[openLang]}
            onChange={(e) => setNames((n) => ({ ...n, [openLang]: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>În ce rubrică stă</label>
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={inputClass}>
            <option value="">— Rubrică principală —</option>
            {ordered
              .filter((o) => o.section.id !== editingId && !descendantIds.has(o.section.id))
              .map((o) => (
                <option key={o.section.id} value={o.section.id}>
                  {'\u00A0\u00A0'.repeat(o.depth) + (o.depth > 0 ? '└ ' : '') + (o.section.names.ro || o.section.slug)}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Un rând de explicație (opțional)</label>
          <textarea
            value={descriptions[openLang]}
            onChange={(e) => setDescriptions((d) => ({ ...d, [openLang]: e.target.value }))}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-black dark:text-white">
            <span className="text-xs text-black/60 dark:text-white/60">Ordine</span>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-20 rounded-lg border border-black/15 bg-white px-2 py-1 text-sm text-black dark:border-white/15 dark:bg-black dark:text-white"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-black dark:text-white">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 accent-black dark:accent-white"
            />
            Vizibilă
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-solid rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? 'Se salvează…' : editingId ? 'Salvează rubrica' : 'Creează rubrica'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-black/15 px-4 py-2 text-sm text-black/70 transition-colors hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
            >
              Renunță
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-black/50 dark:text-white/50">Se încarcă…</p>
      ) : (
        <SectionTree
          items={ordered.map(({ section: s }) => ({
            id: s.id,
            parentId: s.parent_id,
            name: s.names.ro || s.slug,
            published: s.published,
            sortOrder: s.sort_order,
          }))}
          activeId={editingId}
          onEdit={(id) => {
            const found = ordered.find((o) => o.section.id === id);
            if (found) startEdit(found.section);
          }}
          onDelete={(id) => {
            const found = ordered.find((o) => o.section.id === id);
            if (found) void remove(found.section);
          }}
          emptyText="Nicio rubrică încă. Creează prima mai sus."
        />
      )}
    </div>
  );
}
