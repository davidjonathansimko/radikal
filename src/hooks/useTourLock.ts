'use client';

// Cat timp un tutorial e deschis, pagina din spate nu se misca: nici rotita mouse-ului, nici degetul, nici tastele.

import { useEffect } from 'react';

const SCROLL_KEYS = new Set([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown']);

export function useTourLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const stop = (e: Event) => {
      if (e.cancelable) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key) && !(e.target instanceof HTMLButtonElement)) stop(e);
    };
    const opts = { passive: false, capture: true } as const;
    window.addEventListener('wheel', stop, opts);
    window.addEventListener('touchmove', stop, opts);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('wheel', stop, opts);
      window.removeEventListener('touchmove', stop, opts);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [active]);
}
