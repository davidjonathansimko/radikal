// Skeleton Loading Components / Skeleton-Ladekomponenten / Componente Skeleton pentru încărcare
// Beautiful animated loading placeholders that match the design
// Schöne animierte Lade-Platzhalter, die zum Design passen
// Placeholdere animate frumoase pentru încărcare care se potrivesc cu designul

'use client';

import React from 'react';

// Base skeleton component with shimmer animation / Basis-Skeleton-Komponente mit Shimmer-Animation
interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

// Basic skeleton element / Grundlegendes Skeleton-Element
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div 
    className={`animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded ${className}`}
    style={style}
  />
);

// Skeleton for text lines / Skeleton für Textzeilen
interface SkeletonTextProps {
  lines?: number;
  className?: string;
  widths?: string[];
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ 
  lines = 3, 
  className = '',
  widths = []
}) => {
  const defaultWidths = ['100%', '90%', '75%', '85%', '60%'];
  
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i}
          className="h-4"
          style={{ width: widths[i] || defaultWidths[i % defaultWidths.length] }}
        />
      ))}
    </div>
  );
};

// Skeleton for images / Skeleton für Bilder
interface SkeletonImageProps {
  className?: string;
  aspectRatio?: 'video' | 'square' | 'portrait';
}

export const SkeletonImage: React.FC<SkeletonImageProps> = ({ 
  className = '',
  aspectRatio = 'video'
}) => {
  const ratioClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]'
  };
  
  return (
    <div className={`relative overflow-hidden rounded-xl ${ratioClasses[aspectRatio]} ${className}`}>
      <Skeleton className="absolute inset-0 w-full h-full" />
      {/* Image icon placeholder / Bild-Icon-Platzhalter */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg 
          className="w-12 h-12 text-white/10" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm0 2v10h16V7H4zm4 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm8 5l-3-3-2 2-3-3-4 4h12z" />
        </svg>
      </div>
    </div>
  );
};

