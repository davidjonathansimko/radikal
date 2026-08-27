// =====================================================================
// Pasul 2308004 (A) — modul „Working / Baustelle"
// ---------------------------------------------------------------------
// Cand siteul este in lucru, vizitatorii vad DOAR logo-ul RADIKAL si un
// mesaj cu data la care revine. Nimic altceva: nici modalul de intro cu
// „Dacă lumea este acasă în Biserică…", nici ecranul de login /
// register / continue as guest. Totul este inghetat.
//
// Adminul intra normal, ca sa poata lucra. El vede o bara discreta sus,
// care ii aminteste ca siteul este public in mod „in lucru".
//
// STOCARE: refolosim tabelul `site_content` (key/value JSONB), acelasi
// folosit deja de textul din About Story. Nu este nevoie de SQL nou.
// =====================================================================

'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export const MAINTENANCE_KEY = 'site_maintenance';

/**
 * Pasul 2308010 — semnul ca adminul a folosit usa ascunsa (apasare lunga pe
 * logo). Traieste doar in fila curenta de browser: se sterge singur cand
 * inchizi fila, deci nu poate fi lasat deschis din greseala.
 */
export const ADMIN_ENTRY_KEY = 'radikal-admin-entry';

export type MaintenanceLanguage = 'ro' | 'de' | 'en' | 'ru';

export interface MaintenanceSettings {
  /** Siteul este in lucru? */
  enabled: boolean;
  /** Data la care revine, in format `AAAA-LL-ZZ`. Gol = nu aratam data. */
  returnDate: string;
  /**
   * Text personalizat, pe limbi. Daca o limba lipseste sau e goala,
   * se foloseste textul implicit de mai jos.
   */
  message: Partial<Record<MaintenanceLanguage, string>>;
  /** Imagine de fundal optionala (URL public din Storage) */
  backgroundUrl: string | null;
  /** Cat de vizibila e imaginea de fundal (0–100) */
  backgroundOpacity: number;
}

export const DEFAULT_MAINTENANCE: MaintenanceSettings = {
  enabled: false,
  returnDate: '',
  message: {},
  backgroundUrl: null,
  backgroundOpacity: 35,
};

/** Textul implicit, daca adminul nu scrie nimic */
export const DEFAULT_MESSAGE: Record<MaintenanceLanguage, string> = {
  ro: 'Se efectuează lucrări la site. Vom reveni la data de {date}.',
  de: 'Es wird an der Website gearbeitet. Wir sind zurück am {date}.',
  en: 'The website is under construction. We will be back on {date}.',
  ru: 'На сайте ведутся работы. Мы вернёмся {date}.',
};

/** Varianta fara data, cand adminul nu a completat-o */
export const DEFAULT_MESSAGE_NO_DATE: Record<MaintenanceLanguage, string> = {
  ro: 'Se efectuează lucrări la site. Revenim în curând.',
  de: 'Es wird an der Website gearbeitet. Wir sind bald zurück.',
  en: 'The website is under construction. We will be back soon.',
  ru: 'На сайте ведутся работы. Мы скоро вернёмся.',
};

/**
 * Pasul 2308010 — propozitia cu data, adaugata dupa textul tau.
 * Inainte, daca scriai un mesaj propriu („Wir arbeiten") si nu puneai `{date}`
 * in el, data aleasa nu aparea NICAIERI. Acum o adaugam automat la final.
 */
export const BACK_ON_SENTENCE: Record<MaintenanceLanguage, string> = {
  ro: 'Revenim la data de {date}.',
  de: 'Wir sind zurück am {date}.',
  en: 'We will be back on {date}.',
  ru: 'Мы вернёмся {date}.',
};

/** Numele lunilor, ca data sa se citeasca frumos in fiecare limba */
const MONTHS: Record<MaintenanceLanguage, string[]> = {
  ro: ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
       'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
       'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June',
       'July', 'August', 'September', 'October', 'November', 'December'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
       'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
};

/**
 * Transforma `2026-09-15` in „15 septembrie 2026" / „15. September 2026".
 * Daca data lipseste sau e gresita, intoarce sirul gol.
 */
export function formatReturnDate(iso: string, lang: MaintenanceLanguage): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';

  const day = d.getDate();
  const month = MONTHS[lang][d.getMonth()];
  const year = d.getFullYear();

  if (lang === 'de') return `${day}. ${month} ${year}`;
  if (lang === 'en') return `${month} ${day}, ${year}`;
  return `${day} ${month} ${year}`;
}

/**
 * Construieste mesajul final, in limba ceruta, cu data pusa la locul ei.
 */
export function buildMaintenanceMessage(
  settings: MaintenanceSettings,
  lang: MaintenanceLanguage,
): string {
  const custom = (settings.message?.[lang] || '').trim();
  const dateText = formatReturnDate(settings.returnDate, lang);

  if (custom) {
    // Adminul poate folosi {date} oriunde in textul lui
    if (custom.includes('{date}')) return custom.replace('{date}', dateText);
    // Nu a pus {date}, dar a ales o data -> o adaugam noi, ca sa nu se piarda.
    if (dateText) return `${custom} ${BACK_ON_SENTENCE[lang].replace('{date}', dateText)}`;
    return custom;
  }

  if (!dateText) return DEFAULT_MESSAGE_NO_DATE[lang];
  return DEFAULT_MESSAGE[lang].replace('{date}', dateText);
}

// ---------------------------------------------------------------------
// Citire — cu cache, ca sa nu intrebam de doua ori in aceeasi sesiune
// ---------------------------------------------------------------------
let cached: MaintenanceSettings | null = null;
let inFlight: Promise<MaintenanceSettings> | null = null;

export async function fetchMaintenance(): Promise<MaintenanceSettings> {
  if (cached) return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('site_content')
        .select('value')
        .eq('key', MAINTENANCE_KEY)
        .maybeSingle();

      if (error || !data?.value) {
        cached = DEFAULT_MAINTENANCE;
        return cached;
      }

      // Combinam cu valorile implicite, ca un camp lipsa sa nu strice nimic
      cached = { ...DEFAULT_MAINTENANCE, ...(data.value as Partial<MaintenanceSettings>) };
      return cached;
    } catch {
      // Daca reteaua cade, NU blocam siteul — mai bine deschis decat inchis din greseala
      cached = DEFAULT_MAINTENANCE;
      return cached;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/** Goleste cache-ul dupa ce adminul salveaza */
export function clearMaintenanceCache() {
  cached = null;
}

/**
 * Hook pentru componente.
 * `loading` este `true` pana aflam raspunsul — in acel timp nu aratam
 * nici siteul, nici ecranul de „in lucru", ca sa nu clipeasca.
 */
export function useMaintenance() {
  const [settings, setSettings] = useState<MaintenanceSettings>(DEFAULT_MAINTENANCE);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    clearMaintenanceCache();
    const s = await fetchMaintenance();
    setSettings(s);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMaintenance().then((s) => {
      if (cancelled) return;
      setSettings(s);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading, reload };
}

export default useMaintenance;
