// =====================================================================
// Pasul 2208002 (punctul 5) — TIPARUL referintelor biblice, testabil
// =====================================================================
// Pana acum, tot acest cod statea ascuns in interiorul paginii de blog,
// deci nu putea fi testat. Bug-ul „Lukas 20,21–22" (jumatate colorata,
// jumatate alba) ar fi fost prins de un test de cateva randuri.
//
// Aici este DOAR logica pura: text intra, tipar iese. Fara React.
// Testele sunt in `src/lib/__tests__/bibleRefPattern.test.ts`.
// =====================================================================

/** Separatori intre capitol si verset: `:` `.` `,` si doua puncte late */
export const CHAP_SEP = '[:.,\uFF1A]';

/** Toate liniutele folosite in practica: - ‐ ‑ ‒ – — */
export const DASH = '[-\u2010\u2011\u2012\u2013\u2014]';

/** Caracterele speciale din regex devin literale */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Numele cartilor biblice in romana, germana, engleza si rusa */
export const BIBLE_BOOKS: string[] = [
  // Romana
  'Geneza', 'Exodul', 'Leviticul', 'Numeri', 'Deuteronomul',
  'Iosua', 'Judecători', 'Rut', 'Samuel', 'Împărați', 'Cronici',
  'Ezra', 'Neemia', 'Estera', 'Iov', 'Psalmii', 'Psalmi', 'Psalmul',
  'Proverbele', 'Proverbe', 'Eclesiastul', 'Cântarea Cântărilor',
  'Isaia', 'Ieremia', 'Plângerile', 'Ezechiel', 'Daniel', 'Osea',
  'Ioel', 'Amos', 'Obadia', 'Iona', 'Mica', 'Naum', 'Habacuc',
  'Țefania', 'Hagai', 'Zaharia', 'Maleahi',
  'Matei', 'Marcu', 'Luca', 'Ioan', 'Faptele Apostolilor', 'Faptele',
  'Romani', 'Corinteni', 'Galateni', 'Efeseni', 'Filipeni',
  'Coloseni', 'Tesaloniceni', 'Timotei', 'Tit', 'Filimon',
  'Evrei', 'Iacov', 'Petru', 'Iuda', 'Apocalipsa',
  // Germana
  'Genesis', 'Exodus', 'Levitikus', 'Deuteronomium',
  'Josua', 'Richter', 'Ruth', 'Könige', 'Chronik',
  'Esra', 'Nehemia', 'Ester', 'Hiob', 'Psalmen', 'Psalm',
  'Sprüche', 'Prediger', 'Hoheslied',
  'Jesaja', 'Jeremia', 'Klagelieder', 'Hesekiel', 'Hosea',
  'Joel', 'Obadja', 'Jona', 'Micha', 'Nahum', 'Habakuk',
  'Zefanja', 'Haggai', 'Sacharja', 'Maleachi',
  'Matthäus', 'Markus', 'Lukas', 'Johannes', 'Apostelgeschichte',
  'Römer', 'Korinther', 'Galater', 'Epheser', 'Philipper',
  'Kolosser', 'Thessalonicher', 'Timotheus', 'Titus', 'Philemon',
  'Hebräer', 'Jakobus', 'Judas', 'Offenbarung',
  // Engleza
  'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Kings', 'Chronicles',
  'Nehemiah', 'Esther', 'Job', 'Psalms',
  'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Song of Songs',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel',
  'Obadiah', 'Jonah', 'Micah', 'Habakkuk',
  'Zephaniah', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', 'Corinthians', 'Galatians', 'Ephesians', 'Philippians',
  'Colossians', 'Thessalonians', 'Timothy', 'Philemon',
  'Hebrews', 'James', 'Peter', 'Jude', 'Revelation',
  // Rusa
  'Бытие', 'Исход', 'Левит', 'Числа', 'Второзаконие',
  'Иисус Навин', 'Судей', 'Руфь', 'Царств', 'Паралипоменон',
  'Ездра', 'Неемия', 'Есфирь', 'Иов', 'Псалом', 'Псалмы', 'Псалтирь',
  'Притчи', 'Екклесиаст', 'Песня Песней',
  'Исаия', 'Иеремия', 'Плач Иеремии', 'Иезекииль', 'Даниил', 'Осия',
  'Иоиль', 'Амос', 'Авдий', 'Иона', 'Михей', 'Наум', 'Аввакум',
  'Софония', 'Аггей', 'Захария', 'Малахия',
  'Матфей', 'Марка', 'Лука', 'Иоанна', 'Деяния',
  'Римлянам', 'Коринфянам', 'Галатам', 'Ефесянам', 'Филиппийцам',
  'Колоссянам', 'Фессалоникийцам', 'Тимофею', 'Титу', 'Филимону',
  'Евреям', 'Иакова', 'Петра', 'Иуды', 'Откровение',
];

