// Print Button Component / Drucken-Button-Komponente / Componenta Buton Imprimare
// Allows users to print blog posts with optimized styling
// Ermöglicht Benutzern das Drucken von Blog-Posts mit optimiertem Styling
// Permite utilizatorilor să imprime postările de blog cu stiluri optimizate

'use client';

import React from 'react';
import { FaDownload } from 'react-icons/fa';
import { useLanguage } from '@/hooks/useLanguage';

interface PrintButtonProps {
  className?: string;
  variant?: 'button' | 'icon';
  showLabel?: boolean;
}

// Changed to download icon + "PDF" text for compact display / Geändert zu Download-Icon + "PDF" Text für kompakte Anzeige / Schimbat la icon download + text "PDF" pentru afișare compactă
const translations = {
  de: { print: 'Drucken', printArticle: 'Artikel drucken', saveAsPdf: 'Als PDF speichern', pdf: 'PDF' },
  en: { print: 'Print', printArticle: 'Print article', saveAsPdf: 'Save as PDF', pdf: 'PDF' },
  ro: { print: 'Printează', printArticle: 'Printează articolul', saveAsPdf: 'Salvează ca PDF', pdf: 'PDF' },
  ru: { print: 'Печать', printArticle: 'Распечатать статью', saveAsPdf: 'Сохранить как PDF', pdf: 'PDF' }
};

export default function PrintButton({ className = '', variant = 'button', showLabel = false }: PrintButtonProps) {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.de;

  const handlePrint = () => {
    window.print();
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handlePrint}
        className={`flex-shrink-0 px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 sm:py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-all no-print flex items-center gap-1 xs:gap-1.5 ${className}`}
        title={t.saveAsPdf}
      >
        <FaDownload className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
        <span className="text-xs xs:text-sm sm:text-sm font-semibold whitespace-nowrap">{t.pdf}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handlePrint}
      className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white/80 transition-all no-print ${className}`}
      title={t.saveAsPdf}
    >
      <FaDownload className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
      <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{t.pdf}</span>
    </button>
  );
}
