// Advanced Caching Strategy / Erweiterte Caching-Strategie / Strategie Avansată de Caching
// Multi-layer caching system with memory, localStorage, and request deduplication
// Mehrschichtiges Caching-System mit Memory, localStorage und Anfragendeduplizierung
// Sistem de cache multi-strat cu memorie, localStorage și deduplicare cereri

// Cache configuration
interface CacheConfig {
  maxAge: number; // in milliseconds
  maxSize: number; // max items in memory cache
  staleWhileRevalidate?: number; // SWR window in milliseconds
  persist?: boolean; // whether to persist to localStorage
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  staleAt?: number;
}

// Default configurations for different cache types
export const CACHE_PRESETS: Record<string, CacheConfig> = {
  // Short-lived data (1 minute)
  short: {
    maxAge: 60 * 1000,
    maxSize: 100,
    staleWhileRevalidate: 30 * 1000,
    persist: false,
  },
  // Medium-lived data (5 minutes)
  medium: {
    maxAge: 5 * 60 * 1000,
    maxSize: 200,
    staleWhileRevalidate: 2 * 60 * 1000,
    persist: true,
  },
  // Long-lived data (1 hour)
  long: {
    maxAge: 60 * 60 * 1000,
    maxSize: 500,
    staleWhileRevalidate: 10 * 60 * 1000,
    persist: true,
  },
  // Blog posts (30 minutes with 10 min SWR)
  blogPosts: {
    maxAge: 30 * 60 * 1000,
    maxSize: 100,
    staleWhileRevalidate: 10 * 60 * 1000,
    persist: true,
  },
  // User session data (5 minutes)
  session: {
    maxAge: 5 * 60 * 1000,
    maxSize: 50,
    staleWhileRevalidate: 60 * 1000,
    persist: false,
  },
  // Static content (24 hours)
  static: {
    maxAge: 24 * 60 * 60 * 1000,
    maxSize: 1000,
    staleWhileRevalidate: 60 * 60 * 1000,
    persist: true,
  },
};

/**
 * Memory Cache with LRU eviction
 */
class MemoryCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = [];
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  get(key: string): { data: T; isStale: boolean } | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;

    const now = Date.now();

    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
      return null;
    }

    // Update access order (LRU)
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.push(key);

    // Check if stale
    const isStale = entry.staleAt ? now > entry.staleAt : false;

    return { data: entry.data, isStale };
  }

  set(key: string, data: T): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + this.config.maxAge,
      staleAt: this.config.staleWhileRevalidate
        ? now + (this.config.maxAge - this.config.staleWhileRevalidate)
        : undefined,
    };

    // Evict if at capacity
    while (this.cache.size >= this.config.maxSize && this.accessOrder.length > 0) {
      const oldest = this.accessOrder.shift();
      if (oldest) {
        this.cache.delete(oldest);
      }
    }

    this.cache.set(key, entry);
    this.accessOrder.push(key);
  }

  delete(key: string): boolean {
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  has(key: string): boolean {
    const result = this.get(key);
    return result !== null;
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.accessOrder = this.accessOrder.filter((k) => k !== key);
      }
    });
  }
}

/**
 * Storage Cache (localStorage/sessionStorage)
 */
class StorageCache<T> {
  private prefix: string;
  private storage: Storage | null;
  private config: CacheConfig;

  constructor(prefix: string, config: CacheConfig, useSession = false) {
    this.prefix = `cache_${prefix}_`;
    this.config = config;
    this.storage =
      typeof window !== 'undefined'
        ? useSession
          ? sessionStorage
          : localStorage
        : null;
  }

  private getKey(key: string): string {
    return this.prefix + key;
  }

  get(key: string): { data: T; isStale: boolean } | null {
    if (!this.storage) return null;

    try {
      const stored = this.storage.getItem(this.getKey(key));
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);
      const now = Date.now();

      if (now > entry.expiresAt) {
        this.storage.removeItem(this.getKey(key));
        return null;
      }

      const isStale = entry.staleAt ? now > entry.staleAt : false;
      return { data: entry.data, isStale };
    } catch {
      return null;
    }
  }

  set(key: string, data: T): void {
    if (!this.storage) return;

    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + this.config.maxAge,
      staleAt: this.config.staleWhileRevalidate
        ? now + (this.config.maxAge - this.config.staleWhileRevalidate)
        : undefined,
    };

    try {
      this.storage.setItem(this.getKey(key), JSON.stringify(entry));
    } catch (e) {
      // Storage might be full, try to clean up
      this.cleanup();
      try {
        this.storage.setItem(this.getKey(key), JSON.stringify(entry));
      } catch {
        console.warn('Cache storage failed:', e);
      }
    }
  }

  delete(key: string): void {
    if (!this.storage) return;
    this.storage.removeItem(this.getKey(key));
  }

  clear(): void {
    if (!this.storage) return;
    const keys = Object.keys(this.storage).filter((k) =>
      k.startsWith(this.prefix)
    );
    keys.forEach((k) => this.storage?.removeItem(k));
  }

  cleanup(): void {
    if (!this.storage) return;
    const now = Date.now();
    const keys = Object.keys(this.storage).filter((k) =>
      k.startsWith(this.prefix)
    );

    keys.forEach((key) => {
      try {
        const stored = this.storage?.getItem(key);
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored);
          if (now > entry.expiresAt) {
            this.storage?.removeItem(key);
          }
        }
      } catch {
        this.storage?.removeItem(key);
      }
    });
  }
}

