// Skeleton Loading Components for CLS Prevention / Skeleton-Ladekomponenten zur CLS-Vermeidung / Componente Skeleton pentru prevenirea CLS
// These components show placeholder content while real content is loading
// Diese Komponenten zeigen Platzhalterinhalte während der echte Inhalt geladen wird
// Aceste componente afișează conținut placeholder în timp ce conținutul real se încarcă

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Base Skeleton Component
 */
export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gray-700 dark:bg-gray-700 light:bg-gray-300';
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
      role="presentation"
    />
  );
}

/**
 * Blog Card Skeleton - matches BlogCard layout
 */
export function BlogCardSkeleton() {
  return (
    <div className="bg-gray-800 dark:bg-gray-800 light:bg-white rounded-lg overflow-hidden shadow-lg">
      {/* Image placeholder with fixed aspect ratio to prevent CLS */}
      <div className="aspect-video">
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <Skeleton width="30%" height={16} className="rounded" />
        
        {/* Title */}
        <Skeleton width="90%" height={24} />
        <Skeleton width="70%" height={24} />
        
        {/* Description */}
        <div className="space-y-2 mt-4">
          <Skeleton width="100%" />
          <Skeleton width="85%" />
          <Skeleton width="60%" />
        </div>
        
        {/* Meta info */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-700">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton width="40%" height={14} />
          <Skeleton width="20%" height={14} className="ml-auto" />
        </div>
      </div>
    </div>
  );
}

/**
 * Blog List Skeleton - shows multiple blog card skeletons
 */
export function BlogListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <BlogCardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Blog Post Content Skeleton
 */
export function BlogPostSkeleton() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Image */}
      <div className="aspect-video mb-8 rounded-lg overflow-hidden">
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </div>
      
      {/* Title */}
      <Skeleton width="80%" height={48} className="mb-4" />
      <Skeleton width="60%" height={48} className="mb-6" />
      
      {/* Meta */}
      <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-700">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="space-y-2">
          <Skeleton width={120} height={16} />
          <Skeleton width={180} height={14} />
        </div>
      </div>
      
      {/* Content paragraphs */}
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton width="100%" />
            <Skeleton width="95%" />
            <Skeleton width="88%" />
            <Skeleton width="92%" />
            <Skeleton width="70%" />
          </div>
        ))}
      </div>
    </article>
  );
}

/**
 * Navigation Skeleton
 */
export function NavigationSkeleton() {
  return (
    <nav className="h-16 bg-gray-900 border-b border-gray-800 px-4">
      <div className="max-w-6xl mx-auto h-full flex items-center justify-between">
        <Skeleton width={120} height={32} className="rounded" />
        <div className="hidden md:flex items-center gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width={80} height={20} />
          ))}
        </div>
        <Skeleton variant="circular" width={40} height={40} />
      </div>
    </nav>
  );
}

/**
 * Comment Skeleton
 */
export function CommentSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-1">
          <Skeleton width={120} height={16} />
          <Skeleton width={80} height={12} />
        </div>
      </div>
      <div className="space-y-2 pl-[52px]">
        <Skeleton width="100%" />
        <Skeleton width="85%" />
        <Skeleton width="60%" />
      </div>
    </div>
  );
}

/**
 * Comments List Skeleton
 */
export function CommentsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <CommentSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Sidebar Skeleton
 */
export function SidebarSkeleton() {
  return (
    <aside className="space-y-6">
      {/* Newsletter Box */}
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <Skeleton width="60%" height={24} />
        <Skeleton width="100%" />
        <Skeleton width="80%" />
        <Skeleton width="100%" height={40} className="mt-4" />
        <Skeleton width="100%" height={44} className="rounded-lg" />
      </div>
      
      {/* Popular Posts */}
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <Skeleton width="50%" height={24} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton width={80} height={60} className="rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton width="100%" />
              <Skeleton width="60%" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

/**
 * Table Skeleton
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width={`${100 / columns}%`} height={20} />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-gray-700 last:border-b-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} width={`${100 / columns}%`} height={16} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Profile Card Skeleton
 */
export function ProfileCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-6 text-center">
      <Skeleton variant="circular" width={96} height={96} className="mx-auto mb-4" />
      <Skeleton width="60%" height={24} className="mx-auto mb-2" />
      <Skeleton width="40%" height={16} className="mx-auto mb-4" />
      <div className="space-y-2">
        <Skeleton width="80%" className="mx-auto" />
        <Skeleton width="70%" className="mx-auto" />
      </div>
      <div className="flex justify-center gap-4 mt-6">
        <Skeleton width={100} height={36} className="rounded-lg" />
        <Skeleton width={100} height={36} className="rounded-lg" />
      </div>
    </div>
  );
}

// Add shimmer animation to globals.css
// @keyframes shimmer {
//   0% { background-position: -200% 0; }
//   100% { background-position: 200% 0; }
// }
// .animate-shimmer {
//   background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
//   background-size: 200% 100%;
//   animation: shimmer 1.5s infinite;
// }
