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
      {/* Pull indicator - shown when pulling */}
      <div 
        className="fixed left-0 right-0 flex justify-center items-center pointer-events-none z-50 transition-all duration-300"
        style={{ 
          top: `${Math.max(pullDistance - 60, -60)}px`,
          opacity: progress,
          transform: `scale(${0.5 + progress * 0.5})`
        }}
      >
        <div className={`
          w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-sm
          flex items-center justify-center border border-black/20 dark:border-white/20
          ${isRefreshing ? 'animate-spin' : ''}
        `}>
          {isRefreshing ? (
            // Loading spinner
            <svg className="w-5 h-5 text-black dark:text-white" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" cy="12" r="10" 
                stroke="currentColor" 
                strokeWidth="3" 
                fill="none"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            // Arrow icon that rotates based on progress
            <svg 
              className="w-5 h-5 text-black dark:text-white transition-transform duration-200"
              style={{ transform: `rotate(${progress >= 1 ? 180 : 0}deg)` }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 14l-7 7m0 0l-7-7m7 7V3" 
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
