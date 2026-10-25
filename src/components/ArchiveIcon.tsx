'use client';

// Pictograma „Archiv": un document care iese din dosar, cu un rotitei care se invarte (inspirata din document-management.json).
// Ciclul dureaza ~3,9 s, ca in animatia originala. Culorile urmeaza tema.

import React from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Conturul rotitei (36 de puncte, luate din fisierul Lottie), centrat in 0,0.
const GEAR =
  'M22.4 15.5L25 10.8L26.7 5.7L21.3 3.4L21.4 -2.7L26.8 -4.9L22.9 -14.8L17.4 -12.6L13.2 -17L15.5 -22.4L10.8 -25L5.7 -26.7L3.4 -21.3L-2.7 -21.4L-4.9 -26.8L-14.8 -22.9L-12.6 -17.4L-17 -13.2L-22.4 -15.5L-25 -10.8L-26.7 -5.7L-21.3 -3.4L-21.4 2.7L-26.8 4.9L-22.9 14.8L-17.4 12.6L-13.2 17L-15.5 22.4L-10.8 25L-5.7 26.7L-3.4 21.3L2.7 21.4L4.9 26.8L14.8 22.9L12.6 17.4L17 13.2Z';

export default function ArchiveIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  const { reduced } = useReducedMotion();
  const anim = reduced ? '' : 'archive-icon-anim';

  return (
    <svg
      width={size}
      height={size * 0.92}
      viewBox="0 0 130 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${anim} ${className}`}
    >
      {/* spatele dosarului */}
      <path d="M10 18h26l7 7h69v75H10z" className="fill-white dark:fill-black" />
      {/* documentul care urca si coboara */}
      <g className="archive-doc">
        <rect x="26" y="14" width="68" height="70" rx="4" className="fill-white dark:fill-black" />
        <path d="M36 30h34M36 42h48M36 54h48M36 66h34" />
      </g>
      {/* fata dosarului */}
      <path d="M10 48h100v52H10z" className="fill-white dark:fill-black" />
      {/* rotita */}
      <g transform="translate(103 90)">
        <g className="archive-gear">
          <path d={GEAR} transform="scale(0.5)" className="fill-white dark:fill-black" />
          <circle r="5.4" />
        </g>
      </g>
    </svg>
  );
}
