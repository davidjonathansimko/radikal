// Text pregatit pentru vocea sintetica: ce se scrie intr-un fel se rosteste altfel.

const RANGE_WORD: Record<string, string> = { de: 'bis', en: 'to', ro: 'la', ru: 'по' };

/**
 * „Capitolul 12, versetele 1 - 3" se citea „unu minus trei". Intre doua numere scurte, cratima
 * devine „la" (ro), „bis" (de), „to" (en), „по" (ru). Datele (2020-11-01) raman neatinse.
 */
export function speechText(text: string, language: string): string {
  const word = RANGE_WORD[language] ?? RANGE_WORD.de;
  return text.replace(/(?<![\d\-\u2013\u2014\u2212])(\d{1,4})\s*[-\u2010-\u2015\u2212]\s*(\d{1,4})(?![\d\-\u2013\u2014\u2212])/g, `$1 ${word} $2`);
}
