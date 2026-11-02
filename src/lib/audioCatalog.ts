'use client';

// Lista oficiala de bloguri, in ordinea din pagina Blogs (cele mai noi primele), pentru „urmatorul / anteriorul" din playerul mic
// si pentru listele „Recomandate", „Ultimele" si „Serii" din fereastra lui.

import { getSupabaseClient } from '@/lib/supabase';
import { fetchBlogsHome } from '@/lib/blogsHome';
import { fetchBlogSeriesConfig, type BlogSeries } from '@/lib/blogSeries';
import type { HubTrack } from '@/lib/audioHub';

export type CatalogTrack = Omit<HubTrack, 'lang'>;

export interface Catalog {
  /** Toate blogurile publicate, cele mai noi primele. */
  all: CatalogTrack[];
  recommended: CatalogTrack[];
  series: { series: BlogSeries; tracks: CatalogTrack[] }[];
}

const EMPTY: Catalog = { all: [], recommended: [], series: [] };
let cache: Promise<Catalog> | null = null;
let loaded: Catalog | null = null;

export function getCatalogSync(): Catalog | null {
  return loaded;
}

export function fetchCatalog(): Promise<Catalog> {
  if (cache) return cache;
  cache = (async (): Promise<Catalog> => {
    try {
      const { data, error } = await getSupabaseClient()
        .from('blog_posts')
        .select('id, slug, title, title_de, title_en, title_ru, image_url, category_ids')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(300);
      if (error || !data) {
        cache = null;
        return EMPTY;
      }
      const byId = new Map<string, CatalogTrack>();
      const all: CatalogTrack[] = [];
      for (const r of data as unknown as Record<string, unknown>[]) {
        const slug = r.slug as string;
        const track: CatalogTrack = {
          slug,
          audioSlug: slug,
          rawSlug: slug,
          table: 'blog_posts',
          title: (r.title as string) ?? '',
          titles: { de: r.title_de as string, en: r.title_en as string, ru: r.title_ru as string },
          categoryIds: (r.category_ids as string[] | null) ?? [],
          href: `/blogs/${slug}`,
          imageUrl: (r.image_url as string | null) ?? null,
        };
        byId.set(r.id as string, track);
        all.push(track);
      }
      const [home, cfg] = await Promise.all([fetchBlogsHome(), fetchBlogSeriesConfig()]);
      const pick = (ids: string[]) => ids.map((i) => byId.get(i)).filter((t): t is CatalogTrack => Boolean(t));
      loaded = {
        all,
        recommended: pick(home.recommended),
        series: cfg.series.map((s) => ({ series: s, tracks: pick(s.ids) })).filter((s) => s.tracks.length > 0),
      };
      return loaded;
    } catch {
      cache = null;
      return EMPTY;
    }
  })();
  return cache;
}
