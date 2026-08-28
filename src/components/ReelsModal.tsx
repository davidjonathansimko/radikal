// Reels Modal — sistem tip YouTube Shorts pentru RADIKAL.
//
// Pasul 21082026 — Reels v2:
// - Derulare VERTICALA cu snap (un reel pe ecran), in ordine 1,2,3… la scroll
//   down si 3,2,1… la scroll up
// - ORDINE ROTATIVA: la fiecare redeschidere lista incepe din alt punct
// - Textul apare animat cuvant cu cuvant (acelasi sistem GSAP ca WelcomeModal)
// - Text lung -> se imparte automat in mai multe "pagini" care se succed,
//   ca la AboutStoryModal
// - Buton de LIKE in dreapta + tag #R00 dedesubt
// - Buton SAGEATA catre articol — DOAR daca reel-ul e legat de un blog
// - Muzica de fundal cu bucla fara taietura (crossfade)
// - Efecte optionale: noise/sand grain, sepia usor, vignette in colturi
// - Imagine de fundal optionala, cu opacitate libera 0..100
// - TRADUCERE automata DeepL in limba selectata, cu cache in baza de date
// - TEMA: reels-ul ramane MEREU pe fundal intunecat (pasul 2708019)
//
// Performanta: animam DOAR reel-ul vizibil (IntersectionObserver) si
// distrugem timeline-ul cand iese din ecran.

'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { paginateText } from '@/lib/paginateText';
import { createClient } from '@/lib/supabase';
import { isAdminUser } from '@/lib/isAdmin';
import { useAppFullscreen } from '@/lib/appFullscreen';
import { useLanguage } from '@/hooks/useLanguage';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useReelAudio } from '@/hooks/useReelAudio';
import { useHaptic } from '@/hooks/useHaptic';
import { getGuestId } from '@/hooks/useGuestMode';

export interface Reel {
  id: string;
  content: string;
  reference: string | null;
  blog_post_id: string | null;
  likes_count: number;
  blog_slug?: string | null;
  /**
   * Pasul 2708001 — culoarea textului, aleasa de tine:
   *   'auto'  = urmeaza tema (alb pe negru, negru pe alb)
   *   'light' = mereu alb   (bun peste imagini inchise)
   *   'dark'  = mereu negru (bun peste imagini deschise)
   */
  text_color?: 'auto' | 'light' | 'dark' | null;
  /** Pasul 2708001 — adresa marturiei legate, daca reel-ul tine de una. */
  testimony_slug?: string | null;
  /** Tag afisat sub butonul de like: R00, R01 … R99, apoi R100, R101 … */
  tag: string;

  // --- Media (Pasul 21082026) ---
  audio_url: string | null;
  audio_volume: number;
  background_image_url: string | null;
  background_opacity: number;
  /**
   * Pasul 2508001 — cat de vizibila e imaginea pe TEMA LUMINOASA.
   * `null` = foloseste valoarea de mai sus (comportamentul de pana acum).
   */
  background_opacity_light?: number | null;

  // --- Efecte vizuale optionale ---
  effect_noise: boolean;
  /** Pasul 2208001 — granulatie DINAMICA, separata de noise */
  effect_grain?: boolean;
  grain_opacity?: number;
  effect_sepia: boolean;
  effect_vignette: boolean;
  sepia_intensity: number;
  vignette_intensity: number;
  // Pasul 2308005 (E) — efecte cinematice noi (optionale => reelsurile vechi raman identice)
  effect_bw?: boolean;
  effect_bloom?: boolean;
  effect_letterbox?: boolean;
  effect_light_leak?: boolean;

  /**
   * Pasul 2308006-A — randurile alese manual de tine in admin
   * („Aleg singur randurile"). Daca exista, ele sunt EXACT paginile
   * reel-ului. Daca lipsesc, textul se imparte automat, ca pana acum.
   */
  manual_pages?: string[] | null;
  /** Pasul 2708007 — bifa „Scrie textul doar cu MAJUSCULE" din admin. */
  uppercase_text?: boolean | null;
}

/** R00 … R99, apoi automat R100, R101 … (padStart nu taie cifrele in plus) */
function buildReelTag(n: number | null | undefined): string {
  const safe = typeof n === 'number' && n >= 0 ? n : 0;
  return `R${String(safe).padStart(2, '0')}`;
}

/**
 * Pasul 2308002 — impartirea in pagini s-a mutat in `src/lib/paginateText.ts`,
 * ca sa fie folosita identic si la reels, si la Play Blog.
 * Acolo este si reparatia pentru referintele biblice taiate ("(1." + "Korinther…").
 */

interface ReelsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// ROTATIE: fiecare deschidere a modalului incepe din alt punct al listei.
// Ordinea ramane 1,2,3… (crescator la scroll down), doar startul se roteste.
// ---------------------------------------------------------------------------
const ROTATION_KEY = 'radikalReelsRotation';

function rotateFromStoredOffset<T>(items: T[]): T[] {
  if (items.length <= 1) return items;

  let offset = 0;
  try {
    offset = Number(localStorage.getItem(ROTATION_KEY) || '0') || 0;
    // Pregatim urmatoarea deschidere
    localStorage.setItem(ROTATION_KEY, String((offset + 1) % items.length));
  } catch {
    offset = 0;
  }

  const start = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

// ---------------------------------------------------------------------------
// TRADUCERE DeepL — traduce reels-urile in limba selectata si salveaza
// rezultatul in baza de date, ca sa nu platim de doua ori pentru acelasi text.
//
// Pasul 2308009 — RANDURILE ALESE MANUAL raman aceleasi in orice limba.
// Inainte traduceam tot textul intr-o bucata, iar la afisare se reimpartea
// automat: 4 randuri scrise de tine in romana ajungeau 2 randuri in germana.
// Acum traducem FIECARE RAND separat si il tinem minte separat (randurile sunt
// despartite prin linie noua in `content_<limba>`).
// ---------------------------------------------------------------------------
function splitPages(text: string | null | undefined): string[] {
  return (text || '')
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);
}

function manualPagesOf(row: Record<string, unknown>): string[] {
  return Array.isArray(row.manual_pages)
    ? (row.manual_pages as string[]).map((p) => (p || '').trim()).filter(Boolean)
    : [];
}

