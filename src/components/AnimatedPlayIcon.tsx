'use client';

// Semnul Play animat — redesenat din fisierul Lottie `play.json`.
// Se deseneaza treptat, ramane o clipa, se stinge si o ia de la capat,
// intr-un ritm calm (aprox. 3,6 s), ca sa atraga privirea fara sa oboseasca ochiul.

import React from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export default function AnimatedPlayIcon({ className = 'h-16 w-16' }: { className?: string }) {
  const { reduced } = useReducedMotion();

  return (
    <svg className={className} viewBox="-50 -50 100 100" fill="none" aria-hidden="true">
      <path
        className={reduced ? '' : 'play-draw'}
        pathLength={1}
        d="M30.166 10.809 L-19.763 39.641 C-28.084 44.447 -38.485 38.442 -38.485 28.833 L-38.485 -28.835 C-38.485 -38.443 -28.084 -44.448 -19.763 -39.643 L30.166 -10.809 C38.485 -6.004 38.485 6.004 30.166 10.809 Z"
        stroke="currentColor"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
