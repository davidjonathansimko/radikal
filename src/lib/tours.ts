// Textele prezentarii paginii Blogs (se arata o singura data, pe telefon/tableta).

import type { TourStep } from '@/components/PageTour';

export const BLOGS_TOUR: TourStep[] = [
  {
    target: '[data-tour="cats"]',
    gesture: 'swipe',
    title: { de: 'Kategorien', en: 'Categories', ro: 'Categorii', ru: 'Категории' },
    text: {
      de: 'Wische nach links und rechts, um alle Kategorien zu sehen. Tippe auf eine Kategorie, um nur diese Blogs zu zeigen.',
      en: 'Swipe left and right to see all categories. Tap a category to show only those blogs.',
      ro: 'Glisează la stânga și la dreapta ca să vezi toate categoriile. Atinge o categorie ca să vezi doar blogurile ei.',
      ru: 'Листайте влево и вправо, чтобы увидеть все категории. Нажмите на категорию, чтобы показать только её блоги.',
    },
  },
  {
    target: '[data-tour="cards"]',
    gesture: 'swipe',
    title: { de: 'Blogs zum Durchwischen', en: 'Blogs to swipe through', ro: 'Bloguri de glisat', ru: 'Блоги для просмотра' },
    text: {
      de: 'Wische seitlich durch jede Reihe: empfohlene Blogs, die neuesten und, weiter unten, die Serien. Tippe auf ein Bild, um zu lesen.',
      en: 'Swipe sideways through each row: recommended blogs, the latest ones and, further down, the series. Tap a picture to read.',
      ro: 'Glisează lateral prin fiecare rând: bloguri recomandate, cele mai noi și, mai jos, serii. Atinge o imagine ca să citești.',
      ru: 'Листайте каждый ряд вбок: рекомендуемые, новые и ниже — серии. Нажмите на картинку, чтобы читать.',
    },
  },
  {
    target: '[data-tour="archive"]',
    gesture: 'tap',
    title: { de: 'Archiv', en: 'Archive', ro: 'Arhivă', ru: 'Архив' },
    text: {
      de: 'Hier findest du alle Blogs, geordnet nach Jahr und Monat.',
      en: 'Here you find all blogs, sorted by year and month.',
      ro: 'Aici găsești toate blogurile, aranjate pe ani și luni.',
      ru: 'Здесь все блоги, по годам и месяцам.',
    },
  },
  {
    target: '[data-tour="series"]',
    gesture: 'tap',
    optional: true,
    title: { de: 'Serien', en: 'Series', ro: 'Serii', ru: 'Серии' },
    text: {
      de: 'Zusammengehörige Blogs, in der Reihenfolge gelesen, in der sie gedacht sind.',
      en: 'Blogs that belong together, to be read in the order they were meant to be.',
      ro: 'Bloguri care merg împreună, de citit în ordinea gândită.',
      ru: 'Связанные между собой блоги — читайте в задуманном порядке.',
    },
  },
];
