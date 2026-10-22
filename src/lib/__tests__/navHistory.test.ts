/**
 * Pasul 2210010 — harta istoricului: fiecare intrare noua primeste un numar,
 * iar „inapoi la X" afla cati pasi are de facut.
 */

import { installNavTracking, trackPath, stepsBackTo, listMatcher } from '@/lib/navHistory';

/** Simuleaza o navigare: `push` adauga o intrare, `replace` o inlocuieste. */
function go(path: string, how: 'push' | 'replace' = 'push') {
  if (how === 'push') window.history.pushState({}, '', path);
  else window.history.replaceState({}, '', path);
  trackPath(path);
}

describe('navHistory', () => {
  beforeAll(() => installNavTracking());
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('afla cati pasi inapoi e o pagina', () => {
    trackPath('/');
    go('/blogs');
    go('/blogs/ceva');
    expect(stepsBackTo('/')).toBe(2);
    expect(stepsBackTo('/blogs')).toBe(1);
    expect(stepsBackTo('/nu-exista')).toBe(0);
  });

  it('distanta pana la origine se numara corect si dupa multe plimbari', () => {
    trackPath('/');
    go('/andacht');
    for (let i = 0; i < 6; i += 1) {
      go('/andacht/arhiva');
      go('/andacht');
    }
    expect(stepsBackTo('/')).toBe(13);
  });

  it('dupa o intoarcere prin istoric harta ramane corecta', () => {
    trackPath('/');
    go('/blogs');
    go('/blogs/ceva');
    // „inapoi" doua pagini: intrarea tinta isi aduce numarul din state
    window.history.replaceState({ radikalIdx: 0 }, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate', { state: { radikalIdx: 0 } }));
    trackPath('/');
    go('/contact');
    expect(stepsBackTo('/')).toBe(1);
    expect(stepsBackTo('/blogs')).toBe(0);
  });

  it('replace nu adauga o intrare', () => {
    trackPath('/');
    go('/auth/login');
    go('/', 'replace');
    expect(stepsBackTo('/')).toBe(1);
    expect(stepsBackTo('/auth/login')).toBe(0);
  });

  it('lista unui articol: lista sau rubrica da, alt articol nu', () => {
    const isList = listMatcher('/marturii', '/marturii/m');
    expect(isList('/marturii')).toBe(true);
    expect(isList('/marturii/rubrica')).toBe(true);
    expect(isList('/marturii/m/una')).toBe(false);
    expect(isList('/blogs')).toBe(false);

    trackPath('/');
    go('/marturii/rubrica');
    go('/marturii/m/una');
    go('/marturii/m/alta');
    expect(stepsBackTo(isList)).toBe(2);
  });
});
