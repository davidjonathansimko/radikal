'use client';

// Centrul audio al aplicatiei. Regula de baza: UN SINGUR sunet odata.
//  - „Playerul mic" = ascultarea simpla (butonul Play din articol, „Jetzt hören", lista de asteptare).
//  - „Play Blog" (modalul dinamic) este separat: cat timp e deschis, playerul mic se opreste din redat si isi
//    reia locul cand modalul se inchide (vezi `beginExternal` / `endExternal`).
// Totul se activeaza din admin (vezi `uiSettings`); fara ele, nimic din asta nu ruleaza.

import { useSyncExternalStore } from 'react';
import { getUiSettingsSync } from '@/lib/uiSettings';
import { wideArtwork, ARTWORK_SIZE } from '@/lib/mediaArtwork';
import { loadSpeechText, buildSpeechUrl } from '@/lib/blogSpeech';
import { fetchCatalog, getCatalogSync } from '@/lib/audioCatalog';

export type HubLang = 'de' | 'en' | 'ru' | 'ro';
/** Ce se intampla cand se termina un blog: `stop` = ca pana acum (urmeaza lista, apoi gata), `continue` = urmatorul din lista oficiala, `repeat` = acelasi blog. */
export type HubMode = 'stop' | 'continue' | 'repeat';

export interface HubTrack {
  /** Cheia sub care se tine locul ramas si identitatea in lista (include prefixul rubricii). */
  slug: string;
  /** Slug-ul pentru fisierul pregenerat (`/api/blog-audio`). */
  audioSlug?: string;
  /** Limba in care este incarcat audio-ul acum. */
  lang: string;
  /** Titlul original (romana); cele traduse sunt in `titles`. */
  title: string;
  titles?: Partial<Record<HubLang, string>>;
  categoryIds?: string[];
  href: string;
  imageUrl?: string | null;
  /** Doar `blog_posts` poate fi construit din text (daca nu exista audio pregenerat). */
  table?: 'blog_posts';
  rawSlug?: string;
}

export interface HubState {
  track: HubTrack | null;
  /** 'page' = pornit de ascultarea simpla din articol; 'hub' = pornit de playerul mic. */
  origin: 'page' | 'hub' | null;
  playing: boolean;
  position: number;
  duration: number;
  /** Pagina care a pornit audio-ul nu mai exista: playerul mic il preia. */
  background: boolean;
  /** Piesa e afisata, dar nu are inca sunet incarcat (dupa repornirea aplicatiei sau dupa schimbarea limbii). */
  restored: boolean;
  loading: boolean;
  buildPct: number;
  queue: HubTrack[];
  /** Momentul (ms) la care se opreste somnul, sau `'end'` = la sfarsitul blogului. */
  sleep: number | 'end' | null;
  /** Titlul si categoria in limba cititorului (le completeaza `AudioHubSync`). */
  display: { title: string; category: string } | null;
  /** Play Blog (modalul) este deschis. */
  external: boolean;
  /** Audio-ul nu a putut fi pornit (nu exista fisier si nici text din care sa se construiasca). */
  error: boolean;
  /** Blogurile ascultate inainte de cel curent (pentru „anteriorul"). */
  history: HubTrack[];
  mode: HubMode;
}

const QUEUE_KEY = 'radikalAudioQueue';
const MODE_KEY = 'radikalAudioMode';
const LAST_KEY = 'radikalAudioLast';
const POS_PREFIX = 'radikalAudioPos:';
const OFFLINE_CACHE = 'radikal-audio-offline';

let audio: HTMLAudioElement | null = null;
let hubLang: string = 'de';
let playToken = 0;
let state: HubState = {
  track: null,
  origin: null,
  playing: false,
  position: 0,
  duration: 0,
  background: false,
  restored: false,
  loading: false,
  buildPct: 0,
  queue: [],
  sleep: null,
  display: null,
  external: false,
  error: false,
  history: [],
  mode: 'stop',
};
const listeners = new Set<() => void>();
let sleepTimer: ReturnType<typeof setTimeout> | undefined;
let lastSave = 0;
let queueLoaded = false;

