'use client';

// Pasul 2608006 — ține minte că ești ÎN zona Mărturii.
//
// De ce există acest fișier:
//   Ecranul de intrare (versetul) trebuie să apară când vii din altă parte —
//   din admin, de pe blog, de pe Despre. Dar NU trebuie să reapară când te
//   plimbi prin mărturii: rubrică → mărturie → înapoi la rubrică.
//
//   Acest „layout" rămâne montat cât timp ești oriunde sub /marturii și se
//   demontează singur când pleci din zonă. Așa știm exact când ai plecat,
//   fără să urmărim adresele paginilor.

import React, { useEffect } from 'react';
import { MARTURII_ACTIVE_KEY } from '@/lib/marturiiSession';

export default function MarturiiLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    return () => {
      try {
        sessionStorage.removeItem(MARTURII_ACTIVE_KEY);
      } catch {
        /* filă privată — atunci ecranul apare din nou, nu strică nimic */
      }
    };
  }, []);

  return <>{children}</>;
}
