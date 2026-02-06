// Image Zoom Modal Component for Mobile
// Bildzoom-Modal-Komponente für Mobil
// Componentă Modal Zoom Imagine pentru Mobil

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';

interface ImageZoomModalProps {
  src: string;
  alt: string;
  children: React.ReactNode;
}

export default function ImageZoomModal({ src, alt, children }: ImageZoomModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const openModal = useCallback(() => {
    setIsOpen(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    document.body.style.overflow = 'hidden';
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = '';
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeModal]);

  // Zoom with pinch gesture
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prevScale) => Math.min(Math.max(prevScale + delta, 0.5), 3));
  }, []);

  // Touch events for pinch zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      startPos.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    }
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - startPos.current.x,
        y: e.touches[0].clientY - startPos.current.y,
      });
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Double tap to zoom
  const lastTap = useRef<number>(0);
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap - toggle zoom
      if (scale > 1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(2);
      }
    }
    lastTap.current = now;
  }, [scale]);

  if (!isOpen) {
    return (
      <div
        onClick={openModal}
        className="cursor-zoom-in touch-manipulation"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && openModal()}
        aria-label={`Zoom: ${alt}`}
      >
        {children}
      </div>
    );
  }

  return (
    <>
      {/* Clickable wrapper for the original image */}
      <div
        onClick={openModal}
        className="cursor-zoom-in touch-manipulation"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && openModal()}
        aria-label={`Zoom: ${alt}`}
      >
        {children}
      </div>

      {/* Modal overlay */}
      <div
        ref={modalRef}
        className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
        onClick={(e) => {
          if (e.target === modalRef.current) {
            closeModal();
          }
        }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        {/* Close button */}
        <button
          onClick={closeModal}
          className="
            absolute top-4 right-4 z-[10000]
            w-12 h-12 
            bg-white/20 hover:bg-white/30
            text-white text-2xl
            rounded-full
            flex items-center justify-center
            transition-colors
            touch-manipulation
          "
          style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
          aria-label="Schließen / Close / Închide"
        >
          ✕
        </button>

        {/* Zoom controls */}
        <div 
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[10000] flex gap-3"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <button
            onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
            className="
              w-12 h-12
              bg-white/20 hover:bg-white/30
              text-white text-xl
              rounded-full
              flex items-center justify-center
              transition-colors
              touch-manipulation
            "
            aria-label="Zoom out"
          >
            ➖
          </button>
          <button
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="
              w-12 h-12
              bg-white/20 hover:bg-white/30
              text-white text-sm
              rounded-full
              flex items-center justify-center
              transition-colors
              touch-manipulation
            "
            aria-label="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={() => setScale((s) => Math.min(s + 0.25, 3))}
            className="
              w-12 h-12
              bg-white/20 hover:bg-white/30
              text-white text-xl
              rounded-full
              flex items-center justify-center
              transition-colors
              touch-manipulation
            "
            aria-label="Zoom in"
          >
            ➕
          </button>
        </div>

        {/* Image */}
        <div
          onClick={handleTap}
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            quality={90}
            priority
          />
        </div>
      </div>
    </>
  );
}
