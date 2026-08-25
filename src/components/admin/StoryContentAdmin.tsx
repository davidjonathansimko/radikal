// Pasul 2108002 — editarea textului din About Story Modal
//
// Se randeaza DOAR in /admin, deci nu are niciun impact asupra
// performantei pentru vizitatori sau utilizatori normali.
//
// Fiecare limba se editeaza separat. Formatul este simplu:
//   - o fraza pe rand
//   - daca vrei si un subtitlu, il pui dupa `|`
//
// Exemplu:
//   Aceasta este fraza principala|iar acesta este subtitlul
//   O fraza fara subtitlu

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { getStoryPhrases, type LanguageKey, type StoryPhrase } from '@/data/storyPhrases';
import { STORY_CONTENT_KEY, clearStoryOverrideCache, type StoryOverride } from '@/hooks/useStoryContent';

const LANGS: { key: LanguageKey; label: string }[] = [
  { key: 'ro', label: 'Română' },
  { key: 'de', label: 'Deutsch' },
  { key: 'en', label: 'English' },
  { key: 'ru', label: 'Русский' },
];

/** Fraze -> text simplu, o fraza pe rand */
function phrasesToText(phrases: StoryPhrase[]): string {
  return phrases.map((p) => (p.sub ? `${p.main}|${p.sub}` : p.main)).join('\n');
}

/** Text simplu -> fraze */
function textToPhrases(text: string): StoryPhrase[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf('|');
      if (idx === -1) return { main: line, sub: null };
      return {
        main: line.slice(0, idx).trim(),
        sub: line.slice(idx + 1).trim() || null,
      };
    });
}

export default function StoryContentAdmin() {
  const [lang, setLang] = useState<LanguageKey>('ro');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [override, setOverride] = useState<StoryOverride>({});
  // Pasul 2208001: implicit STRANS — se deschide doar la „Editează"
  const [expanded, setExpanded] = useState(false);

  const notify = (type: 'ok' | 'err', t: string) => {
    setMessage({ type, text: t });
    setTimeout(() => setMessage(null), 4000);
  };

  // Incarcam o singura data suprascrierea existenta
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('site_content')
          .select('value')
          .eq('key', STORY_CONTENT_KEY)
          .maybeSingle();

        if (!alive) return;
        setOverride((data?.value as StoryOverride) || {});
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Cand se schimba limba, aratam textul editat sau, daca nu exista, cel din cod
  useEffect(() => {
    if (loading) return;
    const custom = override[lang];
    setText(phrasesToText(custom && custom.length > 0 ? custom : getStoryPhrases(lang)));
  }, [lang, override, loading]);

  const handleSave = useCallback(async () => {
    const phrases = textToPhrases(text);
    if (phrases.length === 0) {
      notify('err', 'Textul nu poate fi gol.');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const next: StoryOverride = { ...override, [lang]: phrases };

      const { error } = await supabase
        .from('site_content')
        .upsert(
          { key: STORY_CONTENT_KEY, value: next, updated_at: new Date().toISOString() },
          { onConflict: 'key' },
        );

      if (error) {
        notify('err', `Eroare la salvare: ${error.message}`);
        return;
      }

      setOverride(next);
      clearStoryOverrideCache();
      notify('ok', `Text salvat pentru ${LANGS.find((l) => l.key === lang)?.label}.`);
    } finally {
      setSaving(false);
    }
  }, [text, override, lang]);

  const handleResetToCode = useCallback(async () => {
    if (!window.confirm('Revii la textul original din cod pentru această limbă?')) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const next: StoryOverride = { ...override };
      delete next[lang];

      const { error } = await supabase
        .from('site_content')
        .upsert(
          { key: STORY_CONTENT_KEY, value: next, updated_at: new Date().toISOString() },
          { onConflict: 'key' },
        );

      if (error) {
        notify('err', `Eroare: ${error.message}`);
        return;
      }

      setOverride(next);
      clearStoryOverrideCache();
      setText(phrasesToText(getStoryPhrases(lang)));
      notify('ok', 'S-a revenit la textul original.');
    } finally {
      setSaving(false);
    }
  }, [override, lang]);

  const phraseCount = textToPhrases(text).length;
  const isCustom = Boolean(override[lang]?.length);

  return (
    <section className="rounded-2xl border border-black/10 dark:border-white/10 p-5 sm:p-6 bg-white dark:bg-black">
      <h2 className="text-xl font-bold text-black dark:text-white mb-1">Text „About Story&ldquo;</h2>
      <p className="text-sm text-black/60 dark:text-white/60 mb-5">
        O frază pe rând. Pentru subtitlu folosește <code className="px-1 rounded bg-black/10 dark:bg-white/10">|</code>:
        {' '}<em>Fraza principală|subtitlul</em>
      </p>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            message.type === 'ok'
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {LANGS.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => setLang(l.key)}
            className={`btn-solid rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              lang === l.key
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-black/5 dark:bg-white/10 text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/20'
            }`}
          >
            {l.label}
            {override[l.key]?.length ? ' •' : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-black/50 dark:text-white/50">Se încarcă…</p>
      ) : !expanded ? (
        /* Pasul 2208001: textul sta STRANS pana apesi „Editează",
           ca panoul de admin sa nu fie un zid de text. */
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-black/50 dark:text-white/50">
            {phraseCount} fraze · {isCustom ? 'text editat' : 'text original din cod'}
          </span>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="btn-solid ml-auto rounded-lg bg-black dark:bg-white px-5 py-2 text-sm font-semibold text-white dark:text-black transition-opacity hover:opacity-80"
          >
            Editează
          </button>
        </div>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={14}
            spellCheck={false}
            className="w-full rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-black/40 dark:focus:border-white/40 transition-colors font-mono"
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-xs text-black/50 dark:text-white/50">
              {phraseCount} fraze · {isCustom ? 'text editat' : 'text original din cod'}
            </span>

            <button
              type="button"
              onClick={handleResetToCode}
              disabled={saving || !isCustom}
              className="rounded-lg border border-black/15 dark:border-white/15 px-4 py-2 text-sm text-black/70 dark:text-white/70 transition-colors hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40"
            >
              Revino la original
            </button>

            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-lg border border-black/15 dark:border-white/15 px-4 py-2 text-sm text-black/70 dark:text-white/70 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              Închide
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-solid ml-auto rounded-lg bg-black dark:bg-white px-5 py-2 text-sm font-semibold text-white dark:text-black transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {saving ? 'Se salvează…' : 'Salvează'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
