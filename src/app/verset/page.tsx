'use client';

// Pasul 2708020 — „Un verset zilnic".
// Arată ca un reel, dar nu se derulează: un singur ecran, versetul zilei.
// Doar butonul X și butonul de trimitere mai departe. Fără aprecieri.
// Dacă azi nu ai scris niciun verset, apare „Se actualizează".

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { useHaptic } from '@/hooks/useHaptic';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getSupabaseClient } from '@/lib/supabase';
import { useAppFullscreen } from '@/lib/appFullscreen';
import { fetchEnabledPages } from '@/lib/pageSettings';
import ImageEffectLayers, { effectsFilter, type ImageEffectSettings } from '@/components/ImageEffectLayers';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface VerseRow {
  id: string;
  for_day: string;
  content_ro: string;
  reference_ro: string | null;
  background_image_url: string | null;
  background_opacity: number | null;
  audio_url: string | null;
  text_color: 'auto' | 'light' | 'dark' | null;
  [key: string]: unknown;
}

const T: Record<string, { updating: string; close: string; share: string; copied: string }> = {
  de: { updating: 'Wird aktualisiert', close: 'Schließen', share: 'Teilen', copied: 'Link kopiert' },
  en: { updating: 'Updating', close: 'Close', share: 'Share', copied: 'Link copied' },
  ro: { updating: 'Se actualizează', close: 'Închide', share: 'Trimite', copied: 'Link copiat' },
  ru: { updating: 'Обновляется', close: 'Закрыть', share: 'Поделиться', copied: 'Ссылка скопирована' },
};

