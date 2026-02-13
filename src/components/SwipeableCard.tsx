// Swipeable Blog Card Wrapper / Wischbarer Blog-Karten-Wrapper / Wrapper Card Blog Swipabilă
// Adds swipe left/right gestures to blog cards for navigation
// Fügt Wischgesten nach links/rechts zu Blog-Karten für Navigation hinzu
// Adaugă gesturi de swipe stânga/dreapta la cardurile de blog pentru navigare

'use client';

import React, { useState, useCallback } from 'react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useHaptic } from '@/hooks/useHaptic';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;   // Next post / Nächster Beitrag / Postarea următoare
  onSwipeRight?: () => void;  // Previous post / Vorheriger Beitrag / Postarea anterioară
  showIndicators?: boolean;   // Show swipe direction indicators / Richtungsanzeiger anzeigen
  className?: string;
}

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  showIndicators = true,
  className = '',
}: SwipeableCardProps) {
  const { tapLight } = useHaptic();
  const [showLeftHint, setShowLeftHint] = useState(false);
  const [showRightHint, setShowRightHint] = useState(false);

  const handleSwipeLeft = useCallback(() => {
    tapLight();
    setShowLeftHint(true);
    setTimeout(() => setShowLeftHint(false), 500);
    onSwipeLeft?.();
  }, [onSwipeLeft, tapLight]);

  const handleSwipeRight = useCallback(() => {
    tapLight();
    setShowRightHint(true);
    setTimeout(() => setShowRightHint(false), 500);
    onSwipeRight?.();
  }, [onSwipeRight, tapLight]);

  const { swipeState, containerRef } = useSwipeGesture(
    handleSwipeLeft,
    handleSwipeRight,
    { minSwipeDistance: 60, maxSwipeTime: 600 }
  );

  // Calculate visual offset during swipe / Visuellen Offset während des Swipe berechnen
  const translateX = swipeState.isSwiping ? swipeState.progress * -30 : 0;
  const rotate = swipeState.isSwiping ? swipeState.progress * -2 : 0;
  const opacity = swipeState.isSwiping ? 1 - Math.abs(swipeState.progress) * 0.15 : 1;

  return (
    <div ref={containerRef} className={`relative touch-pan-y ${className}`}>
      {/* Swipe direction indicators / Wischrichtungsanzeiger / Indicatoare direcție swipe */}
      {showIndicators && (
        <>
          {/* Left indicator (next) / Links-Anzeiger (nächster) / Indicator stânga (următorul) */}
          <div 
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 transition-all duration-300 pointer-events-none ${
              (swipeState.direction === 'left' && swipeState.isSwiping) || showLeftHint
                ? 'opacity-80 translate-x-0' 
                : 'opacity-0 translate-x-4'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-black/30 dark:bg-white/30 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          {/* Right indicator (previous) / Rechts-Anzeiger (vorheriger) / Indicator dreapta (anteriorul) */}
          <div 
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 transition-all duration-300 pointer-events-none ${
              (swipeState.direction === 'right' && swipeState.isSwiping) || showRightHint
                ? 'opacity-80 translate-x-0' 
                : 'opacity-0 -translate-x-4'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-black/30 dark:bg-white/30 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </div>
        </>
      )}

      {/* Card content with swipe transform / Karteninhalt mit Swipe-Transform / Conținut card cu transformare swipe */}
      <div 
        className={`transition-transform ${swipeState.isSwiping ? 'duration-0' : 'duration-300'} ease-out`}
        style={{
          transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
          opacity,
        }}
      >
        {children}
      </div>
    </div>
  );
}
