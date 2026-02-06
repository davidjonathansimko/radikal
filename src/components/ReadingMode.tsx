// Reading Mode Toggle / Lesemodus-Umschalter / Comutator Mod Citire
// Provides distraction-free reading experience with larger text
// Bietet ablenkungsfreies Leseerlebnis mit größerem Text
// Oferă experiență de citire fără distrageri cu text mai mare

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FaBook, FaTimes, FaFont, FaMinus, FaPlus, FaGlasses } from 'react-icons/fa';
import { useLanguage } from '@/hooks/useLanguage';

interface ReadingModeContextType {
  isReadingMode: boolean;
  toggleReadingMode: () => void;
  fontSize: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}

const ReadingModeContext = createContext<ReadingModeContextType | undefined>(undefined);

const translations = {
  de: {
    readingMode: 'Lesemodus',
    focusMode: 'Fokus-Lesen',
    exitReadingMode: 'Lesemodus beenden',
    fontSize: 'Schriftgröße',
    increase: 'Vergrößern',
    decrease: 'Verkleinern',
    reset: 'Zurücksetzen'
  },
  en: {
    readingMode: 'Reading Mode',
    focusMode: 'Focus Reading',
    exitReadingMode: 'Exit Reading Mode',
    fontSize: 'Font Size',
    increase: 'Increase',
    decrease: 'Decrease',
    reset: 'Reset'
  },
  ro: {
    readingMode: 'Mod Citire',
    focusMode: 'Citire Focalizată',
    exitReadingMode: 'Ieși din Mod Citire',
    fontSize: 'Mărime Font',
    increase: 'Mărește',
    decrease: 'Micșorează',
    reset: 'Resetează'
  },
  ru: {
    readingMode: 'Режим чтения',
    focusMode: 'Фокус чтения',
    exitReadingMode: 'Выйти из режима чтения',
    fontSize: 'Размер шрифта',
    increase: 'Увеличить',
    decrease: 'Уменьшить',
    reset: 'Сбросить'
  }
};

export function ReadingModeProvider({ children }: { children: ReactNode }) {
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [fontSize, setFontSize] = useState(110); // 110% = default for better readability
  // Store Reading Mode specific font size separately from blog font size
  // Start at 110% for reading mode / Startet bei 110% für Lesemodus / Începe la 110% pentru mod citire
  const [readingModeFontSize, setReadingModeFontSize] = useState(110);
  
  // Use ref to store scroll position (doesn't cause re-renders)
  // Verwende ref um Scroll-Position zu speichern (verursacht keine Re-Renders)
  // Folosește ref pentru a stoca poziția scroll (nu cauzează re-render)
  const savedScrollPositionRef = React.useRef(0);

  // DON'T load saved font size - always start at 100% for blog
  // Nur für Reading Mode die Größe speichern, nicht für den Blog

  // Apply font size ONLY when in reading mode
  useEffect(() => {
    if (isReadingMode) {
      document.documentElement.style.setProperty('--reading-font-size', `${readingModeFontSize}%`);
    } else {
      // Reset to 100% when exiting reading mode
      document.documentElement.style.setProperty('--reading-font-size', '100%');
    }
  }, [readingModeFontSize, isReadingMode]);

  // Apply reading mode class, save/restore scroll position
  useEffect(() => {
    if (isReadingMode) {
      // Save current scroll position before entering reading mode
      savedScrollPositionRef.current = window.scrollY;
      document.body.classList.add('reading-mode');
      // Set body top to negative scroll position to maintain visual position
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      // Get the saved position before removing the class
      const scrollY = savedScrollPositionRef.current;
      // Remove reading mode class
      document.body.classList.remove('reading-mode');
      document.body.style.top = '';
      // Restore scroll position after exiting reading mode
      if (scrollY > 0) {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollY);
        });
      }
      // Reset reading mode font size to 110% when exiting
      setReadingModeFontSize(110);
      setFontSize(110);
    }
  }, [isReadingMode]);

  const toggleReadingMode = () => setIsReadingMode(!isReadingMode);
  
  const increaseFontSize = () => {
    const newSize = Math.min(readingModeFontSize + 10, 150);
    setReadingModeFontSize(newSize);
    setFontSize(newSize);
  };
  
  const decreaseFontSize = () => {
    const newSize = Math.max(readingModeFontSize - 10, 70);
    setReadingModeFontSize(newSize);
    setFontSize(newSize);
  };
  
  const resetFontSize = () => {
    setReadingModeFontSize(120);
    setFontSize(120);
  };

  return (
    <ReadingModeContext.Provider value={{
      isReadingMode,
      toggleReadingMode,
      fontSize,
      increaseFontSize,
      decreaseFontSize,
      resetFontSize
    }}>
      {children}
    </ReadingModeContext.Provider>
  );
}

