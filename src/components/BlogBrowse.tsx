// Blog Browse Component - Alphabetical & Date-based blog filtering
// Blog-Durchsuchen-Komponente - Alphabetische & datumsbasierte Blog-Filterung
// Componentă Navigare Bloguri - Filtrare alfabetică & pe bază de dată

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from '@/hooks/useTranslation';
import { createClient } from '@/lib/supabase';
import { FaSortAlphaDown, FaCalendarAlt, FaChevronDown, FaChevronUp, FaTimes } from 'react-icons/fa';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  published: boolean;
}

interface TranslatedPost {
  id: string;
  title: string;
  slug: string;
  created_at: string;
}

const translations = {
  de: {
    browseBlogs: 'Blogs durchsuchen',
    alphabetical: 'Alphabetisch',
    byDate: 'Nach Datum',
    close: 'Schließen',
    noBlogs: 'Keine Blogs mit diesem Buchstaben',
    noBlogsMonth: 'Keine Blogs in diesem Monat',
    loading: 'Wird geladen...',
    months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  },
  en: {
    browseBlogs: 'Browse Blogs',
    alphabetical: 'Alphabetical',
    byDate: 'By Date',
    close: 'Close',
    noBlogs: 'No blogs starting with this letter',
    noBlogsMonth: 'No blogs in this month',
    loading: 'Loading...',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
  ro: {
    browseBlogs: 'Răsfoiește Bloguri',
    alphabetical: 'Alfabetic',
    byDate: 'După dată',
    close: 'Închide',
    noBlogs: 'Niciun blog cu această literă',
    noBlogsMonth: 'Niciun blog în această lună',
    loading: 'Se încarcă...',
    months: ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'],
  },
  ru: {
    browseBlogs: 'Обзор блогов',
    alphabetical: 'По алфавиту',
    byDate: 'По дате',
    close: 'Закрыть',
    noBlogs: 'Нет блогов на эту букву',
    noBlogsMonth: 'Нет блогов за этот месяц',
    loading: 'Загрузка...',
    months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  },
};

// Language-specific alphabets
const alphabets: Record<string, string[]> = {
  de: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z Ä Ö Ü'.split(' '),
  en: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z'.split(' '),
  ro: 'A Ă Â B C D E F G H I Î J K L M N O P Q R S Ș T Ț U V W X Y Z'.split(' '),
  ru: 'А Б В Г Д Е Ж З И К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Э Ю Я'.split(' '),
};

export default function BlogBrowse() {
  const { language } = useLanguage();
  const { translateBatch } = useTranslation();
  const t = translations[language as keyof typeof translations] || translations.de;
  
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'alpha' | 'date'>('alpha');
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [translatedPosts, setTranslatedPosts] = useState<TranslatedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [translating, setTranslating] = useState(false);
  
  const supabase = createClient();
  const currentAlphabet = alphabets[language] || alphabets.de;
  
  // Load all published posts when opened
  useEffect(() => {
    if (!isOpen) return;
    
    const loadAllPosts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, title, slug, created_at, published')
          .eq('published', true)
          .order('title', { ascending: true });
          
        if (data && !error) {
          setAllPosts(data);
        }
      } catch (err) {
        console.error('Error loading posts:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllPosts();
  }, [isOpen, supabase]);
  
  // Translate post titles when language changes (for non-Romanian)
  useEffect(() => {
    if (allPosts.length === 0) return;
    
    const doTranslate = async () => {
      if (language === 'ro') {
        // Original language, no translation needed
        setTranslatedPosts(allPosts.map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          created_at: p.created_at,
        })));
        return;
      }
      
      setTranslating(true);
      try {
        // Translate all titles in one batch for performance
        const titles = allPosts.map(p => p.title);
        const translatedTitles = await translateBatch(titles, language);
        
        const translated: TranslatedPost[] = allPosts.map((post, idx) => ({
          id: post.id,
          title: translatedTitles[idx] || post.title,
          slug: post.slug,
          created_at: post.created_at,
        }));
        setTranslatedPosts(translated);
      } catch {
        setTranslatedPosts(allPosts.map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          created_at: p.created_at,
        })));
      } finally {
        setTranslating(false);
      }
    };
    
    doTranslate();
  }, [allPosts, language, translateBatch]);

  // Posts to display (translated or original)
  const displayPosts = translatedPosts.length > 0 ? translatedPosts : allPosts.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    created_at: p.created_at,
  }));
  
  // Filter posts by selected letter
  const filteredByLetter = useMemo(() => {
    if (!selectedLetter) return [];
    return displayPosts
      .filter(post => {
        const firstChar = post.title.charAt(0).toUpperCase();
        // Handle special characters mapping
        if (language === 'de') {
          if (selectedLetter === 'Ä' && (firstChar === 'Ä' || firstChar === 'Ae')) return true;
          if (selectedLetter === 'Ö' && (firstChar === 'Ö' || firstChar === 'Oe')) return true;
          if (selectedLetter === 'Ü' && (firstChar === 'Ü' || firstChar === 'Ue')) return true;
        }
        return firstChar === selectedLetter;
      })
      .sort((a, b) => a.title.localeCompare(b.title, language));
  }, [selectedLetter, displayPosts, language]);
  
  // Get available years and months from posts
  const dateStructure = useMemo(() => {
    const structure: Record<number, Set<number>> = {};
    
    allPosts.forEach(post => {
      const date = new Date(post.created_at);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      if (!structure[year]) {
        structure[year] = new Set();
      }
      structure[year].add(month);
    });
    
    // Sort years descending
    const years = Object.keys(structure)
      .map(Number)
      .sort((a, b) => b - a);
    
    return { years, months: structure };
  }, [allPosts]);
  
  // Filter posts by selected year and month
  const filteredByDate = useMemo(() => {
    if (selectedYear === null || selectedMonth === null) return [];
    return displayPosts
      .filter(post => {
        const date = new Date(post.created_at);
        return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [selectedYear, selectedMonth, displayPosts]);
  
  // Get letters that have blogs
  const lettersWithBlogs = useMemo(() => {
    const letters = new Set<string>();
    displayPosts.forEach(post => {
      const firstChar = post.title.charAt(0).toUpperCase();
      letters.add(firstChar);
    });
    return letters;
  }, [displayPosts]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setSelectedLetter(null);
      setSelectedYear(null);
      setSelectedMonth(null);
    }
  };

  const handleLetterClick = (letter: string) => {
    setSelectedLetter(selectedLetter === letter ? null : letter);
  };

  const handleYearClick = (year: number) => {
    if (selectedYear === year) {
      setSelectedYear(null);
      setSelectedMonth(null);
    } else {
      setSelectedYear(year);
      setSelectedMonth(null);
    }
  };

  const handleMonthClick = (month: number) => {
    setSelectedMonth(selectedMonth === month ? null : month);
  };

  return (
    <div className="mt-4 animate-fadeIn" style={{ animationDelay: '0.15s' }}>
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white text-sm font-medium rounded-lg transition-all duration-300 border border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/30"
      >
        <FaSortAlphaDown className="w-4 h-4" />
        <span>{t.browseBlogs}</span>
        {isOpen ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
      </button>
      
      {/* Expanded panel */}
      {isOpen && (
        <div className="mt-3 p-4 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 animate-fadeIn">
          {/* Mode tabs */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => { setMode('alpha'); setSelectedYear(null); setSelectedMonth(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'alpha'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-300 dark:hover:bg-white/20'
              }`}
            >
              <FaSortAlphaDown className="w-3.5 h-3.5" />
              {t.alphabetical}
            </button>
            <button
              onClick={() => { setMode('date'); setSelectedLetter(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'date'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-300 dark:hover:bg-white/20'
              }`}
            >
              <FaCalendarAlt className="w-3.5 h-3.5" />
              {t.byDate}
            </button>
            
            <button
              onClick={handleToggle}
              className="ml-auto p-1.5 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-500 dark:text-white/50 transition-colors"
              title={t.close}
            >
              <FaTimes className="w-3 h-3" />
            </button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-white/30 border-t-gray-900 dark:border-t-white rounded-full"></div>
              <span className="ml-3 text-sm text-gray-500 dark:text-white/50">{t.loading}</span>
            </div>
          ) : (
            <>
              {/* Alphabetical mode */}
              {mode === 'alpha' && (
                <div>
                  {/* Alphabet grid */}
                  <div className="flex flex-wrap gap-1 xs:gap-1.5 mb-4">
                    {currentAlphabet.map(letter => {
                      const hasBlogs = lettersWithBlogs.has(letter);
                      const isSelected = selectedLetter === letter;
                      return (
                        <button
                          key={letter}
                          onClick={() => hasBlogs && handleLetterClick(letter)}
                          disabled={!hasBlogs}
                          className={`w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 ${
                            isSelected
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md scale-110'
                              : hasBlogs
                                ? 'bg-white dark:bg-white/10 text-gray-800 dark:text-white/80 hover:bg-gray-200 dark:hover:bg-white/20 hover:scale-105 border border-gray-200 dark:border-white/10'
                                : 'bg-gray-50 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-not-allowed border border-transparent'
                          }`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Translation indicator */}
                  {translating && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-500 dark:text-white/50">
                      <div className="animate-spin w-4 h-4 border-2 border-gray-300 dark:border-white/30 border-t-gray-900 dark:border-t-white rounded-full"></div>
                      <span>{language === 'de' ? 'Titel werden übersetzt...' : language === 'en' ? 'Translating titles...' : language === 'ro' ? 'Se traduc titlurile...' : 'Перевод заголовков...'}</span>
                    </div>
                  )}
                  
                  {/* Filtered blog list */}
                  {selectedLetter && (
                    <div className="border-t border-gray-200 dark:border-white/10 pt-3">
                      {filteredByLetter.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-white/50 text-center py-4">{t.noBlogs}</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {filteredByLetter.map(post => (
                            <li key={post.id}>
                              <Link
                                href={`/blogs/${post.slug || post.id}`}
                                className="flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors group"
                              >
                                <span className="text-gray-900 dark:text-white font-medium text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                                  {post.title}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-white/40 whitespace-nowrap ml-auto flex-shrink-0 mt-0.5">
                                  {new Date(post.created_at).toLocaleDateString(
                                    language === 'de' ? 'de-DE' : language === 'ro' ? 'ro-RO' : language === 'ru' ? 'ru-RU' : 'en-US',
                                    { month: 'short', day: 'numeric', year: 'numeric' }
                                  )}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Date mode */}
              {mode === 'date' && (
                <div>
                  {/* Years */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {dateStructure.years.map(year => {
                      const isSelected = selectedYear === year;
                      return (
                        <button
                          key={year}
                          onClick={() => handleYearClick(year)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            isSelected
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                              : 'bg-white dark:bg-white/10 text-gray-800 dark:text-white/80 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10'
                          }`}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Months for selected year */}
                  {selectedYear !== null && dateStructure.months[selectedYear] && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1.5 xs:gap-2">
                        {Array.from(dateStructure.months[selectedYear])
                          .sort((a, b) => b - a)
                          .map(month => {
                            const isSelected = selectedMonth === month;
                            return (
                              <button
                                key={month}
                                onClick={() => handleMonthClick(month)}
                                className={`px-3 py-1.5 rounded-lg text-xs xs:text-sm font-medium transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                                    : 'bg-white dark:bg-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10'
                                }`}
                              >
                                {t.months[month]}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  
                  {/* Translation indicator */}
                  {translating && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-500 dark:text-white/50">
                      <div className="animate-spin w-4 h-4 border-2 border-gray-300 dark:border-white/30 border-t-gray-900 dark:border-t-white rounded-full"></div>
                      <span>{language === 'de' ? 'Titel werden übersetzt...' : language === 'en' ? 'Translating titles...' : language === 'ro' ? 'Se traduc titlurile...' : 'Перевод заголовков...'}</span>
                    </div>
                  )}
                  
                  {/* Blog list for selected month */}
                  {selectedMonth !== null && (
                    <div className="border-t border-gray-200 dark:border-white/10 pt-3">
                      {filteredByDate.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-white/50 text-center py-4">{t.noBlogsMonth}</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {filteredByDate.map(post => (
                            <li key={post.id}>
                              <Link
                                href={`/blogs/${post.slug || post.id}`}
                                className="flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors group"
                              >
                                <span className="text-gray-900 dark:text-white font-medium text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                                  {post.title}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-white/40 whitespace-nowrap ml-auto flex-shrink-0 mt-0.5">
                                  {new Date(post.created_at).toLocaleDateString(
                                    language === 'de' ? 'de-DE' : language === 'ro' ? 'ro-RO' : language === 'ru' ? 'ru-RU' : 'en-US',
                                    { month: 'short', day: 'numeric' }
                                  )}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