/** Ziua de azi, în felul în care o ține baza de date (fără ora). */
function today(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function DailyVersePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { tapLight } = useHaptic();
  const { reduced: reduceMotion } = useReducedMotion();
  const lang = ['ro', 'de', 'en', 'ru'].includes(language) ? language : 'de';
  const t = T[lang];

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [verse, setVerse] = useState<VerseRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareMsg, setShareMsg] = useState('');

  useAppFullscreen(true);

  useEffect(() => {
    let alive = true;
    fetchEnabledPages().then((on) => {
      if (!alive) return;
      const ok = on.has('verset');
      setAllowed(ok);
      if (!ok) router.replace('/');
    });
    return () => {
      alive = false;
    };
  }, [router]);

  useEffect(() => {
    if (!allowed) return;
    let alive = true;
    (async () => {
      try {
        const { data } = await getSupabaseClient()
          .from('daily_verses')
          .select('*')
          .eq('for_day', today())
          .eq('published', true)
          .maybeSingle();
        if (alive) setVerse((data as unknown as VerseRow) ?? null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [allowed]);

  // Textul în limba cititorului: al tău dacă l-ai scris, altfel originalul.
  const text = useMemo(() => {
    if (!verse) return '';
    const mine = verse[`content_${lang}`];
    if (typeof mine === 'string' && mine.trim()) return mine.trim();
    return verse.content_ro || '';
  }, [verse, lang]);

  const reference = useMemo(() => {
    if (!verse) return '';
    const mine = verse[`reference_${lang}`];
    if (typeof mine === 'string' && mine.trim()) return mine.trim();
    return verse.reference_ro || '';
  }, [verse, lang]);

  const words = useMemo(() => text.split(' ').filter(Boolean), [text]);

  const wordsRef = React.useRef<(HTMLSpanElement | null)[]>([]);
  const citeRef = React.useRef<HTMLElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const live = wordsRef.current.filter((w): w is HTMLSpanElement => Boolean(w?.isConnected));
      if (live.length === 0) return;

      if (reduceMotion) {
        gsap.set(live, { opacity: 1, filter: 'blur(0px)', y: 0 });
        if (citeRef.current) gsap.set(citeRef.current, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(live, { opacity: 0, filter: 'blur(10px)', y: 8 });
      if (citeRef.current) gsap.set(citeRef.current, { opacity: 0, y: 15 });

      const tl = gsap.timeline();
      tl.to(live, {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: 0.8,
        stagger: { each: 0.14, ease: 'power1.inOut' },
        ease: 'power2.out',
      });
      if (citeRef.current) {
        tl.to(citeRef.current, { opacity: 1, y: 0, duration: 1.1, ease: 'power2.out' }, '-=0.6');
      }
    },
    { scope: rootRef, dependencies: [text, reference, reduceMotion] },
  );

  const handleShare = useCallback(async () => {
    tapLight();
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: reference || 'RADIKAL', text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMsg(t.copied);
      setTimeout(() => setShareMsg(''), 2500);
    } catch {
      /* utilizatorul a renunțat */
    }
  }, [tapLight, reference, text, t.copied]);

  const handleClose = useCallback(() => {
    tapLight();
    router.push('/');
  }, [router, tapLight]);

  if (allowed === null || allowed === false) return null;

  // Fundalul este mereu întunecat, ca la reels.
  const forced = verse?.text_color && verse.text_color !== 'auto' ? verse.text_color : null;
  const lightText = forced ? forced === 'light' : true;
  const textColor = lightText ? '#ffffff' : '#000000';
  const textLight = lightText ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';

  const effects: ImageEffectSettings = {
    effectNoise: Boolean(verse?.effect_noise),
    effectGrain: Boolean(verse?.effect_grain),
    grainOpacity: (verse?.grain_opacity as number) ?? 25,
    effectSepia: Boolean(verse?.effect_sepia),
    sepiaIntensity: (verse?.sepia_intensity as number) ?? 12,
    effectVignette: Boolean(verse?.effect_vignette),
    vignetteIntensity: (verse?.vignette_intensity as number) ?? 45,
    effectBw: Boolean(verse?.effect_bw),
    effectBloom: Boolean(verse?.effect_bloom),
    effectLetterbox: Boolean(verse?.effect_letterbox),
    effectLightLeak: Boolean(verse?.effect_light_leak),
  };

  return (
    <div
      ref={rootRef}
      className="force-white-text fixed inset-0 z-[9998] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#000000', color: textColor }}
      role="dialog"
      aria-modal="true"
    >
      {verse?.background_image_url && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${verse.background_image_url})`,
              opacity: Math.min(100, Math.max(0, verse.background_opacity ?? 15)) / 100,
              filter: [
                `brightness(${(verse.image_brightness as number) ?? 100}%)`,
                `contrast(${(verse.image_contrast as number) ?? 100}%)`,
                `blur(${(verse.image_blur as number) ?? 0}px)`,
                effectsFilter(effects),
              ]
                .filter(Boolean)
                .join(' '),
            }}
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <ImageEffectLayers settings={effects} />
          </div>
        </>
      )}

      {/* Butonul de închidere — singurul cu cerc, ca la reels */}
      <button
        onClick={handleClose}
        aria-label={t.close}
        className="absolute right-4 top-4 z-20 rounded-full p-3 transition-transform duration-200 hover:scale-110 active:scale-90"
        style={{
          backgroundColor: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
        }}
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="1.8" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Trimite mai departe */}
      <div className="absolute bottom-24 right-3 z-20 flex flex-col items-center gap-1 sm:right-5">
        <button
          onClick={handleShare}
          aria-label={t.share}
          className="flex flex-col items-center gap-0.5 rounded-full p-2 transition-transform duration-200 hover:scale-110 active:scale-90"
          style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.55))' }}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span className="text-[10px] font-semibold" style={{ color: textLight }}>
            {t.share}
          </span>
        </button>
        {shareMsg && (
          <span className="whitespace-nowrap text-[10px]" style={{ color: textLight }}>
            {shareMsg}
          </span>
        )}
      </div>

      <div className="pointer-events-none relative z-10 mx-auto w-full max-w-2xl px-14 text-center sm:px-20">
        {loading ? null : !verse || !text.trim() ? (
          <p className="font-cinzel text-2xl italic md:text-3xl" style={{ color: textColor }}>
            {t.updating}
          </p>
        ) : (
          <>
            <blockquote
              className="flex flex-wrap items-center justify-center font-cinzel text-2xl italic leading-relaxed md:text-3xl lg:text-4xl"
              style={{ color: textColor, borderLeft: 'none', paddingLeft: 0 }}
            >
              {words.map((word, index) => (
                <span
                  key={index}
                  ref={(el) => {
                    wordsRef.current[index] = el;
                  }}
                  className={`mx-1 inline-block tracking-wider${lightText ? '' : ' text-black'}`}
                  style={{ opacity: 0, willChange: 'opacity, filter, transform' }}
                >
                  {word}
                </span>
              ))}
            </blockquote>

            {reference && (
              <cite
                ref={citeRef}
                className="mt-8 block font-cinzel text-lg font-medium not-italic md:text-xl"
                style={{ color: textLight, opacity: 0 }}
              >
                — {reference}
              </cite>
            )}
          </>
        )}
      </div>
    </div>
  );
}
