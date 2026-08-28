/**
 * Pasul 2708018 — citirea articolelor din rubricile noi.
 *
 * Aceleași reguli ca la mărturii: dacă ai scris tu traducerea, ea se
 * folosește; dacă nu, se ia originalul românesc și îl traduce DeepL.
 */

import { getSupabaseClient } from '@/lib/supabase';
import { CONTENT_ITEMS_TABLE, CONTENT_SECTIONS_TABLE, type ContentKind } from '@/lib/contentKinds';

export interface ContentItemRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  published: boolean;
  created_at: string | null;
  section_ids: string[] | null;
  [key: string]: unknown;
}

export interface PublicSection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parent_id: string | null;
}

/** Textul pentru limba cerută: al tău dacă există, altfel originalul. */
export function pickContentText(
  row: ContentItemRow,
  field: 'title' | 'excerpt' | 'content',
  lang: string,
): string {
  const mine = row[`${field}_${lang}`];
  if (typeof mine === 'string' && mine.trim()) return mine.trim();
  const original = row[field];
  return typeof original === 'string' ? original : '';
}

const SECTION_COLS =
  'id, slug, parent_id, name_ro, name_de, name_en, name_ru, description_ro, description_de, description_en, description_ru';

function mapSection(r: Record<string, unknown>, lang: string): PublicSection {
  return {
    id: r.id as string,
    slug: r.slug as string,
    parent_id: (r.parent_id as string) ?? null,
    name: ((r[`name_${lang}`] as string) || (r.name_ro as string) || '').trim(),
    description: ((r[`description_${lang}`] as string) || (r.description_ro as string) || null),
  };
}

/** Rubricile principale ale unei pagini. */
export async function fetchRootSections(kind: ContentKind, lang: string): Promise<PublicSection[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from(CONTENT_SECTIONS_TABLE)
      .select(SECTION_COLS)
      .eq('kind', kind)
      .is('parent_id', null)
      .eq('published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return (data as unknown as Record<string, unknown>[]).map((r) => mapSection(r, lang));
  } catch {
    return [];
  }
}

/** Rubricile aflate în interiorul altei rubrici. */
export async function fetchChildSections(parentId: string, lang: string): Promise<PublicSection[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from(CONTENT_SECTIONS_TABLE)
      .select(SECTION_COLS)
      .eq('parent_id', parentId)
      .eq('published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return (data as unknown as Record<string, unknown>[]).map((r) => mapSection(r, lang));
  } catch {
    return [];
  }
}

/** Rubrica cerută după adresă. Cea principală are întâietate. */
export async function fetchSectionBySlug(
  kind: ContentKind,
  slug: string,
  lang: string,
): Promise<PublicSection | null> {
  try {
    const { data } = await getSupabaseClient()
      .from(CONTENT_SECTIONS_TABLE)
      .select(SECTION_COLS)
      .eq('kind', kind)
      .eq('slug', slug)
      .limit(5);
    const list = (data || []) as unknown as Record<string, unknown>[];
    const found = list.find((r) => !r.parent_id) ?? list[0];
    return found ? mapSection(found, lang) : null;
  } catch {
    return null;
  }
}

/** Drumul de la rubrica principală până aici. */
export async function fetchTrail(section: PublicSection, lang: string): Promise<PublicSection[]> {
  const path: PublicSection[] = [];
  let parent = section.parent_id;
  for (let i = 0; parent && i < 12; i += 1) {
    const { data } = await getSupabaseClient()
      .from(CONTENT_SECTIONS_TABLE)
      .select(SECTION_COLS)
      .eq('id', parent)
      .maybeSingle();
    if (!data) break;
    const r = data as unknown as Record<string, unknown>;
    const mapped = mapSection(r, lang);
    path.unshift(mapped);
    parent = mapped.parent_id;
  }
  return path;
}

/** Articolele publicate ale unei pagini, cel mai nou întâi. */
export async function fetchItems(
  kind: ContentKind,
  sectionId?: string,
): Promise<ContentItemRow[]> {
  try {
    let query = getSupabaseClient()
      .from(CONTENT_ITEMS_TABLE)
      .select('*')
      .eq('kind', kind)
      .eq('published', true);
    if (sectionId) query = query.contains('section_ids', [sectionId]);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as unknown as ContentItemRow[];
  } catch {
    return [];
  }
}
