// Root layout component with global styles and providers / Root-Layout-Komponente mit globalen Stilen und Providern / Componentă layout rădăcină cu stiluri globale și provideri
// This wraps the entire application with necessary providers and styling
// Dies umhüllt die gesamte Anwendung mit notwendigen Providern und Styling
// Aceasta învelește întreaga aplicație cu provideri și stilizare necesare

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import './globals.css';
import '@/styles/accessibility.css';
import { LanguageProvider } from '@/hooks/useLanguage';
import { ThemeProvider } from '@/hooks/useTheme';
import Navigation from '@/components/Navigation';
import FooterComponent from '@/components/FooterComponent';
import { ReadingModeProvider, ReadingModeOverlay } from '@/components/ReadingMode';
import { ErrorBoundary } from '@/components/ErrorBoundary';
// Organization Schema for SEO / Organisations-Schema für SEO / Schema Organizație pentru SEO
import { OrganizationSchema } from '@/components/schema';

// Dynamic imports for components not critical to initial render
const AnalyticsProvider = dynamic(() => import('@/components/AnalyticsProvider'));
const ServiceWorkerRegistration = dynamic(() => import('@/components/ServiceWorkerRegistration'));
const OfflineIndicator = dynamic(() => import('@/components/ServiceWorkerRegistration').then(m => ({ default: m.OfflineIndicator })));
const CookieConsent = dynamic(() => import('@/components/CookieConsent'));
const ToastProvider = dynamic(() => import('@/components/ToastNotifications'));

// BackgroundAnimation commented out for restoration later / BackgroundAnimation auskommentiert für spätere Wiederherstellung / BackgroundAnimation comentat pentru restaurare ulterioară
// import BackgroundAnimation from '@/components/BackgroundAnimation';

// Configure Inter font / Inter-Schrift konfigurieren / Configurează fontul Inter
const inter = Inter({ subsets: ['latin'] });

// Viewport configuration (Next.js 15+) / Viewport-Konfiguration (Next.js 15+) / Configurare viewport (Next.js 15+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

