// Pasul 2308008 — „Instaleaza aplicatia"
// Banner discret care apare o singura data si permite instalarea RADIKAL
// ca aplicatie pe ecranul telefonului (Android/Chrome/Edge) sau arata
// instructiunile pentru iPhone (Safari nu ofera buton automat).

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

// Evenimentul nu exista in tipurile standard DOM.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'radikal-install-dismissed';

const texts = {
  de: {
    title: 'RADIKAL als App installieren',
    body: 'Direkt vom Startbildschirm öffnen — Vollbild, ohne Browserleiste.',
    install: 'Installieren',
    later: 'Später',
    iosBody: 'In Safari auf „Teilen" tippen und dann „Zum Home-Bildschirm".',
  },
  en: {
    title: 'Install RADIKAL as an app',
    body: 'Open it straight from your home screen — full screen, no browser bar.',
    install: 'Install',
    later: 'Later',
    iosBody: 'In Safari tap “Share”, then “Add to Home Screen”.',
  },
  ro: {
    title: 'Instalează RADIKAL ca aplicație',
    body: 'O deschizi direct de pe ecranul telefonului — pe tot ecranul, fără bara browserului.',
    install: 'Instalează',
    later: 'Mai târziu',
    iosBody: 'În Safari apasă „Distribuie”, apoi „Adaugă pe ecranul principal”.',
  },
  ru: {
    title: 'Установить RADIKAL как приложение',
    body: 'Открывайте прямо с главного экрана — во весь экран, без строки браузера.',
    install: 'Установить',
    later: 'Позже',
    iosBody: 'В Safari нажмите «Поделиться», затем «На экран Домой».',
  },
} as const;

export default function InstallAppPrompt() {
  const { language } = useLanguage();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [canShow, setCanShow] = useState(false);
  // Nu suprapunem doua bannere: asteptam sa fie raspuns bannerul de cookie-uri.
  const [cookiesAnswered, setCookiesAnswered] = useState(false);

  const t = texts[language as keyof typeof texts] ?? texts.de;

  useEffect(() => {
    // Deja instalata → nu aratam nimic.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    if (localStorage.getItem(DISMISS_KEY)) return;

    setCookiesAnswered(!!localStorage.getItem('cookie-consent'));
    const onCookieAnswer = () => setCookiesAnswered(true);
    window.addEventListener('cookie-consent-updated', onCookieAnswer);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setCanShow(true);
    };

    const onInstalled = () => {
      localStorage.setItem(DISMISS_KEY, 'installed');
      setCanShow(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // iPhone/iPad: Safari nu trimite `beforeinstallprompt`, deci aratam pasii manual.
    const ua = window.navigator.userAgent;
    const iosSafari = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (iosSafari) {
      setIsIos(true);
      timer = setTimeout(() => setCanShow(true), 8000);
    }

    return () => {
      window.removeEventListener('cookie-consent-updated', onCookieAnswer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setCanShow(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    setCanShow(false);
    await deferred.prompt();
    await deferred.userChoice;
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDeferred(null);
  }, [deferred]);

  if (!canShow || !cookiesAnswered) return null;

  return (
    <div
      role="dialog"
      aria-label={t.title}
      className="fixed inset-x-0 bottom-0 z-[9998] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] animate-slide-up"
    >
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-xl border border-white/15 bg-black/90 p-3 text-white shadow-2xl backdrop-blur-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{t.title}</p>
          <p className="mt-0.5 text-xs leading-snug text-white/70">{isIos && !deferred ? t.iosBody : t.body}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isIos || deferred ? (
            <button
              onClick={install}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-white/80"
            >
              {t.install}
            </button>
          ) : null}
          <button
            onClick={dismiss}
            aria-label={t.later}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/70 transition-colors hover:text-white"
          >
            {t.later}
          </button>
        </div>
      </div>
    </div>
  );
}
