'use client';

// =====================================================================
// Pasul 2208001 — Straturi de efecte peste o imagine
// =====================================================================
// Acelasi set de efecte ca la reels:
//   • sepia      (intensitate reglabila)
//   • vignette   (intensitate reglabila)
//   • noise      (zgomot fin, static-ish)
//   • grain      (granulatie DINAMICA, ca la film — separat de noise!)
//
// Se foloseste in 3 locuri:
//   1. previzualizarea din admin la crearea articolului
//   2. imaginea articolului pe pagina publica
//   3. fundalul modalului „Play Blog"
//
// IMPORTANT: toate straturile au `pointer-events: none`, deci NU acopera
// niciodata butoanele, bara de progres sau share-ul.
// =====================================================================

import React from 'react';

export interface ImageEffectSettings {
  effectNoise: boolean;
  effectGrain: boolean;
  effectSepia: boolean;
  effectVignette: boolean;
  sepiaIntensity: number;    // 0–100
  vignetteIntensity: number; // 0–100
  grainOpacity: number;      // 0–100

  // ---------------------------------------------------------------
  // Pasul 2308005 (E) — efecte noi, alese sa fie DISCRETE si serioase.
  // Toate sunt optionale: daca lipsesc din baza de date, sunt `false`
  // si nimic nu se schimba fata de inainte.
  // ---------------------------------------------------------------
  /** Alb-negru cinematografic (contrast usor ridicat, nu doar desaturare) */
  effectBw?: boolean;
  /** „Halation": luminile calde se difuzeaza usor, ca pe pelicula */
  effectBloom?: boolean;
  /** Bare negre sus/jos, format de film */
  effectLetterbox?: boolean;
  /** Scurgere de lumina calda dintr-un colt, foarte subtila */
  effectLightLeak?: boolean;

  // ---------------------------------------------------------------
  // Pasul 2308006-E — INTENSITATEA fiecarui efect.
  //
  // Inainte doar sepia, vignette si grain aveau reglaj. Restul erau
  // „pornit / oprit", deci alb-negrul era mereu la fel de dur, iar
  // halation-ul mereu la fel de puternic.
  //
  // Toate sunt optionale si au o valoare implicita EGALA cu cea folosita
  // pana acum. Asa, articolele deja salvate arata exact la fel.
  // ---------------------------------------------------------------
  /** Cat de tare se vede zgomotul fin (0–100). Implicit 35. */
  noiseIntensity?: number;
  /** Cat de „strident" e alb-negrul: contrastul (0–100). Implicit 50. */
  bwIntensity?: number;
  /** Cat de puternic e halo-ul cald (0–100). Implicit 50. */
  bloomIntensity?: number;
  /** Cat de late sunt barele de film, in procente din inaltime. Implicit 8. */
  letterboxSize?: number;
  /** Cat de vizibila e scurgerea de lumina (0–100). Implicit 50. */
  lightLeakIntensity?: number;
}

export const DEFAULT_IMAGE_EFFECTS: ImageEffectSettings = {
  effectNoise: false,
  effectGrain: false,
  effectSepia: false,
  effectVignette: false,
  sepiaIntensity: 12,
  vignetteIntensity: 45,
  grainOpacity: 25,
  effectBw: false,
  effectBloom: false,
  effectLetterbox: false,
  effectLightLeak: false,
  // Pasul 2308006-E — valorile implicite sunt EXACT cele folosite pana acum,
  // ca articolele deja salvate sa arate neschimbat.
  noiseIntensity: 35,
  bwIntensity: 50,
  bloomIntensity: 50,
  letterboxSize: 8,
  lightLeakIntensity: 50,
};

/* -------------------------------------------------------------------------
 * Pasul 2308006-E — ajutoare mici, ca sa nu se repete acelasi cod
 * ------------------------------------------------------------------------- */

/** Ia valoarea daca exista, altfel cea implicita. Mereu intre 0 si 100. */
function level(value: number | undefined, fallback: number): number {
  const v = typeof value === 'number' ? value : fallback;
  return Math.min(100, Math.max(0, v));
}

