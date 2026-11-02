// Textele prezentarilor (Blogs si articol). Se arata o singura data, pe telefon/tableta, si se adapteaza la ce e pornit din admin.

import type { TourStep } from '@/components/PageTour';
import type { UiSettings } from '@/lib/uiSettings';

type Txt = Record<'de' | 'en' | 'ro' | 'ru', string>;
const join = (...parts: (Txt | false | null | undefined)[]): Txt => {
  const list = parts.filter((p): p is Txt => Boolean(p));
  const out = { de: '', en: '', ro: '', ru: '' };
  (['de', 'en', 'ro', 'ru'] as const).forEach((l) => {
    out[l] = list.map((p) => p[l]).join(' ');
  });
  return out;
};

/** Identificatorii tutorialelor (cheia salvata e `radikalTour:<id>`). */
export const TOUR_IDS = { blogs: 'blogs-2', article: 'article-1' } as const;

export function getBlogsTour(ui: Pick<UiSettings, 'miniPlayer' | 'queue' | 'miniPlayerSheet'>): TourStep[] {
  const mini = ui.miniPlayer !== 'off';
  const steps: TourStep[] = [
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
  ];

  if (mini) {
    steps.push({
      target: '[data-tour="mini-player"]',
      gesture: 'tap',
      optional: true,
      title: { de: 'Der kleine Player', en: 'The mini player', ro: 'Playerul mic', ru: 'Мини-плеер' },
      text: join(
        {
          de: 'Solange etwas läuft, bleibt dieser Player unten, auch wenn du die Seite wechselst. Mit dem X schließt du ihn.',
          en: 'While something plays, this player stays at the bottom, even when you change pages. Close it with the X.',
          ro: 'Cât timp rulează ceva, acest player rămâne jos, chiar dacă schimbi pagina. Îl închizi cu X.',
          ru: 'Пока что-то играет, этот плеер остаётся внизу, даже при смене страницы. Закройте его крестиком.',
        },
        {
          de: 'Tippe darauf: dort findest du die Hörliste, Weiter und Zurück (gedrückt halten spult) und weitere Blogs.',
          en: 'Tap it to open the listening list, next and previous (hold to seek) and more blogs.',
          ro: 'Atinge-l: acolo găsești lista de ascultare, înainte și înapoi (ține apăsat ca să derulezi) și alte bloguri.',
          ru: 'Нажмите на него: там список прослушивания, «далее» и «назад» (удерживайте для перемотки) и другие блоги.',
        },
      ),
    });
  }

  steps.push(
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
  );
  return steps;
}

