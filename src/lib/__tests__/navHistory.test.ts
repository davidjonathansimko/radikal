/**
 * Pasul 2210007 — testele pentru istoricul de navigare: pagina de dinainte
 * trebuie retinuta corect, ca „inapoi" sa nu se invarta in cerc.
 */

import { trackPath, previousPath, cameFromList } from '@/lib/navHistory';

describe('navHistory', () => {
  beforeEach(() => sessionStorage.clear());

  it('retine pagina de dinaintea celei de acum', () => {
    trackPath('/andacht');
    trackPath('/andacht/arhiva');
    expect(previousPath()).toBe('/andacht');
  });

  it('nu schimba nimic cand pagina ramane aceeasi', () => {
    trackPath('/a');
    trackPath('/b');
    trackPath('/b');
    expect(previousPath()).toBe('/a');
  });

  it('plimbarea intre doua pagini tine mereu minte cealalta', () => {
    for (let i = 0; i < 5; i += 1) {
      trackPath('/andacht');
      trackPath('/andacht/arhiva');
    }
    expect(previousPath()).toBe('/andacht');
  });

  it('recunoaste ca ai venit din lista, nu dintr-un alt articol', () => {
    trackPath('/blogs');
    trackPath('/blogs/ceva');
    expect(cameFromList('/blogs', '/blogs')).toBe(true);

    trackPath('/blogs/altceva');
    expect(cameFromList('/blogs', '/blogs')).toBe(false);
  });

  it('la marturii, o rubrica conteaza ca lista, o marturie nu', () => {
    trackPath('/marturii/rubrica');
    trackPath('/marturii/m/una');
    expect(cameFromList('/marturii', '/marturii/m')).toBe(true);

    trackPath('/marturii/m/alta');
    expect(cameFromList('/marturii', '/marturii/m')).toBe(false);
  });
});
