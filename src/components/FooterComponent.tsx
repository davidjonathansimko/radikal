// Footer Component with Mobile Optimization
// Footer-Komponente mit mobiler Optimierung
// Componentă Footer cu Optimizare Mobilă

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';

export default function FooterComponent() {
  const { language } = useLanguage();
  const pathname = usePathname();
  
  // Check if we're on a legal page to hide the corresponding link
  const isOnDatenschutz = pathname === '/datenschutz';
  const isOnImpressum = pathname === '/impressum';
  const isOnLoeschung = pathname === '/datenloeschung';
  const isOnLegalPage = isOnDatenschutz || isOnImpressum || isOnLoeschung;

  return (
    <footer 
      // Pasul 2708014 — `z-0`, nu `z-10`. <main> are `relative z-10`, deci un
      // ecran fix pornit dintr-o pagină (ex. versetul de la mărturii) rămâne
      // prins în stratul acela. Footerul, frate cu el și tot pe z-10, ajungea
      // deasupra ecranului și se vedea prin el.
      className="hidden lg:block relative z-0 bg-white/90 dark:bg-black/40 backdrop-blur-md border-t border-black/10 dark:border-white/10 mt-8"
      style={{ 
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' 
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Legal links - larger text on bigger screens */}
        {/* Increased max size from 16px to 18px for better readability on larger phones */}
        {!isOnLegalPage && (
          <div className="flex justify-center items-baseline flex-wrap gap-x-2 sm:gap-x-4 gap-y-0 mb-0.5">
            <Link 
              href="/datenschutz" 
              className="text-black/60 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors leading-none whitespace-nowrap"
              style={{ fontSize: 'clamp(11px, 4vw, 18px)' }}
            >
              {language === 'de' ? 'Datenschutz' : 
               language === 'en' ? 'Privacy Policy' : 
               language === 'ro' ? 'Politica de Confidențialitate' : 
               'Политика конфиденциальности'}
            </Link>
            <span className="text-black/30 dark:text-white/30 leading-none" style={{ fontSize: 'clamp(11px, 4vw, 18px)' }}>|</span>
            <Link 
              href="/impressum" 
              className="text-black/60 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors leading-none whitespace-nowrap"
              style={{ fontSize: 'clamp(11px, 4vw, 18px)' }}
            >
              {language === 'de' ? 'Impressum' : 
               language === 'en' ? 'Legal Notice' : 
               language === 'ro' ? 'Mențiuni Legale' : 
               'Юридическая информація'}
            </Link>
            <span className="text-black/30 dark:text-white/30 leading-none" style={{ fontSize: 'clamp(11px, 4vw, 18px)' }}>|</span>
            <Link 
              href="/datenloeschung" 
              className="text-black/60 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors leading-none whitespace-nowrap"
              style={{ fontSize: 'clamp(11px, 4vw, 18px)' }}
            >
              {language === 'de' ? 'Daten löschen' : 
               language === 'en' ? 'Delete data' : 
               language === 'ro' ? 'Ștergerea datelor' : 
               'Удаление данных'}
            </Link>
          </div>
        )}
        
        <div className="text-center">
          <p className="text-black/70 dark:text-white/60 text-sm">
            {/* Pasul 2308006-A: anul se ia singur din calendar, ca sa nu ramana
                in urma (era fix „2025" desi suntem in 2026). */}
            {language === 'de' ? `© ${new Date().getFullYear()} RADIKAL. Alle Rechte vorbehalten.` :
             language === 'en' ? `© ${new Date().getFullYear()} RADIKAL. All rights reserved.` :
             language === 'ro' ? `© ${new Date().getFullYear()} RADIKAL. Toate drepturile rezervate.` :
             `© ${new Date().getFullYear()} RADIKAL. Все права защищены.`}
          </p>
          <p className="text-black/50 dark:text-white/40 text-xs mt-2">
            {language === 'de' ? 'Erstellt mit Next.js' :
             language === 'en' ? 'Created with Next.js' :
             language === 'ro' ? 'Creat cu Next.js' :
             'Создано с помощью Next.js'}
          </p>
        </div>
      </div>
    </footer>
  );
}