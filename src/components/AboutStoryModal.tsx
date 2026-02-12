// AboutStoryModal - Interactive cinematic storytelling about "radikal"
// Features: full background image with blur/sepia, GSAP clipPath text animations
// dust particles, film grain, tutorial, countdown

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { getStoryPhrases } from '@/data/storyPhrases';

interface AboutStoryModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

type LanguageKey = 'de' | 'en' | 'ro' | 'ru';

// Complete Story Content with multilingual support
const storyContent = {
  introTitle: { de: 'RADIKALITÄT', en: 'RADICALITY', ro: 'RADICALITATE', ru: 'РАДИКАЛЬНОСТЬ' },
  introSubtitle: { de: 'Die Essenz der Wurzel', en: 'The Essence of the Root', ro: 'Esența Rădăcinii', ru: 'Сущность Корня' },
  skipInfoMobile: { de: 'Zum Überspringen tippen Sie auf ÜBERSPRINGEN', en: 'Tap SKIP to skip', ro: 'Atingeți SARI PESTE pentru a sări', ru: 'Нажмите ПРОПУСТИТЬ для пропуска' },
  skipInfoDesktop: { de: 'Zum Überspringen drücken Sie ESC oder klicken Sie auf ÜBERSPRINGEN', en: 'Press ESC or click SKIP to skip', ro: 'Apăsați ESC sau click pe SARI PESTE pentru a sări', ru: 'Нажмите ESC или кликните ПРОПУСТИТЬ для пропуска' },
  readingTime: { de: 'Geschätzte Lesezeit: 15-20 Minuten', en: 'Estimated reading time: 15-20 minutes', ro: 'Timp estimat de citire: 15-20 minute', ru: 'Примерное время чтения: 15-20 минут' },
  skipButton: { de: 'ÜBERSPRINGEN', en: 'SKIP', ro: 'SARI PESTE', ru: 'ПРОПУСТИТЬ' },
  startingIn: { de: 'Beginnt in', en: 'Starting in', ro: 'Începe în', ru: 'Начало через' },
  tutorial: {
    tap: { de: 'TIPPEN', en: 'TAP', ro: 'APASĂ', ru: 'НАЖМИ' },
    tapDesc: { de: 'Tippen zum Pausieren/Fortsetzen', en: 'Tap anywhere to pause/play', ro: 'Apasă oriunde pentru pauză/redare', ru: 'Нажмите для паузы/воспроизведения' },
    swipe: { de: 'WISCHEN', en: 'SWIPE', ro: 'GLISEAZĂ', ru: 'СВАЙП' },
    swipeDesc: { de: 'Nach links oder rechts wischen zum Navigieren', en: 'Swipe left or right to navigate', ro: 'Glisează stânga sau dreapta pentru navigare', ru: 'Свайп влево или вправо для навигации' },
    space: { de: 'LEERTASTE', en: 'SPACE', ro: 'SPAȚIU', ru: 'ПРОБЕЛ' },
    spaceDesc: { de: 'Drücken zum Pausieren oder Fortsetzen', en: 'Press to pause or play', ro: 'Apasă pentru pauză sau redare', ru: 'Нажмите для паузы или воспроизведения' },
    arrows: { de: 'PFEILE', en: 'ARROWS', ro: 'SĂGEȚI', ru: 'СТРЕЛКИ' },
    arrowsDesc: { de: 'Zwischen Szenen navigieren', en: 'Navigate between scenes', ro: 'Navighează între scene', ru: 'Навигация между сценами' },
    fullscreen: { de: 'VOLLBILD', en: 'FULLSCREEN', ro: 'ECRAN COMPLET', ru: 'ПОЛНЫЙ ЭКРАН' },
    fullscreenDesc: { de: 'F drücken für Vollbildmodus', en: 'Press F for fullscreen mode', ro: 'Apasă F pentru ecran complet', ru: 'Нажмите F для полноэкранного режима' },
    start: { de: 'BEGINNEN', en: 'BEGIN', ro: 'ÎNCEPE', ru: 'НАЧАТЬ' },
    tapToContinue: { de: 'TIPPEN ZUM FORTFAHREN', en: 'TAP TO CONTINUE', ro: 'APASĂ PENTRU A CONTINUA', ru: 'НАЖМИТЕ ДЛЯ ПРОДОЛЖЕНИЯ' },
    pressAnyKey: { de: 'BELIEBIGE TASTE DRÜCKEN', en: 'PRESS ANY KEY', ro: 'APASĂ ORICE TASTĂ', ru: 'НАЖМИТЕ ЛЮБУЮ КЛАВИШУ' }
  },
  paused: { de: 'PAUSIERT', en: 'PAUSED', ro: 'PAUZĂ', ru: 'ПАУЗА' },
  muteSound: { de: 'MUTE SOUND', en: 'MUTE SOUND', ro: 'MUTE SOUND', ru: 'MUTE SOUND' },
  soundOn: { de: 'SOUND', en: 'SOUND', ro: 'SOUND', ru: 'SOUND' },
  headphones: { de: 'FÜR DAS BESTE ERLEBNIS KOPFHÖRER BENUTZEN', en: 'USE HEADPHONES FOR THE BEST EXPERIENCE', ro: 'FOLOSIȚI CĂȘTILE PENTRU CEA MAI BUNĂ EXPERIENȚĂ', ru: 'ИСПОЛЬЗУЙТЕ НАУШНИКИ ДЛЯ ЛУЧШЕГО ВПЕЧАТЛЕНИЯ' },
  headphonesMuteHint: { de: 'Oben links kannst du den Sound ein- oder ausschalten', en: 'You can mute or unmute the sound in the top left corner', ro: 'Poți opri sau porni sunetul din butonul din stânga sus', ru: 'Вы можете включить или выключить звук кнопкой слева вверху' },
  theEnd: { de: 'ENDE', en: 'THE END', ro: 'SFÂRȘIT', ru: 'КОНЕЦ' },
  experienceAgain: { de: 'ERNEUT ERLEBEN', en: 'EXPERIENCE AGAIN', ro: 'RETRĂIEȘTE', ru: 'ПЕРЕЖИТЬ СНОВА' },
  share: { de: 'TEILEN', en: 'SHARE', ro: 'DISTRIBUIE', ru: 'ПОДЕЛИТЬСЯ' },
  continueToAbout: { de: 'WEITER ZUR SEITE', en: 'CONTINUE TO PAGE', ro: 'CONTINUĂ LA PAGINĂ', ru: 'ПЕРЕЙТИ НА СТРАНИЦУ' },
  redirecting: { de: 'Weiterleitung in', en: 'Redirecting in', ro: 'Redirecționare în', ru: 'Перенаправление через' },
  seconds: { de: 'Sekunden', en: 'seconds', ro: 'secunde', ru: 'секунд' }
};

