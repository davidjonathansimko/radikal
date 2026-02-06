// Search API Endpoint / Such-API-Endpunkt / Endpoint API Căutare
// Full-text search for blog posts with multilingual support
// Volltextsuche für Blog-Posts mit mehrsprachiger Unterstützung
// Căutare full-text pentru postări blog cu suport multilingv

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET handler for search / GET-Handler für Suche
export async function GET(request: NextRequest) {
  try {
    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials missing');
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        results: []
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const language = searchParams.get('lang') || 'de';

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        results: [],
        total: 0,
        message: 'Query too short'
      });
    }

    const cleanQuery = query.trim().toLowerCase();
    const searchTerms = cleanQuery.split(/\s+/).filter(term => term.length >= 2);

    if (searchTerms.length === 0) {
      return NextResponse.json({ success: true, results: [], total: 0 });
    }

    const term = searchTerms[0];
    const escapedTerm = term.replace(/[%_]/g, '\\$&');
    
    // FUZZY SEARCH: Create variations for partial matching
    // "Jesus" should find "Jesu", "Jes" should find "Jesus", etc.
    // Generates: original term + progressively shorter versions (min 2 chars)
    const fuzzyTerms: string[] = [escapedTerm];
    
    // Add shorter versions (for when user types more than exists in DB)
    // e.g., "Jesus" → "Jesu", "Jes", "Je"
    for (let i = escapedTerm.length - 1; i >= 2; i--) {
      fuzzyTerms.push(escapedTerm.substring(0, i));
    }
    
    // Build OR conditions for all fuzzy terms
    const fuzzyConditions = fuzzyTerms.flatMap(t => [
      `title.ilike.%${t}%`,
      `title_en.ilike.%${t}%`,
      `excerpt.ilike.%${t}%`,
      `excerpt_en.ilike.%${t}%`
    ]).join(',');
    
    console.log(`🔍 Fuzzy search terms: ${fuzzyTerms.join(', ')}`);

    // Search in blog_posts table with fuzzy matching
    // This covers Romanian (original) and English translations
    const { data: directResults, error: directError } = await supabase
      .from('blog_posts')
      .select('id, title, title_en, excerpt, excerpt_en, image_url, created_at, slug')
      .eq('published', true)
      .or(fuzzyConditions)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (directError) {
      console.error('Direct search error:', directError);
    }

    // For ALL non-Romanian languages, also search in translation_cache
    // Dies ermöglicht die Suche nach übersetzten Inhalten
    // Uses fuzzy search terms for better matching
    let cacheResults: string[] = []; // Will contain matched original texts
    
    if (language !== 'ro') {
      console.log(`🔍 Searching translation_cache for fuzzy terms in ${language}...`);
      
      // Search for all fuzzy term variations in translation cache
      for (const fuzzyTerm of fuzzyTerms.slice(0, 5)) { // Limit to first 5 variations
        const { data: translations, error: cacheError } = await supabase
          .from('translation_cache')
          .select('original_text, translated_text')
          .eq('target_lang', language)
          .ilike('translated_text', `%${fuzzyTerm}%`)
          .limit(10);

        if (cacheError) {
          console.error('Translation cache search error:', cacheError);
          continue;
        }
        
        if (translations && translations.length > 0) {
          console.log(`📦 Found ${translations.length} matches for "${fuzzyTerm}"`);
          // Extract the original texts that had matching translations
          const newResults = translations.map(t => t.original_text.substring(0, 100));
          cacheResults = [...cacheResults, ...newResults];
        }
        
        // Stop if we found enough results
        if (cacheResults.length >= 10) break;
      }
      
      // Remove duplicates
      cacheResults = Array.from(new Set(cacheResults));
      console.log(`📦 Total translation cache matches: ${cacheResults.length}`);
    }

    // If we found matches in translation cache, search blog posts by those original texts
    let additionalPosts: typeof directResults = [];
    
    if (cacheResults.length > 0) {
      console.log('🔍 Searching blog posts using cached original texts...');
      
      // Search for posts that contain any of these original text snippets
      for (const originalSnippet of cacheResults.slice(0, 5)) {
        // Use only first few words for more flexible matching
        const words = originalSnippet.split(/\s+/).slice(0, 3).join(' ');
        const snippet = words.replace(/[%_]/g, '\\$&');
        
        console.log(`🔍 Searching for: "${snippet}"`);
        
        const { data: matchedPosts, error: matchError } = await supabase
          .from('blog_posts')
          .select('id, title, title_en, excerpt, excerpt_en, image_url, created_at, slug')
          .eq('published', true)
          .or(`title.ilike.%${snippet}%,excerpt.ilike.%${snippet}%`)
          .limit(3);
        
        if (matchError) {
          console.error('Match error:', matchError);
        }
        
        console.log(`📋 Found ${matchedPosts?.length || 0} posts`);
        
        if (matchedPosts && matchedPosts.length > 0) {
          additionalPosts = [...(additionalPosts || []), ...matchedPosts];
        } else {
          // Try with just the first significant word (skip common words)
          const significantWords = originalSnippet.split(/\s+/).filter(w => w.length > 3);
          if (significantWords.length > 0) {
            const firstWord = significantWords[0].replace(/[%_]/g, '\\$&');
            console.log(`🔍 Fallback search with word: "${firstWord}"`);
            
            const { data: fallbackPosts } = await supabase
              .from('blog_posts')
              .select('id, title, title_en, excerpt, excerpt_en, image_url, created_at, slug')
              .eq('published', true)
              .or(`title.ilike.%${firstWord}%,excerpt.ilike.%${firstWord}%`)
              .limit(3);
            
            if (fallbackPosts && fallbackPosts.length > 0) {
              additionalPosts = [...(additionalPosts || []), ...fallbackPosts];
            }
          }
        }
      }
    }

    // Combine and deduplicate results
    const allPosts = [...(directResults || []), ...(additionalPosts || [])];
    const uniquePosts = allPosts.filter((post, index, self) => 
      index === self.findIndex(p => p.id === post.id)
    );

    // Score results based on search term matches
    const scoredResults = uniquePosts.map(post => {
      let score = 0;
      const title = (post.title || '').toLowerCase();
      const titleEn = (post.title_en || '').toLowerCase();
      const excerpt = (post.excerpt || '').toLowerCase();
      const excerptEn = (post.excerpt_en || '').toLowerCase();
      
      searchTerms.forEach(term => {
        if (title.includes(term)) score += 100;
        if (titleEn.includes(term)) score += 90;
        if (excerpt.includes(term)) score += 30;
        if (excerptEn.includes(term)) score += 25;
      });
      
      // Boost if found via translation cache
      if (cacheResults.some(orig => title.includes(orig.substring(0, 30).toLowerCase()))) {
        score += 50;
      }
      
      return { ...post, relevanceScore: score };
    });

    scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({
      success: true,
      results: scoredResults.slice(0, limit),
      total: scoredResults.length,
      query: query,
      searchTerms: searchTerms,
      language: language
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}
