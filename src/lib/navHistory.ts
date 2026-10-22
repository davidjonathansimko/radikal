// Pasul 2210006 — tine minte pagina de dinaintea celei de acum, ca butoanele
// „Inapoi la lista" sa foloseasca istoricul real in loc sa adauge o intrare
// noua (altfel „inapoi" de pe telefon se invarte in cerc).

const CUR = 'radikalNavCur';
const PREV = 'radikalNavPrev';

export function trackPath(pathname: string): void {
  try {
    const cur = sessionStorage.getItem(CUR);
    if (cur === pathname) return;
    if (cur) sessionStorage.setItem(PREV, cur);
    sessionStorage.setItem(CUR, pathname);
  } catch {
    /* filă privată */
  }
}

/** Adresa paginii de dinaintea celei de acum (fara parametri). */
export function previousPath(): string | null {
  try {
    return sessionStorage.getItem(PREV);
  } catch {
    return null;
  }
}

/** Pagina anterioara era lista (nu alt articol)? */
export function cameFromList(listPath: string, articlePrefix: string): boolean {
  try {
    const prev = sessionStorage.getItem(PREV);
    if (!prev) return false;
    const isList = prev === listPath || prev.startsWith(`${listPath}/`);
    return isList && !prev.startsWith(`${articlePrefix}/`);
  } catch {
    return false;
  }
}
