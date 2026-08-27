// Pasul 2108002 — bara de cautare + filtre an/luna pentru listele din admin
//
// Componenta pura de prezentare. Primeste tot ce ii trebuie de la
// `useAdminListFilter`, deci reels si articolele au filtre SEPARATE,
// fiecare cu starea lui.

'use client';

import React from 'react';

interface AdminListFilterBarProps {
  placeholder: string;
  search: string;
  setSearch: (v: string) => void;
  year: string;
  setYear: (v: string) => void;
  month: string;
  setMonth: (v: string) => void;
  years: string[];
  monthNames: string[];
  totalCount: number;
  filteredCount: number;
  isFiltering: boolean;
  onReset: () => void;
}

export default function AdminListFilterBar({
  placeholder,
  search,
  setSearch,
  year,
  setYear,
  month,
  setMonth,
  years,
  monthNames,
  totalCount,
  filteredCount,
  isFiltering,
  onReset,
}: AdminListFilterBarProps) {
  const field =
    'rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:focus:border-white/40 transition-colors';

  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className={`${field} w-full min-w-0`}
      />

      <select value={year} onChange={(e) => setYear(e.target.value)} className={field}>
        <option value="">Toți anii</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      <select value={month} onChange={(e) => setMonth(e.target.value)} className={field}>
        <option value="">Toate lunile</option>
        {monthNames.map((m, i) => (
          <option key={m} value={String(i + 1)}>{m}</option>
        ))}
      </select>

      <button
        type="button"
        onClick={onReset}
        disabled={!isFiltering}
        className="rounded-lg border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black/70 dark:text-white/70 transition-colors hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40"
      >
        Resetează
      </button>

      <p className="sm:col-span-4 text-xs text-black/50 dark:text-white/50">
        {isFiltering
          ? `${filteredCount} din ${totalCount} rezultate`
          : `${totalCount} în total — se afișează ultimele 5`}
      </p>
    </div>
  );
}
