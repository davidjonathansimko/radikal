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
import { splitUnits, pcmFromWav, trimClip, assemble, encodeMp3, type AudioTimings, type Clip } from '@/lib/audioTimings';
import { synthesizeWav } from '@/lib/googleTts';

// Generarea cere zeci de cereri scurte catre Google + codare MP3.
export const maxDuration = 300;

const BUCKET = 'blog-audio';

/**
 * Pasul 2708005 — cand site-ul isi cheama singur propriile adrese.
 *
 * Pe adresele de proba (`...vercel.app`) Vercel pune un paznic in fata
 * intregului site: cine nu e logat primeste pagina lui de intrare. Paznicul
 * nu face diferenta intre un vizitator si site-ul care se cheama pe sine, asa
 * ca si cererile noastre interne erau oprite — de aici erorile la traducere si
 * la generarea vocii, chiar si in romana.
 *
 * Ducem mai departe dovada ca cererea porneste de la tine, care esti deja
 * intrat in cont. Pe adresa adevarata (radikal.blog) paznicul nu exista si
 * nimic nu se schimba.
 */
function internalHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const cookie = request.headers.get('cookie');
  if (cookie) headers.cookie = cookie;
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypass) headers['x-vercel-protection-bypass'] = bypass;
  return headers;
}
const MAX_CHUNK_CHARS = 1500; // sub limita de 2000 a rutei /api/tts
const TTS_PARALLEL = 5;

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
      // Momentele cuvintelor stau langa mp3, in acelasi folder (`<slug>/<limba>.json`).
      timingsUrl: data?.audio_url ? String(data.audio_url).replace('.mp3', '.json') : null,
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
  // 'blog' sau 'marturie' — ca sa se vada in Supabase de unde vine fiecare rand.
  const contentType: string = body?.contentType === 'marturie' ? 'marturie' : 'blog';
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
        headers: internalHeaders(request),
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
  // Continut DINAMIC => audio cu momentele exacte ale cuvintelor. Static => fisier simplu, ca inainte.
  const dynamicMode = body?.dynamic === true;
  // ---- 3) Daca textul este NESCHIMBAT, nu regeneram nimic -----------
  //      (asa nu platesti de doua ori din greseala). La dinamic, audio fara
  //      fisierul cu momente se regenereaza o data.
  let hasTimings = false;
  try {
    const { data: files } = await db.storage.from(BUCKET).list(slug);
    hasTimings = !!files?.some((f) => f.name === `${language}.json`);
  } catch {
    /* ramane fals */
  }
  try {
    const { data: existing } = await db
      .from('blog_audio')
      .select('audio_url, text_hash, char_count')
      .eq('slug', slug)
      .eq('language', language)
      .maybeSingle();

    if (existing?.text_hash === textHash && existing?.audio_url && (!dynamicMode || hasTimings) && !body?.force) {
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

  // ---- 4) Generam vocea ------------------------------------------------
  let merged: Buffer;
  let timings: AudioTimings | null = null;
  let pieces = 0;

  if (dynamicMode) {
    // Propozitii scurte, transformate pe rand in voce: stim exact cand incepe fiecare cuvant.
    const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_CLOUD_TTS_API_KEY lipsește.' }, { status: 503 });
    }
    const { units } = splitUnits(text);
    if (!units.length) {
      return NextResponse.json({ error: 'Textul este gol.' }, { status: 400 });
    }

    const clips: Clip[] = new Array(units.length);
    let next = 0;
    let failure = '';
    await Promise.all(
      Array.from({ length: Math.min(TTS_PARALLEL, units.length) }, async () => {
        while (!failure) {
          const i = next++;
          if (i >= units.length) return;
          try {
            const wav = await synthesizeWav(units[i].text, language, speakingRate, apiKey);
            clips[i] = trimClip(pcmFromWav(wav));
          } catch (e) {
            failure = `Generarea vocii a eșuat la fragmentul ${i + 1} din ${units.length}: ${e instanceof Error ? e.message : 'eroare'}`;
          }
        }
      }),
    );
    if (failure) return NextResponse.json({ error: failure }, { status: 502 });

    const built = assemble(units, clips);
    merged = encodeMp3(built.pcm);
    pieces = units.length;
    timings = {
      v: 1,
      duration: built.pcm.length / 24000,
      words: built.words,
      times: built.timings.map((t) => Math.round(t * 1000) / 1000),
    };
  } else {
    // Sistemul clasic: bucati mari prin /api/tts (cu cache), lipite intr-un singur MP3.
    const chunks = splitIntoChunks(text);
    if (!chunks.length) {
      return NextResponse.json({ error: 'Textul este gol.' }, { status: 400 });
    }
    pieces = chunks.length;
    const parts: Buffer[] = [];

    for (const chunk of chunks) {
      const res = await fetch(`${origin}/api/tts`, {
        method: 'POST',
        headers: internalHeaders(request),
        body: JSON.stringify({
          text: chunk,
          language,
          speakingRate,
          blogSlug: slug,
          blogTitle: title,
          contentType,
          // Fisierul se descarca si se asculta in casti: cea mai buna calitate de la Google.
          hifi: true,
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        const blockedByVercel = detail.includes('vercel_auth_enabled') || detail.includes('sso-api');
        return NextResponse.json(
          {
            error: blockedByVercel
              ? 'Adresa de probă este protejată de Vercel, iar site-ul nu se poate chema pe sine. ' +
                'Încearcă pe adresa adevărată (radikal.blog) sau oprește „Deployment Protection" în Vercel.'
              : `Generarea vocii a eșuat la bucata ${parts.length + 1} din ${chunks.length}.`,
            detail: blockedByVercel ? undefined : detail.slice(0, 300),
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
    merged = Buffer.concat(parts);
  }

  // ---- 5) Urcam in Storage (mp3 + momentele cuvintelor) --------------
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

  if (timings) {
    const { error: timingsError } = await db.storage
      .from(BUCKET)
      .upload(`${slug}/${language}.json`, Buffer.from(JSON.stringify(timings)), {
        contentType: 'application/json',
        upsert: true,
        cacheControl: '31536000',
      });
    if (timingsError) {
      return NextResponse.json(
        { error: `Momentele cuvintelor nu au putut fi salvate: ${timingsError.message}` },
        { status: 500 },
      );
    }
  } else {
    // Un fisier de momente ramas de la o generare dinamica ar fi gresit pentru noul mp3.
    await db.storage.from(BUCKET).remove([`${slug}/${language}.json`]).catch(() => {});
  }

  const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
  // `?v=` forteaza reincarcarea cand regeneram acelasi articol
  const audioUrl = `${pub.publicUrl}?v=${textHash.slice(0, 10)}`;

  // ---- 6) Salvam in tabel -------------------------------------------
  const charCount = text.length;
  const audioRow = {
    slug,
    language,
    audio_url: audioUrl,
    char_count: charCount,
    text_hash: textHash,
    content_type: contentType,
    generated_at: new Date().toISOString(),
  };
  let { error: dbError } = await db
    .from('blog_audio')
    .upsert(audioRow, { onConflict: 'slug,language' });

  // Coloana noua poate lipsi daca SQL-ul nu a fost inca rulat.
  if (dbError && (dbError.code === '42703' || dbError.code === 'PGRST204')) {
    const { content_type: _omit, ...withoutType } = audioRow;
    ({ error: dbError } = await db
      .from('blog_audio')
      .upsert(withoutType, { onConflict: 'slug,language' }));
  }

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
    chunks: pieces,
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

  await db.storage.from(BUCKET).remove([`${slug}/${language}.mp3`, `${slug}/${language}.json`]);
  await db.from('blog_audio').delete().eq('slug', slug).eq('language', language);

  return NextResponse.json({ ok: true });
}
