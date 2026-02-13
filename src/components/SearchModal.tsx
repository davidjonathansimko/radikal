// Search Modal Component / Such-Modal-Komponente / Componenta Modal Căutare
// Full-text search with instant results and keyboard navigation
// Volltextsuche mit sofortigen Ergebnissen und Tastaturnavigation
// Căutare full-text cu rezultate instantanee și navigare cu tastatura

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from '@/hooks/useTranslation';
import { FaSearch, FaTimes, FaSpinner, FaClock, FaFire, FaArrowRight } from 'react-icons/fa';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for client-side search fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Translations / Übersetzungen
const translations = {
  de: {
    placeholder: 'Blogs durchsuchen...',
    noResults: 'Keine Ergebnisse gefunden',
    searching: 'Suche...',
    recentSearches: 'Letzte Suchen',
    popularPosts: 'Beliebte Beiträge',
    clearHistory: 'Verlauf löschen',
    pressEsc: 'ESC zum Schließen',
    tapToClose: 'Tippe außerhalb um zu schließen',
    typeToSearch: 'Tippe um zu suchen',
    resultsFor: 'Ergebnisse für',
    viewAll: 'Alle anzeigen'
  },
  en: {
    placeholder: 'Search blogs...',
    noResults: 'No results found',
    searching: 'Searching...',
    recentSearches: 'Recent Searches',
    popularPosts: 'Popular Posts',
    clearHistory: 'Clear history',
    pressEsc: 'Press ESC to close',
    tapToClose: 'Tap outside to close',
    typeToSearch: 'Type to search',
    resultsFor: 'Results for',
    viewAll: 'View all'
  },
  ro: {
    placeholder: 'Caută bloguri...',
    noResults: 'Niciun rezultat găsit',
    searching: 'Se caută...',
    recentSearches: 'Căutări recente',
    popularPosts: 'Postări populare',
    clearHistory: 'Șterge istoricul',
    pressEsc: 'Apasă ESC pentru a închide',
    tapToClose: 'Apasă pe ecran pentru a ieși',
    typeToSearch: 'Scrie pentru a căuta',
    resultsFor: 'Rezultate pentru',
    viewAll: 'Vezi toate'
  },
  ru: {
    placeholder: 'Поиск блогов...',
    noResults: 'Результатов не найдено',
    searching: 'Поиск...',
    recentSearches: 'Недавние поиски',
    popularPosts: 'Популярные посты',
    clearHistory: 'Очистить историю',
    pressEsc: 'Нажмите ESC чтобы закрыть',
    tapToClose: 'Нажмите на экран чтобы выйти',
    typeToSearch: 'Введите для поиска',
    resultsFor: 'Результаты для',
    viewAll: 'Показать все'
  }
};

interface SearchResult {
  id: string;
  title: string;
  title_en?: string;
  title_ro?: string;
  title_ru?: string;
  excerpt: string;
  image_url?: string;
  created_at: string;
  tags?: string;
  slug?: string;
  highlightedTitle?: string;
  highlightedExcerpt?: string;
  relevanceScore?: number;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { translateBatch } = useTranslation();
  const router = useRouter();
  const t = translations[language as keyof typeof translations] || translations.de;
  
  // State / Zustand
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [translatedTitles, setTranslatedTitles] = useState<Map<string, string>>(new Map());
  const [translatedExcerpts, setTranslatedExcerpts] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Refs / Referenzen
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const scrollPositionRef = useRef<number>(0);

