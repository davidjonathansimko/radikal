// Pasul 21082026 — Focus trap pentru modale
//
// PROBLEMA de accesibilitate rezolvata:
//   1. Cand un modal este deschis si apesi Tab, focusul "scapa" in spatele
//      modalului, pe elementele paginii ascunse. Utilizatorii de tastatura
//      si cei cu cititor de ecran se pierd complet.
//   2. La inchidere, focusul se pierde la inceputul paginii in loc sa revina
//      pe butonul care a deschis modalul.
//
// SOLUTIA:
//   - retinem elementul focusat inainte de deschidere
//   - mutam focusul in modal
//   - ciclam Tab / Shift+Tab DOAR intre elementele focusabile din modal
//   - la inchidere returnam focusul exact pe butonul care l-a deschis

'use client';

import { RefObject, useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
    // Ignoram elementele ascunse
    if (el.hasAttribute('disabled')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
  });
}

/**
 * Tine focusul captiv in interiorul containerului cat timp `isActive` e true,
 * si il returneaza la elementul anterior cand devine false.
 *
 * Exemplu:
 *   const modalRef = useRef<HTMLDivElement>(null);
 *   useFocusTrap(modalRef, isOpen);
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean
) {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // 1. Retinem cine avea focusul (butonul care a deschis modalul)
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;

    // 2. Mutam focusul in modal
    const focusFirst = () => {
      if (!container) return;
      const items = getFocusable(container);
      if (items.length > 0) {
        items[0].focus();
      } else {
        // Niciun element focusabil -> facem containerul focusabil temporar
        container.setAttribute('tabindex', '-1');
        container.focus();
      }
    };
    // Asteptam o cadra ca sa fie sigur randat
    const raf = requestAnimationFrame(focusFirst);

    // 3. Ciclam Tab-ul in interior
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const current = containerRef.current;
      if (!current) return;

      const items = getFocusable(current);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // Focusul a iesit cumva din modal -> il aducem inapoi
      if (!active || !current.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);

      // 4. Returnam focusul pe butonul care a deschis modalul
      const previous = previouslyFocusedRef.current;
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) {
        // preventScroll: nu vrem sa sara pagina cand revine focusul
        previous.focus({ preventScroll: true });
      }
      previouslyFocusedRef.current = null;
    };
  }, [isActive, containerRef]);
}

export default useFocusTrap;
