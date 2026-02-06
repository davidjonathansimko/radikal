// useDebounce Hook / useDebounce-Hook / Hook useDebounce
// Debounce values for search and other inputs
// Werte für Suche und andere Eingaben verzögern
// Întârzie valorile pentru căutare și alte intrări

import { useState, useEffect } from 'react';

/**
 * Debounce a value by specified delay
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
}

/**
 * Throttle a callback function
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [lastRan, setLastRan] = useState<number>(Date.now());
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRan >= delay) {
      callback(...args);
      setLastRan(now);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(() => {
        callback(...args);
        setLastRan(Date.now());
      }, delay - (now - lastRan));

      setTimeoutId(newTimeoutId);
    }
  };
}

export default useDebounce;
