// Pasul 21082026 — Preferinta pentru animatii reduse
//
// IMPORTANT: acesta NU strica si NU dezactiveaza nimic implicit.
// Standardul aplicatiei ramane EXACT cum este: toate animatiile GSAP,
// heartbeat, tranzitiile etc. raman pornite pentru toata lumea.
//
// Doar daca utilizatorul alege EXPLICIT din setari "Animatii reduse",
// componentele care verifica acest hook vor sari peste animatii.
//
// Valori posibile:
//   'system' (implicit) -> respecta setarea aplicatiei = animatii complete
//   'reduced'           -> utilizatorul a cerut animatii reduse
//   'full'              -> utilizatorul cere explicit animatii complete

'use client';

import { useCallback, useEffect, useState } from 'react';

export type MotionPreference = 'system' | 'reduced' | 'full';

export const MOTION_PREF_KEY = 'radikalMotionPreference';
const CHANGE_EVENT = 'radikal-motion-preference-change';

/** Citire sincrona, sigura pe server */
export function getMotionPreference(): MotionPreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const v = localStorage.getItem(MOTION_PREF_KEY);
    if (v === 'reduced' || v === 'full' || v === 'system') return v;
  } catch {
    /* ignore */
  }
  return 'system';
}

/** Trebuie sa reducem animatiile chiar acum? */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  const pref = getMotionPreference();

  // Alegerea explicita a utilizatorului are prioritate
  if (pref === 'reduced') return true;
  if (pref === 'full') return false;

  // 'system': respectam setarea sistemului de operare.
  // Daca utilizatorul nu a cerut nimic special, animatiile raman complete.
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function setMotionPreference(pref: MotionPreference): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MOTION_PREF_KEY, pref);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* ignore */
  }
}

export function useReducedMotion() {
  // Pornim cu `false` ca sa nu apara diferente intre server si client
  const [reduced, setReduced] = useState(false);
  const [preference, setPreferenceState] = useState<MotionPreference>('system');

  const sync = useCallback(() => {
    setReduced(shouldReduceMotion());
    setPreferenceState(getMotionPreference());
  }, []);

  useEffect(() => {
    sync();

    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);

    let mq: MediaQueryList | null = null;
    try {
      mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', sync);
    } catch {
      /* ignore */
    }

    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
      mq?.removeEventListener('change', sync);
    };
  }, [sync]);

  const update = useCallback(
    (pref: MotionPreference) => {
      setMotionPreference(pref);
      sync();
    },
    [sync]
  );

  return { reduced, preference, setPreference: update };
}

export default useReducedMotion;
