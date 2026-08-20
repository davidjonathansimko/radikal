// Guest mode hook / Gast-Modus Hook / Hook pentru modul vizitator
//
// Vizitatorul (guest) a ales "Continuă ca vizitator" in WelcomeModal.
// RESTRICTII:
//   ❌ NU vede comentariile
//   ❌ NU poate scrie comentarii
//   ❌ NU are acces la notificarile de blog / newsletter
//   ✅ POATE da like
//   ✅ POATE folosi emoji / reactii
//
// Modul vizitator este salvat DOAR in sessionStorage, deci dispare cand
// utilizatorul inchide browserul. Asa nu poate ocoli permanent inregistrarea.

'use client';

import { useEffect, useState, useCallback } from 'react';

export const GUEST_MODE_KEY = 'radikalGuestMode';

/** Citire sincrona, sigura pe server (SSR) / Safe synchronous read */
export function isGuestMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(GUEST_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Iesire din modul vizitator (ex. dupa login) / Leave guest mode */
export function clearGuestMode(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(GUEST_MODE_KEY);
    window.dispatchEvent(new Event('radikal-guest-mode-change'));
  } catch {
    /* ignore */
  }
}

export function useGuestMode() {
  // Pornim mereu cu `false` ca sa nu existe hydration mismatch intre
  // server si client. Valoarea reala se seteaza imediat dupa montare.
  const [isGuest, setIsGuest] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const sync = useCallback(() => {
    setIsGuest(isGuestMode());
  }, []);

  useEffect(() => {
    sync();
    setIsReady(true);

    window.addEventListener('radikal-guest-mode-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('radikal-guest-mode-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, [sync]);

  return {
    /** true daca utilizatorul navigheaza ca vizitator */
    isGuest,
    /** true dupa ce valoarea a fost citita din sessionStorage */
    isReady,
    /** vizitatorul NU are voie sa vada sau sa scrie comentarii */
    canUseComments: !isGuest,
    /** vizitatorul NU are voie sa se aboneze la notificari de blog */
    canUseNotifications: !isGuest,
    /** vizitatorul ARE voie sa dea like */
    canLike: true,
    /** vizitatorul ARE voie sa foloseasca emoji / reactii */
    canUseEmoji: true,
    clearGuestMode,
  };
}

export default useGuestMode;
