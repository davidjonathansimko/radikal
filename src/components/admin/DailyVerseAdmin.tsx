'use client';

// Pasul 2708020 — scrii versetul zilei.
// Un verset pe zi. Îl poți schimba oricând, iar cele vechi rămân în listă.

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import ImageUpload from '@/components/ImageUpload';
import ImageEffectsEditor from '@/components/admin/ImageEffectsEditor';
import { DEFAULT_IMAGE_EFFECTS, type ImageEffectSettings } from '@/components/ImageEffectLayers';

const LANGS = [
  { code: 'ro', name: 'Română' },
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
] as const;

type LangCode = (typeof LANGS)[number]['code'];

interface VerseRow {
  id: string;
  for_day: string;
  content_ro: string;
  reference_ro: string | null;
  published: boolean;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const emptyLangs = (): Record<LangCode, string> => ({ ro: '', de: '', en: '', ru: '' });

export default function DailyVerseAdmin() {
  const [items, setItems] = useState<VerseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [forDay, setForDay] = useState(todayISO());
  const [contents, setContents] = useState<Record<LangCode, string>>(emptyLangs());
  const [references, setReferences] = useState<Record<LangCode, string>>(emptyLangs());
  const [openLang, setOpenLang] = useState<LangCode>('ro');
  const [imageUrl, setImageUrl] = useState('');
  const [opacity, setOpacity] = useState(15);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [blur, setBlur] = useState(0);
  const [textColor, setTextColor] = useState<'auto' | 'light' | 'dark'>('auto');
  const [published, setPublished] = useState(true);
  const [effects, setEffects] = useState<ImageEffectSettings>(DEFAULT_IMAGE_EFFECTS);

  const say = useCallback((kind: 'ok' | 'err', text: string) => {
    setNote({ kind, text });
    setTimeout(() => setNote(null), 6000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await createClient()
        .from('daily_verses')
        .select('id, for_day, content_ro, reference_ro, published')
        .order('for_day', { ascending: false })
        .limit(60);
      if (error) {
        if (error.code === '42P01') setTableMissing(true);
        setItems([]);
        return;
      }
      setItems((data || []) as unknown as VerseRow[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Aduce în formular versetul zilei alese, dacă există deja unul. */
  const loadDay = useCallback(async (day: string) => {
    const { data } = await createClient()
      .from('daily_verses')
      .select('*')
      .eq('for_day', day)
      .maybeSingle();

    if (!data) {
      setContents(emptyLangs());
      setReferences(emptyLangs());
      setImageUrl('');
      setOpacity(15);
      setBrightness(100);
      setContrast(100);
      setBlur(0);
      setTextColor('auto');
      setPublished(true);
      setEffects(DEFAULT_IMAGE_EFFECTS);
      return;
    }

    const r = data as unknown as Record<string, unknown>;
    const c = emptyLangs();
    const ref = emptyLangs();
    LANGS.forEach(({ code }) => {
      c[code] = (r[`content_${code}`] as string) || '';
      ref[code] = (r[`reference_${code}`] as string) || '';
    });
    setContents(c);
    setReferences(ref);
    setImageUrl((r.background_image_url as string) || '');
    setOpacity((r.background_opacity as number) ?? 15);
    setBrightness((r.image_brightness as number) ?? 100);
    setContrast((r.image_contrast as number) ?? 100);
    setBlur((r.image_blur as number) ?? 0);
    setTextColor(((r.text_color as string) || 'auto') as 'auto' | 'light' | 'dark');
    setPublished(Boolean(r.published));
    setEffects({
      ...DEFAULT_IMAGE_EFFECTS,
      effectNoise: Boolean(r.effect_noise),
      effectGrain: Boolean(r.effect_grain),
      grainOpacity: (r.grain_opacity as number) ?? DEFAULT_IMAGE_EFFECTS.grainOpacity,
      effectSepia: Boolean(r.effect_sepia),
      sepiaIntensity: (r.sepia_intensity as number) ?? DEFAULT_IMAGE_EFFECTS.sepiaIntensity,
      effectVignette: Boolean(r.effect_vignette),
      vignetteIntensity: (r.vignette_intensity as number) ?? DEFAULT_IMAGE_EFFECTS.vignetteIntensity,
      effectBw: Boolean(r.effect_bw),
      effectBloom: Boolean(r.effect_bloom),
      effectLetterbox: Boolean(r.effect_letterbox),
      effectLightLeak: Boolean(r.effect_light_leak),
    });
  }, []);

  useEffect(() => {
    void loadDay(forDay);
  }, [forDay, loadDay]);

  const save = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!contents.ro.trim()) {
        say('err', 'Versetul în română este obligatoriu.');
        return;
      }

      setSaving(true);
      try {
        const payload: Record<string, unknown> = {
          for_day: forDay,
          background_image_url: imageUrl.trim() || null,
          background_opacity: opacity,
          image_brightness: brightness,
          image_contrast: contrast,
          image_blur: blur,
          text_color: textColor,
          published,
          updated_at: new Date().toISOString(),
          effect_noise: effects.effectNoise,
          effect_grain: effects.effectGrain,
          grain_opacity: effects.grainOpacity,
          effect_sepia: effects.effectSepia,
          sepia_intensity: effects.sepiaIntensity,
          effect_vignette: effects.effectVignette,
          vignette_intensity: effects.vignetteIntensity,
          effect_bw: Boolean(effects.effectBw),
          effect_bloom: Boolean(effects.effectBloom),
          effect_letterbox: Boolean(effects.effectLetterbox),
          effect_light_leak: Boolean(effects.effectLightLeak),
        };
        LANGS.forEach(({ code }) => {
          payload[`content_${code}`] = contents[code].trim() || (code === 'ro' ? contents.ro.trim() : null);
          payload[`reference_${code}`] = references[code].trim() || null;
        });

        const { error } = await createClient()
          .from('daily_verses')
          .upsert(payload, { onConflict: 'for_day' });

        if (error) {
          // Coloanele de reglaj lipsesc daca STEP_2708023 nu a fost rulat.
          if (error.code === '42703' || error.code === 'PGRST204') {
            const { image_brightness: _b, image_contrast: _c, image_blur: _bl, ...fara } = payload;
            const retry = await createClient()
              .from('daily_verses')
              .upsert(fara, { onConflict: 'for_day' });
            if (!retry.error) {
              say('err', 'Salvat, dar reglajele de imagine nu au fost păstrate. Rulează STEP_2708023_VERSET_IMAGINE.sql în Supabase.');
              await load();
              return;
            }
          }
          say('err', `Nu am putut salva: ${error.message}`);
          return;
        }
        say('ok', 'Versetul zilei a fost salvat.');
        await load();
      } finally {
        setSaving(false);
      }
    },
    [forDay, contents, references, imageUrl, opacity, brightness, contrast, blur, textColor, published, effects, load, say],
  );

  const remove = useCallback(
    async (v: VerseRow) => {
      if (!window.confirm(`Ștergi versetul din ${v.for_day}?`)) return;
      const { error } = await createClient().from('daily_verses').delete().eq('id', v.id);
      if (error) {
        say('err', `Nu am putut șterge: ${error.message}`);
        return;
      }
      say('ok', 'Verset șters.');
      await load();
    },
    [load, say],
  );

  const inputClass =
    'w-full rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:focus:border-white/40 transition-colors';
  const labelClass =
    'block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1';

  if (tableMissing) {
    return (
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-sm text-black dark:text-white">
        <p className="mb-2 font-semibold">Tabelul versetelor nu există încă.</p>
        <p className="text-black/70 dark:text-white/70">
          Rulează <code className="rounded bg-black/10 px-1 dark:bg-black/40">STEP_2708020_VERSET_ZILNIC.sql</code> în
          Supabase → SQL Editor, apoi reîncarcă pagina.
        </p>
      </div>
    );
  }

  return (
    <div>
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

      <form onSubmit={save} className="mb-10 grid gap-4">
        <div>
          <label className={labelClass}>Pentru ziua</label>
          <input
            type="date"
            value={forDay}
            onChange={(e) => setForDay(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">
            Un verset pe zi. Dacă ziua are deja unul, îl vezi mai jos și îl poți schimba.
            Dacă pentru ziua de azi nu există niciunul, cititorul vede „Se actualizează&ldquo;.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {LANGS.map((l) => (
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
              {contents[l.code].trim() ? ' •' : ''}
            </button>
          ))}
        </div>

        <div>
          <label className={labelClass}>
            Versetul{openLang === 'ro' ? '' : ' (gol = se traduce automat din română)'}
          </label>
          <textarea
            value={contents[openLang]}
            onChange={(e) => setContents((c) => ({ ...c, [openLang]: e.target.value }))}
            rows={5}
            className={`${inputClass} leading-relaxed`}
            placeholder={openLang === 'ro' ? 'Fiindcă atât de mult a iubit Dumnezeu lumea…' : ''}
          />
        </div>

        <div>
          <label className={labelClass}>Referința (Ioan 3:16)</label>
          <input
            type="text"
            value={references[openLang]}
            onChange={(e) => setReferences((r) => ({ ...r, [openLang]: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <p className={labelClass}>Imaginea din fundal (opțional)</p>
          <ImageUpload currentImageUrl={imageUrl} onImageUploaded={setImageUrl} />

          {imageUrl && (
            <>
              <div className="mt-4">
                <label className={labelClass}>Cât de tare se vede imaginea: {opacity}%</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Lumina: {brightness}%</label>
                  <input
                    type="range"
                    min={20}
                    max={180}
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">
                    Sub 100 = mai întunecată. Peste 100 = mai deschisă.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Contrast: {contrast}%</label>
                  <input
                    type="range"
                    min={20}
                    max={200}
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">
                    Mai puțin = blândă. Mai mult = dură.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Cât de moale: {blur}px</label>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={blur}
                    onChange={(e) => setBlur(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">
                    Peste 0, imaginea se estompează și nu mai fură ochiul.
                  </p>
                </div>
              </div>

              {/* Cum va arăta */}
              <div className="mt-4">
                <p className={labelClass}>Cum va arăta</p>
                <div className="relative aspect-[9/16] w-40 overflow-hidden rounded-xl bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Previzualizare"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{
                      opacity: opacity / 100,
                      filter: `brightness(${brightness}%) contrast(${contrast}%) blur(${blur}px)`,
                    }}
                  />
                </div>
              </div>
              <div className="mt-4">
                <ImageEffectsEditor
                  title="Efecte pentru imagine"
                  hint="Aceleași efecte ca la reels."
                  imageUrl={imageUrl}
                  value={effects}
                  onChange={setEffects}
                  previewAspect="9/16"
                />
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <p className={labelClass}>Culoarea textului</p>
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'auto', label: 'Urmează fundalul' },
              { id: 'light', label: 'Mereu alb' },
              { id: 'dark', label: 'Mereu negru' },
            ] as const).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setTextColor(o.id)}
                className={`btn-solid rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  textColor === o.id
                    ? 'border-transparent bg-black text-white dark:bg-white dark:text-black'
                    : 'border-black/15 text-black/70 hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-black dark:text-white">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 accent-black dark:accent-white"
          />
          Publicat
        </label>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="btn-solid rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? 'Se salvează…' : 'Salvează versetul zilei'}
          </button>
        </div>
      </form>

      <h3 className="mb-3 text-lg font-bold text-black dark:text-white">
        Ultimele versete ({items.length})
      </h3>

      {loading ? (
        <p className="text-sm text-black/50 dark:text-white/50">Se încarcă…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">Niciun verset scris încă.</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2 dark:border-white/10"
            >
              <span className="min-w-0">
                <span className="mr-2 font-mono text-xs text-black/50 dark:text-white/50">{v.for_day}</span>
                <span className="text-sm text-black dark:text-white">
                  {v.content_ro.slice(0, 70)}
                  {v.content_ro.length > 70 ? '…' : ''}
                </span>
                {!v.published && (
                  <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-[11px] text-black/60 dark:bg-white/10 dark:text-white/60">
                    ciornă
                  </span>
                )}
              </span>
              <span className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setForDay(v.for_day)}
                  className="rounded-lg border border-black/15 px-3 py-1 text-xs text-black/70 transition-colors hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
                >
                  Editează
                </button>
                <button
                  type="button"
                  onClick={() => void remove(v)}
                  className="rounded-lg px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
                >
                  Șterge
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
