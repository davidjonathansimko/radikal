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
  const isOnLegalPage = isOnDatenschutz || isOnImpressum;

  return (
    <footer 
      className="relative z-10 bg-white/90 dark:bg-black/40 backdrop-blur-md border-t border-black/10 dark:border-white/10 mt-8"
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
          </div>
        )}
        
        <div className="text-center">
          <p className="text-black/70 dark:text-white/60 text-sm">
            {language === 'de' ? '© 2025 RADIKAL. Alle Rechte vorbehalten.' : 
             language === 'en' ? '© 2025 RADIKAL. All rights reserved.' : 
             language === 'ro' ? '© 2025 RADIKAL. Toate drepturile rezervate.' : 
             '© 2025 RADIKAL. Все права защищены.'}
          </p>
          <p className="text-black/50 dark:text-white/40 text-xs mt-2">
            {language === 'de' ? 'Entwickelt mit ❤️ und Next.js' : 
             language === 'en' ? 'Built with ❤️ and Next.js' : 
             language === 'ro' ? 'Construit cu ❤️ și Next.js' : 
             'Создано с ❤️ и Next.js'}
          </p>
        </div>
      </div>
    </footer>
  );
}