// Main navigation component / Hauptnavigations-Komponente / Componentă navigare principală
// This creates the top navigation with logo, menu items, and language switcher
// Dies erstellt die obere Navigation mit Logo, Menüelementen und Sprachumschalter
// Aceasta creează navigarea superioară cu logo, elemente de meniu și comutator de limbă

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { useHaptic } from '@/hooks/useHaptic';
import { useStickyHeader } from '@/hooks/useStickyHeader';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { FaSun, FaMoon, FaSearch } from 'react-icons/fa';
// FaHeart + FaBookmark commented out - replaced by custom SVG / FaHeart + FaBookmark auskommentiert - ersetzt durch benutzerdefiniertes SVG
// import { FaHeart, FaBookmark } from 'react-icons/fa';
import SearchModal from '@/components/SearchModal';

// Custom like/thumbs-up SVG icon for Liked Posts / Benutzerdefiniertes Like-SVG für Gelikte Beiträge / Pictogramă SVG like personalizată pentru Postări Apreciate
const HeartIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.017 31.992c-9.088 0-9.158-0.377-10.284-1.224-0.597-0.449-1.723-0.76-5.838-1.028-0.298-0.020-0.583-0.134-0.773-0.365-0.087-0.107-2.143-3.105-2.143-7.907 0-4.732 1.472-6.89 1.534-6.99 0.182-0.293 0.503-0.47 0.847-0.47 3.378 0 8.062-4.313 11.21-11.841 0.544-1.302 0.657-2.159 2.657-2.159 1.137 0 2.413 0.815 3.042 1.86 1.291 2.135 0.636 6.721 0.029 9.171 2.063-0.017 5.796-0.045 7.572-0.045 2.471 0 4.107 1.473 4.156 3.627 0.017 0.711-0.077 1.619-0.282 2.089 0.544 0.543 1.245 1.36 1.276 2.414 0.038 1.36-0.852 2.395-1.421 2.989 0.131 0.395 0.391 0.92 0.366 1.547-0.063 1.542-1.253 2.535-1.994 3.054 0.061 0.422 0.11 1.218-0.026 1.834-0.535 2.457-4.137 3.443-9.928 3.443zM3.426 27.712c3.584 0.297 5.5 0.698 6.51 1.459 0.782 0.589 0.662 0.822 9.081 0.822 2.568 0 7.59-0.107 7.976-1.87 0.153-0.705-0.59-1.398-0.593-1.403-0.203-0.501 0.023-1.089 0.518-1.305 0.008-0.004 2.005-0.719 2.050-1.835 0.030-0.713-0.46-1.142-0.471-1.16-0.291-0.452-0.185-1.072 0.257-1.38 0.005-0.004 1.299-0.788 1.267-1.857-0.024-0.849-1.143-1.447-1.177-1.466-0.25-0.143-0.432-0.39-0.489-0.674-0.056-0.282 0.007-0.579 0.183-0.808 0 0 0.509-0.808 0.49-1.566-0.037-1.623-1.782-1.674-2.156-1.674-2.523 0-9.001 0.025-9.001 0.025-0.349 0.002-0.652-0.164-0.84-0.443s-0.201-0.627-0.092-0.944c0.977-2.813 1.523-7.228 0.616-8.736-0.267-0.445-0.328-0.889-1.328-0.889-0.139 0-0.468 0.11-0.812 0.929-3.341 7.995-8.332 12.62-12.421 13.037-0.353 0.804-1.016 2.47-1.016 5.493 0 3.085 0.977 5.473 1.447 6.245z" />
  </svg>
);

