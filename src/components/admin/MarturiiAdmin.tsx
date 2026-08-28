'use client';

// =====================================================================
// Pasul 2608004 — MĂRTURII în admin (pasul 2 din 4)
// ---------------------------------------------------------------------
// Același formular ca la bloguri, dar salvează în tabelul `testimonies`.
//
// Ce poți face aici:
//   • scrii o mărturie nouă, o editezi, o ștergi
//   • alegi rubricile în care intră (poate fi în mai multe)
//   • încarci imaginea și îi alegi efectele, cu previzualizare
//   • scrii TU traducerile, în fiecare limbă (așa nu mai plătești DeepL);
//     dacă lași gol, traduce DeepL, ca la bloguri
//   • pornești „Ascultă mărturia" (varianta dinamică)
// =====================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase';
import ImageEffectsEditor from '@/components/admin/ImageEffectsEditor';
import ImageUpload from '@/components/ImageUpload';
import AdminListFilterBar from '@/components/admin/AdminListFilterBar';
import BlogAudioGenerator from '@/components/admin/BlogAudioGenerator';
import CustomAudioManager from '@/components/admin/CustomAudioManager';
import MarturiiSectionsAdmin from '@/components/admin/MarturiiSectionsAdmin';
import SectionTreePicker from '@/components/admin/SectionTreePicker';
import { useAdminListFilter } from '@/components/admin/useAdminListFilter';
import {
  DEFAULT_IMAGE_EFFECTS,
  type ImageEffectSettings,
} from '@/components/ImageEffectLayers';

const LANGS = [
  { code: 'ro', name: 'Română' },
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
] as const;

type LangCode = (typeof LANGS)[number]['code'];

interface Section {
  id: string;
  parent_id: string | null;
  name: string;
}

