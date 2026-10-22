'use client';

// Pasul 2210010 — „citit": cititorul poate bifa ce a citit. Se tine pe acest
// dispozitiv (localStorage); apare o bifa mica in liste.

import { useCallback, useEffect, useState } from 'react';

const KEY = 'radikalReadItems';
const EVENT = 'radikal-read-change';
const MAX = 500;

function readAll(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function normalize(href: string): string {
  const clean = href.split(/[?#]/)[0];
  return clean.length > 1 ? clean.replace(/\/$/, '') : clean;
}

export function useReadItems() {
  const [items, setItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const sync = () => setItems(new Set(readAll()));
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const isRead = useCallback((href: string) => items.has(normalize(href)), [items]);

  const setRead = useCallback((href: string, read: boolean) => {
    const key = normalize(href);
    const next = readAll().filter((x) => x !== key);
    if (read) next.push(key);
    try {
      localStorage.setItem(KEY, JSON.stringify(next.slice(-MAX)));
      window.dispatchEvent(new Event(EVENT));
    } catch {
      /* fila privata */
    }
  }, []);

  return { isRead, setRead };
}
