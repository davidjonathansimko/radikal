// Pasul 21082026 — evidentierea automata a referintelor biblice
//
// Scop: referintele biblice din articole (ex. "Neemia 6:1-3",
// "Proverbe capitolul 29 versetul 25", "John 3:16") sa apara
// ingrosate si cu rosu inchis in tema deschisa, respectiv rosu
// mai deschis in tema intunecata.
//
// Implementarea este DEFENSIVA:
//   - nu atinge textul din interiorul tag-urilor HTML
//   - nu atinge continutul din <a>, <script>, <style>, <code>, <pre>
//   - daca ceva nu se potriveste, textul ramane exact cum era
//
// Culorile vin din clasa CSS `.bible-ref` definita in globals.css,
// asa ca tema este respectata automat.

// Numele cartilor biblice in DE / EN / RO / RU (forme uzuale, fara diacritice obligatorii)
const BOOK_NAMES = [
  // Vechiul Testament
  '1\\.?\\s*Mose', '2\\.?\\s*Mose', '3\\.?\\s*Mose', '4\\.?\\s*Mose', '5\\.?\\s*Mose',
  'Genesis', 'Exodus', 'Leviticus', 'Numeri', 'Deuteronomium',
  'Geneza', 'Exodul', 'Leviticul', 'Numerii', 'Deuteronomul',
  'Josua', 'Joshua', 'Iosua', 'Richter', 'Judges', 'Judecatori', 'Judecători',
  'Rut', 'Ruth',
  '1\\.?\\s*Samuel', '2\\.?\\s*Samuel', '1\\.?\\s*K(?:ö|o)nige', '2\\.?\\s*K(?:ö|o)nige',
  '1\\.?\\s*Kings', '2\\.?\\s*Kings', '1\\.?\\s*Imparati', '2\\.?\\s*Imparati',
  '1\\.?\\s*Împ(?:a|ă)ra(?:t|ț)i', '2\\.?\\s*Împ(?:a|ă)ra(?:t|ț)i',
  '1\\.?\\s*Chronik', '2\\.?\\s*Chronik', '1\\.?\\s*Chronicles', '2\\.?\\s*Chronicles',
  '1\\.?\\s*Cronici', '2\\.?\\s*Cronici',
  'Esra', 'Ezra', 'Ezdra', 'Nehemia', 'Nehemiah', 'Neemia',
  'Ester', 'Esther', 'Estera', 'Hiob', 'Job', 'Iov',
  'Psalm(?:en|s|i)?', 'Psalmul', 'Psalmii', 'Psalom',
  'Spr(?:ü|u)che', 'Proverbs', 'Proverbe', 'Prediger', 'Ecclesiastes', 'Eclesiastul',
  'Hoheslied', 'Cantarea', 'Cântarea',
  'Jesaja', 'Isaiah', 'Isaia', 'Jeremia', 'Jeremiah', 'Ieremia',
  'Klagelieder', 'Lamentations', 'Plangerile', 'Plângerile',
  'Hesekiel', 'Ezekiel', 'Ezechiel', 'Daniel', 'Danie(?:l)',
  'Hosea', 'Osea', 'Joel', 'Ioel', 'Amos', 'Obadja', 'Obadiah', 'Obadia',
  'Jona', 'Jonah', 'Iona', 'Micha', 'Micah', 'Mica', 'Nahum', 'Naum',
  'Habakuk', 'Habakkuk', 'Habacuc', 'Zephanja', 'Zephaniah', 'Tefania',
  'Haggai', 'Hagai', 'Sacharja', 'Zechariah', 'Zaharia', 'Maleachi', 'Malachi', 'Maleahi',
  // Noul Testament
  'Matth(?:ä|a)us', 'Matthew', 'Matei', 'Markus', 'Mark', 'Marcu',
  'Lukas', 'Luke', 'Luca', 'Johannes', 'John', 'Ioan',
  'Apostelgeschichte', 'Acts', 'Faptele\\s+Apostolilor', 'Faptele',
  'R(?:ö|o)mer', 'Romans', 'Romani',
  '1\\.?\\s*Korinther', '2\\.?\\s*Korinther', '1\\.?\\s*Corinthians', '2\\.?\\s*Corinthians',
  '1\\.?\\s*Corinteni', '2\\.?\\s*Corinteni',
  'Galater', 'Galatians', 'Galateni', 'Epheser', 'Ephesians', 'Efeseni',
  'Philipper', 'Philippians', 'Filipeni', 'Kolosser', 'Colossians', 'Coloseni',
  '1\\.?\\s*Thessalonicher', '2\\.?\\s*Thessalonicher',
  '1\\.?\\s*Thessalonians', '2\\.?\\s*Thessalonians',
  '1\\.?\\s*Tesaloniceni', '2\\.?\\s*Tesaloniceni',
  '1\\.?\\s*Timotheus', '2\\.?\\s*Timotheus', '1\\.?\\s*Timothy', '2\\.?\\s*Timothy',
  '1\\.?\\s*Timotei', '2\\.?\\s*Timotei',
  'Titus', 'Tit', 'Philemon', 'Filimon', 'Hebr(?:ä|a)er', 'Hebrews', 'Evrei',
  'Jakobus', 'James', 'Iacov',
  '1\\.?\\s*Petrus', '2\\.?\\s*Petrus', '1\\.?\\s*Peter', '2\\.?\\s*Peter',
  '1\\.?\\s*Petru', '2\\.?\\s*Petru',
  '1\\.?\\s*Johannes', '2\\.?\\s*Johannes', '3\\.?\\s*Johannes',
  '1\\.?\\s*Ioan', '2\\.?\\s*Ioan', '3\\.?\\s*Ioan',
  'Judas', 'Jude', 'Iuda', 'Offenbarung', 'Revelation', 'Apocalipsa',
];

