'use client';

// Setari de aspect alese din admin (tabelul `site_content`, cheia `ui_settings`):
// comportamentul si stilul barii de jos, efectul schimbarii temei si al limbii, iconite animate sau statice.

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export type BarBehavior = 'always' | 'slide' | 'idle' | 'shrink' | 'fade' | 'articles';
export type BarStyle = 'pill' | 'edge' | 'edgeglass' | 'glass' | 'minimal' | 'dock';
export type ThemeFx = 'fade' | 'circle' | 'wipe' | 'curtain' | 'shake' | 'dissolve' | 'zoom';
export type LangFx = 'shake' | 'fade' | 'none';

export interface UiSettings {
  barBehavior: BarBehavior;
  barStyle: BarStyle;
  themeFx: ThemeFx;
  langFx: LangFx;
  /** Iconitele din bara de jos se misca (soare care se invarte, steag care flutura...). */
  barAnimated: boolean;
}

export const UI_SETTINGS_KEY = 'ui_settings';
export const UI_DEFAULTS: UiSettings = { barBehavior: 'always', barStyle: 'pill', themeFx: 'fade', langFx: 'shake', barAnimated: false };

export const BAR_BEHAVIORS: { id: BarBehavior; title: string; text: string }[] = [
  { id: 'always', title: 'Mereu vizibilă', text: 'Bara rămâne pe ecran tot timpul, ca până acum.' },
  { id: 'slide', title: 'Se ascunde la derulare în jos, reapare la derulare în sus', text: 'Comportamentul clasic din aplicații (Instagram, Chrome).' },
  { id: 'idle', title: 'Se ascunde cât derulezi, reapare când te oprești', text: 'Bara coboară când derulezi (în ambele sensuri) și revine singură, imediat ce ai terminat de derulat.' },
  { id: 'shrink', title: 'Se face mică (doar iconițe) la derulare în jos', text: 'Rămâne pe ecran, dar fără texte și mai joasă; revine la derulare în sus.' },
  { id: 'fade', title: 'Devine aproape transparentă cât derulezi', text: 'Nu se mișcă, doar se estompează; revine când te oprești.' },
  { id: 'articles', title: 'Se ascunde doar în articole', text: 'Pe celelalte pagini rămâne mereu; în articole se ascunde la derulare în jos.' },
];

export const BAR_STYLES: { id: BarStyle; title: string; text: string }[] = [
  { id: 'pill', title: 'Pastilă plutitoare (actuală)', text: 'Bară mică, rotunjită, centrată deasupra marginii de jos.' },
  { id: 'edge', title: 'Bară lipită de margini', text: 'Pe toată lățimea, lipită de stânga, dreapta și jos, cu linie fină deasupra (ca la YouTube Music).' },
  { id: 'edgeglass', title: 'Bară lipită de margini, sticlă mată', text: 'Pe toată lățimea, cu fundal semi-transparent și blur.' },
  { id: 'glass', title: 'Pastilă lată, sticlă mată', text: 'Plutitoare, mai lată, cu blur puternic și fundal transparent (ca la Telegram).' },
  { id: 'minimal', title: 'Minimală', text: 'Fără chenar și fără fundal: doar iconițele, cu o umbră fină.' },
  { id: 'dock', title: 'Doc compact', text: 'Doar iconițe, într-o pastilă mică, fără texte.' },
];

export const THEME_FX: { id: ThemeFx; title: string; text: string }[] = [
  { id: 'fade', title: 'Trecere lină', text: 'Ecranul nou apare treptat peste cel vechi.' },
  { id: 'circle', title: 'Cerc din buton', text: 'Un cerc crește din butonul apăsat și acoperă tot ecranul.' },
  { id: 'wipe', title: 'Perdea laterală', text: 'Noua temă „glisează" de la stânga la dreapta.' },
  { id: 'curtain', title: 'Perdea de sus în jos', text: 'Noua temă coboară de sus, ca o perdea.' },
  { id: 'shake', title: 'Tremur de iconițe', text: 'Trecere lină, iar iconițele, butoanele și textele tremură o clipă.' },
  { id: 'dissolve', title: 'Estompare', text: 'Ecranul vechi se încețoșează, iar cel nou se limpezește.' },
  { id: 'zoom', title: 'Zoom blând', text: 'Ecranul nou apare ușor mărit și se așază la loc.' },
];

