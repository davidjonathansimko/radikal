// Text-to-Speech Component for Articles / Text-zu-Sprache-Komponente für Artikel / Componentă Text-în-Voce pentru Articole
// Allows users to listen to articles being read aloud with automatic language detection
// Ermöglicht Benutzern, Artikel vorgelesen zu bekommen mit automatischer Spracherkennung
// Permite utilizatorilor să asculte articolele citite cu voce tare cu detectare automată a limbii

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

interface TextToSpeechProps {
  text: string;
  lang?: string;
  className?: string;
  compact?: boolean;
}

interface VoiceOption {
  voice: SpeechSynthesisVoice;
  label: string;
  isFallback?: boolean;
}

// Translations for TTS UI
const translations = {
  de: {
    play: 'Vorlesen',
    pause: 'Pause',
    resume: 'Fortsetzen',
    stop: 'Stopp',
    settings: 'Einstellungen',
    voiceSettings: 'Stimme',
    speed: 'Geschwindigkeit',
    voice: 'Stimme',
    label: 'Vorlesen',
    listenBlog: 'Blog hören',
    seekForward: '10s vorwärts',
    seekBackward: '10s zurück',
    clickToSeek: 'Klicken zum Springen',
    noVoices: 'Keine deutschen Stimmen verfügbar',
    usingFallback: 'Verwendet alternative Stimme',
  },
  en: {
    play: 'Play',
    pause: 'Pause',
    resume: 'Resume',
    stop: 'Stop',
    settings: 'Settings',
    voiceSettings: 'Voice',
    speed: 'Speed',
    voice: 'Voice',
    label: 'Listen',
    listenBlog: 'Listen',
    seekForward: '10s forward',
    seekBackward: '10s back',
    clickToSeek: 'Click to seek',
    noVoices: 'No English voices available',
    usingFallback: 'Using alternative voice',
  },
  ro: {
    play: 'Redă',
    pause: 'Pauză',
    resume: 'Continuă',
    stop: 'Oprește',
    settings: 'Setări',
    voiceSettings: 'Voce',
    speed: 'Viteză',
    voice: 'Voce',
    label: 'Ascultă',
    listenBlog: 'Ascultă',
    seekForward: '10s înainte',
    seekBackward: '10s înapoi',
    clickToSeek: 'Click pentru a derula',
    noVoices: 'Nu există voci în română',
    usingFallback: 'Se folosește voce alternativă',
  },
  ru: {
    play: 'Воспроизвести',
    pause: 'Пауза',
    resume: 'Продолжить',
    stop: 'Стоп',
    settings: 'Настройки',
    voiceSettings: 'Голос',
    speed: 'Скорость',
    voice: 'Голос',
    label: 'Слушать',
    listenBlog: 'Слушать',
    seekForward: '10с вперёд',
    seekBackward: '10с назад',
    clickToSeek: 'Нажмите для перемотки',
    noVoices: 'Нет русских голосов',
    usingFallback: 'Используется альтернативный голос',
  },
};

// Language code mapping for voice selection - extended with many more languages
const langCodeMap: Record<string, string[]> = {
  de: ['de-DE', 'de-AT', 'de-CH', 'de'],
  en: ['en-US', 'en-GB', 'en-AU', 'en-IN', 'en-NZ', 'en'],
  ro: ['ro-RO', 'ro'],
  ru: ['ru-RU', 'ru'],
  fr: ['fr-FR', 'fr-CA', 'fr-BE', 'fr'],
  es: ['es-ES', 'es-MX', 'es-AR', 'es-US', 'es'],
  it: ['it-IT', 'it'],
  pt: ['pt-BR', 'pt-PT', 'pt'],
  nl: ['nl-NL', 'nl-BE', 'nl'],
  pl: ['pl-PL', 'pl'],
  uk: ['uk-UA', 'uk'],
  tr: ['tr-TR', 'tr'],
  hu: ['hu-HU', 'hu'],
  cs: ['cs-CZ', 'cs'],
  sv: ['sv-SE', 'sv'],
  da: ['da-DK', 'da'],
  no: ['nb-NO', 'nn-NO', 'no-NO', 'no'],
  fi: ['fi-FI', 'fi'],
  el: ['el-GR', 'el'],
  ja: ['ja-JP', 'ja'],
  ko: ['ko-KR', 'ko'],
  zh: ['zh-CN', 'zh-TW', 'zh-HK', 'zh'],
  ar: ['ar-SA', 'ar-EG', 'ar'],
  hi: ['hi-IN', 'hi'],
  bg: ['bg-BG', 'bg'],
  hr: ['hr-HR', 'hr'],
  sk: ['sk-SK', 'sk'],
};

