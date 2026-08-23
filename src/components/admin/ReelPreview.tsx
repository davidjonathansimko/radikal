// Pasul 2108002 — previzualizare live a unui reel
//
// Arata exact cum va arata reel-ul: imaginea de fundal cu opacitatea aleasa,
// granulatia, sepia si vignetarea, plus textul peste ele.
// Se randeaza doar in panoul de admin.

'use client';

import React from 'react';

interface ReelPreviewProps {
  content: string;
  reference: string;
  backgroundImageUrl: string;
  backgroundOpacity: number;
  effectNoise: boolean;
  /** Pasul 2208001 — granulație DINAMICĂ, separată de noise */
  effectGrain?: boolean;
  grainOpacity?: number;
  effectSepia: boolean;
  effectVignette: boolean;
  sepiaIntensity: number;
  vignetteIntensity: number;
  // Pasul 2308005 (E) — efecte cinematice noi (optionale)
  effectBw?: boolean;
  effectBloom?: boolean;
  effectLetterbox?: boolean;
  effectLightLeak?: boolean;
}

export default function ReelPreview({
  content,
  reference,
  backgroundImageUrl,
  backgroundOpacity,
  effectNoise,
  effectGrain = false,
  grainOpacity = 25,
  effectSepia,
  effectVignette,
  sepiaIntensity,
  vignetteIntensity,
  effectBw = false,
  effectBloom = false,
  effectLetterbox = false,
  effectLightLeak = false,
}: ReelPreviewProps) {
  // Pasul 2308005 (E): filtrul imaginii combina alb-negru + sepia
  const previewFilter = (() => {
    const parts: string[] = [];
    if (effectBw) parts.push('grayscale(1)', 'contrast(1.12)', 'brightness(1.02)');
    if (effectSepia) parts.push(`sepia(${sepiaIntensity}%)`);
    return parts.length ? parts.join(' ') : undefined;
  })();

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
        Previzualizare
      </p>

      <div
        className="relative mx-auto overflow-hidden rounded-2xl bg-black"
        style={{ width: '100%', maxWidth: 260, aspectRatio: '9 / 16' }}
      >
        {/* Imaginea de fundal */}
        {backgroundImageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${backgroundImageUrl})`,
              opacity: backgroundOpacity / 100,
              filter: previewFilter,
            }}
          />
        )}

        {/* Granulatie */}
        {effectNoise && <div className="reel-noise absolute inset-0 pointer-events-none" />}

        {/* Pasul 2208001 — grain dinamic (film) */}
        {effectGrain && (
          <div
            className="dynamic-grain"
            style={{ ['--grain-opacity' as string]: String(grainOpacity / 100) }}
          />
        )}

        {/* Vignetare — intensitate reglabila */}
        {effectVignette && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,${
                vignetteIntensity / 100
              }) 100%)`,
            }}
          />
        )}

        {/* Pasul 2308005 (E) — bloom, light leak si bare cinema */}
        {effectBloom && <div className="cine-bloom" />}
        {effectLightLeak && <div className="cine-light-leak" />}
        {effectLetterbox && (
          <>
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-[8%] bg-black" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[8%] bg-black" />
          </>
        )}

        {/* Textul */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <p
            className="font-cinzel text-[11px] leading-relaxed text-white"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}
          >
            {content.trim() ? content.slice(0, 180) : 'Textul reel-ului apare aici…'}
          </p>
          {reference.trim() && (
            <p
              className="font-cinzel mt-3 text-[9px] font-semibold tracking-wide text-white/80"
              style={{ textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}
            >
              {reference}
            </p>
          )}
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-black/45 dark:text-white/45">
        Modificările se văd instantaneu
      </p>
    </div>
  );
}
