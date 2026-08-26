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
// `voiceName` is part of the key so that changing the voice generation
// (WaveNet -> Neural2) automatically invalidates old cached audio.
function generateCacheKey(text: string, language: string, voiceGender: string, speakingRate: number, voiceName = '', hifi = false): string {
  const input = `${text}|${language}|${voiceGender}|${speakingRate}|${voiceName}`;
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

async function saveToSupabaseCache(
  cacheKey: string,
  audioContent: string,
  language: string,
  voiceGender: string,
  // Pasul 21082026 — ca sa se vada in Supabase carui articol ii apartine audio-ul
  blogSlug?: string | null,
  blogTitle?: string | null,
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase
      .from('tts_cache')
      .upsert({
        cache_key: cacheKey,
        audio_content: audioContent,
        language,
        voice_gender: voiceGender,
        blog_slug: blogSlug || null,
        blog_title: blogTitle || null,
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
// Male-only WaveNet voices — warm, natural male voices for all languages
// Only the best-sounding male WaveNet voice per language is selected
const WAVENET_VOICES: Record<string, { languageCode: string; name?: string; ssmlGender: string }> = {
  'de': { languageCode: 'de-DE', name: 'de-DE-Wavenet-B', ssmlGender: 'MALE' },
  'en': { languageCode: 'en-US', name: 'en-US-Wavenet-D', ssmlGender: 'MALE' },
  'ro': { languageCode: 'ro-RO', ssmlGender: 'MALE' }, // No specific male voice name — let Google auto-select best MALE
  'ru': { languageCode: 'ru-RU', name: 'ru-RU-Wavenet-B', ssmlGender: 'MALE' },
  'fr': { languageCode: 'fr-FR', name: 'fr-FR-Wavenet-B', ssmlGender: 'MALE' },
  'es': { languageCode: 'es-ES', name: 'es-ES-Wavenet-B', ssmlGender: 'MALE' },
  'it': { languageCode: 'it-IT', name: 'it-IT-Wavenet-C', ssmlGender: 'MALE' },
  'pt': { languageCode: 'pt-BR', name: 'pt-BR-Wavenet-B', ssmlGender: 'MALE' },
  'nl': { languageCode: 'nl-NL', name: 'nl-NL-Wavenet-B', ssmlGender: 'MALE' },
  'pl': { languageCode: 'pl-PL', name: 'pl-PL-Wavenet-B', ssmlGender: 'MALE' },
  'uk': { languageCode: 'uk-UA', ssmlGender: 'MALE' }, // No specific male voice name — let Google auto-select
  'tr': { languageCode: 'tr-TR', name: 'tr-TR-Wavenet-B', ssmlGender: 'MALE' },
  'hu': { languageCode: 'hu-HU', ssmlGender: 'MALE' }, // No specific male voice name — let Google auto-select
  'cs': { languageCode: 'cs-CZ', ssmlGender: 'MALE' }, // No specific male voice name — let Google auto-select
  'sv': { languageCode: 'sv-SE', name: 'sv-SE-Wavenet-C', ssmlGender: 'MALE' },
  'da': { languageCode: 'da-DK', name: 'da-DK-Wavenet-C', ssmlGender: 'MALE' },
  'no': { languageCode: 'nb-NO', name: 'nb-NO-Wavenet-B', ssmlGender: 'MALE' },
  'fi': { languageCode: 'fi-FI', ssmlGender: 'MALE' }, // No specific male voice name — let Google auto-select
  'el': { languageCode: 'el-GR', ssmlGender: 'MALE' }, // No specific male voice name — let Google auto-select
  'ja': { languageCode: 'ja-JP', name: 'ja-JP-Wavenet-C', ssmlGender: 'MALE' },
  'ko': { languageCode: 'ko-KR', name: 'ko-KR-Wavenet-C', ssmlGender: 'MALE' },
  'zh': { languageCode: 'cmn-CN', name: 'cmn-CN-Wavenet-B', ssmlGender: 'MALE' },
  'ar': { languageCode: 'ar-XA', name: 'ar-XA-Wavenet-B', ssmlGender: 'MALE' },
  'hi': { languageCode: 'hi-IN', name: 'hi-IN-Wavenet-B', ssmlGender: 'MALE' },
  'bg': { languageCode: 'bg-BG', ssmlGender: 'MALE' }, // No specific male voice name — let Google auto-select
  'hr': { languageCode: 'hr-HR', ssmlGender: 'MALE' }, // No specific male voice name — let Google auto-select
  'sk': { languageCode: 'sk-SK', ssmlGender: 'MALE' }, // No specific male voice name — let Google auto-select
};

// ===== VOICE PROFILES — verified against the live Google voice list (19 Aug 2026) =====
//
// Quality ladder:  Standard  <  WaveNet  <  Neural2  <  Chirp3-HD  <  Studio
//
// DECISION: Chirp3-HD for all four site languages.
//   - It is the most human-sounding tier available in ALL of de/en/ro/ru.
//   - Studio was rejected: it does NOT exist for ro-RO or ru-RU (Google returns
//     "400: Voice does not exist"), its free tier is 10x smaller (100k vs 1M)
//     and it costs 10x more ($160 vs ~$30 per 1M characters).
//   - Chirp3-HD free tier: 1.000.000 characters / month, recurring.
//
// Voices below were picked by listening to generated samples
// (see scripts/generate-selected-samples.js).
//
// `ssml: false` => Chirp3-HD voices. They do NOT support SSML tags or the
// `pitch` parameter and would return 400 Bad Request. We send plain text instead —
// which is fine, because those voices generate natural pauses on their own.
type VoiceProfile = {
  languageCode: string;
  name?: string;
  ssmlGender: string;
  ssml: boolean;      // may we send SSML + pitch to this voice?
  fallback?: VoiceProfile;
};

const VOICE_PROFILES: Record<string, VoiceProfile> = {
  'de': {
    languageCode: 'de-DE', name: 'de-DE-Chirp3-HD-Iapetus', ssmlGender: 'MALE', ssml: false,
    // de-DE-Wavenet-B no longer exists; -H is the current male WaveNet voice.
    fallback: { languageCode: 'de-DE', name: 'de-DE-Neural2-H', ssmlGender: 'MALE', ssml: true },
  },
  'en': {
    languageCode: 'en-US', name: 'en-US-Chirp3-HD-Enceladus', ssmlGender: 'MALE', ssml: false,
    fallback: { languageCode: 'en-US', name: 'en-US-Neural2-D', ssmlGender: 'MALE', ssml: true },
  },
  // Romanian: Chirp3-HD is the ONLY male voice family Google offers.
  // The fallback is female because nothing else male exists for ro-RO.
  'ro': {
    languageCode: 'ro-RO', name: 'ro-RO-Chirp3-HD-Enceladus', ssmlGender: 'MALE', ssml: false,
    fallback: { languageCode: 'ro-RO', name: 'ro-RO-Wavenet-B', ssmlGender: 'FEMALE', ssml: true },
  },
  'ru': {
    languageCode: 'ru-RU', name: 'ru-RU-Chirp3-HD-Charon', ssmlGender: 'MALE', ssml: false,
    fallback: { languageCode: 'ru-RU', name: 'ru-RU-Wavenet-D', ssmlGender: 'MALE', ssml: true },
  },
};

// Resolve the best available voice: verified profile first, WaveNet map as last resort.
function resolveVoice(language: string): VoiceProfile {
  if (VOICE_PROFILES[language]) return VOICE_PROFILES[language];
  const w = WAVENET_VOICES[language];
  if (w) return { ...w, ssml: true };
  return VOICE_PROFILES['de'];
}

// Maximum text length per request (Google limit is 5000 bytes for SSML)
// buildSSML() adds <break> tags + <speak><prosody> wrapper which inflates size
// We use 2000 chars to stay safely under 5000 bytes after SSML expansion
const MAX_TEXT_LENGTH = 2000;

// Build SSML with natural pauses between sentences for warm, expressive reading
function buildSSML(text: string): string {
  // Escape XML special characters
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  
  // Add natural pauses after sentence-ending punctuation.
  // NOTE: Neural2 already produces its own natural sentence pauses.
  // Long uniform breaks (500ms) make the reading sound mechanical, so we keep
  // them short and only reinforce the rhythm slightly.
  escaped = escaped.replace(/([.!?])\s+/g, '$1<break time="250ms"/> ');
  
  // Add shorter pauses after commas and semicolons → 120ms
  escaped = escaped.replace(/([,;:])\s+/g, '$1<break time="120ms"/> ');
  
  // Add pause after ellipsis → 450ms for dramatic effect
  escaped = escaped.replace(/(\.\.\.)\s*/g, '$1<break time="450ms"/> ');
  
  // Add pause after em-dash — → 250ms
  escaped = escaped.replace(/(—|–)\s*/g, '$1<break time="250ms"/> ');
  
  // No <prosody> wrapper: rate is already controlled via audioConfig.speakingRate,
  // and forcing pitch here fights the voice's own natural intonation.
  const ssml = `<speak>${escaped}</speak>`;
  
  // Safety check: if SSML exceeds 4900 bytes, fall back to plain text without breaks
  if (new TextEncoder().encode(ssml).length > 4900) {
    const plainEscaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return `<speak>${plainEscaped}</speak>`;
  }
  
  return ssml;
}

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
    const { text, language = 'de', speakingRate = 0.9, blogSlug = null, blogTitle = null, hifi = false } = body;
    const voiceGender = 'male'; // Always use male voice

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Truncate to max length (caller should chunk text before sending)
    const truncatedText = text.substring(0, MAX_TEXT_LENGTH);

    // Select voice based on language (always male) — Neural2 preferred, WaveNet fallback
    const voiceConfig = resolveVoice(language);

    // ===== CACHE LOOKUP: Check if we already have this audio cached =====
    const cacheKey = generateCacheKey(truncatedText, language, voiceGender, speakingRate, voiceConfig.name || '', hifi);
    
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
    //
    // NOTE: Chirp3-HD requests occasionally hang indefinitely. Without an abort
    // signal the serverless function would block until the platform timeout and
    // the player would freeze mid-article. Always bound the request.
    const synthesize = (voice: VoiceProfile) => {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 20000);
      return fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: 'POST',
          signal: ac.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Chirp3-HD / Studio voices reject SSML -> send plain text for them.
            input: voice.ssml ? { ssml: buildSSML(truncatedText) } : { text: truncatedText },
            voice: {
              languageCode: voice.languageCode,
              ...(voice.name && { name: voice.name }),
              ssmlGender: voice.ssmlGender,
            },
            audioConfig: {
              // Pasul 2608002 — CALITATE.
              // Ascultarea pe site foloseste `MP3` (32 kbps): sunt fisiere mici,
              // se incarca repede si e destul pentru difuzorul telefonului.
              // Pentru DESCARCARE trecem pe `MP3_64_KBPS` la 44,1 kHz — cea mai
              // buna calitate MP3 pe care o ofera Google, dublul celei de pana acum.
              audioEncoding: hifi ? 'MP3_64_KBPS' : 'MP3',
              speakingRate: Math.max(0.25, Math.min(4.0, speakingRate)),
              // `pitch` is not supported by Chirp3-HD -> only send it for SSML-capable voices.
              // 0.0 = natural. Lowering it artificially made the voice sound "processed"/robotic.
              ...(voice.ssml && { pitch: 0.0 }),
              volumeGainDb: 0.0, // No gain — avoids clipping the peaks
              sampleRateHertz: hifi ? 44100 : 24000,
              // La descarcare NU mai aplicam corectia pentru difuzor de telefon:
              // ea taie din inalte si din josuri, adica exact ce vrei sa pastrezi
              // cand asculti in casti sau in masina.
              effectsProfileId: hifi ? ['headphone-class-device'] : ['handset-class-device'],
            },
          }),
        }
      ).finally(() => clearTimeout(timer));
    };

    let response = await synthesize(voiceConfig);

    // If the preferred voice is unavailable/rejected, retry once with the fallback voice.
    if (!response.ok && (response.status === 400 || response.status === 404) && voiceConfig.fallback) {
      console.warn(
        `[Google TTS] Voice "${voiceConfig.name}" rejected (${response.status}) — falling back to "${voiceConfig.fallback.name}"`
      );
      response = await synthesize(voiceConfig.fallback);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Google TTS] API error:', response.status, JSON.stringify(errorData));

      // Return specific error for quota exceeded
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'quota_exceeded', message: 'Google Cloud TTS monthly quota exceeded' },
          { status: 429 }
        );
      }

      // Surface Google's real reason so the cause is diagnosable from the browser
      // instead of a bare "403". Google puts it in error.message / error.status.
      const g = (errorData as { error?: { message?: string; status?: string; details?: unknown } }).error;
      const googleMessage = g?.message || 'Unknown Google TTS error';
      const googleStatus = g?.status || String(response.status);

      let hint = '';
      if (response.status === 403) {
        if (/API has not been used|is disabled/i.test(googleMessage)) {
          hint = 'Cloud Text-to-Speech API is not enabled for this Google Cloud project.';
        } else if (/referer|referrer|API_KEY_HTTP_REFERRER|blocked/i.test(googleMessage)) {
          hint = 'The API key has Application restrictions (HTTP referrers). Server-side calls send no referrer. Set Application restrictions to "None".';
        } else if (/billing/i.test(googleMessage)) {
          hint = 'Billing is not enabled on the Google Cloud project.';
        } else if (/API_KEY_SERVICE_BLOCKED|restricted/i.test(googleMessage)) {
          hint = 'The API key API restrictions do not include Cloud Text-to-Speech API.';
        } else {
          hint = 'Check: API enabled, billing active, key restrictions, and that the key value in Vercel is correct.';
        }
      }

      return NextResponse.json(
        {
          error: 'Google Cloud TTS request failed',
          googleStatus,
          googleMessage,
          hint,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const audioContent = data.audioContent;
    
    // ===== SAVE TO CACHE: Store audio for future requests =====
    // Layer 1: Memory cache
    setMemoryCache(cacheKey, audioContent);
    // Layer 2: Supabase DB (async — don't wait for it to return response faster)
    saveToSupabaseCache(cacheKey, audioContent, language, voiceGender, blogSlug, blogTitle).catch(() => {});

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
