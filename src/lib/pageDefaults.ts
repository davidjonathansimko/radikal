// =====================================================================
// Pasul 2508000 — TEXTUL ORIGINAL al paginilor, adunat intr-un singur loc
// ---------------------------------------------------------------------
// Panoul de admin are nevoie de textul din cod ca sa poata:
//   • sa-ti arate ce scrie acum pe pagina,
//   • sa compare cu ce ai schimbat tu,
//   • sa te duca inapoi la original cand apesi butonul.
//
// Textul de aici NU se modifica niciodata din admin — el este copia de
// siguranta. Modificarile tale stau separat, in tabelul `site_content`.
//
// DE CE „inregistrare" si nu import direct:
//   Next.js nu permite exporturi in plus dintr-un fisier `page.tsx`. Asa ca
//   fiecare pagina isi anunta singura textul cand se incarca modulul ei, iar
//   panoul de admin incarca modulele la cerere.
// =====================================================================

import type { PageId, PageLanguage } from '@/lib/pageContent';

type Defaults = Record<string, Record<string, unknown>>;

const REGISTRY: Partial<Record<PageId, Defaults>> = {};

/** Chemat de fiecare pagina, o singura data, cand i se incarca modulul. */
export function registerPageDefaults(pageId: PageId, defaults: Record<string, unknown>) {
  REGISTRY[pageId] = defaults as Defaults;
}

let loaded: Promise<void> | null = null;

/** Incarca modulele paginilor, ca sa se inregistreze singure. */
export function ensurePageDefaultsLoaded(): Promise<void> {
  if (!loaded) {
    loaded = Promise.all([
      import('@/app/about/page'),
      import('@/app/marturii/page'),
      import('@/app/impressum/page'),
      import('@/app/datenschutz/page'),
      import('@/app/news/page'),
    ]).then(() => undefined);
  }
  return loaded;
}

/** Textul original al unei pagini, pentru o limba. Gol daca pagina nu e inca legata. */
export function originalTextsFor(pageId: PageId, lang: PageLanguage): Record<string, string> {
  const page = REGISTRY[pageId];
  if (!page) return {};
  const source = (page[lang] ?? page.de ?? {}) as Record<string, unknown>;

  const out: Record<string, string> = {};
  Object.entries(source).forEach(([key, value]) => {
    // Doar textele simple sunt editabile. Listele (de ex. drepturile GDPR)
    // raman in cod, ca sa nu poata fi stricate din greseala.
    if (typeof value === 'string') out[key] = value;
  });
  return out;
}

/** Paginile care sunt deja legate la sistemul de editare. */
export function isPageEditable(pageId: PageId): boolean {
  return Boolean(REGISTRY[pageId]);
}
