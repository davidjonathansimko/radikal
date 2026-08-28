/**
 * Pasul 2708018 — rubricile mari ale site-ului, în afară de bloguri și mărturii.
 *
 * „Tägliche Andacht" și „Pentru copii" merg identic: aceleași rubrici, aceleași
 * subrubrici, același formular. Ce le deosebește stă scris aici, într-un
 * singur loc — iar în baza de date le deosebește coloana `kind`.
 *
 * Dacă mâine mai vrei o rubrică, adaugi o intrare aici și o valoare în
 * `kind`. Nu se scrie nimic de la zero.
 */

export type ContentKind = 'andacht' | 'copii';

export interface ContentKindDef {
  kind: ContentKind;
  /** Numele din meniul de administrare */
  adminLabel: string;
  /** Adresa listei: /andacht sau /copii */
  basePath: string;
  /** Adresa unui articol: /andacht/a/slug */
  itemPath: string;
  /** Prefix pentru comentarii, aprecieri și fișiere audio */
  prefix: string;
  /** Numele paginii, pe limbi */
  title: Record<string, string>;
  /** Textul de sub titlu, pe limbi */
  intro: Record<string, string>;
}

export const CONTENT_KINDS: Record<ContentKind, ContentKindDef> = {
  andacht: {
    kind: 'andacht',
    adminLabel: 'Tägliche Andacht',
    basePath: '/andacht',
    itemPath: '/andacht/a',
    prefix: 'a:',
    title: {
      de: 'Tägliche Andacht',
      en: 'Daily Devotion',
      ro: 'Meditația zilnică',
      ru: 'Ежедневное размышление',
    },
    intro: {
      de: 'Every day is different.',
      en: 'Every day is different.',
      ro: 'Fiecare zi este altfel.',
      ru: 'Каждый день не похож на другой.',
    },
  },
  copii: {
    kind: 'copii',
    adminLabel: 'Pentru copii',
    basePath: '/copii',
    itemPath: '/copii/a',
    prefix: 'c:',
    title: {
      de: 'Für Kinder',
      en: 'For Children',
      ro: 'Pentru copii',
      ru: 'Для детей',
    },
    intro: {
      de: 'Heiligkeit von Kindheit an',
      en: 'Holiness from childhood',
      ro: 'Sfințenie din pruncie',
      ru: 'Святость с детства',
    },
  },
};

export const CONTENT_SECTIONS_TABLE = 'content_sections';
export const CONTENT_ITEMS_TABLE = 'content_items';
