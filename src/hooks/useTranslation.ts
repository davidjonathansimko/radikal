// Translation hook using DeepL API / Übersetzungs-Hook mit DeepL API / Hook pentru traducere folosind DeepL API
// This hook provides automatic translation functionality for blog content
// Dieser Hook bietet automatische Übersetzungsfunktionalität für Blog-Inhalte
// Acest hook oferă funcționalitate de traducere automată pentru conținutul blogurilor

'use client';

import { useState, useCallback, useRef } from 'react';

interface TranslationCache {
  [key: string]: string;
}

// ---------------------------------------------------------------------------
// Pasul 2308009 — UN SINGUR cache, comun tuturor paginilor.
//
// Inainte, fiecare componenta avea propriul `useRef`. Cand treceai de pe blog
// pe meniu si inapoi, componenta se re-monta, cache-ul disparea si se cerea din
// nou aceeasi traducere. De aceea vedeai la nesfarsit "DeepL: Translating..."
// in consola. Acum:
//   1. cache-ul sta in afara componentelor → supravietuieste navigarii;
//   2. este salvat in `sessionStorage` → supravietuieste si unui refresh (F5),
//      pana cand inchizi fila.
// Costul la DeepL era deja zero (serverul are cache in Supabase), dar acum nu
// se mai face nici macar cererea catre server.
// ---------------------------------------------------------------------------
const STORE_KEY = 'radikal-translation-cache';
const MAX_ENTRIES = 500;

const sharedCache: TranslationCache = (() => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}') as TranslationCache;
  } catch {
    return {};
  }
})();

let persistTimer: ReturnType<typeof setTimeout> | undefined;
function persistCache() {
  if (typeof window === 'undefined') return;
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      const keys = Object.keys(sharedCache);
      // Nu lasam cache-ul sa creasca la nesfarsit — sessionStorage are limita.
      if (keys.length > MAX_ENTRIES) {
        keys.slice(0, keys.length - MAX_ENTRIES).forEach((k) => delete sharedCache[k]);
      }
      sessionStorage.setItem(STORE_KEY, JSON.stringify(sharedCache));
    } catch {
      /* sessionStorage plin sau blocat — mergem mai departe fara persistenta */
    }
  }, 400);
}

interface UseTranslationReturn {
  translate: (text: string, targetLang: string, sourceLang?: string, autoDetect?: boolean) => Promise<string>;
  translateBatch: (texts: string[], targetLang: string, sourceLang?: string, autoDetect?: boolean) => Promise<string[]>;
  isTranslating: boolean;
  error: string | null;
  clearCache: () => void;
}