export function useReadingMode() {
  const context = useContext(ReadingModeContext);
  if (!context) {
    throw new Error('useReadingMode must be used within ReadingModeProvider');
  }
  return context;
}

// Reading Mode Toggle Button / Lesemodus-Umschalter-Button / Buton Comutare Mod Citire
// Glasses icon + visible text on all screen sizes
export function ReadingModeToggle() {
  const { isReadingMode, toggleReadingMode } = useReadingMode();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.de;

  return (
    <button
      onClick={toggleReadingMode}
      className={`flex items-center gap-0.5 xs:gap-1 px-1 xs:px-1.5 sm:px-2 py-0.5 xs:py-1 sm:py-1.5 rounded-lg transition-all duration-300 ${
        isReadingMode
          ? 'bg-blue-500 text-white shadow-lg'
          : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/20'
      }`}
      title={isReadingMode ? t.exitReadingMode : t.readingMode}
    >
      <FaGlasses className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
      <span className="text-[0.75rem] xs:text-xs sm:text-sm font-semibold">{t.focusMode}</span>
    </button>
  );
}

// Font Size Controls / Schriftgrößen-Steuerung / Controale Mărime Font
// Compact on mobile, slightly smaller buttons
export function FontSizeControls() {
  const { fontSize, increaseFontSize, decreaseFontSize, resetFontSize } = useReadingMode();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.de;

  return (
    <div className="flex items-center gap-0 xs:gap-0.5 sm:gap-1 bg-gray-100 dark:bg-white/10 rounded-lg px-0 xs:px-0.5 sm:px-1 py-0.5 sm:py-1">
      <button
        onClick={decreaseFontSize}
        disabled={fontSize <= 70}
        className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-white/20 disabled:opacity-30 transition-colors"
        title={t.decrease}
      >
        <FaMinus className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 text-gray-600 dark:text-white/60" />
      </button>
      
      <button
        onClick={resetFontSize}
        className="px-1 xs:px-2 sm:px-2.5 py-0.5 xs:py-1 text-xs xs:text-sm sm:text-base font-medium text-gray-700 dark:text-white/80 hover:bg-gray-200 dark:hover:bg-white/20 rounded-md transition-colors min-w-[2.2rem] xs:min-w-[3rem] sm:min-w-[3.5rem]"
        title={t.reset}
      >
        {fontSize}%
      </button>
      
      <button
        onClick={increaseFontSize}
        disabled={fontSize >= 150}
        className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-white/20 disabled:opacity-30 transition-colors"
        title={t.increase}
      >
        <FaPlus className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 text-gray-600 dark:text-white/60" />
      </button>
    </div>
  );
}

