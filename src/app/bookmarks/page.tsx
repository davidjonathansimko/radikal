// Bookmarks Page / Lesezeichen-Seite / Pagina Bookmark-uri
// User's saved posts and reading list
// Gespeicherte Posts und Leseliste des Benutzers
// Postările salvate și lista de lectură a utilizatorului

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { useBookmarks } from '@/hooks/useBookmarks';
import { createClient } from '@/lib/supabase';
import BlogCard from '@/components/BlogCard';
import { SkeletonBlogGrid } from '@/components/SkeletonLoaders';
import { FaBookmark, FaArrowLeft, FaSearch, FaTrash, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';

// Translations / Übersetzungen
const translations = {
  de: {
    title: 'Meine Lesezeichen',
    subtitle: 'Deine gespeicherten Artikel',
    noBookmarks: 'Noch keine Lesezeichen',
    noBookmarksDesc: 'Speichere interessante Artikel zum späteren Lesen',
    browsePosts: 'Blogs durchsuchen',
    searchPlaceholder: 'Lesezeichen durchsuchen...',
    removeAll: 'Alle entfernen',
    confirmRemoveAll: 'Alle Lesezeichen wirklich löschen?',
    loading: 'Lesezeichen werden geladen...',
    loginRequired: 'Anmeldung erforderlich',
    loginDesc: 'Melde dich an, um deine Lesezeichen zu sehen',
    login: 'Anmelden',
    savedOn: 'Gespeichert am',
    backToBlogs: 'Zurück zu Blogs'
  },
  en: {
    title: 'My Bookmarks',
    subtitle: 'Your saved articles',
    noBookmarks: 'No bookmarks yet',
    noBookmarksDesc: 'Save interesting articles to read later',
    browsePosts: 'Browse blogs',
    searchPlaceholder: 'Search bookmarks...',
    removeAll: 'Remove all',
    confirmRemoveAll: 'Really delete all bookmarks?',
    loading: 'Loading bookmarks...',
    loginRequired: 'Login required',
    loginDesc: 'Login to see your bookmarks',
    login: 'Login',
    savedOn: 'Saved on',
    backToBlogs: 'Back to Blogs'
  },
  ro: {
    title: 'Bookmark-urile mele',
    subtitle: 'Articolele tale salvate',
    noBookmarks: 'Încă nu ai bookmark-uri',
    noBookmarksDesc: 'Salvează articole interesante pentru a le citi mai târziu',
    browsePosts: 'Răsfoiește blogurile',
    searchPlaceholder: 'Caută în bookmark-uri...',
    removeAll: 'Elimină toate',
    confirmRemoveAll: 'Chiar vrei să ștergi toate bookmark-urile?',
    loading: 'Se încarcă bookmark-urile...',
    loginRequired: 'Autentificare necesară',
    loginDesc: 'Autentifică-te pentru a vedea bookmark-urile',
    login: 'Autentificare',
    savedOn: 'Salvat pe',
    backToBlogs: 'Înapoi la Bloguri'
  },
  ru: {
    title: 'Мои закладки',
    subtitle: 'Ваши сохранённые статьи',
    noBookmarks: 'Пока нет закладок',
    noBookmarksDesc: 'Сохраняйте интересные статьи для чтения позже',
    browsePosts: 'Просмотреть блоги',
    searchPlaceholder: 'Поиск в закладках...',
    removeAll: 'Удалить все',
    confirmRemoveAll: 'Действительно удалить все закладки?',
    loading: 'Загрузка закладок...',
    loginRequired: 'Требуется вход',
    loginDesc: 'Войдите, чтобы увидеть закладки',
    login: 'Войти',
    savedOn: 'Сохранено',
    backToBlogs: 'Назад к блогам'
  }
};

export default function BookmarksPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const t = translations[language as keyof typeof translations] || translations.de;
  
  // State / Zustand
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bookmarks hook / Lesezeichen-Hook
  const { bookmarkedPosts, loading, removeBookmark } = useBookmarks();
  
  // Supabase client / Supabase-Client
  const supabase = createClient();

  // Check auth on mount / Auth beim Laden prüfen
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    };
    checkAuth();
  }, []);

  // Filter bookmarks by search / Lesezeichen nach Suche filtern
  const filteredPosts = bookmarkedPosts.filter(post => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const title = post.title?.toLowerCase() || '';
    const excerpt = post.excerpt?.toLowerCase() || '';
    const tags = Array.isArray(post.tags) ? post.tags.join(' ').toLowerCase() : (post.tags || '').toLowerCase();
    return title.includes(query) || excerpt.includes(query) || tags.includes(query);
  });

  // Format date / Datum formatieren
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : language === 'ro' ? 'ro-RO' : language === 'ru' ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Show loading state / Ladezustand anzeigen
  if (authLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-3xl text-blue-500 mr-4" />
            <span className="text-white/60">{t.loading}</span>
          </div>
        </div>
      </div>
    );
  }

  // Show login required / Anmeldung erforderlich anzeigen
  if (!user) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <FaBookmark className="text-3xl text-white/20" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">{t.loginRequired}</h1>
            <p className="text-white/60 mb-8">{t.loginDesc}</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              {t.login}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button / Zurück-Button */}
        <Link 
          href="/blogs"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-200 mb-8 group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" />
          <span>{t.backToBlogs}</span>
        </Link>

        {/* Header / Kopfbereich */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <FaBookmark className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white animate-fadeIn">
                {t.title}
              </h1>
              <p className="text-white/60 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                {t.subtitle} ({bookmarkedPosts.length})
              </p>
            </div>
          </div>

          {/* Search and actions / Suche und Aktionen */}
          {bookmarkedPosts.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              {/* Search / Suche */}
              <div className="relative flex-1">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>
          )}
        </header>

        {/* Content / Inhalt */}
        {loading ? (
          <SkeletonBlogGrid count={6} />
        ) : bookmarkedPosts.length === 0 ? (
          // Empty state / Leerer Zustand
          <div className="text-center py-20 animate-fadeIn">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <FaBookmark className="text-4xl text-white/10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">{t.noBookmarks}</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto">{t.noBookmarksDesc}</p>
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              {t.browsePosts}
            </Link>
          </div>
        ) : filteredPosts.length === 0 ? (
          // No search results / Keine Suchergebnisse
          <div className="text-center py-20">
            <p className="text-white/60">No bookmarks matching &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          // Bookmarks grid / Lesezeichen-Raster
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <div 
                key={post.id} 
                className="relative animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <BlogCard post={post} />
                
                {/* Bookmarked date badge / Gespeichert-Datum-Badge */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full bg-blue-500/90 text-white text-xs font-medium flex items-center gap-1">
                    <FaBookmark className="text-[10px]" />
                    {formatDate(post.bookmarked_at)}
                  </span>
                </div>
                
                {/* Remove button / Entfernen-Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeBookmark(post.id);
                  }}
                  className="absolute bottom-4 right-4 z-10 p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove bookmark"
                >
                  <FaTrash className="text-sm" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