// Story phrases are now imported from @/data/storyPhrases
// Complete translations: DE (Schlachter 2000), EN (KJV), RO (Cornilescu), RU (Synodal)

export default function AboutStoryModal({ onComplete, onSkip }: AboutStoryModalProps) {
  const container = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  
  const { language } = useLanguage();
  const { theme } = useTheme();
  const lang = (language || 'de') as LanguageKey;
  const isDark = theme === 'dark';
  
  // States
  const [currentScreen, setCurrentScreen] = useState<'intro' | 'tutorial' | 'story' | 'end'>('intro');
  const [introCountdown, setIntroCountdown] = useState(10);
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastTap = useRef(0);
  const phraseRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const phraseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  const phrases = getStoryPhrases(lang);

  // 🎵 Smart text splitting: split long phrases that would overflow the viewport
  // Intelligente Textaufteilung: lange Phrasen aufteilen, die den Viewport überlaufen würden
  // Împărțire inteligentă a textului: împarte frazele lungi care ar depăși viewport-ul
  const splitPhrases = React.useMemo(() => {
    // Max characters per screen based on viewport (mobile gets less)
    // Approximate: each word ~6 chars, mobile fits ~25-30 words, desktop ~50 words
    const maxMainChars = isMobile ? 160 : 280;
    const maxSubChars = isMobile ? 100 : 180;
    
    const result: { main: string; sub: string | null }[] = [];
    
    for (const phrase of phrases) {
      const mainLen = phrase.main.length;
      const subLen = phrase.sub?.length || 0;
      const totalLen = mainLen + subLen;
      
      // If phrase fits comfortably, keep as-is
      if (totalLen <= maxMainChars + maxSubChars && mainLen <= maxMainChars * 1.3) {
        result.push(phrase);
        continue;
      }
      
      // Split long main text at sentence boundaries
      if (mainLen > maxMainChars) {
        const sentences = phrase.main.match(/[^.!?;:]+[.!?;:]+\s*/g) || [phrase.main];
        
        let currentChunk = '';
        let isFirstChunk = true;
        
        for (let i = 0; i < sentences.length; i++) {
          const sentence = sentences[i].trim();
          
          if (currentChunk.length + sentence.length + 1 > maxMainChars && currentChunk.length > 0) {
            // Push current chunk
            result.push({ main: currentChunk.trim(), sub: null });
            currentChunk = sentence;
            isFirstChunk = false;
          } else {
            currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
          }
        }
        
        // Push remaining text with sub if it's the last chunk
        if (currentChunk.trim()) {
          result.push({ main: currentChunk.trim(), sub: phrase.sub });
        }
      } else {
        // Main fits but sub is too long — split sub into separate screens
        result.push({ main: phrase.main, sub: null });
        if (phrase.sub) {
          result.push({ main: phrase.sub, sub: null });
        }
      }
    }
    
    return result;
  }, [phrases, isMobile]);

  // 🎵 Background music - starts when story begins, stops on end/skip
  // Hintergrundmusik - startet wenn Geschichte beginnt, stoppt bei Ende/Überspringen
  // Muzica de fundal - începe când povestea începe, se oprește la final/omitere
  useEffect(() => {
    if (currentScreen === 'story' && !bgMusicRef.current) {
      const audio = new Audio('/fundal.mp3');
      audio.loop = true;
      audio.volume = 0.3;
      bgMusicRef.current = audio;
      audio.play().catch(err => console.log('[BGMusic] Autoplay blocked:', err));
    }
    
    // Music continues during pause (user reads while listening)
    // Only stop on end screen
    if (bgMusicRef.current) {
      if (showEndScreen) {
        bgMusicRef.current.pause();
      } else if (currentScreen === 'story') {
        bgMusicRef.current.play().catch(() => {});
      }
    }
    
    // Stop music on end screen or leaving story
    if (currentScreen !== 'story' && currentScreen !== 'intro' && currentScreen !== 'tutorial') {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.currentTime = 0;
      }
    }
  }, [currentScreen, isPaused, showEndScreen]);

  // Sync mute state with audio
  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Cleanup music on unmount
  useEffect(() => {
    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current = null;
      }
    };
  }, []);

  // Text color based on theme
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const textColorMuted = isDark ? 'text-gray-300' : 'text-gray-700';
  const textColorSubtle = isDark ? 'text-gray-400' : 'text-gray-600';
  const bgColor = isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100';

  // Tutorial steps
  const tutorialSteps = isMobile ? [
    { icon: 'tap', title: storyContent.tutorial.tap[lang], desc: storyContent.tutorial.tapDesc[lang] },
    { icon: 'swipe', title: storyContent.tutorial.swipe[lang], desc: storyContent.tutorial.swipeDesc[lang] },
    { icon: 'headphones', title: '🎧', desc: storyContent.headphones[lang], descExtra: storyContent.headphonesMuteHint[lang] },
    { icon: 'start', title: storyContent.tutorial.start[lang], desc: storyContent.tutorial.tapToContinue[lang] }
  ] : [
    { icon: 'space', title: storyContent.tutorial.space[lang], desc: storyContent.tutorial.spaceDesc[lang] },
    { icon: 'arrows', title: storyContent.tutorial.arrows[lang], desc: storyContent.tutorial.arrowsDesc[lang] },
    { icon: 'fullscreen', title: storyContent.tutorial.fullscreen[lang], desc: storyContent.tutorial.fullscreenDesc[lang] },
    { icon: 'headphones', title: '🎧', desc: storyContent.headphones[lang], descExtra: storyContent.headphonesMuteHint[lang] },
    { icon: 'start', title: storyContent.tutorial.start[lang], desc: storyContent.tutorial.pressAnyKey[lang] }
  ];

  // Hide footer and navigation when modal is open
  // Footer und Navigation ausblenden wenn Modal geöffnet ist
  // Ascunde footer-ul și navigația când modalul este deschis
  useEffect(() => {
    const footer = document.querySelector('footer');
    const nav = document.querySelector('nav');
    const mobileNavs = document.querySelectorAll('[data-mobile-nav]');
    if (footer) (footer as HTMLElement).style.display = 'none';
    if (nav) (nav as HTMLElement).style.display = 'none';
    mobileNavs.forEach(el => (el as HTMLElement).style.display = 'none');
    
    // Completely lock the body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      if (footer) (footer as HTMLElement).style.display = '';
      if (nav) (nav as HTMLElement).style.display = '';
      mobileNavs.forEach(el => (el as HTMLElement).style.display = '');
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Preloader
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Intro countdown (from 8 to 0)
  useEffect(() => {
    if (currentScreen === 'intro' && !isLoading && introCountdown > 0) {
      const timer = setTimeout(() => setIntroCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (currentScreen === 'intro' && introCountdown === 0) {
      setCurrentScreen('tutorial');
    }
  }, [currentScreen, isLoading, introCountdown]);

  // Advance tutorial
  const advanceTutorial = useCallback(() => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(prev => prev + 1);
    } else {
      setCurrentScreen('story');
    }
  }, [tutorialStep, tutorialSteps.length]);

  // Skip to next phrase
  const skipToNext = useCallback(() => {
    setCurrentPhrase(prev => {
      const next = prev + 1;
      if (next >= splitPhrases.length) {
        setShowEndScreen(true);
        setIsPaused(true);
        return prev;
      }
      return next;
    });
  }, [splitPhrases.length]);

  // Skip to previous phrase
  const skipToPrevious = useCallback(() => {
    setCurrentPhrase(prev => Math.max(prev - 1, 0));
  }, []);

  // Toggle pause
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      container.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Restart
  const restart = useCallback(() => {
    setShowEndScreen(false);
    setCurrentScreen('intro');
    setIntroCountdown(10);
    setCurrentPhrase(0);
    setProgress(0);
    setRedirectCountdown(5);
    setIsPaused(false);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        onSkip();
        return;
      }
      if (currentScreen === 'intro') {
        setCurrentScreen('tutorial');
        return;
      }
      if (currentScreen === 'tutorial') {
        advanceTutorial();
        return;
      }
      if (showEndScreen) {
        if (e.code === 'Enter' || e.code === 'Space') {
          onComplete();
        }
        return;
      }
      if (currentScreen === 'story') {
        if (e.code === 'Space') {
          e.preventDefault();
          togglePause();
        } else if (e.code === 'ArrowRight') {
          skipToNext();
        } else if (e.code === 'ArrowLeft') {
          skipToPrevious();
        } else if (e.code === 'KeyF') {
          toggleFullscreen();
        } else if (e.code === 'KeyR') {
          restart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, showEndScreen, advanceTutorial, togglePause, skipToNext, skipToPrevious, toggleFullscreen, restart, onSkip, onComplete]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (currentScreen === 'intro') {
      setCurrentScreen('tutorial');
      return;
    }
    if (currentScreen === 'tutorial') {
      advanceTutorial();
      return;
    }
    if (currentScreen !== 'story') return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX.current;
    const diffY = touchEndY - touchStartY.current;
    const threshold = 50;

    if (Math.abs(diffX) > threshold && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        skipToPrevious();
      } else {
        skipToNext();
      }
    } else if (Math.abs(diffX) < 20 && Math.abs(diffY) < 20) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        onSkip();
      } else {
        togglePause();
      }
      lastTap.current = now;
    }
  }, [currentScreen, advanceTutorial, skipToNext, skipToPrevious, togglePause, onSkip]);

  // Mouse parallax effect - throttled to reduce re-renders
  useEffect(() => {
    if (prefersReducedMotion || isMobile) return;
    let lastUpdate = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      // Only update every 100ms to reduce re-renders
      if (now - lastUpdate < 100) return;
      lastUpdate = now;
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [prefersReducedMotion, isMobile]);

  // Redirect countdown on end screen
  useEffect(() => {
    if (showEndScreen && redirectCountdown > 0) {
      const timer = setTimeout(() => setRedirectCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showEndScreen && redirectCountdown === 0) {
      onComplete();
    }
  }, [showEndScreen, redirectCountdown, onComplete]);

  // Dust particles removed for better performance - using CSS instead
  // Film grain removed for better performance - saves ~800MB memory

  // GSAP word-by-word animation - insurrection.photo style
  // Each word fades in with stagger, holds, then fades out in reverse
  useEffect(() => {
    if (currentScreen !== 'story' || isLoading || showEndScreen) return;

    const phraseEl = phraseRef.current;
    if (!phraseEl) return;

    // Get all word spans
    const mainWords = phraseEl.querySelectorAll('.word-main');
    const subWords = phraseEl.querySelectorAll('.word-sub');
    const allWords = [...Array.from(mainWords), ...Array.from(subWords)];

    if (allWords.length === 0) return;

    // Kill any existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    // Set initial state - all words invisible
    gsap.set(allWords, { opacity: 0, y: 15, filter: 'blur(8px)' });
    if (subWords.length > 0) {
      gsap.set(subWords, { opacity: 0, y: 12, filter: 'blur(6px)' });
    }

    const tl = gsap.timeline({ paused: false });
    timelineRef.current = tl;

    // Calculate stagger timing
    const wordCount = mainWords.length;
    const revealPerWord = prefersReducedMotion ? 0.03 : Math.min(0.12, 2.0 / Math.max(wordCount, 1));
    const totalRevealTime = wordCount * revealPerWord;
    // Dynamic hold time based on word count: short titles (≤5 words) = 2.5s, long phrases = up to 5s
    const holdTime = prefersReducedMotion ? 1.5 : Math.min(5, Math.max(2.5, wordCount * 0.25));

    // --- PHASE 1: Words appear one by one (like someone typing/writing) ---
    tl.to(mainWords, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.6,
      stagger: {
        each: revealPerWord,
        ease: 'power2.out'
      },
      ease: 'power2.out'
    }, 0);

    // Sub text appears after main, slightly delayed
    if (subWords.length > 0) {
      tl.to(subWords, {
        opacity: 0.65,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.8,
        stagger: {
          each: 0.06,
          ease: 'power2.out'
        },
        ease: 'power2.out'
      }, totalRevealTime + 0.3);
    }

    // --- PHASE 2: Hold (time to read) ---
    const holdStart = totalRevealTime + (subWords.length > 0 ? 1.2 : 0.6);
    
    // --- PHASE 3: Words disappear in REVERSE order (like backspace) ---
    const disappearStart = holdStart + holdTime;
    
    // Sub text fades out first (reverse stagger)
    if (subWords.length > 0) {
      tl.to(subWords, {
        opacity: 0,
        y: -10,
        filter: 'blur(6px)',
        duration: 0.5,
        stagger: {
          each: 0.04,
          from: 'end',
          ease: 'power1.in'
        },
        ease: 'power2.in'
      }, disappearStart);
    }

    // Main words fade out in reverse (last word first, like backspace)
    tl.to(mainWords, {
      opacity: 0,
      y: -12,
      filter: 'blur(8px)',
      duration: 0.5,
      stagger: {
        each: Math.min(0.08, 1.5 / Math.max(wordCount, 1)),
        from: 'end',
        ease: 'power1.in'
      },
      ease: 'power2.in'
    }, disappearStart + (subWords.length > 0 ? 0.3 : 0));

    // Calculate total timeline duration
    const totalDuration = tl.duration();
    
    // Advance to next phrase after timeline completes
    const onComplete = () => {
      setCurrentPhrase(prev => {
        const next = prev + 1;
        if (next >= splitPhrases.length) {
          setShowEndScreen(true);
          setIsPaused(true);
          return prev;
        }
        return next;
      });
    };

    tl.call(onComplete, [], totalDuration + 0.2);

    // Progress tracking - smooth, driven by timeline position
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
    progressTimerRef.current = setInterval(() => {
      if (timelineRef.current && !isPaused) {
        const elapsed = timelineRef.current.time();
        const dur = timelineRef.current.duration();
        const phraseProgress = dur > 0 ? elapsed / dur : 0;
        const overallProgress = ((currentPhrase + phraseProgress) / splitPhrases.length) * 100;
        setProgress(Math.min(overallProgress, 100));
      }
    }, 200);

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [currentScreen, isLoading, currentPhrase, showEndScreen, splitPhrases.length, prefersReducedMotion]);

  // Pause/resume GSAP timeline
  useEffect(() => {
    if (timelineRef.current) {
      if (isPaused) {
        timelineRef.current.pause();
      } else {
        timelineRef.current.resume();
      }
    }
  }, [isPaused]);

  // Animate light glow with GSAP
  useGSAP(() => {
    if (currentScreen !== 'story' || isLoading || prefersReducedMotion) return;
    
    gsap.to(lightRef.current, {
      scale: 1.4, opacity: 0.6, duration: 6, repeat: -1, yoyo: true, ease: "sine.inOut"
    });
  }, { dependencies: [currentScreen, isLoading, prefersReducedMotion] });

  // Loading screen
  if (isLoading) {
    return (
      <div className={`fixed inset-0 ${bgColor} flex items-center justify-center z-[9999]`}>
        <div className="text-center">
          <div className={`w-12 h-12 border-2 ${isDark ? 'border-gray-600 border-t-gray-300' : 'border-gray-300 border-t-gray-600'} rounded-full animate-spin mb-4 mx-auto`} />
          <p className={`font-cinzel ${textColorSubtle} text-lg tracking-[0.3em]`}>
            {lang === 'de' ? 'Laden' : lang === 'ro' ? 'Încărcare' : lang === 'ru' ? 'Загрузка' : 'Loading'}
          </p>
        </div>
      </div>
    );
  }

  // Intro screen with full background image
  if (currentScreen === 'intro') {
    return (
      <div 
        className="fixed inset-0 z-[9999] cursor-pointer overflow-hidden"
        onClick={() => setCurrentScreen('tutorial')}
        onTouchEnd={handleTouchEnd}
        style={{ height: '100dvh' }}
      >
        {/* Full background image with blur and sepia */}
        <div className="absolute inset-0">
          <Image 
            src="/tree_beside_water.jpg" 
            alt="Background" 
            fill 
            className="object-cover"
            style={{ filter: 'blur(8px) sepia(0.4) brightness(0.5)' }}
            priority
          />
        </div>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Skip button */}
        <button 
          onClick={(e) => { e.stopPropagation(); onSkip(); }}
          className="fixed top-4 right-4 md:top-6 md:right-6 text-white/60 hover:text-white text-sm tracking-[0.2em] transition-colors z-[210]"
        >
          {storyContent.skipButton[lang]}
        </button>

        {/* Content - centered using flex with fixed viewport height */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 py-4 md:py-8 overflow-hidden">
          {/* Card with image - smaller on mobile to fit viewport */}
          <div className="mb-4 md:mb-6 w-48 h-32 sm:w-64 sm:h-44 md:w-80 md:h-52 relative rounded-lg overflow-hidden shadow-2xl border border-white/20 flex-shrink-0">
            <Image 
              src="/tree_beside_water.jpg" 
              alt="Root" 
              fill 
              className="object-cover"
              style={{ filter: 'sepia(0.2) brightness(0.9)' }}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          {/* Title - larger on mobile, auto-shrink for long translations (e.g. Russian) */}
          <h1 
            className={`font-cinzel text-white md:text-5xl md:tracking-[0.2em] mb-2 md:mb-3 text-center uppercase drop-shadow-lg flex-shrink-0 w-full px-4 ${
              lang === 'ru' 
                ? 'text-[clamp(1.4rem,7vw,1.875rem)] sm:text-4xl tracking-[0.06em] sm:tracking-[0.15em]' 
                : 'text-3xl sm:text-4xl tracking-[0.15em]'
            }`}
          >
            {storyContent.introTitle[lang]}
          </h1>

          {/* Subtitle - larger on mobile */}
          <p className="font-cinzel text-white/70 text-lg sm:text-xl md:text-xl tracking-[0.08em] md:tracking-[0.1em] mb-4 md:mb-6 italic flex-shrink-0">
            {storyContent.introSubtitle[lang]}
          </p>

          {/* Reading time and skip info - larger on mobile */}
          <div className="text-center text-white/80 text-base md:text-base tracking-wider space-y-1 md:space-y-2 max-w-xl flex-shrink-0">
            <p className="font-medium">{storyContent.readingTime[lang]}</p>
            <p className="text-white/60 text-sm md:text-sm">{isMobile ? storyContent.skipInfoMobile[lang] : storyContent.skipInfoDesktop[lang]}</p>
          </div>

          {/* Countdown - larger on mobile */}
          <div className="mt-4 md:mt-8 text-center flex-shrink-0">
            <p className="text-white/50 text-sm md:text-sm tracking-[0.2em] mb-1">{storyContent.startingIn[lang]}</p>
            <p className="font-cinzel text-3xl sm:text-4xl md:text-5xl text-white font-bold animate-pulse">
              {introCountdown}
            </p>
          </div>

          {/* Tap to continue - bolder and more visible */}
          <p className="text-white/70 text-sm md:text-sm font-bold tracking-[0.2em] mt-4 md:mt-6 animate-pulse flex-shrink-0">
            {isMobile ? storyContent.tutorial.tapToContinue[lang] : storyContent.tutorial.pressAnyKey[lang]}
          </p>
        </div>
      </div>
    );
  }

  // Tutorial screen
  if (currentScreen === 'tutorial') {
    const step = tutorialSteps[tutorialStep];
    return (
      <div 
        className={`fixed inset-0 ${bgColor} flex items-center justify-center z-[9999] cursor-pointer overflow-hidden`}
        onClick={advanceTutorial}
        onTouchEnd={(e) => { e.preventDefault(); advanceTutorial(); }}
        style={{ height: '100dvh' }}
      >
        {/* Skip button */}
        <button 
          onClick={(e) => { e.stopPropagation(); setCurrentScreen('story'); }}
          className={`fixed top-4 right-4 md:top-6 md:right-6 ${textColorSubtle} hover:${textColor} text-sm tracking-[0.2em] transition-colors z-[210]`}
        >
          {storyContent.skipButton[lang]}
        </button>

        <div className="font-cinzel text-center px-8 max-w-lg">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-12">
            {tutorialSteps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === tutorialStep 
                  ? (isDark ? 'bg-white w-6' : 'bg-gray-800 w-6')
                  : i < tutorialStep 
                    ? (isDark ? 'bg-white/60' : 'bg-gray-600') 
                    : (isDark ? 'bg-white/20' : 'bg-gray-300')
              }`} />
            ))}
          </div>

          {/* Icon */}
          <div className="mb-8">
            {step.icon === 'tap' && (
              <div className={`w-20 h-20 mx-auto border-2 ${isDark ? 'border-white/40' : 'border-gray-400'} rounded-full flex items-center justify-center animate-pulse`}>
                <div className={`w-3 h-3 ${isDark ? 'bg-white' : 'bg-gray-800'} rounded-full`} />
              </div>
            )}
            {step.icon === 'swipe' && (
              <div className="flex items-center justify-center gap-4">
                <svg className={`w-8 h-8 ${isDark ? 'text-white/60' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                <div className={`w-12 h-12 border-2 ${isDark ? 'border-white/40' : 'border-gray-400'} rounded-full`} />
                <svg className={`w-8 h-8 ${isDark ? 'text-white/60' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
              </div>
            )}
            {step.icon === 'space' && (
              <div className={`w-32 h-12 mx-auto border-2 ${isDark ? 'border-white/40' : 'border-gray-400'} rounded-lg flex items-center justify-center`}>
                <span className={`${isDark ? 'text-white/60' : 'text-gray-600'} tracking-[0.2em] text-sm`}>SPACE</span>
              </div>
            )}
            {step.icon === 'arrows' && (
              <div className="flex items-center justify-center gap-4">
                <div className={`w-12 h-12 border-2 ${isDark ? 'border-white/40' : 'border-gray-400'} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-6 h-6 ${isDark ? 'text-white/60' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                </div>
                <div className={`w-12 h-12 border-2 ${isDark ? 'border-white/40' : 'border-gray-400'} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-6 h-6 ${isDark ? 'text-white/60' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                </div>
              </div>
            )}
            {step.icon === 'fullscreen' && (
              <div className={`w-12 h-12 mx-auto border-2 ${isDark ? 'border-white/40' : 'border-gray-400'} rounded-lg flex items-center justify-center`}>
                <span className={`${isDark ? 'text-white/60' : 'text-gray-600'} text-xl`}>F</span>
              </div>
            )}
            {step.icon === 'headphones' && (
              <div className={`w-20 h-20 mx-auto flex items-center justify-center`}>
                <svg className={`w-16 h-16 ${isDark ? 'text-white/60' : 'text-gray-600'} animate-pulse`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/>
                </svg>
              </div>
            )}
            {step.icon === 'start' && (
              <div className={`w-20 h-20 mx-auto border-2 ${isDark ? 'border-white' : 'border-gray-800'} rounded-full flex items-center justify-center animate-pulse`}>
                <svg className={`w-8 h-8 ${isDark ? 'text-white' : 'text-gray-800'} ml-1`} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            )}
          </div>

          {/* Text */}
          <h2 className={`${textColor} text-3xl md:text-4xl tracking-[0.2em] mb-4 uppercase`}>{step.title}</h2>
          <p className={`${textColorMuted} text-lg tracking-wider`}>{step.desc}</p>
          {step.descExtra && (
            <p className={`${textColorSubtle} text-sm md:text-base tracking-wider mt-3 flex items-center justify-center gap-2`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
              <span>{step.descExtra}</span>
            </p>
          )}
          
          {/* Tap to continue */}
          <p className={`${textColorSubtle} text-sm tracking-[0.2em] mt-16 animate-pulse`}>
            {isMobile ? storyContent.tutorial.tapToContinue[lang] : storyContent.tutorial.pressAnyKey[lang]}
          </p>
        </div>
      </div>
    );
  }

  // Story screen with GSAP clipPath animations
  return (
    <div 
      ref={container} 
      className={`font-cinzel fixed inset-0 w-full h-full overflow-hidden flex items-center justify-center touch-none z-[9999]`}
      style={{ 
        background: isDark 
          ? 'radial-gradient(ellipse at center, #0d0a08 0%, #030303 60%, #000000 100%)'
          : 'radial-gradient(ellipse at center, #f5f5f5 0%, #e5e5e5 60%, #d5d5d5 100%)'
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background image - only in dark mode */}
      {isDark && (
        <div className="absolute inset-0 z-0">
          <Image 
            src="/tree_beside_water.jpg" 
            alt="Background" 
            fill 
            className="object-cover"
            style={{ 
              filter: 'blur(12px) sepia(0.5) brightness(0.15)'
            }}
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      {/* Animated light with parallax */}
      <div ref={lightRef} className="absolute z-[1] pointer-events-none transition-transform duration-300" style={{ 
        width: 'min(1000px, 150vw)', height: 'min(1000px, 150vh)',
        background: isDark
          ? 'radial-gradient(ellipse at center, rgba(200,180,140,0.2) 0%, rgba(120,100,70,0.1) 35%, rgba(0,0,0,0) 70%)'
          : 'radial-gradient(ellipse at center, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.03) 35%, rgba(0,0,0,0) 70%)',
        filter: 'blur(100px)', left: '50%', top: '50%',
        transform: `translate(calc(-50% + ${mousePos.x * 30}px), calc(-50% + ${mousePos.y * 30}px))`, opacity: 0.5
      }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-20" style={{ 
        background: isDark
          ? 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.9) 100%)'
          : 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0.08) 100%)'
      }} />

      {/* Skip button */}
      <button 
        onClick={onSkip} 
        className={`fixed top-4 right-4 md:top-6 md:right-6 z-[120] ${isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-800'} transition-colors duration-200 text-xs tracking-[0.25em] uppercase`}
      >
        {storyContent.skipButton[lang]}
      </button>

      {/* Fullscreen button (desktop) */}
      {!isMobile && (
        <button 
          onClick={toggleFullscreen}
          className={`fixed top-4 left-4 md:top-6 md:left-6 z-[120] ${isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-800'} transition-colors duration-200`}
        >
          {isFullscreen ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
          )}
        </button>
      )}

      {/* Mute/Sound button - top left, below fullscreen (desktop) or top left (mobile) */}
      <button 
        onClick={() => setIsMuted(!isMuted)}
        className={`fixed ${isMobile ? 'top-4 left-4' : 'top-14 left-4 md:top-16 md:left-6'} z-[120] flex items-center gap-1.5 ${isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-800'} transition-colors duration-200 text-xs tracking-[0.15em] uppercase`}
      >
        {isMuted ? (
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M9,11l12-7v24L9,21H3v-4H1v-2h2v-4H9z M30.707,13.707l-1.414-1.414L26.5,15.086l-2.793-2.793l-1.414,1.414l2.793,2.793l-2.793,2.793l1.414,1.414l2.793-2.793l2.793,2.793l1.414-1.414L27.914,16.5L30.707,13.707z"/></svg>
        ) : (
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M9,11l12-7v24L9,21H3v-4H1v-2h2v-4H9z"/><path d="M24.5,21.4c1.7-1.4,2.8-3.5,2.8-5.9s-1.1-4.5-2.8-5.9l-1.3,1.5c1.3,1.1,2.1,2.7,2.1,4.4s-0.8,3.3-2.1,4.4L24.5,21.4z"/><path d="M28,24.7c2.6-2.1,4.3-5.3,4.3-9.2S30.6,9.4,28,7.3l-1.3,1.5c2.2,1.8,3.6,4.5,3.6,7.7s-1.4,5.9-3.6,7.7L28,24.7z"/></svg>
        )}
        <span className="hidden sm:inline">{isMuted ? storyContent.muteSound[lang] : storyContent.soundOn[lang]}</span>
      </button>

      {/* Scene indicator */}
      <div className={`fixed bottom-4 md:bottom-3 left-1/2 -translate-x-1/2 z-[110] ${isDark ? 'text-white/40' : 'text-gray-400'} text-[10px] md:text-xs tracking-[0.3em] font-light`}>
        {currentPhrase + 1} / {splitPhrases.length}
      </div>

      {/* Progress bar */}
      <div className={`fixed bottom-0 left-0 right-0 h-[4px] md:h-[3px] ${isDark ? 'bg-white/10' : 'bg-gray-200'} z-[110] flex justify-center overflow-hidden`}>
        <div 
          className={`h-full ${isDark ? 'bg-white' : 'bg-gray-700'} transition-[width] duration-100 ease-linear`}
          style={{ 
            width: `${progress}%`,
            boxShadow: isDark ? '0 0 10px rgba(255,255,255,0.8)' : '0 0 6px rgba(0,0,0,0.2)'
          }} 
        />
      </div>

      {/* Center controls */}
      <div className="fixed bottom-12 md:bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-6 z-[110]">
        <button onClick={skipToPrevious} className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center ${isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-800'} transition-colors`}>
          <svg className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        
        <button onClick={togglePause} className={`w-10 h-10 md:w-11 md:h-11 flex items-center justify-center ${isDark ? 'text-white/60 hover:text-white border-white/20 hover:border-white/40' : 'text-gray-500 hover:text-gray-900 border-gray-300 hover:border-gray-500'} transition-all duration-200 border rounded-full backdrop-blur-sm`}>
          {isPaused ? (
            <svg className="w-4 h-4 md:w-5 md:h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          ) : (
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          )}
        </button>
        
        <button onClick={skipToNext} className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center ${isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-800'} transition-colors`}>
          <svg className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </button>
      </div>

      {/* Pause indicator - positioned to not overlap with skip button */}
      {isPaused && !showEndScreen && (
        <div className={`fixed top-14 left-1/2 -translate-x-1/2 md:top-8 md:left-8 md:translate-x-0 ${isDark ? 'text-white/40' : 'text-gray-400'} text-xs md:text-sm tracking-widest z-[110] flex items-center gap-2`}>
          <span className={`w-2 h-2 ${isDark ? 'bg-white/40' : 'bg-gray-400'} rounded-full animate-pulse`} />
          {storyContent.paused[lang]}
        </div>
      )}

      {/* End screen */}
      {showEndScreen && (
        <div className={`fixed inset-0 ${isDark ? 'bg-black/90' : 'bg-white/95'} z-[200] flex items-center justify-center animate-fade-in`}>
          <div className="font-cinzel text-center px-8">
            <h1 className={`${isDark ? 'text-white' : 'text-gray-900'} text-4xl md:text-6xl tracking-[0.3em] mb-8 animate-pulse uppercase`}>
              {storyContent.theEnd[lang]}
            </h1>
            
            <p className={`${isDark ? 'text-white/60' : 'text-gray-600'} text-lg tracking-wider mb-8`}>
              {storyContent.redirecting[lang]} {redirectCountdown} {storyContent.seconds[lang]}...
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <button 
                onClick={restart}
                className={`px-8 py-3 border ${isDark ? 'border-white/30 text-white/60 hover:text-white hover:border-white/60' : 'border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-600'} transition-colors tracking-[0.2em] text-sm uppercase`}
              >
                {storyContent.experienceAgain[lang]}
              </button>
              <button 
                onClick={() => navigator.share?.({ title: 'RADIKAL', text: 'Biblical Radicality', url: window.location.href }).catch(() => {})}
                className={`px-8 py-3 border ${isDark ? 'border-white/30 text-white/60 hover:text-white hover:border-white/60' : 'border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-600'} transition-colors tracking-[0.2em] text-sm uppercase flex items-center gap-2`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
                {storyContent.share[lang]}
              </button>
              <button 
                onClick={onComplete}
                className={`px-8 py-3 border ${isDark ? 'border-white/30 text-white/60 hover:text-white hover:border-white/60' : 'border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-600'} transition-colors tracking-[0.2em] text-sm uppercase`}
              >
                {storyContent.continueToAbout[lang]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current phrase - GSAP word-by-word animation (insurrection.photo style) */}
      {splitPhrases[currentPhrase] && (
        <div 
          ref={phraseRef}
          key={currentPhrase}
          className="absolute flex flex-col items-center justify-center z-30 px-4 sm:px-6 md:px-8 max-w-[95vw] md:max-w-4xl lg:max-w-5xl"
          style={{ 
            transform: `translate(${mousePos.x * 8}px, ${mousePos.y * 8}px)`,
            maxHeight: '70vh',
            overflow: 'hidden',
          }}
        >
          <p 
            className={`${isDark ? 'text-white' : 'text-gray-900'} text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-[0.05em] md:tracking-[0.1em] text-center leading-snug sm:leading-relaxed`}
            style={{ 
              fontWeight: 300, 
              textShadow: isDark 
                ? '0 0 2px rgba(255,255,255,0.6), 0 0 30px rgba(255,255,255,0.15)'
                : '0 0 1px rgba(0,0,0,0.1)',
            }}
          >
            {splitPhrases[currentPhrase].main.split(' ').map((word, i) => (
              <span 
                key={i} 
                className="word-main inline-block mr-[0.3em]"
                style={{ opacity: 0, willChange: 'opacity, transform, filter' }}
              >
                {word}
              </span>
            ))}
          </p>
          {splitPhrases[currentPhrase].sub && (
            <p 
              ref={subRef}
              className={`${isDark ? 'text-white/60' : 'text-gray-600'} text-lg sm:text-xl md:text-2xl lg:text-3xl tracking-[0.05em] text-center mt-3 md:mt-6 italic`}
              style={{ 
                fontWeight: 300, 
                textShadow: isDark ? '0 0 2px rgba(255,255,255,0.4)' : 'none',
              }}
            >
              {splitPhrases[currentPhrase].sub!.split(' ').map((word, i) => (
                <span 
                  key={i} 
                  className="word-sub inline-block mr-[0.3em]"
                  style={{ opacity: 0, willChange: 'opacity, transform, filter' }}
                >
                  {word}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      {/* Minimal CSS helpers */}
      <style jsx>{`
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
      `}</style>
    </div>
  );
}
