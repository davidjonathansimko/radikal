// Keyboard Shortcuts Hook / Tastenkürzel-Hook / Hook Comenzi Rapide Tastatură
// Global keyboard shortcuts for better navigation and accessibility
// Globale Tastenkürzel für bessere Navigation und Barrierefreiheit
// Comenzi rapide globale de tastatură pentru navigare și accesibilitate mai bune

'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Shortcut configuration / Tastenkürzel-Konfiguration
interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: {
    de: string;
    en: string;
    ro: string;
    ru: string;
  };
  action: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  onSearch?: () => void;
  onNavigateHome?: () => void;
  onNavigateBlogs?: () => void;
  onNavigateBookmarks?: () => void;
  onToggleTheme?: () => void;
  language?: string;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const {
    enabled = true,
    onSearch,
    onNavigateHome,
    onNavigateBlogs,
    onNavigateBookmarks,
    onToggleTheme
  } = options;

  const router = useRouter();

  // Handle keyboard shortcuts / Tastenkürzel behandeln
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                         target.tagName === 'TEXTAREA' || 
                         target.isContentEditable;

    if (isInputField) return;

    // Ctrl/Cmd + K - Open search / Suche öffnen
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      onSearch?.();
      return;
    }

    // Ctrl/Cmd + / - Toggle keyboard shortcuts help
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      event.preventDefault();
      // Could open shortcuts modal
      return;
    }

    // G then H - Go Home / Zur Startseite
    // G then B - Go to Blogs / Zu Blogs
    // G then S - Go to Bookmarks/Saved / Zu Lesezeichen

    // Escape - Close any open modal
    if (event.key === 'Escape') {
      // Handle escape
      return;
    }

    // Alt + T - Toggle theme / Thema umschalten
    if (event.altKey && event.key === 't') {
      event.preventDefault();
      onToggleTheme?.();
      return;
    }

    // Alt + H - Go home / Zur Startseite
    if (event.altKey && event.key === 'h') {
      event.preventDefault();
      onNavigateHome?.() || router.push('/');
      return;
    }

    // Alt + B - Go to blogs / Zu Blogs
    if (event.altKey && event.key === 'b') {
      event.preventDefault();
      onNavigateBlogs?.() || router.push('/blogs');
      return;
    }

    // Alt + S - Go to saved/bookmarks / Zu Lesezeichen
    if (event.altKey && event.key === 's') {
      event.preventDefault();
      onNavigateBookmarks?.() || router.push('/bookmarks');
      return;
    }

    // Arrow keys for scroll navigation
    // J - Scroll down / Nach unten scrollen
    if (event.key === 'j') {
      window.scrollBy({ top: 100, behavior: 'smooth' });
      return;
    }

    // K - Scroll up / Nach oben scrollen
    if (event.key === 'k') {
      window.scrollBy({ top: -100, behavior: 'smooth' });
      return;
    }

    // Space - Page down (let browser handle this naturally)
    // Shift + Space - Page up (let browser handle this naturally)

    // Home - Scroll to top / Nach oben scrollen
    if (event.key === 'Home' && !event.ctrlKey) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // End - Scroll to bottom / Nach unten scrollen
    if (event.key === 'End' && !event.ctrlKey) {
      event.preventDefault();
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }
  }, [onSearch, onToggleTheme, onNavigateHome, onNavigateBlogs, onNavigateBookmarks, router]);

  // Add event listener / Event-Listener hinzufügen
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  // Return available shortcuts for help display
  const shortcuts = [
    { keys: 'Ctrl+K', de: 'Suche öffnen', en: 'Open search', ro: 'Deschide căutare', ru: 'Открыть поиск' },
    { keys: 'Alt+H', de: 'Zur Startseite', en: 'Go home', ro: 'Acasă', ru: 'На главную' },
    { keys: 'Alt+B', de: 'Zu Blogs', en: 'Go to blogs', ro: 'La bloguri', ru: 'К блогам' },
    { keys: 'Alt+S', de: 'Zu Lesezeichen', en: 'Go to bookmarks', ro: 'La bookmark-uri', ru: 'К закладкам' },
    { keys: 'Alt+T', de: 'Thema wechseln', en: 'Toggle theme', ro: 'Schimbă tema', ru: 'Сменить тему' },
    { keys: 'J', de: 'Nach unten scrollen', en: 'Scroll down', ro: 'Derulează în jos', ru: 'Прокрутка вниз' },
    { keys: 'K', de: 'Nach oben scrollen', en: 'Scroll up', ro: 'Derulează în sus', ru: 'Прокрутка вверх' },
    { keys: 'Home', de: 'Zum Anfang', en: 'Go to top', ro: 'La început', ru: 'В начало' },
    { keys: 'End', de: 'Zum Ende', en: 'Go to bottom', ro: 'La sfârșit', ru: 'В конец' },
  ];

  return { shortcuts };
}

export default useKeyboardShortcuts;
