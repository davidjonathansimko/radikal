'use client';

// =====================================================================
// Pasul 2208002 (punctul 3) — GENERAREA AUDIO-ULUI, O SINGURĂ DATĂ
// =====================================================================
// De ce exista acest buton:
//   Inainte, fiecare cititor care apasa „Play Blog" declansa cereri catre
//   Google Text-to-Speech. Cu multi cititori si multe limbi, asta inseamna
//   consum repetat.
//
//   Acum: apesi TU o singura data pe „Generează audio". Fisierul mp3 se
//   salveaza in Supabase Storage, iar cititorii asculta un simplu fisier —
//   COST ZERO, oricat de multi ar fi si oricat de des ar asculta.
//
// Protectii impotriva cheltuielilor din greseala:
//   • se arata NUMARUL DE CARACTERE inainte de apasare
//   • se cere o CONFIRMARE explicita
//   • daca textul nu s-a schimbat, NU se regenereaza nimic
//   • butonul se blocheaza cat timp lucreaza, ca sa nu apesi de doua ori
// =====================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { buildAudioFileName } from '@/lib/audioFilename';

interface BlogAudioGeneratorProps {
  slug: string;
  title: string;
  /** Textul articolului, exact cum va fi citit */
  text: string;
  /** Limba in care este SCRIS articolul (la noi: română) */
  language?: string;
  /** Data crearii blogului (ISO) — intra in numele fisierelor descarcate */
  createdAt?: string | null;
  /**
   * Pasul A18 — limbile in care ai incarcat inregistrarea TA.
   * In ele NU se mai genereaza TTS: butonul e blocat si scrie de ce.
   */
  customAudioLangs?: string[];
}

/** Limbile site-ului */
const LANGS: { code: string; name: string }[] = [
  { code: 'ro', name: 'Română' },
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
];

interface AudioInfo {
  audioUrl: string | null;
  charCount?: number;
  generatedAt?: string | null;
}

