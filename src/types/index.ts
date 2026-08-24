// Type definitions for our blog application / Typdefinitionen für unsere Blog-Anwendung
// This file contains all TypeScript interfaces and types used throughout the app
// Diese Datei enthält alle TypeScript-Schnittstellen und -Typen, die in der App verwendet werden

export interface User {
  id: string;
  email: string;
  created_at: string;
  is_admin: boolean;
}

// Blog post interface / Blog-Post-Schnittstelle
export interface BlogPost {
  id: string;
  title: string; // Post title (default/Romanian) / Post-Titel (Standard/Rumänisch)
  title_de?: string; // German title / Deutscher Titel
  title_en?: string; // English title / Englischer Titel
  title_ro?: string; // Romanian title / Rumänischer Titel
  title_ru?: string; // Russian title / Russischer Titel
  content: string; // Post content (default/Romanian) / Post-Inhalt (Standard/Rumänisch)
  content_de?: string; // Post content in German / Post-Inhalt auf Deutsch
  content_en?: string; // Post content in English / Post-Inhalt auf Englisch
  content_ro?: string; // Post content in Romanian / Post-Inhalt auf Rumänisch
  content_ru?: string; // Post content in Russian / Post-Inhalt auf Russisch
  excerpt: string; // Short description (default/Romanian) / Kurze Beschreibung (Standard/Rumänisch)
  excerpt_de?: string; // German excerpt / Deutscher Auszug
  excerpt_en?: string; // English excerpt / Englischer Auszug
  excerpt_ro?: string; // Romanian excerpt / Rumänischer Auszug
  excerpt_ru?: string; // Russian excerpt / Russischer Auszug
  author_id: string; // Author's user ID / Benutzer-ID des Autors
  created_at: string; // Creation timestamp / Erstellungszeitstempel
  updated_at: string; // Last update timestamp / Letzter Update-Zeitstempel
  published: boolean; // Publication status / Veröffentlichungsstatus
  image_url?: string; // Optional featured image / Optionales Hauptbild
  slug: string; // URL-friendly identifier / URL-freundlicher Bezeichner
  tags?: string | string[]; // Post tags - can be string or array / Post-Tags - kann String oder Array sein
  likes_count: number; // Number of likes / Anzahl der Likes
  likes?: number; // Alternative likes field / Alternatives Likes-Feld
  views?: number; // Number of views / Anzahl der Aufrufe
  comments_count: number; // Number of comments / Anzahl der Kommentare
  // Pasul 2108002: fragmente marcate manual de admin ca referinte biblice (afisate cu rosu)
  bible_refs?: string[] | null;

  // ---- Pasul 2208001: efecte de imagine + blog DINAMIC („Play Blog") ----
  effect_noise?: boolean;
  effect_grain?: boolean;
  effect_sepia?: boolean;
  effect_vignette?: boolean;
  sepia_intensity?: number;
  vignette_intensity?: number;
  grain_opacity?: number;
  /** true = articolul are butonul „Play Blog" si modalul dinamic */
  is_dynamic?: boolean;
  /** Setari SEPARATE, doar pentru modalul „Play Blog" */
  modal_background_opacity?: number;

  // Pasul A15 — opacitate / umbra reglabile la fiecare blog in parte.
  // Sunt optionale: daca `STEP_A15_IMAGE_OPACITY.sql` nu a fost rulat,
  // pur si simplu lipsesc si se folosesc valorile implicite.
  /** Opacitatea imaginii articolului, 0-100 */
  post_image_opacity?: number;
  /** Intensitatea umbrei imaginii articolului, 0-100 */
  post_image_shadow?: number;
  /** Opacitatea imaginii de fundal din articol, 0-100 */
  background_opacity?: number;
  /** Umbra imaginii de fundal din articol, 0-100 */
  background_shadow?: number;
  /** Umbra fundalului din modalul „Play Blog", 0-100 */
  modal_background_shadow?: number;

