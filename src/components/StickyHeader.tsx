// Sticky Section Header Component / Sticky-Abschnitts-Kopfzeile Komponente / Componentă Antet Secțiune Lipicios
// Shows the current section title in a floating header when scrolling
// Zeigt den aktuellen Abschnittstitel in einer schwebenden Kopfzeile beim Scrollen
// Arată titlul secțiunii curente într-un antet plutitor la derulare

'use client';

import React from 'react';
import { useStickyHeader } from '@/hooks/useStickyHeader';

interface SectionInfo {
  id: string;
  title: Record<string, string>;
}

interface StickyHeaderProps {
  sections: SectionInfo[];
  language: string;
}

export default function StickyHeader({ sections, language }: StickyHeaderProps) {
  const { currentTitle, isScrolled, progress } = useStickyHeader(sections, language);

  if (!isScrolled || !currentTitle) return null;

  return (
    <div 
      className={`fixed top-16 left-0 right-0 z-[190] lg:hidden transition-all duration-500 pointer-events-none ${
        isScrolled && currentTitle ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="flex justify-center px-4 pt-2">
        <div className="pointer-events-auto flex items-center gap-3 bg-white/80 dark:bg-black/70 backdrop-blur-xl rounded-full border border-black/10 dark:border-white/15 shadow-lg px-5 py-2 max-w-[280px]">
          {/* Section progress dot / Abschnitts-Fortschrittspunkt / Punct progres secțiune */}
          <div className="relative w-2 h-2 flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-black/20 dark:bg-white/20" />
            <div 
              className="absolute inset-0 rounded-full bg-black dark:bg-white transition-transform duration-300 origin-center"
              style={{ transform: `scale(${0.3 + progress * 0.7})` }}
            />
          </div>
          
          {/* Section title / Abschnittstitel / Titlul secțiunii */}
          <span className="font-cinzel text-sm font-semibold text-black/80 dark:text-white/80 truncate animate-fadeIn">
            {currentTitle}
          </span>
          
          {/* Mini progress bar / Mini-Fortschrittsleiste / Bară de progres mini */}
          <div className="w-8 h-0.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden flex-shrink-0">
            <div 
              className="h-full bg-black/50 dark:bg-white/50 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
