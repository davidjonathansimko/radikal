'use client';

// =====================================================================
// Pasul 2308004 (A) — panoul din admin pentru modul „în lucru"
// ---------------------------------------------------------------------
// Se salveaza in `site_content`, la cheia `site_maintenance`.
// Nu este nevoie de niciun SQL nou: tabelul exista deja.
// =====================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import {
  MAINTENANCE_KEY,
  DEFAULT_MAINTENANCE,
  DEFAULT_MESSAGE,
  DEFAULT_MESSAGE_NO_DATE,
  buildMaintenanceMessage,
  clearMaintenanceCache,
  type MaintenanceSettings,
  type MaintenanceLanguage,
} from '@/lib/maintenance';

const LANGS: { code: MaintenanceLanguage; name: string }[] = [
  { code: 'ro', name: 'Română' },
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
];

export default function MaintenanceAdmin() {
  const [settings, setSettings] = useState<MaintenanceSettings>(DEFAULT_MAINTENANCE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [previewLang, setPreviewLang] = useState<MaintenanceLanguage>('de');
  const [uploading, setUploading] = useState(false);

  // --- Citim setarile existente -------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('site_content')
          .select('value')
          .eq('key', MAINTENANCE_KEY)
          .maybeSingle();

        if (data?.value) {
          setSettings({ ...DEFAULT_MAINTENANCE, ...(data.value as Partial<MaintenanceSettings>) });
        }
      } catch {
        /* daca nu exista inca, ramanem pe valorile implicite */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- Salvare -------------------------------------------------------
  const save = useCallback(async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const supabase = createClient();
      const { error: err } = await supabase
        .from('site_content')
        .upsert({ key: MAINTENANCE_KEY, value: settings }, { onConflict: 'key' });

      if (err) throw err;

      clearMaintenanceCache();
      setMessage(
        settings.enabled
          ? 'Salvat. Site-ul este acum în modul „în lucru" pentru vizitatori.'
          : 'Salvat. Site-ul este public și funcționează normal.',
      );
      setTimeout(() => setMessage(''), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Salvarea a eșuat.');
    } finally {
      setSaving(false);
    }
  }, [settings]);

  // --- Imagine de fundal (optionala) ---------------------------------
  const uploadBackground = useCallback(async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `maintenance/background-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('reels-media')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from('reels-media').getPublicUrl(path);
      setSettings((s) => ({ ...s, backgroundUrl: data.publicUrl }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Încărcarea imaginii a eșuat.');
    } finally {
      setUploading(false);
    }
  }, []);

  if (loading) {
    return <p className="text-sm text-white/50">Se încarcă setările…</p>;
  }

  const preview = buildMaintenanceMessage(settings, previewLang);

  return (
    <div className="space-y-5">
      {/* --- Comutatorul principal --- */}
      <label
        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
          settings.enabled
            ? 'border-amber-400/60 bg-amber-500/10'
            : 'border-white/15 bg-white/5'
        }`}
      >
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
          className="mt-1 h-5 w-5 flex-shrink-0 accent-amber-500"
        />
        <span>
          <span className="block text-sm font-medium text-white">
            Site-ul este în lucru
          </span>
          <span className="mt-1 block text-xs text-white/60">
            Cât timp este bifat, vizitatorii văd doar logo-ul RADIKAL și mesajul de mai jos.
            Nu apar intro-ul, login-ul, „continuă ca invitat&ldquo; — nimic. Tu, ca admin, intri normal.
          </span>
        </span>
      </label>

      {/* Pasul 2308010 — usa ascunsa, ca sa nu ramai blocat afara */}
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
        🔑 <strong>Dacă te deloghezi cât timp modul e pornit:</strong> ține apăsat 2 secunde
        pe cuvântul <strong>„radikal.&ldquo;</strong> de pe ecranul de lucrări. Te duce direct la
        pagina de autentificare. O apăsare scurtă nu face nimic, deci un vizitator nu poate
        ocoli ecranul din greșeală.
      </p>

      {/* --- Data revenirii --- */}
      <div>
        <label htmlFor="return-date" className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/50">
          Data la care revii
        </label>
        <input
          id="return-date"
          type="date"
          value={settings.returnDate}
          onChange={(e) => setSettings((s) => ({ ...s, returnDate: e.target.value }))}
          className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
        />
        <p className="mt-1 text-[11px] text-white/40">
          Se scrie automat frumos în fiecare limbă („15. September 2026&ldquo;, „15 septembrie 2026&ldquo;).
          Dacă o lași goală, mesajul devine „Revenim în curând&ldquo;.
        </p>
      </div>

      {/* --- Textele, pe limbi --- */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/50">
          Text personalizat (opțional)
        </p>
        <div className="space-y-2">
          {LANGS.map((l) => (
            <div key={l.code}>
              <label htmlFor={`msg-${l.code}`} className="mb-1 block text-[11px] text-white/50">
                {l.name}
              </label>
              <textarea
                id={`msg-${l.code}`}
                rows={2}
                value={settings.message?.[l.code] || ''}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    message: { ...s.message, [l.code]: e.target.value },
                  }))
                }
                placeholder={
                  settings.returnDate
                    ? DEFAULT_MESSAGE[l.code]
                    : DEFAULT_MESSAGE_NO_DATE[l.code]
                }
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/25"
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-white/40">
          Dacă lași o casetă goală, se folosește textul implicit (cel gri din casetă).
          Poți scrie <code className="text-white/60">{'{date}'}</code> oriunde în text —
          acolo va apărea data.
        </p>
      </div>

      {/* --- Imagine de fundal --- */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/50">
          Imagine de fundal (opțional)
        </p>
        {settings.backgroundUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.backgroundUrl}
              alt=""
              className="h-16 w-24 rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, backgroundUrl: null }))}
              className="text-[11px] text-white/50 underline hover:text-white/80"
            >
              Elimină imaginea
            </button>
          </div>
        ) : (
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadBackground(f);
            }}
            className="text-xs text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-white"
          />
        )}

        {settings.backgroundUrl && (
          <div className="mt-3">
            <label htmlFor="bg-opacity" className="mb-1 block text-[11px] text-white/50">
              Cât de vizibilă e imaginea: {settings.backgroundOpacity}%
            </label>
            <input
              id="bg-opacity"
              type="range"
              min={0}
              max={100}
              value={settings.backgroundOpacity}
              onChange={(e) =>
                setSettings((s) => ({ ...s, backgroundOpacity: Number(e.target.value) }))
              }
              className="w-full max-w-xs accent-amber-500"
            />
          </div>
        )}
      </div>

      {/* --- Previzualizare --- */}
      <div className="rounded-xl border border-white/10 bg-black/50 p-4">
        <div className="mb-3 flex flex-wrap gap-1">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setPreviewLang(l.code)}
              className={`rounded px-2 py-1 text-[11px] ${
                previewLang === l.code ? 'bg-white/20 text-white' : 'text-white/50 hover:bg-white/10'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
        <div className="flex flex-col items-center py-6 text-center">
          <span className="font-cinzel text-2xl font-bold text-white">
            radikal<span className="opacity-70">.</span>
          </span>
          <p className="mt-4 max-w-md font-cinzel text-sm italic leading-relaxed text-white/85">
            {preview}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className={`btn-solid rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50 ${
          settings.enabled
            ? 'bg-amber-600 text-white'
            : 'bg-black text-white dark:bg-white dark:text-black'
        }`}
      >
        {saving ? 'Se salvează…' : 'Salvează setările'}
      </button>

      {message && <p className="text-xs text-green-300">{message}</p>}
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
