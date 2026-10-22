// Pasul 2210004 — textele paginilor „Tägliche Andacht" si „Pentru copii".
// Stau aici ca sa poata fi editate din Setari -> Pagini (vezi pageDefaults.ts).

type Lang = 'ro' | 'de' | 'en' | 'ru';
type Texts = Record<Lang, Record<string, string>>;

export const ANDACHT_TEXTS: Texts = {
  de: {
    heading: 'Tägliche Andacht',
    today: 'Heute',
    updating: 'Wird für heute aktualisiert …',
    recent: 'Die letzten Tage',
    archive: 'Archiv',
    archiveTitle: 'Archiv',
    archiveEmpty: 'Das Archiv ist noch leer.',
    empty: 'Hier gibt es noch nichts.',
    read: 'Lesen',
    back: 'Zurück zur Andacht',
    loading: 'Wird geladen …',
  },
  en: {
    heading: 'Daily Devotion',
    today: 'Today',
    updating: 'Updating for today …',
    recent: 'The last days',
    archive: 'Archive',
    archiveTitle: 'Archive',
    archiveEmpty: 'The archive is still empty.',
    empty: 'There is nothing here yet.',
    read: 'Read',
    back: 'Back to the devotion',
    loading: 'Loading …',
  },
  ro: {
    heading: 'Meditația zilnică',
    today: 'Astăzi',
    updating: 'Se actualizează pentru astăzi …',
    recent: 'Ultimele zile',
    archive: 'Arhivă',
    archiveTitle: 'Arhivă',
    archiveEmpty: 'Arhiva este încă goală.',
    empty: 'Aici nu există încă nimic.',
    read: 'Citește',
    back: 'Înapoi la meditație',
    loading: 'Se încarcă …',
  },
  ru: {
    heading: 'Ежедневное размышление',
    today: 'Сегодня',
    updating: 'Обновляется на сегодня …',
    recent: 'Последние дни',
    archive: 'Архив',
    archiveTitle: 'Архив',
    archiveEmpty: 'Архив пока пуст.',
    empty: 'Здесь пока ничего нет.',
    read: 'Читать',
    back: 'Назад к размышлению',
    loading: 'Загрузка …',
  },
};

export const COPII_TEXTS: Texts = {
  de: {
    ...ANDACHT_TEXTS.de,
    heading: 'Heiligkeit von Kindheit an',
    back: 'Zurück zu „Für Kinder"',
  },
  en: {
    ...ANDACHT_TEXTS.en,
    heading: 'Holiness from childhood',
    back: 'Back to "For Children"',
  },
  ro: {
    ...ANDACHT_TEXTS.ro,
    heading: 'Sfințenie din pruncie',
    back: 'Înapoi la „Pentru copii"',
  },
  ru: {
    ...ANDACHT_TEXTS.ru,
    heading: 'Святость с детства',
    back: 'Назад к «Для детей»',
  },
};
