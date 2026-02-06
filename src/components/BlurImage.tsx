// Blur Image Component / Unschärfe-Bild-Komponente / Componenta Imagine Blur
// Displays images with blur placeholder while loading
// Zeigt Bilder mit Unschärfe-Platzhalter während des Ladens
// Afișează imagini cu placeholder blur în timpul încărcării

'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface BlurImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

// Generate a simple blur data URL / Einfache Unschärfe-Daten-URL generieren / Generează URL date blur simplu
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

const blurDataURL = `data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`;

export default function BlurImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  sizes,
  quality = 85,
  objectFit = 'cover'
}: BlurImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Fallback image for errors
  const fallbackSrc = '/images/placeholder.jpg';

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  if (fill) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={hasError ? fallbackSrc : src}
          alt={alt}
          fill
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          quality={quality}
          priority={priority}
          placeholder="blur"
          blurDataURL={blurDataURL}
          className={`
            object-${objectFit}
            duration-700 ease-in-out
            ${isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'}
          `}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={hasError ? fallbackSrc : src}
        alt={alt}
        width={width || 800}
        height={height || 600}
        quality={quality}
        priority={priority}
        placeholder="blur"
        blurDataURL={blurDataURL}
        className={`
          duration-700 ease-in-out
          ${isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'}
        `}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

// Avatar with blur loading / Avatar mit Unschärfe-Laden / Avatar cu încărcare blur
export function BlurAvatar({
  src,
  alt,
  size = 40,
  className = ''
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div 
      className={`relative overflow-hidden rounded-full bg-gray-200 dark:bg-white/10 ${className}`}
      style={{ width: size, height: size }}
    >
      {!hasError ? (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className={`
            rounded-full object-cover
            duration-500 ease-in-out
            ${isLoading ? 'opacity-0' : 'opacity-100'}
          `}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-white/40 font-bold">
          {alt.charAt(0).toUpperCase()}
        </div>
      )}
      
      {isLoading && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gray-300 dark:bg-white/20 rounded-full" />
      )}
    </div>
  );
}

// Hero image with parallax blur effect / Hero-Bild mit Parallax-Unschärfe-Effekt / Imagine hero cu efect blur parallax
export function HeroImage({
  src,
  alt,
  overlay = true,
  className = ''
}: {
  src: string;
  alt: string;
  overlay?: boolean;
  className?: string;
}) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority
        quality={90}
        sizes="100vw"
        placeholder="blur"
        blurDataURL={blurDataURL}
        className={`
          object-cover
          duration-1000 ease-out
          ${isLoading ? 'scale-105 blur-lg' : 'scale-100 blur-0'}
        `}
        onLoad={() => setIsLoading(false)}
      />
      
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      )}
    </div>
  );
}
