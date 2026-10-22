'use client';

// Pasul 2210007 — Zeugnisse ca un cuprins de carte: rubrici care se desfac,
// cu rubricile dinauntru si mărturiile la vedere. Totul se incarca la cerere.

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { pickTestimonyText, type TestimonyRow } from '@/lib/testimonies';

type Lang = 'ro' | 'de' | 'en' | 'ru';

export interface TocSection {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
}

interface Loaded {
  children: TocSection[];
  items: { id: string; slug: string; title: string }[];
}

const SECTION_COLS = 'id, slug, name_ro, name_de, name_en, name_ru';
const ITEM_COLS = 'id, slug, title, title_de, title_en, title_ro, title_ru, created_at, section_ids';

function TocNode({ section, lang, depth }: { section: TocSection; lang: Lang; depth: number }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Loaded | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = useCallback(async () => {
    const next = !open;
    setOpen(next);
    if (!next || data || busy) return;
    setBusy(true);
    try {
      const sb = getSupabaseClient();
      const [secRes, itemRes] = await Promise.all([
        sb
          .from('testimony_sections')
          .select(SECTION_COLS)
          .eq('parent_id', section.id)
          .eq('published', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        sb
          .from('testimonies')
          .select(ITEM_COLS)
          .eq('published', true)
          .contains('section_ids', [section.id])
          .order('created_at', { ascending: true }),
      ]);

      const children = ((secRes.data || []) as unknown as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        slug: r.slug as string,
        name: ((r[`name_${lang}`] as string) || (r.name_ro as string) || '').trim(),
      }));
      const items = ((itemRes.data || []) as unknown as TestimonyRow[]).map((r) => ({
        id: r.id,
        slug: r.slug,
        title: pickTestimonyText(r, 'title', lang),
      }));
      setData({ children, items });
    } finally {
      setBusy(false);
    }
  }, [open, data, busy, section.id, lang]);

  const total = data ? data.items.length + data.children.length : null;

  return (
    <li>
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => void toggle()}
          aria-expanded={open}
          className="btn-solid flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          style={{ paddingLeft: `${1 + depth * 1.25}rem` }}
        >
          <svg
            className={`h-3.5 w-3.5 shrink-0 text-black/40 transition-transform duration-200 dark:text-white/40 ${
              open ? 'rotate-90' : ''
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
          <span className="min-w-0 flex-1 truncate font-cinzel text-base font-semibold text-black dark:text-white">
            {section.name}
          </span>
          {total !== null && (
            <span className="shrink-0 text-xs tabular-nums text-black/40 dark:text-white/40">{total}</span>
          )}
        </button>
        <Link
          href={`/marturii/${section.slug}`}
          aria-label={section.name}
          className="flex w-11 shrink-0 items-center justify-center text-black/30 transition-colors hover:text-black dark:text-white/30 dark:hover:text-white"
        >
          <span aria-hidden="true">›</span>
        </Link>
      </div>

      {open && (
        <ul className="border-t border-black/5 dark:border-white/5">
          {busy && !data && (
            <li className="px-4 py-3 text-xs text-black/40 dark:text-white/40" style={{ paddingLeft: `${1.5 + depth * 1.25}rem` }}>
              …
            </li>
          )}
          {data?.children.map((c) => (
            <TocNode key={c.id} section={c} lang={lang} depth={depth + 1} />
          ))}
          {data?.items.map((it) => (
            <li key={it.id}>
              <Link
                href={`/marturii/m/${it.slug}`}
                className="flex items-center gap-3 py-2.5 pr-4 text-sm text-black/80 transition-colors hover:bg-black/[0.04] dark:text-white/80 dark:hover:bg-white/[0.06]"
                style={{ paddingLeft: `${1.6 + (depth + 1) * 1.25}rem` }}
              >
                <svg
                  className="h-4 w-4 shrink-0 text-black/35 dark:text-white/35"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                  <path d="M14 2v6h6" />
                </svg>
                <span className="min-w-0 flex-1 truncate">{it.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function TestimonyToc({ sections, lang }: { sections: TocSection[]; lang: Lang }) {
  return (
    <ul className="divide-y divide-black/10 overflow-hidden rounded-2xl border border-black/10 dark:divide-white/10 dark:border-white/10">
      {sections.map((s) => (
        <TocNode key={s.id} section={s} lang={lang} depth={0} />
      ))}
    </ul>
  );
}
