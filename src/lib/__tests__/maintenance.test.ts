// Pasul 2308010 — teste pentru ecranul „în lucru" (Baustelle).
//
// Bug-ul reparat: dacă adminul scria un mesaj propriu („Wir arbeiten") și nu
// punea `{date}` în el, data aleasă nu apărea nicăieri pe ecran.

import {
  buildMaintenanceMessage,
  formatReturnDate,
  DEFAULT_MAINTENANCE,
  DEFAULT_MESSAGE_NO_DATE,
} from '@/lib/maintenance';

describe('formatReturnDate', () => {
  it('scrie data frumos în fiecare limbă', () => {
    expect(formatReturnDate('2026-09-15', 'de')).toBe('15. September 2026');
    expect(formatReturnDate('2026-09-15', 'ro')).toBe('15 septembrie 2026');
    expect(formatReturnDate('2026-09-15', 'en')).toBe('September 15, 2026');
  });

  it('întoarce gol pentru o dată lipsă sau greșită', () => {
    expect(formatReturnDate('', 'de')).toBe('');
    expect(formatReturnDate('nu-e-o-data', 'de')).toBe('');
  });
});

describe('buildMaintenanceMessage', () => {
  it('folosește textul implicit cu data, dacă adminul nu scrie nimic', () => {
    const msg = buildMaintenanceMessage(
      { ...DEFAULT_MAINTENANCE, returnDate: '2026-09-15' },
      'de',
    );
    expect(msg).toContain('15. September 2026');
  });

  it('folosește varianta fără dată când nu există dată', () => {
    const msg = buildMaintenanceMessage(DEFAULT_MAINTENANCE, 'de');
    expect(msg).toBe(DEFAULT_MESSAGE_NO_DATE.de);
  });

  it('respectă poziția aleasă de admin pentru {date}', () => {
    const msg = buildMaintenanceMessage(
      {
        ...DEFAULT_MAINTENANCE,
        returnDate: '2026-09-15',
        message: { de: 'Zurück am {date}. Bis bald!' },
      },
      'de',
    );
    expect(msg).toBe('Zurück am 15. September 2026. Bis bald!');
  });

  it('adaugă data la final dacă adminul a uitat {date}', () => {
    const msg = buildMaintenanceMessage(
      {
        ...DEFAULT_MAINTENANCE,
        returnDate: '2026-09-15',
        message: { de: 'Wir arbeiten' },
      },
      'de',
    );
    expect(msg).toBe('Wir arbeiten Wir sind zurück am 15. September 2026.');
  });

  it('lasă textul neatins dacă nu există dată', () => {
    const msg = buildMaintenanceMessage(
      { ...DEFAULT_MAINTENANCE, message: { de: 'Wir arbeiten' } },
      'de',
    );
    expect(msg).toBe('Wir arbeiten');
  });
});
