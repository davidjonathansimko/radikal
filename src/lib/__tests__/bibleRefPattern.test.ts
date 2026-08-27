// =====================================================================
// Pasul 2208002 (punctul 5) — Teste pentru referintele biblice
// =====================================================================
// Bug-ul care a dus la aceste teste:
//   Textul original „Luca 20:21-22" tradus de DeepL in germana devine
//   „Lukas 20,21–22" (VIRGULA + linie lunga). Vechiul tipar accepta doar
//   `:`, deci se colora numai „Lukas 20", iar „,21–22" ramanea alb.
//
// Rulare:  npx jest src/lib/__tests__/bibleRefPattern.test.ts
// =====================================================================

import { findBibleRefs, buildBibleRefRegex } from '../bibleRefPattern';

describe('referinte biblice — forma simpla', () => {
  it('gaseste „Luca 20:21-22"', () => {
    expect(findBibleRefs('După cum scrie în Luca 20:21-22, adevărul...')).toContain(
      'Luca 20:21-22',
    );
  });

  it('gaseste referinta fara verset: „Ioan 3"', () => {
    expect(findBibleRefs('Citim în Ioan 3 despre naștere.')).toContain('Ioan 3');
  });

  it('gaseste referinta cu numar in fata: „1 Corinteni 13:4"', () => {
    const found = findBibleRefs('vezi 1 Corinteni 13:4 aici');
    expect(found.join(' ')).toContain('Corinteni 13:4');
  });
});

describe('BUG-ul „Lukas 20,21–22" — traducerea germana', () => {
  it('prinde referinta INTREAGA, cu virgula si linie lunga', () => {
    const found = findBibleRefs('Wie in Lukas 20,21\u201322 geschrieben steht.');
    expect(found).toContain('Lukas 20,21\u201322');
  });

  it('NU se opreste dupa capitol', () => {
    const found = findBibleRefs('Lukas 20,21\u201322');
    // Daca ar fi gresit, am primi doar „Lukas 20"
    expect(found[0]).not.toBe('Lukas 20');
  });

  it('accepta si liniuta obisnuita', () => {
    expect(findBibleRefs('Lukas 20,21-22')).toContain('Lukas 20,21-22');
  });

  it('accepta punctul ca separator: „Johannes 3.16"', () => {
    expect(findBibleRefs('Johannes 3.16')).toContain('Johannes 3.16');
  });

  it('accepta liste de versete: „Psalm 22,1,4"', () => {
    expect(findBibleRefs('Psalm 22,1,4')).toContain('Psalm 22,1,4');
  });
});

describe('forma scrisa in cuvinte', () => {
  it('romana: „Neemia capitolul 6 versetele 1 la 3"', () => {
    const found = findBibleRefs('Neemia capitolul 6 versetele 1 la 3');
    expect(found.join(' ')).toContain('capitolul 6');
  });

  it('germana: „Nehemia Kapitel 6 Vers 1 bis 3"', () => {
    const found = findBibleRefs('Nehemia Kapitel 6 Vers 1 bis 3');
    expect(found.join(' ')).toContain('Kapitel 6');
  });

  it('engleza: „Nehemiah chapter 6 verses 1 to 3"', () => {
    const found = findBibleRefs('Nehemiah chapter 6 verses 1 to 3');
    expect(found.join(' ')).toContain('chapter 6');
  });
});

describe('fragmente marcate MANUAL in admin', () => {
  it('gaseste fragmentul chiar daca textul a fost tradus', () => {
    // Adminul a marcat in romana, textul e afisat in germana
    const found = findBibleRefs('Steht in Lukas 20,21\u201322 klar.', ['Lukas 20:21-22']);
    expect(found.length).toBeGreaterThan(0);
  });

  it('lista goala de fragmente manuale nu strica nimic', () => {
    expect(findBibleRefs('Ioan 3:16', [])).toContain('Ioan 3:16');
  });

  it('valorile invalide sunt ignorate fara sa arunce eroare', () => {
    expect(() =>
      // valori gresite pot ajunge din baza de date
      findBibleRefs('Ioan 3:16', ['', '   ', null as unknown as string]),
    ).not.toThrow();
  });
});

describe('text fara referinte', () => {
  it('nu gaseste nimic intr-un text obisnuit', () => {
    expect(findBibleRefs('Aceasta este o propoziție normală.')).toHaveLength(0);
  });

  it('nu confunda un numar simplu cu o referinta', () => {
    expect(findBibleRefs('Erau 20 de oameni acolo.')).toHaveLength(0);
  });
});

describe('regex-ul in sine', () => {
  it('are steagurile `g` si `i`', () => {
    const re = buildBibleRefRegex();
    expect(re.flags).toContain('g');
    expect(re.flags).toContain('i');
  });

  it('`split` produce grupuri care pot fi colorate', () => {
    const re = buildBibleRefRegex();
    const parts = 'Text Ioan 3:16 sfârșit'.split(re);
    expect(parts.length).toBeGreaterThan(1);
  });
});