// Skeleton for avatars / Skeleton für Avatare
interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({ 
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  return (
    <Skeleton className={`rounded-full ${sizeClasses[size]} ${className}`} />
  );
};

// Skeleton for blog post cards / Skeleton für Blog-Post-Karten
interface SkeletonBlogCardProps {
  className?: string;
  variant?: 'default' | 'featured' | 'compact';
  style?: React.CSSProperties;
}

export const SkeletonBlogCard: React.FC<SkeletonBlogCardProps> = ({ 
  className = '',
  variant = 'default',
  style
}) => {
  if (variant === 'compact') {
    return (
      <div className={`glass-effect rounded-xl p-4 ${className}`} style={style}>
        <div className="flex gap-4">
          <SkeletonImage className="w-24 h-24 flex-shrink-0" aspectRatio="square" />
          <div className="flex-1 min-w-0 py-1">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className={`glass-effect rounded-2xl overflow-hidden ${className}`}>
        <SkeletonImage aspectRatio="video" />
        <div className="p-6">
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-4/5 mb-4" />
          <SkeletonText lines={2} />
          <div className="flex items-center gap-4 mt-6">
            <SkeletonAvatar size="sm" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  // Default variant / Standard-Variante
  return (
    <div className={`glass-effect rounded-2xl overflow-hidden transition-transform duration-300 hover:scale-[1.02] ${className}`}>
      <SkeletonImage aspectRatio="video" />
      <div className="p-6">
        {/* Tags / Tags */}
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-18 rounded-full" />
        </div>
        
        {/* Title / Titel */}
        <Skeleton className="h-7 w-5/6 mb-3" />
        
        {/* Excerpt / Auszug */}
        <SkeletonText lines={2} widths={['100%', '85%']} className="mb-4" />
        
        {/* Meta info / Meta-Info */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <SkeletonAvatar size="sm" />
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
};

// Skeleton for comments / Skeleton für Kommentare
interface SkeletonCommentProps {
  className?: string;
  hasReplies?: boolean;
}

export const SkeletonComment: React.FC<SkeletonCommentProps> = ({ 
  className = '',
  hasReplies = false
}) => (
  <div className={`glass-effect rounded-xl p-6 ${className}`}>
    <div className="flex gap-4">
      <SkeletonAvatar size="lg" />
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <SkeletonText lines={2} widths={['100%', '75%']} />
        <div className="flex gap-4 mt-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        
        {/* Replies / Antworten */}
        {hasReplies && (
          <div className="mt-4 ml-8 space-y-4">
            <div className="flex gap-3">
              <SkeletonAvatar size="md" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Skeleton for stats cards / Skeleton für Statistik-Karten
interface SkeletonStatCardProps {
  className?: string;
}

export const SkeletonStatCard: React.FC<SkeletonStatCardProps> = ({ className = '' }) => (
  <div className={`glass-effect rounded-xl p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-10 rounded-lg" />
    </div>
    <Skeleton className="h-8 w-20 mb-2" />
    <Skeleton className="h-3 w-32" />
  </div>
);

// Loading grid for blog posts / Lade-Raster für Blog-Posts
interface SkeletonBlogGridProps {
  count?: number;
  className?: string;
}

export const SkeletonBlogGrid: React.FC<SkeletonBlogGridProps> = ({ 
  count = 6,
  className = ''
}) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonBlogCard 
        key={i} 
        className="animate-fadeIn"
        style={{ animationDelay: `${i * 0.1}s` } as React.CSSProperties}
      />
    ))}
  </div>
);

// Full page loading skeleton / Ganzseitiges Lade-Skeleton
interface SkeletonPageProps {
  type?: 'blog-list' | 'blog-post' | 'about' | 'contact' | 'home';
}

export const SkeletonPage: React.FC<SkeletonPageProps> = ({ type = 'blog-list' }) => {
  if (type === 'blog-post') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header / Kopfbereich */}
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-3/4 mb-6" />
          <div className="flex items-center gap-4">
            <SkeletonAvatar size="lg" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
        
        {/* Featured Image / Hauptbild */}
        <SkeletonImage aspectRatio="video" className="mb-8" />
        
        {/* Content / Inhalt */}
        <SkeletonText lines={8} className="mb-8" />
        
        {/* Bible verse / Bibelvers */}
        <div className="border-l-4 border-white/20 pl-6 py-4 mb-8">
          <SkeletonText lines={3} />
        </div>
        
        <SkeletonText lines={6} />
      </div>
    );
  }

  // Pasul 121: Contact page skeleton / Kontaktseiten-Skeleton / Schelet pagină contact
  if (type === 'contact') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-40 mx-auto mb-4" />
          <Skeleton className="h-5 w-72 mx-auto" />
        </div>
        <div className="glass-effect rounded-2xl p-8 space-y-6">
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-12 w-40 rounded-xl" />
        </div>
      </div>
    );
  }

  // Pasul 121: About page skeleton / Über-Seiten-Skeleton / Schelet pagină despre
  if (type === 'about') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Skeleton className="h-12 w-48 mx-auto mb-6" />
          <SkeletonText lines={4} className="max-w-2xl mx-auto mb-8" />
        </div>
        <SkeletonImage aspectRatio="video" className="mb-8 max-w-2xl mx-auto" />
        <SkeletonText lines={6} className="max-w-2xl mx-auto mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      </div>
    );
  }

  // Pasul 121: Home page skeleton / Startseiten-Skeleton / Schelet pagină principală
  if (type === 'home') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-4xl mx-auto w-full text-center">
          <SkeletonText lines={3} widths={['90%', '100%', '85%']} className="mb-8" />
          <Skeleton className="h-8 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  // Default blog list / Standard Blog-Liste
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Page header / Seiten-Kopfbereich */}
      <div className="text-center mb-12">
        <Skeleton className="h-10 w-48 mx-auto mb-4" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>
      
      {/* Blog grid / Blog-Raster */}
      <SkeletonBlogGrid count={6} />
    </div>
  );
};

// Export all components / Alle Komponenten exportieren
export default {
  Skeleton,
  SkeletonText,
  SkeletonImage,
  SkeletonAvatar,
  SkeletonBlogCard,
  SkeletonComment,
  SkeletonStatCard,
  SkeletonBlogGrid,
  SkeletonPage
};
