// Homepage component - Main landing page / Homepage-Komponente - Hauptlandingpage / Componentă pagină principală - Pagina de destinație principală
// This creates the beautiful homepage with the design matching the example image
// Dies erstellt die schöne Homepage mit dem Design, das dem Beispielbild entspricht
// Aceasta creează pagina de start frumoasă cu designul potrivit imaginii exemplu

'use client';

import React, { Suspense, lazy, useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { createClient } from '@/lib/supabase';
import { usePageText } from '@/lib/pageContent';
import { registerPageDefaults } from '@/lib/pageDefaults';
import { fetchEnabledPages } from '@/lib/pageSettings';
// Pasul 2208001 — vizitatorul ramane vizitator pana apasa butonul din hamburger
import { isGuestMode } from '@/hooks/useGuestMode';

// Dynamic import for WelcomeModal (includes GSAP, loaded only when needed)
const WelcomeModal = dynamic(() => import('@/components/WelcomeModal'), { ssr: false });

// Lazy load BibleQuotes for better performance / Verzögertes Laden von BibleQuotes für bessere Leistung / Încărcare leneșă BibleQuotes pentru performanță mai bună
const BibleQuotes = lazy(() => import('@/components/BibleQuotes'));

// =====================================================================
// Pasul 2708016 — TEXTELE PAGINII PRINCIPALE
// Erau scrise direct în aranjament, cu „dacă limba e de, scrie asta".
// Acum stau aici și se pot schimba din Setări → Pagini → Pagina principală,
// în orice limbă. Ce vezi mai jos rămâne copia de siguranță: butonul
// „Înapoi la original" o aduce oricând înapoi.
// =====================================================================
const translations = {
  de: {
    heroVerse: 'Weil du aber lauwarm bist und weder kalt noch heiß, will ich dich ausspucken aus meinem Mund.',
    heroReference: 'Offenbarung 3:16',
    scrollDown: 'Mehr entdecken',
    aboutTitle: 'Über ',
    aboutText: 'Was ist die Wahrheit?',
    aboutButton: 'Mehr erfahren',
    blogsTitle: ' Blogs',
    blogsText: 'Wir haben verlernt, selbst zu prüfen, und folgen zu oft nur menschlichen Meinungen.',
    blogsButton: 'Alle Blogs ansehen',
    marturiiTitle: 'Zeugnisse',
    marturiiText: '„Darum auch wir, weil wir eine solche Wolke von Zeugen um uns haben, lasst uns ablegen alles, was uns beschwert, und die Sünde, die uns ständig umstrickt, und lasst uns laufen mit Geduld in dem Kampf, der uns bestimmt ist." Hebräer 12,1',
    marturiiButton: 'Alle Zeugnisse ansehen',
    andachtTitle: 'Tägliche Andacht',
    andachtText: 'Every day is different.',
    andachtButton: 'Mehr entdecken',
    copiiTitle: 'Für Kinder',
    copiiText: 'Heiligkeit von Kindheit an',
    copiiButton: 'Mehr erfahren',
    versetTitle: 'Vers des Tages',
    versetText: 'Ein Vers für heute.',
    versetButton: 'Lesen',
    contactTitle: 'Kontakt',
    contactText: 'Fragen?',
    contactButton: 'Kontaktiere uns',
    thanksTitle: 'Kaufe die Zeit aus.',
    thanksText: 'Der Herr segne dich!',
  },
  en: {
    heroVerse: 'So then because thou art lukewarm, and neither cold nor hot, I will spue thee out of my mouth.',
    heroReference: 'Revelation 3:16',
    scrollDown: 'Discover more',
    aboutTitle: 'About ',
    aboutText: 'What is the truth?',
    aboutButton: 'Learn More',
    blogsTitle: ' Blogs',
    blogsText: 'We have unlearned how to examine for ourselves and too often just follow human opinions.',
    blogsButton: 'View All Blogs',
    marturiiTitle: 'Testimonies',
    marturiiText: '"Therefore, since we are surrounded by so great a cloud of witnesses, let us also lay aside every weight, and sin which clings so closely, and let us run with endurance the race that is set before us." Hebrews 12:1',
    marturiiButton: 'View All Testimonies',
    andachtTitle: 'Daily Devotion',
    andachtText: 'Every day is different.',
    andachtButton: 'Discover more',
    copiiTitle: 'For Children',
    copiiText: 'Holiness from childhood',
    copiiButton: 'Learn more',
    versetTitle: 'Verse of the Day',
    versetText: 'One verse for today.',
    versetButton: 'Read',
    contactTitle: 'Contact',
    contactText: 'Questions?',
    contactButton: 'Contact Us',
    thanksTitle: 'Redeem the time.',
    thanksText: 'May the Lord bless you!',
  },
  ro: {
    heroVerse: 'Astfel, pentru că ești căldicel, nici rece, nici fierbinte, am să te vărs din gura Mea.',
    heroReference: 'Apocalipsa 3:16',
    scrollDown: 'Descoperă mai mult',
    aboutTitle: 'Despre ',
    aboutText: 'Ce este adevărul?',
    aboutButton: 'Află mai mult',
    blogsTitle: 'Bloguri',
    blogsText: 'Am uitat să examinăm singuri și prea des urmăm doar opinii umane.',
    blogsButton: 'Vezi toate blogurile',
    marturiiTitle: 'Mărturii',
    marturiiText: '„Și noi dar, fiindcă suntem înconjurați cu un nor așa de mare de martori, să dăm la o parte orice piedică și păcatul care ne înfășoară așa de lesne și să alergăm cu stăruință în alergarea care ne stă înainte." Evrei 12:1',
    marturiiButton: 'Vezi toate mărturiile',
    andachtTitle: 'Meditația zilnică',
    andachtText: 'Fiecare zi este altfel.',
    andachtButton: 'Descoperă mai mult',
    copiiTitle: 'Pentru copii',
    copiiText: 'Sfințenie din pruncie',
    copiiButton: 'Află mai mult',
    versetTitle: 'Versetul zilei',
    versetText: 'Un verset pentru azi.',
    versetButton: 'Citește',
    contactTitle: 'Contact',
    contactText: 'Întrebări?',
    contactButton: 'Contactează-ne',
    thanksTitle: 'Răscumpără vremea.',
    thanksText: 'Domnul să te binecuvânteze!',
  },
  ru: {
    heroVerse: 'Но, как ты тепл, а не горяч и не холоден, то извергну тебя из уст Моих.',
    heroReference: 'Откровение 3:16',
    scrollDown: 'Узнать больше',
    aboutTitle: 'О ',
    aboutText: 'Что такое истина?',
    aboutButton: 'Узнать больше',
    blogsTitle: 'Блоги',
    blogsText: 'Мы забыли, как проверять сами, и слишком часто просто следуем человеческим мнениям.',
    blogsButton: 'Посмотреть все блоги',
    marturiiTitle: 'Свидетельства',
    marturiiText: '«Посему и мы, имея вокруг себя такое облако свидетелей, свергнем с себя всякое бремя и запинающий нас грех и с терпением будем проходить предлежащее нам поприще». Евреям 12:1',
    marturiiButton: 'Посмотреть все свидетельства',
    andachtTitle: 'Ежедневное размышление',
    andachtText: 'Каждый день не похож на другой.',
    andachtButton: 'Узнать больше',
    copiiTitle: 'Для детей',
    copiiText: 'Святость с детства',
    copiiButton: 'Узнать больше',
    versetTitle: 'Стих дня',
    versetText: 'Один стих на сегодня.',
    versetButton: 'Читать',
    contactTitle: 'Контакт',
    contactText: 'Вопросы?',
    contactButton: 'Свяжитесь с нами',
    thanksTitle: 'Искупи время.',
    thanksText: 'Да благословит тебя Господь!',
  },
};

registerPageDefaults('main', translations);

export default function HomePage() {
  // Get language context / Sprachkontext abrufen / Obține contextul limbii
  const { language, setLanguage } = useLanguage();
  const t = usePageText('main', translations, language);

  // Secțiunile rubricilor noi apar doar dacă le-ai pornit din Setări → Pagini.
  const [enabledPages, setEnabledPages] = useState<Set<string>>(new Set());
  useEffect(() => {
    let alive = true;
    fetchEnabledPages().then((s) => {
      if (alive) setEnabledPages(s);
    });
    return () => {
      alive = false;
    };
  }, []);
  
  // Get theme context for scroll button styling
  const { theme } = useTheme();
  
  // State to control modal visibility / Status zur Steuerung der Modal-Sichtbarkeit / Stare pentru controlul vizibilității modalului
  const [showModal, setShowModal] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  // Splash screen state - shows the logo on every app re-entry
  // Splash-Bildschirm-Status - zeigt das Logo bei jedem App-Wiedereinstieg
  // Stare ecran splash - arată logo-ul la fiecare reintrare în aplicație
  const [showSplash, setShowSplash] = useState(false);
  
  // State for scroll button visibility
  const [showScrollButton, setShowScrollButton] = useState(true);
  
  const supabase = useMemo(() => createClient(), []);

  // Hide scroll button when user scrolls past first section
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      // Hide button after scrolling 80% of first screen
      setShowScrollButton(scrollY < windowHeight * 0.8);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check session and determine if modal should be shown / Sitzung prüfen und bestimmen, ob Modal angezeigt werden soll / Verifică sesiunea și determină dacă modalul trebuie afișat
  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        // First try fast local check via getSession (reads from storage, no network)
        // Erst schnelle lokale Prüfung via getSession (liest aus Speicher, kein Netzwerk)
        // Mai întâi verificare locală rapidă prin getSession (citește din stocare, fără rețea)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (cancelled) return;
        
        if (session?.user) {
          // User is logged in — allow access
          // Benutzer ist eingeloggt — Zugang erlauben
          // Utilizatorul este logat — permite accesul
          const savedLanguage = localStorage.getItem('radikalSelectedLanguage');
          if (savedLanguage) {
            setLanguage(savedLanguage as 'de' | 'en' | 'ro' | 'ru');
          } else {
            // No language saved yet — check pending language from WelcomeModal login flow
            // Keine Sprache gespeichert — ausstehende Sprache prüfen
            // Nicio limbă salvată — verifică limba în așteptare din fluxul de login WelcomeModal
            const pendingLang = sessionStorage.getItem('radikalPendingLanguage');
            if (pendingLang) {
              localStorage.setItem('radikalSelectedLanguage', pendingLang);
              sessionStorage.removeItem('radikalPendingLanguage');
              setLanguage(pendingLang as 'de' | 'en' | 'ro' | 'ru');
            } else {
              // Fallback: set default language to German and save it
              // Fallback: Deutsch als Standardsprache setzen und speichern
              // Fallback: setează limba implicită la germană și salvează
              localStorage.setItem('radikalSelectedLanguage', 'de');
              setLanguage('de');
            }
          }
          setShowModal(false);
          // Show splash logo for returning users
          const splashShown = sessionStorage.getItem('radikalSplashShown');
          if (!splashShown) {
            setShowSplash(true);
            sessionStorage.setItem('radikalSplashShown', 'true');
          }
        } else if (isGuestMode()) {
          // Pasul 2208001 — VIZITATOR ACTIV.
          // Pana acum, orice „Zurück zur Startseite" din aplicatie il arunca
          // inapoi la ecranul de alegere (logo + Anmelden + Continue as guest),
          // pentru ca aici se afisa MEREU WelcomeModal cand nu exista sesiune.
          // Acum vizitatorul vede pagina principala normala, ca un utilizator
          // logat. SINGURUL loc care il scoate din modul vizitator ramane
          // butonul din meniul hamburger (acela apeleaza `clearGuestMode()`).
          const savedLanguage =
            localStorage.getItem('radikalSelectedLanguage') ||
            sessionStorage.getItem('radikalGuestLanguage');
          if (savedLanguage) {
            setLanguage(savedLanguage as 'de' | 'en' | 'ro' | 'ru');
          }
          setShowModal(false);
        } else {
          // User is NOT logged in — ALWAYS show WelcomeModal (registration required)
          // Benutzer ist NICHT eingeloggt — IMMER WelcomeModal anzeigen (Registrierung erforderlich)
          // Utilizatorul NU este logat — ÎNTOTDEAUNA arată WelcomeModal (înregistrare necesară)
          setShowModal(true);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (cancelled) return;
        // On error, try getUser as fallback (network call to verify auth)
        // Bei Fehler, getUser als Fallback versuchen (Netzwerkaufruf zur Auth-Verifizierung)
        // La eroare, încearcă getUser ca fallback (apel de rețea pentru verificarea autentificării)
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (cancelled) return;
          if (user) {
            // User is verified — let them through
            const savedLanguage = localStorage.getItem('radikalSelectedLanguage');
            if (savedLanguage) {
              setLanguage(savedLanguage as 'de' | 'en' | 'ro' | 'ru');
            } else {
              localStorage.setItem('radikalSelectedLanguage', 'de');
              setLanguage('de');
            }
            setShowModal(false);
          } else if (isGuestMode()) {
            // Pasul 2208001 — si aici vizitatorul ramane vizitator
            setShowModal(false);
          } else {
            setShowModal(true);
          }
        } catch {
          // Both getSession and getUser failed — show modal
          // Pasul 2208001: dar NU aruncam afara un vizitator activ
          setShowModal(!isGuestMode());
        }
      } finally {
        if (!cancelled) {
          setIsCheckingSession(false);
        }
      }
    };

    // Safety timeout: if session check takes longer than 8 seconds, stop waiting
    // Sicherheits-Timeout: wenn die Sitzungsprüfung länger als 8 Sek. dauert, aufhören zu warten
    // Timeout de siguranță: dacă verificarea sesiunii durează mai mult de 8 secunde, nu mai aștepta
    const timeout = setTimeout(() => {
      if (!cancelled) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[RADIKAL] Session check timeout - proceeding without auth');
        }
        // On timeout, check if we have evidence of prior login (localStorage)
        // Bei Timeout, prüfen ob wir Hinweise auf vorherige Anmeldung haben (localStorage)
        // La timeout, verifică dacă avem dovada unui login anterior (localStorage)
        const savedLanguage = localStorage.getItem('radikalSelectedLanguage');
        if (savedLanguage) {
          // User was previously logged in — let them through (session will refresh)
          setLanguage(savedLanguage as 'de' | 'en' | 'ro' | 'ru');
          setShowModal(false);
        } else if (isGuestMode()) {
          // Pasul 2208001 — vizitatorul activ nu trebuie trimis la ecranul de start
          setShowModal(false);
        } else {
          // No evidence of prior login — show modal
          setShowModal(true);
        }
        setIsCheckingSession(false);
        cancelled = true;
      }
    }, 8000);

    checkSession();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [supabase.auth, setLanguage]);

  // Splash screen timer - show logo for 2.5 seconds then fade out
  // Splash-Bildschirm-Timer - Logo 2,5 Sekunden zeigen, dann ausblenden
  // Timer ecran splash - arată logo 2,5 secunde apoi dispare
  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, [showSplash]);

  // Monitor language changes in modal (for immediate application) / Sprachänderungen im Modal überwachen (für sofortige Anwendung) / Monitorizează schimbările de limbă în modal (pentru aplicare imediată)
  useEffect(() => {
    if (showModal) {
      const checkLanguageChange = setInterval(() => {
        // Check localStorage (set when user selects language in WelcomeModal)
        const savedLanguage = localStorage.getItem('radikalSelectedLanguage');
        if (savedLanguage && savedLanguage !== language) {
          setLanguage(savedLanguage as 'de' | 'en' | 'ro' | 'ru');
        }
      }, 100); // Check every 100ms

      return () => clearInterval(checkLanguageChange);
    }
  }, [showModal, language, setLanguage]);

  // Handle modal completion / Modal-Abschluss verarbeiten / Gestionează finalizarea modalului
  const handleModalComplete = (selectedLanguage: 'de' | 'en' | 'ro' | 'ru', isGuest: boolean) => {
    // Apply the selected language to the entire application / Die ausgewählte Sprache auf die gesamte Anwendung anwenden / Aplică limba selectată la întreaga aplicație
    setLanguage(selectedLanguage);
    
    // Language is already saved in WelcomeModal based on auth status / Sprache ist bereits im WelcomeModal basierend auf Auth-Status gespeichert / Limba este deja salvată în WelcomeModal bazat pe starea autentificării
    // - localStorage for authenticated users / - localStorage für authentifizierte Benutzer / - localStorage pentru utilizatori autentificați
    // - sessionStorage for guests / - sessionStorage für Gäste / - sessionStorage pentru vizitatori
    
    setShowModal(false);
    // modal-active class is managed by the useEffect that watches showModal state
  };

  // Control modal-active class to hide Navigation and Footer during modal, splash, and session check
  // Steuert die modal-active-Klasse um Navigation und Footer während Modal, Splash und Sitzungsprüfung auszublenden
  // Controlează clasa modal-active pentru a ascunde Navigarea și Footerul în timpul modalului, splash-ului și verificării sesiunii
  useEffect(() => {
    if (showModal || isCheckingSession || showSplash) {
      // Hide nav/footer during modal, session check, and splash screen
      document.body.classList.add('modal-active');
    } else {
      // Show nav/footer when we're on the main page content
      document.body.classList.remove('modal-active');
    }
    // Pasul 12005: Clean up loginSuccess flag from auth redirect
    delete document.body.dataset.loginSuccess;
  }, [showModal, isCheckingSession, showSplash]);

  // Show nothing while checking session — use skeleton / Nichts anzeigen während Sitzung geprüft wird — verwende Skeleton / Nu afișa nimic în timp ce se verifică sesiunea — folosește schelet
  if (isCheckingSession) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white dark:bg-black flex items-center justify-center">
        <div className="text-black/60 dark:text-white/60 text-center">
          {/* Pasul 121: Elegant loading dots instead of spinner / Elegante Ladepunkte statt Spinner */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  // Show modal if needed / Modal anzeigen wenn nötig / Afișează modalul dacă este necesar
  if (showModal) {
    return <WelcomeModal onComplete={handleModalComplete} />;
  }

  // Show splash logo for returning users (logged-in users re-entering the app)
  // Splash-Logo für wiederkehrende Benutzer anzeigen
  // Arată logo splash pentru utilizatorii care se întorc
  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white dark:bg-black flex items-center justify-center animate-fadeIn">
        <div className="text-center">
          <Image
            src={theme === 'dark' ? '/radikal.logo.weiß.hintergrund.png' : '/radikal.logo.schwarz.hintergrund.png'}
            alt="Radikal Logo"
            width={280}
            height={280}
            className="mx-auto rounded-sm"
            priority
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ========================================================================== */}
      {/* SECTION 1 - HERO with Revelation 3:16 verse and scroll button */}
      {/* ========================================================================== */}
      <section id="hero" className="min-h-screen flex flex-col px-4 sm:px-6 lg:px-8 pt-20 pb-8 relative">
        {/* Flex container for vertical distribution */}
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="max-w-6xl mx-auto w-full text-center">
            {/* Large Revelation 3:16 verse - Apocalipsa 3:16 */}
            <div className="font-cinzel text-black dark:text-white animate-fadeIn">
              {/* Verse text - Cinzel uppercase on all devices */}
              <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium leading-relaxed mb-8 ">
                {t.heroVerse}
              </p>
              
              {/* Bible reference */}
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-black/80 dark:text-white/80 font-bold">
                {t.heroReference}
              </p>
            </div>
          </div>
        </div>

        {/* Animated Scroll Down Button - now part of flex flow */}
        {/* More margin-bottom on mobile to push button up from screen edge */}
        {showScrollButton && (
          <div className="flex-shrink-0 flex justify-center mt-12 mb-16 sm:mb-12 pb-28 lg:pb-8">
            <button
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex flex-col items-center gap-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors duration-300 animate-bounce"
              aria-label="Scroll down"
            >
              <span className="text-base font-semibold">
                {t.scrollDown}
              </span>
              <svg 
                className="w-8 h-8" 
                fill="currentColor" 
                viewBox="0 0 511.994 511.994"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M403.079,310.458c-3.627-7.232-11.008-11.797-19.093-11.797h-64v-85.333c0-11.776-9.536-21.333-21.333-21.333H213.32 c-11.776,0-21.333,9.557-21.333,21.333v85.333h-64c-8.064,0-15.445,4.565-19.072,11.797c-3.605,7.232-2.837,15.872,2.027,22.336 l128,170.667c4.011,5.376,10.347,8.533,17.045,8.533c6.72,0,13.056-3.157,17.067-8.533l128-170.667 C405.917,326.33,406.685,317.69,403.079,310.458z"/>
                <path d="M298.663,128.001H213.33c-11.797,0-21.333,9.536-21.333,21.333c0,11.797,9.536,21.333,21.333,21.333h85.333 c11.797,0,21.333-9.536,21.333-21.333C319.996,137.537,310.46,128.001,298.663,128.001z"/>
                <path d="M298.663,64.001H213.33c-11.797,0-21.333,9.536-21.333,21.333s9.536,21.333,21.333,21.333h85.333 c11.797,0,21.333-9.536,21.333-21.333S310.46,64.001,298.663,64.001z"/>
                <path d="M298.664,0H213.33c-11.797,0-21.333,9.536-21.333,21.333c0,11.798,9.536,21.334,21.333,21.334h85.333 c11.797,0,21.333-9.536,21.333-21.333C319.997,9.536,310.461,0,298.664,0z"/>
              </svg>
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================== */}
      {/* SECTION 2 - DESPRE / ABOUT / ÜBER */}
      {/* ========================================================================== */}
      <section id="about" className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 lg:py-20 bg-black/5 dark:bg-white/5">
        <div className="max-w-4xl mx-auto w-full text-center">
          {/* Section Title */}
          <h2 className="font-cinzel text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white mb-8 animate-fadeIn">
            {t.aboutTitle}
          </h2>
          
          {/* Description */}
          <br></br>
          <p className="text-xl sm:text-2xl text-black/80 dark:text-white/80 leading-relaxed mb-12 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            {t.aboutText}
          </p>
          <br></br>

          {/* Question mark icon for Mehr erfahren */}
          {/* Thinner stroke (light weight) */}
          <div className="mb-8 animate-fadeIn flex justify-center" style={{ animationDelay: '0.4s' }}>
            <svg className="w-16 h-16 text-black dark:text-white" fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="m16 0c8.836556 0 16 7.163444 16 16s-7.163444 16-16 16-16-7.163444-16-16 7.163444-16 16-16zm0 2c-7.7319865 0-14 6.2680135-14 14s6.2680135 14 14 14 14-6.2680135 14-14-6.2680135-14-14-14zm0 18.5c.7731986 0 1.4.6268014 1.4 1.4s-.6268014 1.4-1.4 1.4-1.4-.6268014-1.4-1.4.6268014-1.4 1.4-1.4zm0-11.5c2.209139 0 4 1.790861 4 4 0 1.8635652-1.2743978 3.429479-2.9992387 3.8737865l-.0007613 1.1262135c0 .5522847-.4477153 1-1 1s-1-.4477153-1-1v-2c0-.5522847.4477153-1 1-1 1.1045695 0 2-.8954305 2-2s-.8954305-2-2-2-2 .8954305-2 2c0 .5522847-.4477153 1-1 1s-1-.4477153-1-1c0-2.209139 1.790861-4 4-4z"/></svg>
          </div>

          {/* Link to About Page */}
          <Link
            href="/about"
            className="inline-flex items-center px-2 py-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white font-semibold text-lg rounded-xl transition-all duration-300 border border-black/20 dark:border-white/20 hover:scale-105 animate-fadeIn mb-6 lg:mb-0"
            style={{ animationDelay: '0.6s' }}
          >
            {t.aboutButton}
          </Link>
        </div>
      </section>
      <section id="blogs" className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto w-full text-center">
          {/* Section Title */}
          <h2 className="font-cinzel text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white mb-8 animate-fadeIn">
            {t.blogsTitle}
          </h2>
          
          {/* Description */}
          <br></br>
          <p className="text-xl sm:text-2xl text-black/80 dark:text-white/80 leading-relaxed mb-12 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            {t.blogsText}
          </p>
          <br></br>

          {/* Edit/write icon for Alle Blogs ansehen */}
          {/* Thinner stroke (light weight) */}
          <div className="mb-8 animate-fadeIn flex justify-center" style={{ animationDelay: '0.4s' }}>
            <svg className="w-20 h-20 text-black dark:text-white" fill="currentColor" viewBox="0 0 31.395 31.395" xmlns="http://www.w3.org/2000/svg"><path d="M30.662,1.843c-2.005,1.721-8.537,7.438-8.413,8.708l0.009,0.08l0.292,0.388l-0.457,0.001l-0.075,0.004 c-0.402,0.067-1.125,1.248-1.358,2.216c-0.272,1.125-0.003,2.028,0.784,2.617c0.045,0.035,0.094,0.063,0.14,0.093l-0.375,0.508 L20.6,16.041l-0.25,0.36l0.601,0.41l-2.81,3.811l1.317-0.742l1.974-2.738l0.438,0.299l0.246-0.36l-0.43-0.294l0.414-0.576 c0.473,0.173,1,0.219,1.565,0.125c1.254-0.211,2.452-1.06,2.647-1.527c0.059-0.141,0.039-0.252,0.006-0.325l-0.088-0.329 l0.332,0.099l0.147,0.007c0.272-0.046,0.647-0.109,2.606-6.202c0.94-2.932,1.803-5.888,1.81-5.918l0.269-0.926L30.662,1.843z M26.6,13.665L25.4,13.311l0.359,1.314c-0.169,0.261-1.119,0.964-2.189,1.144c-0.406,0.068-0.776,0.045-1.114-0.05l0.013-0.017 l4.356-6.772l-0.103-0.056l-4.718,6.506l-0.077,0.104c-0.046-0.03-0.098-0.052-0.142-0.083c-0.456-0.341-0.677-0.825-0.655-1.439 c0.038-1.049,0.766-2.154,1.006-2.362l1.562-0.007l-0.868-1.157c0.146-0.662,2.593-3.129,5.513-5.779l0.197,1.174l0.966-0.282 C28.275,9.54,27.055,13.097,26.6,13.665z M29.641,5.108l-0.795,0.233L28.68,4.354c0.531-0.479,1.073-0.959,1.619-1.437 C30.082,3.649,29.863,4.384,29.641,5.108z"/><path d="M24.014,27.344c-1.048-0.421-2.25-0.634-3.58-0.634c-3.267,0-6.375,1.251-7.311,1.664v-5.978l0.436,0.479v-8.979 c1.76-1.48,3.917-2.239,6.425-2.239c0.219,0,0.43,0.007,0.637,0.018l0.497-0.707c-0.36-0.031-0.736-0.05-1.134-0.05 c-2.726,0-5.072,0.831-6.983,2.469c-1.911-1.638-4.258-2.469-6.983-2.469c-2.545,0-4.452,0.741-4.532,0.772L1.25,11.782v1.503 C0.479,13.429,0,13.688,0,14.109c0,2.192,0,15.495,0,15.495h11.411c0.396,0.354,0.973,0.577,1.618,0.577s1.223-0.224,1.617-0.577 h11.125c0,0,0-13.449,0-13.289c-0.627,0.461-1.76,0.703-1.76,0.703v10.326H24.014z M12.877,28.382 c-0.947-0.392-4.21-1.632-7.479-1.632c-1.29,0-2.435,0.197-3.41,0.59V12.295c0.569-0.191,2.12-0.639,4.028-0.639 c2.509,0,4.666,0.759,6.426,2.239v8.979l0.435-0.479V28.382z"/><path d="M3.153,14.596l0.155,0.587c3.906-1.036,7.421,0.881,7.456,0.901l0.295-0.53C10.909,15.47,7.301,13.498,3.153,14.596z"/><path d="M19.104,14.708c-0.693-0.083-2.315-0.279-4.361,0.362l0.181,0.58c1.923-0.604,3.397-0.424,4.106-0.339 c0.152,0.019,0.268,0.031,0.344,0.033l0.016-0.607C19.325,14.735,19.229,14.723,19.104,14.708z"/><path d="M19.373,16.897l0.016-0.606c-0.063-0.001-0.158-0.015-0.283-0.029c-0.694-0.085-2.316-0.28-4.362,0.363l0.181,0.58 c1.922-0.605,3.398-0.425,4.107-0.339C19.184,16.882,19.297,16.895,19.373,16.897z"/><path d="M14.742,18.125l0.181,0.58c1.919-0.604,3.077-0.458,3.634-0.391c0.131,0.018,0.232,0.028,0.31,0.03l0.016-0.606 c-0.063-0.002-0.146-0.014-0.249-0.025C18.032,17.639,16.784,17.485,14.742,18.125z"/><path d="M3.153,16.315l0.155,0.586c3.906-1.036,7.421,0.881,7.456,0.901l0.295-0.53C10.909,17.188,7.301,15.215,3.153,16.315z"/><path d="M3.153,17.93l0.155,0.586c3.906-1.035,7.421,0.881,7.456,0.901l0.295-0.53C10.909,18.802,7.301,16.832,3.153,17.93z"/><path d="M3.153,19.7l0.155,0.587c3.906-1.036,7.421,0.881,7.456,0.899l0.295-0.529C10.909,20.573,7.301,18.6,3.153,19.7z"/><path d="M3.153,21.339l0.155,0.587c3.906-1.035,7.421,0.881,7.456,0.901l0.295-0.53C10.909,22.213,7.301,20.241,3.153,21.339z"/><path d="M3.153,23.024l0.155,0.586c3.906-1.035,7.421,0.881,7.456,0.901l0.295-0.53C10.909,23.897,7.301,21.925,3.153,23.024z"/><path d="M3.153,24.713l0.155,0.585c3.906-1.036,7.421,0.882,7.456,0.901l0.295-0.529C10.909,25.585,7.301,23.612,3.153,24.713z"/><path d="M10.335,10.122h6.403c0.281,0,0.521-0.093,0.691-0.271c0.297-0.309,0.289-0.756,0.289-0.798V4.97H15.95V4.442h0.512v-0.7 h-1.085l0.281-1.827h-3.992l0.281,1.827h-1.084v0.7h0.564V4.97h-2.04v4.103c-0.001,0.049-0.011,0.485,0.28,0.786 C9.834,10.03,10.064,10.122,10.335,10.122z M9.894,5.477h2.04V4.442h3.513v1.034h1.767v1.258h-7.32V5.477z M16.477,8.016v0.24 h-5.846v-0.24H16.477z M11.657,7.726v-0.24h3.897v0.24H11.657z M9.894,8.781h7.319v0.279c0,0.078-0.021,0.31-0.148,0.44 c-0.076,0.077-0.182,0.114-0.324,0.114h-6.404c-0.133,0-0.23-0.035-0.301-0.106C9.913,9.385,9.892,9.165,9.894,9.083V8.781z"/></svg>
          </div>

          {/* Link to Blogs Page */}
          <Link
            href="/blogs"
            className="inline-flex items-center px-2 py-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white font-semibold text-lg rounded-xl transition-all duration-300 border border-black/20 dark:border-white/20 hover:scale-105 animate-fadeIn"
            style={{ animationDelay: '0.6s' }}
          >
            {t.blogsButton}
          </Link>
        </div>
      </section>

      {/* ========================================================================== */}
      {/* SECTION 3b - MĂRTURII — pasul 2708014 */}
      {/* ========================================================================== */}
      <section id="marturii" className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-20 bg-black/5 dark:bg-white/5">
        <div className="max-w-4xl mx-auto w-full text-center">
          <h2 className="font-cinzel text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white mb-8 animate-fadeIn">
            {t.marturiiTitle}
          </h2>

          <br />
          <p className="text-xl sm:text-2xl text-black/80 dark:text-white/80 leading-relaxed mb-12 animate-fadeIn italic" style={{ animationDelay: '0.2s' }}>
            {t.marturiiText}
          </p>
          <br />

          <div className="mb-8 animate-fadeIn flex justify-center" style={{ animationDelay: '0.4s' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              className="w-20 h-20 text-black dark:text-white"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M19.5,11h7c0.276,0,0.5-0.224,0.5-0.5S26.776,10,26.5,10h-7c-0.276,0-0.5,0.224-0.5,0.5S19.224,11,19.5,11z" />
              <path d="M19.5,14h7c0.276,0,0.5-0.224,0.5-0.5S26.776,13,26.5,13h-7c-0.276,0-0.5,0.224-0.5,0.5S19.224,14,19.5,14z" />
              <path d="M19.5,17h7c0.276,0,0.5-0.224,0.5-0.5S26.776,16,26.5,16h-7c-0.276,0-0.5,0.224-0.5,0.5S19.224,17,19.5,17z" />
              <path d="M19.5,20h7c0.276,0,0.5-0.224,0.5-0.5S26.776,19,26.5,19h-7c-0.276,0-0.5,0.224-0.5,0.5S19.224,20,19.5,20z" />
              <path d="M28.5,5h-10C18.224,5,18,5.224,18,5.5S18.224,6,18.5,6h10C28.776,6,29,6.225,29,6.5v19c0,0.275-0.224,0.5-0.5,0.5h-25C3.224,26,3,25.775,3,25.5v-19C3,6.225,3.224,6,3.5,6H15v17.5c0,0.276,0.224,0.5,0.5,0.5s0.5-0.224,0.5-0.5v-18C16,5.224,15.776,5,15.5,5h-12C2.673,5,2,5.673,2,6.5v19C2,26.327,2.673,27,3.5,27h25c0.827,0,1.5-0.673,1.5-1.5v-19C30,5.673,29.327,5,28.5,5z" />
            </svg>
          </div>

          <Link
            href="/marturii"
            className="inline-flex items-center px-2 py-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white font-semibold text-lg rounded-xl transition-all duration-300 border border-black/20 dark:border-white/20 hover:scale-105 animate-fadeIn"
            style={{ animationDelay: '0.6s' }}
          >
            {t.marturiiButton}
          </Link>
        </div>
      </section>

      {/* ========================================================================== */}
      {/* SECTION 3c/d/e — Andacht, Pentru copii, Versetul zilei (pasul 2708021) */}
      {/* Apar doar dacă le-ai pornit din Setări → Pagini. */}
      {/* ========================================================================== */}
      {enabledPages.has('andacht') && (
        <section id="andacht" className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto w-full text-center">
            <h2 className="font-cinzel text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white mb-8 animate-fadeIn">
              {t.andachtTitle}
            </h2>
            <br />
            <p className="text-xl sm:text-2xl text-black/80 dark:text-white/80 leading-relaxed mb-12 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              {t.andachtText}
            </p>
            <br />
            <div className="mb-8 animate-fadeIn flex justify-center" style={{ animationDelay: '0.4s' }}>
              <svg viewBox="0 0 48 48" className="w-20 h-20 text-black dark:text-white" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12.6,13.09h7.29" />
                <path d="M12.55,16.21h7.3" />
                <path d="M12.55,19.28h7.3" />
                <path d="M12.55,22.43h7.3" />
                <path d="M8.67,9V34.08H19.79c1.79,0,4.29,1.75,4.29,1.75L24,10.35a5.51,5.51,0,0,0-3.85-1.58Z" />
                <path d="M30.82,34.08H28.37c-1.79,0-4.29,1.75-4.29,1.75l.09-25.48A5.51,5.51,0,0,1,28,8.77l2.8,0" />
                <path d="M33.89,8.86l5.6.09V34.08h-5.6" />
                <path d="M33.89,36.62h7.7V10.28H40" />
                <path d="M8.49,10.37H6.29V36.6H21.45a10.39,10.39,0,0,0,2.53.58,9.37,9.37,0,0,0,2.38-.56h4.46" />
                <path d="M30.82,7.19v32.4l1.49-1.05,1.58,1V7.28Z" />
              </svg>
            </div>
            <Link
              href="/andacht"
              className="inline-flex items-center px-2 py-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white font-semibold text-lg rounded-xl transition-all duration-300 border border-black/20 dark:border-white/20 hover:scale-105 animate-fadeIn"
              style={{ animationDelay: '0.6s' }}
            >
              {t.andachtButton}
            </Link>
          </div>
        </section>
      )}

      {enabledPages.has('copii') && (
        <section id="copii" className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-20 bg-black/5 dark:bg-white/5">
          <div className="max-w-4xl mx-auto w-full text-center">
            <h2 className="font-cinzel text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white mb-8 animate-fadeIn">
              {t.copiiTitle}
            </h2>
            <br />
            <p className="text-xl sm:text-2xl text-black/80 dark:text-white/80 leading-relaxed mb-12 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              {t.copiiText}
            </p>
            <br />
            <div className="mb-8 animate-fadeIn flex justify-center" style={{ animationDelay: '0.4s' }}>
              <svg viewBox="0 0 1024 1024" className="w-20 h-20 text-black dark:text-white" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M296.022 64.46a7.994 7.994 0 0 1-3.428-15.224C361.302 16.712 435.07 0.224 511.86 0.224c76.524 0 150.064 16.378 218.594 48.7a7.98 7.98 0 0 1 3.826 10.632c-1.876 4.014-6.714 5.684-10.634 3.826C657.256 32.076 586.01 16.212 511.86 16.212c-74.4 0-145.874 15.972-212.426 47.482a8.066 8.066 0 0 1-3.412 0.766zM967.846 735.372a7.944 7.944 0 0 1-3.404-0.766 7.984 7.984 0 0 1-3.824-10.632c31.304-66.358 47.17-137.604 47.17-211.786 0-74.4-15.974-145.88-47.482-212.426a7.992 7.992 0 0 1 3.81-10.648c3.964-1.842 8.742-0.204 10.648 3.81 32.524 68.702 49.012 142.476 49.012 219.266 0 76.554-16.378 150.096-48.7 218.594a7.966 7.966 0 0 1-7.23 4.588zM56.472 735.372a7.99 7.99 0 0 1-7.236-4.574C16.712 662.096 0.224 588.32 0.224 511.532c0-76.554 16.386-150.096 48.7-218.594 1.88-4.012 6.636-5.684 10.64-3.826a7.994 7.994 0 0 1 3.818 10.632c-31.298 66.36-47.17 137.606-47.17 211.788 0 74.4 15.972 145.88 47.482 212.426a7.996 7.996 0 0 1-7.222 11.414zM511.188 1023.776c-76.554 0-150.104-16.378-218.602-48.7a7.994 7.994 0 0 1-3.818-10.634 7.986 7.986 0 0 1 10.642-3.824c66.35 31.304 137.604 47.17 211.778 47.17 74.4 0 145.88-15.974 212.426-47.482 3.952-1.874 8.728-0.204 10.65 3.81a7.992 7.992 0 0 1-3.81 10.648c-68.702 32.524-142.478 49.012-219.266 49.012zM391.92 672.932a7.86 7.86 0 0 1-3.856-0.998c-81.426-44.954-132.008-130.798-132.008-224.03 0-141.054 114.762-255.816 255.818-255.816a7.99 7.99 0 0 1 7.994 7.994 7.99 7.99 0 0 1-7.994 7.994c-132.242 0-239.83 107.58-239.83 239.828 0 87.408 47.418 167.896 123.748 210.038a7.976 7.976 0 0 1 3.13 10.854 7.95 7.95 0 0 1-7.002 4.136z" />
                <path d="M631.804 672.932a7.952 7.952 0 0 1-6.994-4.136 7.976 7.976 0 0 1 3.136-10.854c76.32-42.14 123.74-122.628 123.74-210.038 0-132.248-107.58-239.828-239.812-239.828a7.988 7.988 0 0 1-7.994-7.994 7.988 7.988 0 0 1 7.994-7.994c141.054 0 255.8 114.762 255.8 255.816 0 93.23-50.588 179.076-132.014 224.03a7.812 7.812 0 0 1-3.856 0.998zM391.96 799.654a7.99 7.99 0 0 1-7.994-7.994v-126.722c0-4.418 3.576-7.994 7.994-7.994s7.996 3.576 7.996 7.994v126.722a7.992 7.992 0 0 1-7.996 7.994z" />
                <path d="M631.774 799.654a7.988 7.988 0 0 1-7.994-7.994v-126.536a7.988 7.988 0 0 1 7.994-7.994 7.99 7.99 0 0 1 7.994 7.994v126.536a7.99 7.99 0 0 1-7.994 7.994z" />
                <path d="M631.774 703.722H391.96a7.99 7.99 0 0 1-7.994-7.994 7.988 7.988 0 0 1 7.994-7.994h239.814a7.988 7.988 0 0 1 7.994 7.994 7.99 7.99 0 0 1-7.994 7.994zM599.794 831.63h-175.858a7.98 7.98 0 0 1-5.652-2.342l-31.976-31.976a7.988 7.988 0 0 1 0-11.304 7.988 7.988 0 0 1 11.304 0l29.636 29.634h169.238l29.634-29.634c3.124-3.124 8.182-3.124 11.304 0s3.124 8.182 0 11.304l-31.978 31.976a7.966 7.966 0 0 1-5.652 2.342zM375.964 751.688a7.994 7.994 0 0 1-0.462-15.974l271.79-15.988c4.28-0.344 8.182 3.108 8.448 7.51a7.988 7.988 0 0 1-7.51 8.448l-271.792 15.988c-0.154 0.016-0.318 0.016-0.474 0.016zM375.964 783.666a7.996 7.996 0 0 1-0.462-15.976l271.79-15.988c4.28-0.516 8.182 3.108 8.448 7.512a7.986 7.986 0 0 1-7.51 8.446l-271.792 15.99c-0.154 0.016-0.318 0.016-0.474 0.016z" />
                <path d="M511.876 863.61c-44.398 0-62.37-34.914-63.112-36.396-1.976-3.952-0.376-8.744 3.576-10.726s8.736-0.376 10.71 3.542c0.624 1.218 14.59 27.59 48.826 27.59 34.272 0 48.23-26.464 48.808-27.59a8.046 8.046 0 0 1 10.742-3.512 7.99 7.99 0 0 1 3.544 10.696c-0.75 1.482-18.706 36.396-63.094 36.396zM471.902 671.746a7.99 7.99 0 0 1-7.994-7.996v-63.954a7.99 7.99 0 0 1 7.994-7.994 7.99 7.99 0 0 1 7.996 7.994v63.954a7.99 7.99 0 0 1-7.996 7.996zM551.83 671.746a7.99 7.99 0 0 1-7.994-7.996v-63.954c0-4.418 3.576-7.994 7.994-7.994s7.994 3.576 7.994 7.994v63.954a7.99 7.99 0 0 1-7.994 7.996z" />
                <path d="M471.91 607.792a8.01 8.01 0 0 1-6.252-2.998 8.008 8.008 0 0 1 1.248-11.242l39.972-31.976a8.034 8.034 0 0 1 11.242 1.248 8.004 8.004 0 0 1-1.248 11.242l-39.972 31.978a8.032 8.032 0 0 1-4.99 1.748z" />
                <path d="M551.83 607.792a8.024 8.024 0 0 1-4.996-1.748l-39.956-31.978a8.002 8.002 0 0 1-1.242-11.242 8.024 8.024 0 0 1 11.234-1.248l39.956 31.976a8.006 8.006 0 0 1 1.25 11.242 8 8 0 0 1-6.246 2.998zM471.902 575.812a7.988 7.988 0 0 1-7.994-7.992v-111.92a7.992 7.992 0 0 1 7.994-7.996 7.99 7.99 0 0 1 7.996 7.996v111.92a7.988 7.988 0 0 1-7.996 7.992z" />
                <path d="M471.902 463.894a7.99 7.99 0 0 1-7.994-7.994c0-13.226-10.758-23.984-23.982-23.984s-23.982 10.758-23.982 23.984a7.99 7.99 0 0 1-7.994 7.994 7.988 7.988 0 0 1-7.994-7.994c0-22.046 17.932-39.972 39.97-39.972s39.972 17.924 39.972 39.972a7.99 7.99 0 0 1-7.996 7.994z" />
                <path d="M439.926 495.872c-22.04 0-39.97-17.924-39.97-39.972a7.99 7.99 0 0 1 7.994-7.996 7.99 7.99 0 0 1 7.994 7.996c0 13.224 10.758 23.984 23.982 23.984a7.99 7.99 0 0 1 7.994 7.994 7.992 7.992 0 0 1-7.994 7.994zM551.83 575.812a7.988 7.988 0 0 1-7.994-7.992v-111.92c0-4.418 3.576-7.996 7.994-7.996s7.994 3.576 7.994 7.996v111.92a7.988 7.988 0 0 1-7.994 7.992z" />
                <path d="M615.786 463.894a7.988 7.988 0 0 1-7.994-7.994c0-13.226-10.758-23.984-23.984-23.984-13.224 0-23.982 10.758-23.982 23.984 0 4.418-3.576 7.994-7.994 7.994s-7.994-3.576-7.994-7.994c0-22.046 17.924-39.972 39.97-39.972s39.972 17.924 39.972 39.972a7.99 7.99 0 0 1-7.994 7.994z" />
                <path d="M583.806 495.872a7.99 7.99 0 0 1-7.994-7.994 7.99 7.99 0 0 1 7.994-7.994c13.226 0 23.984-10.758 23.984-23.984a7.99 7.99 0 0 1 7.994-7.996 7.99 7.99 0 0 1 7.994 7.996c0.002 22.046-17.924 39.972-39.972 39.972zM328.006 455.9a7.99 7.99 0 0 1-7.994-7.996c0-105.798 86.072-191.862 191.864-191.862 4.418 0 7.994 3.576 7.994 7.994s-3.576 7.996-7.994 7.996c-96.978 0-175.876 78.896-175.876 175.874a7.99 7.99 0 0 1-7.994 7.994zM519.87 495.872h-15.988a7.99 7.99 0 0 1-7.996-7.994 7.99 7.99 0 0 1 7.996-7.994h15.988a7.99 7.99 0 0 1 7.994 7.994 7.992 7.992 0 0 1-7.994 7.994z" />
                <path d="M879.596 288.02c-79.35 0-143.896-64.548-143.896-143.898S800.246 0.224 879.596 0.224s143.898 64.548 143.898 143.898-64.548 143.898-143.898 143.898z m0-271.808c-70.528 0-127.908 57.38-127.908 127.91 0 70.528 57.38 127.91 127.908 127.91s127.91-57.382 127.91-127.91c0-70.528-57.382-127.91-127.91-127.91z" />
                <path d="M879.596 1023.494c-79.35 0-143.896-64.548-143.896-143.896 0-79.352 64.546-143.898 143.896-143.898s143.898 64.546 143.898 143.898c0 79.348-64.548 143.896-143.898 143.896z m0-271.806c-70.528 0-127.908 57.382-127.908 127.91s57.38 127.908 127.908 127.908 127.91-57.38 127.91-127.908-57.382-127.91-127.91-127.91z" />
                <path d="M144.122 288.02C64.78 288.02 0.226 223.472 0.226 144.122S64.78 0.224 144.122 0.224s143.898 64.548 143.898 143.898-64.558 143.898-143.898 143.898z m0-271.808c-70.528 0-127.908 57.38-127.908 127.91 0 70.528 57.38 127.91 127.908 127.91s127.91-57.382 127.91-127.91c-0.002-70.528-57.384-127.91-127.91-127.91z" />
                <path d="M144.122 1023.494c-79.342 0-143.896-64.548-143.896-143.896 0-79.352 64.554-143.898 143.896-143.898s143.898 64.546 143.898 143.898c-0.002 79.348-64.558 143.896-143.898 143.896z m0-271.806c-70.528 0-127.908 57.382-127.908 127.91s57.38 127.908 127.908 127.908 127.91-57.38 127.91-127.908-57.384-127.91-127.91-127.91z" />
                <path d="M879.596 224.064a8.09 8.09 0 0 1-3.246-0.686c-3.138-1.39-76.696-34.788-76.696-95.246 0-26.45 21.516-47.964 47.964-47.964a47.248 47.248 0 0 1 31.976 12.35 47.256 47.256 0 0 1 31.978-12.35c26.45 0 47.964 21.516 47.964 47.964 0 60.458-73.556 93.856-76.696 95.246a8.06 8.06 0 0 1-3.244 0.686zM847.62 96.156c-17.628 0-31.976 14.35-31.976 31.976 0 43.718 50.494 72.23 63.954 79.052 13.43-6.838 63.956-35.444 63.956-79.052 0-17.626-14.35-31.976-31.976-31.976-10.104 0-19.424 4.73-25.56 12.99-3.03 4.06-9.804 4.06-12.834 0-6.142-8.26-15.464-12.99-25.564-12.99z" />
                <path d="M144.122 192.088c-35.264 0-63.954-28.684-63.954-63.956s28.69-63.954 63.954-63.954 63.956 28.682 63.956 63.954-28.694 63.956-63.956 63.956z m0-111.92c-26.45 0-47.964 21.516-47.964 47.964 0 26.45 21.516 47.966 47.964 47.966 26.45 0 47.966-21.516 47.966-47.966-0.002-26.448-21.516-47.964-47.966-47.964z" />
                <path d="M144.122 224.064c-35.264 0-63.954-28.682-63.954-63.954 0-4.418 3.576-7.994 7.994-7.994s7.996 3.576 7.996 7.994c0 26.45 21.516 47.966 47.964 47.966 26.45 0 47.966-21.516 47.966-47.966a7.99 7.99 0 0 1 7.996-7.994 7.99 7.99 0 0 1 7.994 7.994c-0.002 35.272-28.694 63.954-63.956 63.954z" />
                <path d="M144.122 160.11a7.99 7.99 0 0 1-7.994-7.994V104.15a7.99 7.99 0 0 1 7.994-7.994 7.99 7.99 0 0 1 7.994 7.994v47.966a7.988 7.988 0 0 1-7.994 7.994z" />
                <path d="M168.104 136.126l-47.966-0.016a7.996 7.996 0 0 1 0-15.988l47.966 0.016a7.992 7.992 0 1 1 0 15.988z" />
              </svg>
            </div>
            <Link
              href="/copii"
              className="inline-flex items-center px-2 py-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white font-semibold text-lg rounded-xl transition-all duration-300 border border-black/20 dark:border-white/20 hover:scale-105 animate-fadeIn"
              style={{ animationDelay: '0.6s' }}
            >
              {t.copiiButton}
            </Link>
          </div>
        </section>
      )}

      {enabledPages.has('verset') && (
        <section id="verset" className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto w-full text-center">
            <h2 className="font-cinzel text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white mb-8 animate-fadeIn">
              {t.versetTitle}
            </h2>
            <br />
            <p className="text-xl sm:text-2xl text-black/80 dark:text-white/80 leading-relaxed mb-12 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              {t.versetText}
            </p>
            <br />
            <div className="mb-8 animate-fadeIn flex justify-center" style={{ animationDelay: '0.4s' }}>
              <svg viewBox="0 0 57.88 57.88" className="w-20 h-20 text-black dark:text-white" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M57.469,15.017L47.384,5.94H26v-4c0-0.553-0.448-1-1-1s-1,0.447-1,1v4H0v20h24v30c0,0.553,0.448,1,1,1s1-0.447,1-1v-30 h21.384l10.083-9.075c0.263-0.235,0.413-0.572,0.413-0.925S57.73,15.251,57.469,15.017z M46.616,23.94H2v-16h44.616l8.889,8 L46.616,23.94z" />
              </svg>
            </div>
            <Link
              href="/verset"
              className="inline-flex items-center px-2 py-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white font-semibold text-lg rounded-xl transition-all duration-300 border border-black/20 dark:border-white/20 hover:scale-105 animate-fadeIn"
              style={{ animationDelay: '0.6s' }}
            >
              {t.versetButton}
            </Link>
          </div>
        </section>
      )}

      {/* ========================================================================== */}
      {/* SECTION 4 - CONTACT */}
      {/* ========================================================================== */}
      <section id="contact" className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-20 bg-black/5 dark:bg-white/5">
        <div className="max-w-4xl mx-auto w-full text-center">
          {/* Section Title */}
          <h2 className="font-cinzel text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white mb-8 animate-fadeIn">
            {t.contactTitle}
          </h2>
          
          {/* Description */}
          <br></br>
          <p className="text-xl sm:text-2xl text-black/80 dark:text-white/80 leading-relaxed mb-12 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            {t.contactText}
          </p>
          <br></br>

          {/* Mail/contact icon for Kontaktiere uns */}
          {/* Pasul 12006: Custom SVG email icon */}
          <div className="mb-8 animate-fadeIn flex justify-center" style={{ animationDelay: '0.4s' }}>
            <svg className="w-16 h-16 text-black dark:text-white" fill="currentColor" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M35.0137,31.8325c0.5488-0.0596,0.9453-0.5532,0.8857-1.1021c-0.0596-0.5493-0.5518-0.9434-1.1025-0.8862 c-6.4932,0.7036-9.5806-1.688-11.0259-3.8203c-2.0195-2.98-2.0645-7.2817-0.1143-10.959 c1.9429-3.6626,5.356-5.7627,9.3657-5.7627c0.001,0,0.002,0,0.0029,0c3.0547,0,5.7949,1.2461,7.3301,3.3325 c1.6016,2.1763,1.8633,5.2012,0.7578,8.7485c-0.4336,1.3921-1.8486,3.2183-3.0938,3.5781 c-0.5078,0.1484-0.9092,0.0938-1.2236-0.1665c-0.3623-0.3013-0.4922-0.769-0.4814-0.9541 c0.002-0.0117,0.0029-0.0225,0.0039-0.0342l1.0957-10.9561c0.0586-0.5493-0.3389-1.042-0.8877-1.1001 c-0.5586-0.061-1.042,0.3389-1.1006,0.8882l-0.0969,0.9086c-0.0175-0.013-0.0319-0.0287-0.0496-0.0414 c-1.2813-0.9214-3.0767-1.0112-4.8047-0.2397c-2.9424,1.3115-5.0669,5.48-4.5469,8.9199c0.3901,2.5801,2.209,4.251,4.9917,4.5845 c1.2773,0.1519,2.8452-0.2251,4.0083-1.085c0.1689,0.2427,0.3682,0.4634,0.5908,0.6484 c0.8242,0.6836,1.9092,0.8794,3.0566,0.5488c2.0088-0.5811,3.8389-2.9502,4.4482-4.9048 c1.6445-5.2793,0.333-8.6396-1.0566-10.5283c-1.9111-2.5972-5.2539-4.1475-8.9414-4.1475c-0.001,0-0.002,0-0.0029,0 c-4.7739,0-8.8315,2.4878-11.1323,6.8252c-2.293,4.3232-2.2046,9.4331,0.2256,13.0186 c2.1333,3.1475,5.8232,4.8188,10.5332,4.8188C33.4111,31.9648,34.2002,31.9209,35.0137,31.8325z M34.9131,17.4961l-0.5693,5.9414 c-0.5811,0.9546-2.1055,1.4746-3.1875,1.3472c-1.9009-0.228-2.9946-1.2026-3.251-2.8975 c-0.3848-2.5454,1.2593-5.8477,3.3838-6.7949c0.5137-0.229,1.0332-0.3433,1.5107-0.3433c0.5029,0,0.96,0.1274,1.3115,0.3804 C34.7412,15.582,35.0176,16.4004,34.9131,17.4961z"/><path d="M59.3057,21.6533l-7.2637-4.4982V2c0-0.5522-0.4473-1-1-1H12.4771c-0.5522,0-1,0.4478-1,1v15.0159 c-3.4714,2.1884-5.806,3.7847-6.9165,4.7346c-1.5254,1.3042-2.3652,3.1631-2.3652,5.2334v29.0249 C2.1953,59.8638,5.3315,63,9.186,63h45.6284c1.8837,0,3.5925-0.7524,4.8508-1.9683c0.0023-0.0023,0.0054-0.003,0.0076-0.0053 c0.0011-0.0012,0.0013-0.0027,0.0024-0.0039c1.3107-1.2715,2.1294-3.0475,2.1294-5.0137V26.9839 C61.8047,25.2393,61.1504,22.7964,59.3057,21.6533z M52.042,19.5073l5.0593,3.1331l-5.0593,4.4129V19.5073z M58.784,23.826 c0.6964,0.7996,1.0207,2.077,1.0207,3.1579v29.0249c0,1.0747-0.3491,2.0649-0.9291,2.8804L39.5911,40.5665L58.784,23.826z M13.4771,3H50.042v25.7969L31.998,44.5361l-18.521-16.1475V3z M11.4771,19.3841v7.2624L6.7792,22.551 C7.835,21.7673,9.4214,20.6976,11.4771,19.3841z M4.1953,56.0088V26.9839c0-1.1927,0.3796-2.2405,1.0782-3.0918l19.8513,17.3058 L5.7814,59.6376C4.8109,58.7264,4.1953,57.4419,4.1953,56.0088z M9.186,61c-0.5724,0-1.1138-0.1168-1.6263-0.295l19.0789-18.1874 l4.7021,4.0992c0.1885,0.1641,0.4229,0.2461,0.6572,0.2461s0.4692-0.082,0.6572-0.2466l5.4222-4.7294l19.3299,18.3657 C56.6494,60.7177,55.7672,61,54.8145,61H9.186z"/></svg>
          </div>

          {/* Link to Contact Page */}
          <Link
            href="/contact"
            className="inline-flex items-center px-2 py-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white font-semibold text-lg rounded-xl transition-all duration-300 border border-black/20 dark:border-white/20 hover:scale-105 animate-fadeIn"
            style={{ animationDelay: '0.6s' }}
          >
            {t.contactButton}
          </Link>
        </div>
      </section>

      {/* ========================================================================== */}
      {/* SECTION 5 - THANK YOU MESSAGE */}
      {/* ========================================================================== */}
      <section id="thankyou" className="min-h-screen flex flex-col justify-end items-center px-4 sm:px-6 lg:px-8 py-20 sm:py-24 md:py-32 pb-8">
        <div className="max-w-4xl mx-auto w-full text-center">
          {/* Thank You Message */}
          <h2 className="font-cinzel text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-black dark:text-white mb-8 animate-fadeIn leading-tight">
            {t.thanksTitle}
          </h2>
          
          {/* Blessing Message */}
          <br></br>
          <p className="text-2xl sm:text-3xl text-black/80 dark:text-white/80 mb-8 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            {t.thanksText}
          </p>

          {/* Heart and Cross */}
          <div className="text-6xl sm:text-8xl mb-16 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            ⏱
          </div>
          <br></br>

          {/* Back to Top Button - positioned closer to footer with more spacing from clock */}
          <div className="mt-8 mb-4">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center px-2 py-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white font-semibold text-lg rounded-xl transition-all duration-300 border border-black/20 dark:border-white/20 hover:scale-105 animate-fadeIn"
              style={{ animationDelay: '0.7s' }}
            >
              <svg 
                className="mr-2 w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {language === 'de' ? 'Zurück nach oben' : language === 'en' ? 'Back to Top' : language === 'ro' ? 'Înapoi sus' : 'Вернуться наверх'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
