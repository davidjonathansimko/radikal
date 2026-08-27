// =====================================================================
// Pasul 2308002 — impartirea textului in "pagini" (reels + Play Blog)
// ---------------------------------------------------------------------
// PROBLEMA REZOLVATA AICI:
// Textul era taiat in propozitii cu o regula simpla: "orice punct incheie
// o propozitie". Dar in germana (si in romana) referintele biblice incep cu
// un numar urmat de punct:  "(1. Korinther 3,13)".
// Vechea regula vedea acel "1." ca sfarsit de propozitie si rupea referinta
// in doua pagini:  pagina 1 se termina cu "(1."  →  pagina 2 incepea cu
// "Korinther 3,13)".  Arata gresit si se citea gresit.
//
// SOLUTIA are trei straturi:
//   1. "Protejam" punctele care NU incheie o propozitie (numere de carti
//      biblice, prescurtari uzuale, initiale) inlocuindu-le temporar cu un
//      caracter invizibil, si le punem la loc la final.
//   2. Cand o propozitie e prea lunga si trebuie taiata in cuvinte,
//      tratam grupurile din paranteze "(...)" ca pe un SINGUR cuvant,
//      ca sa nu se rupa niciodata o referinta la mijloc.
//   3. O referinta scurta ramasa singura pe o pagina este lipita inapoi
//      de pagina precedenta.
// =====================================================================

/** Caracter invizibil, folosit doar intern, ca marcaj temporar pentru punct */
const DOT = '\u0001';

/**
 * Prescurtari dupa care punctul NU inseamna sfarsit de propozitie.
 * Acopera germana, romana si engleza — limbile site-ului.
 */
const ABBREVIATIONS = [
  // Referinte / structura biblica
  'Kap', 'Kapitel', 'V', 'Vers', 'Verse', 'vgl', 'ff', 'f',
  'cap', 'v', 'vv',
  // Carti biblice prescurtate frecvent
  'Mt', 'Mk', 'Lk', 'Joh', 'Apg', 'Röm', 'Kor', 'Gal', 'Eph', 'Phil',
  'Kol', 'Thess', 'Tim', 'Tit', 'Hebr', 'Jak', 'Petr', 'Offb',
  'Mos', 'Mose', 'Sam', 'Kön', 'Chr', 'Ps', 'Spr', 'Pred', 'Jes', 'Jer',
  'Hes', 'Dan', 'Hos', 'Mi', 'Hab', 'Zeph', 'Hag', 'Sach', 'Mal',
  // Prescurtari generale
  'bzw', 'ca', 'usw', 'etc', 'evtl', 'ggf', 'inkl', 'Nr', 'S', 'Hl',
  'z', 'B', 'd', 'h', 'u', 'a', 'sog', 'Dr', 'Prof', 'St',
];

/**
 * Ascunde punctele care nu incheie propozitii.
 * Se aplica INAINTE de impartirea in propozitii.
 */
function protectDots(text: string): string {
  let out = text;

  // 1) Numar urmat de punct si de un cuvant cu litera mare:
  //    "1. Korinther", "2. Mose", "3. Johannes"
  //    Acesta era cazul care strica totul.
  out = out.replace(/(\d)\.(\s+)(?=[A-ZÄÖÜÁÂÎȘȚ])/g, `$1${DOT}$2`);

  // 2) Numar urmat imediat de punct si litera: "1.Korinther"
  out = out.replace(/(\d)\.(?=[A-ZÄÖÜÁÂÎȘȚ])/g, `$1${DOT}`);

  // 3) Prescurtari cunoscute: "Kap.", "vgl.", "Offb."
  const abbrPattern = new RegExp(`\\b(${ABBREVIATIONS.join('|')})\\.`, 'g');
  out = out.replace(abbrPattern, `$1${DOT}`);

  // 4) Initiale de o singura litera mare: "C. S. Lewis"
  out = out.replace(/\b([A-ZÄÖÜ])\.(?=\s)/g, `$1${DOT}`);

  // 5) Numerotari de tip "3.13" sau "3.13-15" (capitol.verset)
  out = out.replace(/(\d)\.(?=\d)/g, `$1${DOT}`);

  return out;
}

/** Pune la loc punctele ascunse */
function restoreDots(text: string): string {
  return text.split(DOT).join('.');
}

/**
 * Imparte o propozitie in "unitati atomice" (pseudo-cuvinte).
 * Un grup intre paranteze — de obicei o referinta biblica — ramane
 * o singura unitate, deci nu poate fi rupt intre doua pagini.
 */
function atomicTokens(sentence: string): string[] {
  const tokens: string[] = [];
  let buffer = '';
  let depth = 0;

  for (const char of sentence) {
    if (char === '(' || char === '[') depth += 1;

    if (/\s/.test(char) && depth === 0) {
      if (buffer) tokens.push(buffer);
      buffer = '';
    } else {
      buffer += char;
    }

    if (char === ')' || char === ']') depth = Math.max(0, depth - 1);
  }

  if (buffer) tokens.push(buffer);
  return tokens;
}

/** Numarul implicit de caractere care incap confortabil pe o pagina */
export const MAX_CHARS_PER_PAGE = 180;

