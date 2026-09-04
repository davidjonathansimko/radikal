// Panou de administrare pentru Reels / Reels admin panel
//
// Permite:
//   - crearea unui reel DE SINE STATATOR (fara blog)  -> are doar buton de like
//   - crearea unui reel LEGAT DE UN ARTICOL de blog   -> are like + sageata
//   - comutator "Publicat" (draft <-> public)
//   - ordonare (sort_order), editare text si stergere
//
// Componenta este complet independenta de formularul de blog existent,
// ca sa nu existe niciun risc pentru functionalitatea actuala.

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase';
import { useFormDraft } from '@/hooks/useFormDraft';
import MediaUpload from './MediaUpload';
import ReelPreview from './ReelPreview';
import AdminListFilterBar from './AdminListFilterBar';
import PostSearchSelect from './PostSearchSelect';
import { useAdminListFilter } from './useAdminListFilter';
// Pasul 2308005 (E) — export video pentru YouTube
import { exportReelVideo, buildReelVideoName, downloadBlob } from '@/lib/reelExport';

interface ReelRow {
  id: string;
  content: string;
  reference: string | null;
  blog_post_id: string | null;
  published: boolean;
  sort_order: number;
  likes_count: number;
  reel_number: number | null;
  created_at: string | null;
  /** Pasul 2308000 — titlu intern, vizibil doar in admin */
  title?: string | null;
}

interface PostOption {
  id: string;
  title: string;
  /** Pasul 2208002 (punctul 6) — articol dinamic („Play Blog") */
  isDynamic?: boolean;
}

