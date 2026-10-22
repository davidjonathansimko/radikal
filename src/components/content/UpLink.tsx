'use client';

// Pasul 2210007 — link care urca un nivel. Daca pagina de dinaintea celei de
// acum este chiar tinta lui, face un pas inapoi in istoric in loc sa adauge o
// intrare noua. Asa „inapoi" de pe telefon nu se mai invarte in cerc, oricate
// ori te plimbi intre doua pagini.

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { previousPath } from '@/lib/navHistory';

type Props = Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string };

function plain(path: string): string {
  const clean = path.split(/[?#]/)[0];
  return clean.length > 1 ? clean.replace(/\/$/, '') : clean;
}

export default function UpLink({ href, onClick, ...rest }: Props) {
  const router = useRouter();

  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        const prev = previousPath();
        if (prev && plain(prev) === plain(href)) {
          e.preventDefault();
          router.back();
        }
      }}
    />
  );
}
