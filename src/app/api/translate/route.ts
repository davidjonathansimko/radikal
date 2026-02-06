// DeepL Translation API Route with Supabase Caching
// DeepL Übersetzungs-API-Route mit Supabase-Caching
// Rută API pentru traducere DeepL cu cache în Supabase

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// DeepL API configuration / DeepL API Konfiguration / Configurare DeepL API
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = 'https://api.deepl.com/v2/translate';

// Supabase client for caching / Supabase-Client für Caching / Client Supabase pentru cache
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Language code mapping / Sprachcode-Zuordnung / Mapare coduri limbă
// RADIKAL uses: de, en, ro, ru
// DeepL uses: DE, EN, RO, RU (uppercase)
const languageMap: Record<string, string> = {
  de: 'DE',
  en: 'EN',
  ro: 'RO',
  ru: 'RU',
};

// Generate hash for text (for cache lookup) / Hash für Text generieren (für Cache-Suche)
function generateTextHash(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

// Check cache for existing translation / Cache auf vorhandene Übersetzung prüfen
async function getCachedTranslation(text: string, sourceLang: string, targetLang: string): Promise<string | null> {
  if (!supabase) return null;
  
  try {
    const hash = generateTextHash(text);
    const { data, error } = await supabase
      .from('translation_cache')
      .select('translated_text')
      .eq('original_text_hash', hash)
      .eq('source_lang', sourceLang)
      .eq('target_lang', targetLang)
      .single();
    
    if (error || !data) return null;
    
    console.log('📦 Cache HIT: Found cached translation');
    return data.translated_text;
  } catch {
    return null;
  }
}

// Save translation to cache / Übersetzung im Cache speichern
async function cacheTranslation(originalText: string, translatedText: string, sourceLang: string, targetLang: string): Promise<void> {
  if (!supabase) return;
  
  try {
    const hash = generateTextHash(originalText);
    // Store first 1000 chars of original for debugging
    const originalSnippet = originalText.substring(0, 1000);
    
    await supabase
      .from('translation_cache')
      .upsert({
        original_text_hash: hash,
        source_lang: sourceLang,
        target_lang: targetLang,
        original_text: originalSnippet,
        translated_text: translatedText,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'original_text_hash,source_lang,target_lang'
      });
    
    console.log('💾 Cache SAVED: Translation cached for future use');
  } catch (error) {
    console.warn('Failed to cache translation:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured / Prüfen ob API-Key konfiguriert / Verifică dacă API key este configurat
    if (!DEEPL_API_KEY) {
      console.error('❌ DeepL API key not configured');
      return NextResponse.json(
        { error: 'Translation service not configured' },
        { status: 500 }
      );
    }

    // Parse request body / Anfragekörper parsen / Parsează corpul cererii
    const body = await request.json();
    const { text, targetLang, sourceLang = 'ro', autoDetect = false } = body;

    // Validate input / Eingabe validieren / Validează input-ul
    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields: text and targetLang' },
        { status: 400 }
      );
    }

    // Convert language code / Sprachcode konvertieren / Convertește codul limbii
    const deepLTargetLang = languageMap[targetLang] || targetLang.toUpperCase();
    const deepLSourceLang = languageMap[sourceLang] || sourceLang?.toUpperCase() || 'RO';
    
    // Skip translation if source equals target
    if (deepLSourceLang === deepLTargetLang) {
      return NextResponse.json({ translatedText: text });
    }

    // Handle single text or array / Einzeltext oder Array behandeln
    const textsToTranslate = Array.isArray(text) ? text : [text];
    const translatedTexts: string[] = [];
    const textsNeedingTranslation: { index: number; text: string }[] = [];

    // Check cache for each text / Cache für jeden Text prüfen
    console.log(`🔍 Checking cache for ${textsToTranslate.length} text(s)...`);
    
    for (let i = 0; i < textsToTranslate.length; i++) {
      const t = textsToTranslate[i];
      if (!t || t.trim() === '') {
        translatedTexts[i] = t;
        continue;
      }
      
      // Try cache first (only if not auto-detecting)
      if (!autoDetect) {
        const cached = await getCachedTranslation(t, sourceLang, targetLang);
        if (cached) {
          translatedTexts[i] = cached;
          continue;
        }
      }
      
      // Mark for translation
      textsNeedingTranslation.push({ index: i, text: t });
    }

    // If all texts were cached, return immediately
    if (textsNeedingTranslation.length === 0) {
      console.log('✅ All translations served from cache!');
      return NextResponse.json({
        translatedText: Array.isArray(text) ? translatedTexts : translatedTexts[0],
        fromCache: true,
      });
    }

    console.log(`🌐 DeepL: Translating ${textsNeedingTranslation.length} new text(s) to ${deepLTargetLang}...`);

    // Call DeepL API for uncached texts
    const requestBody: Record<string, unknown> = {
      text: textsNeedingTranslation.map(t => t.text),
      target_lang: deepLTargetLang,
    };
    
    if (!autoDetect) {
      requestBody.source_lang = deepLSourceLang;
    }

    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DeepL API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Translation failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Process results and cache them
    for (let i = 0; i < textsNeedingTranslation.length; i++) {
      const { index, text: originalText } = textsNeedingTranslation[i];
      const translatedText = data.translations[i]?.text || originalText;
      
      translatedTexts[index] = translatedText;
      
      // Cache the translation (in background, don't await)
      const detectedLang = data.translations[i]?.detected_source_language?.toLowerCase() || sourceLang;
      cacheTranslation(originalText, translatedText, autoDetect ? detectedLang : sourceLang, targetLang);
    }
    
    console.log(`✅ DeepL: Translation successful (${textsNeedingTranslation.length} new, ${textsToTranslate.length - textsNeedingTranslation.length} cached)`);

    return NextResponse.json({
      translatedText: Array.isArray(text) ? translatedTexts : translatedTexts[0],
      detectedSourceLang: data.translations[0]?.detected_source_language,
      fromCache: false,
      cachedCount: textsToTranslate.length - textsNeedingTranslation.length,
      translatedCount: textsNeedingTranslation.length,
    });

  } catch (error) {
    console.error('❌ DeepL Translation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing / GET-Endpunkt zum Testen / Endpoint GET pentru testare
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'DeepL Translation API with Caching is running',
    configured: !!DEEPL_API_KEY,
    cacheEnabled: !!supabase,
  });
}
