// Lazy Loading Image Component with Intersection Observer / Lazy-Loading-Bildkomponente mit Intersection Observer / Componentă imagine cu încărcare lazy folosind Intersection Observer
// Only loads images when they are about to enter the viewport
// Lädt Bilder nur, wenn sie kurz davor sind, im Viewport zu erscheinen
// Încarcă imaginile doar când sunt pe punctul de a intra în viewport

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';

interface LazyImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  containerClassName?: string;
  threshold?: number; // 0-1, how much of the image needs to be visible
  rootMargin?: string; // e.g., "100px" to start loading 100px before visible
  quality?: number;
  sizes?: string;
  onVisible?: () => void;
  placeholder?: 'blur' | 'empty' | 'skeleton';
}

export default function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  containerClassName = '',
  threshold = 0,
  rootMargin = '200px', // Start loading 200px before visible
  quality = 80,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onVisible,
  placeholder = 'skeleton',
}: LazyImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Use Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          onVisible?.();
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, onVisible]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Calculate aspect ratio for placeholder
  const aspectRatio = `${width}/${height}`;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${containerClassName}`}
      style={{ aspectRatio }}
    >
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0">
          {placeholder === 'skeleton' && (
            <div className="w-full h-full bg-gray-800 animate-pulse" />
          )}
          {placeholder === 'blur' && (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 animate-pulse" />
          )}
          {/* empty placeholder shows nothing */}
        </div>
      )}

      {/* Actual Image - only rendered when visible */}
      {isVisible && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          quality={quality}
          sizes={sizes}
          className={`
            w-full h-auto transition-opacity duration-500
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${className}
          `}
          onLoad={handleLoad}
        />
      )}
    </div>
  );
}

// Progressive Image component - loads low-res first, then high-res
interface ProgressiveImageProps {
  src: string;
  lowResSrc?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function ProgressiveImage({
  src,
  lowResSrc,
  alt,
  width,
  height,
  className = '',
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(lowResSrc || src);
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);

  useEffect(() => {
    if (!lowResSrc) return;

    // Preload high-res image
    const img = new window.Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsHighResLoaded(true);
    };
    img.src = src;
  }, [src, lowResSrc]);

  return (
    <div 
      className="relative overflow-hidden"
      style={{ aspectRatio: `${width}/${height}` }}
    >
      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={`
          w-full h-auto transition-all duration-500
          ${!isHighResLoaded && lowResSrc ? 'blur-sm scale-105' : 'blur-0 scale-100'}
          ${className}
        `}
      />
    </div>
  );
}

// Image Gallery with lazy loading
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    width: number;
    height: number;
  }>;
  columns?: number;
  gap?: number;
}

export function LazyImageGallery({ 
  images, 
  columns = 3, 
  gap = 16 
}: ImageGalleryProps) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {images.map((image, index) => (
        <LazyImage
          key={index}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          containerClassName="rounded-lg"
          className="rounded-lg"
          rootMargin={`${200 + index * 50}px`} // Stagger loading
        />
      ))}
    </div>
  );
}
