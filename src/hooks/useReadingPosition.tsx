// Reading Position Hook - Save and restore scroll position / Lesepositions-Hook - Speichern und Wiederherstellen der Scrollposition / Hook Poziție Citire - Salvează și restaurează poziția scroll
// Allows users to continue reading where they left off
// Ermöglicht Benutzern, dort weiterzulesen, wo sie aufgehört haben
// Permite utilizatorilor să continue citirea de unde au rămas

'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface ReadingPositionOptions {
  postId: string;
  debounceMs?: number;
  minScrollPercent?: number; // Minimum scroll % before saving
  autoRestore?: boolean;
  storageKey?: string;
}

interface SavedPosition {
  percent: number;
  timestamp: number;
  scrollY: number;
  documentHeight: number;
}

export function useReadingPosition({
  postId,
  debounceMs = 500,
  minScrollPercent = 5,
  autoRestore = true,
  storageKey = 'reading-position',
}: ReadingPositionOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<number>(0);

  // Generate storage key for this specific post
  const getStorageKey = useCallback(() => {
    return `${storageKey}-${postId}`;
  }, [storageKey, postId]);

  // Calculate current scroll percentage
  const getScrollPercent = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (docHeight <= 0) return 0;
    
    return Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
  }, []);

  // Save current position to localStorage
  const savePosition = useCallback(() => {
    const percent = getScrollPercent();
    
    // Don't save if scroll is too small
    if (percent < minScrollPercent) return;
    
    // Don't save too frequently
    const now = Date.now();
    if (now - lastSavedRef.current < debounceMs) return;
    
    lastSavedRef.current = now;

    const position: SavedPosition = {
      percent,
      timestamp: now,
      scrollY: window.scrollY,
      documentHeight: document.documentElement.scrollHeight,
    };

    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(position));
    } catch (error) {
      console.warn('[ReadingPosition] Failed to save position:', error);
    }
  }, [getScrollPercent, minScrollPercent, debounceMs, getStorageKey]);

  // Restore saved position
  const restorePosition = useCallback(() => {
    try {
      const saved = localStorage.getItem(getStorageKey());
      if (!saved) return null;

      const position: SavedPosition = JSON.parse(saved);
      
      // Check if saved position is not too old (7 days)
      const maxAge = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - position.timestamp > maxAge) {
        localStorage.removeItem(getStorageKey());
        return null;
      }

      // Calculate target scroll position based on saved percentage
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const targetY = (position.percent / 100) * docHeight;

      // Small delay to ensure content is loaded
      setTimeout(() => {
        window.scrollTo({
          top: targetY,
          behavior: 'smooth',
        });
      }, 100);

      return position;
    } catch (error) {
      console.warn('[ReadingPosition] Failed to restore position:', error);
      return null;
    }
  }, [getStorageKey]);

  // Clear saved position (when user finishes reading)
  const clearPosition = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey());
    } catch (error) {
      console.warn('[ReadingPosition] Failed to clear position:', error);
    }
  }, [getStorageKey]);

  // Get saved position without restoring
  const getSavedPosition = useCallback((): SavedPosition | null => {
    try {
      const saved = localStorage.getItem(getStorageKey());
      if (!saved) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }, [getStorageKey]);

  // Set up scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(savePosition, debounceMs);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [savePosition, debounceMs]);

  // Auto-restore position on mount
  useEffect(() => {
    if (autoRestore) {
      restorePosition();
    }
  }, [autoRestore, restorePosition]);

  // Clear position when user reaches the end
  useEffect(() => {
    const handleScrollEnd = () => {
      const percent = getScrollPercent();
      if (percent >= 95) {
        clearPosition();
      }
    };

    window.addEventListener('scroll', handleScrollEnd, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScrollEnd);
    };
  }, [getScrollPercent, clearPosition]);

  return {
    savePosition,
    restorePosition,
    clearPosition,
    getSavedPosition,
    getScrollPercent,
  };
}

// Component to show "Continue Reading" prompt
interface ContinueReadingPromptProps {
  postId: string;
  onContinue?: () => void;
  onStartOver?: () => void;
}

export function ContinueReadingPrompt({
  postId,
  onContinue,
  onStartOver,
}: ContinueReadingPromptProps) {
  const { getSavedPosition, restorePosition, clearPosition } = useReadingPosition({
    postId,
    autoRestore: false,
  });

  const savedPosition = getSavedPosition();

  if (!savedPosition || savedPosition.percent < 10) {
    return null;
  }

  const handleContinue = () => {
    restorePosition();
    onContinue?.();
  };

  const handleStartOver = () => {
    clearPosition();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onStartOver?.();
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 z-40 animate-slide-up">
      <div className="flex items-start gap-3">
        <span className="text-2xl">📖</span>
        <div className="flex-1">
          <h4 className="font-medium text-white">Weiterlesen?</h4>
          <p className="text-sm text-gray-400 mt-1">
            Sie waren bei {Math.round(savedPosition.percent)}% dieses Artikels.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleContinue}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Weiterlesen
            </button>
            <button
              onClick={handleStartOver}
              className="px-3 py-1.5 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600"
            >
              Von vorn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