  /**
   * Pasul A17 — categoriile in care intra articolul.
   * Un articol poate fi in mai multe deodata (familie + casnicie).
   * Vine din `STEP_2308000_CATEGORII.sql`.
   */
  category_ids?: string[];
  modal_effect_noise?: boolean;
  modal_effect_grain?: boolean;
  modal_effect_sepia?: boolean;
  modal_effect_vignette?: boolean;
  modal_sepia_intensity?: number;
  modal_vignette_intensity?: number;
  modal_grain_opacity?: number;
  // ---- Pasul 2308005 (E): efecte cinematice noi (optionale => continutul vechi nu e afectat) ----
  effect_bw?: boolean;
  effect_bloom?: boolean;
  effect_letterbox?: boolean;
  effect_light_leak?: boolean;
  modal_effect_bw?: boolean;
  modal_effect_bloom?: boolean;
  modal_effect_letterbox?: boolean;
  modal_effect_light_leak?: boolean;
  // Pasul 2308006-E — cat de tare se vede fiecare efect (0–100).
  // Toate sunt optionale: daca SQL-ul nu a fost rulat, se folosesc
  // valorile implicite si nimic nu se strica.
  noise_intensity?: number;
  bw_intensity?: number;
  bloom_intensity?: number;
  letterbox_size?: number;
  light_leak_intensity?: number;
  modal_noise_intensity?: number;
  modal_bw_intensity?: number;
  modal_bloom_intensity?: number;
  modal_letterbox_size?: number;
  modal_light_leak_intensity?: number;
  // Pasul 2308006-F — articol marcat pentru pagina „News"
  is_news?: boolean;
  news_pinned_at?: string | null;
  // Modal intro question fields / Modal-Intro-Frage-Felder
  modal_title?: string; // Modal title in German / Modal-Titel auf Deutsch
  modal_title_en?: string; // Modal title in English / Modal-Titel auf Englisch
  modal_title_ro?: string; // Modal title in Romanian / Modal-Titel auf Rumänisch
  modal_title_ru?: string; // Modal title in Russian / Modal-Titel auf Russisch
  modal_question?: string; // Modal question in German / Modal-Frage auf Deutsch
  modal_question_en?: string; // Modal question in English / Modal-Frage auf Englisch
  modal_question_ro?: string; // Modal question in Romanian / Modal-Frage auf Rumänisch
  modal_question_ru?: string; // Modal question in Russian / Modal-Frage auf Russisch
  // Pasul 2308010 — textul scris manual in germana are prioritate fata de DeepL
  modal_title_de?: string;
  modal_question_de?: string;
  show_intro_modal?: boolean; // Whether to show intro modal / Ob Intro-Modal angezeigt werden soll
}

// Comment interface / Kommentar-Schnittstelle
export interface Comment {
  id: string;
  post_id: string; // Associated blog post ID / Zugehörige Blog-Post-ID
  user_id: string; // Commenter's user ID / Benutzer-ID des Kommentators
  content: string; // Comment text / Kommentartext
  created_at: string; // Creation timestamp / Erstellungszeitstempel
  updated_at: string; // Last update timestamp / Letzter Update-Zeitstempel
  author_email: string; // Commenter's email / E-Mail des Kommentators
  author_name?: string; // Commenter's name / Name des Kommentators
  parent_id?: string | null; // Parent comment ID for replies / Eltern-Kommentar-ID für Antworten / ID comentariu părinte pentru răspunsuri
}

// Like interface / Like-Schnittstelle
export interface Like {
  id: string;
  post_id: string; // Associated blog post ID / Zugehörige Blog-Post-ID
  user_id: string; // User who liked the post / Benutzer, der den Post geliked hat
  created_at: string; // Like timestamp / Like-Zeitstempel
}

// Quote interface / Zitat-Schnittstelle
export interface Quote {
  id: string;
  text: string; // Quote text in German / Zitattext auf Deutsch
  text_en: string; // Quote text in English / Zitattext auf Englisch
  reference: string; // Bible reference / Bibelstelle
  symbol: string; // Associated symbol / Zugehöriges Symbol
  created_at: string; // Creation timestamp / Erstellungszeitstempel
}

// Contact message interface / Kontaktnachrichten-Schnittstelle
export interface ContactMessage {
  id: string;
  name: string; // Sender's name / Name des Absenders
  email: string; // Sender's email / E-Mail des Absenders
  subject: string; // Message subject / Nachrichtenbetreff
  message: string; // Message content / Nachrichteninhalt
  created_at: string; // Submission timestamp / Übermittlungszeitstempel
  replied: boolean; // Reply status / Antwort-Status
}

// Language type - Now supports German, English, Romanian, and Russian / Sprachtyp - Unterstützt jetzt Deutsch, Englisch, Rumänisch und Russisch
export type Language = 'de' | 'en' | 'ro' | 'ru';

// Theme type / Theme-Typ
export type Theme = 'light' | 'dark' | 'system';
