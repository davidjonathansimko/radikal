// Swipe Gesture Hook / Wischgesten-Hook / Hook Gest Swipe
// Detects horizontal swipe gestures on mobile for navigating between blog posts
// Erkennt horizontale Wischgesten auf Mobilgeräten zum Navigieren zwischen Blog-Posts
// Detectează gesturi de swipe orizontale pe mobil pentru navigare între postări de blog

'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

interface SwipeConfig {
  minSwipeDistance?: number;     // Minimum pixels for a valid swipe / Minimale Pixel für einen gültigen Swipe
  maxSwipeTime?: number;         // Maximum ms for the swipe gesture / Maximale ms für die Wischgeste
  preventScrollThreshold?: number; // Angle threshold to prevent vertical scroll / Winkelschwelle für vertikales Scrollen
}

interface SwipeState {
  direction: 'left' | 'right' | null;
  distance: number;
  isSwiping: boolean;
  progress: number;  // -1 (full left) to 1 (full right) / -1 (ganz links) bis 1 (ganz rechts)
}

interface UseSwipeGestureReturn {
  swipeState: SwipeState;
  containerRef: React.RefObject<HTMLDivElement>;
  resetSwipe: () => void;
}

export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  config: SwipeConfig = {}
): UseSwipeGestureReturn {
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 500,
    preventScrollThreshold = 30,
  } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isTracking = useRef(false);

  const [swipeState, setSwipeState] = useState<SwipeState>({
    direction: null,
    distance: 0,
    isSwiping: false,
    progress: 0,
  });

  const resetSwipe = useCallback(() => {
    setSwipeState({
      direction: null,
      distance: 0,
      isSwiping: false,
      progress: 0,
    });
    isTracking.current = false;
  }, []);

  // Touch start handler
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    isTracking.current = true;
    
    setSwipeState(prev => ({ ...prev, isSwiping: true }));
  }, []);

  // Touch move handler
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isTracking.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    
    // Check if this is a horizontal swipe (not vertical scroll)
    const angle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
    const isHorizontal = angle < preventScrollThreshold || angle > (180 - preventScrollThreshold);
    
    if (!isHorizontal && Math.abs(deltaY) > 10) {
      // This is a vertical scroll, stop tracking
      isTracking.current = false;
      resetSwipe();
      return;
    }

    if (isHorizontal && Math.abs(deltaX) > 10) {
      // Prevent vertical scrolling during horizontal swipe
      e.preventDefault();
    }

    const distance = Math.abs(deltaX);
    const maxDistance = window.innerWidth * 0.4;
    const progress = Math.max(-1, Math.min(1, deltaX / maxDistance));
    
    setSwipeState({
      direction: deltaX > 0 ? 'right' : 'left',
      distance,
      isSwiping: true,
      progress,
    });
  }, [preventScrollThreshold, resetSwipe]);

  // Touch end handler
  const handleTouchEnd = useCallback(() => {
    if (!isTracking.current) return;
    
    const elapsed = Date.now() - touchStartTime.current;
    const { distance, direction } = swipeState;

    if (distance >= minSwipeDistance && elapsed <= maxSwipeTime) {
      // Valid swipe detected / Gültiger Swipe erkannt / Swipe valid detectat
      if (direction === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (direction === 'right' && onSwipeRight) {
        onSwipeRight();
      }
    }

    // Reset with animation delay
    setTimeout(resetSwipe, 200);
  }, [swipeState, minSwipeDistance, maxSwipeTime, onSwipeLeft, onSwipeRight, resetSwipe]);

  // Attach event listeners
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

  return {
    swipeState,
    containerRef,
    resetSwipe,
  };
}

export default useSwipeGesture;
