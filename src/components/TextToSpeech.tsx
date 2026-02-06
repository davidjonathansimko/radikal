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

// Language code mapping for voice selection
const langCodeMap: Record<string, string[]> = {
  de: ['de-DE', 'de-AT', 'de-CH', 'de'],
  en: ['en-US', 'en-GB', 'en-AU', 'en'],
  ro: ['ro-RO', 'ro'],
  ru: ['ru-RU', 'ru'],
};

export default function TextToSpeech({
  text,
  lang,
  className = '',
  compact = false,
}: TextToSpeechProps) {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.de;
  
  // Use app language if no lang prop provided
  const effectiveLang = lang || (language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : language === 'ro' ? 'ro-RO' : language === 'ru' ? 'ru-RU' : 'de-DE');
  
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
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cleanedTextRef = useRef<string>('');

  // Clean text for speech (remove markdown, HTML, etc.)
  const cleanText = useCallback((rawText: string): string => {
    return rawText
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert markdown links to text
      .replace(/[#*_`~]/g, '') // Remove markdown formatting
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }, []);

  // Load available voices based on selected language
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      
      // Debug: Log all available voices to console
      if (availableVoices.length > 0) {
        console.log(`[TTS] Available voices for ${language}:`, 
          availableVoices.map(v => `${v.name} (${v.lang})`).join(', ')
        );
      }
      
      // Get language codes for current language
      const langCodes = langCodeMap[language] || langCodeMap.de;
      const primaryLangCode = langCodes[0].split('-')[0]; // e.g., 'ro' from 'ro-RO'
      
      // Filter for voices matching the current language - check multiple patterns
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
          'ru': ['russian', 'русский', 'ru-']
        };
        
        const keywords = langKeywords[primaryLangCode] || [];
        return keywords.some(kw => voiceName.includes(kw) || voiceLang.includes(kw));
      });
      
      console.log(`[TTS] Matching voices for ${language}:`, matchingVoices.length);
      
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
      // This is important for languages like Romanian that may not have native voices
      let finalVoices: SpeechSynthesisVoice[] = sortedVoices;
      let isFallback = false;
      
      if (sortedVoices.length === 0) {
        isFallback = true;
        // Show all available voices grouped by language
        finalVoices = availableVoices.sort((a, b) => {
          // Prefer local voices
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
  }, [language]); // Re-load voices when language changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const startSpeaking = useCallback((fromPosition: number = 0) => {
    const cleanedText = cleanText(text);
    cleanedTextRef.current = cleanedText;
    
    if (!cleanedText) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    // Get text from position
    const textToSpeak = cleanedText.substring(fromPosition);
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = effectiveLang;
    utterance.rate = rate;
    utterance.pitch = 1;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Track progress
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const actualPosition = fromPosition + event.charIndex;
        setCurrentPosition(actualPosition);
        const progressPercent = (actualPosition / cleanedText.length) * 100;
        setProgress(progressPercent);
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
      setCurrentPosition(0);
    };

    utterance.onerror = (event) => {
      // 'interrupted' is not a real error - it happens when user stops/cancels playback
      if (event.error !== 'interrupted') {
        console.error('[TTS] Error:', event.error);
      }
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  }, [text, effectiveLang, rate, selectedVoice, cleanText]);

  const pauseSpeaking = () => {
    speechSynthesis.pause();
    setIsPaused(true);
  };

  const resumeSpeaking = () => {
    speechSynthesis.resume();
    setIsPaused(false);
  };

  const stopSpeaking = () => {
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
            <span className="text-xs sm:text-sm font-semibold">{t.listenBlog}</span>
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
            <span className="text-xs sm:text-sm font-medium">{t.voiceSettings}</span>
          </button>
        </div>
        
        {/* Compact settings panel - dark theme */}
        {showSettings && (
          <div className="mt-2 p-3 bg-gray-900 rounded-lg border border-gray-700 space-y-3">
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
