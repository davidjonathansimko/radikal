'use client';

// Sortare pe categorii, aceeasi bara pe bloguri, marturii, Andacht si Pentru
// copii. Arata doar categoriile care au cel putin un articol, cu numarul lor.
// Daca nu exista nicio categorie, nu se vede nimic.

import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import CategoryPicker from '@/components/CategoryPicker';
import { fetchCategories, categoryUiText, type Category } from '@/lib/categories';
import { getSupabaseClient } from '@/lib/supabase';

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
  className?: string;
  /** De unde numaram articolele fiecarei categorii. */
  table?: 'blog_posts' | 'testimonies' | 'content_items';
  /** Doar pentru `content_items`: 'andacht' sau 'copii'. */
  kind?: string;
}

export default function CategoryFilterBar({ value, onChange, className = '', table, kind }: Props) {
  const { language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchCategories().then((c) => alive && setCategories(c));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!table) return;
    let alive = true;
    (async () => {
      try {
        let q = getSupabaseClient().from(table).select('category_ids').eq('published', true);
        if (kind) q = q.eq('kind', kind);
        const { data, error } = await q.limit(5000);
        // Fara coloana (SQL-ul nu a rulat) lasam lista completa, fara numere.
        if (error || !data || !alive) return;
        const map: Record<string, number> = {};
        (data as { category_ids: string[] | null }[]).forEach((r) =>
          (r.category_ids ?? []).forEach((id) => {
            map[id] = (map[id] ?? 0) + 1;
          }),
        );
        setCounts(map);
      } catch {
        /* lista ramane completa */
      }
    })();
    return () => {
      alive = false;
    };
  }, [table, kind]);

  const visible = useMemo(
    () =>
      counts
        ? categories.filter((c) => (counts[c.id] ?? 0) > 0 || value.includes(c.id))
        : categories,
    [categories, counts, value],
  );

  if (visible.length === 0) return null;

  const shownCounts = counts
    ? Object.fromEntries(visible.map((c) => [c.id, counts[c.id] ?? 0]))
    : undefined;

  return (
    <div className={`mx-auto w-full max-w-3xl text-gray-800 dark:text-white ${className}`}>
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
        {categoryUiText(language, 'title')}
      </p>
      <CategoryPicker
        categories={visible}
        value={value}
        onChange={onChange}
        lang={language}
        counts={shownCounts}
      />
    </div>
  );
}