type Bound = HTMLAudioElement & { __hubUnbind?: () => void };

function emit(patch: Partial<HubState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function loadQueue() {
  if (queueLoaded || typeof window === 'undefined') return;
  queueLoaded = true;
  try {
    const raw = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    if (Array.isArray(raw)) state = { ...state, queue: raw.filter((x) => x && typeof x.slug === 'string' && typeof x.href === 'string') };
    const m = localStorage.getItem(MODE_KEY);
    if (m === 'continue' || m === 'repeat') state = { ...state, mode: m };
  } catch {
    /* ignorat */
  }
}

/** Anteriorul / urmatorul exista? Lista oficiala si istoricul se folosesc doar cu fereastra noua a playerului (nu cu cea clasica). */
export function getNav(s: HubState): { hasNext: boolean; hasPrev: boolean } {
  const ui = getUiSettingsSync();
  const queued = ui.queue && s.queue.length > 0;
  if (ui.miniPlayerSheet === 'classic') return { hasNext: queued, hasPrev: false };
  const all = getCatalogSync()?.all ?? [];
  const i = s.track ? all.findIndex((t) => t.slug === s.track!.slug) : -1;
  return {
    hasNext: queued || (i >= 0 && i < all.length - 1),
    hasPrev: s.history.length > 0 || (!queued && i > 0),
  };
}

function ensureCatalog() {
  if (getUiSettingsSync().miniPlayerSheet === 'classic') return;
  void fetchCatalog().then(() => {
    emit({});
    applyMediaSession();
  });
}

function persistQueue() {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(state.queue));
  } catch {
    /* ignorat */
  }
}

/** Locul ramas (0..1) pentru un blog in limba data, sau 0. */
export function getSavedRatio(slug: string, lang: string): number {
  try {
    const v = Number(localStorage.getItem(`${POS_PREFIX}${slug}:${lang}`));
    return Number.isFinite(v) && v > 0.01 && v < 0.97 ? v : 0;
  } catch {
    return 0;
  }
}

function savePosition(force = false) {
  if (!audio || !state.track) return;
  const ui = getUiSettingsSync();
  if (!ui.resumePos && ui.miniPlayer === 'off') return;
  const d = audio.duration;
  if (!Number.isFinite(d) || d <= 0) return;
  const now = Date.now();
  if (!force && now - lastSave < 4000) return;
  lastSave = now;
  try {
    const ratio = audio.currentTime / d;
    const t = state.track;
    if (ratio >= 0.97) {
      localStorage.removeItem(`${POS_PREFIX}${t.slug}:${t.lang}`);
      localStorage.removeItem(LAST_KEY);
    } else {
      localStorage.setItem(`${POS_PREFIX}${t.slug}:${t.lang}`, String(ratio));
      // Pentru „reintru in aplicatie si playerul mic e unde l-am lasat".
      if (state.origin !== null && ui.miniPlayer !== 'off') localStorage.setItem(LAST_KEY, JSON.stringify({ track: t, ratio }));
    }
  } catch {
    /* ignorat */
  }
}

