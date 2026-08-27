// Pasul 2308010 — teste pentru impartirea textului in pagini.
//
// De ce aici: exact in zona asta a fost bug-ul cu reels-urile (4 randuri in
// romana deveneau 2 in germana). Testele de mai jos apara comportamentele de
// care depinde afisarea, ca sa nu se strice din nou fara sa observam.

import { paginateText } from '@/lib/paginateText';

describe('paginateText', () => {
  it('returnează listă goală pentru text gol', () => {
    expect(paginateText('')).toEqual([]);
    expect(paginateText('   ')).toEqual([]);
  });

  it('lasă un text scurt pe o singură pagină', () => {
    expect(paginateText('Dumnezeu este bun.')).toEqual(['Dumnezeu este bun.']);
  });

  it('nu rupe o referință biblică ce începe cu cifră și punct', () => {
    const text =
      'Cuvântul lui Dumnezeu rămâne în veac și nimeni nu îl poate schimba, ' +
      'oricât s-ar strădui, pentru că este viu și lucrător în inimile noastre. ' +
      'Așa ne învață Pavel (1. Korinther 3,13) și tot așa ne arată viața.';

    const pages = paginateText(text);

    // Nicio pagină nu are voie să se termine cu „(1." sau să înceapă cu
    // continuarea referinței — asta era bug-ul reparat la pasul 2308002.
    pages.forEach((p) => {
      expect(p.trim().endsWith('(1.')).toBe(false);
      expect(p.trim().startsWith('Korinther')).toBe(false);
    });

    // Referința trebuie să rămână întreagă, pe una dintre pagini.
    expect(pages.some((p) => p.includes('(1. Korinther 3,13)'))).toBe(true);
  });

  it('împarte un text lung în mai multe pagini', () => {
    const propozitie = 'Domnul este păstorul meu și nu voi duce lipsă de nimic. ';
    const pages = paginateText(propozitie.repeat(12));

    expect(pages.length).toBeGreaterThan(1);
    pages.forEach((p) => expect(p.length).toBeLessThanOrEqual(230));
  });

  it('nu pierde niciun cuvânt când împarte', () => {
    const text = 'Unu doi trei patru cinci. '.repeat(20);
    const cuvinteInainte = text.trim().split(/\s+/).length;
    const cuvinteDupa = paginateText(text).join(' ').split(/\s+/).length;

    expect(cuvinteDupa).toBe(cuvinteInainte);
  });
});