// Reading Mode Overlay with Focus Effect / Lesemodus-Overlay mit Fokus-Effekt / Overlay Mod Citire cu Efect Focalizare
export function ReadingModeOverlay() {
  const { isReadingMode, toggleReadingMode, fontSize, increaseFontSize, decreaseFontSize } = useReadingMode();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.de;
  
  // State for blog content / Zustand für Blog-Inhalt / Stare pentru conținut blog
  const [blogTitle, setBlogTitle] = React.useState('');
  const [blogContent, setBlogContent] = React.useState('');
  
  // Extract blog content when reading mode is activated
  React.useEffect(() => {
    if (isReadingMode) {
      // Get blog title
      const titleElement = document.querySelector('header h1');
      if (titleElement) {
        setBlogTitle(titleElement.textContent || '');
      }
      
      // Get blog content from the prose container - preserve paragraph structure
      const contentElement = document.querySelector('#blog-content .prose > div');
      if (contentElement) {
        // Extract text from each paragraph element to preserve structure
        const paragraphs: string[] = [];
        const pElements = contentElement.querySelectorAll('p');
        if (pElements.length > 0) {
          pElements.forEach((p) => {
            const text = (p as HTMLElement).textContent?.trim();
            if (text) paragraphs.push(text);
          });
          setBlogContent(paragraphs.join('\n\n'));
        } else {
          // Fallback: use innerHTML and convert <p> tags to double newlines
          const html = (contentElement as HTMLElement).innerHTML;
          const text = html
            .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
          setBlogContent(text);
        }
      }
    }
  }, [isReadingMode]);

  if (!isReadingMode) return null;

  return (
    <>
      {/* Blur overlay with gradient vignette effect / Blur-Overlay mit Vignetten-Effekt / Overlay blur cu efect de vignetă */}
      <div className="fixed inset-0 z-[9980] animate-fadeIn">
        <div className="absolute inset-0 bg-black/80 dark:bg-black/85 backdrop-blur-xl" />
        {/* Vignette/focus effect - darker edges, lighter center */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)'
        }} />
      </div>
      
      {/* Fixed toolbar at top - Light mode: light bg, Dark mode: black bg */}
      <div className="fixed top-0 left-0 right-0 z-[9991] bg-gray-100 dark:bg-black backdrop-blur-sm border-b border-gray-300 dark:border-white/10 py-3 px-4 animate-slideDown shadow-md dark:shadow-none">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <FaBook className="text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{t.readingMode}</span>
          </div>
          
          <div className="flex items-center gap-1 xs:gap-2 sm:gap-4">
            {/* Font size controls */}
            <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-2">
              <FaFont className="text-gray-600 dark:text-gray-300 w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />
              <button
                onClick={decreaseFontSize}
                className="w-[clamp(22px,6vw,32px)] h-[clamp(22px,6vw,32px)] xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white flex items-center justify-center transition-colors"
              >
                <FaMinus className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3" />
              </button>
              <span className="text-[0.65rem] xs:text-xs sm:text-sm font-medium text-gray-800 dark:text-white min-w-[2rem] xs:min-w-[2.5rem] sm:min-w-[3rem] text-center">
                {fontSize}%
              </span>
              <button
                onClick={increaseFontSize}
                className="w-[clamp(22px,6vw,32px)] h-[clamp(22px,6vw,32px)] xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white flex items-center justify-center transition-colors"
              >
                <FaPlus className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3" />
              </button>
            </div>
            
            {/* Exit button - compact rounded, similar to theme toggle size on small screens */}
            <button
              onClick={toggleReadingMode}
              className="flex items-center justify-center w-[clamp(24px,7vw,36px)] h-[clamp(24px,7vw,36px)] xs:w-auto xs:h-auto xs:px-3 xs:py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full xs:rounded-lg transition-colors shadow-md"
            >
              <FaTimes className="w-2.5 h-2.5 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
              <span className="text-sm hidden sm:inline sm:ml-2">{t.exitReadingMode}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Reading content area - displays blog title and content with focus blur effect */}
      <div className="fixed inset-0 z-[9985] overflow-y-auto pt-20 pb-8 px-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-black rounded-2xl shadow-2xl p-8 animate-fadeIn ring-1 ring-gray-200 dark:ring-white/10" style={{
          boxShadow: '0 0 80px 20px rgba(255,255,255,0.15), 0 25px 50px -12px rgba(0,0,0,0.5)'
        }}>
          {/* Blog title */}
          {blogTitle && (
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {blogTitle}
            </h1>
          )}
          
          {/* Blog content with drop cap effect and proper formatting */}
          <div 
            className="prose prose-lg prose-gray dark:prose-invert max-w-none text-gray-800 dark:text-white/90 leading-relaxed reading-mode-content text-justify"
            style={{ fontSize: `${fontSize}%`, lineHeight: '2' }}
          >
            {blogContent && blogContent.length > 0 ? (
              <>
                <span className="reading-drop-cap">{blogContent.charAt(0)}</span>
                {blogContent.slice(1).split(/\n\n+/).map((paragraph, index) => (
                  <p key={index} style={{ marginBottom: '1.5em', textIndent: index > 0 ? '0' : 'inherit' }}>
                    {paragraph.trim()}
                  </p>
                ))}
              </>
            ) : blogContent}
          </div>
        </div>
      </div>
      
      {/* Reading mode styles with zoom effect */}
      <style jsx global>{`
        @keyframes readingModeZoomIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
        
        /* CRITICAL: Prevent background scroll when reading mode is active */
        body.reading-mode {
          overflow: hidden !important;
          position: fixed !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        .reading-mode {
          padding-top: 70px;
        }
        .reading-mode nav {
          display: none !important;
        }
        .reading-mode footer {
          display: none !important;
        }
        
        /* Drop cap for reading mode */
        .reading-drop-cap {
          float: left;
          font-size: 4.5em;
          line-height: 0.85;
          padding-right: 0.1em;
          margin-right: 0.05em;
          margin-top: 0.05em;
          font-weight: 600;
          font-family: 'Cinzel', Georgia, 'Times New Roman', serif;
        }
        
        .reading-mode .blog-content-backdrop {
          position: relative;
          z-index: 9985;
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          max-width: 720px !important;
          margin: 0 auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: readingModeZoomIn 0.4s ease-out forwards;
        }
        .dark .reading-mode .blog-content-backdrop {
          background: #1a1a1a;
        }
        .reading-mode .blog-content-backdrop .prose {
          font-size: calc(var(--reading-font-size, 100%) * 1.15);
          line-height: 1.9;
        }
        .reading-mode .blog-content-backdrop p {
          margin-bottom: 1.5em;
        }
        .reading-mode .reading-controls,
        .reading-mode .emoji-reactions,
        .reading-mode .share-section,
        .reading-mode .related-posts,
        .reading-mode .comments-section,
        .reading-mode .post-actions {
          display: none !important;
        }
      `}</style>
    </>
  );
}
