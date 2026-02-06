// Enhanced Search System / Erweitertes Suchsystem / Sistem Căutare Îmbunătățit
// Full-text search with filters, suggestions, and recent searches
// Volltextsuche mit Filtern, Vorschlägen und letzten Suchen
// Căutare full-text cu filtre, sugestii și căutări recente

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { getSupabaseClient } from '@/lib/supabase';

const supabase = getSupabaseClient();

// Types
export interface SearchResult {
  id: string;
  type: 'post' | 'page' | 'modal' | 'category';
  title: string;
  slug: string;
  excerpt?: string;
  image_url?: string;
  category?: string;
  created_at?: string;
  score?: number;
  highlights?: {
    title?: string;
    content?: string;
  };
}

export interface SearchFilters {
  type?: string[];
  category?: string[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'relevance' | 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
}

interface EnhancedSearchProps {
  placeholder?: string;
  showFilters?: boolean;
  showSuggestions?: boolean;
  showRecent?: boolean;
  onResultClick?: (result: SearchResult) => void;
  maxResults?: number;
  className?: string;
}

// Recent searches storage key
const RECENT_SEARCHES_KEY = 'radikal_recent_searches';
const MAX_RECENT_SEARCHES = 10;

/**
 * Enhanced Search Component
 */
export default function EnhancedSearch({
  placeholder = 'Suche...',
  showFilters = true,
  showSuggestions = true,
  showRecent = true,
  onResultClick,
  maxResults = 10,
  className = '',
}: EnhancedSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'relevance',
    sortOrder: 'desc',
  });
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches
  useEffect(() => {
    if (typeof window !== 'undefined' && showRecent) {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    }
  }, [showRecent]);

  // Search when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
      setSuggestions([]);
    }
  }, [debouncedQuery, filters]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform search
  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setSelectedIndex(-1);

    try {
      // Build query
      let query = supabase
        .from('posts')
        .select('id, title, slug, excerpt, image_url, category, created_at')
        .eq('published', true)
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);

      // Apply filters
      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Apply sorting
      if (filters.sortBy === 'date') {
        query = query.order('created_at', { ascending: filters.sortOrder === 'asc' });
      } else if (filters.sortBy === 'title') {
        query = query.order('title', { ascending: filters.sortOrder === 'asc' });
      }

      query = query.limit(maxResults);

      const { data, error } = await query;

      if (!error && data) {
        const searchResults: SearchResult[] = data.map((item: any) => ({
          id: item.id,
          type: 'post' as const,
          title: item.title,
          slug: item.slug,
          excerpt: item.excerpt,
          image_url: item.image_url,
          category: item.category,
          created_at: item.created_at,
          highlights: highlightMatches(item.title, item.excerpt, searchQuery),
        }));

        setResults(searchResults);

        // Generate suggestions from results
        if (showSuggestions) {
          const titleSet = new Set(data.map((r: any) => r.title));
          const uniqueTitles = Array.from(titleSet).slice(0, 5);
          setSuggestions(uniqueTitles as string[]);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Highlight matching text
  const highlightMatches = (
    title: string,
    content: string | null,
    searchQuery: string
  ): { title?: string; content?: string } => {
    const regex = new RegExp(`(${escapeRegex(searchQuery)})`, 'gi');

    return {
      title: title.replace(regex, '<mark>$1</mark>'),
      content: content?.replace(regex, '<mark>$1</mark>'),
    };
  };

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Save to recent searches
  const saveRecentSearch = (searchQuery: string) => {
    if (!showRecent || !searchQuery.trim()) return;

    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // Handle result selection
  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query);
    setIsOpen(false);
    onResultClick?.(result);
    window.location.href = `/blog/${result.slug}`;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length + (showRecent && !query ? recentSearches.length : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        } else if (query) {
          saveRecentSearch(query);
          window.location.href = `/suche?q=${encodeURIComponent(query)}`;
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            w-full pl-10 pr-10 py-3 
            bg-zinc-800 border border-zinc-700 
            rounded-xl text-white 
            placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
          "
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />

        {/* Search Icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Loading/Clear */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          ) : query ? (
            <button
              onClick={() => setQuery('')}
              className="text-gray-500 hover:text-white transition-colors"
              aria-label="Suche löschen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* Filters Toggle */}
      {showFilters && (
        <button
          onClick={() => setShowFiltersPanel(!showFiltersPanel)}
          className="mt-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter {showFiltersPanel ? 'verbergen' : 'anzeigen'}
        </button>
      )}

      {/* Filters Panel */}
      {showFiltersPanel && (
        <SearchFiltersPanel filters={filters} onChange={setFilters} />
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          className="
            absolute top-full left-0 right-0 mt-2
            bg-zinc-900 border border-zinc-800 
            rounded-xl shadow-xl overflow-hidden z-50
            max-h-[60vh] overflow-y-auto
          "
          role="listbox"
        >
          {/* Recent Searches */}
          {showRecent && !query && recentSearches.length > 0 && (
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Letzte Suchen</span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                >
                  Löschen
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={search}
                    onClick={() => setQuery(search)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg
                      ${selectedIndex === index ? 'bg-zinc-800' : 'hover:bg-zinc-800'}
                      text-gray-300 transition-colors
                    `}
                    role="option"
                    aria-selected={selectedIndex === index}
                  >
                    <svg className="inline w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && query && (
            <div className="p-4 border-b border-zinc-800">
              <span className="text-sm text-gray-400 mb-2 block">Vorschläge</span>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className="
                      px-3 py-1 
                      bg-zinc-800 hover:bg-zinc-700 
                      text-sm text-gray-300 
                      rounded-full transition-colors
                    "
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 ? (
            <div className="divide-y divide-zinc-800">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`
                    w-full text-left p-4 flex gap-4
                    ${selectedIndex === index ? 'bg-zinc-800' : 'hover:bg-zinc-800'}
                    transition-colors
                  `}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  {result.image_url && (
                    <img
                      src={result.image_url}
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4
                      className="text-white font-medium line-clamp-1"
                      dangerouslySetInnerHTML={{
                        __html: result.highlights?.title || result.title,
                      }}
                    />
                    {result.excerpt && (
                      <p
                        className="text-sm text-gray-400 mt-1 line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: result.highlights?.content || result.excerpt,
                        }}
                      />
                    )}
                    {result.category && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded">
                        {result.category}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : query && !isLoading ? (
            <div className="p-8 text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>Keine Ergebnisse für &ldquo;{query}&rdquo;</p>
              <p className="text-sm mt-1">Versuche andere Suchbegriffe</p>
            </div>
          ) : null}

          {/* View All Results */}
          {results.length > 0 && (
            <div className="p-4 border-t border-zinc-800">
              <a
                href={`/suche?q=${encodeURIComponent(query)}`}
                className="
                  block w-full text-center py-2 
                  bg-red-600 hover:bg-red-700 
                  text-white rounded-lg transition-colors
                "
              >
                Alle Ergebnisse anzeigen
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Search Filters Panel
 */
interface SearchFiltersPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

function SearchFiltersPanel({ filters, onChange }: SearchFiltersPanelProps) {
  const categories = ['Glaube', 'Lifestyle', 'Gesellschaft', 'Musik', 'Kultur'];

  return (
    <div className="mt-4 p-4 bg-zinc-800/50 rounded-xl space-y-4">
      {/* Categories */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Kategorien</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                const current = filters.category || [];
                const updated = current.includes(category)
                  ? current.filter((c) => c !== category)
                  : [...current, category];
                onChange({ ...filters, category: updated });
              }}
              className={`
                px-3 py-1 text-sm rounded-full transition-colors
                ${
                  filters.category?.includes(category)
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-1">Von</label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
            className="
              w-full px-3 py-2 
              bg-zinc-700 border border-zinc-600 
              rounded-lg text-white text-sm
            "
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-1">Bis</label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
            className="
              w-full px-3 py-2 
              bg-zinc-700 border border-zinc-600 
              rounded-lg text-white text-sm
            "
          />
        </div>
      </div>

      {/* Sort */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-1">Sortieren nach</label>
          <select
            value={filters.sortBy || 'relevance'}
            onChange={(e) =>
              onChange({ ...filters, sortBy: e.target.value as SearchFilters['sortBy'] })
            }
            className="
              w-full px-3 py-2 
              bg-zinc-700 border border-zinc-600 
              rounded-lg text-white text-sm
            "
          >
            <option value="relevance">Relevanz</option>
            <option value="date">Datum</option>
            <option value="title">Titel</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-1">Reihenfolge</label>
          <select
            value={filters.sortOrder || 'desc'}
            onChange={(e) =>
              onChange({ ...filters, sortOrder: e.target.value as 'asc' | 'desc' })
            }
            className="
              w-full px-3 py-2 
              bg-zinc-700 border border-zinc-600 
              rounded-lg text-white text-sm
            "
          >
            <option value="desc">Absteigend</option>
            <option value="asc">Aufsteigend</option>
          </select>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={() =>
          onChange({ sortBy: 'relevance', sortOrder: 'desc' })
        }
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        Filter zurücksetzen
      </button>
    </div>
  );
}

export { SearchFiltersPanel };
