'use client';

// =====================================================================
// Pasul 2508000 — „Pagini": editezi textul paginilor fixe, din admin
// ---------------------------------------------------------------------
// Cum merge, pe scurt:
//   1. Alegi pagina si limba.
//   2. Vezi textul care este ACUM pe pagina si il schimbi cum vrei.
//   3. „Salvează și traduce" — salveaza ce ai scris SI trimite la DeepL doar
//      campurile pe care le-ai modificat, ca sa fie schimbate in toate limbile.
//   4. „Înapoi la original" — sterge modificarile tale. Textul din cod este
//      copia de siguranta si nu se pierde niciodata.
// =====================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EDITABLE_PAGES,
  PAGE_LANGUAGES,
  fetchPageOverrides,
  savePageOverrides,
  type AllPageOverrides,
  type PageId,
  type PageLanguage,
} from '@/lib/pageContent';
import { originalTextsFor, isPageEditable, ensurePageDefaultsLoaded } from '@/lib/pageDefaults';

const LANG_NAMES: Record<PageLanguage, string> = {
  ro: 'Română',
  de: 'Deutsch',
  en: 'English',
  ru: 'Русский',
};

/** Eticheta prietenoasa pentru o cheie tehnica („introText" -> „Intro Text"). */
function prettyKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