export function getArticleTour(ui: Pick<UiSettings, 'miniPlayer' | 'queue' | 'miniPlayerSheet' | 'hideInlinePlayer'>): TourStep[] {
  const mini = ui.miniPlayer !== 'off';
  const modern = mini && ui.miniPlayerSheet !== 'classic';

  const listenText = join(
    mini && {
      de: '„Jetzt hören“ startet die Stimme im kleinen Player unten. Er bleibt, auch wenn du die Seite wechselst.',
      en: '“Listen now” starts the voice in the mini player at the bottom. It stays when you change pages.',
      ro: '„Ascultă acum” pornește vocea în playerul mic de jos. Rămâne, chiar dacă schimbi pagina.',
      ru: '«Слушать» запускает голос в мини-плеере внизу. Он остаётся при смене страницы.',
    },
    ui.queue && {
      de: '„In die Hörliste“ merkt den Artikel für später vor: danach spielt der nächste von selbst.',
      en: '“Add to the listening list” queues the article for later: the next one then plays by itself.',
      ro: '„În lista de ascultare” pune articolul la coadă: apoi pornește singur următorul.',
      ru: '«В список» ставит статью в очередь: следующая включится сама.',
    },
    modern && {
      de: 'Im Player wechselt Weiter/Zurück den Blog; gedrückt halten spult.',
      en: 'In the player, Next/Previous changes the blog; hold to seek.',
      ro: 'În player, Înainte/Înapoi schimbă blogul; ține apăsat ca să derulezi.',
      ru: 'В плеере «Далее/Назад» меняет блог; удерживайте для перемотки.',
    },
  );

  const steps: TourStep[] = [
    {
      target: '[data-tour="art-play-blog"]',
      gesture: 'tap',
      optional: true,
      title: { de: 'Blog abspielen', en: 'Play blog', ro: 'Redă blogul', ru: 'Слушать блог' },
      text: {
        de: 'Der Text läuft im Takt der Stimme mit, wie ein Lied zum Mitlesen. Mit dem X oben rechts schließt du ihn. Solange er offen ist, ruht der kleine Player.',
        en: 'The text follows the voice word by word, like a song you can read along. Close it with the X at the top right. While it is open, the mini player rests.',
        ro: 'Textul curge odată cu vocea, cuvânt cu cuvânt. Îl închizi cu X-ul din dreapta sus. Cât e deschis, playerul mic stă pe pauză.',
        ru: 'Текст идёт вместе с голосом, слово за словом. Закройте его крестиком справа вверху. Пока он открыт, мини-плеер на паузе.',
      },
    },
    {
      target: '[data-tour="art-read"]',
      gesture: 'tap',
      optional: true,
      title: { de: 'Als gelesen markieren', en: 'Mark as read', ro: 'Marchează ca citit', ru: 'Отметить как прочитанное' },
      text: {
        de: 'Tippe hier, wenn du den Artikel gelesen hast. In den Listen bekommt er dann ein Häkchen. Du kannst es jederzeit wieder entfernen.',
        en: 'Tap here once you have read the article. It then gets a check mark in the lists. You can remove it at any time.',
        ro: 'Atinge aici după ce ai citit articolul. În liste va primi o bifă. O poți scoate oricând.',
        ru: 'Нажмите здесь, когда прочитаете статью. В списках у неё появится галочка. Её можно убрать в любой момент.',
      },
    },
    {
      target: '[data-tour="art-tools"]',
      gesture: 'tap',
      title: { de: 'Lesewerkzeuge', en: 'Reading tools', ro: 'Unelte de citit', ru: 'Инструменты чтения' },
      text: {
        de: 'A− / A+ ändert die Schriftgröße. PDF speichert den Artikel. Abend schont die Augen mit warmen Farben. Fokus blendet alles außer dem Text aus.',
        en: 'A− / A+ changes the text size. PDF saves the article. Evening is gentle on the eyes with warm colors. Focus hides everything but the text.',
        ro: 'A− / A+ schimbă mărimea textului. PDF salvează articolul. Seara folosește culori calde, blânde cu ochii. Focus ascunde tot, în afară de text.',
        ru: 'A− / A+ меняет размер текста. PDF сохраняет статью. «Вечер» — тёплые цвета, щадящие глаза. «Фокус» скрывает всё, кроме текста.',
      },
    },
  ];

  if (!(ui.hideInlinePlayer && mini)) {
    steps.push({
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
    });
  }

  if (mini || ui.queue) {
    steps.push({
      target: '[data-tour="listen-buttons"]',
      gesture: 'tap',
      optional: true,
      title: {
        de: ui.queue && mini ? 'Jetzt hören und Hörliste' : mini ? 'Jetzt hören' : 'Hörliste',
        en: ui.queue && mini ? 'Listen now and list' : mini ? 'Listen now' : 'Listening list',
        ro: ui.queue && mini ? 'Ascultă acum și listă' : mini ? 'Ascultă acum' : 'Lista de ascultare',
        ru: ui.queue && mini ? 'Слушать и список' : mini ? 'Слушать' : 'Список прослушивания',
      },
      text: listenText,
    });
  }

  steps.push(
    {
      target: '[data-tour="art-text"]',
      gesture: 'scroll',
      optional: true,
      title: { de: 'Lesen und scrollen', en: 'Read and scroll', ro: 'Citește și derulează', ru: 'Читайте и листайте' },
      text: {
        de: 'Wische nach oben, um weiterzulesen. Der Pfeil unten rechts bringt dich jederzeit schnell wieder nach oben.',
        en: 'Swipe up to keep reading. The arrow at the bottom right takes you quickly back to the top at any time.',
        ro: 'Glisează în sus ca să continui lectura. Săgeata din dreapta jos te duce oricând rapid înapoi sus.',
        ru: 'Проведите вверх, чтобы читать дальше. Стрелка справа внизу в любой момент возвращает наверх.',
      },
    },
    {
      target: '[data-tour="art-mp3"]',
      gesture: 'tap',
      optional: true,
      title: { de: 'MP3 herunterladen', en: 'Download MP3', ro: 'Descarcă MP3', ru: 'Скачать MP3' },
      text: {
        de: 'Speichert die Stimme dieses Artikels als MP3-Datei (nur für Admins sichtbar).',
        en: 'Saves the voice of this article as an MP3 file (visible to admins only).',
        ro: 'Salvează vocea acestui articol ca fișier MP3 (vizibil doar pentru admin).',
        ru: 'Сохраняет голос статьи как MP3-файл (виден только админам).',
      },
    },
    {
      target: '[data-tour="art-share"]',
      gesture: 'tap',
      optional: true,
      title: { de: 'Teilen', en: 'Share', ro: 'Distribuie', ru: 'Поделиться' },
      text: {
        de: 'Teile den Artikel über WhatsApp, Telegram, E-Mail und mehr, oder kopiere den Link.',
        en: 'Share the article via WhatsApp, Telegram, email and more, or copy the link.',
        ro: 'Distribuie articolul pe WhatsApp, Telegram, e-mail și altele, sau copiază linkul.',
        ru: 'Поделитесь статьёй в WhatsApp, Telegram, по почте и не только или скопируйте ссылку.',
      },
    },
  );
  return steps;
}
