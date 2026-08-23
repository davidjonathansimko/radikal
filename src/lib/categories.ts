/**
 * Pasul A17 — CATEGORII.
 *
 * Un singur loc din care iau toti categoriile, ca sa nu se scrie de trei ori
 * acelasi cod (admin, lista de bloguri, modalul de cautare).
 *
 * O categorie are cate un nume in fiecare limba, ca sa o poata citi oricine
 * indiferent ce limba si-a ales: „Familie" / „Family" / „Familie" / „Семья".
 *
 * Tabelul se creeaza cu `STEP_2308000_CATEGORII.sql`, iar categoriile in plus
 * (prietenie, credinta, frica, pacat, iubire, inchinare) cu
 * `STEP_A17_CATEGORII_EXTRA.sql`.
 *
 * IMPORTANT: daca SQL-ul nu a fost inca rulat, `fetchCategories` intoarce o
 * lista goala in loc sa arunce eroare. Asa site-ul merge mai departe normal.
 */

import { getSupabaseClient } from '@/lib/supabase';

export interface Category {
  id: string;
  slug: string;
  name_de: string;
  name_en: string | null;
  name_ro: string | null;
  name_ru: string | null;
  sort_order: number;
}

/** Numele categoriei in limba aleasa, cu revenire pe germana daca lipseste. */
export function categoryName(cat: Category, lang: string): string {
  const byLang: Record<string, string | null | undefined> = {
    ro: cat.name_ro,
    en: cat.name_en,
    ru: cat.name_ru,
    de: cat.name_de,
  };
  return byLang[lang] || cat.name_de || cat.slug;
}

/**
 * Toate numele unei categorii, lipite intr-un singur text.
 * Folosit la cautare: scrii „Family" si gasesti si daca esti pe romana.
 */
export function categorySearchText(cat: Category): string {
  return [cat.slug, cat.name_de, cat.name_en, cat.name_ro, cat.name_ru]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/** Citeste categoriile din baza de date, ordonate ca in admin. */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('categories')
      .select('id, slug, name_de, name_en, name_ro, name_ru, sort_order')
      .order('sort_order', { ascending: true });

    // 42P01 = tabelul nu exista inca (SQL-ul nu a fost rulat)
    if (error) return [];
    return (data ?? []) as Category[];
  } catch {
    return [];
  }
}

/**
 * Transforma un nume in „slug": litere mici, fara diacritice, cu liniute.
 * „Închinare curată" → „inchinare-curata"
 */
export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // scoate accentele
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Un articol se potriveste daca are MACAR UNA dintre categoriile bifate.
 * Exact ce a cerut: bifezi „familie" si „casnicie" → vezi ambele grupe.
 */
export function matchesSelectedCategories(
  postCategoryIds: string[] | null | undefined,
  selectedIds: string[],
): boolean {
  if (selectedIds.length === 0) return true; // nimic bifat = arata tot
  if (!postCategoryIds || postCategoryIds.length === 0) return false;
  return selectedIds.some((id) => postCategoryIds.includes(id));
}

/* =========================================================================
 * Pasul 2308006-C — TEXTELE din jurul categoriilor, in toate cele 4 limbi.
 *
 * Inainte, un cititor german vedea categoriile in germana (bine), dar
 * butonul „+ încă 9" si „Caută o categorie…" ramaneau in romana (rau).
 * Acum tot ce se vede in jurul categoriilor vorbeste limba cititorului.
 * ========================================================================= */

type CategoryUiKey =
  | 'searchPlaceholder'
  | 'more'
  | 'showLess'
  | 'noneFound'
  | 'clear'
  | 'title'
  | 'empty';

const CATEGORY_UI: Record<string, Record<CategoryUiKey, string>> = {
  de: {
    searchPlaceholder: 'Kategorie suchen…',
    more: 'weitere',
    showLess: 'Weniger anzeigen',
    noneFound: 'Keine Kategorie gefunden.',
    clear: 'Auswahl aufheben',
    title: 'Kategorien',
    empty: 'Noch keine Kategorien.',
  },
  en: {
    searchPlaceholder: 'Search a category…',
    more: 'more',
    showLess: 'Show less',
    noneFound: 'No category found.',
    clear: 'Clear selection',
    title: 'Categories',
    empty: 'No categories yet.',
  },
  ro: {
    searchPlaceholder: 'Caută o categorie…',
    more: 'încă',
    showLess: 'Arată mai puține',
    noneFound: 'Nicio categorie găsită.',
    clear: 'Șterge selecția',
    title: 'Categorii',
    empty: 'Încă nu există categorii.',
  },
  ru: {
    searchPlaceholder: 'Найти категорию…',
    more: 'ещё',
    showLess: 'Показать меньше',
    noneFound: 'Категория не найдена.',
    clear: 'Очистить выбор',
    title: 'Категории',
    empty: 'Категорий пока нет.',
  },
};

/** Textul cerut, in limba cititorului. Daca limba lipseste, revine pe germana. */
export function categoryUiText(lang: string, key: CategoryUiKey): string {
  return (CATEGORY_UI[lang] ?? CATEGORY_UI.de)[key];
}

/**
 * „+ încă 9" / „+ 9 weitere" / „+ 9 more" / „+ ещё 9".
 * Fiecare limba pune numarul in alt loc, de aceea are functie separata.
 */
export function categoryMoreLabel(lang: string, count: number): string {
  switch (lang) {
    case 'de':
      return `+ ${count} weitere`;
    case 'en':
      return `+ ${count} more`;
    case 'ru':
      return `+ ещё ${count}`;
    default:
      return `+ încă ${count}`;
  }
}
