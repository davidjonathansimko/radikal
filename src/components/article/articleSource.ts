/**
 * Pasul 2708000 — DE UNDE CITIM.
 *
 * Pagina de articol este una singură, folosită de două ori: pentru bloguri
 * și pentru mărturii. Ce diferă între ele stă scris aici, într-un singur loc.
 *
 * Așa, orice reparație pe pagina de articol le repară pe amândouă deodată.
 * Înainte ar fi însemnat două fișiere de 2000 de linii, ținute la fel de mână.
 */

export interface ArticleSource {
  /** Tabelul din care se citește */
  table: 'blog_posts' | 'testimonies' | 'content_items';
  /**
   * Rubricile noi stau toate în același tabel, deosebite prin coloana `kind`.
   * Când e pus aici, fiecare căutare adaugă și condiția asta.
   */
  filterColumn?: string;
  filterValue?: string;
  /** Adresa unui articol: /blogs/slug sau /marturii/m/slug */
  basePath: string;
  /** Adresa listei: /blogs sau /marturii */
  listPath: string;
  /**
   * Prefix pentru comentarii și aprecieri.
   * Comentariile se leagă de articol prin `post_id`, care este textul adresei.
   * Fără prefix, un blog și o mărturie cu aceeași adresă și-ar amesteca
   * comentariile. Prefixul face imposibilă încurcătura.
   */
  interactionPrefix: string;
  /** Funcția care numără vizualizările (există doar pentru bloguri) */
  viewsRpc: string | null;
  /** Textul butonului „înapoi la listă", pe limbi */
  backLabel: Record<string, string>;
  /** Textul „nu am găsit", pe limbi */
  notFoundLabel: Record<string, string>;
  /** Numele rubricii în firimiturile de navigare (breadcrumb) */
  breadcrumbLabel: string;
  /**
   * Prefix pentru fișierele audio. Vocea generată se ține după adresa
   * articolului; fără prefix, un blog și o mărturie cu aceeași adresă ar
   * ajunge să împartă același fișier.
   */
  audioPrefix: string;
  /** Cum se numeste in Supabase: 'blog' sau 'marturie' */
  contentType: 'blog' | 'marturie' | 'andacht' | 'copii';
}

export const BLOG_SOURCE: ArticleSource = {
  table: 'blog_posts',
  basePath: '/blogs',
  listPath: '/blogs',
  interactionPrefix: '',
  viewsRpc: 'increment_blog_views',
  backLabel: {
    de: 'Zurück zu den Blogs',
    en: 'Back to Blogs',
    ro: 'Înapoi la Bloguri',
    ru: 'Обратно к блогам',
  },
  notFoundLabel: {
    de: 'Blog-Post nicht gefunden',
    en: 'Blog post not found',
    ro: 'Postarea blog nu a fost găsită',
    ru: 'Запись блога не найдена',
  },
  breadcrumbLabel: 'Blogs',
  audioPrefix: '',
  contentType: 'blog',
};

export const TESTIMONY_SOURCE: ArticleSource = {
  table: 'testimonies',
  basePath: '/marturii/m',
  listPath: '/marturii',
  interactionPrefix: 'm:',
  viewsRpc: null,
  backLabel: {
    de: 'Zurück zu den Zeugnissen',
    en: 'Back to testimonies',
    ro: 'Înapoi la mărturii',
    ru: 'Назад к свидетельствам',
  },
  notFoundLabel: {
    de: 'Zeugnis nicht gefunden',
    en: 'Testimony not found',
    ro: 'Mărturia nu a fost găsită',
    ru: 'Свидетельство не найдено',
  },
  breadcrumbLabel: 'Zeugnisse',
  audioPrefix: 'm-',
  contentType: 'marturie',
};

/** Pasul 2708018 — rubricile noi, toate din acelasi tabel. */
function contentSource(
  kind: 'andacht' | 'copii',
  basePath: string,
  labels: { back: Record<string, string>; notFound: Record<string, string>; crumb: string },
): ArticleSource {
  return {
    table: 'content_items',
    filterColumn: 'kind',
    filterValue: kind,
    basePath: `${basePath}/a`,
    listPath: basePath,
    interactionPrefix: `${kind}:`,
    viewsRpc: null,
    backLabel: labels.back,
    notFoundLabel: labels.notFound,
    breadcrumbLabel: labels.crumb,
    audioPrefix: `${kind}-`,
    contentType: kind,
  };
}

export const ANDACHT_SOURCE: ArticleSource = contentSource('andacht', '/andacht', {
  back: {
    de: 'Zurück zur Andacht',
    en: 'Back to the devotions',
    ro: 'Înapoi la meditații',
    ru: 'Назад к размышлениям',
  },
  notFound: {
    de: 'Beitrag nicht gefunden',
    en: 'Post not found',
    ro: 'Articolul nu a fost găsit',
    ru: 'Запись не найдена',
  },
  crumb: 'Tägliche Andacht',
});

export const COPII_SOURCE: ArticleSource = contentSource('copii', '/copii', {
  back: {
    de: 'Zurück zu „Für Kinder"',
    en: 'Back to "For Children"',
    ro: 'Înapoi la „Pentru copii"',
    ru: 'Назад к «Для детей»',
  },
  notFound: {
    de: 'Beitrag nicht gefunden',
    en: 'Post not found',
    ro: 'Articolul nu a fost găsit',
    ru: 'Запись не найдена',
  },
  crumb: 'Für Kinder',
});
