// Welcome Modal Component - Language selection and Bible verse with GSAP cinematic effect
// Willkommen-Modal-Komponente - Sprachauswahl und Bibelvers mit GSAP kinematischem Effekt
// Componentă Modal Bun Venit - Selectare limbă și verset biblic cu efect cinematic GSAP
// This modal appears on first visit or when user is not logged in

'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Bible verses in all 4 languages from BibleQuotes.tsx
const bibleVerses = {
  
  en: 'If the World is at home in the Church, it-s because the Church is at home in the World.',
  de: 'Wenn die Welt in der Gemeinde zu Hause ist, dann nur weil die Gemeinde in der Welt zu Hause ist.',
  ro: 'Dacă lumea este acasă în Biserică, este din cauza căci Biserica este acasă în lume.',
  ru: 'Если мир находится в церкви, то это потому что церковь находится в мире.'
};

const bibleReferences = {
  de: '...',
  en: "...",
  ro: '...',
  ru: '...'
};

const translations = {
  languageSelect: {
    de: 'Sprache Wählen',
    en: 'Choose Language',
    ro: 'Alege Limba',
    ru: 'Выберите язык'
  },
  languageName: {
    de: 'Deutsch',
    en: 'English',
    ro: 'Română',
    ru: 'Русский'
  },
  loginOption: {
    de: 'Anmelden oder Registrieren',
    en: 'Login or Register',
    ro: 'Autentificare sau Înregistrare',
    ru: 'Войти или Зарегистрироваться'
  },
  changeLanguage: {
    de: 'Wählen Sie eine andere Sprache',
    en: 'Choose Another Language',
    ro: 'Selectează o altă limbă',
    ru: 'Выбрать другой язык'
  }
};

interface WelcomeModalProps {
  onComplete: (language: 'de' | 'en' | 'ro' | 'ru', isGuest: boolean) => void;
  // Note: isGuest is kept for backward compatibility but guest option is removed from UI
  // Users must register/login to access RADIKAL
}

