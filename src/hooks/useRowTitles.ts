'use client';

// Titlurile in limba cititorului: cel scris de admin daca exista, altfel DeepL (cu cache),
// iar daca traducerea esueaza, originalul. Pana vine traducerea nu se arata romana.

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface TitledRow {
  id: string;
  title: string;
}

function written(row: TitledRow, lang: string): string {
  const mine = (row as unknown as Record<string, unknown>)[`title_${lang}`];
  // Un titlu "tradus" identic cu originalul romanesc inseamna ca de fapt nu e tradus.
  return typeof mine === 'string' && mine.trim() !== row.title.trim() ? mine.trim() : '';
}

export function useRowTitles<T extends TitledRow>(rows: T[], lang: string): (row: T) => string {
  const { translateBatch } = useTranslation();
  const [translated, setTranslated] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lang === 'ro') return;
    const missing = rows.filter((r) => r.title && !written(r, lang) && translated[r.id] === undefined);
    if (missing.length === 0) return;
    let alive = true;
    translateBatch(missing.map((r) => r.title), lang, 'ro')
      .catch(() => [] as string[])
      .then((out) => {
        if (!alive) return;
        setTranslated((prev) => {
          const next = { ...prev };
          missing.forEach((r, i) => {
            next[r.id] = (out[i] || '').trim() || r.title;
          });
          return next;
        });
      });
    return () => {
      alive = false;
    };
  }, [rows, lang, translateBatch, translated]);

  return useCallback(
    (row: T) => {
      if (lang === 'ro') return row.title;
      return written(row, lang) || translated[row.id] || '';
    },
    [lang, translated],
  );
}
