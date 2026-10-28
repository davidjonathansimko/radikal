'use client';

// In aplicatia instalata (Android/TWA) atingerea lunga pe un link deschidea meniul Chrome
// („In neuem Chrome-Tab öffnen" etc.), ceea ce trada ca e un site. Il blocam, in afara de campurile de text.

import { useEffect } from 'react';
import { isStandaloneApp } from '@/lib/appFullscreen';

export default function StandaloneGuard() {
  useEffect(() => {
    const inApp = isStandaloneApp() || document.referrer.startsWith('android-app://');
    if (!inApp) return;
    document.documentElement.classList.add('app-standalone');

    const editable = (t: EventTarget | null) =>
      t instanceof Element && Boolean(t.closest('input, textarea, [contenteditable="true"]'));
    const block = (e: Event) => {
      if (!editable(e.target)) e.preventDefault();
    };
    document.addEventListener('contextmenu', block);
    document.addEventListener('dragstart', block);
    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('dragstart', block);
      document.documentElement.classList.remove('app-standalone');
    };
  }, []);
  return null;
}
