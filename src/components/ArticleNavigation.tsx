// Article Navigation Component (Previous/Next)
// Artikelnavigation-Komponente (Vorheriger/Nächster)
// Componentă Navigare Articol (Anterior/Următor)

'use client';

import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from '@/hooks/useTranslation';
import { useState, useEffect } from 'react';

interface ArticleNavigationProps {
  prevArticle?: {
    slug: string;
    title: string;
  } | null;
  nextArticle?: {
    slug: string;
    title: string;
  } | null;
}

const translations = {
  de: {
    previous: 'Vorheriger Artikel',
    next: 'Nächster Artikel',
    prevShort: '←',
    nextShort: '→',
  },
  en: {
    previous: 'Previous Article',
    next: 'Next Article',
    prevShort: '←',
    nextShort: '→',
  },
  ro: {
    previous: 'Articolul anterior',
    next: 'Articolul următor',
    prevShort: '←',
    nextShort: '→',
  },
  ru: {
    previous: 'Предыдущая статья',
    next: 'Следующая статья',
    prevShort: '←',
    nextShort: '→',
  },
};

export default function ArticleNavigation({ prevArticle, nextArticle }: ArticleNavigationProps) {
  const { language } = useLanguage();
  const { translate } = useTranslation();
  const t = translations[language as keyof typeof translations] || translations.de;
  
  // State for translated titles
  const [prevTitle, setPrevTitle] = useState(prevArticle?.title || '');
  const [nextTitle, setNextTitle] = useState(nextArticle?.title || '');

  // Translate titles when language changes
  useEffect(() => {
    const translateTitles = async () => {
      if (language !== 'ro') { // Only translate if not Romanian (original)
        if (prevArticle?.title) {
          const translated = await translate(prevArticle.title, language);
          setPrevTitle(translated || prevArticle.title);
        }
        if (nextArticle?.title) {
          const translated = await translate(nextArticle.title, language);
          setNextTitle(translated || nextArticle.title);
        }
      } else {
        // Reset to originals for Romanian
        setPrevTitle(prevArticle?.title || '');
        setNextTitle(nextArticle?.title || '');
      }
    };

    translateTitles();
  }, [language, prevArticle?.title, nextArticle?.title, translate]);

  // Don't render if no navigation available
  if (!prevArticle && !nextArticle) {
    return null;
  }

  return (
    <nav 
      className="w-full py-4 mt-4 border-t border-white/10 no-print print:hidden"
      aria-label="Article navigation"
    >
      {/* Always horizontal layout with grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Previous Article */}
        {prevArticle ? (
          <Link
            href={`/blogs/${prevArticle.slug}`}
            className="
              group flex items-center gap-2
              px-2 py-1.5 rounded
              text-white/60 hover:text-white/90
              transition-all duration-200
              touch-manipulation
            "
          >
            <span className="text-sm font-medium flex-shrink-0">{t.prevShort}</span>
            <span className="text-sm font-medium truncate">
              {prevTitle}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {/* Next Article */}
        {nextArticle ? (
          <Link
            href={`/blogs/${nextArticle.slug}`}
            className="
              group flex items-center justify-end gap-2
              px-2 py-1.5 rounded
              text-white/60 hover:text-white/90
              transition-all duration-200
              touch-manipulation
            "
          >
            <span className="text-sm font-medium truncate text-right">
              {nextTitle}
            </span>
            <span className="text-sm font-medium flex-shrink-0">{t.nextShort}</span>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </nav>
  );
}
