'use client';

// =====================================================================
// Pasul 2208001 — Buton „inapoi sus" / „Back to top" / „Nach oben"
// =====================================================================
// UNDE apare:
//   • Datenschutz, Impressum, citirea unui blog, modul Focus
//   • doar DUPA ce utilizatorul a derulat in jos (implicit 320px)
//
// CUM arata:
//   • MOBIL  -> pe aceeasi linie cu bara de 4 optiuni de jos, in DREAPTA,
//               cu ~25% mai mare decat butonul Reels (tinta buna pentru deget)
//   • DESKTOP -> pur si simplu in dreapta-jos
//
// Animatia este aceeasi ca la butoanele din bara de jos (`animate-heartbeat`)
// plus o intrare lina (fade + urcare).
// =====================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useHaptic } from '@/hooks/useHaptic';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { BackToTopIcon, scrollElementToTop, backToTopLabel } from '@/components/BackToTopShared';

interface BackToTopButtonProps {
  /** Cati pixeli trebuie derulati inainte sa apara butonul */
  threshold?: number;
  /**
   * Elementul derulat. Implicit = fereastra.
   * Modul Focus deruleaza un container propriu, nu pagina.
   */
  scrollTargetRef?: React.RefObject<HTMLElement | null>;
  /** z-index — bara de jos este 210, deci stam putin peste ea */
  zIndex?: number;
}

export default function BackToTopButton({
  threshold = 320,
  scrollTargetRef,
  zIndex = 211,
}: BackToTopButtonProps) {
  const { language } = useLanguage();
  const { tapLight } = useHaptic();
  const { reduced: reduceMotion } = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scrollTargetRef?.current ?? null;

    const read = () =>
      el ? el.scrollTop : window.scrollY || document.documentElement.scrollTop;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setVisible(read() > threshold);
        ticking = false;
      });
    };

    onScroll(); // stare initiala (ex. revenire pe pagina deja derulata)

    const target: HTMLElement | Window = el ?? window;
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => target.removeEventListener('scroll', onScroll);
  }, [threshold, scrollTargetRef]);

  const handleClick = useCallback(() => {
    tapLight();
    // Pasul 2208002 (punctul 16): aceeasi comanda de derulare ca in articol
    scrollElementToTop(scrollTargetRef?.current ?? null);
  }, [scrollTargetRef, tapLight]);

  const label = backToTopLabel(language);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={[
        'fixed rounded-full',
        'flex items-center justify-center',
        'bg-white/80 dark:bg-black/70 backdrop-blur-xl',
        'border border-black/10 dark:border-white/15 shadow-lg',
        'text-black/70 dark:text-white/70',
        'hover:text-black dark:hover:text-white',
        'transition-all duration-300 ease-out',
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-3 pointer-events-none',
        // MOBIL: aceeasi inaltime ca bara de jos, lipit in dreapta
        'right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+18px)]',
        // DESKTOP: dreapta-jos, fara bara de optiuni
        'lg:right-8 lg:bottom-8',
      ].join(' ')}
      style={{
        zIndex,
        // Butonul Reels are iconul de 22px intr-un buton de ~46px.
        // +25% pentru deget -> ~58px, icon ~28px.
        width: '58px',
        height: '58px',
      }}
    >
      {/*
        Pasul 2208002 (punctul 16): iconul vine din `BackToTopShared`, deci
        este EXACT acelasi ca cel din inelul de progres al articolului.
      */}
      <BackToTopIcon size={28} className={reduceMotion ? '' : 'animate-heartbeat'} />
    </button>
  );
}
