// Pagina cerută de Google Play: „Delete data URL".
// Trebuie să spună limpede CE date se șterg, CE rămâne și CUM se cere ștergerea.
// Un simplu formular de contact nu e de ajuns pentru verificarea din magazin.

'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import BackToTopButton from '@/components/BackToTopButton';

const CONTACT_EMAIL = 'radikal@radikal.blog';

type Lang = 'de' | 'en' | 'ro' | 'ru';

const T: Record<Lang, {
  back: string;
  title: string;
  intro: string;
  howTitle: string;
  steps: string[];
  deletedTitle: string;
  deleted: string[];
  keptTitle: string;
  kept: string[];
  timeTitle: string;
  time: string;
  selfTitle: string;
  self: string;
  contactBtn: string;
}> = {
  de: {
    back: '← Zurück zur Startseite',
    title: 'Löschung deiner Daten',
    intro: 'Du kannst jederzeit verlangen, dass deine Daten gelöscht werden — ohne Begründung und kostenlos. Diese Seite erklärt genau, wie das geht und was dabei passiert.',
    howTitle: 'So beantragst du die Löschung',
    steps: [
      `Schreibe eine E-Mail an ${CONTACT_EMAIL} mit dem Betreff „Löschung meiner Daten".`,
      'Gib die E-Mail-Adresse an, mit der du dich registriert hast.',
      'Schreibe, ob du dein ganzes Konto löschen möchtest oder nur einzelne Daten (z. B. nur deine Kommentare).',
      'Alternativ kannst du das Kontaktformular benutzen — der Link steht unten.',
    ],
    deletedTitle: 'Was gelöscht wird',
    deleted: [
      'Dein Konto und deine E-Mail-Adresse',
      'Deine Kommentare',
      'Deine Likes und gespeicherten Beiträge',
      'Deine Newsletter-Anmeldung',
    ],
    keptTitle: 'Was bleibt',
    kept: [
      'Anonyme Zählwerte, die keiner Person zugeordnet werden können (z. B. die Gesamtzahl der Aufrufe eines Artikels).',
      'Daten, die wir gesetzlich aufbewahren müssen — falls solche vorliegen, nennen wir sie dir in unserer Antwort.',
    ],
    timeTitle: 'Wie lange es dauert',
    time: 'Wir bestätigen deinen Antrag innerhalb von 7 Tagen und löschen die Daten spätestens innerhalb von 30 Tagen.',
    selfTitle: 'Was du selbst sofort tun kannst',
    self: 'Einstellungen, Sprache und Thema werden nur lokal auf deinem Gerät gespeichert. Diese Daten verschwinden sofort, wenn du die App deinstallierst oder die Browserdaten für diese Seite löschst. Vom Newsletter kannst du dich jederzeit über den Abmelde-Link in jeder E-Mail abmelden.',
    contactBtn: 'Zum Kontaktformular',
  },
  en: {
    back: '← Back to home',
    title: 'Deleting your data',
    intro: 'You can ask us to delete your data at any time — free of charge and without giving a reason. This page explains exactly how, and what happens.',
    howTitle: 'How to request deletion',
    steps: [
      `Send an email to ${CONTACT_EMAIL} with the subject "Delete my data".`,
      'Include the email address you registered with.',
      'Tell us whether you want your whole account deleted, or only certain data (for example only your comments).',
      'You can also use the contact form — the link is below.',
    ],
    deletedTitle: 'What gets deleted',
    deleted: [
      'Your account and email address',
      'Your comments',
      'Your likes and saved posts',
      'Your newsletter subscription',
    ],
    keptTitle: 'What stays',
    kept: [
      'Anonymous counts that cannot be linked to any person (for example the total number of views of an article).',
      'Data we are legally required to keep — if any applies, we will name it in our reply.',
    ],
    timeTitle: 'How long it takes',
    time: 'We confirm your request within 7 days and delete the data within 30 days at the latest.',
    selfTitle: 'What you can do yourself right away',
    self: 'Settings, language and theme are stored only on your own device. They disappear immediately if you uninstall the app or clear the browser data for this site. You can unsubscribe from the newsletter at any time using the link in every email.',
    contactBtn: 'Go to contact form',
  },
  ro: {
    back: '← Înapoi la pagina principală',
    title: 'Ștergerea datelor tale',
    intro: 'Poți cere oricând ștergerea datelor tale — gratuit și fără să dai vreo explicație. Pagina asta îți spune exact cum se face și ce se întâmplă.',
    howTitle: 'Cum ceri ștergerea',
    steps: [
      `Trimite un email la ${CONTACT_EMAIL} cu subiectul „Ștergerea datelor mele".`,
      'Scrie adresa de email cu care te-ai înregistrat.',
      'Spune dacă vrei să-ți ștergem tot contul sau doar anumite date (de exemplu doar comentariile).',
      'Poți folosi și formularul de contact — linkul e mai jos.',
    ],
    deletedTitle: 'Ce se șterge',
    deleted: [
      'Contul tău și adresa de email',
      'Comentariile tale',
      'Aprecierile și articolele salvate',
      'Abonarea la newsletter',
    ],
    keptTitle: 'Ce rămâne',
    kept: [
      'Numărători anonime, care nu pot fi legate de nicio persoană (de exemplu de câte ori a fost citit un articol).',
      'Date pe care legea ne obligă să le păstrăm — dacă există așa ceva, ți le spunem în răspuns.',
    ],
    timeTitle: 'Cât durează',
    time: 'Îți confirmăm cererea în 7 zile și ștergem datele în cel mult 30 de zile.',
    selfTitle: 'Ce poți face tu, imediat',
    self: 'Setările, limba și tema se țin doar pe dispozitivul tău. Ele dispar pe loc dacă dezinstalezi aplicația sau ștergi datele browserului pentru acest site. De la newsletter te poți dezabona oricând, din linkul aflat în fiecare email.',
    contactBtn: 'Mergi la formularul de contact',
  },
  ru: {
    back: '← Назад на главную',
    title: 'Удаление ваших данных',
    intro: 'Вы можете в любой момент попросить удалить ваши данные — бесплатно и без объяснения причин. Здесь описано, как именно это сделать и что произойдёт.',
    howTitle: 'Как запросить удаление',
    steps: [
      `Отправьте письмо на ${CONTACT_EMAIL} с темой «Удаление моих данных».`,
      'Укажите адрес электронной почты, с которым вы регистрировались.',
      'Напишите, хотите ли вы удалить весь аккаунт или только часть данных (например, только комментарии).',
      'Также можно воспользоваться формой обратной связи — ссылка ниже.',
    ],
    deletedTitle: 'Что удаляется',
    deleted: [
      'Ваш аккаунт и адрес электронной почты',
      'Ваши комментарии',
      'Ваши отметки «нравится» и сохранённые статьи',
      'Подписка на рассылку',
    ],
    keptTitle: 'Что остаётся',
    kept: [
      'Анонимные счётчики, которые нельзя связать с конкретным человеком (например, общее число просмотров статьи).',
      'Данные, которые мы обязаны хранить по закону — если такие есть, мы укажем их в ответе.',
    ],
    timeTitle: 'Сколько это занимает',
    time: 'Мы подтверждаем запрос в течение 7 дней и удаляем данные не позднее чем через 30 дней.',
    selfTitle: 'Что вы можете сделать сами прямо сейчас',
    self: 'Настройки, язык и тема хранятся только на вашем устройстве. Они исчезают сразу, если удалить приложение или очистить данные браузера для этого сайта. Отписаться от рассылки можно в любой момент по ссылке в каждом письме.',
    contactBtn: 'Перейти к форме обратной связи',
  },
};