  // Block body scroll when modal is open / Body-Scroll blockieren wenn Modal offen / Blochează scroll când modal e deschis
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position in ref
      scrollPositionRef.current = window.scrollY;
      // Block scroll on both html and body
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.position = 'fixed';
      document.documentElement.style.width = '100%';
      document.documentElement.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollPositionRef.current}px`;
    } else {
      // Restore styles
      document.documentElement.style.overflow = '';
      document.documentElement.style.position = '';
      document.documentElement.style.width = '';
      document.documentElement.style.top = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      // Restore scroll position from ref
      window.scrollTo(0, scrollPositionRef.current);
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.documentElement.style.position = '';
      document.documentElement.style.width = '';
      document.documentElement.style.top = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen]);

  // Translate results when language changes or results change
  // Ergebnisse übersetzen wenn Sprache oder Ergebnisse sich ändern
  useEffect(() => {
    const translateResults = async () => {
      if (results.length === 0 || language === 'ro') {
        // Romanian is the original language, no translation needed
        setTranslatedTitles(new Map());
        setTranslatedExcerpts(new Map());
        return;
      }

      try {
        const titles = results.map(r => r.title);
        const excerpts = results.map(r => r.excerpt);
        
        const [translatedTitlesList, translatedExcerptsList] = await Promise.all([
          translateBatch(titles, language),
          translateBatch(excerpts, language)
        ]);
        
        const newTitles = new Map<string, string>();
        const newExcerpts = new Map<string, string>();
        
        results.forEach((result, index) => {
          newTitles.set(result.id, translatedTitlesList[index] || result.title);
          newExcerpts.set(result.id, translatedExcerptsList[index] || result.excerpt);
        });
        
        setTranslatedTitles(newTitles);
        setTranslatedExcerpts(newExcerpts);
      } catch (error) {
        console.error('Failed to translate search results:', error);
      }
    };

    translateResults();
  }, [results, language, translateBatch]);

  // Load recent searches from localStorage / Letzte Suchen aus localStorage laden
  useEffect(() => {
    const saved = localStorage.getItem('radikal-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Focus input when modal opens / Input fokussieren wenn Modal öffnet
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Add blur effect to page content when modal is open
  // Blur-Effekt auf Seiteninhalt hinzufügen wenn Modal geöffnet ist
  // Adaugă efect de blur pe conținutul paginii când modal-ul e deschis
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('search-modal-open');
      // Disable scrolling on body
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('search-modal-open');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('search-modal-open');
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle keyboard navigation / Tastaturnavigation handhaben
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Search function with debounce / Suchfunktion mit Debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Try API first
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&lang=${language}&limit=8`);
      const data = await response.json();
      
      if (data.success && data.results && data.results.length > 0) {
        setResults(data.results);
        setSelectedIndex(0);
        setLoading(false);
        return;
      }
      
      // Fallback: Direct Supabase search if API fails or returns no results
      // Search in ALL language fields with fuzzy matching
      if (supabase) {
        console.log('Using direct Supabase search fallback - fuzzy search');
        const searchTerm = searchQuery.trim().toLowerCase().replace(/[%_]/g, '\\$&');
        
        // Create fuzzy terms (original + shorter versions)
        const fuzzyTerms: string[] = [searchTerm];
        for (let i = searchTerm.length - 1; i >= 2; i--) {
          fuzzyTerms.push(searchTerm.substring(0, i));
        }
        
        // Build OR conditions for fuzzy search
        const fuzzyConditions = fuzzyTerms.slice(0, 5).flatMap(t => [
          `title.ilike.%${t}%`,
          `title_en.ilike.%${t}%`,
          `excerpt.ilike.%${t}%`,
          `excerpt_en.ilike.%${t}%`
        ]).join(',');
        
        // Search in all available language fields with fuzzy matching
        const { data: posts, error } = await supabase
          .from('blog_posts')
          .select('id, title, title_en, excerpt, excerpt_en, image_url, created_at, slug')
          .eq('published', true)
          .or(fuzzyConditions)
          .order('created_at', { ascending: false })
          .limit(8);
        
        if (!error && posts && posts.length > 0) {
          setResults(posts as SearchResult[]);
          setSelectedIndex(0);
          setLoading(false);
          return;
        }
        
        // Also try searching in translation_cache for non-Romanian languages
        if (language !== 'ro') {
          for (const fuzzyTerm of fuzzyTerms.slice(0, 3)) {
            const { data: translations } = await supabase
              .from('translation_cache')
              .select('original_text')
              .eq('target_lang', language)
              .ilike('translated_text', `%${fuzzyTerm}%`)
              .limit(5);
            
            if (translations && translations.length > 0) {
              // Found matching translations, now find the original posts
              for (const t of translations) {
                const origSnippet = t.original_text.substring(0, 50).replace(/[%_]/g, '\\$&');
                const { data: matchedPosts } = await supabase
                  .from('blog_posts')
                  .select('id, title, title_en, excerpt, excerpt_en, image_url, created_at, slug')
                  .eq('published', true)
                  .or(`title.ilike.%${origSnippet}%,excerpt.ilike.%${origSnippet}%`)
                  .limit(3);
                
                if (matchedPosts && matchedPosts.length > 0) {
                  setResults(matchedPosts as SearchResult[]);
                  setSelectedIndex(0);
                  setLoading(false);
                  return;
                }
              }
            }
          }
        }
        
        if (error) {
          console.error('Supabase search error:', error.message || JSON.stringify(error));
        }
      }
      
      // No results found
      setResults([]);
    } catch (error) {
      console.error('Search fetch error:', error);
      
      // Fallback on error: try direct Supabase with fuzzy search
      if (supabase) {
        try {
          const searchTerm = searchQuery.trim().toLowerCase().replace(/[%_]/g, '\\$&');
          
          // Create fuzzy terms for fallback
          const fuzzyTerms: string[] = [searchTerm];
          for (let i = searchTerm.length - 1; i >= 2; i--) {
            fuzzyTerms.push(searchTerm.substring(0, i));
          }
          
          const fuzzyConditions = fuzzyTerms.slice(0, 5).flatMap(t => [
            `title.ilike.%${t}%`,
            `title_en.ilike.%${t}%`,
            `excerpt.ilike.%${t}%`,
            `excerpt_en.ilike.%${t}%`
          ]).join(',');
          
          const { data: posts } = await supabase
            .from('blog_posts')
            .select('id, title, title_en, excerpt, excerpt_en, image_url, created_at, slug')
            .eq('published', true)
            .or(fuzzyConditions)
            .order('created_at', { ascending: false })
            .limit(8);
          
          if (posts && posts.length > 0) {
            setResults(posts as SearchResult[]);
            setSelectedIndex(0);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Supabase fallback error:', e);
        }
      }
      
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [language]);

  // Handle input change with debounce / Input-Änderung mit Debounce handhaben
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounce search / Suche drosseln
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Handle result click / Ergebnis-Klick handhaben
  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches / In letzten Suchen speichern
    const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('radikal-recent-searches', JSON.stringify(newRecent));
    
    // Navigate to post / Zum Post navigieren
    const slug = result.slug || result.id;
    router.push(`/blogs/${slug}`);
    onClose();
  };

  // Clear search history / Suchverlauf löschen
  const clearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem('radikal-recent-searches');
  };

  // Get title based on language - use translated version if available
  // Titel basierend auf Sprache abrufen - übersetzte Version wenn verfügbar
  const getTitle = (result: SearchResult) => {
    // First check if we have a DeepL translation
    const translatedTitle = translatedTitles.get(result.id);
    if (translatedTitle) return translatedTitle;
    
    // Fallback to stored translations
    switch (language) {
      case 'en': return result.title_en || result.title;
      case 'ro': return result.title;
      case 'ru': return result.title_ru || result.title;
      default: return result.title;
    }
  };

  // Get excerpt based on language - use translated version if available
  const getExcerpt = (result: SearchResult) => {
    // First check if we have a DeepL translation
    const translatedExcerpt = translatedExcerpts.get(result.id);
    if (translatedExcerpt) return translatedExcerpt;
    
    // Fallback to stored translations or original
    return result.excerpt;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop / Hintergrund - clicking/touching closes modal */}
      {/* Full screen overlay that blocks all page interaction */}
      <div 
        className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-md z-[9998] animate-fadeIn cursor-pointer"
        style={{ 
          backdropFilter: 'blur(8px) saturate(50%)',
          WebkitBackdropFilter: 'blur(8px) saturate(50%)'
        }}
        onClick={onClose}
        onTouchStart={(e) => { e.stopPropagation(); onClose(); }}
        onTouchEnd={(e) => { e.stopPropagation(); onClose(); }}
        onMouseDown={onClose}
      />
      
      {/* Modal container with margins like hamburger menu */}
      <div 
        className="fixed inset-0 z-[9999] p-4 sm:p-6 flex items-end sm:items-start justify-center pb-20 sm:pb-0 sm:pt-20"
        onClick={onClose}
        onTouchEnd={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div 
          className="w-full max-w-2xl mx-4 transform rounded-2xl bg-white/95 dark:bg-black/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl transition-all animate-slideUp"
          onClick={e => e.stopPropagation()}
          onTouchEnd={e => e.stopPropagation()}
        >
          {/* Search input area / Sucheingabebereich */}
          <div className="relative">
            <FaSearch className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 text-lg sm:text-xl" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder={t.placeholder}
              className="w-full bg-transparent px-12 sm:px-14 py-4 sm:py-5 text-base sm:text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none border-b border-gray-200 dark:border-white/10"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); }}
                className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Results area / Ergebnisbereich */}
          <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto p-4">
            {/* Loading state / Ladezustand */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <FaSpinner className="animate-spin text-2xl text-blue-500 mr-3" />
                <span className="text-gray-500 dark:text-white/60">{t.searching}</span>
              </div>
            )}

            {/* Search results / Suchergebnisse */}
            {!loading && results.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-white/40 px-2 mb-3">
                  {t.resultsFor} &quot;{query}&quot;
                </p>
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center gap-4 group ${
                      index === selectedIndex 
                        ? 'bg-gray-200 dark:bg-white/20' 
                        : 'hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {/* Image thumbnail / Bild-Miniaturansicht */}
                    {result.image_url && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-white/5">
                        <Image
                          src={result.image_url}
                          alt={getTitle(result)}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Content / Inhalt */}
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base leading-tight"
                        dangerouslySetInnerHTML={{ 
                          __html: result.highlightedTitle || getTitle(result) 
                        }}
                      />
                      <p 
                        className="text-sm text-gray-600 dark:text-white/60 line-clamp-1 mt-1"
                        dangerouslySetInnerHTML={{ 
                          __html: result.highlightedExcerpt || getExcerpt(result) 
                        }}
                      />
                      {result.tags && (
                        <div className="flex gap-2 mt-2">
                          {result.tags.split(',').slice(0, 3).map(tag => (
                            <span 
                              key={tag} 
                              className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Arrow / Pfeil */}
                    <FaArrowRight className="text-gray-300 dark:text-white/0 group-hover:text-gray-500 dark:group-hover:text-white/40 transition-all" />
                  </button>
                ))}
              </div>
            )}

            {/* No results / Keine Ergebnisse */}
            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <FaSearch className="text-2xl text-gray-400 dark:text-white/20" />
                </div>
                <p className="text-gray-600 dark:text-white/60">{t.noResults}</p>
                <p className="text-sm text-gray-500 dark:text-white/40 mt-1">&quot;{query}&quot;</p>
              </div>
            )}

            {/* Initial state with recent searches / Anfangszustand mit letzten Suchen */}
            {!loading && query.length < 2 && (
              <div className="space-y-6">
                {/* Recent searches / Letzte Suchen */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-2 mb-3">
                      <span className="text-sm text-gray-500 dark:text-white/40 flex items-center gap-2">
                        <FaClock />
                        {t.recentSearches}
                      </span>
                      <button
                        onClick={clearHistory}
                        className="text-xs text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white transition-colors"
                      >
                        {t.clearHistory}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setQuery(search);
                            performSearch(search);
                          }}
                          className="px-4 py-2 rounded-full bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white/80 text-sm hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hint / Hinweis */}
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-white/40 text-sm">{t.typeToSearch}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer / Fußbereich - different on mobile vs desktop */}
          <div className="border-t border-gray-200 dark:border-white/10 px-5 py-3">
            {/* Mobile: Simple tap to close message */}
            <div className="sm:hidden text-center">
              <span className="text-sm text-gray-500 dark:text-white/50">{t.tapToClose}</span>
            </div>
            {/* Desktop: Keyboard shortcuts */}
            <div className="hidden sm:flex items-center justify-between text-sm text-gray-500 dark:text-white/40">
              <div className="flex items-center gap-4">
                <kbd className="px-2 py-1 rounded bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60 text-xs">↑↓</kbd>
                <span>Navigate</span>
                <kbd className="px-2 py-1 rounded bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60 text-xs">Enter</kbd>
                <span>Select</span>
              </div>
              <span>{t.pressEsc}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add styles for highlight / Stile für Hervorhebung hinzufügen */}
      <style jsx global>{`
        .dark mark {
          background: linear-gradient(to right, rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.4));
          color: white;
          padding: 0 2px;
          border-radius: 2px;
        }
        mark {
          background: linear-gradient(to right, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3));
          color: #1e293b;
          padding: 0 2px;
          border-radius: 2px;
        }
      `}</style>
    </>
  );
};

export default SearchModal;
