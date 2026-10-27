// Pasul 261026 — partea de browser a notificarilor push.
// Functioneaza si fara cont: abonarea e legata de dispozitiv; daca esti
// autentificat, serverul leaga abonarea si de cont.

'use client';

import { getSupabaseClient } from '@/lib/supabase';

export type PushKind = 'blogs' | 'marturii' | 'verse' | 'reels';
export type PushPrefs = Record<PushKind, boolean>;
export const PUSH_KINDS: PushKind[] = ['blogs', 'marturii', 'verse', 'reels'];

const PREFS_KEY = 'radikalPushPrefs';
const DEFAULT_PREFS: PushPrefs = { blogs: true, marturii: true, verse: true, reels: true };

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function loadPrefs(): PushPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
    if (raw && typeof raw === 'object') return { ...DEFAULT_PREFS, ...raw };
  } catch {
    /* implicit */
  }
  return { ...DEFAULT_PREFS };
}

function savePrefs(p: PushPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignorat */
  }
}

function keyToBytes(base64: string): Uint8Array {
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

async function authHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await getSupabaseClient().auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export type PushStatus = 'unsupported' | 'denied' | 'off' | 'on';

/** Starea curenta, fara sa ceara nimic utilizatorului. */
export async function getPushStatus(): Promise<PushStatus> {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  try {
    return (await currentSubscription()) ? 'on' : 'off';
  } catch {
    return 'off';
  }
}

export type PushResult = 'ok' | 'unsupported' | 'denied' | 'not_configured' | 'error';

/** Ce lipseste pe server (doar nume de variabile), pentru mesajul din fereastra de notificari. */
let lastDetail = '';
export function getLastPushDetail(): string {
  return lastDetail;
}

/** Porneste (sau actualizeaza) abonarea cu preferintele date. */
export async function applyPrefs(prefs: PushPrefs, lang: string): Promise<PushResult> {
  if (!pushSupported()) return 'unsupported';
  savePrefs(prefs);
  const any = PUSH_KINDS.some((k) => prefs[k]);

  try {
    let sub = await currentSubscription();

    if (!any) {
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });
      }
      return 'ok';
    }

    if (!sub) {
      const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (permission !== 'granted') return 'denied';

      const keyRes = await fetch('/api/push/subscribe');
      if (!keyRes.ok) {
        const info = (await keyRes.json().catch(() => ({}))) as { missing?: string[] };
        lastDetail = (info.missing || []).join(', ');
        return 'not_configured';
      }
      const { publicKey } = (await keyRes.json()) as { publicKey: string };

      const reg = await navigator.serviceWorker.ready;
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyToBytes(publicKey) as unknown as BufferSource,
      });
    }

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ subscription: sub.toJSON(), prefs, lang }),
    });
    return res.ok ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}