// Metadata for SEO and social sharing / Metadaten für SEO und Social Sharing / Metadate pentru SEO și distribuire socială
export const metadata: Metadata = {
  title: 'RADIKAL. - Radikale Bibellehre Blog',
  description: 'Entdecke radikale Bibellehren und tiefgreifende geistliche Einsichten. Authentische biblische Wahrheiten, die dein Leben transformieren können.',
  keywords: ['Bibel', 'Radikale Lehre', 'Spiritualität', 'Glaube', 'Blog', 'Deutsch', 'Bible', 'Radical Teaching'],
  authors: [{ name: 'D.S.' }],
  creator: 'D.S.',
  publisher: 'Radikal.',
  metadataBase: new URL('https://radikal-blog.vercel.app'),
  manifest: '/manifest.json',
  openGraph: {
    title: 'RADIKAL. - Radikale Bibellehre Blog',
    description: 'Entdecke radikale Bibellehren und tiefgreifende geistliche Einsichten.',
    url: 'https://radikal-blog.vercel.app',
    siteName: 'RADIKAL.',
    locale: 'de_DE',
    type: 'website',
    images: [
      {
        url: '/exampleblog002.jpg',
        width: 1200,
        height: 630,
        alt: 'RADIKAL Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RADIKAL. - Radikale Bibellehre Blog',
    description: 'Entdecke radikale Bibellehren und tiefgreifende geistliche Einsichten.',
    images: ['/exampleblog002.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Initialize theme before page loads to prevent flash / Theme vor dem Laden der Seite initialisieren um Blitzen zu verhindern / Inițializează tema înainte de încărcarea paginii pentru a preveni blitz-ul */}
        {/* For Tailwind darkMode: 'class' - add 'dark' class for dark mode, 'light' for light mode / Für Tailwind darkMode: 'class' - 'dark' Klasse für Dark Mode, 'light' für Light Mode hinzufügen / Pentru Tailwind darkMode: 'class' - adaugă clasa 'dark' pentru modul întunecat, 'light' pentru modul luminos */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const savedTheme = localStorage.getItem('radikal-theme');
                if (savedTheme === 'light') {
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        {/* RADIKAL Typography System - Google Fonts */}
        {/* Cinzel für Titel, EB Garamond für Text, Montserrat für Blog */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preload Cinzel for faster first paint (used in titles) */}
        <link 
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&display=swap"
          as="style"
        />
        {/* Google Fonts: Cinzel + EB Garamond + Montserrat - optimized weights */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        {/* Favicon / Favicon / Favicon */}
        {/* Using black background logo for browser tab / Logo mit schwarzem Hintergrund für Browser-Tab / Logo cu fundal negru pentru tab-ul browser-ului */}
        <link rel="icon" href="/radikal.logo.schwarz.hintergrund.png" />
      </head>
      <body suppressHydrationWarning className={`${inter.className} min-h-screen transition-colors duration-300 bg-white dark:bg-black text-black dark:text-white`}>
        {/* ThemeProvider and LanguageProvider wrap the entire app / ThemeProvider und LanguageProvider umhüllen die gesamte App / ThemeProvider și LanguageProvider învelește întreaga aplicație */}
        {/* Body uses CSS variables and .light class to switch themes / Body verwendet CSS-Variablen und .light-Klasse zum Wechseln von Themes / Body folosește variabile CSS și clasa .light pentru a schimba temele */}
        <ThemeProvider>
          <LanguageProvider>
            {/* Analytics tracking for admin dashboard / Analytics-Tracking für Admin-Dashboard / Tracking analytics pentru dashboard admin */}
            <AnalyticsProvider>
              {/* Toast notifications / Toast-Benachrichtigungen / Notificări toast */}
              <ToastProvider>
                {/* Reading mode for font size adjustments / Lesemodus für Schriftgrößenanpassungen / Mod citire pentru ajustări dimensiune font */}
                <ReadingModeProvider>
                  {/* Noise/Grain texture overlay for aesthetic effect / Rausch/Körnung-Textur-Overlay für ästhetischen Effekt / Suprapunere textură zgomot/granulație pentru efect estetic */}
                  <div className="noise-overlay" aria-hidden="true" />
                  
                  {/* Background animation component commented out for restoration later / Hintergrundanimations-Komponente für spätere Wiederherstellung auskommentiert / Componenta animație fundal comentată pentru restaurare ulterioară */}
                  {/* <BackgroundAnimation /> */}
                    
                  {/* Main navigation / Hauptnavigation / Navigare principală */}
                  <Navigation />
                  
                  {/* Reading mode overlay for distraction-free reading / Lesemodus-Overlay für ablenkungsfreies Lesen / Suprapunere mod citire pentru lectură fără distrageri */}
                  <ReadingModeOverlay />

                  {/* Main content area with proper spacing / Hauptinhaltsbereich mit richtigem Abstand / Zona de conținut principală cu spațiere corespunzătoare */}
                  <main className="relative z-10 pt-16">
                    <ErrorBoundary>
                      {children}
                    </ErrorBoundary>
                  </main>
                  
                  {/* Footer with additional information / Fußzeile mit zusätzlichen Informationen / Footer cu informații suplimentare */}
                  <FooterComponent />
                  
                  {/* PWA Service Worker Registration / PWA Service Worker Registrierung / Înregistrare PWA Service Worker */}
                  <ServiceWorkerRegistration />
                  
                  {/* Offline indicator / Offline-Anzeige / Indicator offline */}
                  <OfflineIndicator />
                  
                  {/* GDPR Cookie Consent Banner / DSGVO Cookie-Einwilligungs-Banner / Banner Consimțământ Cookie GDPR */}
                  <CookieConsent />
                  
                  {/* Organization Schema for SEO / Organisations-Schema für SEO / Schema Organizație pentru SEO */}
                  <OrganizationSchema />
                </ReadingModeProvider>
              </ToastProvider>
            </AnalyticsProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
