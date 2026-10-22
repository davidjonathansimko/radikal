'use client';

/**
 * Pasul 0809009 — PLASA DE SIGURANȚĂ LA NAVIGARE.
 *
 * Din când în când, navigarea internă a aplicației se blochează: apeși un
 * link și nu se întâmplă absolut nimic — nici măcar o eroare.
 *
 * Aici stă paza. Dar ea nu se uită doar la ceas, ci la ce face aplicația:
 * la o navigare sănătoasă, aplicația cere imediat pagina nouă de la server.
 * Dacă după o clipă n-a cerut NIMIC, înseamnă că nici nu a încercat — abia
 * atunci încărcăm pagina în felul obișnuit.
 *
 * Așa, o navigare lentă pe internet slab e lăsată în pace; doar una moartă
 * este salvată.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Cât așteptăm până verificăm dacă aplicația a cerut ceva. */
const CHECK_MS = 300;
/** Cât mai așteptăm o navigare care a pornit, dar merge greu. */
const PATIENCE_MS = 6000;

export default function NavigationRescue() {
  const pathname = usePathname();

  useEffect(() => {
    // Pasul 2210010 — cronometrele pornite la o apasare nu mai au voie sa traiasca
    // dupa ce pagina s-a schimbat. Altfel, dupa cateva secunde, o navigare veche
    // te arunca singura intr-o pagina pe care o parasisesi deja.
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };

    /** A cerut aplicatia pagina noua de la server dupa apasare? */
    const askedForPage = (since: number) => {
      try {
        return performance
          .getEntriesByType('resource')
          .some((e) => e.startTime >= since && e.name.includes('_rsc'));
      } catch {
        // Fără măsurători nu riscăm: presupunem că a cerut.
        return true;
      }
    };

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
      // Linkurile care se intorc prin istoric (UpLink) nu cer pagina de la server.
      if (anchor.hasAttribute('data-history-nav')) return;

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

      const clickedAt = performance.now();
      const here = () => window.location.pathname + window.location.search;

      later(() => {
        if (here() !== from) return;

        if (!askedForPage(clickedAt)) {
          // Nici n-a încercat. Mergem noi.
          window.location.assign(destination.href);
          return;
        }

        // A pornit, dar merge greu. Îi dăm timp; dacă tot nu ajunge, preluăm.
        later(() => {
          if (here() === from) window.location.assign(destination.href);
        }, PATIENCE_MS);
      }, CHECK_MS);
    };

    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [pathname]);

  return null;
}
