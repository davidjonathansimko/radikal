'use client';

// Pasul 2210003 — alegerea categoriilor pentru marturii, Andacht si Pentru copii
// (blogurile au deja selectorul lor in pagina de admin).

import React, { useEffect, useState } from 'react';
import CategoryPicker from '@/components/CategoryPicker';
import { fetchCategories, type Category } from '@/lib/categories';

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
}

export default function CategoryField({ value, onChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let alive = true;
    void fetchCategories().then((c) => alive && setCategories(c));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
        Categorii
      </p>
      <CategoryPicker
        categories={categories}
        value={value}
        onChange={onChange}
        lang="ro"
        placeholder="Caută o categorie…"
      />
    </div>
  );
}
