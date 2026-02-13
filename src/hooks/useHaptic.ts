// Haptic Feedback Hook / Haptisches Feedback Hook / Hook Feedback Haptic
// Provides vibration feedback on mobile devices for better UX
// Bietet Vibrationsfeedback auf Mobilgeräten für bessere UX
// Oferă feedback prin vibrație pe dispozitive mobile pentru UX mai bun

'use client';

import { useCallback } from 'react';

// Vibration patterns for different interactions / Vibrationsmuster für verschiedene Interaktionen / Modele de vibrație pentru diferite interacțiuni
type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection';

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,           // Subtle tap — for button presses / Subtiler Tipp — für Tastendruck / Atingere subtilă — pentru apăsări de butoane
  medium: 25,          // Medium tap — for toggles / Mittlerer Tipp — für Umschalter / Atingere medie — pentru comutatoare
  heavy: 50,           // Strong tap — for important actions / Starker Tipp — für wichtige Aktionen / Atingere puternică — pentru acțiuni importante
  success: [10, 50, 30], // Success pattern — for likes, bookmarks / Erfolgsmuster — für Likes, Lesezeichen / Model succes — pentru like-uri, semne de carte
  error: [50, 30, 50, 30, 50], // Error pattern — triple vibration / Fehlermuster — dreifache Vibration / Model eroare — vibrație triplă
  warning: [30, 50, 30], // Warning pattern / Warnungsmuster / Model avertizare
  selection: 5,        // Very subtle — for selections / Sehr subtil — für Auswahl / Foarte subtil — pentru selecții
};

export function useHaptic() {
  // Check if Vibration API is supported / Überprüfe ob Vibrations-API unterstützt wird / Verifică dacă API-ul Vibration este suportat
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  // Trigger haptic feedback / Haptisches Feedback auslösen / Declanșează feedback haptic
  const vibrate = useCallback((pattern: HapticPattern = 'light') => {
    if (!isSupported) return;
    
    try {
      navigator.vibrate(HAPTIC_PATTERNS[pattern]);
    } catch {
      // Silently fail if vibration is not allowed / Leise fehlschlagen wenn Vibration nicht erlaubt / Eșuează silențios dacă vibrația nu este permisă
    }
  }, [isSupported]);

  // Convenience methods / Komfortmethoden / Metode de convenință
  const tapLight = useCallback(() => vibrate('light'), [vibrate]);
  const tapMedium = useCallback(() => vibrate('medium'), [vibrate]);
  const tapHeavy = useCallback(() => vibrate('heavy'), [vibrate]);
  const tapSuccess = useCallback(() => vibrate('success'), [vibrate]);
  const tapError = useCallback(() => vibrate('error'), [vibrate]);
  const tapWarning = useCallback(() => vibrate('warning'), [vibrate]);
  const tapSelection = useCallback(() => vibrate('selection'), [vibrate]);

  return {
    isSupported,
    vibrate,
    tapLight,
    tapMedium,
    tapHeavy,
    tapSuccess,
    tapError,
    tapWarning,
    tapSelection,
  };
}

export default useHaptic;
