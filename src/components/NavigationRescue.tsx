'use client';

/**
 * Pasul 0809005 — PLASA DE SIGURANȚĂ LA NAVIGARE.
 *
 * Din când în când, navigarea internă a aplicației se blochează: apeși un
 * link și nu se întâmplă absolut nimic — nici măcar o eroare. Am verificat
 * direct în browser: nici o comandă dată prin cod nu mai mișcă pagina.
 * Până găsesc cauza adâncă, aici stă paza:
 *
 *   apeși un link → dacă după o jumătate de secundă adresa e tot aceeași,
 *   încărcăm pagina în felul obișnuit, ca un site normal.
 *
 * E puțin mai lent decât navigarea obișnuită, dar nimeni nu mai rămâne
 * blocat într-o aplicație care pare stricată.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const WAIT_MS = 600;

export default function NavigationRescue() {
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // NU verificăm `defaultPrevented`: tocmai asta e situația pe care o
      // păzim — navigarea internă a oprit apăsarea și apoi n-a făcut nimic.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      let destination: URL;
      try {
        destination = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (destination.origin !== window.location.origin) return;

      const from = window.location.pathname + window.location.search;
      const to = destination.pathname + destination.search;
      if (from === to) return;

      window.setTimeout(() => {
        const now = window.location.pathname + window.location.search;
        if (now === from) window.location.assign(destination.href);
      }, WAIT_MS);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [pathname]);

  return null;
}
