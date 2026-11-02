'use client';

// Setari de aspect alese din admin (tabelul `site_content`, cheia `ui_settings`):
// comportamentul si stilul barii de jos, efectul schimbarii temei si al limbii, iconite animate sau statice.

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export type BarBehavior = 'always' | 'slide' | 'idle' | 'shrink' | 'fade' | 'articles';
export type BarStyle = 'pill' | 'pillglass' | 'edge' | 'edgeglass' | 'glass' | 'floatbar' | 'invert' | 'minimal' | 'dock' | 'dockglass';
export type ThemeFx = 'fade' | 'circle' | 'iris' | 'wipe' | 'wipeR' | 'curtain' | 'rise' | 'split' | 'vsplit' | 'diagonal' | 'slide' | 'shake' | 'dissolve' | 'zoom' | 'flash';
export type LangFx = 'shake' | 'fade' | 'blur' | 'rise' | 'none';
export type MiniPlayerStyle = 'off' | 'bar' | 'pill' | 'card' | 'glass' | 'minimal' | 'line';

/** Functii care se pornesc sau se opresc din admin; oprit = exact ca inainte. */
export type UiToggleKey = 'queue' | 'resumePos' | 'sleepTimer' | 'offlineAudio' | 'hideInlinePlayer' | 'todayStreak' | 'todayListen' | 'searchSuggest' | 'seriesProgress' | 'calmEffects';

export interface UiSettings extends Record<UiToggleKey, boolean> {
  barBehavior: BarBehavior;
  barStyle: BarStyle;
  themeFx: ThemeFx;
  langFx: LangFx;
  /** Iconitele din bara de jos se misca (soare care se invarte, steag care flutura...). */
  barAnimated: boolean;
  /** Playerul mic care ramane pe ecran la schimbarea paginii (`off` = dezactivat). */
  miniPlayer: MiniPlayerStyle;
}

export const UI_SETTINGS_KEY = 'ui_settings';
export const UI_DEFAULTS: UiSettings = {
  barBehavior: 'always',
  barStyle: 'pill',
  themeFx: 'fade',
  langFx: 'shake',
  barAnimated: false,
  miniPlayer: 'off',
  queue: false,
  resumePos: false,
  sleepTimer: false,
  offlineAudio: false,
  hideInlinePlayer: false,
  todayStreak: false,
  todayListen: false,
  searchSuggest: false,
  seriesProgress: false,
  calmEffects: false,
};

export const MINI_PLAYERS: { id: MiniPlayerStyle; title: string; text: string }[] = [
  { id: 'off', title: 'Dezactivat (ca până acum)', text: 'Când schimbi pagina, audio-ul simplu se oprește, ca în prezent.' },
  { id: 'bar', title: 'Bară subțire deasupra meniului', text: 'Pe toată lățimea: copertă mică, titlu, play/pauză și o linie de progres (ca la YouTube Music).' },
  { id: 'pill', title: 'Pastilă plutitoare', text: 'Rotunjită, centrată, cu copertă rotundă, titlu și play/pauză.' },
  { id: 'card', title: 'Card mai mare', text: 'Copertă mai mare, titlu pe două rânduri, butoane înainte/înapoi și bară de progres.' },
  { id: 'glass', title: 'Sticlă mată', text: 'Pastilă transparentă cu blur, ca la Telegram.' },
  { id: 'minimal', title: 'Minimal', text: 'Doar titlul și play/pauză, fără copertă și fără fundal.' },
  { id: 'line', title: 'Linie de progres', text: 'Extrem de subțire: o linie de progres și un buton mic de play/pauză.' },
];

