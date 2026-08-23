'use client';

// =====================================================================
// Pasul 2208001 — Editor de efecte pentru imagine (admin)
// =====================================================================
// Aceleasi optiuni ca la reels, dar pentru articole:
//   sepia · vignette · noise · grain   (noise si grain sunt SEPARATE,
//   deci poti alege doar unul sau amandoua deodata)
// Cu previzualizare LIVE pe imaginea reala a articolului.
// =====================================================================

import React from 'react';
import ImageEffectLayers, {
  effectsFilter,
  type ImageEffectSettings,
} from '@/components/ImageEffectLayers';

interface ImageEffectsEditorProps {
  title: string;
  hint?: string;
  imageUrl: string;
  value: ImageEffectSettings;
  onChange: (next: ImageEffectSettings) => void;
  /** Opacitatea imaginii (folosita doar la modalul „Play Blog") */
  backgroundOpacity?: number;
  onBackgroundOpacityChange?: (v: number) => void;
  /** Aspectul previzualizarii: articolul e lat, modalul e 9:16 */
  previewAspect?: '16/9' | '9/16';
}

export default function ImageEffectsEditor({
  title,
  hint,
  imageUrl,
  value,
  onChange,
  backgroundOpacity,
  onBackgroundOpacityChange,
  previewAspect = '16/9',
}: ImageEffectsEditorProps) {
  // Pasul 2308006-E — fereastra mare de previzualizare („Vezi cum arată")
  const [showBig, setShowBig] = React.useState(false);

  const set = <K extends keyof ImageEffectSettings>(k: K, v: ImageEffectSettings[K]) =>
    onChange({ ...value, [k]: v });

  const labelClass =
    'block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1';
  const rangeClass = 'w-full accent-black dark:accent-white disabled:opacity-40';

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
      <p className="text-sm font-semibold text-black dark:text-white mb-1">{title}</p>
      {hint && <p className="text-xs text-black/50 dark:text-white/50 mb-3">{hint}</p>}

      <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
        {/* --------- Setari --------- */}
        <div className="grid gap-4 sm:grid-cols-2 min-w-0">
          <div className="sm:col-span-2 flex flex-wrap gap-5">
            {([
              ['Noise (zgomot fin)', 'effectNoise'],
              ['Grain (granulație dinamică)', 'effectGrain'],
              ['Sepia', 'effectSepia'],
              ['Vignette', 'effectVignette'],
              // Pasul 2308005 (E) — efecte noi, discrete și profesionale
              ['Alb-negru', 'effectBw'],
              ['Halation (lumini difuze)', 'effectBloom'],
              ['Bare de film', 'effectLetterbox'],
              ['Scurgere de lumină', 'effectLightLeak'],
            ] as const).map(([label, key]) => (
              <label
                key={key}
                className="flex items-center gap-2 text-sm text-black dark:text-white cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={Boolean(value[key])}
                  onChange={(e) => set(key, e.target.checked)}
                  className="h-4 w-4 accent-black dark:accent-white"
                />
                {label}
              </label>
            ))}
          </div>

          {/* -----------------------------------------------------------
              Pasul 2308006-E — REGLAJELE.
              Fiecare slider apare DOAR daca efectul lui este bifat.
              Inainte erau toate mereu pe ecran, doar „stinse", si nu se
              intelegea care la ce foloseste. Acum lista creste odata cu
              ce alegi tu — vezi doar ce te priveste.
              ----------------------------------------------------------- */}

          {value.effectSepia && (
            <div>
              <label className={labelClass}>Intensitate sepia: {value.sepiaIntensity}%</label>
              <input
                type="range" min={0} max={100}
                value={value.sepiaIntensity}
                onChange={(e) => set('sepiaIntensity', Number(e.target.value))}
                className={rangeClass}
              />
            </div>
          )}

          {value.effectVignette && (
            <div>
              <label className={labelClass}>Intensitate vignette: {value.vignetteIntensity}%</label>
              <input
                type="range" min={0} max={100}
                value={value.vignetteIntensity}
                onChange={(e) => set('vignetteIntensity', Number(e.target.value))}
                className={rangeClass}
              />
            </div>
          )}

          {value.effectGrain && (
            <div>
              <label className={labelClass}>Opacitate grain: {value.grainOpacity}%</label>
              <input
                type="range" min={0} max={100}
                value={value.grainOpacity}
                onChange={(e) => set('grainOpacity', Number(e.target.value))}
                className={rangeClass}
              />
            </div>
          )}

          {value.effectNoise && (
            <div>
              <label className={labelClass}>
                Intensitate noise: {value.noiseIntensity ?? 35}%
              </label>
              <input
                type="range" min={0} max={100}
                value={value.noiseIntensity ?? 35}
                onChange={(e) => set('noiseIntensity', Number(e.target.value))}
                className={rangeClass}
              />
            </div>
          )}

          {value.effectBw && (
            <div>
              <label className={labelClass}>
                Cât de puternic alb-negru: {value.bwIntensity ?? 50}%
              </label>
              <input
                type="range" min={0} max={100}
                value={value.bwIntensity ?? 50}
                onChange={(e) => set('bwIntensity', Number(e.target.value))}
                className={rangeClass}
              />
              <p className="mt-1 text-[11px] text-black/40 dark:text-white/40">
                Mai puțin = blând și cenușiu. Mai mult = dur și contrastant.
              </p>
            </div>
          )}

          {value.effectBloom && (
            <div>
              <label className={labelClass}>
                Intensitate halation: {value.bloomIntensity ?? 50}%
              </label>
              <input
                type="range" min={0} max={100}
                value={value.bloomIntensity ?? 50}
                onChange={(e) => set('bloomIntensity', Number(e.target.value))}
                className={rangeClass}
              />
            </div>
          )}

          {value.effectLightLeak && (
            <div>
              <label className={labelClass}>
                Intensitate scurgere de lumină: {value.lightLeakIntensity ?? 50}%
              </label>
              <input
                type="range" min={0} max={100}
                value={value.lightLeakIntensity ?? 50}
                onChange={(e) => set('lightLeakIntensity', Number(e.target.value))}
                className={rangeClass}
              />
            </div>
          )}

          {value.effectLetterbox && (
            <div>
              <label className={labelClass}>
                Lățimea barelor de film: {value.letterboxSize ?? 8}%
              </label>
              <input
                type="range" min={2} max={20}
                value={value.letterboxSize ?? 8}
                onChange={(e) => set('letterboxSize', Number(e.target.value))}
                className={rangeClass}
              />
            </div>
          )}

          {typeof backgroundOpacity === 'number' && onBackgroundOpacityChange && (
            <div>
              <label className={labelClass}>Opacitate imagine: {backgroundOpacity}%</label>
              <input
                type="range" min={0} max={100}
                value={backgroundOpacity}
                onChange={(e) => onBackgroundOpacityChange(Number(e.target.value))}
                className={rangeClass}
              />
            </div>
          )}
        </div>

        {/* --------- Previzualizare live (miniatura) --------- */}
        <div className={previewAspect === '9/16' ? 'lg:w-[200px]' : 'lg:w-[280px]'}>
          <p className={labelClass}>Previzualizare</p>
          <div
            className="relative overflow-hidden rounded-xl bg-black"
            style={{ aspectRatio: previewAspect.replace('/', ' / ') }}
          >
            {imageUrl ? (
              // Imagine simpla (<img>) — este doar preview in admin, nu pagina publica.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Previzualizare efecte"
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  filter: effectsFilter(value),
                  opacity:
                    typeof backgroundOpacity === 'number' ? backgroundOpacity / 100 : 1,
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-white/50 px-3 text-center">
                Adaugă o imagine ca să vezi efectele
              </div>
            )}

            <ImageEffectLayers settings={value} zIndex={2} />
          </div>

          {/* Pasul 2308006-E — miniatura e mica si nu se vede bine cat de
              tare e un efect. Butonul asta deschide aceeasi imagine mare,
              pe tot ecranul, cu exact aceleasi reglaje. */}
          {imageUrl && (
            <button
              type="button"
              onClick={() => setShowBig(true)}
              className="mt-2 w-full rounded-lg border border-black/15 dark:border-white/20 px-3 py-2 text-xs font-medium text-black/70 dark:text-white/70 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              Vezi cum arată
            </button>
          )}
        </div>
      </div>

      {/* --------- Previzualizare MARE, pe tot ecranul --------- */}
      {showBig && imageUrl && (
        <div
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={() => setShowBig(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Previzualizare efecte pe tot ecranul"
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black"
            style={{ aspectRatio: previewAspect.replace('/', ' / ') }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Previzualizare efecte, mărime mare"
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                filter: effectsFilter(value),
                opacity:
                  typeof backgroundOpacity === 'number' ? backgroundOpacity / 100 : 1,
              }}
            />
            <ImageEffectLayers settings={value} zIndex={2} />
          </div>

          <button
            type="button"
            onClick={() => setShowBig(false)}
            className="mt-4 rounded-lg border border-white/25 px-5 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            Închide
          </button>
          <p className="mt-2 text-xs text-white/40">
            Apasă oriunde în afara imaginii ca să închizi.
          </p>
        </div>
      )}
    </div>
  );
}
