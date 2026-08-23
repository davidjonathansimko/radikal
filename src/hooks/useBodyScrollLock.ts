// Body scroll lock / Scroll-Sperre / Blocare scroll pagină
//
// PROBLEMA rezolvata (UX + accesibilitate):
//   Cand un modal este deschis, utilizatorul trebuie sa poata face scroll DOAR
//   in interiorul modalului. Pagina din spate (body) trebuie sa fie complet
//   inghetata. Fara asta apar doua bug-uri clasice:
//     1. "background scroll bleeding" — pagina din spate se misca
//     2. "scroll chaining" — cand ajungi la capatul modalului, scroll-ul
//        "trece" mai departe in pagina de dedesubt
//
// SOLUTIA:
//   - `position: fixed` pe body, cu `top: -scrollY` -> pagina ingheata EXACT
//     unde era, fara sa sara la inceput
//   - compensam latimea scrollbar-ului cu `padding-right` -> layout-ul nu
//     "tresare" pe desktop
//   - la deblocare restauram pozitia exacta de scroll
//   - CONTOR: daca doua modale sunt deschise simultan, deblocarea se face
//     abia cand se inchide si ultimul
//
// Pentru interiorul modalului foloseste clasa Tailwind `overscroll-contain`,
// care opreste scroll chaining la nivel de browser.

'use client';

import { useEffect } from 'react';

// Cate blocari active exista in acest moment (modale suprapuse)
let lockCount = 0;
let savedScrollY = 0;
let savedStyles: {
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  overflow: string;
  paddingRight: string;
} | null = null;

function lockBody() {
  if (typeof document === 'undefined') return;

  lockCount += 1;
  // Deja blocat de un alt modal -> nu facem nimic
  if (lockCount > 1) return;

  const body = document.body;
  savedScrollY = window.scrollY || window.pageYOffset || 0;

  savedStyles = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
  };

  // Compensam latimea scrollbar-ului ca sa nu "sara" layout-ul (doar desktop)
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  if (scrollbarWidth > 0) {
    const current = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${current + scrollbarWidth}px`;
  }

  body.style.position = 'fixed';
  body.style.top = `-${savedScrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
  body.style.overflow = 'hidden';
}

function unlockBody() {
  if (typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);
  // Mai exista un modal deschis -> pastram blocarea
  if (lockCount > 0) return;

  const body = document.body;

  if (savedStyles) {
    body.style.position = savedStyles.position;
    body.style.top = savedStyles.top;
    body.style.left = savedStyles.left;
    body.style.right = savedStyles.right;
    body.style.width = savedStyles.width;
    body.style.overflow = savedStyles.overflow;
    body.style.paddingRight = savedStyles.paddingRight;
    savedStyles = null;
  } else {
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    body.style.overflow = '';
    body.style.paddingRight = '';
  }

  // Revenim EXACT unde eram, instant (fara animatie de scroll)
  window.scrollTo({ top: savedScrollY, left: 0, behavior: 'instant' as ScrollBehavior });
}

/**
 * Blocheaza scroll-ul paginii cat timp `isLocked` este `true`.
 *
 * Exemplu:
 *   useBodyScrollLock(isModalOpen);
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    lockBody();
    return () => {
      unlockBody();
    };
  }, [isLocked]);
}

export default useBodyScrollLock;