async function translateMissing(
  rows: Record<string, unknown>[],
  language: string,
  onTranslated: (
    id: string,
    content: string,
    reference: string | null,
    pages: string[] | null
  ) => void
) {
  if (!rows || rows.length === 0) return;

  const supabase = createClient();

  for (const row of rows) {
    const id = row.id as string;
    const source = (row.source_language as string) || 'ro';

    // Textul e deja in limba ceruta -> nu traducem
    if (source === language) continue;

    const manual = manualPagesOf(row);
    const cached = row[`content_${language}`] as string | null;

    // Avem deja traducerea salvata SI are acelasi numar de randuri -> gata.
    // (Pentru reels-urile traduse inainte de pasul 2308009, numarul nu se
    // potriveste, deci le traducem o singura data din nou, corect.)
    if (cached && (manual.length === 0 || splitPages(cached).length === manual.length)) {
      continue;
    }

    const originalContent = (row.content as string) || '';
    const originalReference = (row.reference as string) || '';
    if (manual.length === 0 && !originalContent.trim()) continue;

    try {
      // Cu randuri manuale trimitem o LISTA (fiecare rand separat).
      // Fara ele, trimitem textul intreg, ca pana acum.
      const payload =
        manual.length > 0
          ? [...manual, originalReference]
          : originalReference
            ? `${originalContent}\n---\n${originalReference}`
            : originalContent;

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: payload, targetLang: language, sourceLang: source }),
      });

      if (!res.ok) continue;

      const json = await res.json();
      const raw = json.translatedText ?? json.translation ?? json.text;

      let finalPages: string[] | null = null;
      let finalContent = '';
      let finalReference: string | null = null;

      if (manual.length > 0) {
        const list: string[] = Array.isArray(raw) ? raw : [];
        // Ultimul element este referinta, restul sunt randurile.
        const translatedPages = list.slice(0, manual.length).map((p) => (p || '').trim()).filter(Boolean);
        if (translatedPages.length !== manual.length) continue;
        finalPages = translatedPages;
        finalContent = translatedPages.join('\n');
        finalReference = (list[manual.length] || '').trim() || null;
      } else {
        const [tContent, tReference] = String(raw || '').split('\n---\n');
        finalContent = (tContent || '').trim();
        finalReference = (tReference || '').trim() || null;
        if (!finalContent) continue;
      }

      // Afisam imediat
      onTranslated(id, finalContent, finalReference, finalPages);

      // Salvam in cache, ca sa nu mai cerem data viitoare
      await supabase.rpc('cache_reel_translation', {
        p_reel_id: id,
        p_lang: language,
        p_content: finalContent,
        p_reference: finalReference,
      });
    } catch {
      // Traducerea a esuat -> ramane textul original. Nu blocam nimic.
    }
  }
}

