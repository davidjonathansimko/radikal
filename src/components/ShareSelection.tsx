'use client';

// Text selectat in articol -> buton „Als Bild teilen" (imagine cu textul peste poza articolului).

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { shareVerseImage, IMAGE_SAVED } from '@/lib/shareImage';

const LABEL: Record<string, string> = {
  de: 'Als Bild teilen',
  en: 'Share as image',
  ro: 'Trimite ca imagine',
  ru: 'Поделиться картинкой',
};

interface Props {
  /** Selectorul zonei din care se poate selecta textul. */
  scope: string;
  imageUrl?: string | null;
  title?: string;
  enabled?: boolean;
}

export default function ShareSelection({ scope, imageUrl, title, enabled = true }: Props) {
  const { language } = useLanguage();
  const [pos, setPos] = useState<{ x: number; y: number; text: string } | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!enabled) return;
    let timer: number | undefined;

    const update = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setPos(null);
        return;
      }
      const text = sel.toString().replace(/\s+/g, ' ').trim();
      const range = sel.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const el = node.nodeType === 1 ? (node as Element) : node.parentElement;
      if (!el || !el.closest(scope) || text.length < 12 || text.length > 700) {
        setPos(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      const x = Math.min(Math.max(rect.left + rect.width / 2, 90), window.innerWidth - 90);
      // Sub selectie: deasupra sta meniul nativ al telefonului.
      const y = Math.min(rect.bottom + 14, window.innerHeight - 70);
      setPos({ x, y, text });
    };

    const onChange = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(update, 250);
    };
    document.addEventListener('selectionchange', onChange);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('selectionchange', onChange);
    };
  }, [scope, enabled]);

  if (!enabled || !pos || typeof document === 'undefined') return note ? renderNote(note) : null;

  const share = async () => {
    const result = await shareVerseImage({
      text: pos.text,
      imageUrl,
      url: window.location.href,
      title: title ?? 'RADIKAL.',
    });
    setPos(null);
    window.getSelection()?.removeAllRanges();
    if (result === 'downloaded') {
      setNote(IMAGE_SAVED[language] ?? IMAGE_SAVED.de);
      window.setTimeout(() => setNote(''), 2200);
    }
  };

  return createPortal(
    <button
      type="button"
      // Pastram selectia cand se apasa butonul.
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => void share()}
      className="btn-solid fixed z-[9000] -translate-x-1/2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-xl ring-1 ring-white/20 active:scale-95 dark:bg-white dark:text-black dark:ring-black/10"
      style={{ left: pos.x, top: pos.y }}
    >
      {LABEL[language] ?? LABEL.de}
    </button>,
    document.body,
  );
}

function renderNote(note: string) {
  return createPortal(
    <div className="fixed bottom-28 left-1/2 z-[9000] -translate-x-1/2 rounded-full bg-black px-4 py-2 text-sm text-white shadow-xl dark:bg-white dark:text-black">
      {note}
    </div>,
    document.body,
  );
}
