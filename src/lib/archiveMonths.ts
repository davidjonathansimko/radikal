/**
 * Pasul 2708017 — arhiva pe ani și luni, pentru meniu.
 *
 * Aceeași socoteală se folosea doar la bloguri, scrisă direct în meniu.
 * Acum stă într-un singur loc și merge la orice tabel care are `created_at`
 * și `published` — bloguri, mărturii și ce va mai urma.
 */

import { getSupabaseClient } from '@/lib/supabase';

export interface ArchiveMonth {
  month: number;
  year: number;
  count: number;
  label: string;
}

export interface ArchiveYear {
  year: number;
  months: ArchiveMonth[];
  totalCount: number;
}

const MONTH_NAMES: Record<string, string[]> = {
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ro: ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
};

/** Anii și lunile în care există articole publicate, cel mai nou întâi. */
export async function fetchArchiveYears(table: string, language: string): Promise<ArchiveYear[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from(table)
      .select('created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error || !data) return [];

    const monthsMap = new Map<string, ArchiveMonth>();
    (data as { created_at: string }[]).forEach((row) => {
      const date = new Date(row.created_at);
      const month = date.getMonth();
      const year = date.getFullYear();
      const key = `${year}-${month}`;
      const found = monthsMap.get(key);
      if (found) found.count += 1;
      else monthsMap.set(key, { month, year, count: 1, label: '' });
    });

    const names = MONTH_NAMES[language] || MONTH_NAMES.en;
    const months = Array.from(monthsMap.values()).map((m) => ({
      ...m,
      label: `${names[m.month]} ${m.year}`,
    }));

    const yearsMap = new Map<number, ArchiveYear>();
    months.forEach((m) => {
      const y = yearsMap.get(m.year) ?? { year: m.year, months: [], totalCount: 0 };
      y.months.push(m);
      y.totalCount += m.count;
      yearsMap.set(m.year, y);
    });

    return Array.from(yearsMap.values())
      .map((y) => ({ ...y, months: y.months.sort((a, b) => b.month - a.month) }))
      .sort((a, b) => b.year - a.year);
  } catch {
    return [];
  }
}