// ---------------------------------------------------------------------------
// Un singur reel (o "pagina" pe tot ecranul)
//
// Pasul A02 — acest component este acum EXPORTAT, ca sa poata fi folosit si de
// pagina de captura video (`/reel-capture/[id]`). Asa videoul descarcat este
// garantat identic cu ce se vede pe site: e literalmente ACELASI cod.
// ---------------------------------------------------------------------------
export function ReelSlide({
  reel,
  isDark,
  language,
  isLiked,
  likeCount,
  reduceMotion,
  onToggleLike,
  onOpenBlog,
  onOpenTestimony,
  onActive,
  chromeless = false,
  forceActive = false,
  onLoopComplete,
  isAdmin = false,
  onFreeze,
}: {
  reel: Reel;
  isDark: boolean;
  language: string;
  isLiked: boolean;
  likeCount: number;
  reduceMotion: boolean;
  onToggleLike: (reel: Reel) => void;
  onOpenBlog: (slug: string) => void;
  /** Pasul 2708001 — deschide marturia legata de reel. */
  onOpenTestimony: (slug: string) => void;
  onActive: (reel: Reel) => void;
  /**
   * Pasul A02 — `true` ascunde TOT ce tine de interfata aplicatiei:
   * butonul de like, share, sageata catre articol, tag-ul #R00 si
   * bulinele de paginare. Fundalul, efectele si animatia textului raman
   * EXACT la fel. Folosit doar la descarcarea videoului.
   */
  chromeless?: boolean;
  /**
   * Pasul A02 — `true` porneste animatia imediat, fara sa astepte
   * IntersectionObserver. La captura video nu exista derulare.
   */
  forceActive?: boolean;
  /** Pasul A02 — anuntat cand textul a terminat o trecere completa. */
  onLoopComplete?: () => void;
  /**
   * Pasul A12 — esti admin? Doar atunci apare butonul de FREEZE.
   * Cititorii obisnuiti nu il vad niciodata.
   */
  isAdmin?: boolean;
  /** Pasul A12 — apasat butonul de freeze pe acest reel. */
  onFreeze?: (reel: Reel) => void;
}) {
  const slideRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const citeRef = useRef<HTMLElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const { tapLight } = useHaptic();

  // Pasul A02 — pastram callback-ul intr-un ref, ca timeline-ul GSAP sa nu
  // foloseasca o versiune veche a functiei.
  const onLoopCompleteRef = useRef(onLoopComplete);
  onLoopCompleteRef.current = onLoopComplete;


  // Pasul 2308006 — SHARE pentru reel (acelasi comportament ca la Play Blog:
  // share nativ pe telefon, copiere in clipboard pe desktop).
  const [shareMsg, setShareMsg] = useState('');

  const handleShare = useCallback(async () => {
    tapLight();
    const origin =
      typeof window === 'undefined' ? 'https://www.radikal.blog' : window.location.origin;
    // Daca reel-ul apartine unui articol, trimitem direct la articol.
    // Altfel trimitem la pagina principala, cu reel-ul marcat in link.
    const url = reel.blog_slug
      ? `${origin}/blogs/${reel.blog_slug}`
      : `${origin}/?reel=${encodeURIComponent(reel.tag)}`;

    const title = `RADIKAL. #${reel.tag}`;
    const text = reel.reference ? `${reel.content}\n— ${reel.reference}` : reel.content;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      setShareMsg(
        language === 'de' ? 'Link kopiert' :
        language === 'en' ? 'Link copied' :
        language === 'ro' ? 'Link copiat' : 'Ссылка скопирована'
      );
      setTimeout(() => setShareMsg(''), 2200);
    } catch {
      /* utilizatorul a anulat share-ul */
    }
  }, [reel.blog_slug, reel.tag, reel.content, reel.reference, language, tapLight]);

  // Text lung -> mai multe "pagini" care se succed automat.
  // Pasul 2308006-A: daca in admin ai bifat „Aleg singur rândurile", folosim
  // exact acele randuri. Inainte erau ignorate complet si textul era taiat
  // automat — de aceea vedeai doar 2 pagini in loc de 4.
  const pages = useMemo(() => {
    const manual = (reel.manual_pages || [])
      .map((p) => (p || '').trim())
      .filter(Boolean);
    const raw = manual.length > 0 ? manual : paginateText(reel.content);
    // Bifa din admin schimba literele in text, nu doar in aspect: asa ajung
    // majusculele si in citirea cu voce, si in videoclipul descarcat.
    return reel.uppercase_text ? raw.map((p) => p.toLocaleUpperCase()) : raw;
  }, [reel.content, reel.manual_pages, reel.uppercase_text]);
  const [pageIndex, setPageIndex] = useState(0);
  // Contor de bucla: creste de fiecare data cand textul o ia de la capat.
  // Este nevoie de el pentru ca, la reel-urile cu o singura pagina,
  // `setPageIndex(0)` nu ar declansa din nou animatia (valoarea nu se schimba).
  const [loopCount, setLoopCount] = useState(0);
  const isActiveRef = useRef(false);

  // Reporneste textul de la prima pagina (bucla infinita)
  const restartLoop = () => {
    // Pasul A02 — anuntam ca o trecere completa s-a incheiat.
    // La captura video, aici se opreste inregistrarea.
    onLoopCompleteRef.current?.();
    setPageIndex(0);
    setLoopCount((c) => c + 1);
  };

  // Pasul 2708001 — daca ai ales o culoare anume, ea bate tema.
  // Fara asta, pe tema luminoasa textul negru se pierdea in imaginile inchise.
  const forced = reel.text_color && reel.text_color !== 'auto' ? reel.text_color : null;
  const lightText = forced ? forced === 'light' : isDark;

  const textColor = lightText ? '#ffffff' : '#000000';
  const textLight = lightText ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';
  const textVeryLight = lightText ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const bgTransparent = lightText ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const borderColorLight = lightText ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)';

  const isLastPage = pageIndex >= pages.length - 1;
  const currentText = pages[pageIndex] || '';

  // Animatia porneste doar cand reel-ul devine vizibil
  useEffect(() => {
    const el = slideRef.current;
    if (!el) return;

    // O pagina cu mai putine cuvinte decat cea dinainte lasa in urma legaturi
    // catre cuvinte care nu mai sunt pe ecran. Animate degeaba, ele produceau
    // sclipiri. `isConnected` le lasa deoparte.
    const liveWords = () =>
      wordsRef.current.filter((w): w is HTMLSpanElement => Boolean(w?.isConnected));

    const play = () => {
      const words = liveWords();
      if (words.length === 0) return;

      tlRef.current?.kill();

      // Animatii reduse (doar daca utilizatorul a cerut asta din setari):
      // aratam textul instant, fara sa stricam nimic din restul aplicatiei.
      if (reduceMotion) {
        gsap.set(words, { opacity: 1, filter: 'blur(0px)', y: 0, x: 0 });
        if (citeRef.current) gsap.set(citeRef.current, { opacity: 1, y: 0, x: 0 });
        const tl = gsap.timeline();
        tl.to({}, { duration: isLastPage ? 5 : 3.5 }).call(() => {
          if (!isActiveRef.current) return;
          if (isLastPage) restartLoop();
          else setPageIndex((i) => i + 1);
        });
        tlRef.current = tl;
        return;
      }

      gsap.set(words, { opacity: 0, filter: 'blur(10px)', y: 8, x: -15 });
      if (citeRef.current) gsap.set(citeRef.current, { opacity: 0, y: 15, x: -10 });

      const tl = gsap.timeline();
      tl.to(words, {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        x: 0,
        duration: 0.8,
        stagger: { each: 0.18, ease: 'power1.inOut' },
        ease: 'power2.out',
      });

      // Referinta apare doar pe ULTIMA pagina de text
      if (citeRef.current && isLastPage) {
        tl.to(citeRef.current, { opacity: 1, y: 0, x: 0, duration: 1.2, ease: 'power2.out' }, '-=0.8');
      }

      // Mai urmeaza text -> pauza de citire, apoi textul dispare si
      // incepe pagina urmatoare (exact ca la AboutStoryModal).
      // Pe ULTIMA pagina facem acelasi lucru, dar o luam de la capat:
      // reel-ul ruleaza in bucla cat timp userul ramane pe el.
      {
        const pauza = isLastPage ? 4.2 : 2.6;
        // Pasul 2708008 — iesirea era de doua ori mai scurta decat intrarea
        // (0,4s fata de 0,8s) si arunca cuvintele lateral. Ochiul prindea
        // saltul si parea o sclipire. Acum pleaca la fel de linistit cum vin:
        // se sting pe loc, cu o urma foarte mica de miscare in sus.
        tl.to({}, { duration: pauza })
          .to([...liveWords()].reverse(), {
            opacity: 0,
            filter: 'blur(8px)',
            y: -6,
            duration: 0.75,
            stagger: { each: 0.045, ease: 'power1.inOut' },
            ease: 'power2.inOut',
          });

        if (citeRef.current && isLastPage) {
          tl.to(citeRef.current, { opacity: 0, y: 10, duration: 0.7, ease: 'power2.inOut' }, '<');
        }

        // O respiratie scurta pe ecranul gol, ca sa nu se ciocneasca sfarsitul
        // unei pagini cu inceputul urmatoarei.
        tl.to({}, { duration: 0.2 });

        tl.call(() => {
          if (!isActiveRef.current) return;
          if (isLastPage) restartLoop();
          else setPageIndex((i) => i + 1);
        });
      }

      tlRef.current = tl;
    };

    const reset = () => {
      tlRef.current?.kill();
      tlRef.current = null;
      const words = liveWords();
      // Pasul 2308009: fara cuvinte pe ecran (text inca netradus), GSAP
      // scria „target not found" in consola la fiecare derulare.
      if (words.length > 0) gsap.set(words, { opacity: 0 });
      if (citeRef.current) gsap.set(citeRef.current, { opacity: 0 });
    };

    // Pasul A02 — la CAPTURA VIDEO nu exista derulare, deci nu are sens
    // IntersectionObserver: pornim animatia direct. Restul (efecte, text,
    // temporizare) ramane exact acelasi cod ca pe site.
    if (forceActive) {
      isActiveRef.current = true;
      onActive(reel);
      play();
      return () => {
        tlRef.current?.kill();
        tlRef.current = null;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            isActiveRef.current = true;
            onActive(reel);
            play();
          } else {
            isActiveRef.current = false;
            reset();
            // Reel-ul a iesit din ecran -> textul reincepe de la prima pagina
            setPageIndex(0);
          }
        });
      },
      { threshold: [0, 0.6, 1] }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      tlRef.current?.kill();
      tlRef.current = null;
    };
    // `pageIndex` face ca fiecare pagina de text sa fie animata din nou,
    // iar `loopCount` face ca bucla sa reporneasca si la reel-urile cu o singura pagina
  }, [reel.id, onActive, pageIndex, loopCount, isLastPage, reduceMotion, forceActive]);

  // Cand reel-ul iese din ecran, textul reincepe de la prima pagina
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  const words = currentText.split(' ');

  // Pasul 2508001 — aceeasi poza arata altfel pe alb decat pe negru.
  // Daca ai ales o valoare separata pentru tema luminoasa, o folosim; altfel
  // ramane cea de la tema intunecata.
  const bgOpacityForTheme =
    !isDark && typeof reel.background_opacity_light === 'number'
      ? reel.background_opacity_light
      : reel.background_opacity;

  // Filtrul imaginii de fundal — sepia subtil + (Pasul 2308005) alb-negru.
  // Contrastul mic compenseaza „platitudinea" pe care o da grayscale simplu.
  const filterValue = (() => {
    const parts: string[] = [];
    if (reel.effect_bw) parts.push('grayscale(1)', 'contrast(1.12)', 'brightness(1.02)');
    if (reel.effect_sepia) {
      parts.push(`sepia(${Math.min(100, Math.max(0, reel.sepia_intensity)) / 100})`);
    }
    return parts.length ? parts.join(' ') : undefined;
  })();

  return (
    <section
      ref={slideRef}
      className="relative h-full w-full flex-shrink-0 snap-start snap-always flex items-center justify-center px-6 overflow-hidden"
      style={{ scrollSnapStop: 'always' }}
    >
      {/* --- Imagine de fundal optionala, cu opacitatea aleasa de admin --- */}
      {reel.background_image_url && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${reel.background_image_url})`,
            opacity: Math.min(100, Math.max(0, bgOpacityForTheme)) / 100,
            filter: filterValue,
          }}
        />
      )}

      {/* --- Efect NOISE / sand grain — foarte fin ---
           Pasul 2308001: `inset-0` a fost scos. Clasa `.reel-noise` isi pune
           singura o suprafata mai mare decat ecranul, ca marginile sa nu se
           mai descopere cand boabele se misca. */}
      {reel.effect_noise && (
        <div
          aria-hidden="true"
          className="reel-noise"
          style={{ opacity: isDark ? 0.16 : 0.1 }}
        />
      )}

      {/* --- Pasul 2208001: GRAIN dinamic (film), separat de noise ---
          `pointer-events-none` + z-index mic => nu acopera niciodata
          butoanele de like / share / paginare. */}
      {reel.effect_grain && (
        <div
          aria-hidden="true"
          className="dynamic-grain"
          style={{ ['--grain-opacity' as string]: String((reel.grain_opacity ?? 25) / 100) }}
        />
      )}

      {/* --- Sepia peste tot continutul (cand nu exista imagine de fundal) --- */}
      {reel.effect_sepia && !reel.background_image_url && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundColor: '#704214',
            opacity: (Math.min(100, Math.max(0, reel.sepia_intensity)) / 100) * 0.35,
            mixBlendMode: 'soft-light',
          }}
        />
      )}

      {/* --- VIGNETTE: colturile putin intunecate --- */}
      {reel.effect_vignette && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            // Pasul 2108002: intensitatea vine acum din baza de date (0–100)
            background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,${
              (Math.min(100, Math.max(0, reel.vignette_intensity)) / 100) * (isDark ? 1 : 0.7)
            }) 100%)`,
          }}
        />
      )}

      {/* --- Pasul 2308005 (E): BLOOM cinematic (halou cald, „respira") --- */}
      {reel.effect_bloom && <div aria-hidden="true" className="cine-bloom" />}

      {/* --- Pasul 2308005 (E): LIGHT LEAK (scurgere de lumina, ca la film) --- */}
      {reel.effect_light_leak && <div aria-hidden="true" className="cine-light-leak" />}

      {/* --- Pasul 2308005 (E): LETTERBOX (barele negre cinema).
              Sunt randate ULTIMELE ca sa stea peste toate celelalte straturi. --- */}
      {reel.effect_letterbox && (
        <>
          <div aria-hidden="true" className="pointer-events-none absolute top-0 left-0 right-0 h-[8%] bg-black" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 right-0 h-[8%] bg-black" />
        </>
      )}

      {/* Textul animat, PERFECT centrat pe ecran.
          Pasul 2308006-A: padding lateral mai mare, simetric, ca textul sa nu
          mai intre peste coloana de butoane (like / share / articol / freeze).
          Simetric = textul ramane centrat, doar ca are „culoar" mai ingust. */}
      {/* Pasul 2708009 — `pointer-events-none`: blocul de text ocupa toata
          latimea si, avand z-10, statea PESTE partea din stanga a butoanelor.
          De aceea apasarea fix pe mijlocul lor nu raspundea, dar mai spre
          dreapta mergea. Textul nu se apasa oricum, deci lasa atingerea sa
          treaca mai departe. */}
      <div className="pointer-events-none relative z-10 w-full max-w-2xl mx-auto text-center px-14 sm:px-20">
        <blockquote
          className="font-cinzel text-2xl md:text-3xl lg:text-4xl italic leading-relaxed flex items-center justify-center flex-wrap"
          style={{ color: textColor, borderLeft: 'none', paddingLeft: 0 }}
        >
          {words.map((word, index) => (
            <span
              key={`${pageIndex}-${index}`}
              ref={(el) => {
                wordsRef.current[index] = el;
              }}
              className="inline-block mx-1 tracking-wider"
              // `willChange` tine fiecare cuvant pe placa video tot timpul.
              // Fara el, browserul crea si arunca stratul la fiecare estompare,
              // iar aruncarea aceea se vedea ca o sclipire.
              style={{ opacity: 0, willChange: 'opacity, filter, transform' }}
            >
              {word}
            </span>
          ))}
        </blockquote>

        {reel.reference && isLastPage && (
          <cite
            ref={citeRef}
            className="block font-cinzel text-lg md:text-xl font-medium mt-8 not-italic"
            style={{ color: textLight, opacity: 0 }}
          >
            — {reel.reference}
          </cite>
        )}

        {/* Indicator discret de pagina, doar cand textul are mai multe parti.
            Pasul A02: la descarcarea video nu se vede (chromeless). */}
        {pages.length > 1 && !chromeless && (
          <div className="mt-8 flex items-center justify-center gap-1.5">
            {pages.map((_, i) => (
              <span
                key={i}
                className="block h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === pageIndex ? 18 : 6,
                  backgroundColor: textColor,
                  opacity: i === pageIndex ? 0.5 : 0.2,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bara de actiuni din DREAPTA (stil YouTube Shorts).
          Pasul A02 — `chromeless` o ascunde COMPLET la descarcarea videoului:
          fara like, fara #tag, fara share, fara sageata catre articol.
          Pasul A06 — butoanele sunt acum mai discrete (opacitate redusa),
          ca sa nu fure ochiul de la text. La atingere / hover revin la
          opacitate deplina, deci raman la fel de usor de folosit. */}
      {!chromeless && (
      <div className="reel-actions absolute right-3 sm:right-5 bottom-24 z-20 flex flex-col items-center gap-5">
        {/* LIKE — mereu prezent, si pentru reels fara blog */}
        <button
          onClick={() => onToggleLike(reel)}
          aria-pressed={isLiked}
          aria-label={
            language === 'de' ? 'Gefällt mir' :
            language === 'en' ? 'Like' :
            language === 'ro' ? 'Îmi place' : 'Нравится'
          }
          className="flex flex-col items-center gap-0.5 rounded-full p-2 transition-transform duration-200 active:scale-90 hover:scale-110"
          style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.55))' }}
        >
          <svg
            className="w-5 h-5 transition-colors duration-200"
            viewBox="0 0 24 24"
            fill={isLiked ? '#ef4444' : 'none'}
            stroke={isLiked ? '#ef4444' : textColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="text-xs font-semibold tabular-nums" style={{ color: textLight }}>
            {likeCount}
          </span>
        </button>

        {/* Tag-ul reel-ului (#R00, #R01 … #R99, apoi #R100) — mic, discret, elegant */}
        <span
          className="-mt-4 select-none text-[10px] font-medium tracking-widest"
          style={{ color: textColor, opacity: 0.35 }}
        >
          #{reel.tag}
        </span>

        {/* SHARE — Pasul 2308006. Acelasi stil rotund, fin, ca la like/articol. */}
        <button
          onClick={handleShare}
          aria-label={
            language === 'de' ? 'Teilen' :
            language === 'en' ? 'Share' :
            language === 'ro' ? 'Distribuie' : 'Поделиться'
          }
          className="flex flex-col items-center gap-0.5 rounded-full p-2 transition-transform duration-200 active:scale-90 hover:scale-110"
          style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.55))' }}
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke={textColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span className="text-[10px] font-semibold" style={{ color: textVeryLight }}>
            {language === 'de' ? 'Teilen' :
             language === 'en' ? 'Share' :
             language === 'ro' ? 'Trimite' : 'Поделиться'}
          </span>
        </button>

        {/* Confirmarea „link copiat" — discreta, dispare singura */}
        {shareMsg && (
          <span
            className="-mt-4 select-none whitespace-nowrap text-[10px] font-medium tracking-wide"
            style={{ color: textVeryLight }}
          >
            {shareMsg}
          </span>
        )}

        {/* SAGEATA catre articol — DOAR daca reel-ul apartine unui blog */}
        {reel.blog_slug && (
          <button
            onClick={() => onOpenBlog(reel.blog_slug as string)}
            aria-label={
              language === 'de' ? 'Zum Artikel' :
              language === 'en' ? 'Go to article' :
              language === 'ro' ? 'Mergi la articol' : 'К статье'
            }
            className="flex flex-col items-center gap-0.5 rounded-full p-2 transition-transform duration-200 active:scale-90 hover:scale-110"
            style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.55))' }}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke={textColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <span className="text-[10px] font-semibold" style={{ color: textVeryLight }}>
              {language === 'de' ? 'Artikel' :
               language === 'en' ? 'Article' :
               language === 'ro' ? 'Articol' : 'Статья'}
            </span>
          </button>
        )}

        {/* Pasul 2708001 — SAGEATA catre MARTURIE, daca reel-ul tine de una.
            Se alege ori articol, ori marturie — nu amandoua. */}
        {!reel.blog_slug && reel.testimony_slug && (
          <button
            onClick={() => onOpenTestimony(reel.testimony_slug as string)}
            aria-label={
              language === 'de' ? 'Zum Zeugnis' :
              language === 'en' ? 'Go to testimony' :
              language === 'ro' ? 'Mergi la mărturie' : 'К свидетельству'
            }
            className="flex flex-col items-center gap-0.5 rounded-full p-2 transition-transform duration-200 active:scale-90 hover:scale-110"
            style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.55))' }}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke={textColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <span className="text-[10px] font-semibold" style={{ color: textVeryLight }}>
              {language === 'de' ? 'Zeugnis' :
               language === 'en' ? 'Testimony' :
               language === 'ro' ? 'Mărturia' : 'Свидетельство'}
            </span>
          </button>
        )}

        {/* --- Pasul A12: FREEZE (doar pentru ADMIN) ---
            La apasare dispar TOATE butoanele aplicatiei: ×, inima, share,
            sageata catre articol, tag-ul, bulinele de paginare si sageata
            de derulare. Ramane doar reel-ul curat, exact cum arata pentru
            cititor — perfect pentru o captura video cu Snipping Tool.
            Butoanele revin singure cand derulezi la alt reel. */}
        {isAdmin && (
          <button
            onClick={() => {
              tapLight();
              onFreeze?.(reel);
            }}
            aria-label="Freeze — ascunde butoanele pentru captură"
            title="Ascunde butoanele (revin la următorul reel)"
            className="flex flex-col items-center gap-1 rounded-full p-2.5 transition-transform duration-200 active:scale-90 hover:scale-110"
            style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.55))' }}
          >
            {/* Lacat — acelasi desen pe care mi l-ai trimis, redesenat cu
                linii, ca sa se potriveasca cu restul pictogramelor. */}
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke={textColor}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="10" width="14" height="11" rx="2.5" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <line x1="12" y1="14" x2="12" y2="17.5" />
            </svg>
          </button>
        )}
      </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Modalul principal