export default function BlogAudioGenerator({
  slug,
  title,
  text,
  language = 'ro',
  createdAt = null,
  customAudioLangs = [],
}: BlogAudioGeneratorProps) {
  /** Ce audio exista, pentru fiecare limba */
  const [infoByLang, setInfoByLang] = useState<Record<string, AudioInfo | null>>({});
  /** Limbile bifate pentru generare — implicit doar limba originalului */
  const [selected, setSelected] = useState<string[]>([language]);
  const [openLang, setOpenLang] = useState<string>(language);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const charCount = text.trim().length;
  // Aproximare pentru asteptare: ~1500 de caractere pe cerere
  const requests = Math.max(1, Math.ceil(charCount / 1500));

  // --- Descarcare audio (doar admin) --------------------------------
  /** Limbile bifate pentru DESCARCARE (separate de cele pentru generare) */
  const [dlSelected, setDlSelected] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);

  const toggleDownload = (code: string) =>
    setDlSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  /** Limbile care au deja audio generat — doar acelea pot fi descarcate */
  const availableForDownload = LANGS.filter((l) => infoByLang[l.code]?.audioUrl);

  /**
   * Descarca fisierele audio pentru limbile bifate.
   * Descarcam prin `blob` (nu link direct) ca sa putem impune numele fisierului
   * — altfel browserul ar salva `ro.mp3`, fara titlu si fara data.
   */
  const downloadSelected = async () => {
    const langs = dlSelected.filter((c) => infoByLang[c]?.audioUrl);
    if (!langs.length) return;

    setDownloading(true);
    setError('');
    setMessage('');

    try {
      for (const code of langs) {
        const url = infoByLang[code]?.audioUrl;
        if (!url) continue;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Nu am putut descărca audio-ul pentru ${code}`);

        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = buildAudioFileName(title, createdAt, code);
        document.body.appendChild(a);
        a.click();
        a.remove();
        // Eliberam memoria dupa ce browserul a apucat sa porneasca descarcarea
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);

        // Mica pauza: unele browsere blocheaza descarcarile multiple prea rapide
        await new Promise((r) => setTimeout(r, 600));
      }
      setMessage(`Descărcat: ${langs.length} fișier(e).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Descărcarea a eșuat.');
    } finally {
      setDownloading(false);
    }
  };

  // --- Ce audio exista deja, in fiecare limba? ----------------------
  const refresh = useCallback(async () => {
    if (!slug) return;
    const next: Record<string, AudioInfo | null> = {};
    await Promise.all(
      LANGS.map(async (l) => {
        try {
          const res = await fetch(
            `/api/blog-audio?slug=${encodeURIComponent(slug)}&language=${l.code}`,
          );
          next[l.code] = await res.json();
        } catch {
          next[l.code] = null;
        }
      }),
    );
    setInfoByLang(next);
  }, [slug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // --- Token-ul adminului, pentru ca serverul sa stie cine cere ------
  const getToken = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? '';
  }, []);

  const toggleLang = (code: string) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  // --- Generare ------------------------------------------------------
  const generate = useCallback(async () => {
    setError('');
    setMessage('');

    if (!slug) {
      setError('Salvează întâi articolul, ca să aibă un „slug".');
      return;
    }
    if (charCount < 20) {
      setError('Textul este prea scurt.');
      return;
    }
    if (!selected.length) {
      setError('Bifează cel puțin o limbă.');
      return;
    }

    const names = selected.map((c) => LANGS.find((l) => l.code === c)?.name ?? c).join(', ');
    const ok = window.confirm(
      `Se va genera vocea pentru „${title || slug}".\n\n` +
        `Limbi: ${names}\n` +
        `Caractere: ${charCount.toLocaleString('ro-RO')} × ${selected.length}\n` +
        `Cereri către Google: ${requests * selected.length}\n\n` +
        `Se face O SINGURĂ DATĂ. După aceea, toți cititorii ascultă fișierul ` +
        `salvat, fără niciun cost suplimentar.\n\nContinui?`,
    );
    if (!ok) return;

    setBusy(true);
    const done: string[] = [];
    const failed: string[] = [];

    try {
      const token = await getToken();

      // Una cate una, ca sa nu suprasolicitam nici Google, nici DeepL
      for (const code of selected) {
        const name = LANGS.find((l) => l.code === code)?.name ?? code;
        setProgress(`Se lucrează la „${name}"…`);
        try {
          const res = await fetch('/api/blog-audio', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              slug,
              title,
              text,
              language: code,
              sourceLanguage: language,
            }),
          });
          const data = await res.json();
          if (res.ok) done.push(data.reused ? `${name} (neschimbat)` : name);
          else failed.push(`${name}: ${[data?.error, data?.detail].filter(Boolean).join(' — ') || 'eroare'}`);
        } catch {
          failed.push(`${name}: rețea`);
        }
      }

      if (done.length) setMessage(`Gata: ${done.join(', ')}.`);
      if (failed.length) setError(failed.join(' · '));
      await refresh();
    } finally {
      setBusy(false);
      setProgress('');
    }
  }, [slug, title, text, language, charCount, requests, selected, getToken, refresh]);

  // --- Stergere ------------------------------------------------------
  const remove = useCallback(
    async (code: string) => {
      const name = LANGS.find((l) => l.code === code)?.name ?? code;
      if (!window.confirm(`Ștergi fișierul audio „${name}"? Cititorii vor auzi din nou vocea cerută în direct.`)) {
        return;
      }
      setBusy(true);
      setError('');
      setMessage('');
      try {
        const token = await getToken();
        const res = await fetch(
          `/api/blog-audio?slug=${encodeURIComponent(slug)}&language=${code}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setError(d?.error || 'Ștergerea a eșuat.');
          return;
        }
        setMessage(`Fișierul „${name}" a fost șters.`);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [slug, getToken, refresh],
  );

  const openInfo = infoByLang[openLang];

  return (
    <div className="mt-4 rounded-lg border border-white/20 bg-white/5 p-4">
      <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
        <span>🎧</span> Audio pregenerat
      </h4>
      <p className="mb-3 text-xs leading-relaxed text-white/60">
        Se generează <strong>o singură dată</strong>, pentru fiecare limbă bifată.
        După aceea, toți cititorii ascultă fișierul salvat — fără niciun cost
        suplimentar, oricât de mulți ar fi. Dacă nu generezi nimic,
        „Play Blog&ldquo; funcționează exact ca până acum.
      </p>

      {/* --- Ce limbi generăm --- */}
      <div className="mb-3 flex flex-wrap gap-2">
        {LANGS.map((l) => {
          const has = !!infoByLang[l.code]?.audioUrl;
          const on = selected.includes(l.code);
          // Pasul A18 — in limbile cu inregistrarea ta nu are rost sa
          // generam TTS: oricum nu s-ar auzi. Butonul ramane blocat.
          const mine = customAudioLangs.includes(l.code);
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => toggleLang(l.code)}
              disabled={busy || mine}
              title={mine ? 'Ai încărcat înregistrarea ta — TTS nu mai e necesar.' : undefined}
              className={`btn-solid rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                mine
                  ? 'border-black/15 bg-black/5 text-black/40 line-through dark:border-white/15 dark:bg-white/5 dark:text-white/40'
                  : on
                  ? 'border-transparent bg-black text-white dark:bg-white dark:text-black'
                  : 'border-black/20 bg-black/5 text-black/60 hover:bg-black/10 dark:border-white/20 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10'
              }`}
            >
              {l.name} {mine ? '🎙' : has ? '✓' : ''}
            </button>
          );
        })}
      </div>

      {customAudioLangs.length > 0 && (
        <p className="mb-3 text-[11px] text-white/50">
          🎙 = ai încărcat înregistrarea ta. În aceste limbi nu se generează TTS.
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/50">
        <span>Caractere: <strong className="text-white/80">{charCount.toLocaleString('ro-RO')}</strong></span>
        <span>Cereri: <strong className="text-white/80">{requests * Math.max(1, selected.length)}</strong></span>
        <span>
          Generate:{' '}
          <strong className="text-white/80">
            {LANGS.filter((l) => infoByLang[l.code]?.audioUrl).map((l) => l.name).join(', ') || '—'}
          </strong>
        </span>
      </div>

      {/* --- Ascultare, pe limbi --- */}
      <div className="mb-3 flex flex-wrap gap-1">
        {LANGS.filter((l) => infoByLang[l.code]?.audioUrl).map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setOpenLang(l.code)}
            className={`rounded px-2 py-1 text-[11px] ${
              openLang === l.code ? 'bg-white/20 text-white' : 'text-white/50 hover:bg-white/10'
            }`}
          >
            {l.name}
          </button>
        ))}
      </div>

      {openInfo?.audioUrl && (
        <div className="mb-3">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio key={openInfo.audioUrl} src={openInfo.audioUrl} controls preload="metadata" className="w-full" />
          <button
            type="button"
            onClick={() => remove(openLang)}
            disabled={busy}
            className="mt-1 text-[11px] text-white/50 underline hover:text-white/80 disabled:opacity-50"
          >
            Șterge audio-ul pentru {LANGS.find((l) => l.code === openLang)?.name}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={generate}
        disabled={busy || !slug || !selected.length}
        className="btn-solid rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {busy ? 'Se generează…' : 'Generează audio'}
      </button>

      {busy && (
        <p className="mt-2 text-[11px] text-white/50">
          {progress} Poate dura un minut per limbă la articolele lungi. Nu închide pagina.
        </p>
      )}
      {message && <p className="mt-2 text-xs text-green-300">{message}</p>}
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

      {/* --- Descărcare audio (doar admin) --- */}
      {availableForDownload.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-white/50">
            Descarcă audio
          </p>

          <div className="mb-2 flex flex-wrap gap-2">
            {availableForDownload.map((l) => {
              const on = dlSelected.includes(l.code);
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => toggleDownload(l.code)}
                  disabled={downloading}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                    on
                      ? 'border-emerald-400 bg-emerald-500/25 text-white'
                      : 'border-white/20 bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {l.name}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() =>
                setDlSelected(
                  dlSelected.length === availableForDownload.length
                    ? []
                    : availableForDownload.map((l) => l.code)
                )
              }
              disabled={downloading}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/50 hover:bg-white/10 disabled:opacity-50"
            >
              {dlSelected.length === availableForDownload.length ? 'Deselectează tot' : 'Toate limbile'}
            </button>
          </div>

          <button
            type="button"
            onClick={downloadSelected}
            disabled={downloading || dlSelected.length === 0}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading ? 'Se descarcă…' : `Descarcă ${dlSelected.length || ''} fișier(e)`}
          </button>

          <p className="mt-2 text-[11px] text-white/40">
            Nume fișier: <code className="text-white/60">{buildAudioFileName(title, createdAt, dlSelected[0] || language)}</code>
          </p>
        </div>
      )}
    </div>
  );
}
