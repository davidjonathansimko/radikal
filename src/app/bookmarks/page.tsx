// Liked Posts Page / Gelikte Beiträge Seite / Pagina Postări Apreciate
// Shows posts that the user has liked (replaces old Bookmarks page)
// Zeigt Beiträge an, die der Benutzer geliked hat (ersetzt alte Lesezeichen-Seite)
// Afișează postările la care utilizatorul a dat like (înlocuiește vechea pagină de bookmark-uri)

'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from '@/hooks/useTranslation';
import { createClient } from '@/lib/supabase';
import { BlogPost } from '@/types';
import BlogCard from '@/components/BlogCard';
import { SkeletonBlogGrid } from '@/components/SkeletonLoaders';
import { FaHeart, FaArrowLeft, FaSearch, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';

// Translations / Übersetzungen
const translations = {
  de: {
    title: 'Gelikte Beiträge',
    subtitle: 'Deine geschätzten Artikel',
    noLiked: 'Noch keine gelikten Beiträge',
    noLikedDesc: 'Gib Beiträgen ein Like, um sie hier zu sehen',
    browsePosts: 'Blogs durchsuchen',
    searchPlaceholder: 'Beiträge durchsuchen...',
    loading: 'Beiträge werden geladen...',
    loginRequired: 'Anmeldung erforderlich',
    loginDesc: 'Melde dich an, um deine gelikten Beiträge zu sehen',
    login: 'Anmelden',
    backToBlogs: 'Zurück zu Blogs'
  },
  en: {
    title: 'Liked Posts',
    subtitle: 'Your appreciated articles',
    noLiked: 'No liked posts yet',
    noLikedDesc: 'Like posts to see them here',
    browsePosts: 'Browse blogs',
    searchPlaceholder: 'Search posts...',
    loading: 'Loading posts...',
    loginRequired: 'Login required',
    loginDesc: 'Login to see your liked posts',
    login: 'Login',
    backToBlogs: 'Back to Blogs'
  },
  ro: {
    title: 'Postări Apreciate',
    subtitle: 'Articolele tale apreciate',
    noLiked: 'Încă nu ai postări apreciate',
    noLikedDesc: 'Dă like la postări pentru a le vedea aici',
    browsePosts: 'Răsfoiește blogurile',
    searchPlaceholder: 'Caută în postări...',
    loading: 'Se încarcă postările...',
    loginRequired: 'Autentificare necesară',
    loginDesc: 'Autentifică-te pentru a vedea postările apreciate',
    login: 'Autentificare',
    backToBlogs: 'Înapoi la Bloguri'
  },
  ru: {
    title: 'Понравившиеся',
    subtitle: 'Ваши оценённые статьи',
    noLiked: 'Пока нет понравившихся постов',
    noLikedDesc: 'Поставьте лайк постам, чтобы увидеть их здесь',
    browsePosts: 'Просмотреть блоги',
    searchPlaceholder: 'Поиск в постах...',
    loading: 'Загрузка постов...',
    loginRequired: 'Требуется вход',
    loginDesc: 'Войдите, чтобы увидеть понравившиеся посты',
    login: 'Войти',
    backToBlogs: 'Назад к блогам'
  }
};

export default function LikedPostsPage() {
  const { language } = useLanguage();
  const { translateBatch } = useTranslation();
  const router = useRouter();
  const t = translations[language as keyof typeof translations] || translations.de;
  
  // State / Zustand
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 🌐 DeepL Translation state / Übersetzungsstatus / Stare traducere
  const [translatedPosts, setTranslatedPosts] = useState<Map<string, { title: string; excerpt: string }>>(new Map());
  
  // Supabase client - memoized / Supabase-Client - memoized
  const supabase = useMemo(() => createClient(), []);

  // Check auth on mount / Auth beim Laden prüfen
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    };
    checkAuth();
  }, [supabase]);

  // Fetch liked posts from Supabase / Gelikte Beiträge von Supabase abrufen
  const fetchLikedPosts = useCallback(async () => {
    if (!user) {
      setLikedPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get all post_ids that user has liked / Alle post_ids abrufen, die der Benutzer geliked hat
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('post_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (likesError || !likes || likes.length === 0) {
        setLikedPosts([]);
        setLoading(false);
        return;
      }

      // Get the blog posts for those IDs / Blog-Posts für diese IDs abrufen
      const postSlugs = likes.map(l => l.post_id);
      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select('*')
        .in('slug', postSlugs)
        .eq('published', true);

      if (postsError || !posts) {
        setLikedPosts([]);
        setLoading(false);
        return;
      }

      // Order posts by like date (most recently liked first)
      // Beiträge nach Like-Datum sortieren (zuletzt geliked zuerst)
      const slugOrder = new Map(likes.map((l, i) => [l.post_id, i]));
      posts.sort((a, b) => (slugOrder.get(a.slug) ?? 999) - (slugOrder.get(b.slug) ?? 999));

      setLikedPosts(posts);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      setLikedPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  // Load liked posts when user is available
  useEffect(() => {
    if (user) {
      fetchLikedPosts();
    }
  }, [user, fetchLikedPosts]);

  // 🌐 DeepL AUTO-TRANSLATION: Translate liked posts when language changes
  // 🌐 DeepL AUTO-ÜBERSETZUNG: Gelikte Posts automatisch übersetzen wenn Sprache sich ändert
  useEffect(() => {
    const translatePosts = async () => {
      // Skip if Romanian (original language) or no posts
      if (language === 'ro' || likedPosts.length === 0) {
        setTranslatedPosts(new Map());
        return;
      }

      try {
        const titles = likedPosts.map(post => post.title);
        const excerpts = likedPosts.map(post => post.excerpt);

        const [translatedTitles, translatedExcerpts] = await Promise.all([
          translateBatch(titles, language),
          translateBatch(excerpts, language),
        ]);

        const newTranslations = new Map<string, { title: string; excerpt: string }>();
        likedPosts.forEach((post, index) => {
          newTranslations.set(post.id, {
            title: translatedTitles[index] || post.title,
            excerpt: translatedExcerpts[index] || post.excerpt,
          });
        });

        setTranslatedPosts(newTranslations);
      } catch (error) {
        console.error('DeepL: Failed to translate liked posts:', error);
      }
    };

    translatePosts();
  }, [language, likedPosts, translateBatch]);

  // Filter posts by search (language-aware with DeepL translations)
  // Beiträge nach Suche filtern (sprachbewusst mit DeepL-Übersetzungen)
  const filteredPosts = useMemo(() => {
    if (!searchQuery) return likedPosts;
    const query = searchQuery.toLowerCase();
    return likedPosts.filter(post => {
      // Use DeepL translated title/excerpt if available, fallback to DB fields
      const translated = translatedPosts.get(post.id);
      const title = (translated?.title || post.title)?.toLowerCase() || '';
      const excerpt = (translated?.excerpt || post.excerpt)?.toLowerCase() || '';
      const tags = Array.isArray(post.tags) ? post.tags.join(' ').toLowerCase() : (post.tags || '').toLowerCase();
      return title.includes(query) || excerpt.includes(query) || tags.includes(query);
    });
  }, [likedPosts, searchQuery, translatedPosts]);

  // Show loading state — Pasul 121: skeleton dots
  if (authLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-2 mr-4">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pull-refresh-dot" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pull-refresh-dot" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pull-refresh-dot" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-gray-600 dark:text-white/60">{t.loading}</span>
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
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <FaHeart className="text-3xl text-red-400/40" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.loginRequired}</h1>
            <p className="text-gray-600 dark:text-white/60 mb-8">{t.loginDesc}</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
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
          className="inline-flex items-center gap-2 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 mb-8 group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" />
          <span>{t.backToBlogs}</span>
        </Link>

        {/* Header / Kopfbereich */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
              <FaHeart className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white animate-fadeIn">
                {t.title}
              </h1>
              <p className="text-gray-600 dark:text-white/60 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                {t.subtitle} ({likedPosts.length})
              </p>
            </div>
          </div>

          {/* Search / Suche */}
          {likedPosts.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <div className="relative flex-1">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:border-red-500/50 transition-colors"
                />
              </div>
            </div>
          )}
        </header>

        {/* Content / Inhalt */}
        {loading ? (
          <SkeletonBlogGrid count={6} />
        ) : likedPosts.length === 0 ? (
          // Empty state / Leerer Zustand
          <div className="text-center py-20 animate-fadeIn">
            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <FaHeart className="text-4xl text-red-400/20" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.noLiked}</h2>
            <p className="text-gray-600 dark:text-white/60 mb-8 max-w-md mx-auto">{t.noLikedDesc}</p>
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              {t.browsePosts}
            </Link>
          </div>
        ) : filteredPosts.length === 0 ? (
          // No search results / Keine Suchergebnisse
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-white/60">
              {language === 'de' ? `Keine Beiträge gefunden für "${searchQuery}"` :
               language === 'en' ? `No posts found for "${searchQuery}"` :
               language === 'ro' ? `Nicio postare găsită pentru "${searchQuery}"` :
               `Не найдено постов для "${searchQuery}"`}
            </p>
          </div>
        ) : (
          // Liked posts grid / Gelikte Beiträge Raster
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <div 
                key={post.id} 
                className="relative animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <BlogCard 
                  post={post} 
                  showBookmark={false} 
                  translatedTitle={translatedPosts.get(post.id)?.title}
                  translatedExcerpt={translatedPosts.get(post.id)?.excerpt}
                />
                
                {/* Liked badge / Geliked-Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-2 py-1 rounded-full bg-red-500/90 text-white text-xs font-medium flex items-center gap-1 force-white-text">
                    <FaHeart className="text-[10px]" />
                    {language === 'de' ? 'Geliked' : 
                     language === 'en' ? 'Liked' : 
                     language === 'ro' ? 'Apreciat' : 
                     'Понравилось'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
