/**
 * Pasul 2608005 — ajutorul comun pentru mărturii.
 *
 * Regula textului, într-o singură propoziție:
 *   dacă ai scris TU traducerea pentru limba cititorului, aceea se folosește;
 *   dacă nu, se folosește originalul (româna) și îl traduce DeepL în pagină.
 *
 * Așa nu plătești pentru limbile pe care le scrii singur.
 */

export interface TestimonyRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  published: boolean;
  created_at: string | null;
  section_ids: string[] | null;
  is_dynamic?: boolean | null;
  [key: string]: unknown;
}

export type TestimonyField = 'title' | 'excerpt' | 'content';

/** Textul pentru limba cerută: al tău dacă există, altfel originalul. */
export function pickTestimonyText(
  row: TestimonyRow,
  field: TestimonyField,
  lang: string,
): string {
  const mine = row[`${field}_${lang}`];
  if (typeof mine === 'string' && mine.trim()) return mine.trim();

  const original = row[field];
  return typeof original === 'string' ? original : '';
}

/** `true` dacă ai scris tu traducerea — atunci DeepL nu mai are ce face. */
export function hasOwnTranslation(row: TestimonyRow, field: TestimonyField, lang: string): boolean {
  const mine = row[`${field}_${lang}`];
  return typeof mine === 'string' && mine.trim().length > 0;
}
