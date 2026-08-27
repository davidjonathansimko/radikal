// Pasul 2108002 — filtrare si cautare pentru listele din panoul de admin
//
// Problema rezolvata: cu 100 de reels sau 100 de articole, lista devenea
// un zid de text imposibil de parcurs.
//
// Comportament:
//   - implicit se arata doar ULTIMELE 5 elemente
//   - se poate cauta dupa text
//   - se poate filtra dupa an si luna (ca in meniul de blog)
//
// Hook-ul este generic, deci acelasi cod serveste si pentru reels,
// si pentru articole, dar fiecare lista are starea ei separata.

'use client';

import { useMemo, useState } from 'react';

export const DEFAULT_VISIBLE = 5;

export interface FilterableItem {
  created_at?: string | null;
}

const MONTH_NAMES = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];

export function useAdminListFilter<T extends FilterableItem>(
  items: T[],
  getSearchText: (item: T) => string,
) {
  const [search, setSearch] = useState('');
  const [year, setYear] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [showAll, setShowAll] = useState(false);

  // Anii disponibili, descrescator
  const years = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.created_at) set.add(String(new Date(it.created_at).getFullYear()));
    });
    return [...set].sort((a, b) => Number(b) - Number(a));
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((it) => {
      if (q && !getSearchText(it).toLowerCase().includes(q)) return false;

      if ((year || month) && it.created_at) {
        const d = new Date(it.created_at);
        if (year && String(d.getFullYear()) !== year) return false;
        if (month && String(d.getMonth() + 1) !== month) return false;
      } else if (year || month) {
        return false;
      }

      return true;
    });
  }, [items, search, year, month, getSearchText]);

  // Filtrele active inseamna ca utilizatorul cauta ceva anume -> aratam tot
  const isFiltering = Boolean(search.trim() || year || month);
  const visible = showAll || isFiltering ? filtered : filtered.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = filtered.length - visible.length;

  const reset = () => {
    setSearch('');
    setYear('');
    setMonth('');
    setShowAll(false);
  };

  return {
    search, setSearch,
    year, setYear,
    month, setMonth,
    showAll, setShowAll,
    years,
    monthNames: MONTH_NAMES,
    filtered,
    visible,
    hiddenCount,
    isFiltering,
    reset,
  };
}

export default useAdminListFilter;