export function useTranslation(): UseTranslationReturn {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache to avoid re-translating the same text / Cache um Neu-Übersetzung zu vermeiden / Cache pentru a evita re-traducerea aceluiași text
  const cacheRef = useRef<TranslationCache>(sharedCache);

  // Generate cache key / Cache-Schlüssel generieren / Generează cheia cache
  const getCacheKey = (text: string, targetLang: string, sourceLang: string) => {
    // Use first 100 chars + length for unique but short key / Erste 100 Zeichen + Länge für eindeutigen aber kurzen Schlüssel / Folosește primele 100 caractere + lungime pentru cheie unică dar scurtă
    return `${sourceLang}-${targetLang}-${text.length}-${text.substring(0, 100)}`;
  };

  // Translate single text / Einzelnen Text übersetzen / Traduce un singur text
  const translate = useCallback(async (
    text: string,
    targetLang: string,
    sourceLang: string = 'ro',
    autoDetect: boolean = false
  ): Promise<string> => {
    // Return original if translating to source language (only when not auto-detecting)
    // Original zurückgeben wenn zur Quellsprache übersetzt (nur wenn nicht Auto-Erkennung)
    // Returnează originalul dacă se traduce în limba sursă (doar când nu este auto-detectare)
    if (!autoDetect && targetLang === sourceLang) {
      return text;
    }

    // Skip empty text / Leeren Text überspringen / Sari peste textul gol
    if (!text || text.trim().length === 0) {
      return text;
    }

    // Check cache first / Zuerst Cache prüfen / Verifică întâi cache-ul
    const cacheKey = getCacheKey(text, targetLang, autoDetect ? 'auto' : sourceLang);
    if (cacheRef.current[cacheKey]) {
      console.log('📦 DeepL: Using cached translation');
      return cacheRef.current[cacheKey];
    }

    setIsTranslating(true);
    setError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLang,
          sourceLang: autoDetect ? undefined : sourceLang,
          autoDetect,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Translation failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Store in cache / Im Cache speichern / Stochează în cache
      cacheRef.current[cacheKey] = data.translatedText;
      persistCache();
      
      return data.translatedText;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed';
      setError(errorMessage);
      console.error('❌ DeepL Translation error:', errorMessage);
      return text; // Return original text on error / Bei Fehler Originaltext zurückgeben / Returnează textul original în caz de eroare
    } finally {
      setIsTranslating(false);
    }
  }, []);

  // Translate multiple texts in batch / Mehrere Texte im Batch übersetzen / Traduce mai multe texte în lot
  const translateBatch = useCallback(async (
    texts: string[],
    targetLang: string,
    sourceLang: string = 'ro',
    autoDetect: boolean = false
  ): Promise<string[]> => {
    // Return originals if translating to source language (only when not auto-detecting)
    // Originale zurückgeben wenn zur Quellsprache übersetzt (nur wenn nicht Auto-Erkennung)
    // Returnează originalele dacă se traduce în limba sursă (doar când nu este auto-detectare)
    if (!autoDetect && targetLang === sourceLang) {
      return texts;
    }

    // Skip if no texts / Überspringen wenn keine Texte / Sari peste dacă nu sunt texte
    if (texts.length === 0) {
      return texts;
    }

    setIsTranslating(true);
    setError(null);

    try {
      // Check which texts need translation / Prüfen welche Texte übersetzt werden müssen / Verifică ce texte trebuie traduse
      const uncachedIndices: number[] = [];
      const uncachedTexts: string[] = [];
      const results: string[] = [...texts];

      texts.forEach((text, index) => {
        if (!text || text.trim().length === 0) {
          results[index] = text;
          return;
        }
        
        const cacheKey = getCacheKey(text, targetLang, autoDetect ? 'auto' : sourceLang);
        if (cacheRef.current[cacheKey]) {
          results[index] = cacheRef.current[cacheKey];
        } else {
          uncachedIndices.push(index);
          uncachedTexts.push(text);
        }
      });

      // If all cached, return immediately / Wenn alle gecacht, sofort zurückgeben / Dacă toate sunt în cache, returnează imediat
      if (uncachedTexts.length === 0) {
        console.log('📦 DeepL: All translations from cache');
        setIsTranslating(false);
        return results;
      }

      console.log(`🌐 DeepL: Translating ${uncachedTexts.length} texts to ${targetLang}${autoDetect ? ' (auto-detect source)' : ''}...`);

      // Translate uncached texts / Nicht-gecachte Texte übersetzen / Traduce textele care nu sunt în cache
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: uncachedTexts,
          targetLang,
          sourceLang: autoDetect ? undefined : sourceLang,
          autoDetect,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Batch translation failed: ${response.status}`);
      }

      const data = await response.json();
      const translatedTexts = Array.isArray(data.translatedText) 
        ? data.translatedText 
        : [data.translatedText];

      // Update results and cache / Ergebnisse und Cache aktualisieren / Actualizează rezultatele și cache-ul
      uncachedIndices.forEach((originalIndex, i) => {
        const translated = translatedTexts[i] || texts[originalIndex];
        results[originalIndex] = translated;
        const cacheKey = getCacheKey(texts[originalIndex], targetLang, autoDetect ? 'auto' : sourceLang);
        cacheRef.current[cacheKey] = translated;
      });
      persistCache();

      console.log('✅ DeepL: Batch translation successful');
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch translation failed';
      setError(errorMessage);
      console.error('❌ DeepL Batch translation error:', errorMessage);
      return texts; // Return original texts on error
    } finally {
      setIsTranslating(false);
    }
  }, []);

  // Clear translation cache / Übersetzungs-Cache leeren / Golește cache-ul de traduceri
  const clearCache = useCallback(() => {
    Object.keys(sharedCache).forEach((k) => delete sharedCache[k]);
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      /* ignoram */
    }
    console.log('🗑️ DeepL: Translation cache cleared');
  }, []);

  return {
    translate,
    translateBatch,
    isTranslating,
    error,
    clearCache,
  };
}
