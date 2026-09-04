'use client';

// =====================================================================
// Pasul 0409a — Editor de efecte pentru imagine (admin)
// =====================================================================
// Lista e strânsă: la început vezi doar numele efectelor. Când deschizi
// unul, reglajul lui apare chiar sub el, iar imaginea vine imediat
// dedesubt — reglaj și imagine, amândouă pe ecran, fără derulare.
// Imaginea arată de fiecare dată TOATE efectele alese până atunci, nu
// doar pe cel deschis.
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

/** Cheia unui rând: un efect, sau reglajul de opacitate al imaginii. */
type RowKey = keyof ImageEffectSettings | 'backgroundOpacity';

interface EffectRow {
  key: RowKey;
  /** Bifa care pornește efectul. Lipsește la opacitate, care e mereu activă. */
  toggle?: keyof ImageEffectSettings;
  label: string;
  /** Reglajul care se deschide sub rând. */
  slider: {
    field: keyof ImageEffectSettings;
    label: (v: number) => string;
    min: number;
    max: number;
    fallback: number;
  } | null;
  note?: string;
}

const ROWS: EffectRow[] = [
  {
    key: 'effectNoise',
    toggle: 'effectNoise',
    label: 'Noise (zgomot fin)',
    slider: { field: 'noiseIntensity', label: (v) => `Intensitate noise: ${v}%`, min: 0, max: 100, fallback: 35 },
  },
  {
    key: 'effectGrain',
    toggle: 'effectGrain',
    label: 'Grain (granulație dinamică)',
    slider: { field: 'grainOpacity', label: (v) => `Opacitate grain: ${v}%`, min: 0, max: 100, fallback: 25 },
  },
  {
    key: 'effectSepia',
    toggle: 'effectSepia',
    label: 'Sepia',
    slider: { field: 'sepiaIntensity', label: (v) => `Intensitate sepia: ${v}%`, min: 0, max: 100, fallback: 12 },
  },
  {
    key: 'effectVignette',
    toggle: 'effectVignette',
    label: 'Vignette',
    slider: { field: 'vignetteIntensity', label: (v) => `Intensitate vignette: ${v}%`, min: 0, max: 100, fallback: 45 },
  },
  {
    key: 'effectBw',
    toggle: 'effectBw',
    label: 'Alb-negru',
    slider: { field: 'bwIntensity', label: (v) => `Cât de puternic alb-negru: ${v}%`, min: 0, max: 100, fallback: 50 },
    note: 'Mai puțin = blând și cenușiu. Mai mult = dur și contrastant.',
  },
  {
    key: 'effectBloom',
    toggle: 'effectBloom',
    label: 'Halation (lumini difuze)',
    slider: { field: 'bloomIntensity', label: (v) => `Intensitate halation: ${v}%`, min: 0, max: 100, fallback: 50 },
  },
  {
    key: 'effectLetterbox',
    toggle: 'effectLetterbox',
    label: 'Bare de film',
    slider: { field: 'letterboxSize', label: (v) => `Lățimea barelor: ${v}%`, min: 2, max: 20, fallback: 8 },
  },
  {
    key: 'effectLightLeak',
    toggle: 'effectLightLeak',
    label: 'Scurgere de lumină',
    slider: { field: 'lightLeakIntensity', label: (v) => `Intensitate scurgere: ${v}%`, min: 0, max: 100, fallback: 50 },
  },
];

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
  const [showBig, setShowBig] = React.useState(false);
  const [openKey, setOpenKey] = React.useState<RowKey | null>(null);

  const set = <K extends keyof ImageEffectSettings>(k: K, v: ImageEffectSettings[K]) =>
    onChange({ ...value, [k]: v });

  const labelClass =
    'block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1';
  const rangeClass = 'w-full accent-black dark:accent-white';

  const hasOpacity = typeof backgroundOpacity === 'number' && Boolean(onBackgroundOpacityChange);

  /** Imaginea, cu toate efectele bifate până acum. */
  const preview = (
    <div
      className="relative mx-auto w-full overflow-hidden rounded-xl bg-black"
      style={{
        aspectRatio: previewAspect.replace('/', ' / '),
        maxHeight: '34vh',
        maxWidth: previewAspect === '9/16' ? '190px' : '100%',
      }}
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
            opacity: typeof backgroundOpacity === 'number' ? backgroundOpacity / 100 : 1,
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-white/50">
          Adaugă o imagine ca să vezi efectele
        </div>
      )}
      <ImageEffectLayers settings={value} zIndex={2} />
    </div>
  );

  /** Rândul deschis arată reglajul, apoi imaginea, apoi butonul de mărire. */
  const openPanel = (
    slider: EffectRow['slider'],
    note: string | undefined,
    opacityRow: boolean,
  ) => (
    <div className="border-t border-black/10 px-3 pb-3 pt-3 dark:border-white/10">
      {opacityRow && hasOpacity ? (
        <div className="mb-3">
          <label className={labelClass}>Opacitate imagine: {backgroundOpacity}%</label>
          <input
            type="range"
            min={0}
            max={100}
            value={backgroundOpacity}
            onChange={(e) => onBackgroundOpacityChange?.(Number(e.target.value))}
            className={rangeClass}
          />
        </div>
      ) : slider ? (
        <div className="mb-3">
          <label className={labelClass}>
            {slider.label((value[slider.field] as number) ?? slider.fallback)}
          </label>
          <input
            type="range"
            min={slider.min}
            max={slider.max}
            value={(value[slider.field] as number) ?? slider.fallback}
            onChange={(e) => set(slider.field, Number(e.target.value) as never)}
            className={rangeClass}
          />
          {note && <p className="mt-1 text-[11px] text-black/40 dark:text-white/40">{note}</p>}
        </div>
      ) : null}

      {preview}

      {imageUrl && (
        <button
          type="button"
          onClick={() => setShowBig(true)}
          className="mt-2 w-full rounded-lg border border-black/15 px-3 py-2 text-xs font-medium text-black/70 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10"
        >
          Vezi cum arată, mare
        </button>
      )}
    </div>
  );

  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <p className="mb-1 text-sm font-semibold text-black dark:text-white">{title}</p>
      {hint && <p className="mb-3 text-xs text-black/50 dark:text-white/50">{hint}</p>}

      <div className="space-y-1.5">
        {ROWS.map((row) => {
          const on = Boolean(row.toggle && value[row.toggle]);
          const open = openKey === row.key;

          return (
            <div
              key={String(row.key)}
              className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10"
            >
              <div className="flex items-center gap-2 px-3 py-2">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => {
                    if (row.toggle) set(row.toggle, e.target.checked as never);
                    // Bifarea deschide singură reglajul: nu mai cauți nimic.
                    setOpenKey(e.target.checked ? row.key : null);
                  }}
                  className="h-4 w-4 flex-shrink-0 accent-black dark:accent-white"
                  aria-label={row.label}
                />
                <button
                  type="button"
                  onClick={() => setOpenKey(open ? null : row.key)}
                  className="flex flex-1 items-center justify-between gap-2 text-left text-sm text-black dark:text-white"
                >
                  <span className={on ? 'font-medium' : 'opacity-60'}>{row.label}</span>
                  <span className="flex-shrink-0 text-xs text-black/40 dark:text-white/40">
                    {open ? '▾' : '▸'}
                  </span>
                </button>
              </div>

              {open && openPanel(row.slider, row.note, false)}
            </div>
          );
        })}

        {hasOpacity && (
          <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={() =>
                setOpenKey(openKey === 'backgroundOpacity' ? null : 'backgroundOpacity')
              }
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-black dark:text-white"
            >
              <span className="font-medium">Opacitate imagine: {backgroundOpacity}%</span>
              <span className="text-xs text-black/40 dark:text-white/40">
                {openKey === 'backgroundOpacity' ? '▾' : '▸'}
              </span>
            </button>
            {openKey === 'backgroundOpacity' && openPanel(null, undefined, true)}
          </div>
        )}
      </div>

      {/* Când nu e nimic deschis, imaginea rămâne totuși la vedere. */}
      {openKey === null && <div className="mt-3">{preview}</div>}

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
                opacity: typeof backgroundOpacity === 'number' ? backgroundOpacity / 100 : 1,
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
