// Back to home button component for mobile views
// Zurück zur Startseite Button-Komponente für mobile Ansichten

'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { FaHome } from 'react-icons/fa';

interface BackToHomeProps {
  className?: string;
}

export default function BackToHome({ className = '' }: BackToHomeProps) {
  const { language } = useLanguage();

  return (
    <div className={`block lg:hidden ${className}`}>
      <Link 
        href="/"
        className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-sm font-medium rounded-lg transition-all duration-300 border border-white/20 hover:border-white/30"
      >
        <FaHome className="mr-2 w-4 h-4" />
        <span>{language === 'de' ? 'Zurück zur Startseite' : 
               language === 'en' ? 'Back to Home' : 
               language === 'ro' ? 'Înapoi Acasă' : 
               'Назад домой'}</span>
      </Link>
    </div>
  );
}
