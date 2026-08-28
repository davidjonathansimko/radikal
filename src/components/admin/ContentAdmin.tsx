'use client';

// =====================================================================
// Pasul 2708018 — creare articole pentru „Tägliche Andacht" și „Pentru copii".
// ---------------------------------------------------------------------
// Același formular ca la mărturii. Ce se schimbă este doar tabelul și
// coloana `kind`, care spune de care pagină ține articolul.
// =====================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase';
import ImageEffectsEditor from '@/components/admin/ImageEffectsEditor';
import ImageUpload from '@/components/ImageUpload';
import AdminListFilterBar from '@/components/admin/AdminListFilterBar';
import BlogAudioGenerator from '@/components/admin/BlogAudioGenerator';
import CustomAudioManager from '@/components/admin/CustomAudioManager';
import ContentSectionsAdmin from '@/components/admin/ContentSectionsAdmin';
import { useAdminListFilter } from '@/components/admin/useAdminListFilter';
import { DEFAULT_IMAGE_EFFECTS, type ImageEffectSettings } from '@/components/ImageEffectLayers';
import { CONTENT_ITEMS_TABLE, CONTENT_SECTIONS_TABLE, CONTENT_KINDS, type ContentKind } from '@/lib/contentKinds';

const LANGS = [
  { code: 'ro', name: 'Română' },
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
] as const;

type LangCode = (typeof LANGS)[number]['code'];

interface SectionOption {
  id: string;
  name: string;
}

interface Item {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  published: boolean;
  created_at: string | null;
  section_ids: string[] | null;
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

const emptyManual = () => ({
  ro: { title: '', excerpt: '', content: '' },
  de: { title: '', excerpt: '', content: '' },
  en: { title: '', excerpt: '', content: '' },
  ru: { title: '', excerpt: '', content: '' },
});

export default function ContentAdmin({ kind }: { kind: ContentKind }) {
  const def = CONTENT_KINDS[kind];

  const [sections, setSections] = useState<SectionOption[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [published, setPublished] = useState(false);
  const [isDynamic, setIsDynamic] = useState(false);
  const [sectionIds, setSectionIds] = useState<string[]>([]);
  const [effects, setEffects] = useState<ImageEffectSettings>(DEFAULT_IMAGE_EFFECTS);
  const [customAudioLangs, setCustomAudioLangs] = useState<string[]>([]);
  const [manual, setManual] = useState(emptyManual());
  const [openLang, setOpenLang] = useState<LangCode>('de');

  const say = useCallback((k: 'ok' | 'err', text: string) => {
    setNote({ kind: k, text });
    setTimeout(() => setNote(null), 6000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();

      const { data: secData } = await sb
        .from(CONTENT_SECTIONS_TABLE)
        .select('*')
        .eq('kind', kind)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      // Rubricile se arată cu tot drumul lor, ca să știi unde pui articolul.
      const raw = ((secData || []) as unknown as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        parent: (r.parent_id as string) ?? null,
        name: (r.name_ro as string) || '(fără nume)',
      }));
      const byParent = new Map<string | null, typeof raw>();
      raw.forEach((r) => byParent.set(r.parent, [...(byParent.get(r.parent) ?? []), r]));
      const flat: SectionOption[] = [];
      const walk = (parent: string | null, prefix: string, depth: number) => {
        if (depth > 12) return;
        (byParent.get(parent) ?? []).forEach((r) => {
          const path = prefix ? `${prefix} › ${r.name}` : r.name;
          flat.push({ id: r.id, name: path });
          walk(r.id, path, depth + 1);
        });
      };
      walk(null, '', 0);
      setSections(flat);

      const { data, error } = await sb
        .from(CONTENT_ITEMS_TABLE)
        .select('id, title, slug, excerpt, content, image_url, published, created_at, section_ids')
        .eq('kind', kind)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') setTableMissing(true);
        setItems([]);
        return;
      }
      setItems((data || []) as unknown as Item[]);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setTitle('');
    setExcerpt('');
    setContent('');
    setImageUrl('');
    setPublished(false);
    setIsDynamic(false);
    setSectionIds([]);
    setEffects(DEFAULT_IMAGE_EFFECTS);
    setManual(emptyManual());
    setOpenLang('de');
  }, []);

