'use client';

// Telefon si tableta: o banda de pastile (Archiv + categoriile existente) care se poate glisa,
// iar sub ea, cand alegi o categorie, textele din ea ca niste placi mici (imagine + titlu).
// Pe desktop nu apare nimic. Aceeasi componenta la bloguri, marturii, Andacht si Pentru copii.

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/hooks/useLanguage';
import { useRowTitles } from '@/hooks/useRowTitles';
import { fetchCategories, categoryName, type Category } from '@/lib/categories';
import { getSupabaseClient } from '@/lib/supabase';

type Table = 'blog_posts' | 'testimonies' | 'content_items';

interface Row {
  id: string;
  slug: string;
  title: string;
  image_url: string | null;
  created_at: string;
  category_ids: string[] | null;
  [key: string]: unknown;
}

interface Props {
  table: Table;
  /** Doar pentru `content_items`: 'andacht' sau 'copii'. */
  kind?: string;
  /** Inceputul adresei unui text, de pilda `/blogs`. */
  itemPath: string;
  /** Primul buton din banda. Gol = fara. */
  archiveHref?: string;
  onSelectedChange?: (id: string | null) => void;
  className?: string;
}

const ARCHIVE_LABEL: Record<string, string> = { de: 'Archiv', en: 'Archive', ro: 'Arhivă', ru: 'Архив' };

const COLUMNS = 'id, slug, title, title_de, title_en, title_ro, title_ru, image_url, created_at, category_ids';
const FALLBACK_COLUMNS = 'id, slug, title, image_url, created_at, category_ids';

export default function MobileCategoryBrowser({
  table,
  kind,
  itemPath,
  archiveHref,
  onSelectedChange,
  className = '',
}: Props) {
  const { language } = useLanguage();
  const lang = ['de', 'en', 'ro', 'ru'].includes(language) ? language : 'de';

  const [categories, setCategories] = useState<Category[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchCategories().then((c) => alive && setCategories(c));
    (async () => {
      const sb = getSupabaseClient();
      const run = (cols: string) => {
        let q = sb.from(table).select(cols).eq('published', true);
        if (kind) q = q.eq('kind', kind);
        return q.order('created_at', { ascending: false }).limit(500);
      };
      let { data, error } = await run(COLUMNS);
      if (error) ({ data, error } = await run(FALLBACK_COLUMNS));
      if (!alive || error) return;
      setRows((data ?? []) as unknown as Row[]);
    })();
    return () => {
      alive = false;
    };
  }, [table, kind]);

  const usable = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((r) => (r.category_ids ?? []).forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1)));
    return categories.filter((c) => (counts.get(c.id) ?? 0) > 0);
  }, [categories, rows]);

  const shown = useMemo(
    () => (selected ? rows.filter((r) => (r.category_ids ?? []).includes(selected)) : []),
    [rows, selected],
  );

  const titleOf = useRowTitles(shown, lang);

  const choose = (id: string) => {
    const next = selected === id ? null : id;
    setSelected(next);
    onSelectedChange?.(next);
  };

  if (!archiveHref && usable.length === 0) return null;

  const pill =
    'inline-flex min-h-[40px] shrink-0 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors';

  return (
    <div className={`lg:hidden ${className}`}>
      <div
        className="scrollbar-hide -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {archiveHref && (
          <Link
            href={archiveHref}
            className={`${pill} snap-start border border-black/20 bg-black/[0.06] text-black dark:border-white/25 dark:bg-white/10 dark:text-white`}
          >
            {ARCHIVE_LABEL[lang]}
          </Link>
        )}
        {usable.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => choose(c.id)}
            aria-pressed={selected === c.id}
            className={`${pill} snap-start ${
              selected === c.id
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'bg-black/[0.08] text-black dark:bg-white/10 dark:text-white'
            }`}
          >
            {categoryName(c, lang)}
          </button>
        ))}
      </div>

      {selected && shown.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-2">
          {shown.map((r) => (
            <li key={r.id} className={shown.length === 1 ? 'col-span-2' : ''}>
              <Link
                href={`${itemPath}/${r.slug}`}
                className="flex h-14 items-center gap-2.5 overflow-hidden rounded-md bg-black/[0.07] pr-2 dark:bg-white/[0.09]"
              >
                <span className="relative h-14 w-14 shrink-0 bg-neutral-800">
                  {r.image_url && <Image src={r.image_url} alt="" fill sizes="56px" className="object-cover" />}
                </span>
                <span className="line-clamp-2 min-w-0 text-[13px] font-bold leading-tight text-black dark:text-white">
                  {titleOf(r)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
