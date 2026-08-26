// =====================================================================
// Pasul 2208002 — AUDIO PREGENERAT pentru blogurile dinamice
// =====================================================================
// PROBLEMA rezolvata:
//   Inainte, fiecare cititor care apasa „Play Blog" declansa cereri catre
//   Google Text-to-Speech (cate una la ~1500 de caractere). Exista un cache,
//   dar tot insemna consum si asteptare.
//
// SOLUTIA:
//   Adminul apasa O SINGURA DATA „Generează audio". Textul se transforma
//   in voce, bucatile se lipesc intr-un singur fisier MP3, iar fisierul se
//   urca in Supabase Storage (`blog-audio`). De atunci incolo, cititorii
//   asculta un simplu mp3 — ZERO cost, oricat de multi ar fi.
//
//   Daca articolul NU are audio pregenerat, modalul functioneaza exact ca
//   pana acum (voce ceruta in direct). Nu se strica nimic.
//
// Costul se plateste asadar o singura data, la apasarea butonului, si este
// afisat in admin INAINTE de generare, ca sa nu existe surprize.
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const BUCKET = 'blog-audio';
const MAX_CHUNK_CHARS = 1500; // sub limita de 2000 a rutei /api/tts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function admin() {
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Taie textul in bucati, DOAR la capat de propozitie */
function splitIntoChunks(text: string, max = MAX_CHUNK_CHARS): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= max) return [clean];

  const sentences = clean.match(/[^.!?…]+[.!?…]*\s*/g) ?? [clean];
  const out: string[] = [];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > max && current) {
      out.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

function hashText(text: string, language: string) {
  return crypto.createHash('sha256').update(`${language}|${text}`).digest('hex');
}

// ---------------------------------------------------------------------
// GET — exista audio pregenerat pentru acest articol?
//   /api/blog-audio?slug=...&language=de
// Public: il foloseste modalul „Play Blog".
// ---------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  const language = request.nextUrl.searchParams.get('language') || 'de';
  if (!slug) return NextResponse.json({ audioUrl: null });

  const db = admin();
  if (!db) return NextResponse.json({ audioUrl: null });

  try {
    const { data } = await db
      .from('blog_audio')
      .select('audio_url, char_count, duration, generated_at')
      .eq('slug', slug)
      .eq('language', language)
      .maybeSingle();

    return NextResponse.json({
      audioUrl: data?.audio_url ?? null,
      charCount: data?.char_count ?? 0,
      duration: data?.duration ?? null,
      generatedAt: data?.generated_at ?? null,
    });
  } catch {
    // Tabelul poate sa nu existe inca — nu e o eroare, doar nu avem audio.
    return NextResponse.json({ audioUrl: null });
  }
}

