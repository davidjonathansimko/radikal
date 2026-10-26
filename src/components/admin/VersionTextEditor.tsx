'use client';

import React, { useEffect, useState } from 'react';
import { fetchVersionOverride, saveVersionOverride, defaultVersionText } from '@/lib/appVersion';

export default function VersionTextEditor() {
  const [value, setValue] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchVersionOverride().then((t) => {
      if (alive) setValue(t);
    });
    return () => {
      alive = false;
    };
  }, []);

  const save = async (text: string) => {
    setBusy(true);
    setMsg('');
    try {
      await saveVersionOverride(text);
      setValue(text);
      setMsg(text ? 'Salvat. Apare în meniu la următoarea deschidere.' : 'Revenit la textul automat.');
    } catch {
      setMsg('Nu am putut salva.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-black/60 dark:text-white/60">
        Textul de la sfârșitul meniului (telefon). Lăsat gol, se afișează automat: „{defaultVersionText('ro')}”.
      </p>
      <input
        type="text"
        value={value}
        maxLength={60}
        onChange={(e) => setValue(e.target.value)}
        placeholder={defaultVersionText('ro')}
        className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm text-black dark:border-white/15 dark:text-white"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void save(value.trim())}
          className="btn-solid rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          Salvează
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void save('')}
          className="btn-solid rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50 dark:border-white/15 dark:text-white"
        >
          Înapoi la automat
        </button>
        {msg && <span className="text-xs text-black/60 dark:text-white/60">{msg}</span>}
      </div>
    </div>
  );
}
