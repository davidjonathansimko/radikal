'use client';

// Notificari push: in aplicatia instalata pornesc singure (toate cele 4), iar limba si contul abonarii se tin la zi.

import { useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { isStandaloneApp } from '@/lib/appFullscreen';
import { autoEnablePush, syncPush } from '@/lib/pushClient';

export default function PushSync() {
  const { language } = useLanguage();

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      await syncPush(language);
      // Abia dupa tutorialul de inceput si dupa cookie-uri, ca sa nu se suprapuna ferestrele.
      let ready = false;
      try {
        ready = Boolean(localStorage.getItem('radikalOnboardingDone')) && Boolean(localStorage.getItem('cookie-consent'));
      } catch {
        ready = false;
      }
      if (ready && isStandaloneApp()) await autoEnablePush(language);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [language]);

  return null;
}
