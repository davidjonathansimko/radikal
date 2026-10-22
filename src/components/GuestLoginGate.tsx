'use client';

// Pasul 2210001 — vizitatorul a ajuns la un articol: vede „gustul", dar ca să
// citească trebuie să aibă cont. Acoperă tot ecranul, inclusiv meniul.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { cameFromList } from '@/lib/navHistory';

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
  /** Adresa de baza a articolelor, ca sa stim daca inapoi duce la lista. */
  articlePrefix: string;
}

export default function GuestLoginGate({ backHref, backLabel, articlePrefix }: Props) {
  const { language } = useLanguage();
  const router = useRouter();
  const t = TEXTS[language] ?? TEXTS.de;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-gate-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 text-black backdrop-blur-md dark:bg-black/95 dark:text-white"
    >
      {/* Marginile stau pe elementul interior: regula globala .fixed.z-[9999] anuleaza padding-ul celui exterior. */}
      <div className="mx-5 w-full max-w-md rounded-3xl border border-black/10 bg-black/[0.03] p-6 text-center dark:border-white/10 dark:bg-white/[0.04] sm:p-8">
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
            onClick={(e) => {
              if (cameFromList(backHref, articlePrefix)) {
                e.preventDefault();
                router.back();
              }
            }}
            className="mt-2 text-sm text-black/60 underline hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