/**
 * Request Deduplication - prevents duplicate concurrent requests
 */
class RequestDeduplicator {
  private pending: Map<string, Promise<any>> = new Map();

  async dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // If there's already a pending request for this key, return it
    const existingRequest = this.pending.get(key);
    if (existingRequest) {
      return existingRequest as Promise<T>;
    }

    // Create new request and store it
    const request = fetcher().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, request);
    return request;
  }

  isPending(key: string): boolean {
    return this.pending.has(key);
  }
}

/**
 * Unified Cache Manager
 */
export class CacheManager<T = any> {
  private memoryCache: MemoryCache<T>;
  private storageCache: StorageCache<T> | null;
  private deduplicator: RequestDeduplicator;
  private name: string;

  constructor(name: string, config: CacheConfig = CACHE_PRESETS.medium) {
    this.name = name;
    this.memoryCache = new MemoryCache<T>(config);
    this.storageCache = config.persist
      ? new StorageCache<T>(name, config)
      : null;
    this.deduplicator = new RequestDeduplicator();

    // Periodic cleanup
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.memoryCache.cleanup();
        this.storageCache?.cleanup();
      }, 60 * 1000); // Every minute
    }
  }

  /**
   * Get data from cache, with stale-while-revalidate support
   */
  async get(
    key: string,
    fetcher: () => Promise<T>,
    options?: { forceRefresh?: boolean }
  ): Promise<T> {
    // Force refresh - skip cache
    if (options?.forceRefresh) {
      const data = await this.deduplicator.dedupe(`${this.name}:${key}`, fetcher);
      this.set(key, data);
      return data;
    }

    // Try memory cache first
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult) {
      // If data is stale, trigger background revalidation
      if (memoryResult.isStale) {
        this.revalidateInBackground(key, fetcher);
      }
      return memoryResult.data;
    }

    // Try storage cache
    const storageResult = this.storageCache?.get(key);
    if (storageResult) {
      // Update memory cache
      this.memoryCache.set(key, storageResult.data);
      
      // If data is stale, trigger background revalidation
      if (storageResult.isStale) {
        this.revalidateInBackground(key, fetcher);
      }
      return storageResult.data;
    }

    // Cache miss - fetch fresh data
    const data = await this.deduplicator.dedupe(`${this.name}:${key}`, fetcher);
    this.set(key, data);
    return data;
  }

  /**
   * Set data in cache
   */
  set(key: string, data: T): void {
    this.memoryCache.set(key, data);
    this.storageCache?.set(key, data);
  }

  /**
   * Invalidate specific key
   */
  invalidate(key: string): void {
    this.memoryCache.delete(key);
    this.storageCache?.delete(key);
  }

  /**
   * Invalidate keys matching pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    // For now, clear all (could be optimized with key tracking)
    this.clear();
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    this.storageCache?.clear();
  }

  /**
   * Background revalidation
   */
  private revalidateInBackground(key: string, fetcher: () => Promise<T>): void {
    // Don't wait for this
    this.deduplicator
      .dedupe(`${this.name}:${key}:revalidate`, async () => {
        try {
          const data = await fetcher();
          this.set(key, data);
        } catch (error) {
          console.error(`Background revalidation failed for ${key}:`, error);
        }
      })
      .catch(() => {});
  }
}

/**
 * Pre-configured cache instances
 */
export const blogCache = new CacheManager<any>('blog', CACHE_PRESETS.blogPosts);
export const apiCache = new CacheManager<any>('api', CACHE_PRESETS.medium);
export const staticCache = new CacheManager<any>('static', CACHE_PRESETS.static);
export const sessionCache = new CacheManager<any>('session', CACHE_PRESETS.session);

/**
 * React Hook for cached data
 */
import { useState, useEffect, useCallback } from 'react';

interface UseCacheOptions {
  refreshInterval?: number;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
}

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  cache: CacheManager<T> = apiCache as CacheManager<T>,
  options: UseCacheOptions = {}
): {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isValidating: boolean;
  mutate: (data?: T) => Promise<void>;
} {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh) {
        setIsValidating(true);
      } else {
        setIsLoading(true);
      }
      setError(undefined);

      try {
        const result = await cache.get(key, fetcher, { forceRefresh });
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsLoading(false);
        setIsValidating(false);
      }
    },
    [key, fetcher, cache]
  );

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh interval
  useEffect(() => {
    if (!options.refreshInterval) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, options.refreshInterval);

    return () => clearInterval(interval);
  }, [options.refreshInterval, fetchData]);

  // Revalidate on focus
  useEffect(() => {
    if (!options.revalidateOnFocus) return;

    const handleFocus = () => fetchData(true);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [options.revalidateOnFocus, fetchData]);

  // Revalidate on reconnect
  useEffect(() => {
    if (!options.revalidateOnReconnect) return;

    const handleOnline = () => fetchData(true);
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [options.revalidateOnReconnect, fetchData]);

  const mutate = useCallback(
    async (newData?: T) => {
      if (newData !== undefined) {
        setData(newData);
        cache.set(key, newData);
      } else {
        await fetchData(true);
      }
    },
    [cache, key, fetchData]
  );

  return { data, error, isLoading, isValidating, mutate };
}

/**
 * Prefetch helper
 */
export function prefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  cache: CacheManager<T> = apiCache as CacheManager<T>
): void {
  cache.get(key, fetcher).catch(() => {});
}

export default CacheManager;