export default function ReelsAdmin() {
  const [reels, setReels] = useState<ReelRow[]>([]);
  const [posts, setPosts] = useState<PostOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Formular de creare
  const [content, setContent] = useState('');
  const [reference, setReference] = useState('');
  const [blogPostId, setBlogPostId] = useState<string>('');
  const [published, setPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  // Pasul 21082026 — media si efecte
  // Pasul 2108002: selectorul de limba a fost eliminat — creezi mereu in romana,
  // iar traducerea se face automat prin DeepL.
  const [audioUrl, setAudioUrl] = useState('');
  // Pasul 2208002 (punctul 15): starea `audioVolume` a fost eliminata complet.
  // Volumul este mereu 100% — reglajul se face din butoanele telefonului.
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [backgroundOpacity, setBackgroundOpacity] = useState(15);
  // Pasul 2708001 — culoarea textului si marturia legata
  const [textColor, setTextColor] = useState<'auto' | 'light' | 'dark'>('auto');
  const [testimonyId, setTestimonyId] = useState<string>('');
  const [testimonies, setTestimonies] = useState<{ id: string; title: string }[]>([]);
  // Pasul 2508001 — aceeasi poza, dar pe TEMA LUMINOASA. `null` = ca la intuneric.
  const [backgroundOpacityLight, setBackgroundOpacityLight] = useState<number | null>(null);
  const [effectNoise, setEffectNoise] = useState(false);
  // Pasul 2208001: „grain" este un efect SEPARAT de „noise" (poți alege ambele)
  const [effectGrain, setEffectGrain] = useState(false);
  const [grainOpacity, setGrainOpacity] = useState(25);
  const [effectSepia, setEffectSepia] = useState(false);
  const [effectVignette, setEffectVignette] = useState(false);
  const [sepiaIntensity, setSepiaIntensity] = useState(12);
  const [vignetteIntensity, setVignetteIntensity] = useState(45);
  // Pasul 2308005 (E) — efecte cinematice noi
  const [effectBw, setEffectBw] = useState(false);
  const [effectBloom, setEffectBloom] = useState(false);
  const [effectLetterbox, setEffectLetterbox] = useState(false);
  const [effectLightLeak, setEffectLightLeak] = useState(false);

  // Pasul 2308000 — titlu intern, stilul literelor, rânduri manuale
  const [title, setTitle] = useState('');
  const [uppercaseText, setUppercaseText] = useState(false);
  const [useManualPages, setUseManualPages] = useState(false);
  const [manualPages, setManualPages] = useState<string[]>([]);

  // Pasul 2308005 (E) — starea exportului video (doar unul o data)
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  // Pasul 2308001 — in ce limbă se descarcă videoul
  const [exportLang, setExportLang] = useState<'ro' | 'de' | 'en' | 'ru'>('de');

  // Pasul 2208001 — EDITAREA unui reel existent.
  // `editingId === null` -> formularul creeaza; altfel modifica reel-ul respectiv.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  /** Goleste formularul si iese din modul de editare */
  const resetForm = useCallback(() => {
    setEditingId(null);
    setContent('');
    setReference('');
    setBlogPostId('');
    setPublished(false);
    setSortOrder(0);
    setAudioUrl('');
    setBackgroundImageUrl('');
    setBackgroundOpacity(15);
    setTextColor('auto');
    setTestimonyId('');
    setBackgroundOpacityLight(null);
    setEffectNoise(false);
    setEffectGrain(false);
    setGrainOpacity(25);
    setEffectSepia(false);
    setEffectVignette(false);
    setSepiaIntensity(12);
    setVignetteIntensity(45);
    setEffectBw(false);
    setEffectBloom(false);
    setEffectLetterbox(false);
    setEffectLightLeak(false);
    setTitle('');
    setUppercaseText(false);
    setUseManualPages(false);
    setManualPages([]);
  }, []);

  // Pasul 2108002 — cautare + filtrare an/luna, separat de cel al articolelor
  const filter = useAdminListFilter<ReelRow>(
    reels,
    useCallback((r: ReelRow) => `${r.title ?? ''} ${r.content} ${r.reference ?? ''} #R${r.reel_number ?? ''}`, []),
  );

  // Pasul 0409a — ciorna, ca sa nu pierzi ce ai scris daca telefonul inchide
  // pagina cat esti in galerie. Se tine minte doar cand CREEZI, nu cand modifici.
  const draftValues = useMemo(
    () => ({
      content, reference, blogPostId, published, sortOrder, audioUrl,
      backgroundImageUrl, backgroundOpacity, textColor, testimonyId,
      backgroundOpacityLight, effectNoise, effectGrain, grainOpacity,
      effectSepia, effectVignette, sepiaIntensity, vignetteIntensity,
      effectBw, effectBloom, effectLetterbox, effectLightLeak,
      title, uppercaseText, useManualPages, manualPages,
    }),
    [
      content, reference, blogPostId, published, sortOrder, audioUrl,
      backgroundImageUrl, backgroundOpacity, textColor, testimonyId,
      backgroundOpacityLight, effectNoise, effectGrain, grainOpacity,
      effectSepia, effectVignette, sepiaIntensity, vignetteIntensity,
      effectBw, effectBloom, effectLetterbox, effectLightLeak,
      title, uppercaseText, useManualPages, manualPages,
    ],
  );

  const applyDraft = useCallback((d: typeof draftValues) => {
    setContent(d.content); setReference(d.reference); setBlogPostId(d.blogPostId);
    setPublished(d.published); setSortOrder(d.sortOrder); setAudioUrl(d.audioUrl);
    setBackgroundImageUrl(d.backgroundImageUrl); setBackgroundOpacity(d.backgroundOpacity);
    setTextColor(d.textColor); setTestimonyId(d.testimonyId);
    setBackgroundOpacityLight(d.backgroundOpacityLight);
    setEffectNoise(d.effectNoise); setEffectGrain(d.effectGrain); setGrainOpacity(d.grainOpacity);
    setEffectSepia(d.effectSepia); setEffectVignette(d.effectVignette);
    setSepiaIntensity(d.sepiaIntensity); setVignetteIntensity(d.vignetteIntensity);
    setEffectBw(d.effectBw); setEffectBloom(d.effectBloom);
    setEffectLetterbox(d.effectLetterbox); setEffectLightLeak(d.effectLightLeak);
    setTitle(d.title); setUppercaseText(d.uppercaseText);
    setUseManualPages(d.useManualPages); setManualPages(d.manualPages);
  }, []);

  const draft = useFormDraft('radikalReelDraft', draftValues, applyDraft, editingId === null);

  // Pasul 2708004 — la editare, formularul se mută sub reel-ul apăsat.
  const [editorSlot, setEditorSlot] = useState<HTMLElement | null>(null);
  const editingInList = Boolean(editingId && filter.visible.some((r) => r.id === editingId));
  const renderInSlot = (node: React.ReactNode) => {
    if (!editingInList) return node;
    return editorSlot ? createPortal(node, editorSlot) : null;
  };

  const notify = (type: 'ok' | 'err', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const [reelsRes, postsRes] = await Promise.all([
        supabase
          .from('reels')
          // Pasul 2308000: cerem `*` in loc sa insiram coloanele. Asa, daca
          // fisierul SQL nu a fost inca rulat, lista NU se strica — pur si
          // simplu coloana `title` lipseste si nu se afiseaza nimic.
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase
          .from('blog_posts')
          // Pasul 2208002 (punctul 6): aducem si `is_dynamic`, ca sa poti
          // filtra in cautare intre articole dinamice si statice.
          .select('id, title, is_dynamic')
          .order('created_at', { ascending: false })
          .limit(200),
      ]);

      if (reelsRes.error) {
        notify('err', `Nu am putut încărca reels: ${reelsRes.error.message}`);
        setReels([]);
      } else {
        setReels((reelsRes.data as ReelRow[]) || []);
      }

      if (!postsRes.error) {
        const rows = (postsRes.data as unknown as { id: string; title: string; is_dynamic?: boolean }[]) || [];
        setPosts(rows.map((r) => ({ id: r.id, title: r.title, isDynamic: !!r.is_dynamic })));
      }

      // Pasul 2708001 — marturiile, pentru legatura din reel.
      // Daca tabelul nu exista inca, lista ramane goala si nu se strica nimic.
      const { data: tData } = await supabase
        .from('testimonies')
        .select('id, title')
        .order('created_at', { ascending: false })
        .limit(200);
      setTestimonies((tData as unknown as { id: string; title: string }[]) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Pasul 2308006-A — randurile scrise manual sunt si ele „text".
    // Inainte cereau obligatoriu campul mare de text, desi tu completasesi
    // deja 5 randuri, si primeai degeaba „Textul reel-ului nu poate fi gol.".
    const cleanPages = manualPages.map((p) => p.trim()).filter(Boolean);
    const usePages = useManualPages && cleanPages.length > 0;

    if (!content.trim() && !usePages) {
      notify('err', 'Scrie textul reel-ului sau completează cel puțin un rând.');
      return;
    }

    // Daca ai folosit doar randurile, construim textul din ele — asa avem
    // mereu ceva de tradus si de citit cu voce.
    const finalContent = content.trim() || cleanPages.join('\n\n');

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        content: finalContent,
        reference: reference.trim() || null,
        // Gol = reel de sine statator (doar like)
        blog_post_id: blogPostId || null,
        published,
        sort_order: sortOrder,
        // Pasul 21082026 — media si efecte
        source_language: 'ro',
        audio_url: audioUrl.trim() || null,
        // Pasul 2208002 (punctul 15): volumul nu mai este reglabil — muzica
        // se aude mereu la 100%, iar cititorul foloseste butoanele telefonului.
        // Coloana ramane in baza de date (ca sa nu stricam nimic), dar codul
        // scrie mereu aceeasi valoare.
        audio_volume: 100,
        background_image_url: backgroundImageUrl.trim() || null,
        background_opacity: backgroundOpacity,
        text_color: textColor,
        testimony_id: testimonyId || null,
        background_opacity_light: backgroundOpacityLight,
        effect_noise: effectNoise,
        effect_grain: effectGrain,
        grain_opacity: grainOpacity,
        effect_sepia: effectSepia,
        effect_vignette: effectVignette,
        sepia_intensity: sepiaIntensity,
        vignette_intensity: vignetteIntensity,
        // Pasul 2308005 (E) — efecte cinematice noi
        effect_bw: effectBw,
        effect_bloom: effectBloom,
        effect_letterbox: effectLetterbox,
        effect_light_leak: effectLightLeak,
        // Pasul 2308000 — titlu intern + stilul textului
        title: title.trim() || null,
        uppercase_text: uppercaseText,
        // Daca nu ai bifat „aleg singur randurile", trimitem null si
        // aplicatia imparte textul singura, la capat de frază.
        manual_pages: usePages ? cleanPages : null,
      };

      // Pasul 2208001: acelasi formular si creeaza, si modifica.
      const send = (body: Record<string, unknown>) =>
        editingId
          ? supabase.from('reels').update(body).eq('id', editingId)
          : supabase.from('reels').insert(body);

      let { error } = await send(payload);

      // Pasul 2508001 / 2708001: daca fisierele SQL noi nu au fost rulate,
      // coloanele lipsesc. Salvam atunci fara ele, ca sa nu pierzi munca.
      if (error?.code === '42703' || error?.code === 'PGRST204') {
        const {
          background_opacity_light: _omitLight,
          text_color: _omitColor,
          testimony_id: _omitTestimony,
          ...withoutNew
        } = payload;
        ({ error } = await send(withoutNew));
        if (!error) {
          notify(
            'ok',
            'Salvat. Culoarea textului, mărturia legată și reglajul pentru tema luminoasă au nevoie de STEP_2708001 și STEP_2508001.',
          );
        }
      }

      if (error) {
        notify('err', `Eroare la salvare: ${error.message}`);
      } else {
        notify('ok', editingId ? 'Reel actualizat.' : 'Reel creat cu succes.');
        draft.clear();
        resetForm();
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  /**
   * Pasul 2208001 — incarca TOATE campurile reel-ului in formular.
   * Lista din pagina contine doar cateva coloane, deci cerem randul complet.
   */
  const handleEdit = async (reel: ReelRow) => {
    setLoadingEdit(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('reels')
        .select('*')
        .eq('id', reel.id)
        .single();

      if (error || !data) {
        notify('err', `Nu am putut încărca reel-ul: ${error?.message ?? 'necunoscut'}`);
        return;
      }

      const r = data as Record<string, unknown>;
      setEditingId(reel.id);
      setContent((r.content as string) ?? '');
      setReference((r.reference as string) ?? '');
      setBlogPostId((r.blog_post_id as string) ?? '');
      setPublished(Boolean(r.published));
      setSortOrder((r.sort_order as number) ?? 0);
      setAudioUrl((r.audio_url as string) ?? '');
      setBackgroundImageUrl((r.background_image_url as string) ?? '');
      setBackgroundOpacity((r.background_opacity as number) ?? 15);
      setTextColor(((r.text_color as string) as 'auto' | 'light' | 'dark') || 'auto');
      setTestimonyId((r.testimony_id as string) || '');
      setBackgroundOpacityLight(
        typeof r.background_opacity_light === 'number' ? (r.background_opacity_light as number) : null,
      );
      setEffectNoise(Boolean(r.effect_noise));
      setEffectGrain(Boolean(r.effect_grain));
      setGrainOpacity((r.grain_opacity as number) ?? 25);
      setEffectSepia(Boolean(r.effect_sepia));
      setEffectVignette(Boolean(r.effect_vignette));
      setSepiaIntensity((r.sepia_intensity as number) ?? 12);
      setVignetteIntensity((r.vignette_intensity as number) ?? 45);
      // Pasul 2308005 (E)
      setEffectBw(Boolean(r.effect_bw));
      setEffectBloom(Boolean(r.effect_bloom));
      setEffectLetterbox(Boolean(r.effect_letterbox));
      setEffectLightLeak(Boolean(r.effect_light_leak));
      // Pasul 2308000
      setTitle((r.title as string) ?? '');
      setUppercaseText(Boolean(r.uppercase_text));
      const savedPages = Array.isArray(r.manual_pages) ? (r.manual_pages as string[]) : [];
      setUseManualPages(savedPages.length > 0);
      setManualPages(savedPages);

      // Ducem utilizatorul sus, la formular
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setLoadingEdit(false);
    }
  };

  /**
   * Pasul 2308005 (E) — genereaza si descarca reel-ul ca fisier video.
   * Videoclipul contine DOAR imaginea, efectele, textul si muzica.
   * Butoanele aplicatiei (X, inimioara, sageata, numarul reel-ului)
   * nu apar, pentru ca nu filmam ecranul, ci redesenam totul pe o pânza.
   */
  const handleExportVideo = async (reel: ReelRow) => {    if (exportingId) return; // un singur export o data

    setExportingId(reel.id);
    setExportProgress(0);

    try {
      const supabase = createClient();
      // Lista din pagina are doar cateva coloane -> cerem randul complet.
      const { data, error } = await supabase
        .from('reels')
        .select('*')
        .eq('id', reel.id)
        .single();

      if (error || !data) {
        notify('err', `Nu am putut încărca reel-ul: ${error?.message ?? 'necunoscut'}`);
        return;
      }

      const r = data as Record<string, unknown>;

      // Pasul 2308001 — textul în limba aleasă.
      // Traducerile salvate stau în coloanele `content_de`, `content_en`, etc.
      // Dacă limba aleasă nu are traducere salvată, folosim originalul —
      // mai bine un video corect în română decât niciun video.
      const localized = (r[`content_${exportLang}`] as string) || (r.content as string) || '';
      const localizedRef =
        (r[`reference_${exportLang}`] as string) || (r.reference as string) || null;

      // Titlul intern (pentru numele fișierului) trece prin DeepL, ca fișierul
      // descărcat în germană să se numească nemțește, nu românește.
      let localizedTitle = (r.title as string) ?? '';
      if (localizedTitle && exportLang !== 'ro') {
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: localizedTitle, targetLang: exportLang }),
          });
          const json = await res.json();
          if (json?.translatedText) localizedTitle = json.translatedText as string;
        } catch {
          // Fără traducere, numele rămâne cel original. Nu oprim exportul.
        }
      }

      const blob = await exportReelVideo({
        content: localized,
        reference: localizedRef,
        backgroundImageUrl: (r.background_image_url as string) ?? null,
        audioUrl: (r.audio_url as string) ?? null,
        // Pasul 2308009: rândurile alese manual sunt acum traduse rând cu rând
        // și salvate despărțite prin linie nouă. Le folosim în ORICE limbă,
        // dar doar dacă numărul de rânduri este același ca în original —
        // altfel lăsăm împărțirea automată, ca textul să nu apară rupt.
        manualPages: (() => {
          const manualRo = Array.isArray(r.manual_pages)
            ? (r.manual_pages as string[]).map((p) => (p || '').trim()).filter(Boolean)
            : [];
          if (manualRo.length === 0) return null;
          if (exportLang === 'ro') return manualRo;
          const parts = localized.split('\n').map((p) => p.trim()).filter(Boolean);
          return parts.length === manualRo.length ? parts : null;
        })(),
        uppercase: Boolean(r.uppercase_text),
        onProgress: setExportProgress,
        effects: {
          backgroundOpacity: (r.background_opacity as number) ?? 15,
          effectNoise: Boolean(r.effect_noise),
          effectGrain: Boolean(r.effect_grain),
          grainOpacity: (r.grain_opacity as number) ?? 25,
          effectSepia: Boolean(r.effect_sepia),
          sepiaIntensity: (r.sepia_intensity as number) ?? 12,
          effectVignette: Boolean(r.effect_vignette),
          vignetteIntensity: (r.vignette_intensity as number) ?? 45,
          effectBw: Boolean(r.effect_bw),
          effectBloom: Boolean(r.effect_bloom),
          effectLetterbox: Boolean(r.effect_letterbox),
          effectLightLeak: Boolean(r.effect_light_leak),
        },
      });

      downloadBlob(
        blob,
        buildReelVideoName(
          `R${reel.reel_number ?? 0}`,
          localizedTitle || null,
          (r.created_at as string) ?? null,
          exportLang,
        ),
      );
      notify('ok', `Video generat (${exportLang.toUpperCase()}). Îl poți încărca direct pe YouTube.`);
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Exportul video a eșuat.');
    } finally {
      setExportingId(null);
      setExportProgress(0);
    }
  };

  const togglePublished = async (reel: ReelRow) => {    const supabase = createClient();
    // Actualizare optimista
    setReels((prev) => prev.map((r) => (r.id === reel.id ? { ...r, published: !r.published } : r)));

    const { error } = await supabase
      .from('reels')
      .update({ published: !reel.published })
      .eq('id', reel.id);

    if (error) {
      // Revenim daca a esuat
      setReels((prev) => prev.map((r) => (r.id === reel.id ? { ...r, published: reel.published } : r)));
      notify('err', `Nu am putut schimba starea: ${error.message}`);
    }
  };

  const handleDelete = async (reel: ReelRow) => {
    if (!window.confirm('Sigur ștergi acest reel? Acțiunea nu poate fi anulată.')) return;

    const supabase = createClient();
    const { error } = await supabase.from('reels').delete().eq('id', reel.id);

    if (error) {
      notify('err', `Nu am putut șterge: ${error.message}`);
    } else {
      setReels((prev) => prev.filter((r) => r.id !== reel.id));
      notify('ok', 'Reel șters.');
    }
  };

  const inputClass =
    'w-full rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:focus:border-white/40 transition-colors';

  return (
    <section className="rounded-2xl border border-black/10 dark:border-white/10 p-5 sm:p-6 bg-white dark:bg-black">
      <h2 className="text-xl font-bold text-black dark:text-white mb-1">Reels</h2>
      <p className="text-sm text-black/60 dark:text-white/60 mb-5">
        Reels fără articol au <strong>doar buton de like</strong>. Cele legate de un articol au și săgeata către articol.
      </p>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            message.type === 'ok'
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ---------------- Formular de creare / editare ---------------- */}
      {renderInSlot(
        <>
          {editingId && (
            <div className="mb-4 rounded-lg bg-blue-500/10 px-4 py-2 text-sm text-blue-600 dark:text-blue-400">
              Editezi un reel existent. Apasă „Renunță&ldquo; ca să revii la creare.
            </div>
          )}

          {/* Pasul 0409a — telefonul a inchis pagina cat erai plecat. Nu punem
              nimic inapoi fara sa stii: te intrebam intai. */}
          {!editingId && draft.saved && (draft.saved.content || draft.saved.title) && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              <span className="flex-1 min-w-[12rem]">
                Ai un reel început și nesalvat. Îl aducem înapoi?
              </span>
              <button
                type="button"
                onClick={draft.restore}
                className="rounded-lg bg-amber-500/20 px-3 py-1.5 font-medium transition-colors hover:bg-amber-500/30"
              >
                Continuă
              </button>
              <button
                type="button"
                onClick={draft.dismiss}
                className="rounded-lg px-3 py-1.5 opacity-70 transition-opacity hover:opacity-100"
              >
                Șterge ciorna
              </button>
            </div>
          )}
      <form onSubmit={handleCreate} className="grid gap-4 mb-8">
        {/* Pasul 2308000 — titlu intern, doar pentru tine */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1">
            Titlu intern (nu se vede de către cititori)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="ex: Pavel"
          />
          <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">
            Te ajută să găsești reel-ul în listă și dă numele fișierului video:
            <span className="font-mono"> radikal-r09-pavel-230826.webm</span>
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1">
            Text (apare animat cuvânt cu cuvânt)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className={`${inputClass} min-h-[10rem] leading-relaxed`}
            placeholder="Frica de oameni este o capcană"
          />
        </div>

        {/* Pasul 2308000 — cum arată literele și cum se taie rândurile */}
        <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 grid gap-3">
          <label className="flex items-center gap-2 text-sm text-black dark:text-white cursor-pointer">
            <input
              type="checkbox"
              checked={uppercaseText}
              onChange={(e) => setUppercaseText(e.target.checked)}
              className="h-4 w-4 accent-black dark:accent-white"
            />
            Scrie textul doar cu MAJUSCULE
          </label>

          <label className="flex items-center gap-2 text-sm text-black dark:text-white cursor-pointer">
            <input
              type="checkbox"
              checked={useManualPages}
              onChange={(e) => setUseManualPages(e.target.checked)}
              className="h-4 w-4 accent-black dark:accent-white"
            />
            Aleg singur rândurile
          </label>

          {!useManualPages ? (
            <p className="text-[11px] text-black/45 dark:text-white/45">
              Momentan textul se împarte automat, cu grijă să nu rupă o frază la mijloc.
            </p>
          ) : (
            <div className="grid gap-2">
              <p className="text-[11px] text-black/45 dark:text-white/45">
                Fiecare rând de mai jos apare ca o pagină separată în reel.
              </p>
              {manualPages.map((page, i) => (
                <div key={i} className="grid gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-black/50 dark:text-white/50">
                      Rândul {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setManualPages(manualPages.filter((_, j) => j !== i))}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10"
                    >
                      Șterge
                    </button>
                  </div>
                  <textarea
                    value={page}
                    rows={4}
                    onChange={(e) => {
                      const next = [...manualPages];
                      next[i] = e.target.value;
                      setManualPages(next);
                    }}
                    className={`${inputClass} min-h-[7rem] leading-relaxed`}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setManualPages([...manualPages, ''])}
                className="justify-self-start rounded-full bg-black/5 dark:bg-white/10 px-4 py-2 text-xs font-semibold text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20"
              >
                + Adaugă rândul {manualPages.length + 1}
              </button>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1">
              Referință (opțional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputClass}
              placeholder="Proverbe 29:25"
            />
          </div>

          <div>
            {/* Pasul 2208001: dropdown cu CĂUTARE, maxim 5 rezultate deodată */}
            <PostSearchSelect
              posts={posts}
              value={blogPostId}
              onChange={setBlogPostId}
            />
          </div>

          {/* Pasul 2708001 — MĂRTURIE LEGATĂ.
              Pasul 2708002: aceeași căutare ca la articole — scrii câteva
              litere și găsești mărturia, oricâte ai avea.
              Se alege ori articol, ori mărturie, nu amândouă. */}
          <div>
            <PostSearchSelect
              posts={testimonies}
              value={testimonyId}
              onChange={setTestimonyId}
              label="Mărturie legată (opțional)"
              emptyLabel="— Fără mărturie —"
              showTypeFilter={false}
              disabled={Boolean(blogPostId)}
            />
            <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">
              {blogPostId
                ? 'Ai ales deja un articol. Golește-l dacă vrei o mărturie.'
                : 'Reel-ul va avea butonul „Mărturia&ldquo;.'}
            </p>
          </div>

          {/* Pasul 2708001 — CULOAREA TEXTULUI.
              Pe imagini închise, textul negru al temei luminoase se pierde. */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1">
              Culoarea textului
            </label>
            <div className="flex flex-wrap gap-2">
              {([
                ['auto', 'Urmează tema'],
                ['light', 'Mereu alb'],
                ['dark', 'Mereu negru'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTextColor(id)}
                  className={`btn-solid rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    textColor === id
                      ? 'border-transparent bg-black text-white dark:bg-white dark:text-black'
                      : 'border-black/15 text-black/70 hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">
              „Urmează tema&ldquo; = alb pe fundal negru, negru pe fundal alb. Alege „mereu alb&ldquo;
              dacă imaginea de fundal este închisă și textul se pierde în ea.
            </p>
          </div>
        </div>

        {/* ---------- Pasul 2108002: media încărcată din calculator + efecte + preview ---------- */}
        <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
          <p className="mb-3 text-xs text-black/50 dark:text-white/50">
            Textul se scrie în <strong>română</strong> și este tradus automat prin DeepL.
          </p>

          <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
            {/* Coloana cu setări */}
            <div className="grid gap-4 sm:grid-cols-2 min-w-0">
              <MediaUpload
                label="Muzică de fundal (opțional)"
                kind="audio"
                value={audioUrl}
                onChange={setAudioUrl}
              />

              <MediaUpload
                label="Imagine de fundal (opțional)"
                kind="image"
                value={backgroundImageUrl}
                onChange={setBackgroundImageUrl}
              />

              <div>
                {/* Pasul 2208001: volumul muzicii este MEREU 100%.
                    Volumul real îl dă telefonul/laptopul utilizatorului,
                    deci un al doilea reglaj doar încurca. */}
                <label className="block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1">
                  Volum muzică
                </label>
                <p className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm text-black/60 dark:text-white/60">
                  100% — fix. Volumul îl controlează dispozitivul ascultătorului.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1">
                  Opacitate imagine: {backgroundOpacity}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={backgroundOpacity}
                  onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                  disabled={!backgroundImageUrl}
                  className="w-full accent-black dark:accent-white disabled:opacity-40"
                />
                <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">
                  Se folosește pe tema întunecată (fundal negru).
                </p>
              </div>

              {/* Pasul 2508001 — pe tema luminoasă fundalul e ALB, deci aceeași
                  poză arată cu totul altfel. Aici alegi separat cât de deschisă
                  să fie. Gol = exact ca la tema întunecată. */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1">
                  Opacitate pe tema luminoasă: {backgroundOpacityLight ?? backgroundOpacity}%
                  {backgroundOpacityLight === null && ' (ca la întuneric)'}
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={backgroundOpacityLight ?? backgroundOpacity}
                  onChange={(e) => setBackgroundOpacityLight(Number(e.target.value))}
                  disabled={!backgroundImageUrl}
                  className="w-full accent-black dark:accent-white disabled:opacity-40"
                />
                <button
                  type="button"
                  onClick={() => setBackgroundOpacityLight(null)}
                  disabled={backgroundOpacityLight === null}
                  className="mt-1 rounded-lg border border-black/15 dark:border-white/15 px-3 py-1 text-[11px] text-black/70 dark:text-white/70 transition-colors hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40"
                >
                  La fel ca tema întunecată
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1">
                  Intensitate sepia: {sepiaIntensity}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sepiaIntensity}
                  onChange={(e) => setSepiaIntensity(Number(e.target.value))}
                  disabled={!effectSepia}
                  className="w-full accent-black dark:accent-white disabled:opacity-40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1">
                  Intensitate vignette: {vignetteIntensity}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={vignetteIntensity}
                  onChange={(e) => setVignetteIntensity(Number(e.target.value))}
                  disabled={!effectVignette}
                  className="w-full accent-black dark:accent-white disabled:opacity-40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1">
                  Opacitate grain: {grainOpacity}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={grainOpacity}
                  onChange={(e) => setGrainOpacity(Number(e.target.value))}
                  disabled={!effectGrain}
                  className="w-full accent-black dark:accent-white disabled:opacity-40"
                />
              </div>

              <div className="sm:col-span-2 flex flex-wrap gap-5">
                {([
                  ['Noise (zgomot fin)', effectNoise, setEffectNoise] as const,
                  ['Grain (granulație dinamică)', effectGrain, setEffectGrain] as const,
                  ['Sepia', effectSepia, setEffectSepia] as const,
                  ['Vignette', effectVignette, setEffectVignette] as const,
                  // Pasul 2308005 (E) — efecte cinematice noi
                  ['Alb-negru', effectBw, setEffectBw] as const,
                  ['Bloom (halou cald)', effectBloom, setEffectBloom] as const,
                  ['Bare cinema (letterbox)', effectLetterbox, setEffectLetterbox] as const,
                  ['Light leak (scurgere de lumină)', effectLightLeak, setEffectLightLeak] as const,
                ]).map(([label, value, setter]) => (
                  <label key={label} className="flex items-center gap-2 text-sm text-black dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setter(e.target.checked)}
                      className="h-4 w-4 accent-black dark:accent-white"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Previzualizare live */}
            <div className="lg:w-[260px]">
              <ReelPreview
                content={content}
                reference={reference}
                backgroundImageUrl={backgroundImageUrl}
                backgroundOpacity={backgroundOpacity}
                effectNoise={effectNoise}
                effectGrain={effectGrain}
                grainOpacity={grainOpacity}
                effectSepia={effectSepia}
                effectVignette={effectVignette}
                sepiaIntensity={sepiaIntensity}
                vignetteIntensity={vignetteIntensity}
                effectBw={effectBw}
                effectBloom={effectBloom}
                effectLetterbox={effectLetterbox}
                effectLightLeak={effectLightLeak}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
              Ordine
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              className="w-20 rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-black text-black dark:text-white px-2 py-1 text-sm"
            />
          </div>

          {/* Comutator de publicare */}
          <button
            type="button"
            onClick={() => setPublished((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-black dark:text-white"
            aria-pressed={published}
          >
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                published ? 'bg-green-500' : 'bg-black/20 dark:bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  published ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </span>
            {published ? 'Publicat' : 'Ciornă'}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="ml-auto rounded-lg bg-black dark:bg-white px-5 py-2 text-sm font-semibold text-white dark:text-black transition-opacity disabled:opacity-50 hover:opacity-80"
          >
            {saving ? 'Se salvează…' : editingId ? 'Salvează modificările' : 'Creează reel'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-black/15 dark:border-white/15 px-4 py-2 text-sm font-medium text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              Renunță
            </button>
          )}
        </div>
      </form>
        </>,
      )}

      {/* ---------------- Lista existenta ---------------- */}
      {/* Pasul 2108002: doar ultimele 5 + căutare + filtru an/lună, ca lista
          să nu devină un zid de text când ai 100 de reels. */}
      {loading ? (
        <p className="text-sm text-black/50 dark:text-white/50">Se încarcă…</p>
      ) : reels.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">Încă nu există niciun reel.</p>
      ) : (
        <>
          {/* Pasul 2308001 — în ce limbă se descarcă videoclipurile */}
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
              Limba pentru 🎬 Video
            </span>
            <select
              value={exportLang}
              onChange={(e) => setExportLang(e.target.value as typeof exportLang)}
              className="rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-1 text-sm text-black dark:text-white"
            >
              <option value="de">Germană</option>
              <option value="en">Engleză</option>
              <option value="ro">Română</option>
              <option value="ru">Rusă</option>
            </select>
            <span className="text-[11px] text-black/45 dark:text-white/45">
              Se folosește traducerea salvată a reel-ului; și titlul din numele
              fișierului este tradus.
            </span>
          </div>

          <AdminListFilterBar
            placeholder="Caută în reels…"
            search={filter.search}
            setSearch={filter.setSearch}
            year={filter.year}
            setYear={filter.setYear}
            month={filter.month}
            setMonth={filter.setMonth}
            years={filter.years}
            monthNames={filter.monthNames}
            totalCount={reels.length}
            filteredCount={filter.filtered.length}
            isFiltering={filter.isFiltering}
            onReset={filter.reset}
          />

          {filter.visible.length === 0 ? (
            <p className="text-sm text-black/50 dark:text-white/50">
              Niciun reel nu corespunde căutării.
            </p>
          ) : (
            <ul className="grid gap-3">
              {filter.visible.map((reel) => (
                <li
              key={reel.id}
              className="rounded-xl border border-black/10 dark:border-white/10 px-4 py-3 w-full min-w-0 overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 w-full sm:w-auto sm:flex-1">
                {/* Pasul 2308000 — titlul intern, ca sa te descurci mai usor prin listă */}
                {reel.title && (
                  <p className="truncate text-sm font-semibold text-black dark:text-white">
                    {reel.title}
                  </p>
                )}
                <p className={`truncate text-sm ${reel.title ? 'text-black/60 dark:text-white/60' : 'font-medium text-black dark:text-white'}`}>
                  {reel.content}
                </p>
                <p className="truncate text-xs text-black/50 dark:text-white/50">
                  {reel.reel_number ? `#R${reel.reel_number} · ` : ''}
                  {reel.blog_post_id ? '🔗 legat de articol' : '● doar like'} · ordine {reel.sort_order} · ♥ {reel.likes_count}
                </p>
              </div>

              <button
                onClick={() => togglePublished(reel)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  reel.published
                    ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                    : 'bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60'
                }`}
              >
                {reel.published ? 'Publicat' : 'Ciornă'}
              </button>

              <button
                onClick={() => handleEdit(reel)}
                disabled={loadingEdit}
                className="rounded-full px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
              >
                {editingId === reel.id ? 'Se editează…' : 'Editează'}
              </button>

              {/* Pasul 2308005 (E) — export video curat, pentru YouTube.
                  Nu apare niciun buton al aplicatiei in fisierul descarcat. */}
              <button
                onClick={() => handleExportVideo(reel)}
                disabled={exportingId !== null}
                className="rounded-full px-3 py-1 text-xs font-semibold text-black/55 dark:text-white/55 hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                title="Descarcă reel-ul ca video (fără butoane)"
              >
                {exportingId === reel.id ? `Se generează… ${exportProgress}%` : '⚡ Rapid'}
              </button>

              <button
                onClick={() => handleDelete(reel)}
                className="rounded-full px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Șterge
              </button>
              </div>

              {/* Aici se deschide sertarul de editare pentru acest reel */}
              {editingId === reel.id && <div ref={setEditorSlot} className="mt-4" />}
            </li>
              ))}
            </ul>
          )}

          {filter.hiddenCount > 0 && !filter.showAll && (
            <button
              type="button"
              onClick={() => filter.setShowAll(true)}
              className="mt-3 w-full rounded-lg border border-black/15 dark:border-white/15 px-4 py-2 text-sm font-medium text-black/70 dark:text-white/70 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              Arată toate ({filter.hiddenCount} ascunse)
            </button>
          )}

          {filter.showAll && !filter.isFiltering && (
            <button
              type="button"
              onClick={() => filter.setShowAll(false)}
              className="mt-3 w-full rounded-lg border border-black/15 dark:border-white/15 px-4 py-2 text-sm font-medium text-black/70 dark:text-white/70 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              Arată doar ultimele 5
            </button>
          )}
        </>
      )}
    </section>
  );
}