// Friendly language names for the selector
const langNames: Record<string, string> = {
  de: '🇩🇪 Deutsch',
  en: '🇬🇧 English',
  ro: '🇷🇴 Română',
  ru: '🇷🇺 Русский',
  fr: '🇫🇷 Français',
  es: '🇪🇸 Español',
  it: '🇮🇹 Italiano',
  pt: '🇧🇷 Português',
  nl: '🇳🇱 Nederlands',
  pl: '🇵🇱 Polski',
  uk: '🇺🇦 Українська',
  tr: '🇹🇷 Türkçe',
  hu: '🇭🇺 Magyar',
  cs: '🇨🇿 Čeština',
  sv: '🇸🇪 Svenska',
  da: '🇩🇰 Dansk',
  no: '🇳🇴 Norsk',
  fi: '🇫🇮 Suomi',
  el: '🇬🇷 Ελληνικά',
  ja: '🇯🇵 日本語',
  ko: '🇰🇷 한국어',
  zh: '🇨🇳 中文',
  ar: '🇸🇦 العربية',
  hi: '🇮🇳 हिन्दी',
  bg: '🇧🇬 Български',
  hr: '🇭🇷 Hrvatski',
  sk: '🇸🇰 Slovenčina',
};

// Maximum characters per chunk to avoid browser TTS limits
const MAX_CHUNK_SIZE = 3000;

