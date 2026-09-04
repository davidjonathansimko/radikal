'use client';

/**
 * Pasul 0409a — CIORNA FORMULARULUI.
 *
 * Pe telefon, cat timp esti in galerie sau in alta aplicatie, Android poate
 * inchide pagina ca sa faca loc. La intoarcere, tot ce scrisesei era pierdut.
 *
 * Aici tinem minte formularul in memoria telefonului si, la intoarcere, te
 * intrebam frumos daca vrei sa continui de unde ai ramas. Nu punem nimic
 * inapoi fara sa stii.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface Draft<T> {
  saved: T | null;
  restore: () => void;
  dismiss: () => void;
  clear: () => void;
}

export function useFormDraft<T extends Record<string, unknown>>(
  key: string,
  values: T,
  apply: (saved: T) => void,
  /** Cat timp e fals, nu salvam nimic (de exemplu cand modifici ceva existent). */
  enabled = true,
): Draft<T> {
  const [saved, setSaved] = useState<T | null>(null);
  const applyRef = useRef(apply);
  applyRef.current = apply;

  // Citim o singura data, la deschidere.
  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) setSaved(JSON.parse(raw) as T);
    } catch {
      /* ciorna stricata — o lasam balta */
    }
  }, [key, enabled]);

  // Scriem la fiecare schimbare, dar nu mai des decat o data la jumatate de secunda.
  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(values));
      } catch {
        /* memoria plina — nu oprim scrisul din cauza asta */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [key, values, enabled]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* nu conteaza */
    }
    setSaved(null);
  }, [key]);

  const restore = useCallback(() => {
    if (saved) applyRef.current(saved);
    setSaved(null);
  }, [saved]);

  const dismiss = useCallback(() => clear(), [clear]);

  return { saved, restore, dismiss, clear };
}