/**
 * Filtrul CSS pentru imaginea de dedesubt.
 * Se pot combina: alb-negru + sepia da un ton cald monocrom, foarte frumos.
 */
export function effectsFilter(s: ImageEffectSettings): string | undefined {
  const parts: string[] = [];

  if (s.effectBw) {
    // Nu doar `grayscale`: adaugam putin contrast, altfel alb-negrul
    // arata plat si spalacit.
    //
    // Pasul 2308006-E: cat de „strident" e alb-negrul se regleaza acum din
    // slider. La 0 e bland si cenusiu, la 100 e dur si contrastant.
    // Valoarea 50 da exact ce era inainte (contrast 1.12).
    const bw = level(s.bwIntensity, 50);
    const contrast = (1 + (bw / 100) * 0.48).toFixed(3);   // 1.00 … 1.48
    const brightness = (1 + (bw / 100) * 0.04).toFixed(3); // 1.00 … 1.04
    parts.push('grayscale(1)', `contrast(${contrast})`, `brightness(${brightness})`);
  }
  if (s.effectSepia) parts.push(`sepia(${s.sepiaIntensity}%)`);

  return parts.length ? parts.join(' ') : undefined;
}

interface ImageEffectLayersProps {
  settings: ImageEffectSettings;
  /** z-index de baza al straturilor (butoanele trebuie sa fie peste) */
  zIndex?: number;
  className?: string;
}

export default function ImageEffectLayers({
  settings,
  zIndex = 1,
  className = '',
}: ImageEffectLayersProps) {
  const {
    effectNoise, effectGrain, effectVignette, vignetteIntensity, grainOpacity,
    effectBloom, effectLetterbox, effectLightLeak,
  } = settings;

  // Pasul 2308006-E — intensitatile reglabile (cu valorile de dinainte
  // ca implicite, deci nimic nu se schimba la articolele vechi).
  const noiseLevel = level(settings.noiseIntensity, 35);
  const bloomLevel = level(settings.bloomIntensity, 50);
  const leakLevel = level(settings.lightLeakIntensity, 50);
  const barSize = Math.min(20, Math.max(2, settings.letterboxSize ?? 8));

  if (
    !effectNoise && !effectGrain && !effectVignette &&
    !effectBloom && !effectLetterbox && !effectLightLeak
  ) return null;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ zIndex }}
    >
      {effectNoise && (
        // Pasul 2308001: clasa `.reel-noise` isi pune singura pozitia si
        // dimensiunea (mai mare decat imaginea), ca sa nu mai apara marginile
        // patratoase cand boabele se misca. Aici doar reglam intensitatea.
        // Pasul 2308006-E: intensitatea vine din slider (implicit 35%).
        <div className="reel-noise" style={{ opacity: noiseLevel / 100 }} />
      )}

      {effectGrain && (
        <div
          className="dynamic-grain"
          style={{ ['--grain-opacity' as string]: String(grainOpacity / 100) }}
        />
      )}

      {effectVignette && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${
              vignetteIntensity / 100
            }) 100%)`,
          }}
        />
      )}

      {/* --- Pasul 2308005 (E): efecte noi --- */}

      {/* Halation: luminile calde „respira" usor, ca pe pelicula.
          Se aplica peste tot, dar `screen` il face vizibil DOAR
          acolo unde imaginea e deja luminoasa.
          Pasul 2308006-E: puterea halo-ului vine din slider. */}
      {effectBloom && (
        <div className="cine-bloom" style={{ opacity: bloomLevel / 50 }} />
      )}

      {/* Scurgere de lumina dintr-un colt — foarte discreta, se misca lent.
          Pasul 2308006-E: cat de vizibila este se regleaza din slider. */}
      {effectLightLeak && (
        <div className="cine-light-leak" style={{ opacity: leakLevel / 50 }} />
      )}

      {/* Bare de film sus si jos. Ultimul, ca sa fie peste toate.
          Pasul 2308006-E: latimea barelor este reglabila (2–20%). */}
      {effectLetterbox && (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 bg-black"
            style={{ height: `${barSize}%` }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 bg-black"
            style={{ height: `${barSize}%` }}
          />
        </>
      )}
    </div>
  );
}
