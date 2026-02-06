// Table of Contents Component / Inhaltsverzeichnis-Komponente / Componenta Cuprins
// Auto-generates table of contents from headings in blog content
// Generiert automatisch Inhaltsverzeichnis aus Überschriften im Blog-Inhalt
// Generează automat cuprins din titlurile din conținutul blogului

'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { FaList, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentSelector?: string;
  className?: string;
}

const translations = {
  de: {
    title: 'Inhaltsverzeichnis',
    show: 'Anzeigen',
    hide: 'Ausblenden'
  },
  en: {
    title: 'Table of Contents',
    show: 'Show',
    hide: 'Hide'
  },
  ro: {
    title: 'Cuprins',
    show: 'Arată',
    hide: 'Ascunde'
  },
  ru: {
    title: 'Содержание',
    show: 'Показать',
    hide: 'Скрыть'
  }
};

export default function TableOfContents({ contentSelector = '#blog-content', className = '' }: TableOfContentsProps) {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.de;
  const [items, setItems] = useState<TOCItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeId, setActiveId] = useState<string>('');

  // Extract headings from content
  useEffect(() => {
    const extractHeadings = () => {
      const content = document.querySelector(contentSelector);
      if (!content) return;

      const headings = content.querySelectorAll('h2, h3, h4');
      const tocItems: TOCItem[] = [];

      headings.forEach((heading, index) => {
        // Generate ID if not present
        if (!heading.id) {
          heading.id = `heading-${index}`;
        }

        tocItems.push({
          id: heading.id,
          text: heading.textContent || '',
          level: parseInt(heading.tagName[1])
        });
      });

      setItems(tocItems);
    };

    // Wait for content to render
    const timer = setTimeout(extractHeadings, 500);
    return () => clearTimeout(timer);
  }, [contentSelector]);

  // Track active heading on scroll
  useEffect(() => {
    const handleScroll = () => {
      const headingElements = items.map(item => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i];
        if (element && element.offsetTop <= scrollPosition) {
          setActiveId(items[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  // Scroll to heading
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  if (items.length < 3) {
    return null; // Don't show TOC for short content
  }

  return (
    <nav className={`bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 text-gray-700 dark:text-white/80">
          <FaList className="w-4 h-4" />
          <span className="font-semibold">{t.title}</span>
          <span className="text-sm text-gray-500 dark:text-white/50">({items.length})</span>
        </div>
        {isExpanded ? (
          <FaChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <FaChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-1">
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => scrollToHeading(item.id)}
              className={`w-full text-left py-1.5 px-3 rounded-lg text-sm transition-all duration-200 ${
                activeId === item.id
                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
              }`}
              style={{ paddingLeft: `${(item.level - 2) * 16 + 12}px` }}
            >
              <span className="line-clamp-1">{item.text}</span>
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

// Floating TOC for desktop sidebar / Schwebendes TOC für Desktop-Seitenleiste / TOC flotant pentru bara laterală desktop
export function FloatingTableOfContents({ contentSelector = '#blog-content' }: { contentSelector?: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed left-4 top-24 w-64 hidden xl:block animate-fadeIn z-40">
      <TableOfContents contentSelector={contentSelector} />
    </div>
  );
}
