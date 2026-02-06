// Related Posts Component / Ähnliche Beiträge Komponente / Componenta Postări Similare
// Shows related posts based on tags and category
// Zeigt ähnliche Beiträge basierend auf Tags und Kategorie
// Afișează postări similare bazate pe tag-uri și categorie

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from '@/hooks/useTranslation';
import { createClient } from '@/lib/supabase';
import { BlogPost } from '@/types';

interface RelatedPostsProps {
  currentPostId: string;
  currentTags: string | string[];
  limit?: number;
}

const translations = {
  de: {
    title: 'Ähnliche Beiträge',
    readMore: 'Weiterlesen',
    noRelated: 'Keine ähnlichen Beiträge gefunden'
  },
  en: {
    title: 'Related Posts',
    readMore: 'Read More',
    noRelated: 'No related posts found'
  },
  ro: {
    title: 'Postări Similare',
    readMore: 'Citește mai mult',
    noRelated: 'Nu s-au găsit postări similare'
  },
  ru: {
    title: 'Похожие статьи',
    readMore: 'Читать далее',
    noRelated: 'Похожие статьи не найдены'
  }
};

export default function RelatedPosts({ currentPostId, currentTags, limit = 3 }: RelatedPostsProps) {
  const { language } = useLanguage();
  const { translate } = useTranslation();
  const t = translations[language as keyof typeof translations] || translations.de;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [translatedTitles, setTranslatedTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchRelatedPosts = async () => {
      try {
        // Convert tags to array if string
        const tagsArray = Array.isArray(currentTags) 
          ? currentTags 
          : (currentTags ? currentTags.split(',').map(t => t.trim()) : []);

        // Fetch all published posts except current
        const { data: allPosts, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('published', true)
          .neq('id', currentPostId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error || !allPosts) {
          setPosts([]);
          return;
        }

        // Calculate relevance score based on matching tags
        const scoredPosts = allPosts.map(post => {
          const postTags = Array.isArray(post.tags) 
            ? post.tags 
            : (post.tags ? post.tags.split(',').map((t: string) => t.trim().toLowerCase()) : []);
          
          let score = 0;
          tagsArray.forEach(tag => {
            if (postTags.some((pt: string) => pt.toLowerCase().includes(tag.toLowerCase()))) {
              score += 10;
            }
          });

          // Boost recent posts
          const daysSincePublished = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSincePublished < 7) score += 5;
          if (daysSincePublished < 30) score += 2;

          return { ...post, relevanceScore: score };
        });

        // Sort by score and take top N
        scoredPosts.sort((a, b) => b.relevanceScore - a.relevanceScore);
        setPosts(scoredPosts.slice(0, limit));
      } catch (error) {
        console.error('Error fetching related posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedPosts();
  }, [currentPostId, currentTags, limit, supabase]);

  // Get title based on language
  const getTitle = (post: BlogPost) => {
    // First check if we have a translated version
    if (translatedTitles[post.id]) {
      return translatedTitles[post.id];
    }
    // Fallback to stored translations or original
    switch (language) {
      case 'en': return post.title_en || post.title;
      case 'ro': return post.title_ro || post.title;
      case 'ru': return post.title_ru || post.title;
      default: return post.title;
    }
  };

  // Translate titles when language changes or posts load
  useEffect(() => {
    const translateTitles = async () => {
      if (language === 'ro' || posts.length === 0) {
        setTranslatedTitles({});
        return;
      }

      const newTranslations: Record<string, string> = {};
      
      for (const post of posts) {
        // Skip if we already have a stored translation
        const storedTitle = language === 'en' ? post.title_en : 
                           language === 'de' ? post.title : 
                           language === 'ru' ? post.title_ru : null;
        
        if (storedTitle && storedTitle !== post.title) {
          newTranslations[post.id] = storedTitle;
        } else {
          // Translate dynamically
          const translated = await translate(post.title, language);
          if (translated && translated !== post.title) {
            newTranslations[post.id] = translated;
          }
        }
      }
      
      setTranslatedTitles(newTranslations);
    };

    translateTitles();
  }, [language, posts, translate]);

  if (loading) {
    return (
      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-gray-200 dark:bg-white/10 rounded-xl mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null; // Don't show section if no related posts
  }

  return (
    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 font-display">
        {t.title}
      </h2>
      
      {/* Horizontal card layout - smaller and more compact */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {posts.map((post, index) => (
          <Link
            key={post.id}
            href={`/blogs/${post.slug || post.id}`}
            className="group flex flex-row sm:flex-col bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-200/50 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Image - smaller and horizontal on mobile */}
            {post.image_url && (
              <div className="relative w-24 h-24 sm:w-full sm:h-28 flex-shrink-0 overflow-hidden">
                <Image
                  src={post.image_url}
                  alt={getTitle(post)}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            )}
            
            {/* Content - compact */}
            <div className="p-3 flex-1 min-w-0">
              <h3 className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-1.5 leading-snug">
                {getTitle(post)}
              </h3>
              
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-white/60 font-medium">
                <time>
                  {new Date(post.created_at).toLocaleDateString(
                    language === 'de' ? 'de-DE' : language === 'ro' ? 'ro-RO' : language === 'ru' ? 'ru-RU' : 'en-US',
                    { month: 'short', day: 'numeric' }
                  )}
                </time>
                <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-blue-500 dark:text-blue-400 font-semibold">
                  <span className="text-xs uppercase tracking-wide">{language === 'de' ? 'Weiterlesen' : language === 'en' ? 'Read more' : language === 'ro' ? 'Citește' : 'Читать'}</span>
                  →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