// ---- Media Session (notificare, ecran de blocare) ---------------------------------------------------
function applyMediaSession() {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !state.track || state.external) return;
  const t = state.track;
  const title = state.display?.title || t.titles?.[hubLang as HubLang] || t.title;
  const album = state.display?.category || 'Radikale Bibellehre';
  const set = (art: { src: string; sizes: string; type: string }[]) => {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title, artist: 'RADIKAL.', album, artwork: art });
    } catch {
      /* ignorat */
    }
  };
  set(t.imageUrl ? [{ src: t.imageUrl, sizes: '512x512', type: 'image/jpeg' }] : [{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }]);
  if (t.imageUrl) {
    void wideArtwork(t.imageUrl).then((d) => {
      if (d && state.track === t && !state.external) set([{ src: d, sizes: ARTWORK_SIZE, type: 'image/jpeg' }]);
    });
  }
  try {
    const ms = navigator.mediaSession;
    ms.setActionHandler('play', () => hub.toggle(true));
    ms.setActionHandler('pause', () => hub.toggle(false));
    ms.setActionHandler('stop', () => hub.stop());
    ms.setActionHandler('seekbackward', () => hub.seekBy(-15));
    ms.setActionHandler('seekforward', () => hub.seekBy(30));
    ms.setActionHandler('seekto', (d) => typeof d.seekTime === 'number' && hub.seek(d.seekTime));
    const nav = getNav(state);
    ms.setActionHandler('nexttrack', nav.hasNext ? () => void hub.next() : null);
    ms.setActionHandler('previoustrack', nav.hasPrev ? () => void hub.prev() : null);
  } catch {
    /* ignorat */
  }
}

// ---- Evenimentele elementului audio -----------------------------------------------------------------
function bind(a: HTMLAudioElement) {
  const sync = () => emit({ position: a.currentTime || 0, duration: Number.isFinite(a.duration) ? a.duration : 0, playing: !a.paused && !a.ended });
  const onTime = () => {
    emit({ position: a.currentTime || 0, duration: Number.isFinite(a.duration) ? a.duration : 0 });
    savePosition();
  };
  const onPause = () => {
    savePosition(true);
    sync();
  };
  const onEnded = () => {
    savePosition(true);
    try {
      localStorage.removeItem(LAST_KEY);
    } catch {
      /* ignorat */
    }
    if (state.sleep === 'end') {
      emit({ sleep: null, playing: false });
      return;
    }
    const ui = getUiSettingsSync();
    if (ui.miniPlayerSheet !== 'classic' && state.mode === 'repeat') {
      a.currentTime = 0;
      void a.play().catch(() => {});
      return;
    }
    if (ui.queue && state.queue.length) {
      void hub.playNext();
      return;
    }
    if (ui.miniPlayerSheet !== 'classic' && state.mode === 'continue' && getNav(state).hasNext) {
      void hub.next();
      return;
    }
    // Blogul s-a terminat si nu mai urmeaza altceva: playerul mic dispare.
    unbind(a);
    if (audio === a) audio = null;
    emit({ track: null, origin: null, playing: false, position: 0, duration: 0, background: false, restored: false });
  };
  a.addEventListener('timeupdate', onTime);
  a.addEventListener('play', sync);
  a.addEventListener('pause', onPause);
  a.addEventListener('durationchange', sync);
  a.addEventListener('ended', onEnded);
  (a as Bound).__hubUnbind = () => {
    a.removeEventListener('timeupdate', onTime);
    a.removeEventListener('play', sync);
    a.removeEventListener('pause', onPause);
    a.removeEventListener('durationchange', sync);
    a.removeEventListener('ended', onEnded);
  };
  sync();
}

function unbind(a: HTMLAudioElement | null) {
  (a as Bound | null)?.__hubUnbind?.();
  if (a) (a as Bound).__hubUnbind = undefined;
}

async function resolveUrl(url: string): Promise<string> {
  if (!getUiSettingsSync().offlineAudio || typeof caches === 'undefined') return url;
  try {
    const c = await caches.open(OFFLINE_CACHE);
    const hit = await c.match(url);
    if (hit) return URL.createObjectURL(await hit.blob());
  } catch {
    /* ignorat */
  }
  return url;
}

function dropAudio(pause = true) {
  if (!audio) return;
  savePosition(true);
  unbind(audio);
  if (pause) audio.pause();
  audio = null;
}

