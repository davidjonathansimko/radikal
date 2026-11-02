'use client';

// Centrul audio al aplicatiei: stie ce se asculta acum (un element <audio>), chiar daca pagina care l-a pornit
// a fost parasita. Il folosesc playerul mic, lista de asteptare, temporizatorul de somn, memorarea locului si ascultarea offline.
// Totul se activeaza din admin (vezi `uiSettings`); fara ele, nimic din asta nu ruleaza.

import { useSyncExternalStore } from 'react';
import { getUiSettingsSync } from '@/lib/uiSettings';
import { wideArtwork, ARTWORK_SIZE } from '@/lib/mediaArtwork';

export interface HubTrack {
  /** Cheia sub care se tine locul ramas (la TextToSpeech include prefixul rubricii). */
  slug: string;
  /** Slug-ul pentru fisierul pregenerat (`/api/blog-audio`). */
  audioSlug?: string;
  lang: string;
  title: string;
  href: string;
  imageUrl?: string | null;
}

export interface HubState {
  track: HubTrack | null;
  playing: boolean;
  position: number;
  duration: number;
  /** Pagina care a pornit audio-ul nu mai exista: playerul mic il preia. */
  background: boolean;
  queue: HubTrack[];
  /** Momentul (ms) la care se opreste somnul, sau `'end'` = la sfarsitul blogului. */
  sleep: number | 'end' | null;
  loading: boolean;
}

const QUEUE_KEY = 'radikalAudioQueue';
const POS_PREFIX = 'radikalAudioPos:';
const OFFLINE_CACHE = 'radikal-audio-offline';

let audio: HTMLAudioElement | null = null;
let state: HubState = { track: null, playing: false, position: 0, duration: 0, background: false, queue: [], sleep: null, loading: false };
const listeners = new Set<() => void>();
let sleepTimer: ReturnType<typeof setTimeout> | undefined;
let lastSave = 0;
let queueLoaded = false;

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
  } catch {
    /* ignorat */
  }
}

function persistQueue() {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(state.queue));
  } catch {
    /* ignorat */
  }
}

const posKey = (t: HubTrack) => `${POS_PREFIX}${t.slug}:${t.lang}`;

/** Locul ramas (0..1) pentru un blog, sau 0. */
export function getSavedRatio(slug: string, lang: string): number {
  try {
    const v = Number(localStorage.getItem(`${POS_PREFIX}${slug}:${lang}`));
    return Number.isFinite(v) && v > 0.01 && v < 0.97 ? v : 0;
  } catch {
    return 0;
  }
}

function savePosition(force = false) {
  if (!audio || !state.track || !getUiSettingsSync().resumePos) return;
  const d = audio.duration;
  if (!Number.isFinite(d) || d <= 0) return;
  const now = Date.now();
  if (!force && now - lastSave < 4000) return;
  lastSave = now;
  try {
    const ratio = audio.currentTime / d;
    if (ratio >= 0.97) localStorage.removeItem(posKey(state.track));
    else localStorage.setItem(posKey(state.track), String(ratio));
  } catch {
    /* ignorat */
  }
}

