'use client';

// Pasul 2210010 — link care urca la o pagina pe care ai mai vazut-o. Daca
// pagina tinta e deja in istoricul acestei file, se intoarce prin istoric
// (oricati pasi trebuie) in loc sa adauge o intrare noua. Altfel merge ca un
// link obisnuit.

import React from 'react';
import Link from 'next/link';
import { stepsBackTo, goBackSteps } from '@/lib/navHistory';

type Props = Omit<React.ComponentProps<typeof Link>, 'href'> & {
  href: string;
  /** Alta potrivire decat adresa exacta (ex. „lista unui articol"). */
  match?: (path: string) => boolean;
};

export default function UpLink({ href, match, onClick, ...rest }: Props) {
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const steps = stepsBackTo(match ?? href);
        if (steps > 0) {
          e.preventDefault();
          // Semnal pentru plasa de siguranta: navigarea merge prin istoric.
          e.currentTarget.setAttribute('data-history-nav', '1');
          goBackSteps(steps);
        }
      }}
    />
  );
}