export const hub = {
  getState: () => state,
  getLang: () => hubLang,

  /** Preia un element audio pornit de o pagina (ascultarea simpla din articol). Orice alt sunet in curs se opreste. */
  attach(el: HTMLAudioElement, track: HubTrack, origin: 'page' | 'hub' = 'page') {
    loadQueue();
    if (audio && audio !== el) dropAudio(true);
    audio = el;
    unbind(el);
    bind(el);
    emit({ track, origin, background: origin === 'hub', restored: false, loading: false, buildPct: 0, error: false });
    applyMediaSession();
    ensureCatalog();
  },

  /** Pagina a fost parasita, dar audio-ul continua: playerul mic il preia. */
  markBackground(el: HTMLAudioElement) {
    if (audio === el) {
      emit({ background: true });
      applyMediaSession();
    }
  },

  detach(el: HTMLAudioElement) {
    if (audio !== el) return;
    dropAudio(false);
    emit({ track: null, origin: null, playing: false, position: 0, duration: 0, background: false, restored: false });
  },

  /** Cititorul s-a intors la articolul al carui audio (pornit din pagina) ruleaza in fundal: il oprim, locul ramane salvat. */
  takeBack(slug: string) {
    if (audio && state.track?.slug === slug && state.origin === 'page' && state.background) {
      dropAudio(true);
      emit({ track: null, origin: null, playing: false, position: 0, duration: 0, background: false, restored: false });
    }
  },

  toggle(play?: boolean) {
    if (state.external) return;
    if (state.restored && state.track) {
      if (play !== false) void hub.playBlog(state.track, { resume: 'force' });
      return;
    }
    if (!audio) return;
    const want = play ?? audio.paused;
    if (want) void audio.play().catch(() => {});
    else audio.pause();
  },

  seek(t: number) {
    if (audio && Number.isFinite(audio.duration)) audio.currentTime = Math.max(0, Math.min(audio.duration, t));
  },

  seekBy(d: number) {
    if (audio) hub.seek(audio.currentTime + d);
  },

  /** Inchide playerul mic: se opreste sunetul si dispare (lista de asteptare ramane). */
  stop() {
    ++playToken;
    dropAudio(true);
    clearTimeout(sleepTimer);
    try {
      localStorage.removeItem(LAST_KEY);
    } catch {
      /* ignorat */
    }
    emit({ track: null, origin: null, playing: false, position: 0, duration: 0, background: false, restored: false, loading: false, buildPct: 0, sleep: null, error: false, history: [] });
    try {
      navigator.mediaSession.metadata = null;
    } catch {
      /* ignorat */
    }
  },

  // ---- Play Blog (modal) ----
  /** Se deschide Play Blog: playerul mic se opreste din redat; notificarea apartine acum modalului. */
  beginExternal() {
    if (audio && !audio.paused) audio.pause();
    emit({ external: true });
  },
  endExternal() {
    emit({ external: false });
    applyMediaSession();
  },

  // ---- afisare in limba cititorului ----
  setDisplay(display: { title: string; category: string } | null) {
    emit({ display });
    applyMediaSession();
  },

  /** Limba aplicatiei s-a schimbat: titlurile se adapteaza, iar blogul care ruleaza reincepe de la inceput in limba noua. */
  setLanguage(lang: string) {
    if (lang === hubLang) return;
    hubLang = lang;
    const tr = state.track;
    if (!tr || tr.lang === lang) return;
    const wasActive = state.playing || state.loading;
    ++playToken;
    dropAudio(true);
    emit({ playing: false, position: 0, duration: 0, loading: false, buildPct: 0, display: null });
    if (wasActive && !state.external) void hub.playBlog(tr, { resume: 'none' });
    else emit({ track: { ...tr, lang }, restored: true, background: true, origin: 'hub' });
  },

  /** Dupa repornirea aplicatiei: playerul mic apare din nou, in pauza, de unde a ramas. */
  restoreLast() {
    loadQueue();
    if (state.track || typeof window === 'undefined' || getUiSettingsSync().miniPlayer === 'off') return;
    try {
      const raw = JSON.parse(localStorage.getItem(LAST_KEY) || 'null') as { track?: HubTrack; ratio?: number } | null;
      if (!raw?.track?.slug) return;
      emit({ track: { ...raw.track, lang: hubLang }, origin: 'hub', background: true, restored: true, playing: false, position: 0, duration: 0, display: null });
    } catch {
      /* ignorat */
    }
  },

  // ---- lista de asteptare ----
  enqueue(track: HubTrack) {
    loadQueue();
    if (state.queue.some((q) => q.slug === track.slug)) return;
    emit({ queue: [...state.queue, track] });
    persistQueue();
  },
  removeFromQueue(i: number) {
    emit({ queue: state.queue.filter((_, k) => k !== i) });
    persistQueue();
  },
  isQueued: (slug: string) => state.queue.some((q) => q.slug === slug),

  /** Porneste acum un element din lista de asteptare. */
  async playQueueIndex(i: number): Promise<void> {
    const item = state.queue[i];
    if (!item) return;
    emit({ queue: state.queue.filter((_, k) => k !== i) });
    persistQueue();
    await hub.playBlog(item);
  },

  /**
   * Porneste un blog in limba aplicatiei: intai fisierul pregenerat, altfel vocea se construieste din text.
   * Orice alt sunet in curs se opreste inainte. Intoarce `false` daca nu se poate reda.
   */
  async playBlog(track: Omit<HubTrack, 'lang'> & { lang?: string }, opts: { resume?: 'auto' | 'force' | 'none'; noHistory?: boolean } = {}): Promise<boolean> {
    loadQueue();
    if (state.external) return false;
    const t: HubTrack = { ...track, lang: hubLang };
    const token = ++playToken;
    const previous = state.track && state.track.slug !== t.slug && !opts.noHistory ? state.track : null;
    dropAudio(true);
    emit({
      track: t,
      origin: 'hub',
      background: true,
      restored: false,
      loading: true,
      buildPct: 0,
      playing: false,
      position: 0,
      duration: 0,
      display: null,
      error: false,
      ...(previous ? { history: [...state.history, previous].slice(-30) } : {}),
    });
    applyMediaSession();
    ensureCatalog();

    // Fara sunet disponibil playerul ramane vizibil, pe pauza, cu mesaj; un nou Play incearca din nou.
    const fail = () => {
      if (token === playToken) emit({ loading: false, buildPct: 0, restored: true, error: true, playing: false });
      return false;
    };
    try {
      let url: string | null = null;
      try {
        const r = await fetch(`/api/blog-audio?slug=${encodeURIComponent(t.audioSlug ?? t.slug)}&language=${t.lang}`);
        const d = await r.json();
        if (d?.audioUrl) url = await resolveUrl(d.audioUrl as string);
      } catch {
        /* cadem pe constructia din text */
      }
      if (token !== playToken) return false;
      if (!url && t.table === 'blog_posts' && t.rawSlug) {
        const text = await loadSpeechText(t.rawSlug, t.lang);
        if (token !== playToken) return false;
        if (text) {
          url = await buildSpeechUrl(text, t.lang, { slug: t.slug, title: t.title }, (pct) => token === playToken && emit({ buildPct: pct }), () => token !== playToken);
        }
      }
      if (token !== playToken) return false;
      if (!url) return fail();

      const el = new Audio(url);
      el.preload = 'auto';
      hub.attach(el, t, 'hub');
      const mode = opts.resume ?? 'auto';
      const ratio = mode === 'none' ? 0 : mode === 'force' || getUiSettingsSync().resumePos ? getSavedRatio(t.slug, t.lang) : 0;
      if (ratio > 0) el.addEventListener('loadedmetadata', () => (el.currentTime = ratio * el.duration), { once: true });
      await el.play().catch(() => {});
      return true;
    } catch {
      return fail();
    }
  },

  /** Urmatorul: din lista de asteptare, altfel din lista oficiala de bloguri (doar cu fereastra noua). */
  async next(): Promise<void> {
    loadQueue();
    if (state.external) return;
    if (getUiSettingsSync().queue && state.queue.length) return hub.playNext();
    if (getUiSettingsSync().miniPlayerSheet === 'classic') return;
    const all = (await fetchCatalog()).all;
    const i = all.findIndex((t) => t.slug === state.track?.slug);
    if (i >= 0 && i < all.length - 1) await hub.playBlog(all[i + 1]);
  },

  /** Anteriorul: ultimul blog ascultat, altfel (fara lista de asteptare) cel dinainte in lista oficiala. */
  async prev(): Promise<void> {
    loadQueue();
    if (state.external || getUiSettingsSync().miniPlayerSheet === 'classic') return;
    const h = state.history;
    if (h.length) {
      emit({ history: h.slice(0, -1) });
      await hub.playBlog(h[h.length - 1], { noHistory: true });
      return;
    }
    if (getUiSettingsSync().queue && state.queue.length) return;
    const all = (await fetchCatalog()).all;
    const i = all.findIndex((t) => t.slug === state.track?.slug);
    if (i > 0) await hub.playBlog(all[i - 1]);
  },

  async playRandom(): Promise<void> {
    if (state.external) return;
    const all = (await fetchCatalog()).all.filter((t) => t.slug !== state.track?.slug);
    if (all.length) await hub.playBlog(all[Math.floor(Math.random() * all.length)]);
  },

  setMode(mode: HubMode) {
    emit({ mode });
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* ignorat */
    }
  },

  async playNext(): Promise<void> {
    loadQueue();
    if (state.external) return;
    while (state.queue.length) {
      const [next, ...rest] = state.queue;
      emit({ queue: rest });
      persistQueue();
      if (await hub.playBlog(next)) return;
    }
  },

  // ---- temporizator de somn ----
  setSleep(minutes: number | 'end' | null) {
    clearTimeout(sleepTimer);
    if (minutes === null || minutes === 'end') {
      emit({ sleep: minutes });
      return;
    }
    emit({ sleep: Date.now() + minutes * 60000 });
    sleepTimer = setTimeout(() => {
      const a = audio;
      if (!a) return emit({ sleep: null });
      const start = a.volume;
      let step = 0;
      const fade = setInterval(() => {
        step += 1;
        a.volume = Math.max(0, start * (1 - step / 15));
        if (step >= 15) {
          clearInterval(fade);
          a.pause();
          a.volume = start;
          emit({ sleep: null });
        }
      }, 200);
    }, minutes * 60000);
  },

  // ---- ascultare offline ----
  async isOffline(url: string): Promise<boolean> {
    if (typeof caches === 'undefined') return false;
    try {
      return Boolean(await (await caches.open(OFFLINE_CACHE)).match(url));
    } catch {
      return false;
    }
  },
  async saveOffline(slug: string, lang: string): Promise<boolean> {
    if (typeof caches === 'undefined') return false;
    try {
      const d = await (await fetch(`/api/blog-audio?slug=${encodeURIComponent(slug)}&language=${lang}`)).json();
      if (!d?.audioUrl) return false;
      const res = await fetch(d.audioUrl as string);
      if (!res.ok) return false;
      await (await caches.open(OFFLINE_CACHE)).put(d.audioUrl as string, res);
      return true;
    } catch {
      return false;
    }
  },
  async removeOffline(slug: string, lang: string): Promise<void> {
    try {
      const d = await (await fetch(`/api/blog-audio?slug=${encodeURIComponent(slug)}&language=${lang}`)).json();
      if (d?.audioUrl) await (await caches.open(OFFLINE_CACHE)).delete(d.audioUrl as string);
    } catch {
      /* ignorat */
    }
  },
};

function subscribe(cb: () => void) {
  loadQueue();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useAudioHub(): HubState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
