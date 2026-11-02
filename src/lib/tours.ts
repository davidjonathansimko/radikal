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

// Prezentarea paginii unui articol (se arata o singura data, pe telefon).
export const ARTICLE_TOUR: TourStep[] = [
  {
    target: '[data-tour="art-play-blog"]',
    gesture: 'tap',
    optional: true,
    title: { de: 'Blog abspielen', en: 'Play blog', ro: 'Redă blogul', ru: 'Слушать блог' },
    text: {
      de: 'Der Text läuft im Takt der Stimme mit, wie ein Lied zum Mitlesen. Mit dem X oben rechts schließt du ihn.',
      en: 'The text follows the voice word by word, like a song you can read along. Close it with the X at the top right.',
      ro: 'Textul curge odată cu vocea, cuvânt cu cuvânt. Îl închizi cu X-ul din dreapta sus.',
      ru: 'Текст идёт вместе с голосом, слово за словом. Закройте его крестиком справа вверху.',
    },
  },
  {
    target: '[data-tour="art-tools"]',
    gesture: 'tap',
    title: { de: 'Lesewerkzeuge', en: 'Reading tools', ro: 'Unelte de citit', ru: 'Инструменты чтения' },
    text: {
      de: 'A− / A+ ändert die Schriftgröße. PDF speichert den Artikel. Abend schont die Augen mit warmen Farben. Fokus blendet alles außer dem Text aus. Der Pfeil unten rechts bringt dich beim Scrollen wieder nach oben.',
      en: 'A− / A+ changes the text size. PDF saves the article. Evening is gentle on the eyes with warm colors. Focus hides everything but the text. The arrow at the bottom right takes you back up when you scroll.',
      ro: 'A− / A+ schimbă mărimea textului. PDF salvează articolul. Seara folosește culori calde, blânde cu ochii. Focus ascunde tot, în afară de text. Săgeata din dreapta jos te duce înapoi sus când derulezi.',
      ru: 'A− / A+ меняет размер текста. PDF сохраняет статью. «Вечер» — тёплые цвета, щадящие глаза. «Фокус» скрывает всё, кроме текста. Стрелка справа внизу возвращает вверх при прокрутке.',
    },
  },
  {
    target: '[data-tour="art-tts"]',
    gesture: 'tap',
    optional: true,
    title: { de: 'Vorlesen', en: 'Read aloud', ro: 'Ascultare', ru: 'Прослушивание' },
    text: {
      de: 'Play liest den Artikel vor. Mit dem Balken springst du zu einer Stelle, mit 1x änderst du die Geschwindigkeit.',
      en: 'Play reads the article aloud. Drag the bar to jump to a spot; 1x changes the speed.',
      ro: 'Play citește articolul cu voce tare. Cu bara sari la un loc anume, iar 1x schimbă viteza.',
      ru: 'Play читает статью вслух. Полоса — перемотка, 1x — скорость.',
    },
  },
  {
    target: '[data-tour="listen-buttons"]',
    gesture: 'tap',
    optional: true,
    title: { de: 'Jetzt hören und Hörliste', en: 'Listen now and list', ro: 'Ascultă acum și listă', ru: 'Слушать и список' },
    text: {
      de: 'Jetzt hören startet den Mini-Player, der bleibt, wenn du die Seite wechselst. In die Hörliste legt den Artikel in die Warteschlange: danach spielt der nächste von selbst.',
      en: 'Listen now starts the mini player, which stays when you change pages. Add to the listening list queues the article; the next one then plays by itself.',
      ro: 'Ascultă acum pornește playerul mic, care rămâne când schimbi pagina. „În lista de ascultare” pune articolul la coadă: apoi pornește singur următorul.',
      ru: '«Слушать» запускает мини-плеер, который остаётся при смене страницы. «В список» ставит статью в очередь — следующая включится сама.',
    },
  },
];