export const LANG_FX: { id: LangFx; title: string; text: string }[] = [
  { id: 'shake', title: 'Tremur scurt', text: 'Textele și butoanele tremură o clipă, în culorile temei curente.' },
  { id: 'fade', title: 'Estompare', text: 'Conținutul se estompează și revine în noua limbă.' },
  { id: 'none', title: 'Fără efect', text: 'Limba se schimbă pe loc.' },
];

const LS_KEY = 'radikalUiSettings';
const ONE_OF = <T extends string>(v: unknown, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);

function normalize(v: Partial<UiSettings> | null | undefined): UiSettings {
  const o = v ?? {};
  return {
    barBehavior: ONE_OF(o.barBehavior, BAR_BEHAVIORS.map((x) => x.id), UI_DEFAULTS.barBehavior),
    barStyle: ONE_OF(o.barStyle, BAR_STYLES.map((x) => x.id), UI_DEFAULTS.barStyle),
    themeFx: ONE_OF(o.themeFx, THEME_FX.map((x) => x.id), UI_DEFAULTS.themeFx),
    langFx: ONE_OF(o.langFx, LANG_FX.map((x) => x.id), UI_DEFAULTS.langFx),
    barAnimated: typeof o.barAnimated === 'boolean' ? o.barAnimated : UI_DEFAULTS.barAnimated,
  };
}

let current: UiSettings = UI_DEFAULTS;
let cache: Promise<UiSettings> | null = null;
let lastForceAt = 0;

/** Ultimele setari cunoscute, fara sa astepti reteaua (folosit la schimbarea temei). */
export function getUiSettingsSync(): UiSettings {
  return current;
}

function remember(s: UiSettings) {
  current = s;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* ignorat */
  }
}

export function fetchUiSettings(force = false): Promise<UiSettings> {
  if (cache && !force) return cache;
  cache = (async () => {
    try {
      const { data, error } = await getSupabaseClient().from('site_content').select('value').eq('key', UI_SETTINGS_KEY).maybeSingle();
      if (error) return current;
      const s = normalize(data?.value as Partial<UiSettings> | undefined);
      remember(s);
      return s;
    } catch {
      return current;
    }
  })();
  return cache;
}

export async function saveUiSettings(next: UiSettings): Promise<void> {
  const { error } = await getSupabaseClient().from('site_content').upsert({ key: UI_SETTINGS_KEY, value: next }, { onConflict: 'key' });
  if (error) throw error;
  cache = null;
  remember(next);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('radikal-ui'));
}

export function useUiSettings(): UiSettings {
  const [s, setS] = useState<UiSettings>(UI_DEFAULTS);
  useEffect(() => {
    let alive = true;
    // Mai intai ce stiam de la ultima vizita, ca bara sa nu „sara" la incarcare.
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = normalize(JSON.parse(saved));
        current = parsed;
        setS(parsed);
      }
    } catch {
      /* ignorat */
    }
    const load = (force: boolean) => {
      if (force) {
        if (Date.now() - lastForceAt < 4000) {
          void fetchUiSettings().then((v) => alive && setS(v));
          return;
        }
        lastForceAt = Date.now();
      }
      void fetchUiSettings(force).then((v) => alive && setS(v));
    };
    load(false);
    const onVisible = () => document.visibilityState === 'visible' && load(true);
    const onChange = () => load(true);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('radikal-ui', onChange);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('radikal-ui', onChange);
    };
  }, []);
  return s;
}
