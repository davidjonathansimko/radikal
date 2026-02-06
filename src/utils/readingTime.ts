// Reading Time Utility / Lesezeit-Dienstprogramm / Utilitar Timp de Citire
// Calculate estimated reading time for blog posts
// Berechnet die geschätzte Lesezeit für Blog-Posts
// Calculează timpul estimat de citire pentru postările de blog

// Average reading speed in words per minute / Durchschnittliche Lesegeschwindigkeit in Wörtern pro Minute
const WORDS_PER_MINUTE = 200;

// Image viewing time in seconds / Bildbetrachtungszeit in Sekunden
const SECONDS_PER_IMAGE = 12;

// Code block reading time factor (slower than regular text)
const CODE_BLOCK_FACTOR = 1.5;

interface ReadingTimeResult {
  // Reading time in minutes / Lesezeit in Minuten
  minutes: number;
  // Formatted reading time string / Formatierte Lesezeit-Zeichenkette
  text: string;
  // Word count / Wortanzahl
  words: number;
}

/**
 * Calculate estimated reading time for content
 * Berechnet die geschätzte Lesezeit für Inhalte
 * Calculează timpul estimat de citire pentru conținut
 * 
 * @param content - The content to analyze / Der zu analysierende Inhalt
 * @param language - Language for formatting / Sprache für Formatierung
 * @returns ReadingTimeResult object / ReadingTimeResult-Objekt
 */
export function calculateReadingTime(
  content: string,
  language: string = 'de'
): ReadingTimeResult {
  if (!content || typeof content !== 'string') {
    return {
      minutes: 0,
      text: getFormattedTime(0, language),
      words: 0
    };
  }

  // Remove HTML tags / HTML-Tags entfernen
  let cleanContent = content.replace(/<[^>]*>/g, ' ');
  
  // Remove markdown syntax / Markdown-Syntax entfernen
  cleanContent = cleanContent
    .replace(/[#*_`~\[\](){}|]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Count words / Wörter zählen
  const words = cleanContent.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;

  // Count images / Bilder zählen
  const imageCount = (content.match(/<img/gi) || []).length + 
                     (content.match(/!\[.*?\]\(.*?\)/g) || []).length;

  // Count code blocks / Code-Blöcke zählen
  const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length +
                     (content.match(/<code>[\s\S]*?<\/code>/gi) || []).length;

  // Calculate base reading time / Basis-Lesezeit berechnen
  let readingTimeMinutes = wordCount / WORDS_PER_MINUTE;

  // Add time for images / Zeit für Bilder hinzufügen
  readingTimeMinutes += (imageCount * SECONDS_PER_IMAGE) / 60;

  // Adjust for code blocks / Für Code-Blöcke anpassen
  readingTimeMinutes += codeBlocks * CODE_BLOCK_FACTOR;

  // Round to nearest minute (minimum 1) / Auf nächste Minute runden (mindestens 1)
  const minutes = Math.max(1, Math.ceil(readingTimeMinutes));

  return {
    minutes,
    text: getFormattedTime(minutes, language),
    words: wordCount
  };
}

/**
 * Format reading time based on language
 * Formatiert die Lesezeit basierend auf der Sprache
 * Formatează timpul de citire în funcție de limbă
 * 
 * @param minutes - Minutes to format / Zu formatierende Minuten
 * @param language - Target language / Zielsprache
 * @returns Formatted string / Formatierte Zeichenkette
 */
export function getFormattedTime(minutes: number, language: string): string {
  const translations: Record<string, { singular: string; plural: string; short: string }> = {
    de: {
      singular: 'Min. Lesezeit',
      plural: 'Min. Lesezeit',
      short: 'Min.'
    },
    en: {
      singular: 'min read',
      plural: 'min read',
      short: 'min'
    },
    ro: {
      singular: 'min de citit',
      plural: 'min de citit',
      short: 'min'
    },
    ru: {
      singular: 'мин чтения',
      plural: 'мин чтения',
      short: 'мин'
    }
  };

  const t = translations[language] || translations.de;
  
  if (minutes === 0) {
    return `< 1 ${t.short}`;
  }
  
  return `${minutes} ${minutes === 1 ? t.singular : t.plural}`;
}

/**
 * Get short reading time format
 * Kurzes Lesezeit-Format abrufen
 * Obține format scurt pentru timpul de citire
 * 
 * @param minutes - Minutes / Minuten
 * @param language - Target language / Zielsprache
 * @returns Short formatted string / Kurze formatierte Zeichenkette
 */
export function getShortReadingTime(minutes: number, language: string): string {
  const shortLabels: Record<string, string> = {
    de: 'Min.',
    en: 'min',
    ro: 'min',
    ru: 'мин'
  };

  return `${minutes} ${shortLabels[language] || shortLabels.de}`;
}

/**
 * Get reading time with icon suggestion
 * Lesezeit mit Icon-Vorschlag abrufen
 * Obține timpul de citire cu sugestie de icon
 * 
 * @param minutes - Reading time in minutes / Lesezeit in Minuten
 * @returns Icon type based on length / Icon-Typ basierend auf Länge
 */
export function getReadingTimeIcon(minutes: number): 'quick' | 'medium' | 'long' {
  if (minutes <= 3) return 'quick';
  if (minutes <= 10) return 'medium';
  return 'long';
}

export default calculateReadingTime;
