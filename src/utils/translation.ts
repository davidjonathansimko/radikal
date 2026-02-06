// Automatic translation utility using a free translation service
// Automatische Übersetzungsdienstprogramm mit einem kostenlosen Übersetzungsdienst

// Simple translation mapping for common words and phrases
// Einfache Übersetzungszuordnung für häufige Wörter und Phrasen
const translationMappings: { [key: string]: string } = {
  // Common religious/biblical terms
  'Gott': 'God',
  'Jesus': 'Jesus',
  'Christus': 'Christ',
  'Herr': 'Lord',
  'Bibel': 'Bible',
  'Glaube': 'Faith',
  'Hoffnung': 'Hope',
  'Liebe': 'Love',
  'Gebet': 'Prayer',
  'Segen': 'Blessing',
  'Wahrheit': 'Truth',
  'Frieden': 'Peace',
  'Freude': 'Joy',
  'Kraft': 'Strength',
  'Heiliger Geist': 'Holy Spirit',
  'Evangelium': 'Gospel',
  'Kirche': 'Church',
  'Christ': 'Christian',
  'Erlösung': 'Salvation',
  'Vergebung': 'Forgiveness',
  'Ewigkeit': 'Eternity',
  'Himmel': 'Heaven',
  'Erde': 'Earth',
  
  // Common phrases
  'und': 'and',
  'oder': 'or',
  'aber': 'but',
  'mit': 'with',
  'für': 'for',
  'von': 'from',
  'zu': 'to',
  'in': 'in',
  'auf': 'on',
  'bei': 'at',
  'durch': 'through',
  'über': 'about',
  'unter': 'under',
  'vor': 'before',
  'nach': 'after',
  'zwischen': 'between',
  'während': 'during',
  'ohne': 'without',
  'gegen': 'against',
  'um': 'around',
  'bis': 'until',
  'seit': 'since',
  'trotz': 'despite',
  'wegen': 'because of',
  
  // Action words
  'ist': 'is',
  'sind': 'are',
  'war': 'was',
  'waren': 'were',
  'haben': 'have',
  'hat': 'has',
  'hatte': 'had',
  'werden': 'will',
  'wird': 'will',
  'würde': 'would',
  'kann': 'can',
  'könnte': 'could',
  'soll': 'should',
  'sollte': 'should',
  'muss': 'must',
  'darf': 'may',
  'möchte': 'would like',
  
  // Time and numbers
  'heute': 'today',
  'morgen': 'tomorrow',
  'gestern': 'yesterday',
  'jetzt': 'now',
  'hier': 'here',
  'dort': 'there',
  'immer': 'always',
  'nie': 'never',
  'oft': 'often',
  'manchmal': 'sometimes',
  'alle': 'all',
  'viele': 'many',
  'einige': 'some',
  'wenige': 'few',
  'mehr': 'more',
  'weniger': 'less',
  'groß': 'big',
  'klein': 'small',
  'gut': 'good',
  'schlecht': 'bad',
  'richtig': 'right',
  'falsch': 'wrong',
  'wichtig': 'important',
  'schwer': 'difficult',
  'leicht': 'easy',
  'neu': 'new',
  'alt': 'old',
  'jung': 'young',
  'schön': 'beautiful',
};

// Basic word-by-word translation function
// Grundlegende Wort-für-Wort-Übersetzungsfunktion
function translateWords(text: string): string {
  // Split text into words and translate each known word
  const words = text.split(/(\s+|[.,!?;:])/);
  
  return words.map(word => {
    const cleanWord = word.toLowerCase().trim();
    const punctuation = word.match(/[.,!?;:]$/)?.[0] || '';
    const wordWithoutPunct = cleanWord.replace(/[.,!?;:]$/, '');
    
    if (translationMappings[wordWithoutPunct]) {
      const translated = translationMappings[wordWithoutPunct];
      // Preserve capitalization
      if (word[0] && word[0] === word[0].toUpperCase()) {
        return translated.charAt(0).toUpperCase() + translated.slice(1) + punctuation;
      }
      return translated + punctuation;
    }
    
    return word;
  }).join('');
}

// Enhanced translation function with context
// Erweiterte Übersetzungsfunktion mit Kontext
export async function autoTranslateText(germanText: string): Promise<string> {
  if (!germanText || germanText.trim() === '') {
    return '';
  }

  try {
    // Fast word-by-word translation (no API calls)
    const wordTranslation = translateWords(germanText);
    
    // Quick pattern-based improvements
    let result = wordTranslation;
    
    // Common sentence patterns
    result = result.replace(/In der Bibel/gi, 'In the Bible');
    result = result.replace(/Es ist wichtig/gi, 'It is important');
    result = result.replace(/Wir können/gi, 'We can');
    result = result.replace(/Wir sollten/gi, 'We should');
    result = result.replace(/Gott will/gi, 'God wants');
    result = result.replace(/Jesus sagt/gi, 'Jesus says');
    result = result.replace(/Die Schrift sagt/gi, 'Scripture says');
    result = result.replace(/Im Namen/gi, 'In the name');
    result = result.replace(/durch Christus/gi, 'through Christ');
    result = result.replace(/im Himmel/gi, 'in heaven');
    result = result.replace(/auf Erden/gi, 'on earth');
    
    return result || `[Auto-translated: ${germanText}]`;
  } catch (error) {
    console.warn('Translation failed, using fallback:', error);
    return `[Translation: ${germanText}]`;
  }
}

// Fallback translation when automatic translation fails
// Fallback-Übersetzung, wenn automatische Übersetzung fehlschlägt
async function fallbackTranslation(germanText: string): Promise<string> {
  // Basic patterns for common blog structures
  if (germanText.includes('Willkommen') || germanText.includes('willkommen')) {
    return germanText.replace(/Willkommen/gi, 'Welcome');
  }
  
  if (germanText.includes('Heute') || germanText.includes('heute')) {
    return germanText.replace(/Heute/gi, 'Today');
  }
  
  if (germanText.includes('Gott') || germanText.includes('Jesus') || germanText.includes('Bibel')) {
    // This looks like religious content, apply basic religious term translations
    let translated = germanText;
    Object.entries(translationMappings).forEach(([german, english]) => {
      const regex = new RegExp(`\\b${german}\\b`, 'gi');
      translated = translated.replace(regex, english);
    });
    return translated;
  }
  
  // If no pattern matches, return a note for manual translation
  return `[Translation needed: ${germanText}]`;
}

// Function to generate English slug from German title
// Funktion zum Generieren eines englischen Slugs aus deutschem Titel
export function generateEnglishSlug(germanTitle: string): string {
  return germanTitle
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

// Function to auto-generate translations for blog post
// Funktion zur automatischen Generierung von Übersetzungen für Blog-Posts
export async function autoTranslateBlogPost(postData: {
  title: string;
  content: string;
  excerpt: string;
}) {
  const [titleEn, contentEn, excerptEn] = await Promise.all([
    autoTranslateText(postData.title),
    autoTranslateText(postData.content),
    autoTranslateText(postData.excerpt)
  ]);

  return {
    title_en: titleEn,
    content_en: contentEn,
    excerpt_en: excerptEn
  };
}
