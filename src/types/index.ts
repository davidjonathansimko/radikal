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
  // Modal intro question fields / Modal-Intro-Frage-Felder
  modal_title?: string; // Modal title in German / Modal-Titel auf Deutsch
  modal_title_en?: string; // Modal title in English / Modal-Titel auf Englisch
  modal_title_ro?: string; // Modal title in Romanian / Modal-Titel auf Rumänisch
  modal_title_ru?: string; // Modal title in Russian / Modal-Titel auf Russisch
  modal_question?: string; // Modal question in German / Modal-Frage auf Deutsch
  modal_question_en?: string; // Modal question in English / Modal-Frage auf Englisch
  modal_question_ro?: string; // Modal question in Romanian / Modal-Frage auf Rumänisch
  modal_question_ru?: string; // Modal question in Russian / Modal-Frage auf Russisch
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
