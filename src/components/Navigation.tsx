// Main navigation component / Hauptnavigations-Komponente / Componentă navigare principală
// This creates the top navigation with logo, menu items, and language switcher
// Dies erstellt die obere Navigation mit Logo, Menüelementen und Sprachumschalter
// Aceasta creează navigarea superioară cu logo, elemente de meniu și comutator de limbă

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { FaSun, FaMoon, FaSearch, FaBookmark } from 'react-icons/fa';
import SearchModal from '@/components/SearchModal';

// Flag SVG components for reliable display / Flaggen-SVG-Komponenten für zuverlässige Anzeige / Componente SVG steaguri pentru afișare fiabilă
const FlagDE = ({ className = "w-5 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 5 3" xmlns="http://www.w3.org/2000/svg">
    <rect width="5" height="1" y="0" fill="#000000"/>
    <rect width="5" height="1" y="1" fill="#DD0000"/>
    <rect width="5" height="1" y="2" fill="#FFCC00"/>
  </svg>
);

const FlagGB = ({ className = "w-5 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="30" fill="#012169"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
    <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10"/>
    <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6"/>
  </svg>
);

const FlagRO = ({ className = "w-5 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
    <rect width="1" height="2" x="0" fill="#002B7F"/>
    <rect width="1" height="2" x="1" fill="#FCD116"/>
    <rect width="1" height="2" x="2" fill="#CE1126"/>
  </svg>
);

const FlagRU = ({ className = "w-5 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 9 6" xmlns="http://www.w3.org/2000/svg">
    <rect width="9" height="2" y="0" fill="#FFFFFF"/>
    <rect width="9" height="2" y="2" fill="#0039A6"/>
    <rect width="9" height="2" y="4" fill="#D52B1E"/>
  </svg>
);

// Helper component to render the correct flag / Hilfskomponente zur Anzeige der richtigen Flagge / Componentă ajutătoare pentru a reda steagul corect
const LanguageFlag = ({ lang, className = "w-5 h-4" }: { lang: string; className?: string }) => {
  switch (lang) {
    case 'de': return <FlagDE className={className} />;
    case 'en': return <FlagGB className={className} />;
    case 'ro': return <FlagRO className={className} />;
    case 'ru': return <FlagRU className={className} />;
    default: return <FlagDE className={className} />;
  }
};

export default function Navigation() {
  // Get current path for active link highlighting / Aktuellen Pfad für aktive Link-Hervorhebung abrufen / Obține calea curentă pentru evidențierea link-ului activ
  const pathname = usePathname();
  
  // Get language context / Sprachkontext abrufen / Obține contextul limbii
  const { language, setLanguage, t } = useLanguage();
  
  // Get theme context / Themenkontext abrufen / Obține contextul temei
  const { theme, toggleTheme } = useTheme();
  
  // User authentication state / Benutzer-Authentifizierungsstatus / Stare autentificare utilizator
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Mobile menu state / Mobile Menü-Status / Stare meniu mobil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Search modal state / Such-Modal-Status / Stare modal căutare
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Language dropdown state / Sprach-Dropdown-Status / Stare dropdown limbă
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showMobileLanguageDropdown, setShowMobileLanguageDropdown] = useState(false);
  
  // Blogs dropdown state / Blog-Dropdown-Status / Stare dropdown bloguri
  const [showBlogsDropdown, setShowBlogsDropdown] = useState(false);
  const [showMobileBlogsDropdown, setShowMobileBlogsDropdown] = useState(false);
  const [blogMonths, setBlogMonths] = useState<{month: number; year: number; count: number; label: string}[]>([]);

  // Initialize Supabase client / Supabase-Client initialisieren / Inițializează clientul Supabase
  const supabase = createClient();

  // Check user authentication status on component mount / Benutzer-Authentifizierungsstatus beim Laden der Komponente prüfen / Verifică starea autentificării utilizatorului la montarea componentei
  useEffect(() => {
    // Get initial session / Anfangssession abrufen / Obține sesiunea inițială
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      // Check if user is admin / Prüfen, ob Benutzer Admin ist / Verifică dacă utilizatorul este admin
      if (session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL || 
          session?.user?.email === 'davidsimko22@yahoo.com') {
        setIsAdmin(true);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth state changes / Auf Authentifizierungsstatusänderungen hören / Ascultă schimbările stării de autentificare
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        setUser(session?.user ?? null);
        
        // Update admin status / Admin-Status aktualisieren / Actualizează starea de admin
        if (session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL || 
            session?.user?.email === 'davidsimko22@yahoo.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Fetch blog months for dropdown / Blog-Monate für Dropdown abrufen / Obține lunile cu bloguri pentru dropdown
  const fetchBlogMonths = useCallback(async () => {
    try {
      // Fetch ALL published blog posts with no implicit limit
      const { data: blogs, error } = await supabase
        .from('blog_posts')
        .select('created_at')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(5000);

      if (error || !blogs) return;

      // Group blogs by month and year / Bloguri grupate pe lună și an / Grupează blogurile pe lună și an
      const monthsMap = new Map<string, {month: number; year: number; count: number}>();
      
      blogs.forEach(blog => {
        const date = new Date(blog.created_at);
        const month = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${month}`;
        
        if (monthsMap.has(key)) {
          monthsMap.get(key)!.count++;
        } else {
          monthsMap.set(key, { month, year, count: 1 });
        }
      });

      // Convert to array and add labels / Convertește în array și adaugă etichete
      const monthNames = {
        de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        ro: ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'],
        ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
      };

      const monthsArray = Array.from(monthsMap.values()).map(item => ({
        ...item,
        label: `${monthNames[language as keyof typeof monthNames]?.[item.month] || monthNames.en[item.month]} ${item.year}`
      }));

      // Sort by year and month descending / Sortare după an și lună descrescător
      monthsArray.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.month - a.month;
      });

      setBlogMonths(monthsArray);
    } catch (error) {
      console.error('Error fetching blog months:', error);
    }
  }, [supabase, language]);

  // Initial fetch + refetch on language change
  useEffect(() => {
    fetchBlogMonths();
  }, [fetchBlogMonths]);

  // Refetch blog months when mobile menu is opened (to catch newly added blogs)
  useEffect(() => {
    if (isMobileMenuOpen) {
      fetchBlogMonths();
    }
  }, [isMobileMenuOpen, fetchBlogMonths]);

  // Close language dropdowns and mobile menu when clicking outside / Sprach-Dropdowns und mobiles Menü schließen beim Klicken außerhalb / Închide dropdown-urile de limbă și meniul mobil când se dă clic în afara lor
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close language dropdowns if clicking outside of them / Sprach-Dropdowns schließen, wenn außerhalb geklickt wird / Închide dropdown-urile de limbă dacă se dă clic în afara lor
      if (!target.closest('.language-dropdown')) {
        setShowLanguageDropdown(false);
        setShowMobileLanguageDropdown(false);
      }
      
      // Close blogs dropdown if clicking outside / Închide dropdown-ul bloguri dacă se dă clic în afara lui
      if (!target.closest('.blogs-dropdown')) {
        setShowBlogsDropdown(false);
      }
      
      // Close mobile menu if clicking outside of mobile menu area and hamburger button / Mobiles Menü schließen, wenn außerhalb des mobilen Menübereichs und Hamburger-Buttons geklickt wird / Închide meniul mobil dacă se dă clic în afara zonei de meniu mobil și a butonului hamburger
      if (!target.closest('.mobile-menu-container') && !target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ctrl+K keyboard shortcut for search / Ctrl+K Tastaturkürzel für Suche / Shortcut Ctrl+K pentru căutare
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K or Cmd+K (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // STEP 700: Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Handle language change with persistence
  const handleLanguageChange = async (newLang: 'de' | 'en' | 'ro' | 'ru') => {
    setLanguage(newLang);
    setShowLanguageDropdown(false);
    setShowMobileLanguageDropdown(false);
    
    // Save language based on authentication status
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Authenticated user - save in localStorage
        localStorage.setItem('radikalSelectedLanguage', newLang);
      } else {
        // Guest - save in sessionStorage
        sessionStorage.setItem('radikalGuestLanguage', newLang);
      }
    } catch (error) {
      console.error('Error saving language:', error);
      // Save in sessionStorage as fallback
      sessionStorage.setItem('radikalGuestLanguage', newLang);
    }
  };

  // Handle user logout / Benutzer-Abmeldung verarbeiten / Gestionează deconectarea utilizatorului
  const handleLogout = async () => {
    try {
      setLoading(true);
      
      // Clear any cached auth data first
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear local state immediately
      setUser(null);
      setIsAdmin(false);
      
      // Clear all radikal-related storage so WelcomeModal shows again
      // Alle radikal-bezogenen Speicher löschen damit WelcomeModal wieder erscheint
      // Șterge toate datele radikal din stocare pentru ca WelcomeModal să apară din nou
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('radikalSelectedLanguage');
      sessionStorage.removeItem('radikalModalSeen');
      sessionStorage.removeItem('radikalGuestLanguage');
      sessionStorage.removeItem('radikalSplashShown');
      
      // Redirect to homepage — WelcomeModal will show with logo + verse
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      setUser(null);
      setIsAdmin(false);
      localStorage.removeItem('radikalSelectedLanguage');
      sessionStorage.removeItem('radikalModalSeen');
      sessionStorage.removeItem('radikalGuestLanguage');
      sessionStorage.removeItem('radikalSplashShown');
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  // Navigation menu items / Navigationsmenü-Elemente / Elemente meniu navigare
  const navigationItems = [
    { href: '/blogs', label: language === 'de' ? 'Blogs' : language === 'en' ? 'Blogs' : language === 'ro' ? 'Bloguri' : 'Блоги' },
    { href: '/about', label: language === 'de' ? 'Über' : language === 'en' ? 'About' : language === 'ro' ? 'Despre' : 'О нас' },
    { href: '/contact', label: language === 'de' ? 'Kontakt' : language === 'en' ? 'Contact' : language === 'ro' ? 'Contact' : 'Контакт' },
  ];

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/20 dark:bg-black/20 backdrop-blur-md border-b border-black/10 dark:border-white/10">
      {/* Fluid padding and gap using clamp() for smooth scaling */}
      {/* Increased vw percentages to better use available space on medium screens */}
      <div className="max-w-7xl mx-auto" style={{ padding: '0 clamp(8px, 3vw, 32px)' }}>
        <div className="flex items-center justify-between h-16 min-w-0" style={{ gap: 'clamp(8px, 3vw, 24px)' }}>
          {/* Logo section / Logo-Bereich / Secțiune logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3">
              {/* Radikal logo - switches based on theme, larger size with less rounded corners */}
              {/* Radikal-Logo - wechselt je nach Theme, größer mit weniger abgerundeten Ecken */}
              {/* Logo Radikal - se schimbă în funcție de temă, mai mare cu margini mai puțin rotunjite */}
              {/* Light Mode: black background logo / Light Mode: Logo mit schwarzem Hintergrund / Light Mode: logo cu fundal negru */}
              {/* Dark Mode: white background logo / Dark Mode: Logo mit weißem Hintergrund / Dark Mode: logo cu fundal alb */}
              {/* Fluid logo size using clamp() - scales smoothly from 80px to 120px */}
              {/* Increased vw% to grow more on medium screens (390-412px) */}
              <Image
                src={theme === 'dark' ? '/radikal.logo.weiß.hintergrund.png' : '/radikal.logo.schwarz.hintergrund.png'}
                alt="Radikal Logo"
                width={120}
                height={120}
                className="rounded-sm h-auto"
                style={{ width: 'clamp(80px, 28vw, 120px)' }}
              />
              {/* Site title with Cinzel font / Website-Titel mit Cinzel-Schrift / Titlu site cu fontul Cinzel */}
              <span className="font-cinzel text-2xl font-bold text-black dark:text-white tracking-wider">
                
              </span>
            </Link>
          </div>

          {/* Desktop navigation menu / Desktop-Navigationsmenü / Meniu navigare desktop */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* Blogs dropdown with months submenu / Blog-Dropdown mit Monats-Untermenü / Dropdown bloguri cu submeniu luni */}
            <div 
              className="relative blogs-dropdown"
              onMouseEnter={() => setShowBlogsDropdown(true)}
              onMouseLeave={() => setShowBlogsDropdown(false)}
            >
              <Link
                href="/blogs"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                  pathname === '/blogs' || pathname.startsWith('/blogs/')
                    ? 'text-black dark:text-white bg-black/20 dark:bg-white/20'
                    : 'text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                <span>{language === 'de' ? 'Blogs' : language === 'en' ? 'Blogs' : language === 'ro' ? 'Bloguri' : 'Блоги'}</span>
                {blogMonths.length > 0 && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </Link>
              
              {/* Blogs months dropdown / Blog-Monate-Dropdown / Dropdown luni bloguri */}
              {showBlogsDropdown && blogMonths.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-black rounded-lg shadow-xl py-2 z-50 border border-black/20 dark:border-white/20 max-h-80 overflow-y-auto">
                  {/* All blogs link / Alle Blogs Link / Link toate blogurile */}
                  <Link
                    href="/blogs"
                    className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 font-medium border-b border-black/10 dark:border-white/10"
                    onClick={() => setShowBlogsDropdown(false)}
                  >
                    {language === 'de' ? '🗁 Alle Blogs' : language === 'en' ? '🗁 All Blogs' : language === 'ro' ? '🗁 Toate Blogurile' : '🗁 Все блоги'}
                  </Link>
                  
                  {/* Month links / Monatslinks / Link-uri luni */}
                  {blogMonths.map((item) => (
                    <Link
                      key={`${item.year}-${item.month}`}
                      href={`/blogs?year=${item.year}&month=${item.month + 1}`}
                      className="block px-4 py-2 text-sm text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200"
                      onClick={() => setShowBlogsDropdown(false)}
                    >
                      <span className="flex items-center justify-between">
                        <span>🗒 {item.label}</span>
                        <span className="text-xs bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">{item.count}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Other navigation items / Andere Navigationselemente / Alte elemente navigare */}
            {navigationItems.filter(item => item.href !== '/blogs').map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  pathname === item.href
                    ? 'text-black dark:text-white bg-black/20 dark:bg-white/20'
                    : 'text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Admin link for authorized users / Admin-Link für autorisierte Benutzer / Link admin pentru utilizatori autorizați */}
            {user && isAdmin && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  pathname === '/admin'
                    ? 'text-yellow-300 bg-yellow-500/20'
                    : 'text-yellow-300/80 hover:text-yellow-300 hover:bg-yellow-500/10'
                }`}
              >
                {language === 'de' ? 'Admin' : language === 'en' ? 'Admin' : language === 'ro' ? 'Admin' : 'Админ'}
              </Link>
            )}
          </div>

          {/* Right side controls / Rechte Seitensteuerungen / Controale parte dreaptă */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Back to Home button (only show when not on homepage) */}
            {pathname !== '/' && (
              <Link
                href="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 flex items-center space-x-1"
                title={language === 'de' ? 'Zurück zur Startseite' : language === 'en' ? 'Back to Home' : language === 'ro' ? 'Înapoi la Început' : 'На главную'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden xl:block">
                  {language === 'de' ? 'Startseite' : language === 'en' ? 'Home' : language === 'ro' ? 'Acasă' : 'Главная'}
                </span>
              </Link>
            )}

            {/* Language switcher with SVG flag icons / Sprachumschalter mit SVG-Flaggen / Comutator limbă cu icoane steaguri SVG */}
            <div className="relative language-dropdown">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="px-3 py-1 rounded-md text-sm font-medium text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 flex items-center space-x-2"
                title={language === 'de' ? 'Sprache wechseln' : language === 'en' ? 'Switch Language' : language === 'ro' ? 'Schimbă Limba' : 'Переключить язык'}
              >
                {/* Show SVG flag for selected language / Zeige SVG-Flagge für ausgewählte Sprache / Afișează steag SVG pentru limba selectată */}
                <LanguageFlag lang={language} className="w-6 h-4 rounded-sm shadow-sm" />
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Language dropdown menu with SVG flags */}
              {showLanguageDropdown && (
                <div className="absolute top-full right-0 mt-1 w-36 bg-white dark:bg-black rounded-md shadow-lg py-1 z-50 border border-black/20 dark:border-white/20">
                  <button
                    onClick={() => handleLanguageChange('de')}
                    className={`w-full text-left px-3 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 flex items-center space-x-2 ${language === 'de' ? 'bg-black/10 dark:bg-white/10' : ''}`}
                  >
                    <FlagDE className="w-5 h-3 rounded-sm" />
                    <span>Deutsch</span>
                  </button>
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`w-full text-left px-3 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 flex items-center space-x-2 ${language === 'en' ? 'bg-black/10 dark:bg-white/10' : ''}`}
                  >
                    <FlagGB className="w-5 h-3 rounded-sm" />
                    <span>English</span>
                  </button>
                  <button
                    onClick={() => handleLanguageChange('ro')}
                    className={`w-full text-left px-3 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 flex items-center space-x-2 ${language === 'ro' ? 'bg-black/10 dark:bg-white/10' : ''}`}
                  >
                    <FlagRO className="w-5 h-3 rounded-sm" />
                    <span>Română</span>
                  </button>
                  <button
                    onClick={() => handleLanguageChange('ru')}
                    className={`w-full text-left px-3 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 flex items-center space-x-2 ${language === 'ru' ? 'bg-black/10 dark:bg-white/10' : ''}`}
                  >
                    <FlagRU className="w-5 h-3 rounded-sm" />
                    <span>Русский</span>
                  </button>
                </div>
              )}
            </div>

            {/* Search button / Such-Button / Buton căutare */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-3 py-2 rounded-md text-sm font-medium text-white/80 dark:text-white/80 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10 transition-colors duration-200 flex items-center space-x-1"
              title={language === 'de' ? 'Suchen' : language === 'en' ? 'Search' : language === 'ro' ? 'Căutare' : 'Поиск'}
            >
              <FaSearch className="w-4 h-4" />
            </button>

            {/* Bookmarks link / Lesezeichen-Link / Link bookmark-uri */}
            {user && (
              <Link
                href="/bookmarks"
                className="px-3 py-2 rounded-md text-sm font-medium text-white/80 dark:text-white/80 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10 transition-colors duration-200 flex items-center space-x-1"
                title={language === 'de' ? 'Lesezeichen' : language === 'en' ? 'Bookmarks' : language === 'ro' ? 'Bookmark-uri' : 'Закладки'}
              >
                <FaBookmark className="w-4 h-4" />
              </Link>
            )}

            {/* Theme toggle button with animation / Themenumschalter mit Animation / Buton comutare temă cu animație */}
            <button
              onClick={toggleTheme}
              className="px-3 py-2 rounded-md text-sm font-medium text-white/80 dark:text-white/80 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10 transition-all duration-300 flex items-center space-x-1 group"
              title={theme === 'dark' ? (language === 'de' ? 'Helles Thema' : language === 'en' ? 'Light Theme' : language === 'ro' ? 'Temă Luminoasă' : 'Светлая тема') : (language === 'de' ? 'Dunkles Thema' : language === 'en' ? 'Dark Theme' : language === 'ro' ? 'Temă Întunecată' : 'Темная тема')}
            >
              <span className="relative w-4 h-4 transition-transform duration-500 ease-out group-hover:scale-110">
                {theme === 'dark' ? (
                  <FaSun className="w-4 h-4 animate-spin-slow text-yellow-50 drop-shadow-[0_0_6px_rgba(255,255,230,0.5)]" style={{ animationDuration: '20s' }} />
                ) : (
                  <FaMoon className="w-4 h-4 text-slate-400 drop-shadow-[0_0_6px_rgba(148,163,184,0.4)] transition-transform duration-300 group-hover:rotate-12" />
                )}
              </span>
            </button>

            {/* Authentication controls / Authentifizierungssteuerungen / Controale autentificare */}
            {!loading && (
              <div className="flex items-center space-x-3">
                {user ? (
                  // Logged in user menu / Angemeldetes Benutzermenü / Meniu utilizator autentificat
                  <div className="flex items-center space-x-3">
                    <span className="text-black/80 dark:text-white/80 text-sm">
                      {user.email}
                    </span>
                    <button
                      onClick={handleLogout}
                      disabled={loading}
                      className="px-3 py-1 rounded-md text-sm font-medium text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 disabled:opacity-50">
                    
                      {loading ? (language === 'de' ? 'Abmelden...' : language === 'en' ? 'Logging out...' : language === 'ro' ? 'Se deconectează...' : 'Выход...') : 
                                 (language === 'de' ? 'Abmelden' : language === 'en' ? 'Logout' : language === 'ro' ? 'Deconectare' : 'Выйти')}
                    </button>
                  </div>
                ) : (
                  // Login link for guests / Anmelde-Link für Gäste / Link conectare pentru vizitatori
                  <Link
                    href="/auth/login"
                    className="px-3 py-1 rounded-md text-sm font-medium text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200">
                  
                    {language === 'de' ? 'Anmelden' : language === 'en' ? 'Login' : language === 'ro' ? 'Conectare' : 'Войти'}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Mobile controls - Theme, Language and Hamburger / Mobile Steuerungen - Thema, Sprache und Hamburger / Controale mobile - Temă, Limbă și Hamburger */}
          {/* STEP 700: Mobile controls - language, search, theme + Neuralink hamburger */}
          <div className="flex lg:hidden items-center flex-shrink-0" style={{ gap: 'clamp(2px, 2.5vw, 16px)' }}>
            {/* Language switcher for mobile */}
            <div className="relative language-dropdown">
              <button
                onClick={() => setShowMobileLanguageDropdown(!showMobileLanguageDropdown)}
                className="px-2 py-1 rounded-md text-xs font-medium text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 flex items-center space-x-1"
                title={language === 'de' ? 'Sprache wechseln' : language === 'en' ? 'Switch Language' : language === 'ro' ? 'Schimbă Limba' : 'Переключить язык'}
              >
                <span style={{ width: 'clamp(18px, 6vw, 26px)', height: 'clamp(12px, 4vw, 18px)' }}>
                  <LanguageFlag lang={language} className="w-full h-full rounded-sm shadow-sm" />
                </span>
                <svg style={{ width: 'clamp(12px, 3.5vw, 16px)', height: 'clamp(12px, 3.5vw, 16px)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showMobileLanguageDropdown && (
                <div className="absolute top-full right-0 mt-1 min-w-[100px] bg-white dark:bg-black rounded-md shadow-lg py-1 z-[100] border border-black/20 dark:border-white/20">
                  <button onClick={() => handleLanguageChange('de')} className={`w-full text-left px-3 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 flex items-center space-x-2 ${language === 'de' ? 'bg-black/10 dark:bg-white/10' : ''}`}>
                    <FlagDE className="w-5 h-4 rounded-sm flex-shrink-0" /><span>Deutsch</span>
                  </button>
                  <button onClick={() => handleLanguageChange('en')} className={`w-full text-left px-3 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 flex items-center space-x-2 ${language === 'en' ? 'bg-black/10 dark:bg-white/10' : ''}`}>
                    <FlagGB className="w-5 h-4 rounded-sm flex-shrink-0" /><span>English</span>
                  </button>
                  <button onClick={() => handleLanguageChange('ro')} className={`w-full text-left px-3 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 flex items-center space-x-2 ${language === 'ro' ? 'bg-black/10 dark:bg-white/10' : ''}`}>
                    <FlagRO className="w-5 h-4 rounded-sm flex-shrink-0" /><span>Română</span>
                  </button>
                  <button onClick={() => handleLanguageChange('ru')} className={`w-full text-left px-3 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 flex items-center space-x-2 ${language === 'ru' ? 'bg-black/10 dark:bg-white/10' : ''}`}>
                    <FlagRU className="w-5 h-4 rounded-sm flex-shrink-0" /><span>Русский</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile search button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="rounded-md text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200"
              style={{ padding: 'clamp(8px, 2.5vw, 12px)' }}
              title={language === 'de' ? 'Suchen (Ctrl+K)' : language === 'en' ? 'Search (Ctrl+K)' : language === 'ro' ? 'Căutare (Ctrl+K)' : 'Поиск (Ctrl+K)'}
            >
              <FaSearch style={{ width: 'clamp(18px, 5.5vw, 24px)', height: 'clamp(18px, 5.5vw, 24px)' }} />
            </button>

            {/* Mobile theme toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-md text-white/80 dark:text-white/80 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10 transition-all duration-300 group"
              style={{ padding: 'clamp(8px, 2.5vw, 12px)' }}
              title={theme === 'dark' ? (language === 'de' ? 'Helles Thema' : language === 'en' ? 'Light Theme' : language === 'ro' ? 'Temă Luminoasă' : 'Светлая тема') : (language === 'de' ? 'Dunkles Thema' : language === 'en' ? 'Dark Theme' : language === 'ro' ? 'Temă Întunecată' : 'Темная тема')}
            >
              <span className="relative block transition-transform duration-500 ease-out group-active:scale-125" style={{ width: 'clamp(18px, 5.5vw, 24px)', height: 'clamp(18px, 5.5vw, 24px)' }}>
                {theme === 'dark' ? (
                  <FaSun className="w-full h-full animate-spin-slow text-yellow-50 drop-shadow-[0_0_6px_rgba(255,255,230,0.5)]" style={{ animationDuration: '20s' }} />
                ) : (
                  <FaMoon className="w-full h-full text-slate-400 drop-shadow-[0_0_6px_rgba(148,163,184,0.4)]" />
                )}
              </span>
            </button>

            {/* Hamburger menu button - 2 lines Neuralink style */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-button p-2 text-black dark:text-white transition-all duration-200"
              aria-label="Menu"
            >
              <svg style={{ width: 'clamp(22px, 7vw, 28px)', height: '16' }} viewBox="0 0 28 16" fill="none" className="block">
                <line x1="0" y1="2" x2="28" y2="2" stroke="currentColor" strokeWidth="2" />
                <line x1="0" y1="14" x2="28" y2="14" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

    </nav>
    
    {/* Search Modal outside nav to avoid blur effect on modal itself */}
    {/* Such-Modal außerhalb von nav um Blur-Effekt auf Modal selbst zu vermeiden */}
    {/* Modal căutare în afara nav pentru a evita efectul blur pe modal în sine */}
    {/* STEP 700: Full-screen Neuralink-style mobile menu — rendered OUTSIDE nav to avoid .light nav * override */}
    {isMobileMenuOpen && (
      <div className="mobile-menu-container fixed inset-0 z-[200] lg:hidden" style={{ animation: 'mobileMenuSlideIn 0.25s ease-out forwards' }}>
        {/* Background - adapts to theme */}
        <div className="absolute inset-0 bg-white dark:bg-black" />
        <div className="relative z-10 flex flex-col h-full text-black dark:text-white">
          {/* Header: Logo left, X button right */}
          <div className="flex items-center justify-between" style={{ padding: '16px clamp(20px, 5vw, 32px)', height: '64px' }}>
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex-shrink-0">
              <Image
                src={theme === 'dark' ? '/radikal.logo.wei\u00df.hintergrund.png' : '/radikal.logo.schwarz.hintergrund.png'}
                alt="Radikal Logo"
                width={80}
                height={80}
                className="rounded-sm h-auto"
                style={{ width: 'clamp(70px, 22vw, 100px)' }}
              />
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="mobile-menu-button p-2 text-black dark:text-white hover:text-black/60 dark:hover:text-white/70 transition-all duration-200"
              aria-label="Close menu"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <line x1="1" y1="1" x2="21" y2="21" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="21" y1="1" x2="1" y2="21" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>
          </div>

          {/* Navigation links - large text, vertically centered */}
          <div className="flex-1 flex flex-col justify-center overflow-y-auto" style={{ padding: '0 clamp(28px, 8vw, 56px)' }}>
            <div className="space-y-2">
              {navigationItems.map((item) => (
                item.href === '/blogs' ? (
                  <div key={item.href} className="blogs-dropdown">
                    <button
                      onClick={() => setShowMobileBlogsDropdown(!showMobileBlogsDropdown)}
                      className={`w-full text-left text-[38px] sm:text-[48px] font-light py-3 transition-colors duration-200 flex items-center justify-between ${
                        pathname === '/blogs' || pathname.startsWith('/blogs/')
                          ? 'text-black dark:text-white'
                          : 'text-black/90 dark:text-white/90 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {blogMonths.length > 0 && (
                        <svg className={`w-6 h-6 transition-transform duration-300 ${showMobileBlogsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                    {showMobileBlogsDropdown && blogMonths.length > 0 && (
                      <div className="ml-4 mt-1 space-y-0 border-l border-black/15 dark:border-white/15 pl-4 mb-2">
                        <Link
                          href="/blogs"
                          onClick={() => { setIsMobileMenuOpen(false); setShowMobileBlogsDropdown(false); }}
                          className="flex items-center gap-3 py-2.5 text-lg text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
                        >
                          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 17V8.89627C3 6.16864 3 4.80482 3.82186 3.93706C3.85921 3.89763 3.89763 3.85921 3.93706 3.82186C4.80482 3 6.16864 3 8.89627 3H9.19722C9.91179 3 10.2691 3 10.5895 3.112C10.7852 3.18039 10.9691 3.27879 11.1345 3.40367C11.4054 3.60816 11.6036 3.90544 12 4.5C12.3964 5.09456 12.5946 5.39184 12.8655 5.59633C13.0309 5.72121 13.2148 5.81961 13.4105 5.888C13.7309 6 14.0882 6 14.8028 6H17C18.8856 6 19.8284 6 20.4142 6.58579C21 7.17157 21 8.11438 21 10V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M6.18537 14.9294C6.57684 13.5201 6.77258 12.8155 7.30902 12.4077C7.84546 12 8.57679 12 10.0394 12H15.7582C18.1648 12 19.3681 12 19.9685 12.7866C20.5688 13.5732 20.2514 14.7339 19.6165 17.0553L19.343 18.0553C18.9556 19.4716 18.7619 20.1797 18.2245 20.5899C17.6871 21 16.953 21 15.4847 21H9.76167C7.34616 21 6.1384 21 5.53812 20.2103C4.93785 19.4205 5.2611 18.2568 5.90759 15.9294L6.18537 14.9294Z" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                          {language === 'de' ? 'Alle Blogs' : language === 'en' ? 'All Blogs' : language === 'ro' ? 'Toate Blogurile' : 'Все блоги'}
                        </Link>
                        {blogMonths.map((monthItem) => (
                          <Link
                            key={`${monthItem.year}-${monthItem.month}`}
                            href={`/blogs?year=${monthItem.year}&month=${monthItem.month + 1}`}
                            onClick={() => { setIsMobileMenuOpen(false); setShowMobileBlogsDropdown(false); }}
                            className="flex items-center gap-3 py-2.5 text-base text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
                          >
                            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21 13V8.5C21 6.61438 21 5.67157 20.4142 5.08578C19.8284 4.5 18.8856 4.5 17 4.5L6.99999 4.50002C5.11438 4.50002 4.17157 4.50002 3.58579 5.08581C3 5.67159 3 6.6144 3 8.50002V17C3 18.8856 3 19.8285 3.58579 20.4142C4.17157 21 5.11438 21 7 21H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M8.05 14L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M8.05 17L8 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M12.05 14L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M8 3L8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <path d="M16 3L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <path d="M19.5 19.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <path d="M20 17.5C20 18.8807 18.8807 20 17.5 20C16.1193 20 15 18.8807 15 17.5C15 16.1193 16.1193 15 17.5 15C18.8807 15 20 16.1193 20 17.5Z" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                            <span className="flex-1">{monthItem.label}</span>
                            <span className="text-sm text-black/30 dark:text-white/30">{monthItem.count}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block text-[38px] sm:text-[48px] font-light py-3 transition-colors duration-200 ${
                      pathname === item.href
                        ? 'text-black dark:text-white'
                        : 'text-black/90 dark:text-white/90 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              ))}

              {/* Admin link */}
              {user && isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-[38px] sm:text-[48px] font-light text-amber-500/80 dark:text-amber-400/80 hover:text-amber-500 dark:hover:text-amber-400 py-3 transition-colors duration-200"
                >
                  Admin
                </Link>
              )}
            </div>

            {/* Anmelden / Login pill button - Neuralink style */}
            <div className="mt-12">
              {!loading && (
                user ? (
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-lg font-medium hover:bg-black/85 dark:hover:bg-white/90 transition-colors duration-200"
                  >
                    {language === 'de' ? 'Abmelden' : language === 'en' ? 'Logout' : language === 'ro' ? 'Deconectare' : 'Выйти'}
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-lg font-medium hover:bg-black/85 dark:hover:bg-white/90 transition-colors duration-200"
                  >
                    {language === 'de' ? 'Anmelden' : language === 'en' ? 'Login' : language === 'ro' ? 'Conectare' : 'Войти'}
                    <svg width="12" height="12" viewBox="0 0 11 11" fill="none"><path d="M1 10L10 1M10 1H3M10 1V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </Link>
                )
              )}
            </div>
          </div>

          {/* Bottom padding */}
          <div style={{ height: 'clamp(24px, 6vh, 48px)' }} />
        </div>
      </div>
    )}

    <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
