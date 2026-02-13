// Bottom Sheet Modal Component / Bottom-Sheet-Modal-Komponente / Componentă Modal Bottom Sheet
// Pull-up bottom sheet with drag-to-dismiss gesture (Google Maps / iOS style)
// Pull-up Bottom Sheet mit Drag-to-Dismiss Geste (Google Maps / iOS Stil)
// Bottom sheet cu gest de tragere pentru închidere (stil Google Maps / iOS)

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];      // Heights as percentages / Höhen als Prozentsätze / Înălțimi ca procente
  initialSnap?: number;        // Index of initial snap point / Index des ersten Einrastpunkts / Indexul punctului de fixare inițial
  showHandle?: boolean;        // Show drag handle / Ziehgriff anzeigen / Arată mânerul de tragere
  showOverlay?: boolean;       // Show backdrop overlay / Hintergrund-Overlay anzeigen / Arată suprapunerea de fundal
  className?: string;
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [50, 90],
  initialSnap = 0,
  showHandle = true,
  showOverlay = true,
  className = '',
}: BottomSheetProps) {
  const [currentHeight, setCurrentHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const velocityRef = useRef(0);
  const lastMoveTime = useRef(0);
  const lastMoveY = useRef(0);

  // Mount state for portal / Mount-Status für Portal / Stare montare pentru portal
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Open/close animation / Öffnen/Schließen Animation / Animație deschidere/închidere
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      // Animate to initial snap point / Zum anfänglichen Einrastpunkt animieren / Animează la punctul de fixare inițial
      requestAnimationFrame(() => {
        setCurrentHeight(snapPoints[initialSnap]);
      });
      // Prevent body scroll / Body-Scroll verhindern / Previne scroll-ul body-ului
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, snapPoints, initialSnap]);

  // Close with animation / Mit Animation schließen / Închide cu animație
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setCurrentHeight(0);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  }, [onClose]);

  // Find nearest snap point / Nächsten Einrastpunkt finden / Găsește cel mai apropiat punct de fixare
  const findNearestSnap = useCallback((height: number): number => {
    // If dragging down fast or below 20%, close
    if (height < 15 || velocityRef.current > 800) {
      return 0;
    }
    
    // Find closest snap point
    let closest = snapPoints[0];
    let minDist = Math.abs(height - snapPoints[0]);
    
    for (const snap of snapPoints) {
      const dist = Math.abs(height - snap);
      if (dist < minDist) {
        minDist = dist;
        closest = snap;
      }
    }
    
    return closest;
  }, [snapPoints]);

  // Touch handlers for drag gesture / Touch-Handler für Zieh-Geste / Handlere touch pentru gestul de tragere
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragStartY.current = touch.clientY;
    dragStartHeight.current = currentHeight;
    lastMoveTime.current = Date.now();
    lastMoveY.current = touch.clientY;
    velocityRef.current = 0;
    setIsDragging(true);
  }, [currentHeight]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaY = dragStartY.current - touch.clientY;
    const viewportHeight = window.innerHeight;
    const deltaPercent = (deltaY / viewportHeight) * 100;
    const newHeight = Math.max(0, Math.min(95, dragStartHeight.current + deltaPercent));
    
    // Calculate velocity / Geschwindigkeit berechnen / Calculează viteza
    const now = Date.now();
    const timeDelta = now - lastMoveTime.current;
    if (timeDelta > 0) {
      const moveDelta = touch.clientY - lastMoveY.current;
      velocityRef.current = Math.abs(moveDelta / timeDelta) * 1000;
    }
    lastMoveTime.current = now;
    lastMoveY.current = touch.clientY;
    
    setCurrentHeight(newHeight);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const nearestSnap = findNearestSnap(currentHeight);
    
    if (nearestSnap === 0) {
      handleClose();
    } else {
      setCurrentHeight(nearestSnap);
    }
    
    velocityRef.current = 0;
  }, [isDragging, currentHeight, findNearestSnap, handleClose]);

  // Handle backdrop click / Hintergrund-Klick verarbeiten / Gestionează click pe fundal
  const handleOverlayClick = useCallback(() => {
    handleClose();
  }, [handleClose]);

  // ESC key to close / ESC-Taste zum Schließen / Tasta ESC pentru închidere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isMounted || (!isOpen && !isClosing)) return null;

  const sheetContent = (
    <div className="fixed inset-0 z-[999]" role="dialog" aria-modal="true">
      {/* Backdrop overlay / Hintergrund-Overlay / Suprapunere fundal */}
      {showOverlay && (
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            isOpen && !isClosing ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}
      
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl ${
          !isDragging ? 'transition-all duration-300 ease-out' : ''
        } ${className}`}
        style={{
          height: `${currentHeight}vh`,
          maxHeight: '95vh',
          touchAction: 'none',
        }}
      >
        {/* Drag handle area / Ziehgriff-Bereich / Zona mânerului de tragere */}
        <div 
          className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Handle bar / Griff-Leiste / Bară mâner */}
          {showHandle && (
            <div className="w-12 h-1.5 bg-black/20 dark:bg-white/30 rounded-full mb-2" />
          )}
          
          {/* Title / Titel / Titlu */}
          {title && (
            <h3 className="text-lg font-bold text-black dark:text-white px-6 w-full text-center">
              {title}
            </h3>
          )}
        </div>
        
        {/* Scrollable content / Scrollbarer Inhalt / Conținut derulabil */}
        <div 
          className="overflow-y-auto px-6 pb-8"
          style={{ 
            height: `calc(100% - ${title ? '72px' : '28px'})`,
            overscrollBehavior: 'contain',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  // Render in portal for proper z-index stacking / In Portal rendern für korrektes Z-Index-Stacking / Randează în portal pentru stivuire corectă z-index
  return createPortal(sheetContent, document.body);
}