export const UI_TOGGLES: { key: UiToggleKey; group: string; title: string; text: string }[] = [
  { key: 'queue', group: 'Ascultare', title: 'Listă de așteptare', text: 'Buton „În lista de ascultare” la blog; la sfârșit pornește următorul (merge cu blogurile care au audio pregenerat).' },
  { key: 'resumePos', group: 'Ascultare', title: 'Memorarea locului unde ai rămas (la fiecare blog)', text: 'La Play, audio-ul continuă de unde a fost oprit data trecută, separat pentru fiecare blog.' },
  { key: 'sleepTimer', group: 'Ascultare', title: 'Temporizator de somn', text: 'Din playerul mic: 15 / 30 / 45 / 60 min sau până la sfârșitul blogului.' },
  { key: 'offlineAudio', group: 'Ascultare', title: 'Ascultare offline', text: '„Salvează pe telefon” pentru audio-ul pregenerat, ca să meargă fără internet (se salvează în aplicație).' },
  { key: 'hideInlinePlayer', group: 'Ascultare', title: 'Ascunde playerul din articol (rămâne doar „Ascultă acum”)', text: 'Funcționează doar cu playerul mic pornit: bara cu Play, progres și viteză din articol dispare, iar „Ascultă acum” construiește singur audio-ul (ca Play-ul simplu). Play Blog rămâne.' },
  { key: 'todayStreak', group: 'Pagina principală', title: 'Contor de zile la rând (discret)', text: 'O linie mică în cardul „Azi”: „3 zile la rând”. Fără presiune, nu apare niciun mesaj negativ.' },
  { key: 'todayListen', group: 'Pagina principală', title: 'Buton „Ascultă” în cardul „Azi”', text: 'Ultimul blog cu audio pregenerat, cu un buton care îl pornește direct în playerul mic.' },
  { key: 'searchSuggest', group: 'Căutare', title: 'Căutare cu sugestii', text: 'Când căutarea e goală: serii, categorii și etichete populare, ca să ating și să caute.' },
  { key: 'seriesProgress', group: 'Serii', title: 'Progres în serii + pagină pentru fiecare serie', text: 'Câte bloguri din serie ai citit („3 din 7”), cu bară de progres, și o pagină a seriei cu buton „Continuă”.' },
  { key: 'calmEffects', group: 'Efecte', title: 'Efecte liniștite (fără glitch)', text: 'Oprește tremurul de la schimbarea temei/limbii: tema se schimbă întotdeauna lin, iar limba fie lin, fie pe loc.' },
];

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
  { id: 'pillglass', title: 'Pastilă plutitoare, sticlă mată', text: 'Aceeași pastilă, dar cu fundal transparent și blur.' },
  { id: 'edge', title: 'Bară lipită de margini', text: 'Pe toată lățimea, lipită de stânga, dreapta și jos, cu linie fină deasupra (ca la YouTube Music).' },
  { id: 'edgeglass', title: 'Bară lipită de margini, sticlă mată', text: 'Pe toată lățimea, cu fundal semi-transparent și blur.' },
  { id: 'glass', title: 'Pastilă lată, sticlă mată', text: 'Plutitoare, mai lată, cu blur puternic și fundal transparent (ca la Telegram).' },
  { id: 'floatbar', title: 'Bară lată plutitoare, solidă', text: 'Aproape pe toată lățimea, rotunjită, cu margine de jur împrejur.' },
  { id: 'invert', title: 'Contrast inversat', text: 'Pastilă închisă pe tema luminoasă și deschisă pe tema întunecată.' },
  { id: 'minimal', title: 'Minimală', text: 'Fără chenar și fără fundal: doar iconițele, cu o umbră fină.' },
  { id: 'dock', title: 'Doc compact', text: 'Doar iconițe, într-o pastilă mică, fără texte.' },
  { id: 'dockglass', title: 'Doc compact, sticlă mată', text: 'Doar iconițe, pastilă mică transparentă cu blur.' },
];

export const THEME_FX: { id: ThemeFx; title: string; text: string }[] = [
  { id: 'fade', title: 'Trecere lină', text: 'Ecranul nou apare treptat peste cel vechi.' },
  { id: 'circle', title: 'Cerc din buton', text: 'Un cerc crește din butonul apăsat și acoperă tot ecranul.' },
  { id: 'iris', title: 'Cerc din centru', text: 'Un cerc crește din mijlocul ecranului (ca un diafragm).' },
  { id: 'wipe', title: 'Perdea laterală (stânga → dreapta)', text: 'Noua temă „glisează” de la stânga la dreapta.' },
  { id: 'wipeR', title: 'Perdea laterală (dreapta → stânga)', text: 'Noua temă „glisează” de la dreapta la stânga.' },
  { id: 'curtain', title: 'Perdea de sus în jos', text: 'Noua temă coboară de sus, ca o perdea.' },
  { id: 'rise', title: 'Perdea de jos în sus', text: 'Noua temă urcă de jos, ca o cortină care se ridică.' },
  { id: 'split', title: 'Deschidere din mijloc (orizontal)', text: 'Noua temă se deschide din mijloc spre stânga și dreapta.' },
  { id: 'vsplit', title: 'Deschidere din mijloc (vertical)', text: 'Noua temă se deschide din mijloc spre sus și jos.' },
  { id: 'diagonal', title: 'Diagonală', text: 'Noua temă crește dintr-un colț, pe diagonală.' },
  { id: 'slide', title: 'Glisare', text: 'Ecranul nou intră „împingând” ușor ecranul vechi.' },
  { id: 'flash', title: 'Sclipire', text: 'Trecere lină, cu o scurtă sclipire de lumină.' },
  { id: 'shake', title: 'Tremur de iconițe', text: 'Trecere lină, iar iconițele, butoanele și textele tremură o clipă.' },
  { id: 'dissolve', title: 'Estompare', text: 'Ecranul vechi se încețoșează, iar cel nou se limpezește.' },
  { id: 'zoom', title: 'Zoom blând', text: 'Ecranul nou apare ușor mărit și se așază la loc.' },
];

