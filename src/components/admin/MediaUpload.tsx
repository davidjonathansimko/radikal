// Pasul 2108002 — incarcarea fisierelor din calculator in Supabase Storage
//
// Inlocuieste campurile in care trebuia lipit un URL. Utilizatorul alege
// un fisier de pe calculator, acesta se incarca in bucket-ul `reels-media`
// si se salveaza URL-ul public rezultat.
//
// Se foloseste DOAR in panoul de admin, deci nu ingreuneaza cu nimic
// aplicatia pentru vizitatori sau utilizatori normali.

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';

const BUCKET = 'reels-media';

interface MediaUploadProps {
  label: string;
  /** 'audio' sau 'image' */
  kind: 'audio' | 'image';
  /** URL-ul curent (poate fi gol) */
  value: string;
  onChange: (url: string) => void;
  /** limita in MB */
  maxSizeMb?: number;
}

export default function MediaUpload({
  label,
  kind,
  value,
  onChange,
  maxSizeMb = kind === 'audio' ? 15 : 8,
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState('');

  // Pasul 2208001 — previzualizare LOCALA.
  // Fisierul ales de pe calculator se poate asculta imediat, chiar daca
  // link-ul din Supabase inca nu e disponibil (bucket neprublic, cache CDN
  // care nu s-a propagat inca etc.). Asa nu mai vezi niciodata „0:00 / 0:00".
  const [localUrl, setLocalUrl] = useState('');

  // Eliberam memoria cand componenta dispare sau cand se schimba fisierul
  useEffect(() => {
    return () => {
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [localUrl]);

  const accept = kind === 'audio' ? 'audio/*' : 'image/*';

  const handleFile = async (file: File) => {
    setError('');

    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`Fișierul este prea mare (max. ${maxSizeMb} MB).`);
      return;
    }

    // Previzualizare instantanee, inainte de orice cerere de retea
    setLocalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });

    setUploading(true);
    setProgressText('Se încarcă…');

    try {
      const supabase = createClient();

      // Nume unic, fara diacritice si fara spatii
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const safeName = file.name
        .replace(/\.[^.]+$/, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
        .slice(0, 40) || 'fisier';
      const path = `${kind}/${Date.now()}-${safeName}.${ext}`;

      // Pasul 2208001 — BUG „melodia arata 00:00 si Play nu face nimic":
      // fara `contentType`, Supabase Storage servea fisierul ca
      // `application/octet-stream` / `text/plain`, iar browserul refuza
      // sa-l decodeze, deci durata ramanea 00:00.
      // Unele browsere lasa `file.type` gol -> il deducem din extensie.
      const AUDIO_TYPES: Record<string, string> = {
        mp3: 'audio/mpeg',
        m4a: 'audio/mp4',
        aac: 'audio/aac',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        oga: 'audio/ogg',
        opus: 'audio/ogg',
        flac: 'audio/flac',
        webm: 'audio/webm',
      };
      const IMAGE_TYPES: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
        avif: 'image/avif',
      };
      const contentType =
        file.type ||
        (kind === 'audio' ? AUDIO_TYPES[ext] : IMAGE_TYPES[ext]) ||
        'application/octet-stream';

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: '31536000',
          upsert: false,
          contentType,
        });

      if (upErr) {
        setError(`Încărcarea a eșuat: ${upErr.message}`);
        return;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = data.publicUrl;

      // -------------------------------------------------------------
      // Pasul 2208001 (a doua incercare) — VERIFICAM chiar link-ul.
      // `getPublicUrl` construieste doar un sir de caractere; el NU
      // garanteaza ca fisierul chiar poate fi citit. Daca bucket-ul
      // `reels-media` NU este public, link-ul raspunde cu un JSON de
      // eroare, iar <audio> arata linistit „0:00 / 0:00" fara sa spuna
      // nimic. De aceea il testam si spunem exact ce e de facut.
      // -------------------------------------------------------------
      let reachable = false;
      let serverType = '';
      try {
        const check = await fetch(publicUrl, { method: 'GET', cache: 'no-store' });
        serverType = check.headers.get('content-type') || '';
        reachable = check.ok && !serverType.includes('application/json');
      } catch {
        reachable = false;
      }

      if (!reachable) {
        setError(
          `Fișierul s-a urcat, dar link-ul public nu poate fi citit` +
            (serverType ? ` (server: ${serverType})` : '') +
            `. În Supabase → Storage → bucket „${BUCKET}" trebuie bifat „Public bucket".`,
        );
        // Totusi pastram URL-ul: previzualizarea locala functioneaza.
      } else if (kind === 'audio' && serverType && !serverType.startsWith('audio/')) {
        setError(
          `Fișierul este servit ca „${serverType}", nu ca audio. ` +
            `Șterge-l din Storage și încarcă-l din nou (acum se trimite tipul corect).`,
        );
      }

      onChange(publicUrl);
      setProgressText(reachable ? 'Încărcat ✓' : 'Încărcat (vezi avertismentul)');
      setTimeout(() => setProgressText(''), 3500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare necunoscută la încărcare.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-w-0">
      <label className="block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1">
        {label}
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-black/20 dark:border-white/20 px-3 py-2 text-sm font-medium text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Se încarcă…' : 'Alege fișier'}
        </button>

        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Elimină
          </button>
        )}

        {progressText && (
          <span className="text-xs text-green-600 dark:text-green-400">{progressText}</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />

      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {value && (
        <p className="mt-1 truncate text-xs text-black/45 dark:text-white/45" title={value}>
          {value.split('/').pop()}
        </p>
      )}

      {(localUrl || value) && kind === 'audio' && (
        // `key` forteaza reincarcarea elementului cand se schimba
        // fisierul — altfel browserul pastra durata veche (00:00).
        // Preferam `localUrl` (fisierul de pe calculator) pentru ca el
        // functioneaza mereu, indiferent de setarile bucket-ului.
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio
          key={localUrl || value}
          src={localUrl || value}
          controls
          preload="metadata"
          className="mt-2 w-full"
        />
      )}

      {value && kind === 'audio' && (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-xs underline text-black/50 dark:text-white/50"
        >
          Deschide link-ul salvat într-o filă nouă (test)
        </a>
      )}

    </div>
  );
}
