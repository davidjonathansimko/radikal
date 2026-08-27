'use client';

/**
 * Pasul A16 — sectiunea „News" din admin.
 *
 * Aici adaugi tot ce e nou: noutati despre RADIKAL, invitatii, anunturi,
 * reclame, poze. Fiecare stire are titlu si text in cele 4 limbi.
 *
 * Datele stau in tabelul `news_items` (vezi `STEP_A16_NEWS.sql`).
 * Daca tabelul NU a fost inca creat, componenta nu se strica: arata
 * un mesaj clar ca trebuie rulat SQL-ul.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import ImageUpload from '@/components/ImageUpload';

type Lang = 'ro' | 'de' | 'en' | 'ru';
const LANGS: { id: Lang; label: string }[] = [
  { id: 'ro', label: 'Română' },
  { id: 'de', label: 'Deutsch' },
  { id: 'en', label: 'English' },
  { id: 'ru', label: 'Русский' },
];

const KINDS = [
  { id: 'news', label: 'Noutate' },
  { id: 'invitation', label: 'Invitație' },
  { id: 'announcement', label: 'Anunț' },
  { id: 'ad', label: 'Reclamă' },
] as const;

export interface NewsItem {
  id: string;
  created_at?: string;
  title_ro: string; title_de: string; title_en: string; title_ru: string;
  body_ro: string; body_de: string; body_en: string; body_ru: string;
  image_url: string | null;
  link_url: string | null;
  kind: string;
  published: boolean;
  sort_order: number;
}

const EMPTY: Omit<NewsItem, 'id'> = {
  title_ro: '', title_de: '', title_en: '', title_ru: '',
  body_ro: '', body_de: '', body_en: '', body_ru: '',
  image_url: null,
  link_url: '',
  kind: 'news',
  published: false,
  sort_order: 0,
};

export default function NewsAdmin() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  /** Tabelul lipseste? Atunci aratam instructiunea, nu o eroare urata. */
  const [tableMissing, setTableMissing] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<NewsItem, 'id'>>({ ...EMPTY });
  const [lang, setLang] = useState<Lang>('ro');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  /**
   * Pasul 2308006-F — comutatorul general „News in meniu".
   * Daca e OFF, rubrica News nu apare deloc in meniu, oricate stiri publicate ar fi.
   * Valoarea sta in tabelul `site_settings`, cheia `news_menu`.
   * `null` = tabelul nu exista inca (nu s-a rulat SQL-ul) → ascundem comutatorul.
   */
  const [menuEnabled, setMenuEnabled] = useState<boolean | null>(null);
  const [menuSaving, setMenuSaving] = useState(false);

  const loadMenuSetting = useCallback(async () => {
    const { data, error } = await getSupabaseClient()
      .from('site_settings')
      .select('value')
      .eq('key', 'news_menu')
      .maybeSingle();

    if (error) { setMenuEnabled(null); return; }
    const value = (data?.value ?? {}) as { enabled?: boolean };
    setMenuEnabled(Boolean(value.enabled));
  }, []);

  const toggleMenu = async () => {
    const next = !menuEnabled;
    setMenuSaving(true);
    const { error } = await getSupabaseClient()
      .from('site_settings')
      .upsert({ key: 'news_menu', value: { enabled: next } }, { onConflict: 'key' });
    setMenuSaving(false);
    if (error) { setMessage(`Eroare la comutator: ${error.message}`); return; }
    setMenuEnabled(next);
    setMessage(next ? 'Rubrica News poate apărea în meniu.' : 'Rubrica News este ascunsă complet.');
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getSupabaseClient()
      .from('news_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      // 42P01 = „relation does not exist" → tabelul nu a fost creat inca
      if (error.code === '42P01') setTableMissing(true);
      setItems([]);
    } else {
      setItems((data ?? []) as NewsItem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); void loadMenuSetting(); }, [load, loadMenuSetting]);

  const reset = () => { setEditingId(null); setForm({ ...EMPTY }); setLang('ro'); };

  const save = async () => {
    // Cerem cel putin un titlu, ca sa nu ramana stiri goale in lista
    const hasTitle = LANGS.some((l) => form[`title_${l.id}` as keyof typeof form]);
    if (!hasTitle) { setMessage('Adaugă cel puțin un titlu.'); return; }

    setSaving(true);
    const sb = getSupabaseClient();
    const payload = { ...form, link_url: form.link_url || null };

    const { error } = editingId
      ? await sb.from('news_items').update(payload).eq('id', editingId)
      : await sb.from('news_items').insert(payload);

    setSaving(false);
    if (error) { setMessage(`Eroare: ${error.message}`); return; }
    setMessage(editingId ? 'Salvat.' : 'Adăugat.');
    reset();
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm('Ștergi definitiv această știre?')) return;
    await getSupabaseClient().from('news_items').delete().eq('id', id);
    void load();
  };

  const togglePublished = async (item: NewsItem) => {
    await getSupabaseClient()
      .from('news_items')
      .update({ published: !item.published })
      .eq('id', item.id);
    void load();
  };

  const edit = (item: NewsItem) => {
    const { id: _id, created_at: _c, ...rest } = item;
    void _id; void _c;
    setEditingId(item.id);
    setForm({ ...EMPTY, ...rest });
  };

  if (tableMissing) {
    return (
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-sm text-white/90">
        <p className="mb-2 font-semibold">Tabelul „news_items&ldquo; nu există încă.</p>
        <p className="text-white/70">
          Rulează fișierul <code className="rounded bg-black/40 px-1">STEP_A16_NEWS.sql</code> în
          Supabase → SQL Editor, apoi reîncarcă pagina.
        </p>
      </div>
    );
  }

  const titleKey = `title_${lang}` as keyof typeof form;
  const bodyKey = `body_${lang}` as keyof typeof form;

  return (
    <div className="space-y-6">
      {/* ---------- Pasul 2308006-F: comutator general pentru meniu ---------- */}
      {menuEnabled !== null && (
        <div className="rounded-xl border border-white/15 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Rubrica „News&ldquo; în meniu</p>
              <p className="mt-1 text-xs text-white/60">
                Când e pornită, apare în meniu <em>doar dacă</em> există cel puțin o știre publicată,
                marcată cu <span className="font-bold text-red-400">(!)</span>. Când e oprită, nu apare deloc.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void toggleMenu()}
              disabled={menuSaving}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                menuEnabled
                  ? 'border-white/60 bg-white/20 text-white'
                  : 'border-white/20 text-white/60 hover:bg-white/10'
              }`}
            >
              {menuEnabled ? 'Pornit' : 'Oprit'}
            </button>
          </div>
        </div>
      )}

      {/* ---------- Formular ---------- */}
      <div className="rounded-xl border border-white/15 bg-white/5 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-white">
            {editingId ? 'Editezi o știre' : 'Adaugă o știre nouă'}
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

        {/* Tipul stirii */}
        <div className="mb-4 flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setForm((f) => ({ ...f, kind: k.id }))}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                form.kind === k.id
                  ? 'border-white/60 bg-white/20 text-white'
                  : 'border-white/20 text-white/70 hover:bg-white/10'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>

        {/* Limba pe care o editezi acum */}
        <div className="mb-3 flex flex-wrap gap-2">
          {LANGS.map((l) => {
            const filled = Boolean(form[`title_${l.id}` as keyof typeof form]);
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setLang(l.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  lang === l.id
                    ? 'border-white/60 bg-white/20 text-white'
                    : 'border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                {l.label}
                {/* Punctul verde arata ca limba are deja titlu */}
                {filled && <span className="ml-1.5 text-green-400">●</span>}
              </button>
            );
          })}
        </div>

        <input
          value={String(form[titleKey] ?? '')}
          onChange={(e) => setForm((f) => ({ ...f, [titleKey]: e.target.value }))}
          placeholder={`Titlu (${lang.toUpperCase()})`}
          className="mb-3 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/40"
        />
        <textarea
          value={String(form[bodyKey] ?? '')}
          onChange={(e) => setForm((f) => ({ ...f, [bodyKey]: e.target.value }))}
          placeholder={`Text (${lang.toUpperCase()})`}
          rows={5}
          className="mb-3 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/40"
        />
        <input
          value={form.link_url ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
          placeholder="Link (opțional) — ex. o invitație sau un eveniment"
          className="mb-4 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/40"
        />

        <div className="mb-4">
          <ImageUpload
            currentImageUrl={form.image_url ?? ''}
            onImageUploaded={(url: string) => setForm((f) => ({ ...f, image_url: url || null }))}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="h-4 w-4 accent-white"
            />
            Publicată
          </label>

          <label className="flex items-center gap-2 text-sm text-white/80">
            Ordine
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
              className="w-20 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm text-white"
            />
          </label>

          <button
            onClick={save}
            disabled={saving}
            className="ml-auto rounded-lg bg-white px-5 py-2 text-sm font-medium text-black transition-opacity disabled:opacity-50"
          >
            {saving ? 'Se salvează…' : editingId ? 'Salvează' : 'Adaugă'}
          </button>
        </div>

        {message && <p className="mt-3 text-xs text-white/70">{message}</p>}
      </div>

      {/* ---------- Lista ---------- */}
      <div className="space-y-3">
        {loading && <p className="text-sm text-white/60">Se încarcă…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-white/60">Încă nu există știri.</p>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-xl border border-white/15 bg-white/5 p-4 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {item.title_ro || item.title_de || item.title_en || item.title_ru}
              </p>
              <p className="mt-0.5 text-xs text-white/50">
                {KINDS.find((k) => k.id === item.kind)?.label ?? item.kind}
                {' · '}
                {item.published ? 'publicată' : 'ciornă'}
                {' · ordine '}{item.sort_order}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => togglePublished(item)}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
              >
                {item.published ? 'Retrage' : 'Publică'}
              </button>
              <button
                onClick={() => edit(item)}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
              >
                Editează
              </button>
              <button
                onClick={() => remove(item.id)}
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