export default function WelcomeModal({ onComplete }: WelcomeModalProps) {
  const router = useRouter();
  const supabase = createClient();
  
  // Get theme context / Themenkontext abrufen / Obține contextul temei
  const { theme } = useTheme();
  
  // Modal steps: 'intro' -> 'language' -> 'verse' -> 'options'
  const [step, setStep] = useState<'intro' | 'language' | 'verse' | 'options'>('intro');
  const [selectedLanguage, setSelectedLanguage] = useState<'de' | 'en' | 'ro' | 'ru' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Refs for GSAP animation
  // Refs für GSAP-Animation
  // Refs pentru animația GSAP
  const verseContainerRef = useRef<HTMLDivElement>(null);
  const verseTextRef = useRef<HTMLQuoteElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const citeRef = useRef<HTMLElement>(null);

  // Prevent body scroll when modal is open and hide Navigation/Footer
  // Verhindern von Body-Scroll wenn Modal geöffnet ist und Navigation/Footer verstecken
  // Previne derularea body-ului când modalul este deschis și ascunde Navigarea/Footerul
  useLayoutEffect(() => {
    // Add modal-open and modal-active classes - hides nav and footer completely
    // Uses useLayoutEffect to apply BEFORE browser paint - prevents flash
    document.body.classList.add('modal-open', 'modal-active');
    document.documentElement.classList.add('modal-open');
    
    // Completely lock the body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.classList.remove('modal-open', 'modal-active');
      document.documentElement.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [supabase.auth]);

  // Intro - show logo, then move to language selection after 2.5 seconds
  // Intro - Logo zeigen, dann nach 2,5 Sekunden zur Sprachauswahl wechseln
  // Intro - arată logo, apoi treci la selectarea limbii după 2,5 secunde
  useEffect(() => {
    if (step !== 'intro') return;
    
    // Wait 2.5 seconds, then move to language selection
    const timeout = setTimeout(() => {
      setStep('language');
    }, 2500);

    return () => clearTimeout(timeout);
  }, [step]);

  // Handle language selection - go directly to verse step without delay
  const handleLanguageSelection = (lang: 'de' | 'en' | 'ro' | 'ru') => {
    setSelectedLanguage(lang);
    
    // Save language based on authentication status
    if (isAuthenticated) {
      // For authenticated users, save in localStorage (persistent)
      localStorage.setItem('radikalSelectedLanguage', lang);
    } else {
      // For guests, save in sessionStorage (session-only)
      sessionStorage.setItem('radikalGuestLanguage', lang);
    }
    
    // Go directly to verse step without delay
    setStep('verse');
  };

  // GSAP Animation for Bible verse - word by word reveal like someone speaking
  // GSAP-Animation für Bibelvers - Wort für Wort Enthüllung wie jemand spricht
  // Animație GSAP pentru verset biblic - cuvânt cu cuvânt ca și cum cineva vorbește
  useGSAP(() => {
    if (step !== 'verse' || !selectedLanguage || !citeRef.current) return;
    
    const words = wordsRef.current.filter(Boolean);
    if (words.length === 0) return;

    // Set initial state for each word - hidden with blur and offset
    // Words start slightly to the left for smooth left-to-right reveal
    gsap.set(words, {
      opacity: 0,
      filter: 'blur(10px)',
      y: 8,
      x: -15 // Start from left for flowing reveal
    });
    gsap.set(citeRef.current, {
      opacity: 0,
      y: 15,
      x: -10
    });

    // Create timeline with smooth word-by-word reveal - flowing text animation
    // Literele curg frumos ca apa - fluid text reveal animation
    const tl = gsap.timeline({
      onComplete: () => {
        setStep('options');
      }
    });

    // Phase 1: Words appear one by one with smooth flowing effect (left to right)
    // Each word slides in gently with a soft blur transition
    tl.to(words, {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      x: 0,
      duration: 0.8,
      stagger: {
        each: 0.18, // Slightly faster stagger for flowing effect
        ease: "power1.inOut"
      },
      ease: "power2.out"
    })
    // Show cite after words appear with elegant fade
    .to(citeRef.current, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: "power2.out"
    }, "-=0.8")
    // Phase 2: Reading pause (3.5 seconds for comfortable reading)
    .to({}, { duration: 3.5 })
    // Phase 3: Words disappear from RIGHT TO LEFT (reverse stagger)
    // First hide the cite
    .to(citeRef.current, {
      opacity: 0,
      filter: 'blur(8px)',
      x: 20,
      duration: 0.6,
      ease: "power2.in"
    })
    // Words disappear from right to left with smooth blur
    .to([...words].reverse(), {
      opacity: 0,
      filter: 'blur(12px)',
      x: 30, // Slide to the right as they disappear
      duration: 0.4,
      stagger: {
        each: 0.06, // Fast stagger for elegant disappear
        ease: "power1.in"
      },
      ease: "power2.in"
    }, "-=0.3");

  }, { scope: verseContainerRef, dependencies: [step, selectedLanguage] });

  // Theme-aware colors / Themenabhängige Farben / Culori adaptate la temă
  const bgColor = theme === 'dark' ? '#000000' : '#ffffff';
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const textMuted = theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const textLight = theme === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';
  const textVeryLight = theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const textExtraLight = theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  const textSemiTransparent = theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
  const bgTransparent = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const bgTransparentMedium = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const borderColor = theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const borderColorLight = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const borderColorMedium = theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';

  // Handle login option
  const handleLogin = () => {
    if (selectedLanguage) {
      // Save language preference in localStorage for when they return after login
      localStorage.setItem('radikalSelectedLanguage', selectedLanguage);
      // IMPORTANT: Do NOT remove modal-active here!
      // Keep modal-active on body so nav/footer stay hidden during the transition to login page
      // The login page will manage modal-active itself
      // Only clean up modal-open and body styles
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.documentElement.style.overflow = '';
      // Redirect to login page
      router.push('/auth/login');
    }
  };



  return (
    <div 
      className="fixed z-[9999] overflow-hidden" 
      style={{ 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        width: '100vw',
        height: '100vh', 
        backgroundColor: bgColor, 
        color: textColor 
      }}
    >
      <div className="absolute inset-0 z-10 w-full h-full flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-5xl mx-auto px-4 h-full flex flex-col overflow-hidden">
        
        {/* Intro - Logo that changes based on theme */}
        {/* Intro - Logo das sich je nach Theme ändert */}
        {/* Intro - Logo care se schimbă în funcție de temă */}
        {step === 'intro' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fadeIn">
              {/* Logo that switches based on theme */}
              {/* Dark Mode: white background logo / Light Mode: black background logo */}
              <Image
                src={theme === 'dark' ? '/radikal.logo.weiß.hintergrund.png' : '/radikal.logo.schwarz.hintergrund.png'}
                alt="Radikal Logo"
                width={400}
                height={400}
                className="mx-auto rounded-sm"
                priority
              />
            </div>
          </div>
        )}
        
        {/* Language Selection */}
        {/* Desktop: Grid 2x2 or 4 columns / Mobile: Vertical column with squares */}
        {/* Desktop: Grid 2x2 oder 4 Spalten / Mobil: Vertikale Spalte mit Quadraten */}
        {/* Desktop: Grid 2x2 sau 4 coloane / Mobil: Coloană verticală cu pătrate */}
        {step === 'language' && (
          <div className="flex-1 flex items-stretch justify-center py-6 sm:py-4 sm:items-center">
            {/* Desktop: Original grid layout */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 animate-fadeIn w-full max-w-lg lg:max-w-none">
              {/* German Button */}
              <button
                onClick={() => handleLanguageSelection('de')}
                className="group relative overflow-hidden rounded-xl p-4 sm:p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{ backgroundColor: bgTransparent, borderWidth: '1px', borderStyle: 'solid', borderColor: borderColor }}
              >
                <div className="text-center">
                  <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">DE</div>
                  <div className="text-xs sm:text-sm mb-1 sm:mb-3 transition-colors" style={{ color: textMuted }}>
                    {translations.languageSelect.de}
                  </div>
                  <div className="text-lg sm:text-2xl font-bold transition-colors" style={{ color: textColor }}>
                    {translations.languageName.de}
                  </div>
                </div>
              </button>

              {/* English Button */}
              <button
                onClick={() => handleLanguageSelection('en')}
                className="group relative overflow-hidden rounded-xl p-4 sm:p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{ backgroundColor: bgTransparent, borderWidth: '1px', borderStyle: 'solid', borderColor: borderColor }}
              >
                <div className="text-center">
                  <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">EN</div>
                  <div className="text-xs sm:text-sm mb-1 sm:mb-3 transition-colors" style={{ color: textMuted }}>
                    {translations.languageSelect.en}
                  </div>
                  <div className="text-lg sm:text-2xl font-bold transition-colors" style={{ color: textColor }}>
                    {translations.languageName.en}
                  </div>
                </div>
              </button>

              {/* Romanian Button */}
              <button
                onClick={() => handleLanguageSelection('ro')}
                className="group relative overflow-hidden rounded-xl p-4 sm:p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{ backgroundColor: bgTransparent, borderWidth: '1px', borderStyle: 'solid', borderColor: borderColor }}
              >
                <div className="text-center">
                  <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">RO</div>
                  <div className="text-xs sm:text-sm mb-1 sm:mb-3 transition-colors" style={{ color: textMuted }}>
                    {translations.languageSelect.ro}
                  </div>
                  <div className="text-lg sm:text-2xl font-bold transition-colors" style={{ color: textColor }}>
                    {translations.languageName.ro}
                  </div>
                </div>
              </button>

              {/* Russian Button */}
              <button
                onClick={() => handleLanguageSelection('ru')}
                className="group relative overflow-hidden rounded-xl p-4 sm:p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{ backgroundColor: bgTransparent, borderWidth: '1px', borderStyle: 'solid', borderColor: borderColor }}
              >
                <div className="text-center">
                  <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">RU</div>
                  <div className="text-xs sm:text-sm mb-1 sm:mb-3 transition-colors" style={{ color: textMuted }}>
                    {translations.languageSelect.ru}
                  </div>
                  <div className="text-lg sm:text-2xl font-bold transition-colors" style={{ color: textColor }}>
                    {translations.languageName.ru}
                  </div>
                </div>
              </button>
            </div>

            {/* Mobile: Vertical column with auto-adaptive buttons */}
            <div className="sm:hidden flex flex-col gap-3 animate-fadeIn w-full max-w-[280px] px-4">
              {/* German Button */}
              <button
                onClick={() => handleLanguageSelection('de')}
                className="group relative overflow-hidden rounded-xl flex-1 px-5 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{ backgroundColor: bgTransparent, borderWidth: '1px', borderStyle: 'solid', borderColor: borderColor }}
              >
                <div className="text-center h-full flex flex-col justify-center">
                  <div className="text-4xl mb-1.5">DE</div>
                  <div className="text-sm mb-1 transition-colors" style={{ color: textMuted }}>
                    {translations.languageSelect.de}
                  </div>
                  <div className="text-lg font-bold transition-colors" style={{ color: textColor }}>
                    {translations.languageName.de}
                  </div>
                </div>
              </button>

              {/* English Button */}
              <button
                onClick={() => handleLanguageSelection('en')}
                className="group relative overflow-hidden rounded-xl flex-1 px-5 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{ backgroundColor: bgTransparent, borderWidth: '1px', borderStyle: 'solid', borderColor: borderColor }}
              >
                <div className="text-center h-full flex flex-col justify-center">
                  <div className="text-4xl mb-1.5">EN</div>
                  <div className="text-sm mb-1 transition-colors" style={{ color: textMuted }}>
                    {translations.languageSelect.en}
                  </div>
                  <div className="text-lg font-bold transition-colors" style={{ color: textColor }}>
                    {translations.languageName.en}
                  </div>
                </div>
              </button>

              {/* Romanian Button */}
              <button
                onClick={() => handleLanguageSelection('ro')}
                className="group relative overflow-hidden rounded-xl flex-1 px-5 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{ backgroundColor: bgTransparent, borderWidth: '1px', borderStyle: 'solid', borderColor: borderColor }}
              >
                <div className="text-center h-full flex flex-col justify-center">
                  <div className="text-4xl mb-1.5">RO</div>
                  <div className="text-sm mb-1 transition-colors" style={{ color: textMuted }}>
                    {translations.languageSelect.ro}
                  </div>
                  <div className="text-lg font-bold transition-colors" style={{ color: textColor }}>
                    {translations.languageName.ro}
                  </div>
                </div>
              </button>

              {/* Russian Button */}
              <button
                onClick={() => handleLanguageSelection('ru')}
                className="group relative overflow-hidden rounded-xl flex-1 px-5 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{ backgroundColor: bgTransparent, borderWidth: '1px', borderStyle: 'solid', borderColor: borderColor }}
              >
                <div className="text-center h-full flex flex-col justify-center">
                  <div className="text-4xl mb-1.5">RU</div>
                  <div className="text-sm mb-1 transition-colors" style={{ color: textMuted }}>
                    {translations.languageSelect.ru}
                  </div>
                  <div className="text-lg font-bold transition-colors" style={{ color: textColor }}>
                    {translations.languageName.ru}
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Bible Verse with GSAP Cinematic ClipPath Animation (like insurrection.photo) */}
        {/* Bibelvers mit GSAP kinematischer ClipPath Animation */}
        {/* Verset biblic cu animație GSAP cinematică ClipPath */}
        {step === 'verse' && selectedLanguage && (
          <div className="flex-1 flex items-center justify-center" ref={verseContainerRef}>
            <div className="text-center max-w-4xl mx-auto px-6 relative">
              {/* Exclamation mark - appears first */}
              <div className="text-6xl mb-12 welcome-fade-in" style={{ color: textColor }}>!</div>
              
              {/* Bible verse with GSAP word-by-word animation - like someone speaking */}
              <blockquote 
                ref={verseTextRef}
                className="font-cinzel text-2xl md:text-3xl lg:text-4xl xl:text-5xl italic leading-relaxed mb-8 min-h-[180px] flex items-center justify-center px-4 flex-wrap"
                style={{ 
                  color: textColor,
                  textShadow: '0 0 20px rgba(255,255,255,0.15)'
                }}
              >
                <span className="inline tracking-wider">&quot;</span>
                {bibleVerses[selectedLanguage].split(' ').map((word, index) => (
                  <span
                    key={index}
                    ref={(el) => { wordsRef.current[index] = el; }}
                    className="inline-block mx-1 tracking-wider"
                    style={{ opacity: 0 }}
                  >
                    {word}
                  </span>
                ))}
                <span className="inline tracking-wider">&quot;</span>
              </blockquote>

              {/* Bible reference - animated with GSAP */}
              <cite 
                ref={citeRef}
                className="block font-cinzel text-xl md:text-2xl lg:text-3xl font-medium mt-6"
                style={{ 
                  color: textLight,
                  opacity: 0,
                  transform: 'translateY(20px)'
                }}
              >
                — {bibleReferences[selectedLanguage]}
              </cite>
            </div>
          </div>
        )}

        {/* CSS Animations for Welcome Modal - only for fade-in effects */}
        {/* CSS-Animationen für Welcome Modal - nur für Fade-In-Effekte */}
        {/* Animații CSS pentru Welcome Modal - doar pentru efecte fade-in */}
        <style jsx>{`
          .welcome-fade-in {
            animation: welcomeFadeIn 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
          
          @keyframes welcomeFadeIn {
            0% { 
              opacity: 0; 
              transform: scale(0.5) rotate(-5deg);
              filter: blur(20px);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.1) rotate(2deg);
              filter: blur(5px);
            }
            100% { 
              opacity: 1; 
              transform: scale(1) rotate(0deg);
              filter: blur(0px);
            }
          }
        `}</style>

        {/* Login or Continue Options */}
        {step === 'options' && selectedLanguage && (
          <>
            {/* Main content - centered vertically */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-6 animate-fadeIn py-8">
                {/* Login/Register Button */}
                <button
                  onClick={handleLogin}
                  className="group w-full max-w-md rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-sm"
                  style={{ backgroundColor: bgTransparentMedium, borderWidth: '2px', borderStyle: 'solid', borderColor: borderColorMedium }}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3" style={{ color: textColor }}>⌘</div>
                    <div className="text-xl md:text-2xl font-bold transition-colors" style={{ color: textColor }}>
                      {translations.loginOption[selectedLanguage]}
                    </div>
                  </div>
                </button>

                {/* Change Language Button */}
                <button
                  onClick={() => {
                    setStep('language');
                    setSelectedLanguage(null);
                  }}
                  className="group w-full max-w-md rounded-xl p-4 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                  style={{ backgroundColor: bgTransparent, borderWidth: '1px', borderStyle: 'solid', borderColor: borderColorLight }}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2" style={{ color: textColor }}>↻</div>
                    <div className="text-sm md:text-base font-medium transition-colors" style={{ color: textSemiTransparent }}>
                      {translations.changeLanguage[selectedLanguage]}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer - fixed at bottom of viewport */}
            <div className="w-full pb-6 px-4">
              <div className="max-w-md mx-auto pt-6 backdrop-blur-sm" style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: borderColorLight }}>
                <p className="text-center text-xs" style={{ color: textVeryLight }}>
                  {selectedLanguage === 'de' ? '© 2025 RADIKAL. Alle Rechte vorbehalten.' : 
                   selectedLanguage === 'en' ? '© 2025 RADIKAL. All rights reserved.' : 
                   selectedLanguage === 'ro' ? '© 2025 RADIKAL. Toate drepturile rezervate.' : 
                   '© 2025 RADIKAL. Все права защищены.'}
                </p>
                <p className="text-center text-xs mt-1" style={{ color: textExtraLight }}>
                  {selectedLanguage === 'de' ? 'Entwickelt mit ♥ und Next.js' : 
                   selectedLanguage === 'en' ? 'Built with ♥ and Next.js' : 
                   selectedLanguage === 'ro' ? 'Construit cu ♥ și Next.js' : 
                   'Создано с ♥ и Next.js'}
                </p>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}