// ---------------------------------------------------------------------
// POST — genereaza audio-ul (DOAR ADMIN)
// body: { slug, title, text, language, speakingRate? }
// ---------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const db = admin();
  if (!db) {
    return NextResponse.json({ error: 'Supabase nu este configurat.' }, { status: 500 });
  }

  // ---- 1) Verificam ca cel care cere este ADMIN --------------------
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Autentificare lipsă.' }, { status: 401 });
  }

  const { data: userData, error: userError } = await db.auth.getUser(token);
  const role = (userData?.user?.app_metadata as { role?: string } | undefined)?.role;
  if (userError || !userData?.user || role !== 'admin') {
    return NextResponse.json({ error: 'Doar administratorul poate genera audio.' }, { status: 403 });
  }

  // ---- 2) Datele articolului ---------------------------------------
  const body = await request.json().catch(() => ({}));
  const slug: string = body?.slug || '';
  const title: string = body?.title || '';
  const language: string = body?.language || 'de';
  const sourceLanguage: string = body?.sourceLanguage || 'ro';
  const rawText: string = (body?.text || '').trim();
  const speakingRate: number = typeof body?.speakingRate === 'number' ? body.speakingRate : 0.9;

  if (!slug || !rawText) {
    return NextResponse.json({ error: 'Lipsesc `slug` sau `text`.' }, { status: 400 });
  }

  const origin = request.nextUrl.origin;

  // ---- 2b) TRADUCEM textul, daca limba ceruta e alta decat originalul ----
  //      Vocea trebuie sa spuna EXACT ce va citi cititorul pe ecran, iar
  //      cititorul vede textul tradus prin DeepL. Traducerea are cache-ul ei,
  //      deci de obicei nu costa nimic in plus.
  let text = rawText;
  if (language !== sourceLanguage) {
    try {
      const tr = await fetch(`${origin}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, targetLang: language, sourceLang: sourceLanguage }),
      });
      const trData = await tr.json().catch(() => ({}));
      if (tr.ok && typeof trData?.translatedText === 'string' && trData.translatedText.trim()) {
        text = trData.translatedText.trim();
      } else {
        // Pasul 2708002 — spunem CAUZA, nu doar ca a esuat.
        // Inainte scria doar „Incearca din nou", iar tu nu aveai de unde sti
        // daca e cota DeepL depasita, cheia lipsa sau textul prea lung.
        const reason =
          (typeof trData?.error === 'string' && trData.error) ||
          (typeof trData?.details === 'string' && trData.details.slice(0, 200)) ||
          `raspuns ${tr.status}`;
        return NextResponse.json(
          { error: `Traducerea in „${language}" a esuat: ${reason}` },
          { status: 502 },
        );
      }
    } catch (e) {
      return NextResponse.json(
        {
          error: `Traducerea in „${language}" nu a putut fi ceruta: ${
            e instanceof Error ? e.message : 'eroare de retea'
          }`,
        },
        { status: 502 },
      );
    }
  }

  const textHash = hashText(text, language);
  // ---- 3) Daca textul este NESCHIMBAT, nu regeneram nimic -----------
  //      (asa nu platesti de doua ori din greseala)
  try {
    const { data: existing } = await db
      .from('blog_audio')
      .select('audio_url, text_hash, char_count')
      .eq('slug', slug)
      .eq('language', language)
      .maybeSingle();

    if (existing?.text_hash === textHash && existing?.audio_url) {
      return NextResponse.json({
        audioUrl: existing.audio_url,
        charCount: existing.char_count,
        reused: true,
        message: 'Textul este neschimbat — s-a păstrat audio-ul existent. Nu s-a consumat nimic.',
      });
    }
  } catch {
    /* tabelul poate lipsi — continuam */
  }

  // ---- 4) Generam bucata cu bucata prin /api/tts (care are cache) ---
  const chunks = splitIntoChunks(text);
  if (!chunks.length) {
    return NextResponse.json({ error: 'Textul este gol.' }, { status: 400 });
  }

  // Refolosim `origin`, declarat mai sus (la traducere).
  const parts: Buffer[] = [];

  for (const chunk of chunks) {
    const res = await fetch(`${origin}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: chunk,
        language,
        speakingRate,
        blogSlug: slug,
        blogTitle: title,
        // Pasul 2608002 — fisierul asta se descarca si se asculta in casti,
        // deci il cerem la cea mai buna calitate pe care o da Google.
        hifi: true,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return NextResponse.json(
        {
          error: `Generarea vocii a eșuat la bucata ${parts.length + 1} din ${chunks.length}.`,
          detail: detail.slice(0, 300),
        },
        { status: 502 },
      );
    }

    const data = await res.json();
    if (!data?.audioContent) {
      return NextResponse.json({ error: 'Google nu a returnat audio.' }, { status: 502 });
    }
    parts.push(Buffer.from(data.audioContent, 'base64'));
  }

  // Cadrele MP3 se pot lipi direct una dupa alta — rezulta un singur fisier.
  const merged = Buffer.concat(parts);

  // ---- 5) Urcam in Storage ------------------------------------------
  const path = `${slug}/${language}.mp3`;
  const { error: uploadError } = await db.storage.from(BUCKET).upload(path, merged, {
    contentType: 'audio/mpeg',
    upsert: true,
    cacheControl: '31536000', // un an — fisierul nu se schimba
  });

  if (uploadError) {
    return NextResponse.json(
      { error: `Fișierul nu a putut fi salvat: ${uploadError.message}` },
      { status: 500 },
    );
  }

  const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
  // `?v=` forteaza reincarcarea cand regeneram acelasi articol
  const audioUrl = `${pub.publicUrl}?v=${textHash.slice(0, 10)}`;

  // ---- 6) Salvam in tabel -------------------------------------------
  const charCount = text.length;
  const { error: dbError } = await db.from('blog_audio').upsert(
    {
      slug,
      language,
      audio_url: audioUrl,
      char_count: charCount,
      text_hash: textHash,
      generated_at: new Date().toISOString(),
    },
    { onConflict: 'slug,language' },
  );

  if (dbError) {
    return NextResponse.json(
      {
        error: `Audio-ul s-a creat, dar nu a putut fi înregistrat: ${dbError.message}. ` +
          `Ai rulat STEP_2208002_BLOG_AUDIO.sql?`,
        audioUrl,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    audioUrl,
    charCount,
    chunks: chunks.length,
    reused: false,
  });
}

// ---------------------------------------------------------------------
// DELETE — sterge audio-ul pregenerat (DOAR ADMIN)
//   /api/blog-audio?slug=...&language=de
// ---------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  const db = admin();
  if (!db) return NextResponse.json({ error: 'Supabase nu este configurat.' }, { status: 500 });

  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const { data: userData } = await db.auth.getUser(token);
  const role = (userData?.user?.app_metadata as { role?: string } | undefined)?.role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Doar administratorul.' }, { status: 403 });
  }

  const slug = request.nextUrl.searchParams.get('slug');
  const language = request.nextUrl.searchParams.get('language') || 'de';
  if (!slug) return NextResponse.json({ error: 'Lipsește `slug`.' }, { status: 400 });

  await db.storage.from(BUCKET).remove([`${slug}/${language}.mp3`]);
  await db.from('blog_audio').delete().eq('slug', slug).eq('language', language);

  return NextResponse.json({ ok: true });
}
