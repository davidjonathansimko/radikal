'use client';

/**
 * Pasul A17 — administrarea CATEGORIILOR.
 *
 * De aici poti:
 *  - vedea toate categoriile;
 *  - adauga oricand categorii noi, scrise in toate cele 4 limbi;
 *  - redenumi sau sterge o categorie;
 *  - schimba ordinea in care apar in meniul de cautare.
 *
 * „Slug"-ul (cheia scurta) se completeaza singur din numele german, dar il
 * poti schimba. El NU se traduce niciodata si nu ar trebui schimbat dupa ce
 * categoria a fost folosita la bloguri.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { fetchCategories, slugifyCategory, type Category } from '@/lib/categories';

const EMPTY = {
  slug: '',
  name_de: '',
  name_en: '',
  name_ro: '',
  name_ru: '',
  sort_order: 0,
};

export default function CategoriesAdmin() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setCats(await fetchCategories());
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const reset = () => { setEditingId(null); setForm({ ...EMPTY }); };

  const save = async () => {
    if (!form.name_de.trim() && !form.name_ro.trim()) {
      setMessage('Scrie măcar numele în germană sau română.');
      return;
    }

    // Daca nu ai scris tu un slug, il facem din numele german (sau roman)
    const slug = form.slug.trim() || slugifyCategory(form.name_de || form.name_ro);

    setSaving(true);
    const sb = getSupabaseClient();
    const payload = {
      slug,
      name_de: form.name_de || form.name_ro,
      name_en: form.name_en || null,
      name_ro: form.name_ro || null,
      name_ru: form.name_ru || null,
      sort_order: Number(form.sort_order) || 0,
    };

    const { error } = editingId
      ? await sb.from('categories').update(payload).eq('id', editingId)
      : await sb.from('categories').insert(payload);

    setSaving(false);
    if (error) {
      setMessage(
        error.code === '23505'
          ? 'Există deja o categorie cu această cheie (slug).'
          : `Eroare: ${error.message}`,
      );
      return;
    }
    setMessage(editingId ? 'Salvat.' : 'Categorie adăugată.');
    reset();
    void load();
  };

  const edit = (c: Category) => {
    setEditingId(c.id);
    setForm({
      slug: c.slug,
      name_de: c.name_de ?? '',
      name_en: c.name_en ?? '',
      name_ro: c.name_ro ?? '',
      name_ru: c.name_ru ?? '',
      sort_order: c.sort_order ?? 0,
    });
  };

  const remove = async (c: Category) => {
    if (!confirm(`Ștergi categoria „${c.name_ro || c.name_de}"?`)) return;
    await getSupabaseClient().from('categories').delete().eq('id', c.id);
    void load();
  };

  const field = (
    key: keyof typeof EMPTY,
    label: string,
    placeholder = '',
  ) => (
    <label className="block">
      <span className="mb-1 block text-xs text-white/70">{label}</span>
      <input
        value={String(form[key] ?? '')}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/40"
      />
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/15 bg-white/5 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-white">
            {editingId ? 'Editezi o categorie' : 'Adaugă o categorie nouă'}
          </h3>
          {editingId && (
            <button
              onClick={reset}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              Renunță
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {field('name_ro', 'Română', 'ex. Închinare')}
          {field('name_de', 'Deutsch', 'z. B. Anbetung')}
          {field('name_en', 'English', 'e.g. Worship')}
          {field('name_ru', 'Русский', 'напр. Поклонение')}
          {field('slug', 'Cheie internă (slug)', 'se completează singur')}
          <label className="block">
            <span className="mb-1 block text-xs text-white/70">Ordine</span>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-4 rounded-lg bg-white px-5 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {saving ? 'Se salvează…' : editingId ? 'Salvează' : 'Adaugă'}
        </button>

        {message && <p className="mt-3 text-xs text-white/70">{message}</p>}
      </div>

      <div className="space-y-2">
        {loading && <p className="text-sm text-white/60">Se încarcă…</p>}
        {!loading && cats.length === 0 && (
          <p className="text-sm text-white/60">
            Nicio categorie. Rulează <code>STEP_2308000_CATEGORII.sql</code> și{' '}
            <code>STEP_A17_CATEGORII_EXTRA.sql</code>.
          </p>
        )}

        {cats.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-3 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">
                {c.name_ro || c.name_de}
                <span className="ml-2 text-xs text-white/40">{c.slug}</span>
              </p>
              <p className="truncate text-xs text-white/45">
                {[c.name_de, c.name_en, c.name_ru].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => edit(c)}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
              >
                Editează
              </button>
              <button
                onClick={() => remove(c)}
                className="rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/25"
              >
                Șterge
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