export default function TextToSpeech({
  text,
  lang,
  className = '',
  compact = false,
}: TextToSpeechProps) {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.de;
  
  // Voice language override - user can pick any language for TTS voice
  const [voiceLanguage, setVoiceLanguage] = useState<string>(language);
  
  // Use voiceLanguage for TTS (overridable by user)
  const effectiveLang = lang || (voiceLanguage === 'de' ? 'de-DE' : voiceLanguage === 'en' ? 'en-US' : voiceLanguage === 'ro' ? 'ro-RO' : voiceLanguage === 'ru' ? 'ru-RU' : langCodeMap[voiceLanguage]?.[0] || 'de-DE');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rate, setRate] = useState(0.8);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cleanedTextRef = useRef<string>('');
  const chunksRef = useRef<string[]>([]);
  const currentChunkRef = useRef<number>(0);
  const isSpeakingRef = useRef<boolean>(false);

  // Clean text for speech (remove markdown, HTML, etc.)
  const cleanText = useCallback((rawText: string): string => {
    return rawText
      .replace(/<br\s*\/?>/gi, ' ') // Replace <br> with space
      .replace(/<\/?(p|div|h[1-6]|li|ul|ol|blockquote|section|article|header|footer|tr|td|th)[^>]*>/gi, ' ') // Block-level tags → space
      .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert markdown links to text
      .replace(/[#*_`~]/g, '') // Remove markdown formatting
      .replace(/&nbsp;/g, ' ') // HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&[a-zA-Z]+;/g, ' ') // Remove other HTML entities
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }, []);

  // Split text into chunks at sentence boundaries to avoid browser TTS limits
  const splitIntoChunks = useCallback((fullText: string): string[] => {
    if (fullText.length <= MAX_CHUNK_SIZE) {
      return [fullText];
    }
    
    const chunks: string[] = [];
    let remaining = fullText;
    
    while (remaining.length > 0) {
      if (remaining.length <= MAX_CHUNK_SIZE) {
        chunks.push(remaining);
        break;
      }
      
      // Find the best split point (sentence end) within MAX_CHUNK_SIZE
      let splitAt = MAX_CHUNK_SIZE;
      
      // Try to split at sentence end (. ! ? followed by space)
      const searchWindow = remaining.substring(Math.floor(MAX_CHUNK_SIZE * 0.6), MAX_CHUNK_SIZE);
      const sentenceEndMatch = searchWindow.match(/[.!?]\s/g);
      
      if (sentenceEndMatch) {
        // Find last sentence end in the window
        const lastEnd = searchWindow.lastIndexOf(sentenceEndMatch[sentenceEndMatch.length - 1]);
        if (lastEnd >= 0) {
          splitAt = Math.floor(MAX_CHUNK_SIZE * 0.6) + lastEnd + 2; // +2 to include the punctuation and space
        }
      } else {
        // Fallback: split at last space
        const lastSpace = remaining.lastIndexOf(' ', MAX_CHUNK_SIZE);
        if (lastSpace > MAX_CHUNK_SIZE * 0.3) {
          splitAt = lastSpace + 1;
        }
      }
      
      chunks.push(remaining.substring(0, splitAt).trim());
      remaining = remaining.substring(splitAt).trim();
    }
    
    return chunks;
  }, []);

  // Sync voiceLanguage when app language changes
  useEffect(() => {
    setVoiceLanguage(language);
  }, [language]);

  // Load available voices based on selected voice language
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      
      if (availableVoices.length === 0) return;
      
      // Detect all available languages from system voices
      const detectedLangs = new Set<string>();
      availableVoices.forEach(v => {
        const baseLang = v.lang.split('-')[0].toLowerCase();
        if (langCodeMap[baseLang]) {
          detectedLangs.add(baseLang);
        }
      });
      // Always include the 4 main app languages
      ['de', 'en', 'ro', 'ru'].forEach(l => detectedLangs.add(l));
      // Sort: main languages first, then alphabetical
      const mainLangs = ['de', 'en', 'ro', 'ru'];
      const sortedLangs = [...detectedLangs].sort((a, b) => {
        const aMain = mainLangs.indexOf(a);
        const bMain = mainLangs.indexOf(b);
        if (aMain >= 0 && bMain >= 0) return aMain - bMain;
        if (aMain >= 0) return -1;
        if (bMain >= 0) return 1;
        return (langNames[a] || a).localeCompare(langNames[b] || b);
      });
      setAvailableLanguages(sortedLangs);
      
      // Get language codes for current voice language
      const langCodes = langCodeMap[voiceLanguage] || langCodeMap.de;
      const primaryLangCode = langCodes[0].split('-')[0]; // e.g., 'ro' from 'ro-RO'
      
      // Filter for voices matching the voice language - check multiple patterns
      const matchingVoices = availableVoices.filter((v) => {
        const voiceLang = v.lang.toLowerCase();
        const voiceName = v.name.toLowerCase();
        
        // Match by language code
        if (voiceLang.startsWith(primaryLangCode.toLowerCase())) return true;
        
        // Also check voice name for language keywords
        const langKeywords: Record<string, string[]> = {
          'ro': ['romanian', 'română', 'romana', 'ro-'],
          'de': ['german', 'deutsch', 'de-'],
          'en': ['english', 'en-'],
          'ru': ['russian', 'русский', 'ru-'],
          'fr': ['french', 'français', 'fr-'],
          'es': ['spanish', 'español', 'es-'],
          'it': ['italian', 'italiano', 'it-'],
          'pt': ['portuguese', 'português', 'pt-'],
          'nl': ['dutch', 'nl-'],
          'pl': ['polish', 'polski', 'pl-'],
          'uk': ['ukrainian', 'uk-'],
          'tr': ['turkish', 'tr-'],
          'hu': ['hungarian', 'hu-'],
          'cs': ['czech', 'cs-'],
          'sv': ['swedish', 'sv-'],
          'da': ['danish', 'da-'],
          'no': ['norwegian', 'nb-', 'nn-'],
          'fi': ['finnish', 'fi-'],
          'el': ['greek', 'el-'],
          'ja': ['japanese', 'ja-'],
          'ko': ['korean', 'ko-'],
          'zh': ['chinese', 'zh-'],
          'ar': ['arabic', 'ar-'],
          'hi': ['hindi', 'hi-'],
          'bg': ['bulgarian', 'bg-'],
          'hr': ['croatian', 'hr-'],
          'sk': ['slovak', 'sk-'],
        };
        
        const keywords = langKeywords[primaryLangCode] || [];
        return keywords.some(kw => voiceName.includes(kw) || voiceLang.includes(kw));
      });
      
      // Sort: prefer exact matches, then local, then others
      const sortedVoices = matchingVoices.sort((a, b) => {
        const aExact = langCodes.includes(a.lang) ? 0 : 1;
        const bExact = langCodes.includes(b.lang) ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        
        // Prefer local voices
        if (a.localService && !b.localService) return -1;
        if (!a.localService && b.localService) return 1;
        
        return a.name.localeCompare(b.name);
      });
      
      // If no matching voices found, show ALL available voices so user can choose
      let finalVoices: SpeechSynthesisVoice[] = sortedVoices;
      let isFallback = false;
      
      if (sortedVoices.length === 0) {
        isFallback = true;
        finalVoices = availableVoices.sort((a, b) => {
          if (a.localService && !b.localService) return -1;
          if (!a.localService && b.localService) return 1;
          return a.lang.localeCompare(b.lang);
        });
      }
      
      const voiceOptions: VoiceOption[] = finalVoices
        .map((voice) => ({
          voice,
          label: `${voice.name} (${voice.lang})`,
          isFallback,
        }));

      setVoices(voiceOptions);
      setUsingFallback(isFallback);
      
      // Auto-select best voice for language
      if (voiceOptions.length > 0) {
        setSelectedVoice(voiceOptions[0].voice);
      }
    };

    // Load voices (may be async on some browsers)
    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [voiceLanguage]); // Re-load voices when voice language changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isSpeakingRef.current = false;
      speechSynthesis.cancel();
    };
  }, []);

  // Chrome bug workaround: Chrome pauses speech after ~15 seconds
  // Periodically call resume() to keep it going
  // Only on desktop Chrome — mobile browsers can break from pause/resume
  useEffect(() => {
    if (!isPlaying || isPaused) return;
    
    // Skip keep-alive on mobile — it can cause TTS to stop entirely
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) return;
    
    const keepAlive = setInterval(() => {
      if (speechSynthesis.speaking && !speechSynthesis.paused) {
        speechSynthesis.pause();
        speechSynthesis.resume();
      }
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(keepAlive);
  }, [isPlaying, isPaused]);

  // Speak a single chunk and return a promise
  const speakChunk = useCallback((chunkText: string, chunkIndex: number, totalChunks: number, totalLength: number, offsetBefore: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.lang = effectiveLang;
      utterance.rate = rate;
      utterance.pitch = 1;
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Track progress within the full text
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const actualPosition = offsetBefore + event.charIndex;
          setCurrentPosition(actualPosition);
          const progressPercent = (actualPosition / totalLength) * 100;
          setProgress(progressPercent);
        }
      };

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (event) => {
        if (event.error === 'interrupted') {
          reject(new Error('interrupted'));
        } else if (event.error === 'canceled') {
          reject(new Error('canceled'));
        } else {
          console.error(`[TTS] Chunk ${chunkIndex + 1}/${totalChunks} error:`, event.error);
          // On error, try to continue with next chunk instead of stopping
          resolve();
        }
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    });
  }, [effectiveLang, rate, selectedVoice]);

  const startSpeaking = useCallback((fromPosition: number = 0) => {
    const cleanedText = cleanText(text);
    cleanedTextRef.current = cleanedText;
    
    if (!cleanedText) {
      console.warn('[TTS] No text to speak after cleaning');
      return;
    }

    const wasSpeaking = speechSynthesis.speaking || speechSynthesis.pending;
    
    // Only cancel if something is actually playing — calling cancel() on mobile
    // when nothing is playing can block the next speak() call
    if (wasSpeaking) {
      speechSynthesis.cancel();
    }
    isSpeakingRef.current = true;

    // Get text from position
    const textToSpeak = cleanedText.substring(fromPosition);
    
    // Split into chunks to avoid browser TTS limits
    const chunks = splitIntoChunks(textToSpeak);
    chunksRef.current = chunks;
    currentChunkRef.current = 0;
    
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    console.log(`[TTS] Starting speech: ${cleanedText.length} chars, ${chunks.length} chunks (from pos ${fromPosition})${isMobile ? ' [mobile]' : ''}`);

    setIsPlaying(true);
    setIsPaused(false);

    // Play chunks sequentially
    const playChunks = async () => {
      let offsetBefore = fromPosition;
      
      for (let i = 0; i < chunks.length; i++) {
        if (!isSpeakingRef.current) break; // User stopped
        
        currentChunkRef.current = i;
        
        try {
          await speakChunk(chunks[i], i, chunks.length, cleanedText.length, offsetBefore);
          offsetBefore += chunks[i].length;
        } catch (err: unknown) {
          const error = err as Error;
          if (error.message === 'interrupted' || error.message === 'canceled') {
            // User cancelled — stop the loop
            break;
          }
          console.warn(`[TTS] Chunk ${i} error:`, error.message);
        }
        
        // Small delay between chunks on mobile for stability
        if (isMobile && i < chunks.length - 1 && isSpeakingRef.current) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      // Only reset if we finished naturally (not interrupted)
      if (isSpeakingRef.current) {
        isSpeakingRef.current = false;
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        setCurrentPosition(0);
      }
    };

    // If we had to cancel ongoing speech, delay slightly for mobile compatibility
    if (wasSpeaking) {
      setTimeout(() => playChunks(), 250);
    } else {
      playChunks();
    }
  }, [text, effectiveLang, rate, selectedVoice, cleanText, splitIntoChunks, speakChunk]);

  const pauseSpeaking = () => {
    speechSynthesis.pause();
    setIsPaused(true);
  };

  const resumeSpeaking = () => {
    speechSynthesis.resume();
    setIsPaused(false);
  };

  const stopSpeaking = () => {
    isSpeakingRef.current = false;
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentPosition(0);
  };

  const togglePlayPause = () => {
    if (!isPlaying) {
      startSpeaking(currentPosition);
    } else if (isPaused) {
      resumeSpeaking();
    } else {
      pauseSpeaking();
    }
  };

  // Seek functionality
  const seekTo = (percent: number) => {
    const cleanedText = cleanText(text);
    const newPosition = Math.floor((percent / 100) * cleanedText.length);
    
    if (isPlaying) {
      speechSynthesis.cancel();
      setTimeout(() => {
        startSpeaking(newPosition);
      }, 100);
    } else {
      setCurrentPosition(newPosition);
      setProgress(percent);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = (clickX / rect.width) * 100;
    seekTo(Math.max(0, Math.min(100, percent)));
  };

  const seekBackward = () => {
    const cleanedText = cleanText(text);
    // Seek back approximately 10 seconds worth of text (~150 chars)
    const newPosition = Math.max(0, currentPosition - 150);
    seekTo((newPosition / cleanedText.length) * 100);
  };

  const seekForward = () => {
    const cleanedText = cleanText(text);
    // Seek forward approximately 10 seconds worth of text
    const newPosition = Math.min(cleanedText.length, currentPosition + 150);
    seekTo((newPosition / cleanedText.length) * 100);
  };

  if (!isSupported) {
    return null; // Don't show if TTS not supported
  }

  // Compact version - expandable with settings
  // Visible text labels, inline layout for desktop
  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-1">
          {/* Play button with text label */}
          <button
            onClick={togglePlayPause}
            className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg transition-colors touch-manipulation flex-shrink-0 ${
              isPlaying ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            title={isPlaying ? (isPaused ? t.resume : t.pause) : t.play}
          >
            <span className="text-sm">{isPlaying && !isPaused ? '⏸️' : '🔊'}</span>
            <span className="text-[10px] xs:text-xs sm:text-sm font-semibold">{t.listenBlog}</span>
          </button>
          
          {/* Progress bar - only when playing */}
          {isPlaying && (
            <div 
              className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer w-[40px] sm:w-[60px]"
              onClick={handleProgressClick}
            >
              <div className="h-full bg-red-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          
          {/* Stop button - only when playing */}
          {isPlaying && (
            <button
              onClick={stopSpeaking}
              className="p-1 sm:p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors touch-manipulation flex-shrink-0"
              title={t.stop}
            >
              <span className="text-sm">⏹️</span>
            </button>
          )}
          
          {/* Settings toggle with visible text */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg transition-colors touch-manipulation flex-shrink-0 ${
              showSettings ? 'bg-gray-800 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            title={t.voiceSettings}
          >
            <span className="text-sm">⚙️</span>
            <span className="text-[10px] xs:text-xs sm:text-sm font-medium">{t.voiceSettings}</span>
          </button>
        </div>
        
        {/* Compact settings panel - dark theme */}
        {showSettings && (
          <div className="mt-2 p-3 bg-gray-900 rounded-lg border border-gray-700 space-y-3">
            {/* Voice Language selector */}
            {availableLanguages.length > 1 && (
              <div>
                <label className="text-gray-400 text-xs block mb-1">
                  🌐 {language === 'de' ? 'Vorlesesprache' : language === 'en' ? 'Reading Language' : language === 'ro' ? 'Limba de citire' : 'Язык чтения'}
                </label>
                <select
                  value={voiceLanguage}
                  onChange={(e) => {
                    setVoiceLanguage(e.target.value);
                    if (isPlaying) {
                      stopSpeaking();
                    }
                  }}
                  className="w-full bg-gray-800 text-white text-xs rounded p-1.5 border border-gray-600"
                >
                  {availableLanguages.map((langKey) => (
                    <option key={langKey} value={langKey}>
                      {langNames[langKey] || langKey}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Speed */}
            <div>
              <label className="text-gray-400 text-xs block mb-1">
                {t.speed}: {rate}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-red-600"
              />
            </div>
            
            {/* Voice - only if multiple voices */}
            {voices.length > 0 && (
              <div>
                <label className="text-gray-400 text-xs block mb-1">
                  {t.voice}
                </label>
                {/* Warning when using fallback voices */}
                {usingFallback && (
                  <div className="mb-2 p-2 bg-yellow-900/30 border border-yellow-600/50 rounded text-yellow-400 text-xs flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{t.noVoices} - {t.usingFallback}</span>
                  </div>
                )}
                <select
                  value={selectedVoice?.name || ''}
                  onChange={(e) => {
                    const voice = voices.find((v) => v.voice.name === e.target.value);
                    if (voice) {
                      setSelectedVoice(voice.voice);
                      if (isPlaying) {
                        speechSynthesis.cancel();
                        setTimeout(() => startSpeaking(currentPosition), 100);
                      }
                    }
                  }}
                  className="w-full bg-gray-800 text-white text-xs rounded p-1.5 border border-gray-600"
                >
                  {voices.map((v) => (
                    <option key={v.voice.name} value={v.voice.name}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full version with controls - Touch-friendly buttons
  return (
    <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      {/* Controls wrapper - vertical on small screens, horizontal on larger */}
      <div className="flex flex-col xs:flex-row items-center gap-3">
        {/* Playback controls row */}
        <div className="flex items-center gap-2 sm:gap-3 w-full xs:w-auto justify-center">
          {/* Seek backward button - Touch-friendly 44x44 minimum */}
          {isPlaying && (
            <button
              onClick={seekBackward}
              className="p-3 min-w-[44px] min-h-[44px] rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white transition-colors touch-manipulation"
              title={t.seekBackward}
            >
              ⏪
            </button>
          )}

          {/* Play/Pause button - Touch-friendly */}
          <button
            onClick={togglePlayPause}
            className="p-4 min-w-[56px] min-h-[56px] rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors touch-manipulation"
            title={isPlaying ? (isPaused ? t.resume : t.pause) : t.play}
          >
            {isPlaying && !isPaused ? '⏸️' : '▶️'}
          </button>

          {/* Seek forward button - Touch-friendly */}
          {isPlaying && (
            <button
              onClick={seekForward}
              className="p-3 min-w-[44px] min-h-[44px] rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white transition-colors touch-manipulation"
              title={t.seekForward}
            >
              ⏩
            </button>
          )}

          {/* Stop button - Touch-friendly */}
          {isPlaying && (
            <button
              onClick={stopSpeaking}
              className="p-3 min-w-[44px] min-h-[44px] rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white transition-colors touch-manipulation"
              title={t.stop}
            >
              ⏹️
            </button>
          )}
        </div>

        {/* Progress bar and settings - full width row */}
        <div className="flex items-center gap-2 sm:gap-3 w-full flex-1">
          {/* Progress bar - clickable for seeking, taller for touch */}
          <div 
            className="flex-1 h-4 sm:h-3 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden cursor-pointer relative group touch-manipulation"
            onClick={handleProgressClick}
            title={t.clickToSeek}
          >
          <div
            className="h-full bg-red-600 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
          {/* Hover indicator */}
          <div className="absolute inset-0 bg-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Settings button - Touch-friendly */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 min-w-[44px] min-h-[44px] rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors touch-manipulation"
          title={t.settings}
        >
          ⚙️
        </button>
        </div>

        {/* Label - hidden on mobile */}
        <span className="text-gray-600 dark:text-gray-400 text-sm hidden md:inline whitespace-nowrap">
          🔊 {t.label}
        </span>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700 space-y-4">
          {/* Voice Language selector */}
          {availableLanguages.length > 1 && (
            <div>
              <label className="text-gray-600 dark:text-gray-400 text-sm block mb-2">
                🌐 {language === 'de' ? 'Vorlesesprache' : language === 'en' ? 'Reading Language' : language === 'ro' ? 'Limba de citire' : 'Язык чтения'}
              </label>
              <select
                value={voiceLanguage}
                onChange={(e) => {
                  setVoiceLanguage(e.target.value);
                  if (isPlaying) {
                    stopSpeaking();
                  }
                }}
                className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 border border-gray-300 dark:border-gray-600"
              >
                {availableLanguages.map((langKey) => (
                  <option key={langKey} value={langKey}>
                    {langNames[langKey] || langKey}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Speed control */}
          <div>
            <label className="text-gray-600 dark:text-gray-400 text-sm block mb-2">
              {t.speed}: {rate}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full accent-red-600"
            />
          </div>

          {/* Voice selection */}
          {voices.length > 1 && (
            <div>
              <label className="text-gray-600 dark:text-gray-400 text-sm block mb-2">
                {t.voice}
              </label>
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = voices.find((v) => v.voice.name === e.target.value);
                  if (voice) {
                    setSelectedVoice(voice.voice);
                    // If playing, restart with new voice
                    if (isPlaying) {
                      speechSynthesis.cancel();
                      setTimeout(() => startSpeaking(currentPosition), 100);
                    }
                  }
                }}
                className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 border border-gray-300 dark:border-gray-600"
              >
                {voices.map((v) => (
                  <option key={v.voice.name} value={v.voice.name}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook version for more control
export function useTextToSpeech(lang: string = 'de-DE') {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const speak = useCallback((text: string) => {
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    
    speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [lang]);

  const pause = useCallback(() => {
    speechSynthesis.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    speechSynthesis.resume();
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  return { speak, pause, resume, stop, isPlaying, isPaused };
}
