'use client';

import React, { useEffect, useState } from 'react';
import {
  BAR_BEHAVIORS,
  BAR_STYLES,
  LANG_FX,
  THEME_FX,
  UI_DEFAULTS,
  fetchUiSettings,
  saveUiSettings,
  type UiSettings,
} from '@/lib/uiSettings';

function Choice<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { id: T; title: string; text: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <label key={o.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-black/10 p-2.5 dark:border-white/15">
          <input type="radio" name={name} checked={value === o.id} onChange={() => onChange(o.id)} className="mt-1" />
          <span>
            <span className="block text-sm font-semibold text-black dark:text-white">{o.title}</span>
            <span className="block text-xs text-black/55 dark:text-white/55">{o.text}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

export default function UiSettingsAdmin() {
  const [s, setS] = useState<UiSettings>(UI_DEFAULTS);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchUiSettings(true).then((v) => alive && setS(v));
    return () => {
      alive = false;
    };
  }, []);

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      await saveUiSettings(s);
      setMsg('Salvat. Pe telefon se vede la revenirea în aplicație sau după o reîncărcare.');
    } catch {
      setMsg('Nu am putut salva.');
    } finally {
      setBusy(false);
    }
  };

  const h = 'mb-2 text-sm font-semibold text-black dark:text-white';
  return (
    <div className="space-y-6">
      <section>
        <p className={h}>Bara de jos (telefon): comportament la derulare</p>
        <Choice name="bar-behavior" value={s.barBehavior} options={BAR_BEHAVIORS} onChange={(v) => setS({ ...s, barBehavior: v })} />
      </section>

      <section>
        <p className={h}>Bara de jos: cum arată</p>
        <Choice name="bar-style" value={s.barStyle} options={BAR_STYLES} onChange={(v) => setS({ ...s, barStyle: v })} />
      </section>

      <section>
        <p className={h}>Bara de jos: iconițe</p>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-black/10 p-2.5 dark:border-white/15">
          <input type="checkbox" checked={s.barAnimated} onChange={(e) => setS({ ...s, barAnimated: e.target.checked })} className="mt-1" />
          <span>
            <span className="block text-sm font-semibold text-black dark:text-white">Iconițe animate</span>
            <span className="block text-xs text-black/55 dark:text-white/55">Bifat = soarele se învârte, luna se leagănă, steagul flutură, inima bate. Nebifat = iconițe statice (implicit).</span>
          </span>
        </label>
      </section>

      <section>
        <p className={h}>Schimbarea temei (luminos / întunecat)</p>
        <Choice name="theme-fx" value={s.themeFx} options={THEME_FX} onChange={(v) => setS({ ...s, themeFx: v })} />
      </section>

      <section>
        <p className={h}>Schimbarea limbii</p>
        <Choice name="lang-fx" value={s.langFx} options={LANG_FX} onChange={(v) => setS({ ...s, langFx: v })} />
      </section>

      <div className="flex items-center gap-3">
        <button type="button" disabled={busy} onClick={() => void save()} className="btn-solid rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black">
          Salvează
        </button>
        {msg && <span className="text-xs text-black/60 dark:text-white/60" role="status">{msg}</span>}
      </div>
    </div>
  );
}