  const save = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim() || !content.trim()) {
        say('err', 'Titlul și textul sunt obligatorii.');
        return;
      }

      setSaving(true);
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();

        const payload: Record<string, unknown> = {
          kind,
          title: title.trim(),
          slug: slugify(title),
          excerpt: excerpt.trim() || null,
          content: content.trim(),
          image_url: imageUrl.trim() || null,
          published,
          is_dynamic: isDynamic,
          section_ids: sectionIds,
          updated_at: new Date().toISOString(),
          effect_noise: effects.effectNoise,
          effect_grain: effects.effectGrain,
          effect_sepia: effects.effectSepia,
          effect_vignette: effects.effectVignette,
          sepia_intensity: effects.sepiaIntensity,
          vignette_intensity: effects.vignetteIntensity,
          grain_opacity: effects.grainOpacity,
          effect_bw: Boolean(effects.effectBw),
          effect_bloom: Boolean(effects.effectBloom),
          effect_letterbox: Boolean(effects.effectLetterbox),
          effect_light_leak: Boolean(effects.effectLightLeak),
        };

        LANGS.forEach(({ code }) => {
          payload[`title_${code}`] = manual[code].title.trim() || null;
          payload[`excerpt_${code}`] = manual[code].excerpt.trim() || null;
          payload[`content_${code}`] = manual[code].content.trim() || null;
        });

        if (!editingId && user?.id) payload.author_id = user.id;

        const { error } = editingId
          ? await sb.from(CONTENT_ITEMS_TABLE).update(payload).eq('id', editingId)
          : await sb.from(CONTENT_ITEMS_TABLE).insert(payload);

        if (error) {
          say(
            'err',
            error.code === '23505'
              ? 'Există deja un articol cu acest titlu în această pagină.'
              : `Nu am putut salva: ${error.message}`,
          );
          return;
        }

        say('ok', editingId ? 'Articol actualizat.' : 'Articol creat.');
        resetForm();
        await load();
      } finally {
        setSaving(false);
      }
    },
    [kind, title, excerpt, content, imageUrl, published, isDynamic, sectionIds, effects, manual, editingId, load, resetForm, say],
  );

  const startEdit = useCallback(async (id: string) => {
    const { data, error } = await createClient()
      .from(CONTENT_ITEMS_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return;

    const r = data as unknown as Record<string, unknown>;
    setEditingId(id);
    setTitle((r.title as string) || '');
    setExcerpt((r.excerpt as string) || '');
    setContent((r.content as string) || '');
    setImageUrl((r.image_url as string) || '');
    setPublished(Boolean(r.published));
    setIsDynamic(Boolean(r.is_dynamic));
    setSectionIds(Array.isArray(r.section_ids) ? (r.section_ids as string[]) : []);
    setEffects({
      ...DEFAULT_IMAGE_EFFECTS,
      effectNoise: Boolean(r.effect_noise),
      effectGrain: Boolean(r.effect_grain),
      effectSepia: Boolean(r.effect_sepia),
      effectVignette: Boolean(r.effect_vignette),
      sepiaIntensity: (r.sepia_intensity as number) ?? DEFAULT_IMAGE_EFFECTS.sepiaIntensity,
      vignetteIntensity: (r.vignette_intensity as number) ?? DEFAULT_IMAGE_EFFECTS.vignetteIntensity,
      grainOpacity: (r.grain_opacity as number) ?? DEFAULT_IMAGE_EFFECTS.grainOpacity,
      effectBw: Boolean(r.effect_bw),
      effectBloom: Boolean(r.effect_bloom),
      effectLetterbox: Boolean(r.effect_letterbox),
      effectLightLeak: Boolean(r.effect_light_leak),
    });

    const next = emptyManual();
    LANGS.forEach(({ code }) => {
      next[code] = {
        title: (r[`title_${code}`] as string) || '',
        excerpt: (r[`excerpt_${code}`] as string) || '',
        content: (r[`content_${code}`] as string) || '',
      };
    });
    setManual(next);
    setOpenLang('de');
  }, []);

  const remove = useCallback(
    async (id: string, name: string) => {
      if (!window.confirm(`Ștergi definitiv „${name}"?`)) return;
      const { error } = await createClient().from(CONTENT_ITEMS_TABLE).delete().eq('id', id);
      if (error) {
        say('err', `Nu am putut șterge: ${error.message}`);
        return;
      }
      say('ok', 'Articol șters.');
      if (editingId === id) resetForm();
      await load();
    },
    [editingId, load, resetForm, say],
  );

  const filter = useAdminListFilter<Item>(
    items,
    useCallback((it: Item) => `${it.title} ${it.excerpt ?? ''} ${it.content}`, []),
  );

  // Formularul se deschide ca sertar sub articolul apăsat.
  const [editorSlot, setEditorSlot] = useState<HTMLElement | null>(null);
  const editingInList = Boolean(editingId && filter.visible.some((i) => i.id === editingId));
  const renderInSlot = (node: React.ReactNode) => {
    if (!editingInList) return node;
    return editorSlot ? createPortal(node, editorSlot) : null;
  };

  const editingItem = useMemo(
    () => (editingId ? items.find((i) => i.id === editingId) ?? null : null),
    [editingId, items],
  );

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
    <div>
      <div className="mb-6">
        <ContentSectionsAdmin kind={kind} onChanged={() => void load()} />
      </div>

      {note && (
        <p
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            note.kind === 'ok'
              ? 'border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300'
              : 'border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300'
          }`}
        >
          {note.text}
        </p>
      )}

      {renderInSlot(
        <>
          {editingId && (
            <div className="mb-4 rounded-lg bg-black/5 px-4 py-2 text-sm text-black/70 dark:bg-white/10 dark:text-white/70">
              Editezi un articol existent. Apasă „Renunță&ldquo; ca să revii la creare.
            </div>
          )}

          <form onSubmit={save} className="mb-10 grid gap-4">
            <div>
              <label className={labelClass}>Titlul</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
              />
              {title.trim() && (
                <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">
                  Adresa paginii: <code>{def.itemPath}/{slugify(title)}</code>
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>Rezumat scurt (apare în listă)</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>Textul</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className={`${inputClass} leading-relaxed`}
                placeholder="Se scrie în română. Restul limbilor se traduc automat, dacă nu scrii tu mai jos."
              />
            </div>

            <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
              <p className={labelClass}>În ce rubrici intră</p>
              {sections.length === 0 ? (
                <p className="text-sm text-black/50 dark:text-white/50">
                  Nu există încă nicio rubrică. Creează prima mai sus.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sections.map((s) => {
                    const on = sectionIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          setSectionIds((prev) =>
                            on ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                          )
                        }
                        className={`btn-solid rounded-full border px-4 py-1.5 text-sm transition-colors ${
                          on
                            ? 'border-transparent bg-black text-white dark:bg-white dark:text-black'
                            : 'border-black/15 text-black/70 hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
              <p className={labelClass}>Imaginea</p>
              <ImageUpload currentImageUrl={imageUrl} onImageUploaded={setImageUrl} />
              {imageUrl && (
                <div className="mt-4">
                  <ImageEffectsEditor
                    title="Efecte pentru imagine"
                    hint="Aceleași efecte ca la articole."
                    imageUrl={imageUrl}
                    value={effects}
                    onChange={setEffects}
                    previewAspect="16/9"
                  />
                </div>
              )}
            </div>

            <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
              <p className={labelClass}>Traducerea scrisă de tine (opțional)</p>
              <p className="mb-3 text-xs text-black/50 dark:text-white/50">
                Lași gol = traduce DeepL. Scrii ceva = se folosește exact textul tău.
              </p>

              <div className="mb-3 flex flex-wrap gap-2">
                {LANGS.map((l) => {
                  const filled =
                    manual[l.code].title.trim() ||
                    manual[l.code].excerpt.trim() ||
                    manual[l.code].content.trim();
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setOpenLang(l.code)}
                      className={`btn-solid rounded-full border px-4 py-1.5 text-sm transition-colors ${
                        openLang === l.code
                          ? 'border-transparent bg-black text-white dark:bg-white dark:text-black'
                          : 'border-black/15 text-black/70 hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10'
                      }`}
                    >
                      {l.name}
                      {filled ? ' •' : ''}
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3">
                <input
                  type="text"
                  value={manual[openLang].title}
                  onChange={(e) =>
                    setManual((m) => ({ ...m, [openLang]: { ...m[openLang], title: e.target.value } }))
                  }
                  className={inputClass}
                  placeholder="Titlul"
                />
                <textarea
                  value={manual[openLang].excerpt}
                  onChange={(e) =>
                    setManual((m) => ({ ...m, [openLang]: { ...m[openLang], excerpt: e.target.value } }))
                  }
                  rows={2}
                  className={`${inputClass} resize-none`}
                  placeholder="Rezumatul"
                />
                <textarea
                  value={manual[openLang].content}
                  onChange={(e) =>
                    setManual((m) => ({ ...m, [openLang]: { ...m[openLang], content: e.target.value } }))
                  }
                  rows={8}
                  className={`${inputClass} leading-relaxed`}
                  placeholder="Textul"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-black dark:text-white">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="h-4 w-4 accent-black dark:accent-white"
                />
                Publicat
              </label>
              <label className="flex items-center gap-2 text-sm text-black dark:text-white">
                <input
                  type="checkbox"
                  checked={isDynamic}
                  onChange={(e) => setIsDynamic(e.target.checked)}
                  className="h-4 w-4 accent-black dark:accent-white"
                />
                {'Are butonul „Ascultă"'}
              </label>
            </div>

            {editingItem ? (
              <div className="rounded-xl bg-neutral-900 p-4 [&_*]:text-white">
                <BlogAudioGenerator
                  slug={`${def.prefix.replace(':', '-')}${editingItem.slug}`}
                  title={title}
                  text={content}
                  language="ro"
                  createdAt={editingItem.created_at}
                  customAudioLangs={customAudioLangs}
                />
                <div className="mt-4">
                  <CustomAudioManager blogId={editingItem.id} onLangsChange={setCustomAudioLangs} />
                </div>
              </div>
            ) : (
              <p className="rounded-lg border border-black/15 bg-black/5 p-3 text-xs text-black/60 dark:border-white/15 dark:bg-white/5 dark:text-white/60">
                🎧 Salvează întâi articolul. După aceea apar aici butoanele pentru audio.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-solid rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {saving ? 'Se salvează…' : editingId ? 'Salvează modificările' : 'Creează articolul'}
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
        </>,
      )}

      <h3 className="mb-3 text-lg font-bold text-black dark:text-white">
        Toate articolele ({items.length})
      </h3>

      <AdminListFilterBar
        placeholder="Caută…"
        search={filter.search}
        setSearch={filter.setSearch}
        year={filter.year}
        setYear={filter.setYear}
        month={filter.month}
        setMonth={filter.setMonth}
        years={filter.years}
        monthNames={filter.monthNames}
        totalCount={items.length}
        filteredCount={filter.filtered.length}
        isFiltering={filter.isFiltering}
        onReset={filter.reset}
      />

      {loading ? (
        <p className="text-sm text-black/50 dark:text-white/50">Se încarcă…</p>
      ) : filter.visible.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">Niciun articol încă.</p>
      ) : (
        <ul className="grid gap-3">
          {filter.visible.map((it) => (
            <li key={it.id} className="rounded-xl border border-black/10 p-4 dark:border-white/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-black dark:text-white">{it.title}</p>
                  {it.excerpt && (
                    <p className="mt-1 line-clamp-2 text-sm text-black/60 dark:text-white/60">
                      {it.excerpt}
                    </p>
                  )}
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] ${
                      it.published
                        ? 'bg-green-500/15 text-green-700 dark:text-green-300'
                        : 'bg-black/10 text-black/60 dark:bg-white/10 dark:text-white/60'
                    }`}
                  >
                    {it.published ? 'Publicat' : 'Ciornă'}
                  </span>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => void startEdit(it.id)}
                    className="rounded-lg border border-black/15 px-3 py-1.5 text-xs text-black/70 transition-colors hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
                  >
                    Editează
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(it.id, it.title)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
                  >
                    Șterge
                  </button>
                </div>
              </div>

              {editingId === it.id && <div ref={setEditorSlot} className="mt-4" />}
            </li>
          ))}
        </ul>
      )}

      {filter.hiddenCount > 0 && !filter.showAll && (
        <button
          type="button"
          onClick={() => filter.setShowAll(true)}
          className="mt-3 rounded-lg border border-black/15 px-4 py-2 text-sm text-black/70 transition-colors hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
        >
          Arată încă {filter.hiddenCount}
        </button>
      )}
    </div>
  );
}
