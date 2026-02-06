// Page Transition Component / Seitenübergangs-Komponente / Componentă Tranziție Pagină
// Smooth CSS-powered transitions between pages (lightweight alternative)
// Fließende CSS-gesteuerte Übergänge zwischen Seiten (leichtgewichtige Alternative)
// Tranziții fluide între pagini folosind CSS (alternativă ușoară)
// Page transitions for better UX

'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [previousPath, setPreviousPath] = useState(pathname);

  useEffect(() => {
    // Skip animation on first render or same path
    if (previousPath === pathname) {
      setDisplayChildren(children);
      return;
    }

    // Start exit animation
    setIsVisible(false);

    // Wait for exit animation, then update content and enter
    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      setPreviousPath(pathname);
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Small delay before entering
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, 200);

    return () => clearTimeout(timeout);
  }, [pathname, children, previousPath]);

  return (
    <div 
      className={`page-transition ${isVisible ? 'page-enter' : 'page-exit'}`}
      style={{ 
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
        minHeight: '100vh'
      }}
    >
      {displayChildren}
    </div>
  );
}

// Lightweight page transition using CSS only (alternative)
// Leichtgewichtiger Seitenübergang nur mit CSS (Alternative)
// Tranziție ușoară doar cu CSS (alternativă)
export function CSSPageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Fade out
    setIsVisible(false);
    
    const timeout = setTimeout(() => {
      // Update content
      setDisplayChildren(children);
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Fade in
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, 200);

    return () => clearTimeout(timeout);
  }, [pathname, children]);

  return (
    <div 
      className={`transition-all duration-300 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4'
      }`}
      style={{ minHeight: '100vh' }}
    >
      {displayChildren}
    </div>
  );
}
