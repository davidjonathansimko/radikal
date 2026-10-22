'use client';

// Pasul 2210003 — sortare pe categorii, aceeasi bara pe bloguri, marturii,
// Andacht si „Pentru copii". Daca nu exista nicio categorie, nu se vede nimic.

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import CategoryPicker from '@/components/CategoryPicker';
import { fetchCategories, categoryUiText, type Category } from '@/lib/categories';

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}

export default function CategoryFilterBar({ value, onChange, className = '' }: Props) {
  const { language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let alive = true;
    void fetchCategories().then((c) => alive && setCategories(c));
    return () => {
      alive = false;
    };
  }, []);

  if (categories.length === 0) return null;

  return (
    <div className={`mx-auto w-full max-w-3xl ${className}`}>
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
        {categoryUiText(language, 'title')}
      </p>
      <CategoryPicker categories={categories} value={value} onChange={onChange} lang={language} />
    </div>
  );
}
