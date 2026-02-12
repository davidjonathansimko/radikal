// Blog Card Component / Blog-Karten-Komponente / Componenta Card Blog
// Reusable card component for displaying blog posts
// Wiederverwendbare Kartenkomponente zur Anzeige von Blog-Posts
// Componentă card reutilizabilă pentru afișarea postărilor de blog

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BlogPost } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { calculateReadingTime } from '@/utils/readingTime';
// BookmarkButton commented out - replaced by Liked Posts / BookmarkButton auskommentiert - ersetzt durch Liked Posts
// import BookmarkButton from '@/components/BookmarkButton';
import PrefetchLink from '@/components/PrefetchLink';
import { FaHeart, FaEye, FaClock, FaComment } from 'react-icons/fa';

interface BlogCardProps {
  post: BlogPost;
  variant?: 'default' | 'featured' | 'compact';
  showBookmark?: boolean;
  className?: string;
  translatedTitle?: string; // Pre-translated title from DeepL / Vorübersetzter Titel von DeepL
  translatedExcerpt?: string; // Pre-translated excerpt from DeepL / Vorübersetzter Auszug von DeepL
}

const BlogCard: React.FC<BlogCardProps> = ({ 
  post, 
  variant = 'default',
  showBookmark = true,
  className = '',
  translatedTitle,
  translatedExcerpt,
}) => {
  const { language } = useLanguage();

  // Get title based on language / Titel basierend auf Sprache abrufen
  // Priority: translatedTitle prop (DeepL) > language-specific DB field > default title
  const getTitle = () => {
    if (translatedTitle) return translatedTitle;
    switch (language) {
      case 'de': return post.title_de || post.title;
      case 'en': return post.title_en || post.title;
      case 'ro': return post.title_ro || post.title;
      case 'ru': return post.title_ru || post.title;
      default: return post.title;
    }
  };

  // Get excerpt based on language / Auszug basierend auf Sprache abrufen
  // Priority: translatedExcerpt prop (DeepL) > language-specific DB field > default excerpt
  const getExcerpt = () => {
    if (translatedExcerpt) return translatedExcerpt;
    switch (language) {
      case 'de': return post.excerpt_de || post.excerpt;
      case 'en': return post.excerpt_en || post.excerpt;
      case 'ro': return post.excerpt_ro || post.excerpt;
      case 'ru': return post.excerpt_ru || post.excerpt;
      default: return post.excerpt;
    }
  };

  // Format date / Datum formatieren
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'de' ? 'de-DE' : 
                   language === 'ro' ? 'ro-RO' : 
                   language === 'ru' ? 'ru-RU' : 'en-US';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get slug for link / Slug für Link abrufen
  const slug = post.slug || post.id;

  // Reading time / Lesezeit
  const readingTime = calculateReadingTime(post.content || '', language);

  // Compact variant / Kompakte Variante
  if (variant === 'compact') {
    return (
      <Link href={`/blogs/${slug}`} className={`group ${className}`}>
        <div className="glass-effect rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex gap-4">
            {/* Image / Bild */}
            {post.image_url && (
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                <Image
                  src={post.image_url}
                  alt={getTitle()}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            )}
            
            {/* Content / Inhalt */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate mb-1 group-hover:text-blue-400 transition-colors">
                {getTitle()}
              </h3>
              <p className="text-sm text-white/60 line-clamp-2">{getExcerpt()}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                <span>{formatDate(post.created_at)}</span>
                <span className="flex items-center gap-1">
                  <FaClock className="text-[10px]" />
                  {readingTime.minutes} min
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Featured variant / Hervorgehobene Variante
  if (variant === 'featured') {
    return (
      <Link href={`/blogs/${slug}`} className={`group ${className}`}>
        <article className="glass-effect rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] h-full">
          {/* Image / Bild */}
          <div className="relative aspect-video overflow-hidden">
            {post.image_url ? (
              <Image
                src={post.image_url}
                alt={getTitle()}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-600/20" />
            )}
            
            {/* Overlay gradient / Überlagerungs-Farbverlauf */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Featured badge / Hervorgehobenes Badge */}
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium force-white-text">
              Featured
            </div>
            
            {/* Bookmark button commented out - replaced by Liked Posts */}
            {/* {showBookmark && (
              <div className="absolute top-4 right-4">
                <BookmarkButton postId={post.id} size="md" />
              </div>
            )} */}
            
            {/* Title overlay / Titel-Überlagerung */}
            <div className="absolute bottom-0 left-0 right-0 p-6 force-white-text">
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                {getTitle()}
              </h2>
              <p className="text-white/80 line-clamp-2">{getExcerpt()}</p>
            </div>
          </div>
          
          {/* Meta info / Meta-Info */}
          <div className="p-6 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-white/60">
              <span>{formatDate(post.created_at)}</span>
              <span className="flex items-center gap-1">
                <FaClock />
                {readingTime.minutes} min
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/60">
              <span className="flex items-center gap-1">
                <FaEye />
                {post.views || 0}
              </span>
              <span className="flex items-center gap-1">
                <FaHeart />
                {post.likes || 0}
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Default variant / Standard-Variante
  return (
    <Link href={`/blogs/${slug}`} className={`group ${className}`}>
      <article className="glass-effect rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl h-full flex flex-col hover-lift hover-shine">
        {/* Image / Bild */}
        <div className="relative aspect-video overflow-hidden">
          {post.image_url ? (
            <Image
              src={post.image_url}
              alt={getTitle()}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
              <span className="text-4xl opacity-20">📝</span>
            </div>
          )}
          
          {/* Reading time badge / Lesezeit-Badge */}
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5 force-white-text">
            <FaClock className="text-blue-400" />
            {readingTime.minutes} min
          </div>
          
          {/* Bookmark button commented out - replaced by Liked Posts */}
          {/* {showBookmark && (
            <div className="absolute top-4 right-4" onClick={(e) => e.preventDefault()}>
              <BookmarkButton postId={post.id} size="sm" />
            </div>
          )} */}
        </div>
        
        {/* Content / Inhalt */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Tags / Tags - show max 2 on mobile, 3 on desktop */}
          {post.tags && (
            <div className="flex flex-wrap gap-2 mb-3 overflow-hidden max-h-8">
              {(Array.isArray(post.tags) ? post.tags : post.tags.split(',')).slice(0, 2).map((tag: string, idx: number) => (
                <span 
                  key={idx}
                  className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs whitespace-nowrap max-w-[120px] truncate"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
          
          {/* Title / Titel */}
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
            {getTitle()}
          </h3>
          
          {/* Excerpt / Auszug */}
          <p className="text-white/60 text-sm line-clamp-3 flex-1 mb-4">
            {getExcerpt()}
          </p>
          
          {/* Footer / Fußzeile */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-sm text-white/40">{formatDate(post.created_at)}</span>
            <div className="flex items-center gap-3 text-sm text-white/40">
              <span className="flex items-center gap-1">
                <FaEye className="text-xs" />
                {post.views || 0}
              </span>
              <span className="flex items-center gap-1">
                <FaHeart className="text-xs" />
                {post.likes || 0}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
