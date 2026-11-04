'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { runLangFx } from '@/lib/glitchEffects';
import {
  BAR_BEHAVIORS,
  BAR_STYLES,
  LANG_FX,
  MINI_PLAYERS,
  MINI_SHEETS,
  MINI_SHEET_FX,
  THEME_STYLES,
  THEME_FX,
  UI_DEFAULTS,
  UI_TOGGLES,
  fetchUiSettings,
  saveUiSettings,
  setUiPreview,
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

// Sectiune pliabila; mai multe pot fi deschise in acelasi timp (fiecare <details> e independent).
function Sect({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-black/10 dark:border-white/15">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 text-sm font-semibold text-black dark:text-white [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <svg className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="px-3 pb-3">{children}</div>
    </details>
  );
}

export default function UiSettingsAdmin() {
  const { toggleTheme } = useTheme();
  const toggleRef = useRef(toggleTheme);
  toggleRef.current = toggleTheme;

  const [s, setS] = useState<UiSettings>(UI_DEFAULTS);
  const savedRef = useRef<UiSettings>(UI_DEFAULTS);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const demoBusy = useRef(false);

  useEffect(() => {
    let alive = true;
    void fetchUiSettings(true).then((v) => {
      if (!alive) return;
      savedRef.current = v;
      setS(v);
    });
    // La iesirea din admin, ce nu a fost salvat dispare.
    return () => {
      alive = false;
      setUiPreview(null);
    };
  }, []);

  const dirty = JSON.stringify(s) !== JSON.stringify(savedRef.current);

  // Orice schimbare se vede imediat (previzualizare); se pastreaza doar dupa „Salveaza".
  const update = (next: UiSettings, demo?: 'theme' | 'lang') => {
    setS(next);
    setMsg('');
    setUiPreview(next);
    if (demo === 'lang') runLangFx(next.langFx);
    if (demo === 'theme' && !demoBusy.current) {
      // Tema se schimba o data ca sa vezi efectul, apoi revine singura.
      demoBusy.current = true;
      window.setTimeout(() => toggleRef.current(), 60);
      window.setTimeout(() => {
        toggleRef.current();
        window.setTimeout(() => {
          demoBusy.current = false;
        }, 1200);
      }, 2200);
    }
  };

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      await saveUiSettings(s);
      savedRef.current = s;
      setMsg('Salvat.');
    } catch {
      setMsg('Nu am putut salva.');
    } finally {
      setBusy(false);
    }
  };

  const revert = () => {
    setS(savedRef.current);
    setUiPreview(null);
    setMsg('Revenit la setările salvate.');
  };

  const saveBar = (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-2 dark:border-white/15 dark:bg-black">
      <button type="button" disabled={busy || !dirty} onClick={() => void save()} className="btn-solid rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black">
        Salvează
      </button>
      <button type="button" disabled={busy || !dirty} onClick={revert} className="rounded-lg border border-black/15 px-3 py-2 text-sm text-black disabled:opacity-40 dark:border-white/20 dark:text-white">
        Renunță
      </button>
      <span className="text-xs text-black/60 dark:text-white/60" role="status">
        {msg || (dirty ? 'Previzualizare, nesalvată.' : '')}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-black/10 bg-black/[0.03] p-2.5 text-xs text-black/65 dark:border-white/15 dark:bg-white/[0.05] dark:text-white/65">
        Ce alegi se vede imediat, ca previzualizare. Rămâne doar dacă apeși <strong>Salvează</strong>; dacă ieși din admin fără să salvezi, revine la setările de dinainte. La temă și la limbă, efectul se arată o dată la alegere (tema se schimbă și revine singură).
      </p>

      {saveBar}

      <Sect title="Tema aplicației: stil de culoare (hârtie, noapte albastră, sticlă...)">
        <Choice name="theme-style" value={s.themeStyle} options={THEME_STYLES} onChange={(v) => update({ ...s, themeStyle: v })} />
        <p className="mt-2 text-xs text-black/55 dark:text-white/55">Se aplică în toată aplicația și se previzualizează imediat. Fiecare stil are varianta întunecată și cea luminoasă; butonul Temă din bară comută între ele. Culoarea de sus (ceas, baterie) urmează stilul; bara de jos a telefonului și-o alege sistemul.</p>
      </Sect>

      <Sect title="Bara de jos (telefon): comportament la derulare">
        <Choice name="bar-behavior" value={s.barBehavior} options={BAR_BEHAVIORS} onChange={(v) => update({ ...s, barBehavior: v })} />
      </Sect>

      <Sect title="Bara de jos: cum arată">
        <Choice name="bar-style" value={s.barStyle} options={BAR_STYLES} onChange={(v) => update({ ...s, barStyle: v })} />
      </Sect>

      <Sect title="Bara de jos: iconițe">
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-black/10 p-2.5 dark:border-white/15">
          <input type="checkbox" checked={s.barAnimated} onChange={(e) => update({ ...s, barAnimated: e.target.checked })} className="mt-1" />
          <span>
            <span className="block text-sm font-semibold text-black dark:text-white">Iconițe animate</span>
            <span className="block text-xs text-black/55 dark:text-white/55">Bifat = soarele se învârte, luna se leagănă, steagul flutură, inima bate. Nebifat = iconițe statice (implicit).</span>
          </span>
        </label>
      </Sect>

      <Sect title="Schimbarea temei (luminos / întunecat)">
        <Choice name="theme-fx" value={s.themeFx} options={THEME_FX} onChange={(v) => update({ ...s, themeFx: v }, 'theme')} />
      </Sect>

      <Sect title="Schimbarea limbii">
        <Choice name="lang-fx" value={s.langFx} options={LANG_FX} onChange={(v) => update({ ...s, langFx: v }, 'lang')} />
      </Sect>

      <Sect title="Player mic (rămâne pe ecran când schimbi pagina)">
        <Choice name="mini-player" value={s.miniPlayer} options={MINI_PLAYERS} onChange={(v) => update({ ...s, miniPlayer: v })} />
        <p className="mt-2 text-xs text-black/55 dark:text-white/55">Se ascunde odată cu bara de jos, după comportamentul ales mai sus. Se vede doar cât timp se ascultă ceva.</p>
      </Sect>

      <Sect title="Player mic: fereastra care se deschide la atingere">
        <Choice name="mini-sheet" value={s.miniPlayerSheet} options={MINI_SHEETS} onChange={(v) => update({ ...s, miniPlayerSheet: v })} />
        <p className="mt-2 text-xs text-black/55 dark:text-white/55">Clasic = cum era. Se vede doar dacă playerul mic nu e dezactivat; atinge playerul pentru a-l încerca.</p>
      </Sect>

      <Sect title="Player mic: efectul la deschiderea ferestrei">
        <Choice name="mini-sheet-fx" value={s.miniSheetFx} options={MINI_SHEET_FX} onChange={(v) => update({ ...s, miniSheetFx: v })} />
        <p className="mt-2 text-xs text-black/55 dark:text-white/55">Se vede când atingi playerul mic; schimbarea se previzualizează imediat.</p>
      </Sect>

      {Array.from(new Set(UI_TOGGLES.map((t) => t.group))).map((group) => (
        <Sect key={group} title={group}>
          <div className="space-y-2">
            {UI_TOGGLES.filter((t) => t.group === group).map((t) => (
              <label key={t.key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-black/10 p-2.5 dark:border-white/15">
                <input type="checkbox" checked={s[t.key]} onChange={(e) => update({ ...s, [t.key]: e.target.checked })} className="mt-1" />
                <span>
                  <span className="block text-sm font-semibold text-black dark:text-white">{t.title}</span>
                  <span className="block text-xs text-black/55 dark:text-white/55">{t.text}</span>
                </span>
              </label>
            ))}
          </div>
        </Sect>
      ))}

      {saveBar}
    </div>
  );
}
