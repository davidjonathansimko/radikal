// Pull to Refresh Component / Pull-to-Refresh-Komponente / Componentă Pull-to-Refresh
// Enables swipe down gesture to refresh content on mobile devices
// Ermöglicht Wischgeste nach unten zum Aktualisieren auf mobilen Geräten
// Activează gestul de tragere în jos pentru reîmprospătare pe dispozitive mobile
// Mobile pull-to-refresh functionality

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  pullThreshold?: number; // How far to pull before triggering refresh (px)
  maxPull?: number; // Maximum pull distance (px)
  disabled?: boolean;
}

export default function PullToRefresh({
  onRefresh,
  children,
  pullThreshold = 80,
  maxPull = 120,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if we're at the top of the page
  const isAtTop = useCallback(() => {
    return window.scrollY <= 0;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || !isAtTop()) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [disabled, isRefreshing, isAtTop]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing || !isAtTop()) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      // Apply resistance - the more you pull, the harder it gets
      const resistance = 0.4;
      const newDistance = Math.min(diff * resistance, maxPull);
      setPullDistance(newDistance);
      
      // Prevent default scrolling when pulling
      if (diff > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, isRefreshing, isAtTop, maxPull]);

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= pullThreshold && !isRefreshing) {
      // Trigger refresh
      setIsRefreshing(true);
      setPullDistance(pullThreshold); // Keep at threshold during refresh
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Animate back to 0
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, pullThreshold, isRefreshing, onRefresh]);

  // Add touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calculate progress (0-1)
  const progress = Math.min(pullDistance / pullThreshold, 1);

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Pull indicator - beautiful animated indicator / Schöner animierter Indikator / Indicator animat frumos */}
      <div 
        className="fixed left-0 right-0 flex justify-center items-center pointer-events-none z-50 transition-all duration-300"
        style={{ 
          top: `${Math.max(pullDistance - 60, -60)}px`,
          opacity: progress,
          transform: `scale(${0.5 + progress * 0.5})`
        }}
      >
        <div className={`
          w-12 h-12 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-xl shadow-xl
          flex items-center justify-center border border-black/10 dark:border-white/20
          transition-all duration-300
        `}>
          {isRefreshing ? (
            // Animated refresh spinner with three dots / Animierter Aktualisierungs-Spinner mit drei Punkten
            <div className="flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-pull-refresh-dot" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-pull-refresh-dot" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-pull-refresh-dot" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            // Animated water drop icon that morphs based on progress / Animiertes Wassertropfen-Symbol
            <svg 
              className="w-6 h-6 text-black dark:text-white transition-all duration-300"
              style={{ 
                transform: `rotate(${progress >= 1 ? 180 : 0}deg) scale(${0.7 + progress * 0.3})`,
              }}
              viewBox="0 0 24 24" 
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Circular progress ring / Kreisförmiger Fortschrittsring / Inel de progres circular */}
              <circle
                cx="12" cy="12" r="9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity={0.15}
              />
              <circle
                cx="12" cy="12" r="9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${progress * 56.5} 56.5`}
                className="transition-all duration-200"
                style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
              />
              {/* Arrow / Pfeil / Săgeată */}
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5} 
                stroke="currentColor"
                d="M12 7v6m0 0l-2.5-2.5M12 13l2.5-2.5"
                opacity={progress >= 1 ? 1 : 0.6 + progress * 0.4}
              />
            </svg>
          )}
        </div>
      </div>

      {/* Content with pull transform */}
      <div 
        className="transition-transform duration-300 ease-out"
        style={{ 
          transform: isPulling || isRefreshing ? `translateY(${pullDistance}px)` : 'translateY(0)'
        }}
      >
        {children}
      </div>
    </div>
  );
}
