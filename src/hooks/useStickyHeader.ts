// Sticky Section Header Hook / Sticky-Abschnitts-Kopfzeile Hook / Hook Antet Secțiune Lipicios
// Tracks which section is currently visible and provides the section title
// Verfolgt welcher Abschnitt gerade sichtbar ist und liefert den Abschnittstitel
// Urmărește care secțiune este vizibilă curent și oferă titlul secțiunii

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SectionInfo {
  id: string;
  title: Record<string, string>;  // Language-based titles / Sprachbasierte Titel / Titluri bazate pe limbă
}

interface UseStickyHeaderReturn {
  currentSection: string | null;
  currentTitle: string;
  isScrolled: boolean;
  progress: number;  // 0-1 scroll progress within current section / 0-1 Scroll-Fortschritt innerhalb des aktuellen Abschnitts
}

export function useStickyHeader(
  sections: SectionInfo[],
  language: string = 'de'
): UseStickyHeaderReturn {
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Update section title when section or language changes
  const updateTitle = useCallback((sectionId: string | null) => {
    if (!sectionId) {
      setCurrentTitle('');
      return;
    }
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setCurrentTitle(section.title[language] || section.title['de'] || '');
    }
  }, [sections, language]);

  useEffect(() => {
    // Scroll detection for showing/hiding sticky header
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 100);

      // Calculate progress within current section
      if (currentSection) {
        const element = document.getElementById(currentSection);
        if (element) {
          const rect = element.getBoundingClientRect();
          const sectionHeight = element.offsetHeight;
          const viewportHeight = window.innerHeight;
          // Progress: how far through the section we've scrolled
          const sectionProgress = Math.max(0, Math.min(1, 
            (viewportHeight - rect.top) / (sectionHeight + viewportHeight)
          ));
          setProgress(sectionProgress);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentSection]);

  useEffect(() => {
    // Intersection Observer to detect visible sections
    // Retry mechanism: sections might not be in DOM yet (e.g. Navigation mounts before page content)
    // Wiederholungsmechanismus: Abschnitte sind möglicherweise noch nicht im DOM
    // Mecanism de reîncercare: secțiunile s-ar putea să nu fie încă în DOM
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 10;

    const setupObserver = () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Check if any sections exist in the DOM
      let foundCount = 0;
      sections.forEach(section => {
        if (document.getElementById(section.id)) foundCount++;
      });

      // If no sections found and we have sections to observe, retry after a short delay
      if (foundCount === 0 && sections.length > 0 && retryCount < MAX_RETRIES) {
        retryCount++;
        retryTimer = setTimeout(setupObserver, 300);
        return;
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          // Find the entry with the largest intersection ratio
          let maxEntry: IntersectionObserverEntry | null = null;
          let maxRatio = 0;

          entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
              maxRatio = entry.intersectionRatio;
              maxEntry = entry;
            }
          });

          if (maxEntry && (maxEntry as IntersectionObserverEntry).target) {
            const sectionId = (maxEntry as IntersectionObserverEntry).target.id;
            if (sectionId) {
              setCurrentSection(sectionId);
              updateTitle(sectionId);
            }
          }
        },
        {
          // Multiple thresholds for smoother detection / Mehrere Schwellenwerte für glattere Erkennung
          threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
          rootMargin: '-10% 0px -10% 0px',
        }
      );

      // Observe all sections
      sections.forEach(section => {
        const element = document.getElementById(section.id);
        if (element) {
          observerRef.current?.observe(element);
        }
      });
    };

    setupObserver();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      observerRef.current?.disconnect();
    };
  }, [sections, updateTitle]);

  // Update title when language changes
  useEffect(() => {
    updateTitle(currentSection);
  }, [language, currentSection, updateTitle]);

  return {
    currentSection,
    currentTitle,
    isScrolled,
    progress,
  };
}

export default useStickyHeader;
