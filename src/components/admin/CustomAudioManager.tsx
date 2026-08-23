'use client';

/**
 * Pasul A18 — panoul de INREGISTRARI PROPRII, pe limbi.
 *
 * Ce vezi aici: cele 4 limbi, una sub alta. Pentru fiecare:
 *   - daca NU ai incarcat nimic → scrie „Voce generată (TTS)" si ai
 *     butonul de incarcare;
 *   - daca ai incarcat → poti asculta, inlocui sau sterge.
 *
 * Cand stergi, blogul revine SINGUR la TTS. Iar TTS-ul generat inainte
 * ramane salvat in cache, deci nu se genereaza (si nu se plateste) din nou.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AUDIO_LANGS,
  AUDIO_LANG_LABELS,
  fetchCustomAudio,
  uploadCustomAudio,
  deleteCustomAudio,
  type CustomAudio,
} from '@/lib/customAudio';

export interface CustomAudioManagerProps {
  blogId: string;
  className?: string;
  /**
   * Se cheama de fiecare data cand se schimba lista, ca generatorul TTS
   * sa stie imediat in ce limbi nu mai are ce genera.
   */
  onLangsChange?: (langs: string[]) => void;
}

export default function CustomAudioManager({
  blogId,
  className = '',
  onLangsChange,
}: CustomAudioManagerProps) {
  const [items, setItems] = useState<CustomAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyLang, setBusyLang] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // Cate un input ascuns pentru fiecare limba
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const list = await fetchCustomAudio(blogId);
    setItems(list);
    onLangsChange?.(list.map((i) => i.lang));
    setLoading(false);
  }, [blogId, onLangsChange]);

  useEffect(() => { void load(); }, [load]);

  const byLang = (lang: string) => items.find((i) => i.lang === lang) ?? null;

  const handleFile = async (lang: string, file: File | undefined) => {
    if (!file) return;

    // Verificare simpla, ca sa nu incarci din greseala un PDF
    if (!file.type.startsWith('audio/')) {
      setMessage('Fișierul trebuie să fie audio (mp3, m4a, wav…).');
      return;
    }

    setBusyLang(lang);
    setMessage('');
    const res = await uploadCustomAudio(blogId, lang, file);
    setBusyLang(null);

    if (!res.ok) { setMessage(`Eroare: ${res.error}`); return; }
    setMessage(`Înregistrarea în ${AUDIO_LANG_LABELS[lang as never] ?? lang} a fost încărcată.`);
    void load();
  };

  const handleDelete = async (lang: string) => {
    if (!confirm(
      'Ștergi înregistrarea ta pentru această limbă?\n\n' +
      'Blogul va reveni automat la vocea generată (TTS).',
    )) return;

    setBusyLang(lang);
    const res = await deleteCustomAudio(blogId, lang);
    setBusyLang(null);
    if (!res.ok) { setMessage(`Eroare: ${res.error}`); return; }
    setMessage('Șters. Se va folosi din nou vocea generată (TTS).');
    void load();
  };

  if (!blogId) {
    return (
      <p className={`text-xs opacity-60 ${className}`}>
        Salvează întâi articolul, apoi poți încărca înregistrări proprii.
      </p>
    );
  }

  return (
    <div className={`rounded-lg border border-white/15 bg-white/5 p-4 ${className}`}>
      <h4 className="mb-1 text-sm font-semibold text-white">
        Înregistrarea ta, pe limbi
      </h4>
      <p className="mb-4 text-xs text-white/55">
        În limbile în care încarci un fișier se aude vocea ta. În celelalte se
        generează TTS, ca până acum. Dacă ștergi o înregistrare, blogul revine
        singur la TTS — iar TTS-ul rămâne salvat, deci nu se generează din nou.
      </p>

      {loading && <p className="text-xs text-white/50">Se încarcă…</p>}

      {!loading && (
        <div className="space-y-2">
          {AUDIO_LANGS.map((lang) => {
            const item = byLang(lang);
            const busy = busyLang === lang;

            return (
              <div
                key={lang}
                className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white">{AUDIO_LANG_LABELS[lang]}</p>
                  <p className="truncate text-xs text-white/45">
                    {item
                      ? `Vocea ta · ${item.file_name ?? 'fișier încărcat'}`
                      : 'Voce generată (TTS)'}
                  </p>
                </div>

                {item && (
                  <audio
                    src={item.audio_url}
                    controls
                    preload="none"
                    className="h-8 w-full sm:w-48"
                  />
                )}

                <div className="flex gap-2">
                  <input
                    ref={(el) => { inputs.current[lang] = el; }}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      void handleFile(lang, e.target.files?.[0]);
                      e.target.value = ''; // ca sa poti alege acelasi fisier iar
                    }}
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => inputs.current[lang]?.click()}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50"
                  >
                    {busy ? 'Se încarcă…' : item ? 'Înlocuiește' : 'Încarcă'}
                  </button>

                  {item && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(lang)}
                      className="rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/25 disabled:opacity-50"
                    >
                      Șterge
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {message && <p className="mt-3 text-xs text-white/70">{message}</p>}
    </div>
  );
}
