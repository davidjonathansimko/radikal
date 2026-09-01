/**
 * Pasul 2708016 — ECRAN COMPLET.
 *
 * În aplicația instalată, ecranul complet ascunde ceasul de sus și butoanele
 * de navigare de jos: rămâne doar ce ai scris tu.
 *
 * Într-o filă obișnuită de browser, Chrome adaugă el singur mesajul
 * „Zum Beenden des Vollbildmodus…". Este mesajul lui, pus ca măsură de
 * siguranță, și nu poate fi oprit din cod — dar dispare singur după o clipă.
 */

import { useEffect } from 'react';

/** Rulează site-ul ca aplicație instalată, nu ca filă de browser? */
export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
    if (window.matchMedia?.('(display-mode: fullscreen)').matches) return true;
    // Safari pe iPhone folosește o proprietate proprie.
    return Boolean((window.navigator as { standalone?: boolean }).standalone);
  } catch {
    return false;
  }
}

/** Ține ecranul complet cât timp `active` este adevărat. */
export function useAppFullscreen(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    // Doar în aplicația instalată. Într-o filă de browser, ecranul complet
    // aduce mesajul lui Chrome fără să aducă și liniștea pe care o căutăm.
    if (!isStandaloneApp()) return;

    const el = document.documentElement;
    let entered = false;

    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen({ navigationUI: 'hide' })
        .then(() => {
          entered = true;
        })
        .catch(() => {
          /* refuzat — pagina merge la fel de bine */
        });
    }

    return () => {
      if (entered && document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, [active]);
}

/**
 * Pasul 2708022 — ECRAN CURAT.
 * Cât timp e pornit, barele de meniu de sus și de jos se ascund. Se folosește
 * la versetele de intro, unde orice buton strică liniștea textului.
 */
export function useCleanScreen(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    document.body.classList.add('intro-active');
    return () => document.body.classList.remove('intro-active');
  }, [active]);
}