export default function PageContentAdmin() {
  const [pageId, setPageId] = useState<PageId>('impressum');
  const [lang, setLang] = useState<PageLanguage>('de');

  const [overrides, setOverrides] = useState<AllPageOverrides>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  // Textele originale se incarca la cerere (vezi `pageDefaults.ts`).
  const [defaultsReady, setDefaultsReady] = useState(false);

  useEffect(() => {
    let alive = true;
    ensurePageDefaultsLoaded().then(() => alive && setDefaultsReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const originals = useMemo(
    () => (defaultsReady ? originalTextsFor(pageId, lang) : {}),
    [pageId, lang, defaultsReady],
  );
  const editable = defaultsReady && isPageEditable(pageId);

  // --- Citim ce a fost salvat inainte
  useEffect(() => {
    let alive = true;
    fetchPageOverrides()
      .then((all) => {
        if (!alive) return;
        setOverrides(all);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // --- Cand schimbi pagina sau limba, umplem casutele
  useEffect(() => {
    const saved = overrides[pageId]?.[lang] ?? {};
    const next: Record<string, string> = {};
    Object.keys(originals).forEach((key) => {
      next[key] = saved[key] ?? originals[key];
    });
    setDraft(next);
    setNote('');
    setError('');
  }, [pageId, lang, originals, overrides]);

  const changedKeys = useMemo(
    () => Object.keys(draft).filter((k) => (draft[k] ?? '') !== (originals[k] ?? '')),
    [draft, originals],
  );

  /** Traduce o lista de texte cu DeepL. Intoarce lista goala daca nu reuseste. */
  const translateMany = useCallback(
    async (texts: string[], from: PageLanguage, to: PageLanguage): Promise<string[]> => {
      if (texts.length === 0) return [];
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: texts, targetLang: to, sourceLang: from }),
        });
        if (!res.ok) return [];
        const json = await res.json();
        const out = json.translatedText;
        return Array.isArray(out) ? out : [];
      } catch {
        return [];
      }
    },
    [],
  );

  // --- Salveaza + traduce in celelalte limbi
  const saveAndTranslate = useCallback(async () => {
    setBusy(true);
    setError('');
    setNote('');
    try {
      const next: AllPageOverrides = JSON.parse(JSON.stringify(overrides));
      next[pageId] = next[pageId] ?? {};

      // 1. Limba in care ai scris
      const mine: Record<string, string> = { ...(next[pageId]![lang] ?? {}) };
      changedKeys.forEach((k) => {
        mine[k] = draft[k];
      });
      next[pageId]![lang] = mine;

      // 2. Aceleasi campuri, traduse in celelalte limbi
      let translatedLangs = 0;
      if (changedKeys.length > 0) {
        const sourceTexts = changedKeys.map((k) => draft[k]);
        for (const other of PAGE_LANGUAGES) {
          if (other === lang) continue;
          const results = await translateMany(sourceTexts, lang, other);
          if (results.length !== changedKeys.length) continue;

          const bucket: Record<string, string> = { ...(next[pageId]![other] ?? {}) };
          changedKeys.forEach((k, i) => {
            const value = (results[i] || '').trim();
            if (value) bucket[k] = value;
          });
          next[pageId]![other] = bucket;
          translatedLangs += 1;
        }
      }

      await savePageOverrides(next);
      setOverrides(next);
      setNote(
        changedKeys.length === 0
          ? 'Nu ai schimbat nimic — nu era nevoie să salvez.'
          : `Salvat. ${changedKeys.length} text(e) schimbate, traduse în ${translatedLangs} limbi.`,
      );
      setTimeout(() => setNote(''), 6000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Salvarea a eșuat.');
    } finally {
      setBusy(false);
    }
  }, [overrides, pageId, lang, changedKeys, draft, translateMany]);

  // --- Inapoi la textul din cod
  const resetPage = useCallback(
    async (onlyThisLanguage: boolean) => {
      const what = onlyThisLanguage
        ? `textul în ${LANG_NAMES[lang]} de pe pagina aleasă`
        : 'textul în TOATE limbile de pe pagina aleasă';
      if (!window.confirm(`Sigur revii la original? Se șterge ${what}.`)) return;

      setBusy(true);
      setError('');
      try {
        const next: AllPageOverrides = JSON.parse(JSON.stringify(overrides));
        if (onlyThisLanguage) {
          if (next[pageId]) delete next[pageId]![lang];
        } else {
          delete next[pageId];
        }
        await savePageOverrides(next);
        setOverrides(next);
        setNote('Gata. Pagina afișează din nou textul original.');
        setTimeout(() => setNote(''), 6000);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Nu am putut reveni la original.');
      } finally {
        setBusy(false);
      }
    },
    [overrides, pageId, lang],
  );

  const hasOverride = Boolean(overrides[pageId]?.[lang]);

  const inputClass =
    'w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black/40 dark:border-white/15 dark:bg-black dark:text-white dark:focus:border-white/40';

  return (
    <div className="space-y-5">
      {/* --- Ce pagină --- */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Pagina
        </p>
        <div className="flex flex-wrap gap-2">
          {EDITABLE_PAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPageId(p.id)}
              className={`btn-solid rounded-full border px-4 py-1.5 text-sm transition-colors ${
                pageId === p.id
                  ? 'border-transparent bg-black text-white dark:bg-white dark:text-black'
                  : 'border-black/15 text-black/70 hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- Ce limbă --- */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Limba în care scrii
        </p>
        <div className="flex flex-wrap gap-2">
          {PAGE_LANGUAGES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`btn-solid rounded-full border px-4 py-1.5 text-sm transition-colors ${
                lang === l
                  ? 'border-transparent bg-black text-white dark:bg-white dark:text-black'
                  : 'border-black/15 text-black/70 hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10'
              }`}
            >
              {LANG_NAMES[l]}
              {overrides[pageId]?.[l] ? ' •' : ''}
            </button>
          ))}
        </div>
      </div>

      {note && (
        <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-700 dark:text-green-300">
          {note}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-black/50 dark:text-white/50">Se încarcă…</p>
      ) : !defaultsReady ? (
        <p className="text-sm text-black/50 dark:text-white/50">Se încarcă textele…</p>
      ) : !editable ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
          Pagina <strong>{EDITABLE_PAGES.find((p) => p.id === pageId)?.label}</strong> încă nu este
          pregătită pentru editare. Textul ei este scris direct în aranjamentul paginii, nu într-o
          listă separată. Îl mut și pe acela într-un pas următor.
        </p>
      ) : (
        <>
          <p className="text-xs text-black/50 dark:text-white/50">
            {Object.keys(draft).length} texte · {changedKeys.length} schimbate față de original
          </p>

          <div className="space-y-4">
            {Object.keys(draft).map((key) => {
              const changed = (draft[key] ?? '') !== (originals[key] ?? '');
              const long = (originals[key] ?? '').length > 90;
              return (
                <div key={key}>
                  <label className="mb-1 flex items-center justify-between text-xs font-medium text-black/70 dark:text-white/70">
                    <span>{prettyKey(key)}</span>
                    {changed && (
                      <button
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, [key]: originals[key] }))}
                        className="text-[11px] font-semibold text-black/50 underline hover:text-black dark:text-white/50 dark:hover:text-white"
                      >
                        anulează acest text
                      </button>
                    )}
                  </label>
                  {long ? (
                    <textarea
                      value={draft[key] ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                      rows={Math.min(10, Math.ceil((draft[key] ?? '').length / 90) + 1)}
                      className={`${inputClass} resize-y leading-relaxed`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={draft[key] ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                      className={inputClass}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-4 dark:border-white/10">
            <button
              type="button"
              onClick={saveAndTranslate}
              disabled={busy || changedKeys.length === 0}
              className="btn-solid rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40 dark:bg-white dark:text-black"
            >
              {busy ? 'Se lucrează…' : 'Salvează și traduce în toate limbile'}
            </button>

            <button
              type="button"
              onClick={() => resetPage(true)}
              disabled={busy || !hasOverride}
              className="rounded-lg border border-black/15 px-4 py-2 text-sm text-black/70 transition-colors hover:bg-black/5 disabled:opacity-40 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
            >
              Înapoi la original ({LANG_NAMES[lang]})
            </button>

            <button
              type="button"
              onClick={() => resetPage(false)}
              disabled={busy || !overrides[pageId]}
              className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-40 dark:text-red-300"
            >
              Înapoi la original (toate limbile)
            </button>
          </div>

          <p className="text-[11px] leading-relaxed text-black/45 dark:text-white/45">
            Textul din cod rămâne neatins — el este copia de siguranță. Modificările tale se
            păstrează separat, așa că <strong>Înapoi la original</strong> funcționează oricând,
            chiar și peste un an.
          </p>
        </>
      )}
    </div>
  );
}
