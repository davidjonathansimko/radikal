'use client';

// Pasul 2210001 — vizitatorul a ajuns la un articol: vede „gustul", dar ca să
// citească trebuie să aibă cont. Acoperă tot ecranul, inclusiv meniul.

import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';

const TEXTS: Record<string, { title: string; text: string; login: string; signup: string }> = {
  de: {
    title: 'Zum Weiterlesen anmelden',
    text: 'Gäste dürfen sich umsehen. Um diesen Beitrag zu lesen, melde dich an oder erstelle ein kostenloses Konto.',
    login: 'Anmelden',
    signup: 'Registrieren',
  },
  en: {
    title: 'Sign in to keep reading',
    text: 'Guests can look around. To read this post, sign in or create a free account.',
    login: 'Sign in',
    signup: 'Register',
  },
  ro: {
    title: 'Autentifică-te ca să continui',
    text: 'Vizitatorii pot răsfoi. Ca să citești această postare, autentifică-te sau creează un cont gratuit.',
    login: 'Autentificare',
    signup: 'Înregistrare',
  },
  ru: {
    title: 'Войдите, чтобы продолжить',
    text: 'Гости могут осматриваться. Чтобы прочитать эту запись, войдите или создайте бесплатный аккаунт.',
    login: 'Войти',
    signup: 'Регистрация',
  },
};

interface Props {
  backHref: string;
  backLabel: string;
}

export default function GuestLoginGate({ backHref, backLabel }: Props) {
  const { language } = useLanguage();
  const t = TEXTS[language] ?? TEXTS.de;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-gate-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 px-6 text-black backdrop-blur-md dark:bg-black/95 dark:text-white"
    >
      <div className="w-full max-w-md text-center">
        <h1 id="guest-gate-title" className="mb-4 font-cinzel text-2xl font-bold sm:text-3xl">
          {t.title}
        </h1>
        <p className="mb-8 text-base leading-relaxed text-black/70 dark:text-white/70">{t.text}</p>

        <div className="flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="btn-solid rounded-xl bg-black px-6 py-3 font-semibold text-white transition-opacity hover:opacity-80 dark:bg-white dark:text-black"
          >
            {t.login}
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-xl border border-black/20 px-6 py-3 font-semibold transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            {t.signup}
          </Link>
          <Link
            href={backHref}
            className="mt-2 text-sm text-black/60 underline hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
