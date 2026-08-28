// Text-to-Speech Component for Articles / Text-zu-Sprache-Komponente für Artikel / Componentă Text-în-Voce pentru Articole
// Allows users to listen to articles being read aloud with automatic language detection
// Ermöglicht Benutzern, Artikel vorgelesen zu bekommen mit automatischer Spracherkennung
// Permite utilizatorilor să asculte articolele citite cu voce tare cu detectare automată a limbii

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { fetchCustomAudioForLang } from '@/lib/customAudio';

// TTS Engine type — 'browser' = built-in SpeechSynthesis, 'google' = Google Cloud WaveNet
type TTSEngine = 'browser' | 'google';

interface TextToSpeechProps {
  text: string;
  lang?: string;
  className?: string;
  compact?: boolean;
  /** Pasul 21082026 — optionale: ajuta la identificarea audio-ului in Supabase */
  blogSlug?: string;
  blogTitle?: string;
  /**
   * Pasul 2608004 — id-ul articolului, ca sa putem cauta INREGISTRAREA TA
   * pentru limba aleasa. Daca exista una, ea se aude in locul vocii generate.
   * Pana acum doar modalul „Play Blog" stia de ea, iar butonul obisnuit de
   * ascultare pornea tot vocea artificiala — exact neconcordanta observata.
   */
  blogId?: string;
  /** 'blog' sau 'marturie' — doar ca sa se vada in Supabase de unde vine */
  contentType?: 'blog' | 'marturie' | 'andacht' | 'copii';
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

// ===== MP3 chunks -> ONE seekable WAV file =====
//
// Google returns one MP3 per text chunk. Simply concatenating them produces a
// file whose reported duration comes from the first chunk's header only, which
// breaks seeking (every jump landed back near the beginning).
//
// Here the chunks are decoded with the Web Audio API and written into a single
// 16-bit PCM WAV: real header, real duration, byte-accurate native seeking —
// identical behaviour to opening a downloaded file in a media player.
// This is a local transformation only: no extra Google characters are billed.

// MP3 decoders prepend ~1105 samples of encoder-delay silence to every file.
// Dropping them removes the tiny click/gap between chunks.
const MP3_ENCODER_DELAY = 1105;

async function mp3PartsToWav(parts: Uint8Array[]): Promise<Blob | null> {
  if (typeof window === 'undefined' || parts.length === 0) return null;
  const Ctx: typeof AudioContext | undefined =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;

  const ctx = new Ctx();
  try {
    const decoded: Float32Array[] = [];
    let sampleRate = 0;
    let totalSamples = 0;

    for (const bytes of parts) {
      // decodeAudioData detaches the buffer, so hand it an isolated copy
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const buffer = await ctx.decodeAudioData(copy.buffer);

      if (!sampleRate) sampleRate = buffer.sampleRate;

      // Downmix to mono (Google TTS is mono anyway, but be safe)
      const length = buffer.length;
      const mono = new Float32Array(length);
      for (let c = 0; c < buffer.numberOfChannels; c++) {
        const data = buffer.getChannelData(c);
        for (let i = 0; i < length; i++) mono[i] += data[i];
      }
      if (buffer.numberOfChannels > 1) {
        for (let i = 0; i < length; i++) mono[i] /= buffer.numberOfChannels;
      }

      const trim = Math.min(MP3_ENCODER_DELAY, length);
      const slice = mono.subarray(trim);
      decoded.push(slice);
      totalSamples += slice.length;
    }

    if (!sampleRate || totalSamples === 0) return null;

    // WAV: 44-byte header + 16-bit mono PCM
    const out = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(out);
    const writeStr = (offset: number, s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
    };

    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + totalSamples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);        // PCM chunk size
    view.setUint16(20, 1, true);         // format = PCM
    view.setUint16(22, 1, true);         // channels = mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true);         // block align
    view.setUint16(34, 16, true);        // bits per sample
    writeStr(36, 'data');
    view.setUint32(40, totalSamples * 2, true);

    let offset = 44;
    for (const chunk of decoded) {
      for (let i = 0; i < chunk.length; i++) {
        const s = Math.max(-1, Math.min(1, chunk[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([out], { type: 'audio/wav' });
  } catch (err) {
    console.warn('[Google TTS] WAV assembly failed, falling back to MP3:', (err as Error)?.message);
    return null;
  } finally {
    ctx.close().catch(() => {});
  }
}

export default function TextToSpeech({
  text,
  lang,
  className = '',
  compact = false,
  blogSlug,
  blogTitle,
  blogId,
  contentType,
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
  // Pasul 2208001: viteza implicita revine la 0.9x — 1x suna prea rapid.
  // Default speed back to 0.9x (1x sounded too fast). Changeable by the user.
  const [rate, setRate] = useState(0.9);
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
  
  // Wake Lock + silent audio to keep TTS alive when screen locks
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  // ===== Google Cloud TTS State =====
  const [ttsEngine, setTtsEngine] = useState<TTSEngine>('google');
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleVoiceGender] = useState<'male'>('male');
  const googleAudioRef = useRef<HTMLAudioElement | null>(null);
  const googleChunksRef = useRef<string[]>([]);
  const googleCurrentChunkRef = useRef<number>(0);
  const googleIsPlayingRef = useRef<boolean>(false);
  // Session counter — each startGoogleSpeaking increments this; old loops check and exit
  const googleSessionRef = useRef<number>(0);
  // Offset tracking — the character offset where the current playback started from
  const googleStartOffsetRef = useRef<number>(0);

  // ===== Client-side audio cache (persists in browser session) =====
  // Key: hash of text+lang+gender+rate → base64 audio
  const clientAudioCacheRef = useRef<Map<string, string>>(new Map());

  // Check if Google Cloud TTS is available on mount
  useEffect(() => {
    const checkGoogleTTS = async () => {
      try {
        const res = await fetch('/api/tts');
        if (res.ok) {
          const data = await res.json();
          setGoogleAvailable(data.available === true);
          if (data.available) {
            // Auto-select Google if available (better quality)
            setTtsEngine('google');
          }
        }
      } catch {
        // Google TTS not available — use browser
        setGoogleAvailable(false);
      }
    };
    checkGoogleTTS();
  }, []);

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

  // Pasul 2102003: Stop any ongoing playback when text content changes (e.g., translation arrives)
  // This prevents double/triple audio streams when displayContent updates
  const prevTextRef = useRef<string>(text);
  useEffect(() => {
    if (prevTextRef.current !== text) {
      prevTextRef.current = text;
      // Kill Google TTS playback
      if (googleIsPlayingRef.current) {
        googleSessionRef.current++;
        googleIsPlayingRef.current = false;
        googleIsPausedRef.current = false;
        if (googleAudioRef.current) {
          googleAudioRef.current.onended = null;
          googleAudioRef.current.onerror = null;
          googleAudioRef.current.pause();
          googleAudioRef.current.src = '';
          googleAudioRef.current = null;
        }
        googleAudioKeyRef.current = '';
        setAudioDuration(0);
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        setCurrentPosition(0);
        setGoogleLoading(false);
      }
      // Kill browser TTS playback
      if (isSpeakingRef.current) {
        isSpeakingRef.current = false;
        speechSynthesis.cancel();
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        setCurrentPosition(0);
      }
    }
  }, [text]);

  // Sync voiceLanguage when app language changes — stop any current playback first
  useEffect(() => {
    // Stop current playback to prevent double audio when switching languages
    if (googleIsPlayingRef.current) {
      // Increment session to kill the running playback loop
      googleSessionRef.current++;
      googleIsPlayingRef.current = false;
      googleIsPausedRef.current = false;
      if (googleAudioRef.current) {
        googleAudioRef.current.onended = null;
        googleAudioRef.current.onerror = null;
        googleAudioRef.current.pause();
        googleAudioRef.current.src = '';
        googleAudioRef.current = null;
      }
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
      setCurrentPosition(0);
      setGoogleLoading(false);
    }
    if (isSpeakingRef.current) {
      isSpeakingRef.current = false;
      speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
      setCurrentPosition(0);
    }
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
      googleIsPlayingRef.current = false;
      speechSynthesis.cancel();
      // Stop Google audio on unmount
      if (googleAudioRef.current) {
        googleAudioRef.current.pause();
        googleAudioRef.current = null;
      }
      // Release wake lock on unmount
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      // Stop silent audio
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
        silentAudioRef.current = null;
      }
    };
  }, []);

  // Request Wake Lock to keep screen/audio alive
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request('screen');
        console.log('[TTS] Wake Lock acquired');
        wakeLockRef.current.addEventListener('release', () => {
          console.log('[TTS] Wake Lock released');
        });
      }
    } catch (err) {
      console.log('[TTS] Wake Lock not available:', err);
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  // Play a silent audio loop to keep the audio session alive on mobile
  // This prevents the OS from suspending TTS when screen locks
  const startSilentAudio = useCallback(() => {
    if (silentAudioRef.current) return; // Already playing
    try {
      // Create a tiny silent audio context to keep audio session active
      const audioCtx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0.001; // Nearly silent
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      // Store reference for cleanup
      silentAudioRef.current = { pause: () => { oscillator.stop(); audioCtx.close(); } } as unknown as HTMLAudioElement;
      console.log('[TTS] Silent audio started for background playback');
    } catch (err) {
      console.log('[TTS] Silent audio not available:', err);
    }
  }, []);

  const stopSilentAudio = useCallback(() => {
    if (silentAudioRef.current) {
      silentAudioRef.current.pause();
      silentAudioRef.current = null;
    }
  }, []);

  // Set up Media Session API for lock screen controls
  const updateMediaSession = useCallback((playing: boolean, paused: boolean) => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'RADIKAL Blog',
        artist: 'Text-to-Speech',
        album: 'RADIKAL.',
      });
      navigator.mediaSession.playbackState = playing ? (paused ? 'paused' : 'playing') : 'none';
    } catch (err) {
      console.log('[TTS] Media Session not available:', err);
    }
  }, []);

  // Ref for startSpeaking to avoid circular dependency in visibility handler
  const startSpeakingRef = useRef<(fromPosition: number) => void>(() => {});
  
  // Re-acquire wake lock when page becomes visible again (e.g., user turns screen on)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying && !isPaused) {
        // Re-acquire wake lock if it was released
        requestWakeLock();
        // If speech was interrupted while screen was off, resume it
        if (isSpeakingRef.current && !speechSynthesis.speaking && !speechSynthesis.paused) {
          console.log('[TTS] Speech stopped during screen off, restarting from position', currentPosition);
          setTimeout(() => {
            if (isSpeakingRef.current) {
              startSpeakingRef.current(currentPosition);
            }
          }, 300);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying, isPaused, currentPosition, requestWakeLock]);

  // Set up Media Session action handlers for lock screen controls
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (isPaused) {
          speechSynthesis.resume();
          setIsPaused(false);
          updateMediaSession(true, false);
        } else if (!isPlaying) {
          startSpeakingRef.current(currentPosition);
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (isPlaying && !isPaused) {
          speechSynthesis.pause();
          setIsPaused(true);
          updateMediaSession(true, true);
        }
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        isSpeakingRef.current = false;
        speechSynthesis.cancel();
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        setCurrentPosition(0);
        releaseWakeLock();
        stopSilentAudio();
        updateMediaSession(false, false);
      });
    } catch (err) {
      console.log('[TTS] Media Session handlers not supported:', err);
    }
  }, [isPlaying, isPaused, currentPosition, updateMediaSession, releaseWakeLock, stopSilentAudio]);


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

  // ===== Google Cloud TTS: Chunk and play via /api/tts =====
  //
  // IMPORTANT: chunking must ALWAYS run on the full cleaned text, never on a
  // substring starting at the seek position. Chunk boundaries are what the
  // server cache key is derived from, so re-chunking from an arbitrary offset
  // would produce text fragments that were never synthesized before => every
  // seek would be a cache MISS and require a fresh (slow) Google API call.
  // With stable boundaries, seeking simply jumps to an already-cached chunk.
  const googleSplitChunks = useCallback((fullText: string): string[] => {
    // Google limit is 5000 bytes for SSML. Smaller chunks cost exactly the same
    // (billing is per character) but give faster start-up and finer seek
    // granularity, so we stay well below the limit.
    const GOOGLE_CHUNK_SIZE = 900;
    if (fullText.length <= GOOGLE_CHUNK_SIZE) return [fullText];
    
    const chunks: string[] = [];
    let remaining = fullText;
    while (remaining.length > 0) {
      if (remaining.length <= GOOGLE_CHUNK_SIZE) {
        chunks.push(remaining);
        break;
      }
      let splitAt = GOOGLE_CHUNK_SIZE;
      const searchWindow = remaining.substring(Math.floor(GOOGLE_CHUNK_SIZE * 0.6), GOOGLE_CHUNK_SIZE);
      const sentenceEndMatch = searchWindow.match(/[.!?]\s/g);
      if (sentenceEndMatch) {
        const lastEnd = searchWindow.lastIndexOf(sentenceEndMatch[sentenceEndMatch.length - 1]);
        if (lastEnd >= 0) splitAt = Math.floor(GOOGLE_CHUNK_SIZE * 0.6) + lastEnd + 2;
      } else {
        const lastSpace = remaining.lastIndexOf(' ', GOOGLE_CHUNK_SIZE);
        if (lastSpace > GOOGLE_CHUNK_SIZE * 0.3) splitAt = lastSpace + 1;
      }
      chunks.push(remaining.substring(0, splitAt).trim());
      remaining = remaining.substring(splitAt).trim();
    }
    return chunks;
  }, []);

  // Helper: convert base64 string to raw bytes.
  // Raw bytes (not Blob URLs) because several chunks are concatenated into ONE
  // MP3 blob — MP3 is a stream of independent frames, so simple concatenation
  // produces a single valid, fully seekable file.
  const base64ToBytes = useCallback((base64: string): Uint8Array<ArrayBuffer> => {
    const bin = atob(base64);
    const bytes = new Uint8Array(new ArrayBuffer(bin.length));
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }, []);

  // Build the client-side cache key for a chunk (text + voice params)
  const googleCacheKey = useCallback((chunkText: string) =>
    `tts_${voiceLanguage}_${googleVoiceGender}_${rate}_${chunkText.substring(0, 50).replace(/\s/g, '_')}`,
  [voiceLanguage, googleVoiceGender, rate]);

  // Tracks chunks whose audio is currently being downloaded, so we never
  // fire two identical requests (prefetch + playback) at the same time.
  const googleInFlightRef = useRef<Map<string, Promise<string>>>(new Map());

  // Downloads (or reuses) the base64 audio for one chunk. Playback-agnostic:
  // this is what makes prefetching the NEXT chunk possible while the current
  // one is still being spoken — that gap was the audible pause.
  const googleFetchBase64 = useCallback(async (chunkText: string): Promise<string> => {
    const cacheKey = googleCacheKey(chunkText);

    const cached = clientAudioCacheRef.current.get(cacheKey);
    if (cached) return cached;

    const inFlight = googleInFlightRef.current.get(cacheKey);
    if (inFlight) return inFlight;

    const request = (async () => {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: chunkText,
          language: voiceLanguage,
          speakingRate: rate,
          voiceGender: googleVoiceGender,
          // Pasul 21082026 — identificarea articolului in tabelul tts_cache
          blogSlug,
          blogTitle,
          contentType,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error === 'quota_exceeded') {
          throw new Error('quota_exceeded');
        }
        // Log the real reason returned by the server so a bare "403" is
        // actionable instead of mysterious.
        console.error(
          `[Google TTS] HTTP ${res.status}`,
          '\n  Google says :', err.googleMessage || err.error || '(no message)',
          '\n  Status      :', err.googleStatus || '(none)',
          '\n  Likely cause:', err.hint || '(none)'
        );
        throw new Error(
          `Google TTS failed: ${res.status}${err.googleMessage ? ` — ${err.googleMessage}` : ''}`
        );
      }

      const data = await res.json();
      if (!data.audioContent) {
        throw new Error('Google TTS returned empty audio content');
      }

      clientAudioCacheRef.current.set(cacheKey, data.audioContent);
      return data.audioContent as string;
    })();

    googleInFlightRef.current.set(cacheKey, request);
    try {
      return await request;
    } finally {
      googleInFlightRef.current.delete(cacheKey);
    }
  }, [googleCacheKey, voiceLanguage, rate, googleVoiceGender]);

  // ===== ONE complete audio file per article =====
  //
  // Previously each chunk was played in its own <audio> element, one after the
  // other. That made real seeking impossible: jumping meant restarting the
  // whole pipeline at another chunk, positions drifted, and every jump risked a
  // new Google call.
  //
  // Now every chunk is downloaded ONCE, the MP3 bytes are concatenated into a
  // single Blob and handed to a single <audio> element. From that point the
  // browser owns playback exactly like a downloaded MP3 in a media player:
  // seeking anywhere is native, instant and costs nothing.
  //
  // Cost note: identical to before. Google bills per character and each chunk
  // is synthesized at most once ever (afterwards it comes from the Supabase
  // cache, for every user and every replay).
  const googleBlobUrlRef = useRef<string | null>(null);
  const googleAudioKeyRef = useRef<string>('');
  // Set when the user seeks while the file is still being assembled.
  const googlePendingRatioRef = useRef<number | null>(null);
  const [googleBuildPercent, setGoogleBuildPercent] = useState(0);
  // Real duration of the assembled article audio (seconds). 0 = not ready.
  const [audioDuration, setAudioDuration] = useState(0);

  // Identity of an assembled audio: same article + same voice params = reuse it.
  const googleAudioKey = useCallback((cleanedText: string) =>
    `${voiceLanguage}|${googleVoiceGender}|${rate}|${cleanedText.length}|${cleanedText.substring(0, 80)}`,
  [voiceLanguage, googleVoiceGender, rate]);

  // Downloads every chunk (limited concurrency, order preserved) and returns a
  // Blob URL for the complete article audio.
  const googleBuildFullAudio = useCallback(async (cleanedText: string, session: number): Promise<string | null> => {
    const chunks = googleSplitChunks(cleanedText);
    googleChunksRef.current = chunks;

    const parts: string[] = new Array(chunks.length);
    let cursor = 0;
    let done = 0;
    const CONCURRENCY = 4;

    const worker = async () => {
      for (;;) {
        const i = cursor++;
        if (i >= chunks.length) return;
        if (googleSessionRef.current !== session) return;
        parts[i] = await googleFetchBase64(chunks[i]);
        done++;
        setGoogleBuildPercent(Math.round((done / chunks.length) * 100));
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, chunks.length) }, worker)
    );

    if (googleSessionRef.current !== session) return null;
    if (parts.some((p) => !p)) return null;

    const mp3s = parts.map(base64ToBytes);

    // --- Why we re-encode to WAV instead of just concatenating the MP3s -----
    // A concatenation of N MP3 files is playable, but NOT reliably seekable:
    // the browser reads the duration from the FIRST file's Xing/Info header,
    // so `audio.duration` ends up being the length of chunk 1 only. Every
    // seek then mapped percent * wrongDuration and jumped back to the start.
    //
    // Decoding the chunks and writing ONE 16-bit PCM WAV gives an exact
    // header, an exact duration and byte-accurate seeking — exactly like the
    // sample files opened in a normal media player. Costs zero extra
    // characters: it is a purely local transformation of already-cached audio.
    const wav = await mp3PartsToWav(mp3s);
    if (googleSessionRef.current !== session) return null;
    if (wav) return URL.createObjectURL(wav);

    // Fallback (no Web Audio / decode failure): playable, seek less precise.
    return URL.createObjectURL(new Blob(mp3s, { type: 'audio/mpeg' }));
  }, [googleSplitChunks, googleFetchBase64, base64ToBytes]);

  // Ref to track pause state for Google TTS
  const googleIsPausedRef = useRef(false);
  // True while the user drags the progress thumb — stops the progress interval
  // from fighting the drag.
  const isScrubbingRef = useRef(false);

  const startGoogleSpeaking = useCallback(async (fromPosition: number = 0) => {
    const cleanedText = cleanText(text);
    if (!cleanedText) return;

    // Increment session to invalidate any previous build/playback
    const session = ++googleSessionRef.current;
    const wantKey = googleAudioKey(cleanedText);
    const ratio = cleanedText.length > 0
      ? Math.min(0.999, Math.max(0, fromPosition / cleanedText.length))
      : 0;

    googleIsPausedRef.current = false;

    // --- Fast path: the complete audio is already assembled -----------------
    // Replaying or resuming after Stop costs nothing and starts instantly.
    const existing = googleAudioRef.current;
    if (existing && googleAudioKeyRef.current === wantKey) {
      googleIsPlayingRef.current = true;
      if (Number.isFinite(existing.duration) && existing.duration > 0) {
        existing.currentTime = ratio * existing.duration;
      }
      setIsPlaying(true);
      setIsPaused(false);
      setGoogleLoading(false);
      requestWakeLock();
      updateMediaSession(true, false);
      existing.play().catch(() => {});
      return;
    }

    // --- Slow path: build the complete audio once ---------------------------
    if (googleAudioRef.current) {
      googleAudioRef.current.onended = null;
      googleAudioRef.current.onerror = null;
      googleAudioRef.current.pause();
      googleAudioRef.current.src = '';
      googleAudioRef.current = null;
    }
    if (googleBlobUrlRef.current) {
      // Pasul 2608004: cand se aude inregistrarea ta, adresa nu este un `blob:`
      // creat de noi, ci un link normal. Pe acela nu avem ce elibera.
      if (googleBlobUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(googleBlobUrlRef.current);
      }
      googleBlobUrlRef.current = null;
    }
    googleAudioKeyRef.current = '';
    googlePendingRatioRef.current = null;
    setAudioDuration(0);

    googleIsPlayingRef.current = true;
    setIsPlaying(true);
    setIsPaused(false);
    setGoogleLoading(true);
    setGoogleBuildPercent(0);
    requestWakeLock();
    updateMediaSession(true, false);

    let blobUrl: string | null = null;
    try {
      // Pasul 2608004 — INREGISTRAREA TA are intaietate.
      // Daca ai incarcat o inregistrare proprie pentru limba aleasa, o folosim
      // direct: nu mai generam nimic si nu mai platim nimic. Daca stergi
      // inregistrarea, se revine singur la vocea generata.
      const mine = blogId ? await fetchCustomAudioForLang(blogId, voiceLanguage) : null;
      if (googleSessionRef.current !== session) return;
      blobUrl = mine?.audio_url ?? (await googleBuildFullAudio(cleanedText, session));
    } catch (err) {
      const error = err as Error;
      if (googleSessionRef.current !== session) return;
      if (error.message === 'quota_exceeded') {
        console.warn('[TTS] Google quota exceeded');
      } else {
        console.warn('[Google TTS] Audio build failed:', error.message);
      }
      googleIsPlayingRef.current = false;
      setIsPlaying(false);
      setIsPaused(false);
      setGoogleLoading(false);
      releaseWakeLock();
      updateMediaSession(false, false);
      return;
    }

    // A newer session started while we were building — discard this result
    if (googleSessionRef.current !== session) {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      return;
    }
    if (!blobUrl) {
      googleIsPlayingRef.current = false;
      setIsPlaying(false);
      setGoogleLoading(false);
      releaseWakeLock();
      updateMediaSession(false, false);
      return;
    }

    setGoogleLoading(false);
    googleBlobUrlRef.current = blobUrl;
    googleAudioKeyRef.current = wantKey;
    const audio = new Audio();
    googleAudioRef.current = audio;
    audio.preload = 'auto';

    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration);
        // A seek made during assembly wins over the position we started with.
        const pending = googlePendingRatioRef.current;
        const startRatio = pending !== null ? pending : ratio;
        googlePendingRatioRef.current = null;
        if (startRatio > 0) audio.currentTime = startRatio * audio.duration;
      }
    };
    audio.ondurationchange = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration);
      }
    };
    audio.onended = () => {
      // Compare by element, not by session: the element survives Stop/Replay
      if (googleAudioRef.current !== audio) return;
      googleIsPlayingRef.current = false;
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
      setCurrentPosition(0);
      releaseWakeLock();
      updateMediaSession(false, false);
    };
    audio.onerror = () => {
      if (googleAudioRef.current !== audio) return;
      const mediaError = audio.error;
      console.error(
        '[Google TTS] Playback error:',
        mediaError ? `code ${mediaError.code}: ${mediaError.message}` : 'unknown'
      );
      googleAudioKeyRef.current = '';
      googleIsPlayingRef.current = false;
      setIsPlaying(false);
      setIsPaused(false);
      setGoogleLoading(false);
      releaseWakeLock();
      updateMediaSession(false, false);
    };

    audio.src = blobUrl;

    // If the user pressed Pause while the audio was still being built, respect
    // it: load the file but do not start it. Resume will play it.
    if (googleIsPausedRef.current) {
      audio.load();
      setIsPaused(true);
      updateMediaSession(true, true);
      return;
    }

    audio.play().catch((playErr) => {
      console.warn('[Google TTS] play() rejected:', playErr?.message);
    });
  }, [text, cleanText, googleAudioKey, googleBuildFullAudio, requestWakeLock, releaseWakeLock, updateMediaSession, blogId, voiceLanguage]);

  const stopGoogleSpeaking = useCallback(() => {
    // Invalidate any build in progress
    googleSessionRef.current++;
    googleIsPlayingRef.current = false;
    googleIsPausedRef.current = false;
    // Keep the assembled audio element alive: pressing Play again then costs
    // nothing and starts instantly.
    if (googleAudioRef.current) {
      googleAudioRef.current.pause();
      try { googleAudioRef.current.currentTime = 0; } catch { /* not seekable yet */ }
    }
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentPosition(0);
    setGoogleLoading(false);
    releaseWakeLock();
    updateMediaSession(false, false);
  }, [releaseWakeLock, updateMediaSession]);

  const pauseGoogleSpeaking = useCallback(() => {
    googleIsPausedRef.current = true;
    if (googleAudioRef.current) {
      googleAudioRef.current.pause();
    }
    setIsPaused(true);
    updateMediaSession(true, true);
  }, [updateMediaSession]);

  const resumeGoogleSpeaking = useCallback(() => {
    googleIsPausedRef.current = false;
    if (googleAudioRef.current) {
      // .play() returns a Promise that can reject (e.g. browser autoplay policy).
      // Without .catch() this produces an unhandled rejection and, on some
      // browsers, leaves the UI stuck in "playing" state.
      const p = googleAudioRef.current.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
    setIsPaused(false);
    updateMediaSession(true, false);
  }, [updateMediaSession]);

  // Update progress during Google audio playback.
  // Now purely time-based: one audio element holds the whole article, so
  // currentTime/duration is the exact position — no chunk arithmetic, no drift.
  useEffect(() => {
    if (ttsEngine !== 'google' || !isPlaying || isPaused) return;

    const interval = setInterval(() => {
      if (isScrubbingRef.current) return;
      const audio = googleAudioRef.current;
      if (!audio || audio.paused) return;
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;

      const pct = Math.min(100, (audio.currentTime / audio.duration) * 100);
      setProgress(pct);
      setCurrentPosition(Math.floor((pct / 100) * cleanText(text).length));
    }, 200);

    return () => clearInterval(interval);
  }, [ttsEngine, isPlaying, isPaused, text, cleanText]);

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
    
    // Activate wake lock + silent audio to prevent screen lock from stopping TTS
    requestWakeLock();
    startSilentAudio();
    updateMediaSession(true, false);

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
        releaseWakeLock();
        stopSilentAudio();
        updateMediaSession(false, false);
      }
    };

    // If we had to cancel ongoing speech, delay slightly for mobile compatibility
    if (wasSpeaking) {
      setTimeout(() => playChunks(), 250);
    } else {
      playChunks();
    }
  }, [text, effectiveLang, rate, selectedVoice, cleanText, splitIntoChunks, speakChunk, requestWakeLock, startSilentAudio, releaseWakeLock, stopSilentAudio, updateMediaSession]);

  // Keep ref in sync so visibility handler can call latest startSpeaking
  useEffect(() => {
    startSpeakingRef.current = startSpeaking;
  }, [startSpeaking]);

  const pauseSpeaking = () => {
    if (ttsEngine === 'google') {
      pauseGoogleSpeaking();
    } else {
      speechSynthesis.pause();
      setIsPaused(true);
      updateMediaSession(true, true);
    }
    // Keep wake lock & silent audio active during pause so position is preserved
  };

  const resumeSpeaking = () => {
    if (ttsEngine === 'google') {
      resumeGoogleSpeaking();
    } else {
      speechSynthesis.resume();
      setIsPaused(false);
      updateMediaSession(true, false);
    }
  };

  const stopSpeaking = () => {
    if (ttsEngine === 'google') {
      stopGoogleSpeaking();
    } else {
      isSpeakingRef.current = false;
      speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
      setCurrentPosition(0);
      releaseWakeLock();
      stopSilentAudio();
      updateMediaSession(false, false);
    }
  };

  const togglePlayPause = () => {
    if (!isPlaying) {
      if (ttsEngine === 'google') {
        startGoogleSpeaking(currentPosition);
      } else {
        startSpeaking(currentPosition);
      }
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

    if (ttsEngine === 'google') {
      const audio = googleAudioRef.current;
      // Native seek inside the single assembled file: instant, no network,
      // no extra characters billed. Works forwards and backwards alike.
      if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = (percent / 100) * audio.duration;
        setProgress(percent);
        setCurrentPosition(newPosition);
        if (isPlaying && !isPaused) {
          audio.play().catch(() => {});
        }
        return;
      }
      // Audio not assembled yet (still building, or never started).
      setProgress(percent);
      setCurrentPosition(newPosition);
      // While the file is being assembled we must NOT restart the build —
      // that would throw away finished work. Just remember where to start.
      if (googleLoading) {
        googlePendingRatioRef.current = percent / 100;
        return;
      }
      if (isPlaying) startGoogleSpeaking(newPosition);
      return;
    }

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

  // Jump ±10 seconds. With the Google engine we have a real timeline, so we
  // use exact seconds instead of the old character-count estimate.
  const seekRelative = (deltaSeconds: number) => {
    const audio = googleAudioRef.current;
    if (ttsEngine === 'google' && audio && Number.isFinite(audio.duration) && audio.duration > 0) {
      const target = Math.max(0, Math.min(audio.duration - 0.25, audio.currentTime + deltaSeconds));
      seekTo((target / audio.duration) * 100);
      return;
    }
    const cleanedText = cleanText(text);
    const chars = Math.round(deltaSeconds * 15);
    const newPosition = Math.max(0, Math.min(cleanedText.length, currentPosition + chars));
    seekTo((newPosition / cleanedText.length) * 100);
  };

  const seekBackward = () => seekRelative(-10);

  const seekForward = () => seekRelative(10);

  if (!isSupported) {
    return null; // Don't show if TTS not supported
  }

  // Compact version - expandable with settings
  // Visible text labels, inline layout for desktop
  // Beautiful progress bar appears below when playing
  if (compact) {
    // Estimate reading time based on text length and speed rate
    // Real duration once the article audio is assembled; estimate before that.
    const estimatedTotalSeconds = audioDuration > 0
      ? Math.round(audioDuration)
      : Math.round((cleanText(text).length / (15 * rate)));
    const currentSeconds = Math.round((progress / 100) * estimatedTotalSeconds);
    const formatTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    return (
      <div className={`${className}`}>
        {/* Player bar — always visible, clean minimal design */}
        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-gray-100 dark:bg-black border border-gray-200 dark:border-white/10 transition-all duration-300">
            {/* Play/Pause button */}
            <button
              onClick={togglePlayPause}
              className="flex-shrink-0 w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-700 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors touch-manipulation"
              title={isPaused ? t.resume : isPlaying ? t.pause : t.play}
            >
              {googleLoading ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 sm:w-6 sm:h-6 animate-spin">
                  <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                </svg>
              ) : isPlaying && !isPaused ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Current time */}
            <span className="flex-shrink-0 text-[9px] xs:text-[10px] sm:text-xs text-gray-500 dark:text-white/50 font-mono tabular-nums min-w-[28px] xs:min-w-[32px] sm:min-w-[38px] text-right">
              {formatTime(currentSeconds)}
            </span>

            {/* Progress bar - full width, clickable & draggable */}
            <div className="flex-1 min-w-[40px] relative group cursor-pointer select-none touch-none"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const bar = e.currentTarget;
                const rect = bar.getBoundingClientRect();
                const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                setProgress(pct);
                isScrubbingRef.current = true;
                // Google engine seeks natively inside one audio file — no need
                // to interrupt playback while dragging.
                if (isPlaying && !isPaused && ttsEngine !== 'google') {
                  speechSynthesis.pause();
                }
                const onMove = (ev: MouseEvent) => {
                  ev.preventDefault();
                  const r = bar.getBoundingClientRect();
                  const p = Math.max(0, Math.min(100, ((ev.clientX - r.left) / r.width) * 100));
                  setProgress(p);
                };
                const onUp = (ev: MouseEvent) => {
                  ev.preventDefault();
                  const r = bar.getBoundingClientRect();
                  const p = Math.max(0, Math.min(100, ((ev.clientX - r.left) / r.width) * 100));
                  setProgress(p);
                  document.removeEventListener('mousemove', onMove);
                  document.removeEventListener('mouseup', onUp);
                  isScrubbingRef.current = false;
                  seekTo(p);
                };
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
              }}
              onTouchStart={(e) => {
                // Do NOT call e.preventDefault() — React registers touch handlers as passive
                // The touch-none CSS class already prevents default touch behavior
                e.stopPropagation();
                const bar = e.currentTarget;
                const rect = bar.getBoundingClientRect();
                const touch = e.touches[0];
                const pct = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
                setProgress(pct);
                isScrubbingRef.current = true;
                if (isPlaying && !isPaused && ttsEngine !== 'google') {
                  speechSynthesis.pause();
                }
                const onMove = (ev: TouchEvent) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                  const r = bar.getBoundingClientRect();
                  const t = ev.touches[0];
                  const p = Math.max(0, Math.min(100, ((t.clientX - r.left) / r.width) * 100));
                  setProgress(p);
                };
                const onEnd = (ev: TouchEvent) => {
                  ev.preventDefault();
                  const r = bar.getBoundingClientRect();
                  const t = ev.changedTouches[0];
                  const p = Math.max(0, Math.min(100, ((t.clientX - r.left) / r.width) * 100));
                  document.removeEventListener('touchmove', onMove);
                  document.removeEventListener('touchend', onEnd);
                  isScrubbingRef.current = false;
                  seekTo(p);
                };
                document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('touchend', onEnd, { passive: false });
              }}
            >
              {/* Track background */}
              <div className="w-full h-1.5 sm:h-2 bg-gray-300 dark:bg-white/15 rounded-full cursor-pointer overflow-hidden touch-manipulation">
                <div
                  className="h-full bg-blue-500 rounded-full transition-[width] duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Scrub thumb */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-white rounded-full shadow-md border border-gray-300 dark:border-white/30 pointer-events-none transition-[left] duration-100"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>

            {/* Total time — or one-time assembly progress */}
            <span className="flex-shrink-0 text-[9px] xs:text-[10px] sm:text-xs text-gray-500 dark:text-white/50 font-mono tabular-nums min-w-[28px] xs:min-w-[32px] sm:min-w-[38px]">
              {googleLoading ? `${googleBuildPercent}%` : formatTime(estimatedTotalSeconds)}
            </span>

            {/* Speed button */}
            <div className="flex-shrink-0 flex items-center gap-1">
              <button
                onClick={() => {
                  const speeds = [0.9, 1.0, 1.2, 1.5];
                  const currentIdx = speeds.indexOf(rate);
                  const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % speeds.length : 0;
                  const newRate = speeds[nextIdx];
                  setRate(newRate);
                  if (isPlaying && !isPaused) {
                    if (ttsEngine === 'google') {
                      stopGoogleSpeaking();
                      setTimeout(() => startGoogleSpeaking(currentPosition), 100);
                    } else {
                      speechSynthesis.cancel();
                      setTimeout(() => startSpeaking(currentPosition), 100);
                    }
                  }
                }}
                className="text-[10px] sm:text-xs text-gray-500 dark:text-white/50 hover:text-gray-800 dark:hover:text-white/80 font-mono px-1 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors touch-manipulation"
                title={t.speed}
              >
                {rate}x
              </button>
            </div>
        </div>
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
          {/* Google Cloud TTS info — no engine toggle needed (full version) */}
          {googleAvailable && (
            <div>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                ✨ {language === 'de' ? 'Google Cloud WaveNet — Hochwertige KI-Stimme' : language === 'en' ? 'Google Cloud WaveNet — High-quality AI voice' : language === 'ro' ? 'Google Cloud WaveNet — Voce AI de înaltă calitate' : 'Google Cloud WaveNet — Высококачественный ИИ-голос'}
              </p>
            </div>
          )}

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
