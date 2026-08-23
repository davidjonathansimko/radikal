// Pasul 2108002 — marcarea manuala a referintelor biblice
//
// Detectarea automata prinde formele clasice ("Psalmul 1", "Proverbe 29:25"),
// dar nu poate ghici orice formulare (ex. "Neemia" singur, fara capitol).
//
// Aici adminul selecteaza cu mouse-ul o portiune din textul articolului si o
// adauga in lista. Fragmentele salvate apar cu rosu, exact ca cele automate.

'use client';

import React, { useCallback, useRef, useState } from 'react';

interface BibleRefPickerProps {
  /** Continutul articolului, ca sa poata selecta din el */
  content: string;
  /** Fragmentele marcate deja */
  value: string[];
  onChange: (refs: string[]) => void;
}

export default function BibleRefPicker({ content, value, onChange }: BibleRefPickerProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const [manual, setManual] = useState('');
  const [hint, setHint] = useState('');

  const add = useCallback(
    (raw: string) => {
      const t = raw.trim();
      if (!t) return;
      if (t.length > 120) {
        setHint('Fragmentul este prea lung (max. 120 de caractere).');
        return;
      }
      if (value.includes(t)) {
        setHint('Fragmentul este deja în listă.');
        return;
      }
      if (!content.includes(t)) {
        setHint('Atenție: fragmentul nu apare exact așa în text.');
      } else {
        setHint('');
      }
      onChange([...value, t]);
    },
    [value, onChange, content],
  );

  const addFromSelection = useCallback(() => {
    const sel = window.getSelection();
    const t = sel?.toString() ?? '';
    if (!t.trim()) {
      setHint('Selectează mai întâi o porțiune din text.');
      return;
    }
    add(t);
    sel?.removeAllRanges();
  }, [add]);

  const remove = (ref: string) => onChange(value.filter((r) => r !== ref));

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1">
        Referințe biblice (apar cu roșu)
      </p>
      <p className="text-xs text-black/50 dark:text-white/50 mb-3">
        Selectează text mai jos și apasă „Adaugă selecția&ldquo;, sau scrie manual.
        Formele clasice („Psalmul 1&ldquo;, „Proverbe 29:25&ldquo;) sunt detectate automat —
        aici adaugi doar ce lipsește.
      </p>

      {/* Text din care se selecteaza */}
      <div
        ref={textRef}
        className="max-h-40 overflow-y-auto rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] p-3 text-sm leading-relaxed text-black/80 dark:text-white/80 whitespace-pre-wrap select-text"
      >
        {content.trim() || 'Scrie mai întâi conținutul articolului.'}
      </div>

      {/* Pasul A10 — REPARARE MOBIL.
          Inainte butoanele si campul stateau pe acelasi rand si pe telefon.
          Campul, fiind intre doua butoane, se stramta pana ramanea doar
          „sau scr…" — parea taiat. Acum, pe telefon, campul are rand propriu
          (latime intreaga) si butoanele stau dedesubt. De la tablete in sus
          totul ramane exact ca inainte, pe un singur rand. */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="text"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(manual);
              setManual('');
            }
          }}
          placeholder="sau scrie manual, ex. Neemia 6"
          className="w-full min-w-0 rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:focus:border-white/40 transition-colors sm:order-2 sm:w-auto sm:flex-1"
        />

        <div className="flex gap-2 sm:contents">
          <button
            type="button"
            onClick={addFromSelection}
            className="flex-1 rounded-lg border border-black/20 dark:border-white/20 px-3 py-2 text-sm font-medium text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors sm:order-1 sm:flex-none"
          >
            Adaugă selecția
          </button>

          <button
            type="button"
            onClick={() => {
              add(manual);
              setManual('');
            }}
            className="flex-1 rounded-lg border border-black/20 dark:border-white/20 px-3 py-2 text-sm font-medium text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors sm:order-3 sm:flex-none"
          >
            Adaugă
          </button>
        </div>
      </div>

      {hint && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{hint}</p>}

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((ref) => (
            <span
              key={ref}
              className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-[#8f1414] dark:text-[#ff8a80]"
            >
              {ref}
              <button
                type="button"
                onClick={() => remove(ref)}
                aria-label={`Elimină ${ref}`}
                className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
