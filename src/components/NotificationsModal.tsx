'use client';

// Pasul 261026 — fereastra „Benachrichtigungen": alegi ce notificari primesti.
// Merge si pentru vizitatori fara cont (aplicatia), si pentru utilizatori logati.

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import ReelsIcon from '@/components/ReelsIcon';
import { PhoneBellIcon, NewspaperIcon, ActivityIcon, VerseIcon } from '@/components/NotificationIcons';
import { applyPrefs, getPushStatus, loadPrefs, PUSH_KINDS, type PushKind, type PushPrefs, type PushResult, type PushStatus } from '@/lib/pushClient';

type Lang = 'de' | 'en' | 'ro' | 'ru';

const T: Record<Lang, {
  title: string; intro: string; close: string;
  kinds: Record<PushKind, string>;
  msg: Record<'unsupported' | 'denied' | 'not_configured' | 'error' | 'saved', string>;
}> = {
  de: {
    title: 'Benachrichtigungen', intro: 'Wähle, worüber du informiert werden möchtest.', close: 'Schließen',
    kinds: { blogs: 'Neue Blogs', marturii: 'Zeugnisse', verse: 'Vers des Tages · 07:00', reels: 'Reels' },
    msg: {
      unsupported: 'Dieses Gerät unterstützt keine Benachrichtigungen.',
      denied: 'Benachrichtigungen sind in den Geräteeinstellungen blockiert. Erlaube sie dort und versuche es erneut.',
      not_configured: 'Benachrichtigungen sind auf dem Server noch nicht eingerichtet.',
      error: 'Das hat nicht geklappt. Bitte später erneut versuchen.',
      saved: 'Gespeichert.',
    },
  },
  en: {
    title: 'Notifications', intro: 'Choose what you want to be notified about.', close: 'Close',
    kinds: { blogs: 'New blogs', marturii: 'Testimonies', verse: 'Verse of the day · 07:00', reels: 'Reels' },
    msg: {
      unsupported: 'This device does not support notifications.',
      denied: 'Notifications are blocked in your device settings. Allow them there and try again.',
      not_configured: 'Notifications are not set up on the server yet.',
      error: 'That did not work. Please try again later.',
      saved: 'Saved.',
    },
  },
  ro: {
    title: 'Notificări', intro: 'Alege despre ce vrei să fii anunțat.', close: 'Închide',
    kinds: { blogs: 'Bloguri noi', marturii: 'Mărturii', verse: 'Versetul zilnic · 07:00', reels: 'Reels' },
    msg: {
      unsupported: 'Acest dispozitiv nu acceptă notificări.',
      denied: 'Notificările sunt blocate din setările dispozitivului. Permite-le acolo și încearcă din nou.',
      not_configured: 'Notificările nu sunt încă pornite pe server.',
      error: 'Nu a mers. Încearcă din nou mai târziu.',
      saved: 'Salvat.',
    },
  },
  ru: {
    title: 'Уведомления', intro: 'Выберите, о чём вы хотите получать уведомления.', close: 'Закрыть',
    kinds: { blogs: 'Новые статьи', marturii: 'Свидетельства', verse: 'Стих дня · 07:00', reels: 'Reels' },
    msg: {
      unsupported: 'Это устройство не поддерживает уведомления.',
      denied: 'Уведомления заблокированы в настройках устройства. Разрешите их там и попробуйте снова.',
      not_configured: 'Уведомления на сервере ещё не настроены.',
      error: 'Не получилось. Попробуйте позже.',
      saved: 'Сохранено.',
    },
  },
};

function KindIcon({ kind }: { kind: PushKind }) {
  if (kind === 'blogs') return <NewspaperIcon size={30} />;
  if (kind === 'marturii') return <ActivityIcon size={30} />;
  if (kind === 'verse') return <VerseIcon size={28} />;
  return <ReelsIcon className="h-[28px] w-[28px]" />;
}

export default function NotificationsModal({ onClose }: { onClose: () => void }) {
  const { language } = useLanguage();
  const t = T[(language as Lang)] || T.de;
  const lang = ((language as Lang) in T ? language : 'de') as Lang;

  useBodyScrollLock(true);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [prefs, setPrefs] = useState<PushPrefs>(() => loadPrefs());
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    setMounted(true);
    void getPushStatus().then(setStatus);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const flip = useCallback(async (kind: PushKind) => {
    if (busy) return;
    setBusy(true);
    setNote('');
    const base: PushPrefs = status === 'on' ? prefs : { blogs: false, marturii: false, verse: false, reels: false };
    const next = { ...base, [kind]: !base[kind] };
    const result: PushResult = await applyPrefs(next, lang);
    if (result === 'ok') {
      setPrefs(next);
      setStatus(PUSH_KINDS.some((k) => next[k]) ? 'on' : 'off');
      setNote(t.msg.saved);
    } else {
      setNote(t.msg[result]);
      void getPushStatus().then(setStatus);
    }
    setBusy(false);
  }, [busy, status, prefs, lang, t]);

  if (!mounted) return null;

  const shown = (k: PushKind) => status === 'on' && prefs[k];
  const blocked = status === 'unsupported' || status === 'denied';

  return createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t.title}>
      <button type="button" aria-label={t.close} onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-md animate-fadeIn" />
      <div className="relative w-full max-w-sm rounded-3xl border border-black/10 bg-white p-6 text-black shadow-2xl animate-fadeIn dark:border-white/15 dark:bg-neutral-950 dark:text-white">
        <div className="mb-5 flex flex-col items-center text-center">
          <PhoneBellIcon size={72} />
          <h2 className="mt-2 font-cinzel text-2xl font-bold">{t.title}</h2>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">{t.intro}</p>
        </div>

        <ul className="space-y-2">
          {PUSH_KINDS.map((k) => {
            const on = shown(k);
            return (
              <li key={k}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  disabled={busy || blocked || status === null}
                  onClick={() => void flip(k)}
                  className={`flex w-full items-center gap-4 rounded-2xl border border-black/10 px-4 py-3 text-left transition-colors hover:bg-black/[0.04] disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/[0.06] ${on ? '' : 'notif-off'}`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center ${on ? '' : 'opacity-50'}`}>
                    <KindIcon kind={k} />
                  </span>
                  <span className="flex-1 text-base font-medium">{t.kinds[k]}</span>
                  <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${on ? 'bg-black dark:bg-white' : 'bg-black/20 dark:bg-white/20'}`}>
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform dark:bg-black ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 min-h-[1.25rem] text-center text-sm text-black/65 dark:text-white/65" aria-live="polite">
          {status === 'unsupported' ? t.msg.unsupported : status === 'denied' ? t.msg.denied : note}
        </p>

        <button type="button" onClick={onClose} className="btn-solid mx-auto mt-3 block rounded-full border border-black/15 px-6 py-2 text-sm font-semibold dark:border-white/20">
          {t.close}
        </button>
      </div>
    </div>,
    document.body,
  );
}
