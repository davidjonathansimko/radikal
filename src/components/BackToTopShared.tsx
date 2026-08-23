'use client';

// =====================================================================
// Pasul 2208002 (punctul 16) — UN SINGUR „înapoi sus" pentru tot site-ul
// =====================================================================
// Pana acum existau doua mecanisme diferite:
//   • `BackToTopButton`          — pagini simple (Impressum, Datenschutz)
//   • `CircularReadingProgress`  — in articol, cu inelul de progres
//
// Nu le-am contopit intr-unul singur, pentru ca fac lucruri diferite:
// inelul de progres ARATA cat ai citit, ceea ce este util doar in articol.
// In schimb, acum amandoua folosesc ACELASI icon si ACEEASI comanda de
// derulare, deci arata si se comporta identic. Daca vrei sa schimbi
// sageata sau viteza derularii, o faci intr-un singur loc: aici.
// =====================================================================

import React from 'react';

/** Sageata folosita de ambele butoane (viewBox 0 0 381.556 381.556) */
export function BackToTopIcon({
  size = 28,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 381.556 381.556"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <path d="M190.778,0L60.462,130.316l29.885,29.885l79.257-79.257v300.612h42.353V80.944l79.257,79.257l29.885-29.885L190.778,0z" />
    </svg>
  );
}

/**
 * Derulare la inceput, identica peste tot.
 * Respecta „Reduce animațiile" din setarile sistemului: cine a cerut mai
 * putina miscare sare direct sus, fara animatie.
 */
export function scrollElementToTop(el?: HTMLElement | null) {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth';

  if (el) el.scrollTo({ top: 0, behavior });
  else if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior });
}

/** Eticheta, in cele patru limbi ale site-ului */
export function backToTopLabel(language: string): string {
  return language === 'de'
    ? 'Nach oben'
    : language === 'ro'
      ? 'Înapoi sus'
      : language === 'ru'
        ? 'Наверх'
        : 'Back to top';
}
