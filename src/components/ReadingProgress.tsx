// Reading Progress Bar Component / Lesefortschrittsbalken-Komponente / Componenta Bară Progres Citire
// Shows reading progress while scrolling through blog posts
// Zeigt den Lesefortschritt beim Scrollen durch Blog-Posts an
// Arată progresul citirii la derularea prin postările de blog

'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface ReadingProgressProps {
  // Target element ID to track scroll progress / Ziel-Element-ID zur Verfolgung des Scroll-Fortschritts
  targetId?: string;
  // Custom color for the progress bar / Benutzerdefinierte Farbe für den Fortschrittsbalken
  color?: string;
  // Height of the progress bar in pixels / Höhe des Fortschrittsbalkens in Pixeln
  height?: number;
  // Position of the bar / Position des Balkens
  position?: 'top' | 'bottom';
  // Show percentage text / Prozenttext anzeigen
  showPercentage?: boolean;
  // Z-index for the bar / Z-Index für den Balken
  zIndex?: number;
}

const ReadingProgress: React.FC<ReadingProgressProps> = ({
  targetId,
  color = 'white', // White in dark mode, black handled via CSS
  height = 3,
  position = 'top',
  showPercentage = false,
  zIndex = 9999
}) => {
  // State for progress percentage / Status für Fortschrittsprozent
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Calculate scroll progress / Scroll-Fortschritt berechnen
  const calculateProgress = useCallback(() => {
    let element: HTMLElement | null = null;
    let scrolled = 0;
    let total = 0;

    if (targetId) {
      // Calculate progress for specific element / Fortschritt für spezifisches Element berechnen
      element = document.getElementById(targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + window.scrollY;
        const elementHeight = element.offsetHeight;
        const windowHeight = window.innerHeight;
        
        // Calculate how much of the element has been scrolled past
        scrolled = Math.max(0, window.scrollY - elementTop + windowHeight * 0.2);
        total = elementHeight;
      }
    } else {
      // Calculate progress for entire page / Fortschritt für gesamte Seite berechnen
      scrolled = window.scrollY;
      total = document.documentElement.scrollHeight - window.innerHeight;
    }

    // Calculate percentage / Prozentsatz berechnen
    const percentage = total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0;
    setProgress(percentage);
    
    // Show bar only when scrolled past certain point / Balken nur anzeigen wenn über bestimmten Punkt gescrollt
    setIsVisible(window.scrollY > 100);
  }, [targetId]);

  // Add scroll listener / Scroll-Listener hinzufügen
  useEffect(() => {
    // Initial calculation / Anfangsberechnung
    calculateProgress();
    
    // Throttle scroll events for performance / Scroll-Events für Performance drosseln
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          calculateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [calculateProgress]);

  // Position styles / Positionsstile
  const positionStyles: React.CSSProperties = position === 'top' 
    ? { top: 0 }
    : { bottom: 0 };

  return (
    <>
      {/* Progress bar container / Fortschrittsbalken-Container */}
      <div 
        className={`fixed left-0 right-0 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          ...positionStyles, 
          zIndex,
          height: `${height}px`,
          backgroundColor: 'rgba(128, 128, 128, 0.2)'
        }}
      >
        {/* Progress fill - white in dark mode, black in light mode / Fortschrittsfüllung */}
        <div 
          className="h-full transition-all duration-150 ease-out bg-black dark:bg-white"
          style={{ 
            width: `${progress}%`,
          }}
        />
      </div>

      {/* Optional percentage indicator / Optionaler Prozentindikator */}
      {showPercentage && isVisible && (
        <div 
          className={`fixed right-4 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
          style={{ 
            [position]: `${height + 8}px`,
            zIndex: zIndex - 1 
          }}
        >
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 backdrop-blur-sm">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </>
  );
};

// Simple circular progress indicator / Einfacher kreisförmiger Fortschrittsindikator
interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  showInCorner?: boolean;
}

export const CircularReadingProgress: React.FC<CircularProgressProps> = ({
  size = 48,
  strokeWidth = 3,
  showInCorner = true
}) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true); // Always visible from start
  const [isMobile, setIsMobile] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(110); // Pasul 2202000: Higher default for PWA bottom bar + safe-area

  // Detect mobile and calculate scroll progress
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Adjust size for mobile
  const actualSize = isMobile ? 40 : size;

  // Keep circular progress above footer — never descend below it
  useEffect(() => {
    // Pasul 2202000: Default bottom accounts for mobile bottom bar (~80px) + safe-area (~34px) or desktop (24px)
    const defaultBottom = isMobile ? 110 : 24;
    const margin = 16; // space between button and footer top
    const btnH = isMobile ? 40 : size;

    const adjustPosition = () => {
      // Find the main site footer (the one in layout)
      const footer = document.querySelector('footer.relative');
      if (!footer) { setBottomOffset(defaultBottom); return; }

      const footerRect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // How much footer overlaps with viewport from below
      const footerVisibleHeight = windowHeight - footerRect.top;

      if (footerVisibleHeight > 0) {
        // Footer is partially/fully visible — keep button above it
        setBottomOffset(footerVisibleHeight + margin);
      } else {
        // Footer not visible yet — stay at default
        setBottomOffset(defaultBottom);
      }
    };

    // Use a single combined scroll handler for both progress and position
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          adjustPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    adjustPosition();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', adjustPosition);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', adjustPosition);
    };
  }, [isMobile, size]);

  // Calculate scroll progress / Scroll-Fortschritt berechnen / Always visible
  useEffect(() => {
    const calculateProgress = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0;
      setProgress(percentage);
      // Always visible, no need to hide based on scroll position
      setIsVisible(true);
    };

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          calculateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    calculateProgress();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // SVG circle calculations / SVG-Kreis-Berechnungen
  const radius = (actualSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  // Scroll to top handler / Scroll nach oben Handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!showInCorner) {
    return (
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle / Hintergrundkreis */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle / Fortschrittskreis */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-150 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#6b7280" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed right-4 sm:right-6 z-[250] transition-all duration-150 cursor-pointer group shadow-lg hover:shadow-xl"
      style={{ opacity: 1, transform: 'scale(1)', bottom: `${bottomOffset}px` }}
      aria-label="Scroll to top"
    >
      <div className="relative">
        {/* SVG Progress Ring with theme support */}
        <svg width={actualSize} height={actualSize} className="transform -rotate-90 drop-shadow-md">
          {/* Background circle - transparent fill with gray stroke for both modes / Hintergrundkreis */}
          <circle
            cx={actualSize / 2}
            cy={actualSize / 2}
            r={radius}
            className="fill-white dark:fill-gray-950"
            strokeWidth={strokeWidth}
            style={{ stroke: 'rgba(128,128,128,0.3)' }}
          />
          {/* Progress circle - black in light mode, white in dark mode / Fortschrittskreis */}
          <circle
            cx={actualSize / 2}
            cy={actualSize / 2}
            r={radius}
            fill="none"
            className="stroke-black dark:stroke-white"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.15s ease-out' }}
          />
        </svg>
        
        {/* Arrow up icon - black in light mode, white in dark mode / Pfeil nach oben Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            className="w-4 h-4 md:w-5 md:h-5 text-black dark:text-white group-hover:scale-110 transition-transform"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </div>
      </div>
    </button>
  );
};

export default ReadingProgress;
