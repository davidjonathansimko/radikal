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
import VersionTextEditor from '@/components/admin/VersionTextEditor';
import PushAdminPanel from '@/components/admin/PushAdminPanel';
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
import { fetchEnabledPages, setPageEnabled, fetchGuestAllowed, setGuestAllowed, fetchGuestReadAllowed, setGuestReadAllowed, type TogglablePage } from '@/lib/pageSettings';
import { fetchFeatureFlags, setFeatureFlag, FEATURE_DEFAULTS, type FeatureKey } from '@/lib/featureFlags';

type FeatureGroup = 'article' | 'home' | 'kids' | 'lists';

const FEATURE_LIST: { key: FeatureKey; group: FeatureGroup; title: string; text: string }[] = [
  { key: 'archiveStacked', group: 'lists', title: 'Butonul Arhiv: pictograma deasupra, textul dedesubt', text: 'Pornit = pictograma animată mare, cu cuvântul „Arhivă” dedesubt. Oprit = butonul rotunjit, cu pictograma și textul pe același rând.' },
  { key: 'homeButton', group: 'lists', title: 'Butonul „Zurück zur Startseite”', text: 'Butonul „înapoi la pagina principală” de pe paginile Blogs, Zeugnisse și Andacht. Oprit = ascuns (se ajunge acasă cu săgeata telefonului sau cu logoul).' },
  { key: 'legacyBrowse', group: 'lists', title: 'Căutare și categorii vechi pe telefon', text: 'Pe telefon și tabletă, în Blogs, Zeugnisse, Andacht și Pentru copii: butonul „… durchsuchen”, titlul „Kategorien”, bara „Kategorie suchen” și pastilele de sub ea. Oprit = se vede doar banda nouă cu pastile (Archiv + categorii). Pe desktop rămân mereu.' },
  { key: 'resume', group: 'article', title: 'Continuă lectura', text: 'Cardul „Weiterlesen” cu ultimul articol deschis (Blogs, Zeugnisse, Andacht, Copii).' },
  { key: 'swipe', group: 'article', title: 'Swipe între bloguri', text: 'Pe telefon, în articol, tragi stânga/dreapta între cele 6 bloguri din listă.' },
  { key: 'shareSelection', group: 'article', title: 'Trimite o frază ca imagine', text: 'Atingi o propoziție din articol și apare butonul „Als Bild teilen”.' },
  { key: 'protectText', group: 'article', title: 'Text protejat', text: 'Textul din articole nu se poate selecta sau copia (singura cale rămâne „Als Bild teilen” și PDF-ul). Oprit = text selectabil ca înainte.' },
  { key: 'fontControls', group: 'article', title: 'Mărimea textului (A−/A+)', text: 'Butoanele de mărire și micșorare a textului din articole.' },
  { key: 'eveningMode', group: 'article', title: 'Lectură de seară', text: 'Buton în articol: culori calde și blânde, fără animații, pentru citit seara.' },
  { key: 'remainingTime', group: 'article', title: 'Timp de citire rămas', text: 'În bara de sus a articolului apare cât mai e de citit (ex. „~3 min”).' },
  { key: 'heroDailyVerse', group: 'home', title: 'Versetul zilei pe prima pagină', text: 'Pornit = în locul versetului Apocalipsa 3:16 apare versetul zilei publicat pentru azi (dacă nu e niciunul, rămâne Apocalipsa 3:16). Oprit = mereu Apocalipsa 3:16.' },
  { key: 'scrollReveal', group: 'home', title: 'Secțiuni care curg la derulare', text: 'Titlul, textul și simbolul fiecărei secțiuni apar treptat când derulezi. Oprit = pagina arată ca înainte.' },
  { key: 'todayCard', group: 'home', title: 'Cardul „Azi”', text: 'Versetul zilei, Andacht-ul zilei și „Weiterlesen”, într-un singur loc, sub primul ecran.' },
  { key: 'listenPill', group: 'home', title: 'Butonul „PLAY” de pe carduri', text: 'Pe cardurile blogurilor dinamice, pastila PLAY pornește direct ascultarea.' },
  { key: 'kidsParentMode', group: 'kids', title: 'Pagina pentru copii, gândită pentru părinți', text: 'Text pentru părinți, butonul „Citește cu copilul” (text mare) și fără comentarii pe textele pentru copii.' },
];

