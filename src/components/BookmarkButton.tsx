// Bookmark Button Component / Lesezeichen-Button-Komponente / Componenta Buton Bookmark
// Animated bookmark button with save/unsave functionality
// Animierter Lesezeichen-Button mit Speichern/Entfernen-Funktionalität
// Buton bookmark animat cu funcționalitate de salvare/eliminare

'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useBookmarks } from '@/hooks/useBookmarks';
import { FaBookmark, FaRegBookmark, FaSpinner } from 'react-icons/fa';

// Translations / Übersetzungen
const translations = {
  de: {
    save: 'Speichern',
    saved: 'Gespeichert',
    saving: 'Speichere...',
    loginRequired: 'Bitte anmelden zum Speichern',
    addedToBookmarks: 'Zu Lesezeichen hinzugefügt',
    removedFromBookmarks: 'Von Lesezeichen entfernt'
  },
  en: {
    save: 'Save',
    saved: 'Saved',
    saving: 'Saving...',
    loginRequired: 'Please login to save',
    addedToBookmarks: 'Added to bookmarks',
    removedFromBookmarks: 'Removed from bookmarks'
  },
  ro: {
    save: 'Salvează',
    saved: 'Salvat',
    saving: 'Se salvează...',
    loginRequired: 'Te rugăm să te autentifici pentru a salva',
    addedToBookmarks: 'Adăugat la bookmark-uri',
    removedFromBookmarks: 'Eliminat din bookmark-uri'
  },
  ru: {
    save: 'Сохранить',
    saved: 'Сохранено',
    saving: 'Сохранение...',
    loginRequired: 'Войдите чтобы сохранить',
    addedToBookmarks: 'Добавлено в закладки',
    removedFromBookmarks: 'Удалено из закладок'
  }
};

interface BookmarkButtonProps {
  postId: string;
  // Visual variants / Visuelle Varianten
  variant?: 'icon' | 'button' | 'text';
  // Size options / Größenoptionen
  size?: 'sm' | 'md' | 'lg';
  // Show tooltip / Tooltip anzeigen
  showTooltip?: boolean;
  // Custom class / Benutzerdefinierte Klasse
  className?: string;
  // Callback after toggle / Callback nach Umschalten
  onToggle?: (isBookmarked: boolean) => void;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  postId,
  variant = 'icon',
  size = 'md',
  showTooltip = true,
  className = '',
  onToggle
}) => {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.de;
  const { isBookmarked, toggleBookmark, loading: bookmarksLoading } = useBookmarks();
  
  // Local state / Lokaler Status
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Check if post is bookmarked / Prüfen, ob Post als Lesezeichen gespeichert ist
  const saved = isBookmarked(postId);

  // Size classes / Größenklassen
  const sizeClasses = {
    sm: 'text-sm p-1.5',
    md: 'text-base p-2',
    lg: 'text-lg p-2.5'
  };

  const iconSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  // Handle click / Klick behandeln
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading || bookmarksLoading) return;

    setIsLoading(true);
    const success = await toggleBookmark(postId);
    setIsLoading(false);

    if (success) {
      const newState = !saved;
      setFeedbackMessage(newState ? t.addedToBookmarks : t.removedFromBookmarks);
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 2000);
      onToggle?.(newState);
    }
  };

  // Render based on variant / Basierend auf Variante rendern
  if (variant === 'text') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading || bookmarksLoading}
        className={`flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-200 ${className}`}
      >
        {isLoading ? (
          <FaSpinner className="animate-spin" />
        ) : saved ? (
          <FaBookmark className="text-blue-400" />
        ) : (
          <FaRegBookmark />
        )}
        <span>{saved ? t.saved : t.save}</span>
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <div className="relative inline-block">
        <button
          onClick={handleClick}
          disabled={isLoading || bookmarksLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
            saved 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
              : 'bg-white/10 text-white/80 hover:bg-white/20 border border-transparent'
          } ${className}`}
        >
          {isLoading ? (
            <FaSpinner className="animate-spin" />
          ) : saved ? (
            <FaBookmark />
          ) : (
            <FaRegBookmark />
          )}
          <span className="text-sm font-medium">{saved ? t.saved : t.save}</span>
        </button>

        {/* Feedback tooltip / Feedback-Tooltip */}
        {showFeedback && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm font-medium animate-fadeIn shadow-lg">
            {feedbackMessage}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rotate-45" />
          </div>
        )}
      </div>
    );
  }

  // Icon variant (default) / Icon-Variante (Standard)
  return (
    <div className="relative inline-block group">
      <button
        onClick={handleClick}
        disabled={isLoading || bookmarksLoading}
        className={`rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${sizeClasses[size]} ${
          saved 
            ? 'bg-blue-500/20 text-blue-400' 
            : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
        } ${className}`}
        aria-label={saved ? t.saved : t.save}
      >
        {isLoading ? (
          <FaSpinner className={`animate-spin ${iconSizes[size]}`} />
        ) : saved ? (
          <FaBookmark className={`${iconSizes[size]} transition-all duration-300`} />
        ) : (
          <FaRegBookmark className={`${iconSizes[size]} transition-all duration-300`} />
        )}
      </button>

      {/* Tooltip / Tooltip */}
      {showTooltip && !showFeedback && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded bg-black/80 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          {saved ? t.saved : t.save}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 rotate-45" />
        </div>
      )}

      {/* Feedback tooltip / Feedback-Tooltip */}
      {showFeedback && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium animate-fadeIn shadow-lg">
          {feedbackMessage}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rotate-45" />
        </div>
      )}

      {/* Ripple effect on save / Welleneffekt beim Speichern */}
      {saved && (
        <span className="absolute inset-0 rounded-full animate-ping bg-blue-400/20 pointer-events-none" />
      )}
    </div>
  );
};

export default BookmarkButton;