/**
 * Un fragment marcat manual de admin este scris in ROMANA („Luca 20:21-22"),
 * dar textul afisat poate fi tradus („Lukas 20,21–22"). De aceea NU cautam
 * textul exact, ci construim un tipar tolerant la separatori si spatii.
 */
export function manualRefToPattern(ref: string): string {
  return escapeRegex(ref)
    // Pasul 2308003: punctul de la SFARSIT nu face parte din referinta
    // („Neemia, capitolul 6, versetele 1 la 3." <- punctul e al propozitiei).
    // Daca il pastram, tiparul nu se mai potriveste pe textul tradus.
    .replace(/\\?\.\s*$/, '')
    .replace(/\\?[:.,\uFF1A]/g, CHAP_SEP)
    .replace(/\\?[-\u2010\u2011\u2012\u2013\u2014]/g, DASH)
    .replace(/\s+/g, '\\s*');
}

/**
 * Construieste tiparul complet pentru referintele biblice.
 * @param manualRefs fragmentele marcate manual in admin (optional)
 */
export function buildBibleRefRegex(manualRefs: string[] = []): RegExp {
  const uniqueBooks = [...new Set(BIBLE_BOOKS)].sort((a, b) => b.length - a.length);
  const bookPattern = uniqueBooks.map(escapeRegex).join('|');

  // Forma scrisa in cuvinte: „Neemia capitolul 6 versetele 1 la 3"
  // Pasul 2308003 — BUG REPARAT: intre numele cartii si „capitolul" poate sta
  // o VIRGULA. In textul real scrie „Nehemia, Kapitel 6, Verse 1 bis 3."
  // Vechiul tipar accepta doar spatiu, deci nu recunostea nimic si
  // referinta ramanea alba, desi era marcata in admin.
  const wordy =
    '[\\s,]*(?:capitolul|capitol|Kapitel|chapter|\u0433\u043b\u0430\u0432\u0430)\\s*\\d{1,3}' +
    '(?:[\\s,]*(?:si|\u0219i|und|and|\u0438)?\\s*' +
    '(?:versetele|versetul|verset|Verse|Vers|verses|verse|\u0441\u0442\u0438\u0445\u0438|\u0441\u0442\u0438\u0445)\\s*\\d{1,3}' +
    '(?:\\s*(?:-|\u2013|la|bis|to|\u0434\u043e)\\s*\\d{1,3})?)?';

  // Forma numerica: „Luca 20:21-22", „Lukas 20,21–22", „Psalm 22,1,4"
  const verseRange = `\\d{1,3}(?:\\s*${DASH}\\s*\\d{1,3})?`;
  const numeric =
    `\\s+\\d{1,3}` +
    `(?:\\s*${CHAP_SEP}\\s*${verseRange}(?:\\s*,\\s*${verseRange})*)?`;

  const cleanManual = manualRefs
    .filter((r) => typeof r === 'string' && r.trim().length > 0)
    .sort((a, b) => b.length - a.length);

  const manualPattern = cleanManual.map(manualRefToPattern).join('|');

  const auto = `\\(?\\s*(?:\\d\\s*)?(?:${bookPattern})(?:${wordy}|${numeric})\\s*\\)?`;

  return new RegExp(manualPattern ? `(${manualPattern}|${auto})` : `(${auto})`, 'gi');
}

/**
 * Gaseste toate referintele dintr-un text. Folosita in teste si oriunde
 * este nevoie de lista lor, fara React.
 */
export function findBibleRefs(text: string, manualRefs: string[] = []): string[] {
  const re = buildBibleRefRegex(manualRefs);
  return (text.match(re) ?? []).map((m) => m.trim());
}
