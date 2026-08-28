/**
 * Pasul 2708016 — ECRAN COMPLET, dar doar în aplicație.
 *
 * De ce condiția: într-o filă obișnuită de browser, Chrome afișează el singur
 * mesajul „Zum Beenden des Vollbildmodus…". Este mesajul lui, pus ca măsură de
 * siguranță, și nu poate fi oprit din cod. În aplicația instalată mesajul nu
 * apare, pentru că acolo nu are rost.
 *
 * Așa că cerem ecran complet NUMAI când site-ul rulează ca aplicație. În
 * browser rămâne totul ca înainte — fără mesaj, fără surprize.
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
    if (!active || !isStandaloneApp()) return;

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
