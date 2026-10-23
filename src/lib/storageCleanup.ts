// Fisiere din Supabase Storage: foldere clare (tip/titlu) si stergerea fisierelor vechi dupa inlocuire.
// Un fisier se sterge DOAR daca nu mai e folosit nicaieri (verificam toate tabelele care il pot pomeni).

import { getSupabaseClient } from '@/lib/supabase';

export type OwnerKind = 'blog' | 'marturie' | 'andacht' | 'copii' | 'verset' | 'news' | 'reel';

const OWNER_FOLDER: Record<OwnerKind, string> = {
  blog: 'bloguri',
  marturie: 'marturii',
  andacht: 'andacht',
  copii: 'copii',
  verset: 'verset-zilnic',
  news: 'stiri',
  reel: 'reels',
};

export function slugifyLabel(value: string | null | undefined, max = 48): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ăâ]/g, 'a')
    .replace(/[îÎ]/g, 'i')
    .replace(/[șȘ]/g, 's')
    .replace(/[țȚ]/g, 't')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, max);
}

/** Ex.: `bloguri/der-weg` — se vede din Storage carui text apartine fisierul. */
export function storageFolder(kind: OwnerKind, label?: string | null): string {
  return `${OWNER_FOLDER[kind]}/${slugifyLabel(label) || 'fara-titlu'}`;
}

export function safeFileName(name: string): string {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const clean = slugifyLabel(base, 40) || 'fisier';
  return ext ? `${clean}.${ext}` : clean;
}

const BUCKETS = new Set(['blog-images', 'reels-media', 'blog-audio']);

export function parsePublicUrl(url: string): { bucket: string; path: string } | null {
  const m = /\/storage\/v1\/object\/public\/([^/]+)\/(.+?)(?:\?.*)?$/.exec(url);
  if (!m || !BUCKETS.has(m[1])) return null;
  try {
    return { bucket: m[1], path: decodeURIComponent(m[2]) };
  } catch {
    return null;
  }
}

const REFERENCES: { table: string; columns: string[]; contentColumn?: boolean }[] = [
  { table: 'blog_posts', columns: ['image_url'], contentColumn: true },
  { table: 'testimonies', columns: ['image_url'], contentColumn: true },
  { table: 'content_items', columns: ['image_url'], contentColumn: true },
  { table: 'daily_verses', columns: ['background_image_url', 'audio_url'] },
  { table: 'news_items', columns: ['image_url'] },
  { table: 'reels', columns: ['background_image_url', 'audio_url'] },
  { table: 'blog_custom_audio', columns: ['audio_url'] },
];

function isMissingTable(message: string): boolean {
  return /does not exist|schema cache|Could not find/i.test(message);
}

/** true = fisierul nu mai e folosit de nimeni; la orice dubiu intoarce false. */
async function isUnused(url: string, path: string): Promise<boolean> {
  const sb = getSupabaseClient();
  for (const ref of REFERENCES) {
    for (const column of ref.columns) {
      const { count, error } = await sb.from(ref.table).select('id', { count: 'exact', head: true }).eq(column, url);
      if (error) {
        if (isMissingTable(error.message)) continue;
        return false;
      }
      if ((count ?? 0) > 0) return false;
    }
    if (ref.contentColumn) {
      const { count, error } = await sb
        .from(ref.table)
        .select('id', { count: 'exact', head: true })
        .ilike('content', `%${path}%`);
      if (error) {
        if (isMissingTable(error.message)) continue;
        return false;
      }
      if ((count ?? 0) > 0) return false;
    }
  }
  return true;
}

/** Sterge fisierul din Storage doar daca nu il mai foloseste nimeni. Nu arunca erori. */
export async function removeIfUnused(url: string | null | undefined): Promise<boolean> {
  if (!url) return false;
  const parsed = parsePublicUrl(url);
  if (!parsed) return false;
  try {
    if (!(await isUnused(url, parsed.path))) return false;
    const { error } = await getSupabaseClient().storage.from(parsed.bucket).remove([parsed.path]);
    return !error;
  } catch {
    return false;
  }
}

/** Dupa salvare: daca poza/muzica s-a schimbat, o stergem pe cea veche. */
export async function cleanupReplaced(oldUrl: string | null | undefined, newUrl: string | null | undefined): Promise<void> {
  if (oldUrl && oldUrl !== (newUrl ?? '')) await removeIfUnused(oldUrl);
}

/** Dupa stergerea unui text: fisierele lui nu mai au rost. */
export async function cleanupDeleted(urls: (string | null | undefined)[]): Promise<void> {
  for (const u of urls) await removeIfUnused(u);
}
