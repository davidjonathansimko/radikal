// =====================================================================
// Pasul 2308001 — nume de fisier pentru audio-urile descarcate
// ---------------------------------------------------------------------
// Cerinta: "fisierul descarcat sa aiba titlul blogului si data la care
// a fost creat si limba".
// Rezultat: `Titlul-blogului_2026-01-27_ro.mp3`
// =====================================================================

/** Numele scurt al limbii, pentru fisier */
export const LANG_LABEL: Record<string, string> = {
  ro: 'ro',
  de: 'de',
  en: 'en',
  ru: 'ru',
};

/**
 * Curata un text ca sa poata fi folosit ca nume de fisier
 * pe Windows, macOS si Linux (fara diacritice, fara caractere interzise).
 */
export function slugifyForFile(input: string): string {
  return (input || 'blog')
    .normalize('NFD')
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[\u0300-\u036f]/g, '') // scoatem diacriticele
    .replace(/[\\/:*?"<>|]/g, '') // caractere interzise in nume de fisier
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'blog';
}

/** Data in format `AAAA-LL-ZZ` (sortabil, fara ambiguitati) */
export function formatDateForFile(value?: string | null): string {
  const d = value ? new Date(value) : new Date();
  const safe = Number.isNaN(d.getTime()) ? new Date() : d;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${safe.getFullYear()}-${pad(safe.getMonth() + 1)}-${pad(safe.getDate())}`;
}

/**
 * Construieste numele complet al fisierului audio.
 * @param title    titlul blogului
 * @param date     data crearii blogului (ISO) — daca lipseste, data de azi
 * @param language codul limbii (ro/de/en/ru)
 */
export function buildAudioFileName(title: string, date: string | null | undefined, language: string): string {
  return `${slugifyForFile(title)}_${formatDateForFile(date)}_${LANG_LABEL[language] || language}.mp3`;
}

export default buildAudioFileName;