// Flag SVG components — detailed with borders / Flaggen-SVG-Komponenten — detailliert mit Rahmen / Componente SVG steaguri — detaliate cu borduri
const FlagDE = ({ className = "w-5 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 342" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="114" y="0" fill="#000000" rx="8"/>
    <rect width="512" height="114" y="114" fill="#DD0000"/>
    <rect width="512" height="114" y="228" fill="#FFCC00" rx="8"/>
    <rect width="512" height="342" rx="12" fill="none" stroke="#121B21" strokeWidth="12"/>
  </svg>
);

const FlagGB = ({ className = "w-5 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 342" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="342" rx="12" fill="#012169"/>
    <path d="M0,0 L512,342 M512,0 L0,342" stroke="#FFFFFF" strokeWidth="57"/>
    <path d="M0,0 L512,342 M512,0 L0,342" stroke="#C8102E" strokeWidth="38"/>
    <path d="M256,0 V342 M0,171 H512" stroke="#FFFFFF" strokeWidth="85"/>
    <path d="M256,0 V342 M0,171 H512" stroke="#C8102E" strokeWidth="51"/>
    <rect width="512" height="342" rx="12" fill="none" stroke="#121B21" strokeWidth="12"/>
  </svg>
);

const FlagRO = ({ className = "w-5 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 342" xmlns="http://www.w3.org/2000/svg">
    <rect width="171" height="342" x="0" fill="#002B7F" rx="8"/>
    <rect width="170" height="342" x="171" fill="#FCD116"/>
    <rect width="171" height="342" x="341" fill="#CE1126" rx="8"/>
    <rect width="512" height="342" rx="12" fill="none" stroke="#121B21" strokeWidth="12"/>
  </svg>
);

const FlagRU = ({ className = "w-5 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 342" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="114" y="0" fill="#FFFFFF" rx="8"/>
    <rect width="512" height="114" y="114" fill="#0039A6"/>
    <rect width="512" height="114" y="228" fill="#D52B1E" rx="8"/>
    <rect width="512" height="342" rx="12" fill="none" stroke="#121B21" strokeWidth="12"/>
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
  
  // Haptic feedback for mobile interactions / Haptisches Feedback für mobile Interaktionen / Feedback haptic pentru interacțiuni mobile
  const { tapLight, tapMedium } = useHaptic();
  
  // Pasul 1202025: Section progress indicator in top bar (homepage only)
  // Abschnitts-Fortschrittsanzeige in der oberen Leiste (nur Startseite)
  // Indicator progres secțiune în bara de sus (doar pagina principală)
  const isHomePage = pathname === '/';
  const homeSections = useMemo(() => [
    { id: 'hero', title: { de: 'RADIKAL.', en: 'RADIKAL.', ro: 'RADIKAL.', ru: 'РАДИКАЛ.' } },
    { id: 'about', title: { de: 'Über', en: 'About', ro: 'Despre', ru: 'О нас' } },
    { id: 'blogs', title: { de: 'Blogs', en: 'Blogs', ro: 'Bloguri', ru: 'Блоги' } },
    { id: 'contact', title: { de: 'Kontakt', en: 'Contact', ro: 'Contact', ru: 'Контакт' } },
    { id: 'thankyou', title: { de: 'Segen', en: 'Blessing', ro: 'Binecuvântare', ru: 'Благословение' } },
  ], []);
  const { currentTitle, isScrolled: isSectionScrolled, progress: sectionProgress } = useStickyHeader(
    isHomePage ? homeSections : [],
    language
  );
  
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
  const [showMobileRechtlichesDropdown, setShowMobileRechtlichesDropdown] = useState(false);
  const [blogMonths, setBlogMonths] = useState<{month: number; year: number; count: number; label: string}[]>([]);
  // Expanded years in blog archive (for year→months grouping)
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [expandedMobileYears, setExpandedMobileYears] = useState<Set<number>>(new Set());

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

  // Group blog months by year for hierarchical display / Blog-Monate nach Jahr gruppieren / Grupează lunile cu bloguri pe ani
  const blogYears = React.useMemo(() => {
    const yearsMap = new Map<number, { year: number; months: typeof blogMonths; totalCount: number }>();
    blogMonths.forEach(item => {
      if (!yearsMap.has(item.year)) {
        yearsMap.set(item.year, { year: item.year, months: [], totalCount: 0 });
      }
      const yearGroup = yearsMap.get(item.year)!;
      yearGroup.months.push(item);
      yearGroup.totalCount += item.count;
    });
    // Sort years descending
    return Array.from(yearsMap.values()).sort((a, b) => b.year - a.year);
  }, [blogMonths]);

  const toggleDesktopYear = (year: number) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  const toggleMobileYear = (year: number) => {
    setExpandedMobileYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

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
      sessionStorage.removeItem('radikalPendingLanguage');
      
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
      sessionStorage.removeItem('radikalPendingLanguage');
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
    {/* Pasul 1123: Mobile — Logo top-left, Hamburger top-right (floating), bottom rounded bar with Language/Search/Theme */}
    {/* Desktop — unchanged top nav bar */}
    
    {/* ═══ MOBILE TOP: Logo (left) + Hamburger/X (right) — with blurred dark bar behind ═══ */}
    {/* Only visible for logged-in users / Nur sichtbar für eingeloggte Benutzer / Vizibil doar pentru utilizatorii logați */}
    {user && (
    <div className="fixed top-0 left-0 right-0 z-[210] lg:hidden" data-mobile-nav="top">
      {/* Pasul 1125: Blurred dark background bar */}
      <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-md border-b border-black/10 dark:border-white/10" />
      <div className="relative flex items-center justify-between px-3 py-1.5">
      {/* Logo — top left */}
      <Link href="/" className="pointer-events-auto flex items-center">
        <Image
          src={theme === 'dark' ? '/radikal.logo.weiß.hintergrund.png' : '/radikal.logo.schwarz.hintergrund.png'}
          alt="Radikal Logo"
          width={120}
          height={120}
          className="rounded-sm h-auto drop-shadow-lg"
          style={{ width: 'clamp(65px, 22vw, 95px)' }}
        />
      </Link>

      {/* Pasul 1202025: Section progress pill — between logo and hamburger (homepage only) */}
      {/* Abschnitts-Fortschritts-Pill — zwischen Logo und Hamburger (nur Startseite) */}
      {/* Pilulă progres secțiune — între logo și hamburger (doar pagina principală) */}
      {isHomePage && isSectionScrolled && currentTitle && !isMobileMenuOpen && (
        <div className="flex-1 flex justify-center px-2 animate-fadeIn">
          <div className="flex items-center gap-1.5 bg-black/10 dark:bg-white/10 backdrop-blur-sm rounded-full border border-black/10 dark:border-white/10 px-3 py-0.5 max-w-[140px]">
            {/* Tiny progress dot / Kleiner Fortschrittspunkt / Punct mic de progres */}
            <div className="relative w-1.5 h-1.5 flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-black/15 dark:bg-white/15" />
              <div 
                className="absolute inset-0 rounded-full bg-black/70 dark:bg-white/70 transition-transform duration-300 origin-center"
                style={{ transform: `scale(${0.3 + sectionProgress * 0.7})` }}
              />
            </div>
            {/* Section title / Abschnittstitel / Titlul secțiunii */}
            <span className="font-cinzel text-[10px] font-semibold text-black/60 dark:text-white/60 truncate uppercase tracking-wider">
              {currentTitle}
            </span>
            {/* Mini progress bar / Mini-Fortschrittsleiste / Bară de progres mini */}
            <div className="w-5 h-[2px] bg-black/10 dark:bg-white/10 rounded-full overflow-hidden flex-shrink-0">
              <div 
                className="h-full bg-black/40 dark:bg-white/40 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${sectionProgress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hamburger / X — top right */}
      <button
        onClick={() => { tapLight(); setIsMobileMenuOpen(!isMobileMenuOpen); }}
        className="mobile-menu-button pointer-events-auto p-2 text-black dark:text-white hover:text-black/70 dark:hover:text-white/70 transition-all duration-200 drop-shadow-lg"
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMobileMenuOpen ? (
          <svg style={{ width: 'clamp(22px, 7vw, 28px)', height: 'clamp(22px, 7vw, 28px)' }} viewBox="0 0 22 22" fill="none" className="block">
            <line x1="1" y1="1" x2="21" y2="21" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="21" y1="1" x2="1" y2="21" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        ) : (
          <svg style={{ width: 'clamp(22px, 7vw, 28px)', height: '16' }} viewBox="0 0 28 16" fill="none" className="block">
            <line x1="0" y1="2" x2="28" y2="2" stroke="currentColor" strokeWidth="2" />
            <line x1="0" y1="14" x2="28" y2="14" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
      </button>
      </div>
    </div>
    )}

    {/* ═══ MOBILE BOTTOM BAR: Rounded floating bar with Language / Search / Theme — Telegram-style ═══ */}
    {/* Only visible for logged-in users / Nur sichtbar für eingeloggte Benutzer / Vizibil doar pentru utilizatorii logați */}
    {user && !isMobileMenuOpen && (
      <div className="fixed bottom-0 left-0 right-0 z-[210] lg:hidden flex justify-center pb-[calc(env(safe-area-inset-bottom,0px)+8px)] px-4 pointer-events-none" data-mobile-nav="bottom">
        <div className="pointer-events-auto flex items-end justify-evenly gap-1 bg-white/80 dark:bg-black/70 backdrop-blur-xl rounded-2xl border border-black/10 dark:border-white/15 shadow-lg px-3 py-0.5" style={{ minWidth: '200px', maxWidth: '260px' }}>
          {/* Language selector */}
          <div className="relative language-dropdown flex flex-col items-center">
            <button
              onClick={() => { tapLight(); setShowMobileLanguageDropdown(!showMobileLanguageDropdown); }}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200"
              title={language === 'de' ? 'Sprache' : language === 'en' ? 'Language' : language === 'ro' ? 'Limbă' : 'Язык'}
            >
              <span className="animate-flag-wave" style={{ width: '22px', height: '15px' }}>
                <LanguageFlag lang={language} className="w-full h-full rounded-sm shadow-sm" />
              </span>
              <span className="text-[10px] font-semibold opacity-70">
                {language === 'de' ? 'Sprache' : language === 'en' ? 'Lang' : language === 'ro' ? 'Limbă' : 'Язык'}
              </span>
            </button>
            {showMobileLanguageDropdown && (
              <div className="absolute bottom-full mb-2 min-w-[120px] bg-white dark:bg-black rounded-xl shadow-xl py-1 z-[100] border border-black/15 dark:border-white/15">
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

          {/* Search */}
          <button
            onClick={() => { tapLight(); setIsSearchOpen(true); }}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200"
            title={language === 'de' ? 'Suchen' : language === 'en' ? 'Search' : language === 'ro' ? 'Căutare' : 'Поиск'}
          >
            <svg className="w-[22px] h-[22px] animate-search-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 6C13.7614 6 16 8.23858 16 11M16.6588 16.6549L21 21M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[10px] font-semibold opacity-70">
              {language === 'de' ? 'Suche' : language === 'en' ? 'Search' : language === 'ro' ? 'Căutare' : 'Поиск'}
            </span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => { tapMedium(); toggleTheme(); }}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300 group"
            title={theme === 'dark' ? (language === 'de' ? 'Helles Thema' : 'Light Theme') : (language === 'de' ? 'Dunkles Thema' : 'Dark Theme')}
          >
            <span className="relative block w-[22px] h-[22px] transition-transform duration-500 ease-out group-active:scale-125">
              {theme === 'dark' ? (
                <svg className="w-full h-full animate-spin-slow" style={{ animationDuration: '20s' }} viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M31.998,14.002c-9.941,0-18,8.059-18,18s8.059,18,18,18 s18-8.059,18-18S41.939,14.002,31.998,14.002z M42.998,33.002c-0.553,0-1-0.447-1-1c0-5.523-4.478-10-10-10c-0.553,0-1-0.447-1-1 s0.447-1,1-1c6.627,0,12,5.373,12,12C43.998,32.555,43.551,33.002,42.998,33.002z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M63,31H53c-0.553,0-1,0.447-1,1s0.447,1,1,1h10 c0.553,0,1-0.447,1-1S63.553,31,63,31z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M11.457,36.47l-3.863,1.035c-0.534,0.144-0.851,0.692-0.707,1.226 c0.143,0.533,0.69,0.85,1.225,0.706l3.863-1.035c0.533-0.143,0.85-0.69,0.707-1.225C12.539,36.644,11.99,36.327,11.457,36.47z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M49.32,22c0.277,0.479,0.888,0.643,1.367,0.366l8.66-5 c0.479-0.276,0.643-0.888,0.365-1.366c-0.275-0.479-0.887-0.642-1.365-0.365l-8.66,5C49.208,20.912,49.045,21.521,49.32,22z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M17.858,46.143c-0.39-0.391-1.023-0.389-1.414,0l-2.828,2.828 c-0.391,0.391-0.39,1.025,0.001,1.415c0.39,0.391,1.022,0.39,1.413-0.001l2.828-2.828C18.249,47.168,18.249,46.534,17.858,46.143z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M42,14.68c0.479,0.276,1.09,0.113,1.367-0.366l5-8.66 C48.644,5.175,48.48,4.563,48,4.287c-0.478-0.276-1.088-0.112-1.365,0.366l-4.999,8.661C41.358,13.793,41.522,14.403,42,14.68z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M26.824,51.318c-0.532-0.143-1.08,0.176-1.225,0.707l-1.035,3.863 c-0.143,0.535,0.176,1.083,0.709,1.226c0.533,0.144,1.08-0.173,1.223-0.708l1.035-3.863C27.676,52.012,27.359,51.463,26.824,51.318z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M32,12c0.554,0,1.001-0.446,1.002-1V1c0-0.553-0.447-1-1.002-1 c-0.551,0-0.998,0.447-0.999,1l0.001,10C31.002,11.553,31.449,12,32,12z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M38.402,52.025c-0.141-0.532-0.689-0.85-1.225-0.707 c-0.533,0.143-0.848,0.692-0.707,1.225l1.035,3.863c0.144,0.535,0.693,0.85,1.227,0.707s0.849-0.689,0.705-1.225L38.402,52.025z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M20.637,14.312c0.275,0.479,0.887,0.643,1.363,0.367 c0.48-0.277,0.645-0.887,0.368-1.367l-5-8.66C17.092,4.174,16.48,4.01,16,4.287c-0.477,0.275-0.641,0.887-0.365,1.365 L20.637,14.312z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M47.558,46.142c-0.388-0.39-1.022-0.39-1.414,0 c-0.391,0.39-0.388,1.024,0,1.414l2.828,2.828c0.392,0.392,1.025,0.389,1.415-0.001c0.391-0.39,0.391-1.021-0.001-1.413 L47.558,46.142z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M4.654,17.365l8.662,4.999c0.477,0.276,1.088,0.113,1.363-0.364 c0.277-0.479,0.115-1.09-0.364-1.367l-8.661-5C5.176,15.356,4.564,15.52,4.287,16C4.013,16.477,4.176,17.089,4.654,17.365z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M52.027,38.4l3.863,1.035c0.535,0.145,1.082-0.176,1.225-0.709 c0.144-0.532-0.172-1.079-0.707-1.223l-3.863-1.035c-0.531-0.145-1.081,0.173-1.225,0.707C51.176,37.709,51.496,38.256,52.027,38.4z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M12,32c0.001-0.554-0.445-1-0.998-1.002L1,31 c-0.552,0-1,0.445-1,1c0.001,0.551,0.448,1,1.001,1l10.001-0.002C11.553,32.998,12.001,32.552,12,32z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M52.545,27.529l3.863-1.035c0.535-0.143,0.85-0.693,0.706-1.227 c-0.142-0.531-0.688-0.848-1.224-0.705l-3.863,1.035c-0.533,0.141-0.85,0.691-0.707,1.225 C51.461,27.356,52.012,27.67,52.545,27.529z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M14.68,42c-0.275-0.48-0.886-0.644-1.365-0.368l-8.661,5.002 C4.176,46.91,4.01,47.52,4.287,48c0.277,0.477,0.889,0.641,1.367,0.365l8.66-5.002C14.791,43.088,14.957,42.479,14.68,42z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M46.144,17.856c0.389,0.392,1.022,0.388,1.414,0l2.828-2.828 c0.392-0.392,0.39-1.024-0.002-1.415c-0.388-0.39-1.021-0.391-1.412,0.001l-2.828,2.828C45.752,16.83,45.754,17.466,46.144,17.856z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M22,49.32c-0.479-0.277-1.088-0.113-1.365,0.364l-5,8.663 c-0.275,0.478-0.115,1.088,0.365,1.365c0.479,0.274,1.09,0.11,1.367-0.367l4.998-8.662C22.641,50.207,22.48,49.597,22,49.32z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M37.178,12.68c0.531,0.145,1.078-0.176,1.225-0.707l1.035-3.863 c0.143-0.535-0.176-1.083-0.709-1.225c-0.531-0.144-1.08,0.172-1.223,0.707l-1.035,3.863C36.324,11.986,36.645,12.536,37.178,12.68z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M32,52c-0.553-0.002-0.998,0.446-1,0.998l0.002,10.004 C31.002,63.552,31.445,64,32,64c0.553,0,1-0.449,1.001-1l-0.003-10.002C32.998,52.447,32.555,52,32,52z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M25.6,11.973c0.139,0.533,0.691,0.85,1.225,0.707 c0.532-0.141,0.846-0.691,0.707-1.225l-1.035-3.863c-0.145-0.535-0.693-0.851-1.227-0.706c-0.531,0.142-0.85,0.688-0.705,1.224 L25.6,11.973z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M43.363,49.687c-0.275-0.478-0.883-0.644-1.363-0.365 c-0.479,0.274-0.641,0.885-0.367,1.364l5.004,8.661c0.275,0.478,0.883,0.644,1.363,0.366c0.479-0.277,0.642-0.889,0.367-1.367 L43.363,49.687z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.443,17.856c0.387,0.394,1.023,0.39,1.414,0 c0.391-0.388,0.387-1.021,0-1.414l-2.828-2.828c-0.393-0.392-1.025-0.39-1.415,0.002c-0.39,0.388-0.392,1.021,0.001,1.412 L16.443,17.856z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M59.348,46.633l-8.663-4.997 c-0.478-0.276-1.087-0.116-1.363,0.366c-0.278,0.477-0.112,1.086,0.364,1.364l8.664,4.999c0.477,0.275,1.086,0.115,1.363-0.365 C59.988,47.521,59.824,46.91,59.348,46.633z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M11.974,25.599L8.11,24.563c-0.536-0.144-1.083,0.175-1.225,0.708 c-0.144,0.531,0.171,1.08,0.707,1.225l3.863,1.034c0.531,0.146,1.081-0.175,1.225-0.707C12.825,26.293,12.505,25.746,11.974,25.599z"/>
                </svg>
              ) : (
                <svg className="w-full h-full animate-moon-rock" viewBox="0 0 384 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"/>
                </svg>
              )}
            </span>
            <span className="text-[10px] font-semibold opacity-70">
              {language === 'de' ? 'Thema' : language === 'en' ? 'Theme' : language === 'ro' ? 'Temă' : 'Тема'}
            </span>
          </button>
        </div>
      </div>
    )}

    {/* ═══ DESKTOP NAV BAR — unchanged, only visible on lg+ ═══ */}
    <nav className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-white/20 dark:bg-black/20 backdrop-blur-md border-b border-black/10 dark:border-white/10">
      <div className="max-w-7xl mx-auto" style={{ padding: '0 clamp(8px, 3vw, 32px)' }}>
        <div className="flex items-center justify-between h-16 min-w-0" style={{ gap: 'clamp(8px, 3vw, 24px)' }}>
          {/* Logo section / Logo-Bereich / Secțiune logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src={theme === 'dark' ? '/radikal.logo.weiß.hintergrund.png' : '/radikal.logo.schwarz.hintergrund.png'}
                alt="Radikal Logo"
                width={120}
                height={120}
                className="rounded-sm h-auto"
                style={{ width: 'clamp(80px, 28vw, 120px)' }}
              />
              <span className="font-cinzel text-2xl font-bold text-black dark:text-white tracking-wider">
                
              </span>
            </Link>
          </div>

          {/* Desktop navigation menu / Desktop-Navigationsmenü / Meniu navigare desktop */}
          <div className="flex items-center space-x-8">
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
                {blogYears.length > 0 && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </Link>
              
              {/* Blogs months dropdown - grouped by year / Blog-Monate-Dropdown nach Jahr gruppiert / Dropdown luni bloguri grupate pe ani */}
              {showBlogsDropdown && blogYears.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-black rounded-lg shadow-xl py-2 z-50 border border-black/20 dark:border-white/20 max-h-80 overflow-y-auto">
                  {/* All blogs link / Alle Blogs Link / Link toate blogurile */}
                  <Link
                    href="/blogs"
                    className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 font-medium border-b border-black/10 dark:border-white/10"
                    onClick={() => setShowBlogsDropdown(false)}
                  >
                    {language === 'de' ? '🗁 Alle Blogs' : language === 'en' ? '🗁 All Blogs' : language === 'ro' ? '🗁 Toate Blogurile' : '🗁 Все блоги'}
                  </Link>
                  
                  {/* Year groups with expandable months */}
                  {blogYears.map((yearGroup) => (
                    <div key={yearGroup.year}>
                      <button
                        onClick={() => toggleDesktopYear(yearGroup.year)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 font-medium"
                      >
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 13V8.5C21 6.61438 21 5.67157 20.4142 5.08578C19.8284 4.5 18.8856 4.5 17 4.5L6.99999 4.50002C5.11438 4.50002 4.17157 4.50002 3.58579 5.08581C3 5.67159 3 6.6144 3 8.50002V17C3 18.8856 3 19.8285 3.58579 20.4142C4.17157 21 5.11438 21 7 21H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M8.05 14L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M8.05 17L8 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M12.05 14L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M8 3L8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M16 3L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          <span>{yearGroup.year}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">{yearGroup.totalCount}</span>
                          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedYears.has(yearGroup.year) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </button>
                      {expandedYears.has(yearGroup.year) && (
                        <div className="border-l-2 border-black/10 dark:border-white/10 ml-5 mb-1">
                          {yearGroup.months.map((item) => (
                            <Link
                              key={`${item.year}-${item.month}`}
                              href={`/blogs?year=${item.year}&month=${item.month + 1}`}
                              className="block px-4 py-1.5 text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200"
                              onClick={() => setShowBlogsDropdown(false)}
                            >
                              <span className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 13V8.5C21 6.61438 21 5.67157 20.4142 5.08578C19.8284 4.5 18.8856 4.5 17 4.5L6.99999 4.50002C5.11438 4.50002 4.17157 4.50002 3.58579 5.08581C3 5.67159 3 6.6144 3 8.50002V17C3 18.8856 3 19.8285 3.58579 20.4142C4.17157 21 5.11438 21 7 21H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5"/>
                                    <path d="M8.05 14L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M8 3L8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    <path d="M16 3L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                  </svg>
                                  {item.label.replace(` ${item.year}`, '')}
                                </span>
                                <span className="text-xs bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-full">{item.count}</span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
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
          <div className="flex items-center space-x-4">
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

            {/* Bookmarks link commented out - replaced by Liked Posts / Lesezeichen-Link auskommentiert - ersetzt durch Liked Posts */}
            {/* {user && (
              <Link
                href="/bookmarks"
                className="px-3 py-2 rounded-md text-sm font-medium text-white/80 dark:text-white/80 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10 transition-colors duration-200 flex items-center space-x-1"
                title={language === 'de' ? 'Lesezeichen' : language === 'en' ? 'Bookmarks' : language === 'ro' ? 'Bookmark-uri' : 'Закладки'}
              >
                <FaBookmark className="w-4 h-4" />
              </Link>
            )} */}

            {/* Liked Posts link / Gelikte Posts Link / Link Postări Apreciate */}
            {user && (
              <Link
                href="/bookmarks"
                className="px-3 py-2 rounded-md text-sm font-medium text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 flex items-center space-x-1"
                title={language === 'de' ? 'Gelikte Beiträge' : language === 'en' ? 'Liked Posts' : language === 'ro' ? 'Postări Apreciate' : 'Понравившиеся'}
              >
                <HeartIcon className="w-4 h-4" />
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
        </div>
      </div>
    </nav>
    
    {/* ═══ MOBILE FULLSCREEN MENU ═══ */}
    {isMobileMenuOpen && (
      <div className="mobile-menu-container fixed inset-0 z-[200] lg:hidden" style={{ animation: 'mobileMenuSlideIn 0.25s ease-out forwards' }}>
        {/* Background - adapts to theme */}
        <div className="absolute inset-0 bg-white dark:bg-black" />
        <div className="relative z-10 flex flex-col h-full text-black dark:text-white overflow-hidden">

          {/* Pasul 1125: Navigation links - smaller text, no scroll, fits on one screen */}
          <div className="flex-1 flex flex-col justify-center" style={{ padding: '64px clamp(28px, 8vw, 56px) 0' }}>
            <div className="flex flex-col space-y-1">
              {navigationItems.map((item) => (
                item.href === '/blogs' ? (
                  <div key={item.href} className="blogs-dropdown">
                    <button
                      onClick={() => setShowMobileBlogsDropdown(!showMobileBlogsDropdown)}
                      className={`w-full text-left text-[28px] sm:text-[34px] font-light py-2 transition-colors duration-200 flex items-center justify-between ${
                        pathname === '/blogs' || pathname.startsWith('/blogs/')
                          ? 'text-black dark:text-white'
                          : 'text-black/90 dark:text-white/90 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {blogYears.length > 0 && (
                        <svg className={`w-5 h-5 transition-transform duration-300 ${showMobileBlogsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                    {showMobileBlogsDropdown && blogYears.length > 0 && (
                      <div className="ml-4 mt-0.5 space-y-0 border-l border-black/15 dark:border-white/15 pl-4 mb-1 max-h-[30vh] overflow-y-auto">
                        {/* All Blogs link */}
                        <Link
                          href="/blogs"
                          onClick={() => { setIsMobileMenuOpen(false); setShowMobileBlogsDropdown(false); }}
                          className="flex items-center gap-2 py-1.5 text-[18px] sm:text-[22px] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 17V8.89627C3 6.16864 3 4.80482 3.82186 3.93706C3.85921 3.89763 3.89763 3.85921 3.93706 3.82186C4.80482 3 6.16864 3 8.89627 3H9.19722C9.91179 3 10.2691 3 10.5895 3.112C10.7852 3.18039 10.9691 3.27879 11.1345 3.40367C11.4054 3.60816 11.6036 3.90544 12 4.5C12.3964 5.09456 12.5946 5.39184 12.8655 5.59633C13.0309 5.72121 13.2148 5.81961 13.4105 5.888C13.7309 6 14.0882 6 14.8028 6H17C18.8856 6 19.8284 6 20.4142 6.58579C21 7.17157 21 8.11438 21 10V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M6.18537 14.9294C6.57684 13.5201 6.77258 12.8155 7.30902 12.4077C7.84546 12 8.57679 12 10.0394 12H15.7582C18.1648 12 19.3681 12 19.9685 12.7866C20.5688 13.5732 20.2514 14.7339 19.6165 17.0553L19.343 18.0553C18.9556 19.4716 18.7619 20.1797 18.2245 20.5899C17.6871 21 16.953 21 15.4847 21H9.76167C7.34616 21 6.1384 21 5.53812 20.2103C4.93785 19.4205 5.2611 18.2568 5.90759 15.9294L6.18537 14.9294Z" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                          {language === 'de' ? 'Alle Blogs' : language === 'en' ? 'All Blogs' : language === 'ro' ? 'Toate Blogurile' : 'Все блоги'}
                        </Link>
                        
                        {/* Year groups with expandable months */}
                        {blogYears.map((yearGroup) => (
                          <div key={yearGroup.year}>
                            <button
                              onClick={() => toggleMobileYear(yearGroup.year)}
                              className="w-full flex items-center gap-2 py-1.5 text-[18px] sm:text-[22px] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
                            >
                              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 13V8.5C21 6.61438 21 5.67157 20.4142 5.08578C19.8284 4.5 18.8856 4.5 17 4.5L6.99999 4.50002C5.11438 4.50002 4.17157 4.50002 3.58579 5.08581C3 5.67159 3 6.6144 3 8.50002V17C3 18.8856 3 19.8285 3.58579 20.4142C4.17157 21 5.11438 21 7 21H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M8.05 14L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M8.05 17L8 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M12.05 14L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M8 3L8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="M16 3L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                              <span className="flex-1 text-left font-medium">{yearGroup.year}</span>
                              <span className="text-xs text-black/30 dark:text-white/30 mr-1">{yearGroup.totalCount}</span>
                              <svg className={`w-3 h-3 transition-transform duration-200 ${expandedMobileYears.has(yearGroup.year) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {expandedMobileYears.has(yearGroup.year) && (
                              <div className="ml-3 border-l border-black/10 dark:border-white/10 pl-2 mb-1">
                                {yearGroup.months.map((monthItem) => (
                                  <Link
                                    key={`${monthItem.year}-${monthItem.month}`}
                                    href={`/blogs?year=${monthItem.year}&month=${monthItem.month + 1}`}
                                    onClick={() => { setIsMobileMenuOpen(false); setShowMobileBlogsDropdown(false); }}
                                    className="flex items-center gap-2 py-1.5 text-[16px] sm:text-[18px] text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
                                  >
                                    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M21 13V8.5C21 6.61438 21 5.67157 20.4142 5.08578C19.8284 4.5 18.8856 4.5 17 4.5L6.99999 4.50002C5.11438 4.50002 4.17157 4.50002 3.58579 5.08581C3 5.67159 3 6.6144 3 8.50002V17C3 18.8856 3 19.8285 3.58579 20.4142C4.17157 21 5.11438 21 7 21H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                      <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5"/>
                                      <path d="M8.05 14L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                      <path d="M8.05 17L8 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                      <path d="M12.05 14L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                      <path d="M8 3L8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                      <path d="M16 3L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                    <span className="flex-1">{monthItem.label.replace(` ${monthItem.year}`, '')}</span>
                                    <span className="text-xs text-black/30 dark:text-white/30">{monthItem.count}</span>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block text-[28px] sm:text-[34px] font-light py-2 transition-colors duration-200 ${
                      pathname === item.href
                        ? 'text-black dark:text-white'
                        : 'text-black/90 dark:text-white/90 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              ))}

              {/* Rechtliches (Legal) expandable submenu / Rechtliches aufklappbares Untermenü / Submeniu extensibil Juridic */}
              <div>
                <button
                  onClick={() => setShowMobileRechtlichesDropdown(!showMobileRechtlichesDropdown)}
                  className="flex items-center justify-between w-full text-[28px] sm:text-[34px] font-light text-black/90 dark:text-white/90 hover:text-black dark:hover:text-white py-2 transition-colors duration-200"
                >
                  <span>
                    {language === 'de' ? 'Rechtliches' : 
                     language === 'en' ? 'Legal' : 
                     language === 'ro' ? 'Legal' : 
                     'Правовая информация'}
                  </span>
                  <svg className={`w-5 h-5 transition-transform duration-300 ${showMobileRechtlichesDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showMobileRechtlichesDropdown && (
                  <div className="pl-4 pb-1 space-y-1">
                    <Link
                      href="/datenschutz"
                      onClick={() => { setIsMobileMenuOpen(false); setShowMobileRechtlichesDropdown(false); }}
                      className={`flex items-center gap-2 text-[20px] sm:text-[24px] font-light py-1.5 transition-colors duration-200 ${
                        pathname === '/datenschutz'
                          ? 'text-black dark:text-white'
                          : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 17H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M4 12L11 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M4 7L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M17 4L17 20M17 4L14 8M17 4L20 8M17 20L20 16M17 20L14 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>
                        {language === 'de' ? 'Datenschutz' : 
                         language === 'en' ? 'Privacy Policy' : 
                         language === 'ro' ? 'Politica de Confidențialitate' : 
                         'Политика конфиденциальности'}
                      </span>
                    </Link>
                    <Link
                      href="/impressum"
                      onClick={() => { setIsMobileMenuOpen(false); setShowMobileRechtlichesDropdown(false); }}
                      className={`flex items-center gap-2 text-[20px] sm:text-[24px] font-light py-1.5 transition-colors duration-200 ${
                        pathname === '/impressum'
                          ? 'text-black dark:text-white'
                          : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 17H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M4 12L11 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M4 7L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M17 4L17 20M17 4L14 8M17 4L20 8M17 20L20 16M17 20L14 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>
                        {language === 'de' ? 'Impressum' : 
                         language === 'en' ? 'Legal Notice' : 
                         language === 'ro' ? 'Mențiuni Legale' : 
                         'Юридическая информація'}
                      </span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Admin link */}
              {user && isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-[28px] sm:text-[34px] font-light text-amber-500/80 dark:text-amber-400/80 hover:text-amber-500 dark:hover:text-amber-400 py-2 transition-colors duration-200"
                >
                  Admin
                </Link>
              )}

              {/* Liked Posts link - visible only when logged in / Gelikte Beiträge Link - nur sichtbar wenn angemeldet / Link Postări Apreciate - vizibil doar când ești autentificat */}
              {user && (
                <Link
                  href="/bookmarks"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 text-[28px] sm:text-[34px] font-light py-2 transition-colors duration-200 ${
                    pathname === '/bookmarks'
                      ? 'text-red-500 dark:text-red-400'
                      : 'text-black/90 dark:text-white/90 hover:text-red-500 dark:hover:text-red-400'
                  }`}
                >
                  <HeartIcon className="w-6 h-6 flex-shrink-0" />
                  <span>
                    {language === 'de' ? 'Gelikte Beiträge' : 
                     language === 'en' ? 'Liked Posts' : 
                     language === 'ro' ? 'Postări Apreciate' : 
                     'Понравившиеся'}
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* Pasul 1125: Logout/Login button — pinned at bottom, Pasul 12006: slightly higher */}
          <div className="flex-shrink-0 pb-4" style={{ padding: '0 clamp(28px, 8vw, 56px) clamp(16px, 3.5vh, 28px)' }}>
            {!loading && (
              user ? (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-base font-medium hover:bg-black/85 dark:hover:bg-white/90 transition-colors duration-200"
                >
                  {language === 'de' ? 'Abmelden' : language === 'en' ? 'Logout' : language === 'ro' ? 'Deconectare' : 'Выйти'}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-base font-medium hover:bg-black/85 dark:hover:bg-white/90 transition-colors duration-200"
                >
                  {language === 'de' ? 'Anmelden' : language === 'en' ? 'Login' : language === 'ro' ? 'Conectare' : 'Войти'}
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 10L10 1M10 1H3M10 1V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              )
            )}
          </div>

        </div>
      </div>
    )}

    <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