interface Testimony {
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

/** „Și ei au fost printre noi…" -> „si-ei-au-fost-printre-noi" */
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

export default function MarturiiAdmin() {
  const [sections, setSections] = useState<Section[]>([]);
  const [items, setItems] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // ---- Formular
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [published, setPublished] = useState(false);
  const [isDynamic, setIsDynamic] = useState(false);
  const [sectionIds, setSectionIds] = useState<string[]>([]);
  const [effects, setEffects] = useState<ImageEffectSettings>(DEFAULT_IMAGE_EFFECTS);

  // Limbile in care ai incarcat vocea ta — in ele nu se mai genereaza TTS.
  const [customAudioLangs, setCustomAudioLangs] = useState<string[]>([]);

  // Traducerile scrise de mână, pe limbi. Gol = traduce DeepL.
  const [manual, setManual] = useState<Record<LangCode, { title: string; excerpt: string; content: string }>>({
    ro: { title: '', excerpt: '', content: '' },
    de: { title: '', excerpt: '', content: '' },
    en: { title: '', excerpt: '', content: '' },
    ru: { title: '', excerpt: '', content: '' },
  });
  const [openLang, setOpenLang] = useState<LangCode>('de');

  const editingItem = useMemo(
    () => (editingId ? items.find((i) => i.id === editingId) ?? null : null),
    [editingId, items],
  );

  const say = useCallback((kind: 'ok' | 'err', text: string) => {
    setNote({ kind, text });
    setTimeout(() => setNote(null), 6000);
  }, []);

  // ---- Citim rubricile și mărturiile
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();

      const { data: secData } = await sb
        .from('testimony_sections')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      // Pasul 2708023 — rubricile se aleg pas cu pas, nu dintr-o listă lungă.
      setSections(
        ((secData || []) as unknown as Record<string, unknown>[]).map((r) => ({
          id: r.id as string,
          parent_id: (r.parent_id as string) ?? null,
          name: (r.name_ro as string) || '(fără nume)',
        })),
      );

      const { data, error } = await sb
        .from('testimonies')
        .select('id, title, slug, excerpt, content, image_url, published, created_at, section_ids')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') setTableMissing(true);
        setItems([]);
        return;
      }
      setItems((data || []) as unknown as Testimony[]);
    } finally {
      setLoading(false);
    }
  }, []);

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
    setManual({
      ro: { title: '', excerpt: '', content: '' },
      de: { title: '', excerpt: '', content: '' },
      en: { title: '', excerpt: '', content: '' },
      ru: { title: '', excerpt: '', content: '' },
    });
  }, []);

  // ---- Salvare (creează sau modifică)
  const save = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim() || !content.trim()) {
        say('err', 'Titlul și textul mărturiei sunt obligatorii.');
        return;
      }

      setSaving(true);
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();

        const payload: Record<string, unknown> = {
          title: title.trim(),
          slug: slugify(title),
          excerpt: excerpt.trim() || null,
          content: content.trim(),
          image_url: imageUrl.trim() || null,
          published,
          is_dynamic: isDynamic,
          section_ids: sectionIds,
          updated_at: new Date().toISOString(),
          // Efectele imaginii — aceleași coloane ca la bloguri
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

        // Traducerile scrise de tine. Gol -> `null`, adică „lasă DeepL".
        LANGS.forEach(({ code }) => {
          payload[`title_${code}`] = manual[code].title.trim() || null;
          payload[`excerpt_${code}`] = manual[code].excerpt.trim() || null;
          payload[`content_${code}`] = manual[code].content.trim() || null;
        });

        if (!editingId && user?.id) payload.author_id = user.id;

        const send = (body: Record<string, unknown>) =>
          editingId
            ? sb.from('testimonies').update(body).eq('id', editingId)
            : sb.from('testimonies').insert(body);

        let { error } = await send(payload);

        // Pasul 2608005 — dacă lipsesc coloanele pentru traduceri, salvăm
        // restul și îți spunem ce fișier să rulezi. Munca ta nu se pierde.
        const missingColumn =
          error && (error.code === 'PGRST204' || error.code === '42703');

        if (missingColumn) {
          const withoutTranslations = { ...payload };
          LANGS.forEach(({ code }) => {
            delete withoutTranslations[`title_${code}`];
            delete withoutTranslations[`excerpt_${code}`];
            delete withoutTranslations[`content_${code}`];
          });
          ({ error } = await send(withoutTranslations));
          if (!error) {
            say(
              'err',
              'Salvat, DAR traducerile scrise de tine nu au fost păstrate. Rulează STEP_2608005_MARTURII_TEXTE.sql în Supabase.',
            );
            resetForm();
            await load();
            return;
          }
        }

        if (error) {
          say('err', `Nu am putut salva: ${error.message}`);
          return;
        }

        say('ok', editingId ? 'Mărturie actualizată.' : 'Mărturie creată.');
        resetForm();
        await load();
      } finally {
        setSaving(false);
      }
    },
    [title, excerpt, content, imageUrl, published, isDynamic, sectionIds, effects, manual, editingId, load, resetForm, say],
  );

  // ---- Editare
  const startEdit = useCallback(async (id: string) => {
    const sb = createClient();
    const { data, error } = await sb.from('testimonies').select('*').eq('id', id).single();
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

    const next = { ...manual };
    LANGS.forEach(({ code }) => {
      next[code] = {
        title: (r[`title_${code}`] as string) || '',
        excerpt: (r[`excerpt_${code}`] as string) || '',
        content: (r[`content_${code}`] as string) || '',
      };
    });
    setManual(next);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    // `manual` intenționat în afara listei: îl rescriem complet aici.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Ștergere
  const remove = useCallback(
    async (id: string, name: string) => {
      if (!window.confirm(`Ștergi definitiv mărturia „${name}"?`)) return;
      const sb = createClient();
      const { error } = await sb.from('testimonies').delete().eq('id', id);
      if (error) {
        say('err', `Nu am putut șterge: ${error.message}`);
        return;
      }
      say('ok', 'Mărturie ștearsă.');
      if (editingId === id) resetForm();
      await load();
    },
    [editingId, load, resetForm, say],
  );

  const filter = useAdminListFilter<Testimony>(
    items,
    useCallback((it: Testimony) => `${it.title} ${it.excerpt ?? ''} ${it.content}`, []),
  );

  // Pasul 2708004 — la editare, formularul se mută sub mărturia apăsată.
  const [editorSlot, setEditorSlot] = useState<HTMLElement | null>(null);
  const editingInList = Boolean(editingId && filter.visible.some((it) => it.id === editingId));
  const renderInSlot = (node: React.ReactNode) => {
    if (!editingInList) return node;
    return editorSlot ? createPortal(node, editorSlot) : null;
  };

  const sectionName = useMemo(
    () => (id: string) => sections.find((s) => s.id === id)?.name ?? '',
    [sections],
  );

  const inputClass =
    'w-full rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:focus:border-white/40 transition-colors';
  const labelClass =
    'block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1';

  if (tableMissing) {
    return (
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-sm text-black dark:text-white">
        <p className="mb-2 font-semibold">Tabelul mărturiilor nu există încă.</p>
        <p className="text-black/70 dark:text-white/70">
          Rulează <code className="rounded bg-black/10 px-1 dark:bg-black/40">STEP_2608003_MARTURII.sql</code> în
          Supabase → SQL Editor, apoi reîncarcă pagina.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Rubricile se gestioneaza aici, ca sa nu fie nevoie sa intri in baza de date. */}
      <div className="mb-6">
        <MarturiiSectionsAdmin onChanged={() => void load()} />
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
              Editezi o mărturie existentă. Apasă „Renunță&ldquo; ca să revii la creare.
            </div>
          )}

      {/* ============================ FORMULAR ============================ */}
      <form onSubmit={save} className="grid gap-4 mb-10">
        <div>
          <label className={labelClass}>Titlul mărturiei</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="Cum m-a găsit Dumnezeu"
          />
          {title.trim() && (
            <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">
              Adresa paginii: <code>/marturii/{slugify(title)}</code>
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
            placeholder="Două-trei rânduri, cât să deschidă pofta de citit."
          />
        </div>

        <div>
          <label className={labelClass}>Textul mărturiei</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className={`${inputClass} leading-relaxed`}
            placeholder="Se scrie în română. Restul limbilor se traduc automat, dacă nu scrii tu mai jos."
          />
        </div>

        {/* ---------------------- RUBRICILE ---------------------- */}
        <SectionTreePicker
          sections={sections}
          value={sectionIds}
          onChange={setSectionIds}
          emptyHint="Nu există încă nicio rubrică. Creează prima mai jos, în „Rubricile mărturiilor”."
        />

        {/* ---------------------- IMAGINEA ---------------------- */}
        <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
          <p className={labelClass}>Imaginea mărturiei</p>
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

        {/* --------------- TRADUCERILE SCRISE DE TINE --------------- */}
        <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
          <p className={labelClass}>Traducerea scrisă de tine (opțional)</p>
          <p className="mb-3 text-xs text-black/50 dark:text-white/50">
            Lași gol = traduce DeepL, ca până acum. Scrii ceva = se folosește exact textul tău,
            iar DeepL nici măcar nu mai este chemat. Așa nu plătești pentru limbile pe care le
            scrii singur.
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
              placeholder="Titlu — gol = automat"
            />
            <textarea
              value={manual[openLang].excerpt}
              onChange={(e) =>
                setManual((m) => ({ ...m, [openLang]: { ...m[openLang], excerpt: e.target.value } }))
              }
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Rezumat — gol = automat"
            />
            <textarea
              value={manual[openLang].content}
              onChange={(e) =>
                setManual((m) => ({ ...m, [openLang]: { ...m[openLang], content: e.target.value } }))
              }
              rows={8}
              className={`${inputClass} leading-relaxed`}
              placeholder="Textul întreg — gol = automat"
            />
            {(manual[openLang].title || manual[openLang].excerpt || manual[openLang].content) && (
              <button
                type="button"
                onClick={() =>
                  setManual((m) => ({ ...m, [openLang]: { title: '', excerpt: '', content: '' } }))
                }
                className="justify-self-start rounded-lg border border-black/15 px-3 py-1.5 text-xs text-black/70 transition-colors hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
              >
                Golește — lasă DeepL să traducă
              </button>
            )}
          </div>
        </div>

        {/* ---------------------- COMUTATOARE ---------------------- */}
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
            {'Are butonul „Ascultă mărturia"'}
          </label>
        </div>

        {/* ------------------------- AUDIO ------------------------- */}
        {/* Pasul 2708003 — aceleași două panouri ca la bloguri: vocea
            generată (cu descărcare) și înregistrarea ta, pe limbi. */}
        {editingItem ? (
          <div className="rounded-xl bg-neutral-900 p-4 [&_*]:text-white">
            <BlogAudioGenerator
              slug={`m-${editingItem.slug}`}
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
            🎧 Salvează întâi mărturia. După aceea apar aici butonul „Generează audio&ldquo; și
            locul unde îți încarci propria înregistrare — cu descărcare pentru amândouă.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-solid rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? 'Se salvează…' : editingId ? 'Salvează modificările' : 'Creează mărturia'}
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

      {/* ============================ LISTA ============================ */}
      <h3 className="mb-3 text-lg font-bold text-black dark:text-white">
        Toate mărturiile ({items.length})
      </h3>

      <AdminListFilterBar
        placeholder="Caută în mărturii…"
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
        <p className="rounded-xl border border-black/10 p-6 text-center text-sm text-black/50 dark:border-white/10 dark:text-white/50">
          Nicio mărturie încă.
        </p>
      ) : (
        <ul className="grid gap-3">
          {filter.visible.map((it) => (
            <li
              key={it.id}
              className="rounded-xl border border-black/10 p-4 dark:border-white/10"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-black dark:text-white">{it.title}</p>
                  {it.excerpt && (
                    <p className="mt-1 line-clamp-2 text-sm text-black/60 dark:text-white/60">
                      {it.excerpt}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        it.published
                          ? 'bg-green-500/15 text-green-700 dark:text-green-300'
                          : 'bg-black/10 text-black/60 dark:bg-white/10 dark:text-white/60'
                      }`}
                    >
                      {it.published ? 'Publicat' : 'Ciornă'}
                    </span>
                    {(it.section_ids ?? []).map((sid) => (
                      <span
                        key={sid}
                        className="rounded-full bg-black/5 px-2 py-0.5 text-black/60 dark:bg-white/10 dark:text-white/60"
                      >
                        {sectionName(sid)}
                      </span>
                    ))}
                  </div>
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

              {/* Aici se deschide sertarul de editare pentru această mărturie */}
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
