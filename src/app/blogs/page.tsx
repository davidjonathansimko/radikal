// Blogs page component / Blogs-Seiten-Komponente / Componentă pagina Bloguri
// This displays all blog posts with pagination and filtering
// Dies zeigt alle Blog-Posts mit Paginierung und Filterung
// Aceasta afișează toate posturile de blog cu paginare și filtrare

'use client';

import React, { Suspense, lazy, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import BackToHome from '@/components/BackToHome';
import BlogBrowse from '@/components/BlogBrowse';
import CategoryFilterBar from '@/components/CategoryFilterBar';
import LegacyOnly from '@/components/LegacyOnly';
import MobileCategoryBrowser from '@/components/MobileCategoryBrowser';
import ArchiveButton from '@/components/ArchiveButton';
import BlogsBandsSkeleton from '@/components/BlogsBandsSkeleton';
import HomeButtonGate from '@/components/HomeButtonGate';
import PageTour from '@/components/PageTour';
import { BLOGS_TOUR } from '@/lib/tours';
import ContinueReading from '@/components/ContinueReading';
import NewsletterSubscribe from '@/components/NewsletterSubscribe';
import { CircularReadingProgress } from '@/components/ReadingProgress';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

// Lazy load BlogList for better performance / Verzögertes Laden von BlogList für bessere Leistung / Încărcare leneșă BlogList pentru performanță mai bună
const BlogList = lazy(() => import('@/components/BlogList'));

// Inner component that uses useSearchParams - must be wrapped in Suspense
// Innere Komponente die useSearchParams verwendet - muss in Suspense eingepackt werden
// Componentă internă care folosește useSearchParams - trebuie împachetată în Suspense
function BlogsPageContent() {
  // Protect this route - redirect to home if modal not completed / Diese Route schützen - zur Startseite weiterleiten wenn Modal nicht abgeschlossen / Protejează această rută - redirecționează la pagină principală dacă modalul nu este finalizat
  const { isAllowed, isChecking } = useRouteProtection();
  
  // Get language and theme context / Sprach- und Themenkontext abrufen / Obține contextul limbii și temei
  const { language } = useLanguage();
  
  // Check if user is authenticated for newsletter / Prüfen ob Benutzer für Newsletter authentifiziert ist / Verifică dacă utilizatorul este autentificat pentru newsletter
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  // Pe telefon: categoria aleasa din banda de pastile (atunci lista de 6 blocuri se ascunde).
  const [mobileCategory, setMobileCategory] = useState<string | null>(null);
  const supabase = createClient();
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, [supabase.auth]);
  
  // Get URL search params for month filtering / URL-Suchparameter für Monatsfilterung abrufen / Obține parametrii de căutare URL pentru filtrare pe lună
  const searchParams = useSearchParams();
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');
  
  // Parse year and month / Jahr und Monat parsen / Parsează anul și luna
  const filterYear = yearParam ? parseInt(yearParam) : null;
  const filterMonth = monthParam ? parseInt(monthParam) - 1 : null; // 0-indexed
  
  // Get month name for display / Monatsname für Anzeige / Obține numele lunii pentru afișare
  const monthLabel = useMemo(() => {
    if (filterYear === null || filterMonth === null) return null;
    
    const monthNames = {
      de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      ro: ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'],
      ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    };
    
    return `${monthNames[language as keyof typeof monthNames]?.[filterMonth] || monthNames.en[filterMonth]} ${filterYear}`;
  }, [filterYear, filterMonth, language]);

  // Set browser tab title in user's language
  // Browser-Tab-Titel in der Sprache des Benutzers setzen
  // Setează titlul tab-ului browserului în limba utilizatorului
  useEffect(() => {
    const titles = {
      de: 'Blogs | RADIKAL',
      en: 'Blogs | RADIKAL',
      ro: 'Bloguri | RADIKAL',
      ru: 'Блоги | RADIKAL'
    };
    document.title = titles[language as keyof typeof titles] || titles.de;
    return () => { document.title = 'RADIKAL'; };
  }, [language]);

  // Show loading while checking access — Pasul 121: skeleton dots / Ladeindikator anzeigen — Skeleton-Punkte
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-gray-700 dark:text-white/60">
            {language === 'de' ? 'Wird geladen...' : 
             language === 'en' ? 'Loading...' : 
             language === 'ro' ? 'Se încarcă...' : 
             'Загрузка...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render page if access not allowed / Seite nicht rendern wenn Zugriff nicht erlaubt / Nu reda pagina dacă accesul nu este permis
  if (!isAllowed) {
    return null;
  }

  return (
    <div className="pt-2 lg:min-h-screen lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header with theme-aware text colors / Seitenkopf mit themenabhängigen Textfarben / Antet pagină cu culori text adaptate la temă */}
        {/* Pasul 0809001 — „Neueste Blogs" a plecat: numele paginii stă acum
            sus, în bara de meniu, cât timp ești aici. */}
        <header className="text-center mb-2 lg:mb-12">
          {monthLabel && (
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4 animate-fadeIn">
              {language === 'de' ? `Blogs - ${monthLabel}` : 
               language === 'en' ? `Blogs - ${monthLabel}` : 
               language === 'ro' ? `Bloguri - ${monthLabel}` : 
               `Блоги - ${monthLabel}`}
            </h1>
          )}
          
          {/* Show filter info and clear button if filtering / Filterinfo und Löschen-Button anzeigen wenn gefiltert / Afișează info filtru și buton ștergere dacă se filtrează */}
          {monthLabel && (
            <div className="flex items-center justify-center gap-4 mb-4 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              <span className="text-gray-600 dark:text-white/60 text-sm">
                {language === 'de' ? 'Gefiltert nach:' : 
                 language === 'en' ? 'Filtered by:' : 
                 language === 'ro' ? 'Filtrat după:' : 
                 'Отфильтровано по:'} <strong>{monthLabel}</strong>
              </span>
              <Link 
                href="/blogs"
                className="text-sm px-3 py-1 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 transition-colors"
              >
                ✕ {language === 'de' ? 'Filter entfernen' : language === 'en' ? 'Clear filter' : language === 'ro' ? 'Șterge filtrul' : 'Сбросить фильтр'}
              </Link>
            </div>
          )}
          {/* Back to home button - hidden on mobile, shown on desktop (moved below BlogList on mobile) */}
          <HomeButtonGate>
            <BackToHome className="mt-6 hidden lg:flex justify-center" />
          </HomeButtonGate>
          
          {/* Blog browse - alphabetical & date-based filtering / Blog-Durchsuchen - Alphabetische & Datumsbasierte Filterung / Navigare bloguri - filtrare alfabetică & pe bază de dată */}
          <LegacyOnly className="flex justify-center">
            <BlogBrowse />
          </LegacyOnly>
          <MobileCategoryBrowser
            table="blog_posts"
            itemPath="/blogs"
            onSelectedChange={setMobileCategory}
            className="mt-1 text-left"
          />
          <div className="hidden lg:block">
            <ContinueReading scope="/blogs/" className="mt-4" />
          </div>
          <LegacyOnly className="mt-4">
            <CategoryFilterBar value={categoryIds} onChange={setCategoryIds} table="blog_posts" />
          </LegacyOnly>
        </header>

        {/* Circular Progress with Back to Top / Kreisförmiger Fortschritt mit Zurück nach oben / Progres circular cu Înapoi sus */}
        <CircularReadingProgress />

        {/* Blog list component with Suspense / Blog-Listen-Komponente mit Suspense / Componentă listă blog cu Suspense */}
        <div className={`animate-fadeIn pt-2 sm:pt-4 lg:pt-0${mobileCategory ? ' hidden lg:block' : ''}`} style={{ animationDelay: '0.4s' }}>
          <Suspense fallback={
            <>
              <BlogsBandsSkeleton />
            <div className="hidden grid-cols-1 gap-6 md:grid-cols-2 lg:grid lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-300 dark:border-white/10">
                  <div className="animate-pulse">
                    <div className="h-48 bg-gray-300 dark:bg-white/10 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-white/10 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-white/10 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-white/10 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
            </>
          }>
            <BlogList filterYear={filterYear} filterMonth={filterMonth} categoryIds={categoryIds} />
          </Suspense>
        </div>

        {/* Arhiva: se deschide intr-o fereastra (an -> luna -> texte). */}
        <ArchiveButton table="blog_posts" itemPath="/blogs" className="mt-2 lg:mt-8" />
        <PageTour id="blogs" steps={BLOGS_TOUR} />

        <HomeButtonGate>
          <BackToHome className="mt-8 flex justify-center" />
        </HomeButtonGate>
      </div>
    </div>
  );
}

// Main export - wraps content in Suspense for useSearchParams
// Hauptexport - verpackt Inhalt in Suspense für useSearchParams
// Export principal - împachetează conținutul în Suspense pentru useSearchParams
export default function BlogsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    }>
      <BlogsPageContent />
    </Suspense>
  );
}