export const LANG_FX: { id: LangFx; title: string; text: string }[] = [
  { id: 'shake', title: 'Tremur scurt', text: 'Textele și butoanele tremură o clipă, în culorile temei curente.' },
  { id: 'fade', title: 'Estompare', text: 'Conținutul se estompează și revine în noua limbă.' },
  { id: 'blur', title: 'Încețoșare', text: 'Conținutul se încețoșează o clipă și se limpezește.' },
  { id: 'rise', title: 'Urcare ușoară', text: 'Conținutul coboară puțin și urcă la loc, estompat.' },
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
    miniPlayer: ONE_OF(o.miniPlayer, MINI_PLAYERS.map((x) => x.id), UI_DEFAULTS.miniPlayer),
    queue: o.queue === true,
    resumePos: o.resumePos === true,
    sleepTimer: o.sleepTimer === true,
    offlineAudio: o.offlineAudio === true,
    hideInlinePlayer: o.hideInlinePlayer === true,
    todayStreak: o.todayStreak === true,
    todayListen: o.todayListen === true,
    searchSuggest: o.searchSuggest === true,
    seriesProgress: o.seriesProgress === true,
    calmEffects: o.calmEffects === true,
  };
}

let saved: UiSettings = UI_DEFAULTS;
// Previzualizare din admin: se vede imediat, dar nu se salveaza pana nu apesi „Salveaza".
let preview: UiSettings | null = null;
let cache: Promise<UiSettings> | null = null;
let lastForceAt = 0;

/** Setarile in vigoare acum (previzualizarea, daca exista), fara sa astepti reteaua. */
export function getUiSettingsSync(): UiSettings {
  return preview ?? saved;
}

/** Previzualizeaza setarile (`null` = revine la cele salvate). */
export function setUiPreview(next: UiSettings | null) {
  preview = next;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('radikal-ui-preview'));
}

function remember(s: UiSettings) {
  saved = s;
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
      if (error) return saved;
      const s = normalize(data?.value as Partial<UiSettings> | undefined);
      remember(s);
      return s;
    } catch {
      return saved;
    }
  })();
  return cache;
}

export async function saveUiSettings(next: UiSettings): Promise<void> {
  const { error } = await getSupabaseClient().from('site_content').upsert({ key: UI_SETTINGS_KEY, value: next }, { onConflict: 'key' });
  if (error) throw error;
  cache = null;
  remember(next);
  preview = null;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('radikal-ui'));
}

export function useUiSettings(): UiSettings {
  const [s, setS] = useState<UiSettings>(UI_DEFAULTS);
  useEffect(() => {
    let alive = true;
    // Mai intai ce stiam de la ultima vizita, ca bara sa nu „sara" la incarcare.
    try {
      const cached = localStorage.getItem(LS_KEY);
      if (cached) saved = normalize(JSON.parse(cached));
    } catch {
      /* ignorat */
    }
    setS(getUiSettingsSync());
    const load = (force: boolean) => {
      if (force) {
        if (Date.now() - lastForceAt < 4000) {
          void fetchUiSettings().then(() => alive && setS(getUiSettingsSync()));
          return;
        }
        lastForceAt = Date.now();
      }
      void fetchUiSettings(force).then(() => alive && setS(getUiSettingsSync()));
    };
    load(false);
    const onVisible = () => document.visibilityState === 'visible' && load(true);
    const onChange = () => load(true);
    const onPreview = () => setS(getUiSettingsSync());
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('radikal-ui', onChange);
    window.addEventListener('radikal-ui-preview', onPreview);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('radikal-ui', onChange);
      window.removeEventListener('radikal-ui-preview', onPreview);
    };
  }, []);
  return s;
}
