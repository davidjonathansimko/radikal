'use client';

/**
 * Pasul A17 — SELECTOR DE CATEGORII, refolosit in trei locuri:
 *
 *  1. in admin, cand creezi sau editezi un blog (alegi in ce categorii intra);
 *  2. in lista de bloguri din admin, ca filtru (inainte de anul „2026");
 *  3. in modalul de cautare al cititorilor.
 *
 * Cum functioneaza, exact cum a fost cerut:
 *  - se pot bifa MAI MULTE categorii deodata (familie + casnicie = ambele);
 *  - implicit se vad doar primele 4, ca sa nu fie aglomerat;
 *  - cum incepi sa scrii, se filtreaza TOATE categoriile, nu doar cele 4;
 *  - cautarea merge in orice limba (scrii „Family" si gaseste „Familie").
 */

import React, { useMemo, useState } from 'react';
import {
  type Category,
  categoryName,
  categorySearchText,
  categoryUiText,
  categoryMoreLabel,
} from '@/lib/categories';

export interface CategoryPickerProps {
  categories: Category[];
  /** Id-urile bifate acum */
  value: string[];
  onChange: (ids: string[]) => void;
  lang: string;
  /** Cate categorii se vad inainte sa scrii ceva. Implicit 4. */
  visibleCount?: number;
  /** Textul din casuta de cautare */
  placeholder?: string;
  className?: string;
}

export default function CategoryPicker({
  categories,
  value,
  onChange,
  lang,
  visibleCount = 4,
  placeholder,
  className = '',
}: CategoryPickerProps) {
  const [query, setQuery] = useState('');
  /** „Arata-le pe toate" — apasat manual, fara sa scrii nimic */
  const [showAll, setShowAll] = useState(false);

  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return categories;
    return categories.filter((c) => categorySearchText(c).includes(q));
  }, [categories, q]);

  // Cand nu scrii nimic aratam doar primele `visibleCount`.
  // DAR categoriile deja bifate raman mereu vizibile, ca sa stii ce ai ales.
  const shown = useMemo(() => {
    if (q || showAll) return filtered;
    const first = filtered.slice(0, visibleCount);
    const selectedOutside = filtered.filter(
      (c) => value.includes(c.id) && !first.some((f) => f.id === c.id),
    );
    return [...first, ...selectedOutside];
  }, [filtered, q, showAll, visibleCount, value]);

  const hiddenCount = filtered.length - shown.length;

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  if (categories.length === 0) {
    return (
      <p className={`text-xs opacity-60 ${className}`}>
        {categoryUiText(lang, 'empty')}
      </p>
    );
  }

  return (
    <div className={className}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder ?? categoryUiText(lang, 'searchPlaceholder')}
        className="mb-3 w-full rounded-lg border border-current/20 bg-transparent px-3 py-2 text-sm outline-none placeholder:opacity-50 focus:border-current/50"
      />

      <div className="flex flex-wrap gap-2">
        {shown.map((c) => {
          const active = value.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                active
                  ? 'border-current bg-current/20 font-medium'
                  : 'border-current/25 opacity-70 hover:opacity-100'
              }`}
            >
              {categoryName(c, lang)}
            </button>
          );
        })}

        {/* Pasul 2308006-C: „+ încă 9" vorbeste acum limba cititorului */}
        {!q && !showAll && hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="rounded-full border border-dashed border-current/30 px-3 py-1.5 text-xs opacity-60 hover:opacity-100"
          >
            {categoryMoreLabel(lang, hiddenCount)}
          </button>
        )}

        {q && filtered.length === 0 && (
          <span className="py-1.5 text-xs opacity-50">
            {categoryUiText(lang, 'noneFound')}
          </span>
        )}
      </div>

      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="mt-3 text-xs underline opacity-60 hover:opacity-100"
        >
          {categoryUiText(lang, 'clear')} ({value.length})
        </button>
      )}
    </div>
  );
}
