// Optimized Image Component with blur loading and error handling / Optimierte Bildkomponente mit Blur-Loading und Fehlerbehandlung / Componentă imagine optimizată cu încărcare blur și gestionare erori
// Uses Next.js Image component with enhanced features for better performance
// Verwendet Next.js Image-Komponente mit erweiterten Funktionen für bessere Leistung
// Folosește componenta Next.js Image cu funcții îmbunătățite pentru performanță mai bună

'use client';

import Image from 'next/image';
import { useState, useCallback } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  sizes?: string;
  quality?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  aspectRatio?: string; // e.g., "16/9", "4/3", "1/1"
  showLoadingSpinner?: boolean;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Blur placeholder (1x1 gray pixel base64)
const BLUR_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABBEFITEGEjJBUf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AlgBDtv/Z';

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className = '',
  containerClassName = '',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  quality = 80,
  objectFit = 'cover',
  aspectRatio,
  showLoadingSpinner = false,
  fallbackSrc = '/placeholder-image.jpg',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    
    // Try fallback image
    if (currentSrc !== fallbackSrc && fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    }
    
    onError?.();
  }, [currentSrc, fallbackSrc, onError]);

  // Error state display
  if (hasError && currentSrc === fallbackSrc) {
    return (
      <div 
        className={`bg-gray-800 flex items-center justify-center ${containerClassName}`}
        style={aspectRatio ? { aspectRatio } : { width, height }}
      >
        <div className="text-center text-gray-500">
          <svg 
            className="w-12 h-12 mx-auto mb-2 opacity-50" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <span className="text-sm">Bild nicht verfügbar</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden ${containerClassName}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Loading spinner */}
      {showLoadingSpinner && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <Image
        src={currentSrc}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        priority={priority}
        sizes={sizes}
        quality={quality}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        className={`
          transition-all duration-700 ease-in-out
          ${isLoading ? 'scale-105 blur-lg opacity-50' : 'scale-100 blur-0 opacity-100'}
          ${fill ? `object-${objectFit}` : ''}
          ${className}
        `}
        style={!fill ? { objectFit } : undefined}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

// Preset configurations for common use cases
export const ImagePresets = {
  hero: {
    sizes: '100vw',
    priority: true,
    aspectRatio: '16/9',
  },
  blogCard: {
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    aspectRatio: '16/9',
  },
  thumbnail: {
    sizes: '(max-width: 640px) 33vw, 100px',
    aspectRatio: '1/1',
  },
  avatar: {
    sizes: '48px',
    aspectRatio: '1/1',
    objectFit: 'cover' as const,
  },
};
