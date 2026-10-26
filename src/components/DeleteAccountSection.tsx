'use client';

// Pasul 261026 — „Contul meu: sterge totul". Doar pentru utilizatori logati.
// Confirmare intr-o fereastra; serverul sterge datele si contul si anunta adminul.

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { getSupabaseClient } from '@/lib/supabase';

type Lang = 'de' | 'en' | 'ro' | 'ru';

const T: Record<Lang, {
  title: string; text: string; login: string; btn: string;
  confirmTitle: string; confirmText: string; yes: string; no: string;
  working: string; done: string; error: string; admin: string;
}> = {
  de: {
    title: 'Konto sofort selbst löschen',
    text: 'Wenn du angemeldet bist, kannst du dein Konto und alle damit verbundenen Daten direkt hier löschen. Es ist kein E-Mail-Antrag nötig.',
    login: 'Zum Anmelden',
    btn: 'Mein Konto und meine Daten löschen',
    confirmTitle: 'Konto wirklich löschen?',
    confirmText: 'Dein Konto, deine Likes, gespeicherten Beiträge und Benachrichtigungen werden endgültig gelöscht. Das kann nicht rückgängig gemacht werden.',
    yes: 'Ja, endgültig löschen', no: 'Abbrechen',
    working: 'Wird gelöscht …',
    done: 'Dein Konto und deine Daten wurden gelöscht.',
    error: 'Das Löschen hat nicht geklappt. Bitte schreibe uns per E-Mail.',
    admin: 'Das Administrator-Konto kann hier nicht gelöscht werden.',
  },
  en: {
    title: 'Delete your account right away',
    text: 'When you are signed in, you can delete your account and all related data right here. No email request needed.',
    login: 'Sign in',
    btn: 'Delete my account and data',
    confirmTitle: 'Really delete your account?',
    confirmText: 'Your account, likes, saved posts and notifications will be deleted permanently. This cannot be undone.',
    yes: 'Yes, delete permanently', no: 'Cancel',
    working: 'Deleting …',
    done: 'Your account and data have been deleted.',
    error: 'Deleting did not work. Please email us.',
    admin: 'The administrator account cannot be deleted here.',
  },
  ro: {
    title: 'Șterge-ți contul chiar acum',
    text: 'Dacă ești autentificat, îți poți șterge contul și toate datele legate de el chiar aici. Nu mai e nevoie de cerere prin email.',
    login: 'Autentifică-te',
    btn: 'Șterge-mi contul și datele',
    confirmTitle: 'Sigur ștergi contul?',
    confirmText: 'Contul, aprecierile, articolele salvate și notificările tale se vor șterge definitiv. Nu se mai poate anula.',
    yes: 'Da, șterge definitiv', no: 'Anulează',
    working: 'Se șterge …',
    done: 'Contul și datele tale au fost șterse.',
    error: 'Ștergerea nu a reușit. Scrie-ne un email.',
    admin: 'Contul de administrator nu se poate șterge de aici.',
  },
  ru: {
    title: 'Удалить аккаунт прямо сейчас',
    text: 'Если вы вошли в аккаунт, вы можете удалить его и все связанные данные прямо здесь. Письмо не требуется.',
    login: 'Войти',
    btn: 'Удалить мой аккаунт и данные',
    confirmTitle: 'Точно удалить аккаунт?',
    confirmText: 'Ваш аккаунт, отметки «нравится», сохранённые статьи и уведомления будут удалены навсегда. Это нельзя отменить.',
    yes: 'Да, удалить навсегда', no: 'Отмена',
    working: 'Удаление …',
    done: 'Ваш аккаунт и данные удалены.',
    error: 'Не удалось удалить. Напишите нам на почту.',
    admin: 'Аккаунт администратора нельзя удалить здесь.',
  },
};

export default function DeleteAccountSection({ cardClass, h2Class, textClass }: { cardClass: string; h2Class: string; textClass: string }) {
  const { language } = useLanguage();
  const t = T[(language as Lang)] || T.de;

  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    const sb = getSupabaseClient();
    void sb.auth.getSession().then(({ data }) => setLoggedIn(Boolean(data.session)));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => setLoggedIn(Boolean(session)));
    return () => sub.subscription.unsubscribe();
  }, []);

  const run = async () => {
    setBusy(true);
    setMessage('');
    try {
      const sb = getSupabaseClient();
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('no session');
      const res = await fetch('/api/account/delete', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 403) {
        setMessage(t.admin);
        setConfirming(false);
        return;
      }
      if (!res.ok) throw new Error('failed');
      try { await sb.auth.signOut(); } catch { /* contul nu mai exista */ }
      setDeleted(true);
      setConfirming(false);
      setMessage(t.done);
    } catch {
      setMessage(t.error);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  if (loggedIn === null) return null;

  return (
    <section className={cardClass}>
      <h2 className={h2Class}>{t.title}</h2>
      <p className={textClass}>{t.text}</p>

      {!loggedIn && !deleted && (
        <Link href="/auth/login" className="btn-primary mt-5 inline-block">{t.login}</Link>
      )}

      {loggedIn && !deleted && (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="btn-solid mt-5 rounded-xl border border-red-600/60 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600/10 dark:border-red-400/60 dark:text-red-400"
        >
          {t.btn}
        </button>
      )}

      {message && <p className="mt-4 text-sm font-medium text-black dark:text-white" role="status">{message}</p>}

      {confirming && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={t.confirmTitle}>
          <button type="button" aria-label={t.no} onClick={() => !busy && setConfirming(false)} className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-md animate-fadeIn" />
          <div className="relative w-full max-w-sm rounded-3xl border border-black/10 bg-white p-6 text-black shadow-2xl animate-fadeIn dark:border-white/15 dark:bg-neutral-950 dark:text-white">
            <h3 className="font-cinzel text-xl font-bold">{t.confirmTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-black/70 dark:text-white/70">{t.confirmText}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={busy}
                onClick={() => void run()}
                className="btn-solid flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? t.working : t.yes}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirming(false)}
                className="btn-solid flex-1 rounded-xl border border-black/15 px-4 py-2.5 text-sm font-semibold dark:border-white/20"
              >
                {t.no}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