/**
 * Imparte un text lung in pagini care incap pe ecran.
 * Taie la limita de propozitie; daca o propozitie e prea lunga,
 * taie la limita de cuvant — dar niciodata in interiorul unei paranteze.
 */
export function paginateText(text: string, maxChars = MAX_CHARS_PER_PAGE): string[] {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  const protectedText = protectDots(clean);

  // Impartim in propozitii — acum punctele "false" nu mai incurca
  const sentences = protectedText.match(/[^.!?…]+[.!?…]*\s*/g) || [protectedText];

  const pages: string[] = [];
  let current = '';

  const flush = () => {
    if (current.trim()) pages.push(current.trim());
    current = '';
  };

  sentences.forEach((raw) => {
    const sentence = raw.trim();
    if (!sentence) return;

    // Propozitia incape langa ce am adunat pana acum
    if (current && (current + ' ' + sentence).length <= maxChars) {
      current = `${current} ${sentence}`;
      return;
    }

    // Propozitia incape singura pe o pagina
    if (sentence.length <= maxChars) {
      flush();
      current = sentence;
      return;
    }

    // Propozitie prea lunga -> o taiem la cuvinte, cu parantezele intacte
    flush();
    atomicTokens(sentence).forEach((token) => {
      if (current && (current + ' ' + token).length > maxChars) flush();
      current = current ? `${current} ${token}` : token;
    });
  });

  flush();

  // Ultima grija: daca ultima pagina e doar o coada scurta
  // (de exemplu doar referinta), o lipim de pagina dinainte.
  if (pages.length > 1) {
    const last = pages[pages.length - 1];
    const prev = pages[pages.length - 2];
    if (last.length < 40 && (prev + ' ' + last).length <= maxChars * 1.15) {
      pages.splice(pages.length - 2, 2, `${prev} ${last}`);
    }
  }

  return pages.map(restoreDots).filter(Boolean);
}

export default paginateText;

// =====================================================================
// Pasul 2308003 — pagini peste un ARRAY de cuvinte (pentru Play Blog)
// ---------------------------------------------------------------------
// La Play Blog, vocea ne spune „am ajuns la cuvantul N". Deci nu putem
// lucra cu text, ci cu acelasi array de cuvinte pe care il foloseste
// sincronizarea. Functia de mai jos imparte ACEL array in pagini,
// respectand exact aceleasi reguli: nu rupem paranteze, preferam sa
// inchidem pagina la sfarsit de propozitie.
// =====================================================================

export interface WordPage {
  /** indexul primului cuvant din pagina (inclusiv) */
  start: number;
  /** indexul de dupa ultimul cuvant din pagina (exclusiv) */
  end: number;
}

/** Cuvantul incheie o propozitie? (punctul „fals" din referinte nu conteaza) */
function endsSentence(word: string): boolean {
  // "1." sau "3.13" nu incheie propozitia
  if (/^\(?\d+[.,]?\)?$/.test(word)) return false;
  if (/\d\.$/.test(word)) return false;
  // prescurtare cunoscuta urmata de punct
  const bare = word.replace(/[)"'»„“]+$/, '').replace(/\.$/, '');
  if (ABBREVIATIONS.includes(bare)) return false;
  return /[.!?…]["'»„“)\]]*$/.test(word);
}

/**
 * Imparte lista de cuvinte in pagini care incap pe ecran.
 *
 * @param words    cuvintele, exact in ordinea in care sunt rostite
 * @param maxChars cate caractere incap confortabil pe o pagina
 * @param minWords sub acest numar nu inchidem pagina, chiar daca s-a
 *                 terminat o propozitie (altfel ar clipi pagini de 2 cuvinte)
 */
export function paginateWords(
  words: string[],
  maxChars = MAX_CHARS_PER_PAGE,
  minWords = 6,
): WordPage[] {
  if (!words.length) return [];

  const pages: WordPage[] = [];
  let start = 0;
  let length = 0;
  let depth = 0;

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];

    // Urmarim parantezele: cat timp suntem in interior, NU inchidem pagina
    for (const ch of word) {
      if (ch === '(' || ch === '[') depth += 1;
      else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    }

    length += word.length + 1;
    const count = i - start + 1;

    const tooLong = length >= maxChars;
    const naturalBreak = endsSentence(word) && count >= minWords;

    if (depth === 0 && (naturalBreak || tooLong)) {
      pages.push({ start, end: i + 1 });
      start = i + 1;
      length = 0;
    }
  }

  if (start < words.length) {
    // Coada foarte scurta -> o lipim de pagina dinainte
    if (pages.length && words.length - start <= 2) {
      pages[pages.length - 1].end = words.length;
    } else {
      pages.push({ start, end: words.length });
    }
  }

  return pages;
}

/** In ce pagina se afla cuvantul cu indexul dat? */
export function pageIndexForWord(pages: WordPage[], wordIndex: number): number {
  if (!pages.length) return 0;
  for (let i = 0; i < pages.length; i += 1) {
    if (wordIndex < pages[i].end) return i;
  }
  return pages.length - 1;
}

