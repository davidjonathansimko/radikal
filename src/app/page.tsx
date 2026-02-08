// Homepage component - Main landing page / Homepage-Komponente - Hauptlandingpage / Componentă pagină principală - Pagina de destinație principală
// This creates the beautiful homepage with the design matching the example image
// Dies erstellt die schöne Homepage mit dem Design, das dem Beispielbild entspricht
// Aceasta creează pagina de start frumoasă cu designul potrivit imaginii exemplu

'use client';

import React, { Suspense, lazy, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { createClient } from '@/lib/supabase';

// Dynamic import for WelcomeModal (includes GSAP, loaded only when needed)
const WelcomeModal = dynamic(() => import('@/components/WelcomeModal'), { ssr: false });

// Lazy load BibleQuotes for better performance / Verzögertes Laden von BibleQuotes für bessere Leistung / Încărcare leneșă BibleQuotes pentru performanță mai bună
const BibleQuotes = lazy(() => import('@/components/BibleQuotes'));

export default function HomePage() {
  // Get language context / Sprachkontext abrufen / Obține contextul limbii
  const { language, setLanguage } = useLanguage();
  
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
  
  const supabase = createClient();

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
    const checkSession = async () => {
      try {
        // Check if user is authenticated / Prüfen ob Benutzer authentifiziert ist / Verifică dacă utilizatorul este autentificat
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // User is logged in - check if they have a saved language / Benutzer ist eingeloggt - prüfen ob gespeicherte Sprache vorhanden / Utilizatorul este autentificat - verifică dacă are o limbă salvată
          const savedLanguage = localStorage.getItem('radikalSelectedLanguage');
          if (savedLanguage) {
            // User has already selected a language, apply it / Benutzer hat bereits eine Sprache ausgewählt, anwenden / Utilizatorul a selectat deja o limbă, aplică-o
            setLanguage(savedLanguage as 'de' | 'en' | 'ro' | 'ru');
            setShowModal(false);
            // Show splash logo for returning users
            const splashShown = sessionStorage.getItem('radikalSplashShown');
            if (!splashShown) {
              setShowSplash(true);
              sessionStorage.setItem('radikalSplashShown', 'true');
            }
          } else {
            // Logged-in user but no language saved yet - show modal / Eingeloggter Benutzer aber noch keine Sprache gespeichert - Modal anzeigen / Utilizator autentificat dar fără limbă salvată încă - afișează modalul
            setShowModal(true);
          }
        } else {
          // User is not logged in - check if they've seen modal in this session / Benutzer ist nicht eingeloggt - prüfen ob Modal in dieser Sitzung gesehen / Utilizatorul nu este autentificat - verifică dacă a văzut modalul în această sesiune
          const modalSeen = sessionStorage.getItem('radikalModalSeen');
          const guestLanguage = sessionStorage.getItem('radikalGuestLanguage');
          
          if (modalSeen === 'true' && guestLanguage) {
            // Guest has already seen modal in this session / Gast hat Modal in dieser Sitzung bereits gesehen / Vizitatorul a văzut deja modalul în această sesiune
            setLanguage(guestLanguage as 'de' | 'en' | 'ro' | 'ru');
            setShowModal(false);
          } else {
            // Show modal for new guests / Modal für neue Gäste anzeigen / Afișează modalul pentru vizitatori noi
            setShowModal(true);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // On error, show modal to be safe / Bei Fehler Modal zur Sicherheit anzeigen / În caz de eroare, afișează modalul pentru siguranță
        setShowModal(true);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
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
        const guestLanguage = sessionStorage.getItem('radikalGuestLanguage');
        if (guestLanguage && guestLanguage !== language) {
          setLanguage(guestLanguage as 'de' | 'en' | 'ro' | 'ru');
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
    
    // Show Navigation and Footer by removing the hiding class / Navigation und Footer anzeigen durch Entfernen der versteckenden Klasse / Afișează Navigarea și Footerul prin eliminarea clasei de ascundere
    document.body.classList.remove('modal-active');
  };

  // Always clean up modal-active class when homepage doesn't need modal
  // This fixes nav/footer disappearing after login redirect from WelcomeModal
  // Immer modal-active-Klasse bereinigen wenn Homepage kein Modal braucht
  // Întotdeauna curăță clasa modal-active când pagina principală nu are nevoie de modal
  useEffect(() => {
    if (!showModal && !isCheckingSession) {
      document.body.classList.remove('modal-active');
    }
  }, [showModal, isCheckingSession]);

  // Show nothing while checking session / Nichts anzeigen während Sitzung geprüft wird / Nu afișa nimic în timp ce se verifică sesiunea
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-black/60 dark:text-white/60 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-black/30 dark:border-white/30 border-t-black/80 dark:border-t-white/80 rounded-full mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  // Show modal if needed / Modal anzeigen wenn nötig / Afișează modalul dacă este necesar
  if (showModal) {
    // Add class to hide Navigation and Footer / Klasse hinzufügen um Navigation und Footer zu verstecken / Adaugă clasă pentru a ascunde Navigarea și Footerul
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-active');
    }
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
                {language === 'de' 
                  ? 'Weil du aber lauwarm bist und weder kalt noch heiß, will ich dich ausspucken aus meinem Mund.'
                  : language === 'en'
                  ? 'So then because thou art lukewarm, and neither cold nor hot, I will spue thee out of my mouth.'
                  : language === 'ro'
                  ? 'Astfel, pentru că ești căldicel, nici rece, nici fierbinte, am să te vărs din gura Mea.'
                  : 'Но, как ты тепл, а не горяч и не холоден, то извергну тебя из уст Моих.'}
              </p>
              
              {/* Bible reference */}
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-black/80 dark:text-white/80 font-bold">
                {language === 'de' 
                  ? 'Offenbarung 3:16'
                  : language === 'en'
                  ? 'Revelation 3:16'
                  : language === 'ro'
                  ? 'Apocalipsa 3:16'
                  : 'Откровение 3:16'}
              </p>
            </div>
          </div>
        </div>

        {/* Animated Scroll Down Button - now part of flex flow */}
        {/* More margin-bottom on mobile to push button up from screen edge */}
        {showScrollButton && (
          <div className="flex-shrink-0 flex justify-center mt-12 mb-12 sm:mb-12 pb-8">
            <button
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex flex-col items-center gap-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors duration-300 animate-bounce"
              aria-label="Scroll down"
            >
              <span className="text-sm font-medium">
                {language === 'de' ? 'Mehr entdecken' : language === 'en' ? 'Discover more' : language === 'ro' ? 'Descoperă mai mult' : 'Узнать больше'}
              </span>
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================== */}
      {/* SECTION 2 - DESPRE / ABOUT / ÜBER */}
      {/* ========================================================================== */}
      <section id="about" className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-20 bg-black/5 dark:bg-white/5">
        <div className="max-w-4xl mx-auto w-full text-center">
          {/* Section Title */}
          <h2 className="font-cinzel text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white mb-8 animate-fadeIn">
            {language === 'de' ? 'Über ' : language === 'en' ? 'About ' : language === 'ro' ? 'Despre ' : 'О '}
          </h2>
          
          {/* Description */}
          <p className="text-xl sm:text-2xl text-black/80 dark:text-white/80 leading-relaxed mb-12 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            {language === 'de' 
              ? <>Ich blickte oft mit Bewunderung, aber mit noch tieferem Schmerz in meiner Seele um mich her und fragte mich: &quot;Warum wagt es niemand mehr, die Wahrheit auszusprechen? Und natürlich meine ich damit uns Christen und unsere Gemeinden.&quot;<br/>Aus diesem Schmerz wurde RADIKAL geboren. Selbst meine eigene Meinung ist mir absolut bedeutungslos, wenn sie nicht zu hundert Prozent mit dem Wort Gottes übereinstimmt.</>
              : language === 'en'
              ? <>I often looked around with admiration, but with even deeper pain in my soul, asking myself: &quot;Why does no one dare to speak the truth anymore? And of course, I mean us Christians and our churches.&quot;<br/><br/>Out of this pain, RADIKAL was born. Even my own opinion is absolutely meaningless to me if it does not align one hundred percent with the Word of God.</>
              : language === 'ro'
              ? <>Adesea mă uitam în jur cu admirație, dar cu o durere și mai profundă în suflet, întrebându-mă: &quot;De ce nu mai îndrăznește nimeni să spună adevărul? Și bineînțeles, mă refer la noi, creștinii și bisericile noastre.&quot;<br/><br/>Din această durere, s-a născut RADIKAL. Chiar și propria mea opinie este absolut lipsită de sens pentru mine dacă nu se aliniază sută la sută cu Cuvântul lui Dumnezeu.</>
              : <>Я часто смотрел вокруг с восхищением, но с еще более глубокой болью в душе, задавая себе вопрос: &quot;Почему никто больше не осмеливается говорить правду? И, конечно же, я имею в виду нас, христиан и наши церкви.&quot;<br/><br/>Из этой боли родился RADIKAL. Даже мое собственное мнение абсолютно бессмысленно для меня, если оно не соответствует на сто процентов Слову Божьему.</>}
          </p>

          {/* Question mark icon for Mehr erfahren */}
          {/* Thinner stroke (light weight) */}
          <div className="mb-8 animate-fadeIn flex justify-center" style={{ animationDelay: '0.4s' }}>
            <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 11C3 7.22876 3 5.34315 4.17157 4.17157C5.34315 3 7.22876 3 11 3H13C16.7712 3 18.6569 3 19.8284 4.17157C21 5.34315 21 7.22876 21 11V13C21 16.7712 21 18.6569 19.8284 19.8284C18.6569 21 16.7712 21 13 21H11C7.22876 21 5.34315 21 4.17157 19.8284C3 18.6569 3 16.7712 3 13V11Z" stroke="currentColor" strokeWidth="0.75" className="text-black dark:text-white"/>
              <path d="M9.23163 9.2148C9.23163 5.59165 14.7684 5.59165 14.7684 9.2148C14.7684 11.8031 12.2525 11.2866 12.2525 14.3913" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" className="text-black dark:text-white"/>
              <path d="M11.975 17.5026L12.025 17.5026" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" className="text-black dark:text-white"/>
            </svg>
          </div>

          {/* Link to About Page */}
          <Link
            href="/about"
            className="inline-flex items-center px-2 py-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white font-semibold text-lg rounded-xl transition-all duration-300 border border-black/20 dark:border-white/20 hover:scale-105 animate-fadeIn"
            style={{ animationDelay: '0.6s' }}
          >
            {language === 'de' ? 'Mehr erfahren' : language === 'en' ? 'Learn More' : language === 'ro' ? 'Află mai mult' : 'Узнать больше'}
          </Link>
        </div>
      </section>

      {/* ========================================================================== */}
      {/* SECTION 3 - BLOGURI / BLOGS */}
      {/* ========================================================================== */}
      <section id="blogs" className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto w-full text-center">
          {/* Section Title */}
          <h2 className="font-cinzel text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white mb-8 animate-fadeIn">
            {language === 'de' ? ' Blogs' : language === 'en' ? ' Blogs' : language === 'ro' ? 'Bloguri' : 'Блоги'}
          </h2>
          
          {/* Description */}
          <p className="text-xl sm:text-2xl text-black/80 dark:text-white/80 leading-relaxed mb-12 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            {language === 'de' 
              ? 'Wir haben verlernt, selbst zu prüfen, und folgen zu oft nur menschlichen Meinungen. Bevor du liest: Schlag deine Bibel auf.'
              : language === 'en'
              ? 'We have unlearned how to examine for ourselves and too often just follow human opinions. Before you read: Open your Bible.'
              : language === 'ro'
              ? 'Am uitat să examinăm singuri și prea des urmăm doar opinii umane. Înainte să citești: Deschide-ți Biblia.'
              : 'Мы забыли, как проверять сами, и слишком часто просто следуем человеческим мнениям. Прежде чем читать: Открой свою Библию.'}
          </p>

          {/* Edit/write icon for Alle Blogs ansehen */}
          {/* Thinner stroke (light weight) */}
          <div className="mb-8 animate-fadeIn flex justify-center" style={{ animationDelay: '0.4s' }}>
            <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.7734 4.42255L8.01924 12.2706C7.79291 12.4996 7.67974 12.6142 7.60917 12.7552C7.53859 12.8961 7.51521 13.0544 7.46845 13.3709L7.30803 14.4566C7.12534 15.693 7.034 16.3112 7.40145 16.6645C7.7689 17.0178 8.39306 16.9118 9.64137 16.6999L10.7375 16.5139C11.0571 16.4596 11.2168 16.4325 11.3579 16.3593C11.499 16.2861 11.6121 16.1715 11.8385 15.9425L19.5927 8.09446C20.2553 7.42379 20.5866 7.08846 20.5814 6.67712C20.5761 6.26578 20.2363 5.93906 19.5566 5.28563L18.6209 4.38599C17.9412 3.73256 17.6014 3.40584 17.1844 3.4112C16.7674 3.41655 16.4361 3.75188 15.7734 4.42255Z" stroke="currentColor" strokeWidth="0.75" className="text-black dark:text-white"/>
              <path d="M18.3329 9.22206L14.7773 5.6665" stroke="currentColor" strokeWidth="0.75" className="text-black dark:text-white"/>
              <path d="M21 21H3" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" className="text-black dark:text-white"/>
            </svg>
          </div>

          {/* Link to Blogs Page */}
          <Link
            href="/blogs"
            className="inline-flex items-center px-2 py-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white font-semibold text-lg rounded-xl transition-all duration-300 border border-black/20 dark:border-white/20 hover:scale-105 animate-fadeIn"
            style={{ animationDelay: '0.6s' }}
          >
            {language === 'de' ? 'Alle Blogs ansehen' : language === 'en' ? 'View All Blogs' : language === 'ro' ? 'Vezi toate blogurile' : 'Посмотреть все блоги'}
          </Link>
        </div>
      </section>

      {/* ========================================================================== */}
      {/* SECTION 4 - CONTACT */}
      {/* ========================================================================== */}
      <section id="contact" className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-20 bg-black/5 dark:bg-white/5">
        <div className="max-w-4xl mx-auto w-full text-center">
          {/* Section Title */}
          <h2 className="font-cinzel text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white mb-8 animate-fadeIn">
            {language === 'de' ? 'Kontakt' : language === 'en' ? 'Contact' : language === 'ro' ? 'Contact' : 'Контакт'}
          </h2>
          
          {/* Description */}
          <p className="text-xl sm:text-2xl text-black/80 dark:text-white/80 leading-relaxed mb-12 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            {language === 'de' 
              ? 'Hast du Fragen? Schreib uns eine Nachricht.'
              : language === 'en'
              ? 'Do you have questions? Send us a message.'
              : language === 'ro'
              ? 'Ai întrebări? Trimite-ne un mesaj.'
              : 'У вас есть вопросы? Отправьте нам сообщение.'}
          </p>

          {/* Mail/contact icon for Kontaktiere uns */}
          {/* Thinner stroke (light weight) */}
          <div className="mb-8 animate-fadeIn flex justify-center" style={{ animationDelay: '0.4s' }}>
            <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12.9998V10.3535C21 9.20576 21 8.6319 20.7237 8.1624C20.4475 7.69289 19.9458 7.41421 18.9426 6.85683L15.8851 5.15826C13.9861 4.10321 13.0365 3.57568 12 3.57568C10.9635 3.57568 10.0139 4.10321 8.11485 5.15826L5.05743 6.85683C4.05415 7.41421 3.55252 7.69289 3.27626 8.1624C3 8.6319 3 9.20576 3 10.3535V12.9998C3 16.7711 3 18.6567 4.17157 19.8283C5.34315 20.9998 7.22876 20.9998 11 20.9998H13C16.7712 20.9998 18.6569 20.9998 19.8284 19.8283C21 18.6567 21 16.7711 21 12.9998Z" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" className="text-black dark:text-white"/>
              <path d="M10.2853 12L4 8M10.2853 12L4 19M10.2853 12C11.3315 12.6658 12.6685 12.6658 13.7146 12M20 8.00001L13.7146 12M13.7146 12L20 19" stroke="currentColor" strokeWidth="0.75" strokeLinecap="square" strokeLinejoin="round" className="text-black dark:text-white"/>
            </svg>
          </div>

          {/* Link to Contact Page */}
          <Link
            href="/contact"
            className="inline-flex items-center px-2 py-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white font-semibold text-lg rounded-xl transition-all duration-300 border border-black/20 dark:border-white/20 hover:scale-105 animate-fadeIn"
            style={{ animationDelay: '0.6s' }}
          >
            {language === 'de' ? 'Kontaktiere uns' : language === 'en' ? 'Contact Us' : language === 'ro' ? 'Contactează-ne' : 'Свяжитесь с нами'}
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
            {language === 'de' 
              ? 'Kaufe die Zeit aus.'
              : language === 'en'
              ? 'Redeem the time.'
              : language === 'ro'
              ? 'Răscumpără vremea.'
              : 'Искупи время.'}
          </h2>
          
          {/* Blessing Message */}
          <p className="text-2xl sm:text-3xl text-black/80 dark:text-white/80 mb-8 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            {language === 'de' 
              ? 'Der Herr segne dich!'
              : language === 'en'
              ? 'May the Lord bless you!'
              : language === 'ro'
              ? 'Domnul să te binecuvânteze!'
              : 'Да благословит тебя Господь!'}
          </p>

          {/* Heart and Cross */}
          <div className="text-6xl sm:text-8xl mb-16 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            ⏱
          </div>

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
