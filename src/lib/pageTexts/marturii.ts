// Pasul 0809009 — textele originale ale paginii Mărturii.
//
// Stau aici, nu în fișierul paginii. Next.js nu se așteaptă ca fișierele de
// pagină să fie importate din altă parte, iar panoul de administrare are
// nevoie de aceste texte ca să-ți arate originalul și să te poată întoarce
// la el.

export type MarturiiLang = 'ro' | 'de' | 'en' | 'ru';

export const MARTURII_TEXTS: Record<MarturiiLang, Record<string, string>> = {
  de: {
    // —— Ecranul de intrare (se poate schimba din Setări → Pagini)
    // Scrie „nu" ca să oprești ecranul de intrare cu totul.
    introEnabled: 'da',
    introVerse: 'Jesus Christus ist derselbe gestern und heute und in Ewigkeit!',
    introReference: 'Hebräer 13,8',
    introSecond: 'Der Mensch aber ist wandelbar, wandelbar wie das Wetter.',
    // —— Pagina
    title: 'Zeugnisse',
    intro: '',
    sectionsTitle: 'Rubriken',
    empty: 'Es gibt noch keine Rubriken.',
    emptyHint: 'Lege die erste Rubrik im Admin-Bereich an.',
    loading: 'Wird geladen …',
    open: 'Öffnen',
    soon: 'Die Zeugnisse dieser Rubrik folgen in Kürze.',
    back: 'Zurück zur Startseite',
  },
  en: {
    introEnabled: 'da',
    introVerse: 'Jesus Christ is the same yesterday and today and forever!',
    introReference: 'Hebrews 13:8',
    introSecond: 'But man is changeable, changeable as the weather.',
    title: 'Testimonies',
    intro: '',
    sectionsTitle: 'Sections',
    empty: 'There are no sections yet.',
    emptyHint: 'Create the first section in the admin area.',
    loading: 'Loading …',
    open: 'Open',
    soon: 'The testimonies of this section are coming soon.',
    back: 'Back to home',
  },
  ro: {
    introEnabled: 'da',
    introVerse: 'Isus Hristos este același ieri și azi și în veci!',
    introReference: 'Evrei 13:8',
    introSecond: 'Dar omul este schimbător, schimbător ca vremea.',
    title: 'Mărturii',
    intro: '',
    sectionsTitle: 'Rubrici',
    empty: 'Nu există încă nicio rubrică.',
    emptyHint: 'Creează prima rubrică din panoul de administrare.',
    loading: 'Se încarcă …',
    open: 'Deschide',
    soon: 'Mărturiile din această rubrică vin în curând.',
    back: 'Înapoi la pagina principală',
  },
  ru: {
    introEnabled: 'da',
    introVerse: 'Иисус Христос вчера и сегодня и вовеки Тот же!',
    introReference: 'Евреям 13:8',
    introSecond: 'А человек изменчив, изменчив, как погода.',
    title: 'Свидетельства',
    intro: '',
    sectionsTitle: 'Рубрики',
    empty: 'Рубрик пока нет.',
    emptyHint: 'Создайте первую рубрику в панели администратора.',
    loading: 'Загрузка …',
    open: 'Открыть',
    soon: 'Свидетельства этой рубрики появятся скоро.',
    back: 'На главную',
  },
};