// ---------------------------------------------------------------------------
export default function ReelsModal({ isOpen, onClose }: ReelsModalProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const { tapLight } = useHaptic();
  const { reduced: reduceMotion } = useReducedMotion();
  const { play: playAudio, stop: stopAudio } = useReelAudio();
  // Pasul 2708019 — reels-ul este MEREU pe fundal întunecat, oricare ar fi
  // tema aleasă de cititor. Imaginile din spate sunt gândite pentru negru;
  // pe alb se pierdea tot rostul lor.
  const isDark = true;

  const [reels, setReels] = useState<Reel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [, setActiveId] = useState<string | null>(null);

  // Pasul A12 — MOD CAPTURA (doar pentru admin).
  // `frozenId` = reel-ul pe care ai apasat „freeze". Cat timp este setat,
  // TOATE butoanele aplicatiei dispar de pe ecran. Se anuleaza singur
  // cand derulezi la alt reel.
  const [isAdmin, setIsAdmin] = useState(false);
  const [frozenId, setFrozenId] = useState<string | null>(null);
  const isFrozen = frozenId !== null;

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const bgColor = isDark ? '#000000' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  // Contrast urcat la 0.6 — 0.45 era sub pragul WCAG AA pentru text mic
  const textVeryLight = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const bgTransparent = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const borderColorLight = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)';

  // Focus trap + revenirea focusului pe butonul care a deschis modalul
  useFocusTrap(containerRef, isOpen);

  // Cand un reel devine activ, pornim muzica lui de fundal (cu crossfade).
  // Daca reel-ul nu are muzica, oprim lin ce canta.
  const handleActive = useCallback(
    (reel: Reel) => {
      setActiveId(reel.id);
      // Pasul A12 — ai derulat la alt reel => butoanele revin automat.
      // Asa poti face captura la fiecare reel pe rand, fara sa apesi altceva.
      setFrozenId((current) => (current === reel.id ? current : null));
      if (reel.audio_url) {
        playAudio(reel.audio_url, reel.audio_volume);
      } else {
        stopAudio();
      }
    },
    [playAudio, stopAudio]
  );

  // Pasul A12 — butonul de FREEZE apasat pe un reel
  const handleFreeze = useCallback((reel: Reel) => {
    setFrozenId(reel.id);
  }, []);

  // La inchiderea modalului oprim muzica
  useEffect(() => {
    if (!isOpen) stopAudio();
    return () => stopAudio();
  }, [isOpen, stopAudio]);

  // Incarcam reels-urile publicate
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        setUserId(user?.id ?? null);
        // Pasul A12 — doar adminul vede butonul de freeze
        setIsAdmin(isAdminUser(user));

        const BASE_COLUMNS =
          'id, content, reference, blog_post_id, likes_count, reel_number, source_language, ' +
          'audio_url, background_image_url, background_opacity, ' +
          'effect_noise, effect_grain, grain_opacity, effect_sepia, effect_vignette, sepia_intensity, vignette_intensity, ' +
          'content_de, content_en, content_ro, content_ru, ' +
          'reference_de, reference_en, reference_ro, reference_ru, ' +
          'blog_posts(slug)';

        // Pasul 2308005 (E) — coloanele noi. Sunt cerute separat pentru ca,
        // daca fisierul STEP_2308005_EFFECTS.sql nu a fost inca rulat,
        // Supabase da eroarea 42703 si TOATE reels-urile ar disparea.
        // De aceea incercam intai cu ele si, la 42703, reluam fara ele.
        const NEW_EFFECT_COLUMNS = 'effect_bw, effect_bloom, effect_letterbox, effect_light_leak, ';

        // Pasul 2308006-A — randurile alese manual. Aceeasi grija: daca
        // STEP_2308000_CATEGORII.sql nu a fost rulat, coloana nu exista.
        // `uppercase_text` vine din acelasi fisier, deci merg impreuna.
        const MANUAL_PAGES_COLUMN = 'manual_pages, uppercase_text, ';

        // Pasul 2508001 — aceeasi grija: daca STEP_2508001_REEL_LIGHT.sql nu a
        // fost rulat, coloana nu exista si intreaga lista ar disparea.
        const LIGHT_COLUMN = 'background_opacity_light, ';

        // Pasul 2708001 — culoarea textului si marturia legata. Aceeasi grija:
        // daca STEP_2708001 nu a fost rulat, coloanele nu exista.
        const TEXT_MARTURIE_COLUMNS = 'text_color, testimonies(slug), ';

        const runQuery = (columns: string) =>
          supabase
            .from('reels')
            .select(columns)
            .eq('published', true)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        // Incercam pe rand, de la „tot" spre „minimul sigur".
        let { data, error } = await runQuery(
          TEXT_MARTURIE_COLUMNS + LIGHT_COLUMN + MANUAL_PAGES_COLUMN + NEW_EFFECT_COLUMNS + BASE_COLUMNS,
        );
        if (error?.code === '42703' || error?.code === 'PGRST200') {
          ({ data, error } = await runQuery(
            LIGHT_COLUMN + MANUAL_PAGES_COLUMN + NEW_EFFECT_COLUMNS + BASE_COLUMNS,
          ));
        }
        if (error?.code === '42703') {
          ({ data, error } = await runQuery(MANUAL_PAGES_COLUMN + NEW_EFFECT_COLUMNS + BASE_COLUMNS));
        }
        if (error?.code === '42703') {
          ({ data, error } = await runQuery(NEW_EFFECT_COLUMNS + BASE_COLUMNS));
        }
        if (error?.code === '42703') {
          ({ data, error } = await runQuery(MANUAL_PAGES_COLUMN + BASE_COLUMNS));
        }
        if (error?.code === '42703') {
          ({ data, error } = await runQuery(BASE_COLUMNS));
        }

        if (cancelled) return;

        if (error) {
          console.debug('Reels load issue:', error.code);
          setReels([]);
        } else {
          // Supabase nu poate deduce tipul cu join-ul de mai sus -> normalizam
          const rows = (data || []) as unknown as Record<string, unknown>[];

          const mapped: Reel[] = rows.map((row: Record<string, unknown>) => {
            const bp = row.blog_posts as { slug?: string } | { slug?: string }[] | null;
            const slug = Array.isArray(bp) ? bp[0]?.slug ?? null : bp?.slug ?? null;

            // Traducerea salvata pentru limba curenta.
            // Pasul 2308001: daca lipseste si cititorul NU e pe romana, lasam
            // gol si asteptam DeepL. Inainte aratam originalul romanesc si se
            // vedea o clipa textul in romana — exact sclipirea care deranja.
            const translated = row[`content_${language}`] as string | null;
            const translatedRef = row[`reference_${language}`] as string | null;
            const isRo = language === 'ro';

            return {
              id: row.id as string,
              content: (translated || (isRo ? (row.content as string) : '')) ?? '',
              reference: translatedRef || (isRo ? ((row.reference as string) ?? null) : null),
              blog_post_id: (row.blog_post_id as string) ?? null,
              likes_count: (row.likes_count as number) ?? 0,
              blog_slug: slug,
              // Pasul 2708001 — culoarea aleasa de tine si marturia legata
              text_color: (row.text_color as 'auto' | 'light' | 'dark') ?? 'auto',
              testimony_slug: (() => {
                const t = row.testimonies as { slug?: string } | { slug?: string }[] | null;
                return Array.isArray(t) ? t[0]?.slug ?? null : t?.slug ?? null;
              })(),
              tag: buildReelTag(row.reel_number as number),

              audio_url: (row.audio_url as string) ?? null,
              // Pasul 2208002 (punctul 15): volumul este mereu 100%.
              // Reels-urile vechi, salvate cu 60, se aud acum tot la fel de tare
              // ca cele noi — cititorul regleaza din butoanele telefonului.
              audio_volume: 100,
              background_image_url: (row.background_image_url as string) ?? null,
              background_opacity: (row.background_opacity as number) ?? 15,
              background_opacity_light:
                typeof row.background_opacity_light === 'number'
                  ? (row.background_opacity_light as number)
                  : null,

              effect_noise: Boolean(row.effect_noise),
              effect_grain: Boolean(row.effect_grain),
              grain_opacity: (row.grain_opacity as number) ?? 25,
              effect_sepia: Boolean(row.effect_sepia),
              effect_vignette: Boolean(row.effect_vignette),
              sepia_intensity: (row.sepia_intensity as number) ?? 12,
              vignette_intensity: (row.vignette_intensity as number) ?? 45,
              // Pasul 2308005 (E)
              effect_bw: Boolean(row.effect_bw),
              effect_bloom: Boolean(row.effect_bloom),
              effect_letterbox: Boolean(row.effect_letterbox),
              effect_light_leak: Boolean(row.effect_light_leak),
              // Pasul 2308009 — randurile alese manual raman ACELEASI in orice
              // limba. Traducerea salvata tine randurile despartite prin linie
              // noua; le folosim doar daca numarul se potriveste cu originalul,
              // altfel lasam impartirea automata (ca sa nu arate rupt).
              manual_pages: (() => {
                const manualRo = manualPagesOf(row);
                if (manualRo.length === 0) return null;
                if (isRo) return manualRo;
                const parts = splitPages(translated);
                return parts.length === manualRo.length ? parts : null;
              })(),
              uppercase_text: Boolean(row.uppercase_text),
            };
          });

          // ROTATIE: la fiecare redeschidere lista incepe din alt punct.
          // Ordinea relativa ramane aceeasi (1,2,3… la scroll down),
          // doar punctul de plecare se roteste.
          const rotated = rotateFromStoredOffset(mapped);

          setReels(rotated);
          setLikeCounts(
            Object.fromEntries(rotated.map((r) => [r.id, r.likes_count]))
          );

          // Traducem in fundal ce nu are inca traducere pentru limba curenta
          translateMissing(rows, language, (id, content, reference, pages) => {
            if (cancelled) return;
            setReels((prev) =>
              prev.map((r) =>
                r.id === id
                  ? {
                      ...r,
                      content,
                      reference: reference || r.reference,
                      manual_pages: pages ?? r.manual_pages,
                    }
                  : r
              )
            );
          });

          // Ce a apreciat deja utilizatorul curent
          if (user && rotated.length > 0) {
            const { data: likes } = await supabase
              .from('reel_likes')
              .select('reel_id')
              .eq('user_id', user.id)
              .in('reel_id', rotated.map((r) => r.id));

            if (!cancelled && likes) {
              setLikedIds(new Set(likes.map((l) => l.reel_id as string)));
            }
          } else if (!user && rotated.length > 0) {
            // Pasul 2208001: like-urile VIZITATORULUI, dupa id-ul anonim
            const guestId = getGuestId();
            if (guestId) {
              const { data: likes } = await supabase.rpc('guest_liked_reels', {
                p_guest_id: guestId,
              });
              if (!cancelled && Array.isArray(likes)) {
                setLikedIds(
                  new Set((likes as { reel_id: string }[]).map((l) => l.reel_id))
                );
              }
            }
          }
        }
      } catch (err) {
        console.debug('Reels load error:', err);
        if (!cancelled) setReels([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Blocam scroll-ul paginii cat timp modalul e deschis (fara scroll chaining)
  useBodyScrollLock(isOpen);

  // Pasul 2708009 — butonul „inapoi" al telefonului.
  // Inainte, reels-ul nu exista pentru browser: apasarea pe „inapoi" schimba
  // pagina din spate, iar reel-ul ramanea deschis peste ea. Acum, la
  // deschidere, punem un semn in istoric; „inapoi" il consuma pe acela si
  // inchide reel-ul, exact ca butonul X.
  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ radikalReels: true }, '');
    const onPop = () => onClose();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [isOpen, onClose]);

  // Inchiderea trece tot prin istoric, ca semnul pus la deschidere sa nu
  // ramana in urma si sa ceara o a doua apasare pe „inapoi".
  const requestClose = useCallback(() => {
    if (typeof window !== 'undefined' && (window.history.state as { radikalReels?: boolean } | null)?.radikalReels) {
      window.history.back();
    } else {
      onClose();
    }
  }, [onClose]);

  // Pasul 2708014 — ECRAN COMPLET cat esti in reels.
  // Doar in aplicatia instalata: intr-o fila de browser, Chrome ar arata
  // mesajul lui „Zum Beenden des Vollbildmodus…", pe care nu il putem opri.
  useAppFullscreen(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    // Navigare de la tastatura — utila mai ales in Desktop mode.
    // Nu afecteaza deloc comportamentul pe mobil (acolo se foloseste swipe/scroll).
    const scrollByOne = (direction: 1 | -1) => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollBy({ top: direction * el.clientHeight, behavior: 'smooth' });
    };

    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          requestClose();
          break;
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          scrollByOne(1);
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          scrollByOne(-1);
          break;
        case 'Home':
          e.preventDefault();
          scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        case 'End':
          e.preventDefault();
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, requestClose]);

  // Like / Unlike — optimist, cu revenire in caz de eroare
  const handleToggleLike = useCallback(
    async (reel: Reel) => {
      // Feedback haptic la like (pe telefoanele care il suporta)
      tapLight();

      const supabase = createClient();
      const wasLiked = likedIds.has(reel.id);

      // Pasul 2208001: VIZITATORII pot da like. Nu mai exista redirect catre
      // pagina de login (asta rupea sesiunea de vizitator). Folosim un id
      // anonim din localStorage + o functie SECURITY DEFINER in Postgres.
      const guestId = userId ? null : getGuestId();
      if (!userId && !guestId) return;

      // Actualizare optimista (UI instant)
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(reel.id);
        else next.add(reel.id);
        return next;
      });
      setLikeCounts((prev) => ({
        ...prev,
        [reel.id]: Math.max(0, (prev[reel.id] ?? 0) + (wasLiked ? -1 : 1)),
      }));

      try {
        if (!userId && guestId) {
          const { error } = await supabase.rpc('toggle_reel_like_guest', {
            p_reel_id: reel.id,
            p_guest_id: guestId,
          });
          if (error) throw error;
        } else if (wasLiked) {
          await supabase.from('reel_likes').delete().eq('reel_id', reel.id).eq('user_id', userId);
        } else {
          // upsert cu ignoreDuplicates -> niciodata 409 Conflict
          await supabase
            .from('reel_likes')
            .upsert({ reel_id: reel.id, user_id: userId }, { onConflict: 'reel_id,user_id', ignoreDuplicates: true });
        }
      } catch {
        // Revenim la starea anterioara daca serverul a refuzat
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(reel.id);
          else next.delete(reel.id);
          return next;
        });
        setLikeCounts((prev) => ({
          ...prev,
          [reel.id]: Math.max(0, (prev[reel.id] ?? 0) + (wasLiked ? 1 : -1)),
        }));
      }
    },
    [likedIds, userId, tapLight]
  );

  // `replace`, nu `push`: articolul ia locul semnului pus la deschiderea
  // reel-ului. Asa, „inapoi" din articol duce direct la pagina de unde ai
  // pornit, nu la o oprire goala intre ele.
  const handleOpenBlog = useCallback(
    (slug: string) => {
      onClose();
      router.replace(`/blogs/${slug}`);
    },
    [onClose, router]
  );

  const handleOpenTestimony = useCallback(
    (slug: string) => {
      onClose();
      router.replace(`/marturii/m/${slug}`);
    },
    [onClose, router]
  );

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9998] flex flex-col"
      style={{ backgroundColor: bgColor, color: textColor }}
      role="dialog"
      aria-modal="true"
      aria-label="Reels"
    >
      {/* Buton de inchidere.
          Pasul A12 — dispare cat timp esti in mod „freeze", ca sa nu apara
          in captura video. Revine cand derulezi la alt reel. */}
      {!isFrozen && (
      <button
        onClick={requestClose}
        aria-label={
          language === 'de' ? 'Schließen' :
          language === 'en' ? 'Close' :
          language === 'ro' ? 'Închide' : 'Закрыть'
        }
        className="absolute top-4 right-4 z-10 rounded-full p-3 transition-transform duration-200 hover:scale-110 active:scale-90"
        style={{ backgroundColor: bgTransparent, border: `1px solid ${borderColorLight}` }}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div
            className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: borderColorLight, borderTopColor: 'transparent' }}
          />
        </div>
      ) : reels.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-8">
          <p className="text-center text-lg" style={{ color: textVeryLight }}>
            {language === 'de' ? 'Noch keine Reels vorhanden.' :
             language === 'en' ? 'No reels yet.' :
             language === 'ro' ? 'Încă nu există reels.' : 'Пока нет реелсов.'}
          </p>
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto snap-y snap-mandatory overscroll-contain"
            style={{ scrollbarWidth: 'none' }}
          >
            {reels.map((reel) => (
              <div key={reel.id} className="h-full w-full">
                <ReelSlide
                  reel={reel}
                  isDark={isDark}
                  language={language}
                  isLiked={likedIds.has(reel.id)}
                  likeCount={likeCounts[reel.id] ?? 0}
                  reduceMotion={reduceMotion}
                  onToggleLike={handleToggleLike}
                  onOpenBlog={handleOpenBlog}
                  onOpenTestimony={handleOpenTestimony}
                  onActive={handleActive}
                  isAdmin={isAdmin}
                  onFreeze={handleFreeze}
                  chromeless={frozenId === reel.id}
                />
              </div>
            ))}
          </div>

          {/* Indiciu discret de derulare — ascuns in mod „freeze" (pasul A12) */}
          {!isFrozen && (
          <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
            <svg className="w-5 h-5 animate-bounce" viewBox="0 0 24 24" fill="none" stroke={textVeryLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          )}
        </>
      )}

      {/* Ascundem scrollbar-ul fara sa afectam alte componente */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
