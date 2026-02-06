// Admin Analytics Dashboard Page / Admin Analytics-Dashboard-Seite / Pagina Dashboard Analytics Admin
// Real-time analytics for tracking website visitors and engagement
// Echtzeit-Analytik zur Verfolgung von Website-Besuchern und Engagement
// Analiză în timp real pentru urmărirea vizitatorilor și angajamentului pe site

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { createClient } from '@/lib/supabase';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { FaArrowLeft, FaChartLine, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';

// Translations for the analytics page / Übersetzungen für die Analytics-Seite
const translations = {
  de: {
    title: 'Analytics Dashboard',
    subtitle: 'Echtzeit-Statistiken und Besucheranalyse',
    backToAdmin: 'Zurück zum Admin',
    loading: 'Dashboard wird geladen...',
    accessDenied: 'Zugriff verweigert',
    loginRequired: 'Bitte melde dich als Admin an'
  },
  en: {
    title: 'Analytics Dashboard',
    subtitle: 'Real-time statistics and visitor analysis',
    backToAdmin: 'Back to Admin',
    loading: 'Loading dashboard...',
    accessDenied: 'Access Denied',
    loginRequired: 'Please login as admin'
  },
  ro: {
    title: 'Panou de Analiză',
    subtitle: 'Statistici în timp real și analiza vizitatorilor',
    backToAdmin: 'Înapoi la Admin',
    loading: 'Se încarcă panoul...',
    accessDenied: 'Acces refuzat',
    loginRequired: 'Te rugăm să te autentifici ca admin'
  },
  ru: {
    title: 'Панель аналитики',
    subtitle: 'Статистика в реальном времени и анализ посетителей',
    backToAdmin: 'Назад к админке',
    loading: 'Загрузка панели...',
    accessDenied: 'Доступ запрещён',
    loginRequired: 'Пожалуйста, войдите как администратор'
  }
};

export default function AnalyticsPage() {
  // Get language context and router / Sprachkontext und Router abrufen
  const { language } = useLanguage();
  const router = useRouter();
  const t = translations[language as keyof typeof translations] || translations.de;
  
  // Component state / Komponentenstatus
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Supabase client / Supabase-Client
  const supabase = createClient();

  // Check admin access on mount / Admin-Zugriff beim Laden prüfen
  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Verify admin access / Admin-Zugriff überprüfen
  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Check if user is admin / Prüfen, ob Benutzer Admin ist
      const adminEmail = 'davidsimko22@yahoo.com';
      if (user.email === adminEmail) {
        setIsAdmin(true);
      } else {
        router.push('/');
        return;
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state / Ladezustand anzeigen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-white/80">{t.loading}</p>
        </div>
      </div>
    );
  }

  // Show access denied / Zugriff verweigert anzeigen
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">{t.accessDenied}</h1>
          <p className="text-white/80">{t.loginRequired}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with navigation / Header mit Navigation */}
        <header className="mb-8">
          {/* Back button / Zurück-Button */}
          <Link 
            href="/admin"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-200 mb-6 group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" />
            <span>{t.backToAdmin}</span>
          </Link>
          
          {/* Title / Titel */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <FaChartLine className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white animate-fadeIn">
                {t.title}
              </h1>
              <p className="text-white/60 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                {t.subtitle}
              </p>
            </div>
          </div>
        </header>

        {/* Analytics Dashboard Component / Analytics-Dashboard-Komponente */}
        <div className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <AnalyticsDashboard />
        </div>
      </div>
    </div>
  );
}
