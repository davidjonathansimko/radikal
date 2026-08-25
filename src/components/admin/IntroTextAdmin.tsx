'use client';

// =====================================================================
// Pasul 2308004 (B) — panoul din admin pentru textul de sub logo
// ---------------------------------------------------------------------
// Se salveaza in `site_content`, la cheia `intro_logo_text`.
// =====================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import {
  INTRO_TEXT_KEY,
  DEFAULT_INTRO_TEXT,
  clearIntroTextCache,
  type IntroTextSettings,
  type IntroLanguage,
} from '@/lib/introText';

const LANGS: { code: IntroLanguage; name: string }[] = [
  { code: 'ro', name: 'Română' },
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
];

export default function IntroTextAdmin() {
  const [settings, setSettings] = useState<IntroTextSettings>(DEFAULT_INTRO_TEXT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('site_content')
          .select('value')
          .eq('key', INTRO_TEXT_KEY)
          .maybeSingle();

        if (data?.value) {
          setSettings({ ...DEFAULT_INTRO_TEXT, ...(data.value as Partial<IntroTextSettings>) });
        }
      } catch {
        /* prima folosire — ramanem pe valorile implicite */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const supabase = createClient();
      const { error: err } = await supabase
        .from('site_content')
        .upsert({ key: INTRO_TEXT_KEY, value: settings }, { onConflict: 'key' });

      if (err) throw err;

      clearIntroTextCache();
      setMessage('Salvat.');
      setTimeout(() => setMessage(''), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Salvarea a eșuat.');
    } finally {
      setSaving(false);
    }
  }, [settings]);

  if (loading) return <p className="text-sm text-white/50">Se încarcă…</p>;

  return (
    <div className="space-y-5">
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-4">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
          className="mt-1 h-5 w-5 flex-shrink-0 accent-purple-500"
        />
        <span>
          <span className="block text-sm font-medium text-white">
            Arată un text sub logo, la intrare
          </span>
          <span className="mt-1 block text-xs text-white/60">
            Apare <strong>după</strong> logo, nu odată cu el. Dacă lași nebifat,
            totul rămâne exact ca până acum: doar logo-ul, apoi modalul cu versetul.
          </span>
        </span>
      </label>

      <div className="space-y-2">
        {LANGS.map((l) => (
          <div key={l.code}>
            <label htmlFor={`intro-${l.code}`} className="mb-1 block text-[11px] text-white/50">
              {l.name}
            </label>
            <textarea
              id={`intro-${l.code}`}
              rows={2}
              value={settings.text?.[l.code] || ''}
              onChange={(e) =>
                setSettings((s) => ({ ...s, text: { ...s.text, [l.code]: e.target.value } }))
              }
              placeholder="ex. Radikale Bibellehre"
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/25"
            />
          </div>
        ))}
      </div>

      <p className="text-[11px] text-white/40">
        Dacă o limbă rămâne goală, în acea limbă nu apare niciun text — restul funcționează normal.
      </p>

      <button
        type="button"
        onClick={save}
        disabled={saving}
            className="btn-solid rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {saving ? 'Se salvează…' : 'Salvează'}
      </button>

      {message && <p className="text-xs text-green-300">{message}</p>}
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
