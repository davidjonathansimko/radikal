/**
 * Pasul A18 — INREGISTRARI PROPRII pe limbi.
 *
 * Ideea, pe scurt:
 *  - la un blog poti incarca vocea TA pentru anumite limbi;
 *  - in limbile in care ai incarcat, se aude inregistrarea ta;
 *  - in celelalte limbi se genereaza TTS, ca pana acum;
 *  - stergi inregistrarea → blogul revine SINGUR la TTS;
 *  - incarci peste TTS → se aude a ta, dar TTS-ul ramane salvat in cache,
 *    deci nu trebuie generat (si platit) din nou.
 *
 * Tabelul se creeaza cu `STEP_A18_CUSTOM_AUDIO.sql`.
 * Daca SQL-ul nu a fost rulat, toate functiile de aici se comporta ca si
 * cum n-ar exista nicio inregistrare — site-ul merge exact ca inainte.
 */

import { getSupabaseClient } from '@/lib/supabase';

export const AUDIO_LANGS = ['ro', 'de', 'en', 'ru'] as const;
export type AudioLang = (typeof AUDIO_LANGS)[number];

export const AUDIO_LANG_LABELS: Record<AudioLang, string> = {
  ro: 'Română',
  de: 'Deutsch',
  en: 'English',
  ru: 'Русский',
};

export interface CustomAudio {
  id: string;
  blog_id: string;
  lang: string;
  audio_url: string;
  duration: number | null;
  file_name: string | null;
}

const BUCKET = 'blog-audio';

/** Toate inregistrarile proprii ale unui blog, pe limbi. */
export async function fetchCustomAudio(blogId: string): Promise<CustomAudio[]> {
  if (!blogId) return [];
  try {
    const { data, error } = await getSupabaseClient()
      .from('blog_custom_audio')
      .select('id, blog_id, lang, audio_url, duration, file_name')
      .eq('blog_id', blogId);
    if (error) return [];
    return (data ?? []) as CustomAudio[];
  } catch {
    return [];
  }
}

/**
 * Inregistrarea proprie pentru o anumita limba, daca exista.
 * Intoarce `null` daca nu exista → cel care intreaba stie ca merge pe TTS.
 */
export async function fetchCustomAudioForLang(
  blogId: string,
  lang: string,
): Promise<CustomAudio | null> {
  if (!blogId) return null;
  try {
    const { data, error } = await getSupabaseClient()
      .from('blog_custom_audio')
      .select('id, blog_id, lang, audio_url, duration, file_name')
      .eq('blog_id', blogId)
      .eq('lang', lang)
      .maybeSingle();
    if (error) return null;
    return (data as CustomAudio) ?? null;
  } catch {
    return null;
  }
}

/**
 * Incarca un fisier audio si il leaga de blog + limba.
 * Daca exista deja una pentru limba respectiva, o INLOCUIESTE.
 */
export async function uploadCustomAudio(
  blogId: string,
  lang: string,
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const sb = getSupabaseClient();

  // Numele fisierului contine limba si ora, ca sa nu se suprascrie din greseala
  // si ca browserul sa nu serveasca din cache o inregistrare veche.
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3';
  const path = `${blogId}/${lang}-${Date.now()}.${ext}`;

  const { error: upErr } = await sb.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || 'audio/mpeg' });

  if (upErr) return { ok: false, error: upErr.message };

  const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
  const url = pub.publicUrl;

  // Masuram durata in browser, ca sa putem sincroniza textul de la inceput
  const duration = await readAudioDuration(file);

  const { error: dbErr } = await sb
    .from('blog_custom_audio')
    .upsert(
      {
        blog_id: blogId,
        lang,
        audio_url: url,
        duration,
        file_name: file.name,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'blog_id,lang' },
    );

  if (dbErr) return { ok: false, error: dbErr.message };
  return { ok: true, url };
}

/**
 * Sterge inregistrarea proprie pentru o limba.
 * Blogul revine automat la TTS — nu mai e nimic de facut in plus.
 */
export async function deleteCustomAudio(
  blogId: string,
  lang: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await getSupabaseClient()
    .from('blog_custom_audio')
    .delete()
    .eq('blog_id', blogId)
    .eq('lang', lang);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Citeste durata unui fisier audio, fara sa il trimita nicaieri. */
function readAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        const d = Number.isFinite(audio.duration) ? audio.duration : null;
        URL.revokeObjectURL(url);
        resolve(d);
      };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      audio.src = url;
    } catch {
      resolve(null);
    }
  });
}
