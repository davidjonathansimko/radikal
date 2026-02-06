// Scroll to Top Button Component for Mobile
// Scroll-nach-oben-Button-Komponente für Mobil
// Componentă Buton Scroll Sus pentru Mobil

'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

const translations = {
  de: { scrollToTop: 'Nach oben scrollen' },
  en: { scrollToTop: 'Scroll to top' },
  ro: { scrollToTop: 'Derulează sus' },
  ru: { scrollToTop: 'Наверх' },
};

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(96); // 24 * 4 = 96px (bottom-24)
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.de;

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled more than 500px
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      
      // Check if footer is in viewport and adjust position
      const footer = document.querySelector('footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // If footer is visible, move button above it
        if (footerRect.top < windowHeight) {
          const footerVisibleHeight = windowHeight - footerRect.top;
          setBottomOffset(Math.max(96, footerVisibleHeight + 24)); // 24px padding above footer
        } else {
          setBottomOffset(96);
        }
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility(); // Initial check

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="
        fixed right-4 z-50
        w-12 h-12 md:w-14 md:h-14
        bg-red-600 hover:bg-red-700 
        text-white text-xl
        rounded-full shadow-lg
        flex items-center justify-center
        transition-all duration-300
        hover:scale-110 active:scale-95
        touch-manipulation
        pb-safe
      "
      style={{ 
        bottom: `${bottomOffset}px`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        transition: 'bottom 0.3s ease-out'
      }}
      title={t.scrollToTop}
      aria-label={t.scrollToTop}
    >
      ⬆️
    </button>
  );
}
