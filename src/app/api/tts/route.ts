// Google Cloud Text-to-Speech API Route — WITH SUPABASE CACHING
// Server-side proxy to Google Cloud TTS — API key stays secret on server
// Audio wird in Supabase gecacht, damit nicht jedes Mal neu generiert wird
// Audio-ul este salvat în cache Supabase, ca să nu fie generat de fiecare dată
// Audio is cached in Supabase so it's not regenerated on every visit

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ===== Supabase server-side client for TTS cache =====
// Uses anon key — the tts_cache table should have RLS policies allowing inserts/selects
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// ===== In-memory LRU cache as fast first layer (survives within same server instance) =====
const memoryCache = new Map<string, { audioContent: string; timestamp: number }>();
const MAX_MEMORY_CACHE = 200; // Max entries in memory
const MEMORY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getFromMemoryCache(key: string): string | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > MEMORY_CACHE_TTL) {
    memoryCache.delete(key);
    return null;
  }
  return entry.audioContent;
}

function setMemoryCache(key: string, audioContent: string) {
  // Evict oldest entries if cache is full
  if (memoryCache.size >= MAX_MEMORY_CACHE) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(key, { audioContent, timestamp: Date.now() });
}

// ===== Generate a stable cache key from text + params =====
function generateCacheKey(text: string, language: string, voiceGender: string, speakingRate: number): string {
  const input = `${text}|${language}|${voiceGender}|${speakingRate}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

// ===== Supabase DB cache operations =====
// Table: tts_cache (id uuid, cache_key text UNIQUE, audio_content text, language text, voice_gender text, created_at timestamptz)
async function getFromSupabaseCache(cacheKey: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('tts_cache')
      .select('audio_content')
      .eq('cache_key', cacheKey)
      .single();
    
    if (error || !data) return null;
    return data.audio_content;
  } catch {
    console.warn('[TTS Cache] Supabase read error — continuing without cache');
    return null;
  }
}

async function saveToSupabaseCache(cacheKey: string, audioContent: string, language: string, voiceGender: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase
      .from('tts_cache')
      .upsert({
        cache_key: cacheKey,
        audio_content: audioContent,
        language,
        voice_gender: voiceGender,
        created_at: new Date().toISOString(),
      }, { onConflict: 'cache_key' });
  } catch {
    console.warn('[TTS Cache] Supabase write error — audio still returned, just not cached');
  }
}

// Google Cloud TTS voice mapping for our 4 languages + many more
// WaveNet voices sound much more natural than Standard voices
// WaveNet-Stimmen klingen viel natürlicher als Standard-Stimmen
// Vocile WaveNet sună mult mai natural decât vocile Standard
const WAVENET_VOICES: Record<string, { languageCode: string; name: string; ssmlGender: string }> = {
  'de': { languageCode: 'de-DE', name: 'de-DE-Wavenet-C', ssmlGender: 'FEMALE' },
  'de-male': { languageCode: 'de-DE', name: 'de-DE-Wavenet-B', ssmlGender: 'MALE' },
  'en': { languageCode: 'en-US', name: 'en-US-Wavenet-F', ssmlGender: 'FEMALE' },
  'en-male': { languageCode: 'en-US', name: 'en-US-Wavenet-D', ssmlGender: 'MALE' },
  'ro': { languageCode: 'ro-RO', name: 'ro-RO-Wavenet-A', ssmlGender: 'FEMALE' },
  'ru': { languageCode: 'ru-RU', name: 'ru-RU-Wavenet-C', ssmlGender: 'FEMALE' },
  'ru-male': { languageCode: 'ru-RU', name: 'ru-RU-Wavenet-B', ssmlGender: 'MALE' },
  'fr': { languageCode: 'fr-FR', name: 'fr-FR-Wavenet-C', ssmlGender: 'FEMALE' },
  'es': { languageCode: 'es-ES', name: 'es-ES-Wavenet-C', ssmlGender: 'FEMALE' },
  'it': { languageCode: 'it-IT', name: 'it-IT-Wavenet-A', ssmlGender: 'FEMALE' },
  'pt': { languageCode: 'pt-BR', name: 'pt-BR-Wavenet-A', ssmlGender: 'FEMALE' },
  'nl': { languageCode: 'nl-NL', name: 'nl-NL-Wavenet-A', ssmlGender: 'FEMALE' },
  'pl': { languageCode: 'pl-PL', name: 'pl-PL-Wavenet-A', ssmlGender: 'FEMALE' },
  'uk': { languageCode: 'uk-UA', name: 'uk-UA-Wavenet-A', ssmlGender: 'FEMALE' },
  'tr': { languageCode: 'tr-TR', name: 'tr-TR-Wavenet-C', ssmlGender: 'FEMALE' },
  'hu': { languageCode: 'hu-HU', name: 'hu-HU-Wavenet-A', ssmlGender: 'FEMALE' },
  'cs': { languageCode: 'cs-CZ', name: 'cs-CZ-Wavenet-A', ssmlGender: 'FEMALE' },
  'sv': { languageCode: 'sv-SE', name: 'sv-SE-Wavenet-A', ssmlGender: 'FEMALE' },
  'da': { languageCode: 'da-DK', name: 'da-DK-Wavenet-A', ssmlGender: 'FEMALE' },
  'no': { languageCode: 'nb-NO', name: 'nb-NO-Wavenet-C', ssmlGender: 'FEMALE' },
  'fi': { languageCode: 'fi-FI', name: 'fi-FI-Wavenet-A', ssmlGender: 'FEMALE' },
  'el': { languageCode: 'el-GR', name: 'el-GR-Wavenet-A', ssmlGender: 'FEMALE' },
  'ja': { languageCode: 'ja-JP', name: 'ja-JP-Wavenet-B', ssmlGender: 'FEMALE' },
  'ko': { languageCode: 'ko-KR', name: 'ko-KR-Wavenet-A', ssmlGender: 'FEMALE' },
  'zh': { languageCode: 'cmn-CN', name: 'cmn-CN-Wavenet-A', ssmlGender: 'FEMALE' },
  'ar': { languageCode: 'ar-XA', name: 'ar-XA-Wavenet-A', ssmlGender: 'FEMALE' },
  'hi': { languageCode: 'hi-IN', name: 'hi-IN-Wavenet-A', ssmlGender: 'FEMALE' },
  'bg': { languageCode: 'bg-BG', name: 'bg-BG-Standard-A', ssmlGender: 'FEMALE' }, // No WaveNet for BG
  'hr': { languageCode: 'hr-HR', name: 'hr-HR-Standard-A', ssmlGender: 'FEMALE' }, // No WaveNet for HR  
  'sk': { languageCode: 'sk-SK', name: 'sk-SK-Wavenet-A', ssmlGender: 'FEMALE' },
};

// Maximum text length per request (Google limit is 5000 bytes)
// We use 4500 to be safe with UTF-8 encoding
const MAX_TEXT_LENGTH = 4500;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Cloud TTS not configured. Set GOOGLE_CLOUD_TTS_API_KEY in .env.local' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { text, language = 'de', speakingRate = 0.85, voiceGender = 'female' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Truncate to max length (caller should chunk text before sending)
    const truncatedText = text.substring(0, MAX_TEXT_LENGTH);

    // Select voice based on language and gender preference
    const voiceKey = voiceGender === 'male' && WAVENET_VOICES[`${language}-male`] 
      ? `${language}-male` 
      : language;
    const voiceConfig = WAVENET_VOICES[voiceKey] || WAVENET_VOICES['de'];

    // ===== CACHE LOOKUP: Check if we already have this audio cached =====
    const cacheKey = generateCacheKey(truncatedText, language, voiceGender, speakingRate);
    
    // Layer 1: In-memory cache (fastest — same server instance)
    const memoryCached = getFromMemoryCache(cacheKey);
    if (memoryCached) {
      console.log('[TTS Cache] ✅ HIT (memory) — saved Google API call');
      return NextResponse.json({
        audioContent: memoryCached,
        voiceName: voiceConfig.name,
        languageCode: voiceConfig.languageCode,
        cached: true,
        cacheLayer: 'memory',
      });
    }

    // Layer 2: Supabase DB cache (persists across deploys & server restarts)
    const dbCached = await getFromSupabaseCache(cacheKey);
    if (dbCached) {
      console.log('[TTS Cache] ✅ HIT (supabase) — saved Google API call');
      // Also populate memory cache for next request
      setMemoryCache(cacheKey, dbCached);
      return NextResponse.json({
        audioContent: dbCached,
        voiceName: voiceConfig.name,
        languageCode: voiceConfig.languageCode,
        cached: true,
        cacheLayer: 'database',
      });
    }

    // ===== CACHE MISS: Call Google Cloud TTS API =====
    console.log('[TTS Cache] ❌ MISS — calling Google Cloud TTS API');

    // Google Cloud TTS API request
    // https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: truncatedText },
          voice: {
            languageCode: voiceConfig.languageCode,
            name: voiceConfig.name,
            ssmlGender: voiceConfig.ssmlGender,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: Math.max(0.25, Math.min(4.0, speakingRate)),
            pitch: 0, // Natural pitch
            volumeGainDb: 0,
            // High quality audio settings
            effectsProfileId: ['small-bluetooth-speaker-class-device'],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Google TTS] API error:', response.status, errorData);
      
      // Return specific error for quota exceeded
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'quota_exceeded', message: 'Google Cloud TTS monthly quota exceeded' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: 'Google Cloud TTS request failed', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const audioContent = data.audioContent;
    
    // ===== SAVE TO CACHE: Store audio for future requests =====
    // Layer 1: Memory cache
    setMemoryCache(cacheKey, audioContent);
    // Layer 2: Supabase DB (async — don't wait for it to return response faster)
    saveToSupabaseCache(cacheKey, audioContent, language, voiceGender).catch(() => {});

    console.log('[TTS Cache] 💾 SAVED to cache — next request will be instant');

    // Return the base64 audio content
    // Google returns: { audioContent: "base64-encoded-mp3-data" }
    return NextResponse.json({
      audioContent,
      voiceName: voiceConfig.name,
      languageCode: voiceConfig.languageCode,
      cached: false,
    });

  } catch (error) {
    console.error('[Google TTS] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if Google Cloud TTS is available
// Also returns available WaveNet voices and cache stats
export async function GET() {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
  
  // Get cache stats from Supabase
  let cacheCount = 0;
  if (supabase) {
    try {
      const { count } = await supabase
        .from('tts_cache')
        .select('*', { count: 'exact', head: true });
      cacheCount = count || 0;
    } catch {
      // Ignore — table might not exist yet
    }
  }
  
  return NextResponse.json({
    available: !!apiKey,
    cacheEnabled: !!supabase,
    cachedEntries: cacheCount,
    memoryCacheSize: memoryCache.size,
    voices: Object.entries(WAVENET_VOICES).map(([key, voice]) => ({
      key,
      name: voice.name,
      languageCode: voice.languageCode,
      gender: voice.ssmlGender,
    })),
  });
}
