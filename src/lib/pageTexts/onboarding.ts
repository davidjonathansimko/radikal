// Textul tutorialului de la prima intrare. Se poate schimba oricand din Admin -> Setari -> Pagini -> „Tutorial".
// Cele patru limbi sunt aici; ce scrii in admin inlocuieste doar campurile modificate.

export type OnboardingTexts = {
  welcomeTitle: string;
  welcomeText: string;
  welcomeNote: string;
  navTitle: string;
  navIntro: string;
  navLang: string;
  navSearch: string;
  navTheme: string;
  navReels: string;
  navMenu: string;
  navLogo: string;
  listenTitle: string;
  listenText: string;
  next: string;
  start: string;
  skip: string;
};

export const ONBOARDING_TEXTS: Record<'de' | 'en' | 'ro' | 'ru', OnboardingTexts> = {
  de: {
    welcomeTitle: 'Willkommen bei RADIKAL.',
    welcomeText: 'Blogs, Zeugnisse und biblische Lehre.',
    welcomeNote: 'Alle Texte hier sind Originale – nicht mit KI erstellt und nicht kopiert. Lehren vom Herrn Jesus Christus, die zuerst mir und meinem Haus zum Segen waren.',
    navTitle: 'Navigation',
    navIntro: 'Unten die Einstellungsleiste:',
    navLang: 'Sprache',
    navSearch: 'Suche',
    navTheme: 'Design',
    navReels: 'Reels',
    navMenu: 'Oben rechts das Menü.',
    navLogo: 'Oben links das Logo – es bringt dich überall zurück zur Startseite.',
    listenTitle: 'Anhören und lesen',
    listenText:
      'Jeder Artikel kann vorgelesen oder im Fokus-Modus gelesen werden – für mehr Konzentration. Schriftgröße und Vorlesegeschwindigkeit lassen sich anpassen.',
    next: 'Weiter',
    start: 'Los geht’s',
    skip: 'Überspringen',
  },
  en: {
    welcomeTitle: 'Welcome to RADIKAL.',
    welcomeText: 'Blogs, testimonies and Biblical teaching.',
    welcomeNote: 'All texts here are original – not made with AI and not copied. Teachings from the Lord Jesus Christ that first blessed me and my household.',
    navTitle: 'Navigation',
    navIntro: 'The settings bar below:',
    navLang: 'Language',
    navSearch: 'Search',
    navTheme: 'Theme',
    navReels: 'Reels',
    navMenu: 'The menu at the top right.',
    navLogo: 'The logo at the top left always takes you back home.',
    listenTitle: 'Listen and read',
    listenText:
      'Every article can be read aloud or read in focus mode for better concentration. Text size and reading speed can be adjusted.',
    next: 'Next',
    start: 'Let’s go',
    skip: 'Skip',
  },
  ro: {
    welcomeTitle: 'Bine ai venit la RADIKAL.',
    welcomeText: 'Bloguri, mărturii și învățături biblice.',
    welcomeNote: 'Toate textele de aici sunt originale – nu sunt create cu AI și nu sunt copiate. Învățături primite de la Domnul Isus Hristos, care mai întâi mie și casei mele ne-au fost de folos.',
    navTitle: 'Navigare',
    navIntro: 'Jos, bara de setări:',
    navLang: 'Limbă',
    navSearch: 'Căutare',
    navTheme: 'Temă',
    navReels: 'Reels',
    navMenu: 'Sus în dreapta, meniul.',
    navLogo: 'Sus în stânga, logo-ul – te duce oricând acasă.',
    listenTitle: 'Ascultă și citește',
    listenText:
      'Fiecare articol poate fi ascultat sau citit în modul Focus, pentru mai multă concentrare. Mărimea textului și viteza vocii se pot regla.',
    next: 'Înainte',
    start: 'Începe',
    skip: 'Sari peste',
  },
  ru: {
    welcomeTitle: 'Добро пожаловать в RADIKAL.',
    welcomeText: 'Блоги, свидетельства и библейские учения.',
    welcomeNote: 'Все тексты здесь оригинальны – не созданы с помощью ИИ и не скопированы. Учения от Господа Иисуса Христа, которые прежде всего были во благо мне и моему дому.',
    navTitle: 'Навигация',
    navIntro: 'Внизу панель настроек:',
    navLang: 'Язык',
    navSearch: 'Поиск',
    navTheme: 'Тема',
    navReels: 'Рилсы',
    navMenu: 'Справа вверху меню.',
    navLogo: 'Слева вверху логотип – он всегда возвращает на главную.',
    listenTitle: 'Слушай и читай',
    listenText:
      'Каждую статью можно прослушать или читать в режиме фокуса — для лучшей концентрации. Размер шрифта и скорость чтения можно настроить.',
    next: 'Далее',
    start: 'Начать',
    skip: 'Пропустить',
  },
};
