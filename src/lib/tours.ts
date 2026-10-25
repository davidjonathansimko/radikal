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
    title: { de: 'Die letzten Blogs', en: 'Latest blogs', ro: 'Ultimele bloguri', ru: 'Последние блоги' },
    text: {
      de: 'Wische seitlich durch die letzten 6 Blogs. Tippe auf ein Bild, um zu lesen.',
      en: 'Swipe sideways through the last 6 blogs. Tap a picture to read.',
      ro: 'Glisează lateral prin ultimele 6 bloguri. Atinge o imagine ca să citești.',
      ru: 'Листайте вбок последние 6 блогов. Нажмите на картинку, чтобы читать.',
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
];
