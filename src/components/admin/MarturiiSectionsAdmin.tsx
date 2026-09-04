'use client';

// =====================================================================
// Pasul 2608005 — RUBRICILE mărturiilor, gestionate din admin
// ---------------------------------------------------------------------
// Creezi, redenumești, ștergi rubrici („Și ei au fost printre noi…").
// Numele se scrie în română; celelalte limbi le poți scrie tu sau le
// lași goale, iar atunci se afișează numele românesc.
// =====================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import SectionTree from './SectionTree';

const LANGS = [
  { code: 'ro', name: 'Română', required: true },
  { code: 'de', name: 'Deutsch', required: false },
  { code: 'en', name: 'English', required: false },
  { code: 'ru', name: 'Русский', required: false },
] as const;

type LangCode = (typeof LANGS)[number]['code'];

interface Section {
  id: string;
  slug: string;
  sort_order: number;
  published: boolean;
  /** Rubrica in care sta aceasta rubrica. Gol = rubrica principala. */
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

export default function MarturiiSectionsAdmin({ onChanged }: { onChanged?: () => void }) {
  const [items, setItems] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [names, setNames] = useState<Record<LangCode, string>>(emptyLangs());
  const [descriptions, setDescriptions] = useState<Record<LangCode, string>>(emptyLangs());
  const [sortOrder, setSortOrder] = useState(0);
  const [published, setPublished] = useState(true);
  const [parentId, setParentId] = useState<string>('');
  const [openLang, setOpenLang] = useState<LangCode>('ro');

  const say = useCallback((kind: 'ok' | 'err', text: string) => {
    setNote({ kind, text });
    setTimeout(() => setNote(null), 6000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb
        .from('testimony_sections')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
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
  }, []);

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
        say('err', 'Numele în română este obligatoriu — din el se face și adresa paginii.');
        return;
      }

      setSaving(true);
      try {
        const sb = createClient();
        const payload: Record<string, unknown> = {
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

        const run = (body: Record<string, unknown>) =>
          editingId
            ? sb.from('testimony_sections').update(body).eq('id', editingId)
            : sb.from('testimony_sections').insert(body);

        let { error } = await run(payload);

        // Daca STEP_2708015_SUBRUBRICI.sql nu a fost inca rulat, coloana lipseste.
        // Salvam fara ea, ca sa nu pierzi munca; rubrica ajunge principala.
        if (error && (error.code === '42703' || error.code === 'PGRST204')) {
          const { parent_id: _omit, ...fara } = payload;
          ({ error } = await run(fara));
          if (!error && parentId) {
            say('err', 'Rubrica a fost salvată, dar ca rubrică principală. Rulează STEP_2708015_SUBRUBRICI.sql în Supabase ca să poți pune rubrici în rubrici.');
          }
        }

        if (error) {
          say(
            'err',
            error.code === '23505'
              ? 'Există deja o rubrică cu acest nume. Alege alt nume.'
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
    [names, descriptions, sortOrder, published, parentId, editingId, load, resetForm, say, onChanged],
  );

  const startEdit = useCallback((s: Section) => {
    setEditingId(s.id);
    setNames(s.names);
    setDescriptions(s.descriptions);
    setSortOrder(s.sort_order);
    setPublished(s.published);
    setParentId(s.parent_id ?? '');
    setOpenLang('ro');
  }, []);

  const remove = useCallback(
    async (s: Section) => {
      if (
        !window.confirm(
          `Ștergi rubrica „${s.names.ro}"?\n\nMărturiile NU se șterg — doar nu mai apar în această rubrică.`,
        )
      ) {
        return;
      }
      const sb = createClient();
      const { error } = await sb.from('testimony_sections').delete().eq('id', s.id);
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

  const inputClass =
    'w-full rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:focus:border-white/40 transition-colors';
  const labelClass =
    'block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1';

  // Rubricile aşezate ca un arbore, mama înaintea copiilor, cu adâncimea lor.
  const ordered = useMemo(() => {
    const byParent = new Map<string | null, Section[]>();
    items.forEach((s) => {
      const key = s.parent_id ?? null;
      byParent.set(key, [...(byParent.get(key) ?? []), s]);
    });
    const out: { section: Section; depth: number }[] = [];
    const walk = (parent: string | null, depth: number) => {
      // Oprim la 12 niveluri: fără asta, o rubrică pusă din greşeală în ea
      // însăşi ar bloca pagina la nesfârşit.
      if (depth > 12) return;
      (byParent.get(parent) ?? []).forEach((s) => {
        out.push({ section: s, depth });
        walk(s.id, depth + 1);
      });
    };
    walk(null, 0);
    return out;
  }, [items]);

  // O rubrică nu poate fi mutată în propriul ei copil.
  const descendantIds = useMemo(() => {
    const found = new Set<string>();
    if (!editingId) return found;
    const add = (parent: string) => {
      items.filter((s) => s.parent_id === parent).forEach((s) => {
        if (found.has(s.id)) return;
        found.add(s.id);
        add(s.id);
      });
    };
    add(editingId);
    return found;
  }, [items, editingId]);

  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <p className="mb-1 text-sm font-semibold text-black dark:text-white">Rubricile mărturiilor</p>
      <p className="mb-4 text-xs text-black/50 dark:text-white/50">
        Rubrica este raftul pe care așezi mărturiile. O mărturie poate sta pe mai multe rafturi.
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
            placeholder={openLang === 'ro' ? 'Și ei au fost printre noi…' : ''}
          />
          {openLang === 'ro' && names.ro.trim() && (
            <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">
              Adresa: <code>/marturii/{slugify(names.ro)}</code>
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>În ce rubrică stă</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className={inputClass}
          >
            <option value="">— Rubrică principală (apare pe pagina Mărturii) —</option>
            {ordered
              .filter((o) => o.section.id !== editingId && !descendantIds.has(o.section.id))
              .map((o) => (
                <option key={o.section.id} value={o.section.id}>
                  {'\u00A0\u00A0'.repeat(o.depth) + (o.depth > 0 ? '└ ' : '') + (o.section.names.ro || o.section.slug)}
                </option>
              ))}
          </select>
          <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">
            Poți pune rubrici în rubrici oricât de adânc. Cititorul intră din una în alta.
          </p>
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
            Vizibilă pe site
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-solid rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? 'Se salvează…' : editingId ? 'Salvează rubrica' : 'Creează rubrică'}
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
          items={items.map((s) => ({
            id: s.id,
            parentId: s.parent_id,
            name: s.names.ro || s.slug,
            published: s.published,
            sortOrder: s.sort_order,
          }))}
          activeId={editingId}
          onEdit={(id) => {
            const s = items.find((x) => x.id === id);
            if (s) startEdit(s);
          }}
          onDelete={(id) => {
            const s = items.find((x) => x.id === id);
            if (s) void remove(s);
          }}
          emptyText="Nicio rubrică încă. Creează prima mai sus."
        />
      )}
    </div>
  );
}