// ---- Media Session (notificare, ecran de blocare) ---------------------------------------------------
function applyMediaSession() {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !state.track) return;
  const t = state.track;
  const set = (art: { src: string; sizes: string; type: string }[]) => {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: 'RADIKAL.', album: 'Radikale Bibellehre', artwork: art });
    } catch {
      /* ignorat */
    }
  };
  set(t.imageUrl ? [{ src: t.imageUrl, sizes: '512x512', type: 'image/jpeg' }] : [{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }]);
  if (t.imageUrl) {
    void wideArtwork(t.imageUrl).then((d) => {
      if (d && state.track === t) set([{ src: d, sizes: ARTWORK_SIZE, type: 'image/jpeg' }]);
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
    ms.setActionHandler('nexttrack', state.queue.length ? () => void hub.playNext() : null);
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
  const onEnded = () => {
    savePosition(true);
    emit({ playing: false });
    if (state.sleep === 'end') {
      emit({ sleep: null });
      return;
    }
    if (getUiSettingsSync().queue && state.queue.length) void hub.playNext();
  };
  a.addEventListener('timeupdate', onTime);
  a.addEventListener('play', sync);
  a.addEventListener('pause', () => {
    savePosition(true);
    sync();
  });
  a.addEventListener('durationchange', sync);
  a.addEventListener('ended', onEnded);
  (a as HTMLAudioElement & { __hubUnbind?: () => void }).__hubUnbind = () => {
    a.removeEventListener('timeupdate', onTime);
    a.removeEventListener('play', sync);
    a.removeEventListener('durationchange', sync);
    a.removeEventListener('ended', onEnded);
  };
  sync();
}

function unbind(a: HTMLAudioElement | null) {
  (a as (HTMLAudioElement & { __hubUnbind?: () => void }) | null)?.__hubUnbind?.();
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

export const hub = {
  getState: () => state,

  /** Preia un element audio pornit de o pagina (de ex. ascultarea simpla din articol). */
  attach(el: HTMLAudioElement, track: HubTrack, background = false) {
    loadQueue();
    if (audio && audio !== el) {
      unbind(audio);
      if (state.background) audio.pause();
    }
    audio = el;
    unbind(el);
    bind(el);
    emit({ track, background, loading: false });
    applyMediaSession();
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
    savePosition(true);
    unbind(el);
    audio = null;
    emit({ track: null, playing: false, position: 0, duration: 0, background: false });
  },

  /** Cititorul s-a intors la articolul al carui audio ruleaza in fundal: il oprim, locul ramane salvat. */
  takeBack(slug: string) {
    if (audio && state.track?.slug === slug && state.background) {
      savePosition(true);
      audio.pause();
      unbind(audio);
      audio = null;
      emit({ track: null, playing: false, position: 0, duration: 0, background: false });
    }
  },

  toggle(play?: boolean) {
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

  stop() {
    if (!audio) return;
    savePosition(true);
    audio.pause();
    unbind(audio);
    audio = null;
    clearTimeout(sleepTimer);
    emit({ track: null, playing: false, position: 0, duration: 0, background: false, sleep: null });
    try {
      navigator.mediaSession.metadata = null;
    } catch {
      /* ignorat */
    }
  },

  // ---- lista de asteptare ----
  enqueue(track: HubTrack) {
    loadQueue();
    if (state.queue.some((q) => q.slug === track.slug && q.lang === track.lang)) return;
    emit({ queue: [...state.queue, track] });
    persistQueue();
  },
  removeFromQueue(i: number) {
    emit({ queue: state.queue.filter((_, k) => k !== i) });
    persistQueue();
  },
  isQueued: (slug: string, lang: string) => state.queue.some((q) => q.slug === slug && q.lang === lang),

  /** Porneste un blog cu audio pregenerat (cautat dupa `audioSlug`). Intoarce `false` daca nu exista fisier. */
  async playPrebuilt(track: HubTrack): Promise<boolean> {
    loadQueue();
    emit({ loading: true });
    try {
      const r = await fetch(`/api/blog-audio?slug=${encodeURIComponent(track.audioSlug ?? track.slug)}&language=${track.lang}`);
      const d = await r.json();
      if (!d?.audioUrl) {
        emit({ loading: false });
        return false;
      }
      const el = new Audio(await resolveUrl(d.audioUrl as string));
      el.preload = 'auto';
      hub.attach(el, track, true);
      if (getUiSettingsSync().resumePos) {
        const ratio = getSavedRatio(track.slug, track.lang);
        if (ratio > 0) el.addEventListener('loadedmetadata', () => (el.currentTime = ratio * el.duration), { once: true });
      }
      await el.play().catch(() => {});
      return true;
    } catch {
      emit({ loading: false });
      return false;
    }
  },

  async playNext(): Promise<void> {
    loadQueue();
    while (state.queue.length) {
      const [next, ...rest] = state.queue;
      emit({ queue: rest });
      persistQueue();
      if (await hub.playPrebuilt(next)) return;
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
      // coborare lina a volumului, apoi pauza
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
