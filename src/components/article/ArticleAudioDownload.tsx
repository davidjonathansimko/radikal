/**
 * Pasul 2708006 — DESCĂRCARE DIRECTĂ, doar pentru admin.
 *
 * Până acum, ca să iei articolul în MP3 trebuia să intri în meniul de
 * administrare, să cauți articolul, să bifezi limba și abia apoi să descarci.
 * Acum butonul stă chiar lângă „Îmi place", pe pagina articolului.
 *
 * Descarcă în limba în care citești ACUM. Dacă vocea încă nu a fost făcută
 * pentru limba asta, te întreabă întâi și abia apoi o face — o singură dată,
 * după care rămâne salvată.
 *
 * Cititorii obișnuiți nu văd absolut nimic din toate astea.
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { isAdminUser } from '@/lib/isAdmin';
import { buildAudioFileName } from '@/lib/audioFilename';
import { fetchCustomAudioForLang } from '@/lib/customAudio';

interface ArticleAudioDownloadProps {
  /** Adresa articolului, cu prefixul mărturiilor deja pus */
  audioSlug: string;
  /** Numărul articolului — pentru înregistrarea ta, dacă ai încărcat una */
  postId: string;
  /** Titlul, așa cum se vede acum (intră în numele fișierului) */
  title: string;
  /** Textul, exact cum se citește acum pe ecran */
  text: string;
  language: string;
  createdAt?: string | null;
  contentType: 'blog' | 'marturie';
}

const LABELS: Record<string, { download: string; making: string; ask: string; fail: string }> = {
  de: {
    download: 'MP3 herunterladen',
    making: 'Wird erstellt…',
    ask: 'Für diese Sprache gibt es noch keine Stimme. Jetzt einmalig erstellen?',
    fail: 'Download fehlgeschlagen',
  },
  en: {
    download: 'Download MP3',
    making: 'Creating…',
    ask: 'There is no voice for this language yet. Create it once now?',
    fail: 'Download failed',
  },
  ro: {
    download: 'Descarcă MP3',
    making: 'Se face…',
    ask: 'Pentru limba asta încă nu există voce. O facem acum, o singură dată?',
    fail: 'Descărcarea a eșuat',
  },
  ru: {
    download: 'Скачать MP3',
    making: 'Создаётся…',
    ask: 'Для этого языка ещё нет голоса. Создать его сейчас?',
    fail: 'Не удалось скачать',
  },
};

export default function ArticleAudioDownload({
  audioSlug,
  postId,
  title,
  text,
  language,
  createdAt = null,
  contentType,
}: ArticleAudioDownloadProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const t = LABELS[language] || LABELS.de;

  useEffect(() => {
    let alive = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (alive) setIsAdmin(isAdminUser(data.user));
    });
    return () => {
      alive = false;
    };
  }, []);

  const saveFile = useCallback(
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(t.fail);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = buildAudioFileName(title, createdAt, language);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
    },
    [title, createdAt, language, t.fail],
  );

  const handleDownload = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      // 1) Înregistrarea ta are întâietate — dacă ai urcat una, aia se aude.
      const mine = await fetchCustomAudioForLang(postId, language);
      if (mine?.audio_url) {
        await saveFile(mine.audio_url);
        return;
      }

      // 2) Vocea generată, dacă a fost deja făcută
      const look = await fetch(
        `/api/blog-audio?slug=${encodeURIComponent(audioSlug)}&language=${encodeURIComponent(language)}`,
      );
      const found = await look.json().catch(() => ({}));
      if (found?.audioUrl) {
        await saveFile(found.audioUrl);
        return;
      }

      // 3) Nu există încă — o facem acum, cu acordul tău
      if (!window.confirm(t.ask)) return;

      const supabase = createClient();
      const { data: sess } = await supabase.auth.getSession();
      const res = await fetch('/api/blog-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sess.session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          slug: audioSlug,
          title,
          text,
          language,
          // Textul de aici este DEJA în limba citită, deci nu mai are ce traduce.
          sourceLanguage: language,
          contentType,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.audioUrl) {
        throw new Error([data?.error, data?.detail].filter(Boolean).join(' — ') || t.fail);
      }
      await saveFile(data.audioUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.fail);
    } finally {
      setBusy(false);
    }
  }, [audioSlug, postId, title, text, language, contentType, saveFile, t.ask, t.fail]);

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleDownload}
        disabled={busy}
        className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-all duration-200 hover:bg-gray-300 hover:text-gray-900 disabled:opacity-50 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20 dark:hover:text-white"
        title={`${t.download} (${language.toUpperCase()})`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
        <span>{busy ? t.making : `${t.download} · ${language.toUpperCase()}`}</span>
      </button>
      {error && <p className="max-w-xs text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