export default function DatenloeschungPage() {
  const { language } = useLanguage();
  const t = T[(language as Lang)] || T.de;

  const card = 'glass-effect rounded-2xl p-6 sm:p-8';
  const h2 = 'mb-3 text-xl font-bold text-black dark:text-white';
  const li = 'text-black/80 dark:text-white/80 leading-relaxed';

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          {t.back}
        </Link>

        <header className="mb-10">
          <h1 className="mb-4 font-cinzel text-3xl font-bold text-black dark:text-white sm:text-4xl">
            {t.title}
          </h1>
          <p className="leading-relaxed text-black/80 dark:text-white/80">{t.intro}</p>
        </header>

        <div className="grid gap-6">
          <section className={card}>
            <h2 className={h2}>{t.howTitle}</h2>
            <ol className="list-decimal space-y-2 pl-5">
              {t.steps.map((s, i) => (
                <li key={i} className={li}>{s}</li>
              ))}
            </ol>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 inline-block font-semibold text-black underline dark:text-white"
            >
              {CONTACT_EMAIL}
            </a>
          </section>

          <section className={card}>
            <h2 className={h2}>{t.deletedTitle}</h2>
            <ul className="list-disc space-y-2 pl-5">
              {t.deleted.map((s, i) => (
                <li key={i} className={li}>{s}</li>
              ))}
            </ul>
          </section>

          <section className={card}>
            <h2 className={h2}>{t.keptTitle}</h2>
            <ul className="list-disc space-y-2 pl-5">
              {t.kept.map((s, i) => (
                <li key={i} className={li}>{s}</li>
              ))}
            </ul>
          </section>

          <section className={card}>
            <h2 className={h2}>{t.timeTitle}</h2>
            <p className={li}>{t.time}</p>
          </section>

          <section className={card}>
            <h2 className={h2}>{t.selfTitle}</h2>
            <p className={li}>{t.self}</p>
            <Link href="/contact" className="btn-primary mt-5 inline-block">
              {t.contactBtn}
            </Link>
          </section>
        </div>
      </div>

      <BackToTopButton />
    </div>
  );
}