const FEATURE_GROUPS: { id: FeatureGroup; title: string }[] = [
  { id: 'lists', title: 'Liste (Blogs, Zeugnisse, Andacht)' },
  { id: 'article', title: 'Citire în articol' },
  { id: 'home', title: 'Pagina principală' },
  { id: 'kids', title: 'Pagina pentru copii' },
];

/** Grup care se deschide si se inchide, ca panoul sa ramana ordonat. */
function AdminGroup({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="btn-solid flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-black dark:text-white">{title}</span>
          {summary && <span className="mt-0.5 block text-xs text-black/55 dark:text-white/55">{summary}</span>}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-black/50 transition-transform duration-300 dark:text-white/50 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>
      <div className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="space-y-4 px-4 pb-4 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
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

  // Pasul 2708018 — paginile care se pot ascunde de vizitatori.
  const [enabledPages, setEnabledPages] = useState<Set<string>>(new Set());
  const [togglingPage, setTogglingPage] = useState(false);

  // Pasul 2210001 — „Continuă ca vizitator” pe ecranul de intrare.
  const [guestOn, setGuestOn] = useState<boolean | null>(null);
  const [togglingGuest, setTogglingGuest] = useState(false);
  useEffect(() => {
    let alive = true;
    fetchGuestAllowed().then((ok) => alive && setGuestOn(ok));
    return () => {
      alive = false;
    };
  }, []);
  const toggleGuest = async () => {
    const next = !guestOn;
    setTogglingGuest(true);
    setError('');
    const res = await setGuestAllowed(next);
    if (res.ok) {
      setGuestOn(next);
      setNote(next ? 'Vizitatorii pot intra fără cont.' : 'Doar cei cu cont pot intra.');
    } else {
      setError(`Nu am putut schimba: ${res.error}`);
    }
    setTogglingGuest(false);
  };

  // Pasul 2210007 — pot vizitatorii sa citeasca articole? Oprit = ecran de logare.
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>(FEATURE_DEFAULTS);
  useEffect(() => {
    let alive = true;
    fetchFeatureFlags(true).then((f) => alive && setFeatures(f));
    return () => {
      alive = false;
    };
  }, []);
  const toggleFeature = async (key: FeatureKey) => {
    const next = !features[key];
    setError('');
    const res = await setFeatureFlag(key, next);
    if (res.ok) {
      setFeatures((f) => ({ ...f, [key]: next }));
      setNote(next ? 'Funcția este pornită.' : 'Funcția este oprită.');
    } else {
      setError(`Nu am putut schimba: ${res.error}`);
    }
  };

  // Pasul 2210007 — pot vizitatorii sa citeasca articole? Oprit = ecran de logare.
  const [guestRead, setGuestRead] = useState<boolean | null>(null);
  const [togglingRead, setTogglingRead] = useState(false);
  useEffect(() => {
    let alive = true;
    fetchGuestReadAllowed().then((ok) => alive && setGuestRead(ok));
    return () => {
      alive = false;
    };
  }, []);
  const toggleGuestRead = async () => {
    const next = !guestRead;
    setTogglingRead(true);
    setError('');
    const res = await setGuestReadAllowed(next);
    if (res.ok) {
      setGuestRead(next);
      setNote(
        next
          ? 'Vizitatorii pot citi bloguri, mărturii și textele pentru copii.'
          : 'Vizitatorii văd listele, dar pentru a citi trebuie să se autentifice.',
      );
    } else {
      setError(`Nu am putut schimba: ${res.error}`);
    }
    setTogglingRead(false);
  };

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

      // 2. Aceleasi campuri, traduse in celelalte limbi.
      // Un text sters (gol) se sterge in TOATE limbile si nu se traduce.
      const emptied = changedKeys.filter((k) => !(draft[k] ?? '').trim());
      const filled = changedKeys.filter((k) => (draft[k] ?? '').trim());
      let translatedLangs = 0;
      for (const other of PAGE_LANGUAGES) {
        if (other === lang) continue;
        const bucket: Record<string, string> = { ...(next[pageId]![other] ?? {}) };
        emptied.forEach((k) => {
          bucket[k] = '';
        });
        if (filled.length > 0) {
          const results = await translateMany(filled.map((k) => draft[k]), lang, other);
          if (results.length === filled.length) {
            filled.forEach((k, i) => {
              const value = (results[i] || '').trim();
              if (value) bucket[k] = value;
            });
            translatedLangs += 1;
          }
        } else if (emptied.length > 0) {
          translatedLangs += 1;
        }
        next[pageId]![other] = bucket;
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

  // Paginile care se pot porni și opri. Restul sunt mereu vizibile.
  const TOGGLABLE: TogglablePage[] = ['andacht', 'copii', 'verset', 'news'];
  const isTogglable = (TOGGLABLE as string[]).includes(pageId);
  const pageOn = enabledPages.has(pageId);

  useEffect(() => {
    let alive = true;
    fetchEnabledPages().then((s) => {
      if (alive) setEnabledPages(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  const togglePage = useCallback(async () => {
    if (!isTogglable) return;
    setTogglingPage(true);
    setError('');
    setNote('');
    const next = !pageOn;
    const res = await setPageEnabled(pageId as TogglablePage, next);
    if (!res.ok) {
      setError(
        `Nu am putut schimba: ${res.error}. Ai rulat STEP_2708018_ANDACHT_COPII.sql în Supabase?`,
      );
    } else {
      setEnabledPages((prev) => {
        const s = new Set(prev);
        if (next) s.add(pageId);
        else s.delete(pageId);
        return s;
      });
      setNote(next ? 'Pagina este acum vizibilă pentru toată lumea.' : 'Pagina este ascunsă.');
    }
    setTogglingPage(false);
  }, [isTogglable, pageOn, pageId]);

  const inputClass =
    'w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black/40 dark:border-white/15 dark:bg-black dark:text-white dark:focus:border-white/40';

  return (
    <div className="space-y-5">
      <AdminGroup title="Acces vizitatori" summary={`Butonul vizitator: ${guestOn === false ? 'oprit' : 'activ'} · Citire: ${guestRead ? 'permisă' : 'cere cont'}`}>
      {/* --- Acces vizitatori (pasul 2210001) --- */}
      <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-black dark:text-white">
              {guestOn === false ? 'Doar cu cont' : 'Butonul „Continuă ca vizitator” este activ'}
            </p>
            <p className="mt-1 text-xs text-black/55 dark:text-white/55">
              {guestOn === false
                ? 'Ecranul de intrare oferă doar autentificare și înregistrare.'
                : 'Vizitatorii pot răsfoi, dar pentru a citi bloguri, mărturii sau pagina pentru copii trebuie să se autentifice.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void toggleGuest()}
            disabled={togglingGuest || guestOn === null}
            className={`btn-solid shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 ${
              guestOn === false
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'border border-black/15 text-black dark:border-white/15 dark:text-white'
            }`}
          >
            {togglingGuest ? 'Se schimbă…' : guestOn === false ? 'Permite vizitatori' : 'Oprește vizitatorii'}
          </button>
        </div>
      </div>

      {/* --- Citirea pentru vizitatori (pasul 2210007) --- */}
      <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-black dark:text-white">
              {guestRead ? 'Vizitatorii pot citi totul' : 'Vizitatorii nu pot citi: li se cere contul'}
            </p>
            <p className="mt-1 text-xs text-black/55 dark:text-white/55">
              {guestRead
                ? 'Bloguri, mărturii și pagina pentru copii se deschid și fără cont, ca înainte.'
                : 'Vizitatorii văd listele de carduri, dar la deschiderea unui articol apare ecranul care cere autentificarea.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void toggleGuestRead()}
            disabled={togglingRead || guestRead === null}
            className={`btn-solid shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 ${
              guestRead
                ? 'border border-black/15 text-black dark:border-white/15 dark:text-white'
                : 'bg-black text-white dark:bg-white dark:text-black'
            }`}
          >
            {togglingRead ? 'Se schimbă…' : guestRead ? 'Cere cont pentru citit' : 'Lasă vizitatorii să citească'}
          </button>
        </div>
      </div>

      </AdminGroup>

      <AdminGroup
        title="Funcții pentru cititori"
        summary={`${FEATURE_LIST.filter((f) => features[f.key]).length} din ${FEATURE_LIST.length} pornite`}
      >
        {FEATURE_GROUPS.map((g) => (
          <div key={g.id}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">{g.title}</p>
            <div className="space-y-3">
              {FEATURE_LIST.filter((f) => f.group === g.id).map((f) => (
                <div key={f.key} className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-black dark:text-white">{f.title}</p>
                    <p className="mt-0.5 text-xs text-black/55 dark:text-white/55">{f.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleFeature(f.key)}
                    className={`btn-solid shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80 ${
                      features[f.key]
                        ? 'border border-black/15 text-black dark:border-white/15 dark:text-white'
                        : 'bg-black text-white dark:bg-white dark:text-black'
                    }`}
                  >
                    {features[f.key] ? 'Pornit · Oprește' : 'Oprit · Pornește'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </AdminGroup>

      <AdminGroup title="Notificări push" summary="Test și trimitere manuală">
        <PushAdminPanel />
      </AdminGroup>

      <AdminGroup title="Text versiune (meniu)" summary="Textul de la sfârșitul meniului">
        <VersionTextEditor />
      </AdminGroup>

      <AdminGroup title="Tutorial de la început" summary="Textul se schimbă mai jos, la Pagina → Tutorial">
        <p className="text-xs text-black/60 dark:text-white/60">
          Apare o singură dată pe dispozitiv, la prima intrare. Alege mai jos pagina „Tutorial” ca să-i schimbi textele, în toate limbile.
        </p>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem('radikalOnboardingDone');
              localStorage.removeItem('radikalTour:blogs');
              setNote('Tutorialul va apărea din nou la următoarea deschidere a paginii principale, pe acest dispozitiv.');
            } catch {
              setError('Nu am putut reseta tutorialul.');
            }
          }}
          className="btn-solid rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-black dark:border-white/15 dark:text-white"
        >
          Arată din nou tutorialul (acest dispozitiv)
        </button>
        <button
          type="button"
          onClick={() => setPageId('onboarding')}
          className="btn-solid ml-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
        >
          Editează textele tutorialului
        </button>
      </AdminGroup>

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

      {/* --- Pagina pornită sau oprită (pasul 2708018) --- */}
      {isTogglable && (
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-black dark:text-white">
                {pageOn ? 'Pagina este vizibilă' : 'Pagina este ascunsă'}
              </p>
              <p className="mt-1 text-xs text-black/55 dark:text-white/55">
                {pageOn
                  ? 'Apare în meniu și oricine îi poate deschide adresa.'
                  : 'Nu apare în meniu, iar cine îi scrie adresa este trimis la pagina principală. Tu o vezi în continuare din administrare.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void togglePage()}
              disabled={togglingPage}
              className={`btn-solid shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 ${
                pageOn
                  ? 'border border-black/15 text-black dark:border-white/15 dark:text-white'
                  : 'bg-black text-white dark:bg-white dark:text-black'
              }`}
            >
              {togglingPage ? 'Se schimbă…' : pageOn ? 'Dezactivează pagina' : 'Activează pagina'}
            </button>
          </div>
        </div>
      )}

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