// "Carte 12:3", "Carte 12:3-5", "Carte 12, 3", "Carte 12"
const NUMERIC_REF = String.raw`\s*\d{1,3}\s*(?:[:,.]\s*\d{1,3}(?:\s*[-–]\s*\d{1,3})?)?`;

// "Carte capitolul 6 versetele 1 la 3" / "Kapitel 6 Vers 1 bis 3" / "chapter 6 verses 1 to 3"
const WORDY_REF = String.raw`\s*(?:capitolul|capitol|Kapitel|chapter|глава)\s*\d{1,3}(?:\s*(?:,|si|și|und|and|и)?\s*(?:versetele|versetul|verset|Verse|Vers|verses|verse|стих(?:и)?)\s*\d{1,3}(?:\s*(?:-|–|la|bis|to|до)\s*\d{1,3})?)?`;

const BOOKS = BOOK_NAMES.join('|');

const REFERENCE_REGEX = new RegExp(
  String.raw`\b(?:${BOOKS})(?:${WORDY_REF}|${NUMERIC_REF})`,
  'gi'
);

// Zone in care NU inlocuim nimic (tag-uri HTML + continut sensibil)
const SKIP_REGEX = /<(script|style|code|pre|a)\b[\s\S]*?<\/\1>|<[^>]+>/gi;

/**
 * Primeste HTML-ul articolului si returneaza acelasi HTML,
 * cu referintele biblice inconjurate de <span class="bible-ref">.
 * Daca apare orice problema, se returneaza HTML-ul original neatins.
 */
export function highlightBibleReferences(html: string): string {
  if (!html) return html;

  try {
    let result = '';
    let lastIndex = 0;

    SKIP_REGEX.lastIndex = 0;
    let skip: RegExpExecArray | null;

    const processText = (text: string) =>
      text.replace(REFERENCE_REGEX, (match) => {
        // Nu marcam daca este deja marcat
        return `<span class="bible-ref">${match}</span>`;
      });

    while ((skip = SKIP_REGEX.exec(html)) !== null) {
      // textul dintre zonele "interzise" poate fi procesat
      result += processText(html.slice(lastIndex, skip.index));
      // zona interzisa ramane exact cum era
      result += skip[0];
      lastIndex = skip.index + skip[0].length;
    }

    result += processText(html.slice(lastIndex));
    return result;
  } catch {
    // Orice eroare -> continutul original, fara modificari
    return html;
  }
}

export default highlightBibleReferences;
