'use client';

// =====================================================================
// Pasul 2308004 (A) — ecranul „Se efectuează lucrări la site"
// ---------------------------------------------------------------------
// Inlocuieste TOT continutul siteului cat timp modul „Working" e pornit.
// Arata exact ca modalul de intro: logo-ul RADIKAL sus, iar dedesubt,
// in locul textului cu Biserica, mesajul despre lucrari.
//
// Nu exista niciun buton care sa duca mai departe: nici login, nici
// register, nici „continue as guest". Este intentionat — ai cerut ca
// totul sa fie inghetat.
//
// Adminul nu ajunge niciodata aici (vezi `MaintenanceGate`).
// =====================================================================

import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import {
  buildMaintenanceMessage,
  type MaintenanceSettings,
  type MaintenanceLanguage,
} from '@/lib/maintenance';

export default function MaintenanceScreen({
  settings,
}: {
  settings: MaintenanceSettings;
}) {
  const { language } = useLanguage();
  const lang = (['ro', 'de', 'en', 'ru'].includes(language)
    ? language
    : 'de') as MaintenanceLanguage;

  const message = buildMaintenanceMessage(settings, lang);

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden bg-black px-6 text-white">
      {/* Imagine de fundal optionala, aleasa de admin */}
      {settings.backgroundUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.backgroundUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: Math.min(100, Math.max(0, settings.backgroundOpacity)) / 100 }}
        />
      )}
      {/* Un val intunecat, ca textul sa ramana lizibil pe orice imagine */}
      {settings.backgroundUrl && (
        <div aria-hidden="true" className="absolute inset-0 bg-black/45" />
      )}

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo — apare primul, exact ca la intro */}
        <h1 className="play-blog-enter font-cinzel text-4xl font-bold tracking-tight sm:text-5xl">
          radikal<span className="opacity-70">.</span>
        </h1>

        {/* Mesajul — apare imediat dupa logo, animat lin */}
        <p
          className="maintenance-message mt-8 max-w-xl font-cinzel text-lg italic leading-relaxed tracking-wide sm:text-2xl"
          style={{ animationDelay: '0.7s' }}
        >
          {message}
        </p>

        <div
          aria-hidden="true"
          className="maintenance-message mt-10 h-px w-24 bg-white/30"
          style={{ animationDelay: '1.2s' }}
        />
      </div>
    </div>
  );
}
