'use client';

// Text din articol -> imagine de partajat.
// Cu `protect`: textul nu se poate selecta, copia sau trage. Singura actiune e atingerea unei propozitii,
// care se coloreaza si arata butonul „Als Bild teilen". Fara `protect`: se selecteaza liber, ca inainte.

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { shareVerseImage, IMAGE_SAVED } from '@/lib/shareImage';

const LABEL: Record<string, string> = {
  de: 'Als Bild teilen',
  en: 'Share as image',
  ro: 'Trimite ca imagine',
  ru: 'Поделиться картинкой',
};

const HIGHLIGHT = 'radikal-share';

interface HighlightApi {
  highlights?: { set: (name: string, value: unknown) => void; delete: (name: string) => void };
}
declare const Highlight: (new (...ranges: Range[]) => unknown) | undefined;

interface Props {
  /** Selectorul zonei cu text. */
  scope: string;
  imageUrl?: string | null;
  title?: string;
  enabled?: boolean;
  protect?: boolean;
  /** false = textul ramane protejat, dar nu apare butonul de imagine. */
  canShare?: boolean;
}

/** Punctul din text pe care s-a atins (nod text + pozitie). */
function caretAt(x: number, y: number): { node: Node; offset: number } | null {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  if (doc.caretRangeFromPoint) {
    const r = doc.caretRangeFromPoint(x, y);
    return r ? { node: r.startContainer, offset: r.startOffset } : null;
  }
  const p = doc.caretPositionFromPoint?.(x, y);
  return p ? { node: p.offsetNode, offset: p.offset } : null;
}

/** Propozitia care contine pozitia atinsa, ca Range. */
function sentenceRange(scope: Element, x: number, y: number): { range: Range; text: string } | null {
  const caret = caretAt(x, y);
  if (!caret || caret.node.nodeType !== Node.TEXT_NODE || !scope.contains(caret.node)) return null;

  const block = (caret.node.parentElement?.closest('p, li, blockquote, h2, h3, div') ?? scope) as Element;
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const nodes: { node: Text; start: number }[] = [];
  let full = '';
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    nodes.push({ node: n as Text, start: full.length });
    full += (n as Text).data;
  }
  const hit = nodes.find((n) => n.node === caret.node);
  if (!hit) return null;
  const idx = hit.start + caret.offset;

  const isEnd = (i: number) => /[.!?…]/.test(full[i]) && (i + 1 >= full.length || /[\s"“”„»)]/.test(full[i + 1]));
  let from = 0;
  for (let i = Math.min(idx, full.length) - 1; i >= 0; i--) {
    if (isEnd(i)) {
      from = i + 1;
      break;
    }
  }
  let to = full.length;
  for (let i = Math.max(idx, 0); i < full.length; i++) {
    if (isEnd(i)) {
      to = i + 1;
      break;
    }
  }
  while (from < to && /\s/.test(full[from])) from++;
  if (to - from < 8) return null;

  const locate = (pos: number) => {
    for (let k = nodes.length - 1; k >= 0; k--) if (pos >= nodes[k].start) return { node: nodes[k].node, offset: pos - nodes[k].start };
    return { node: nodes[0].node, offset: 0 };
  };
  const a = locate(from);
  const b = locate(to);
  const range = document.createRange();
  range.setStart(a.node, Math.min(a.offset, a.node.data.length));
  range.setEnd(b.node, Math.min(b.offset, b.node.data.length));
  return { range, text: full.slice(from, to).replace(/\s+/g, ' ').trim() };
}

export default function ShareSelection({ scope, imageUrl, title, enabled = true, protect = false, canShare = true }: Props) {
  const { language } = useLanguage();
  const [pos, setPos] = useState<{ x: number; y: number; text: string } | null>(null);
  const [note, setNote] = useState('');
  const keepRef = useRef(false);

  const clearHighlight = () => {
    try {
      (CSS as unknown as HighlightApi).highlights?.delete(HIGHLIGHT);
    } catch {
      /* fara Custom Highlight API */
    }
  };

  // ---- Fara protectie: selectie libera, ca inainte ----
  useEffect(() => {
    if (!enabled || protect || !canShare) return;
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
  }, [scope, enabled, protect, canShare]);

  // ---- Cu protectie: fara selectie/copiere, doar atingerea unei propozitii ----
  useEffect(() => {
    if (!enabled || !protect) return;
    document.documentElement.classList.add('text-protect');

    const inScope = (t: EventTarget | null) => t instanceof Element && Boolean(t.closest(scope));
    const block = (e: Event) => {
      if (inScope(e.target)) e.preventDefault();
    };
    const events = ['copy', 'cut', 'contextmenu', 'dragstart', 'selectstart'] as const;
    events.forEach((n) => document.addEventListener(n, block));

    let downX = 0;
    let downY = 0;
    const onDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (keepRef.current) return;
      if (Math.abs(e.clientX - downX) > 8 || Math.abs(e.clientY - downY) > 8) return;
      const target = e.target as Element | null;
      // Atingerea butonului „Als Bild teilen" nu trebuie sa stearga selectia: pointerup vine inaintea click-ului.
      if (target?.closest('[data-no-share]')) return;
      if (!target || !target.closest(scope)) {
        clearHighlight();
        setPos(null);
        return;
      }
      if (target.closest('a, button, .bible-ref, [data-no-share]')) return;
      if (!canShare) return;
      const scopeEl = target.closest(scope)!;
      const hit = sentenceRange(scopeEl, e.clientX, e.clientY);
      if (!hit) {
        clearHighlight();
        setPos(null);
        return;
      }
      try {
        if (typeof Highlight !== 'undefined') {
          (CSS as unknown as HighlightApi).highlights?.set(HIGHLIGHT, new Highlight(hit.range));
        }
      } catch {
        /* fara colorare, butonul ramane */
      }
      const rect = hit.range.getBoundingClientRect();
      const x = Math.min(Math.max(rect.left + rect.width / 2, 90), window.innerWidth - 90);
      const y = Math.min(rect.bottom + 14, window.innerHeight - 70);
      setPos({ x, y, text: hit.text });
    };
    const onScroll = () => {
      clearHighlight();
      setPos(null);
    };

    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.documentElement.classList.remove('text-protect');
      events.forEach((n) => document.removeEventListener(n, block));
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
      window.removeEventListener('scroll', onScroll);
      clearHighlight();
    };
  }, [scope, enabled, protect, canShare]);

  if (!enabled || typeof document === 'undefined') return null;

  const share = async () => {
    if (!pos) return;
    keepRef.current = true;
    const result = await shareVerseImage({
      text: pos.text,
      imageUrl,
      url: window.location.href,
      title: title ?? 'RADIKAL.',
    });
    keepRef.current = false;
    setPos(null);
    clearHighlight();
    window.getSelection()?.removeAllRanges();
    if (result === 'downloaded') {
      setNote(IMAGE_SAVED[language] ?? IMAGE_SAVED.de);
      window.setTimeout(() => setNote(''), 2200);
    }
  };

  return createPortal(
    <>
      {pos && (
        <button
          type="button"
          // Pastram selectia/colorarea cand se apasa butonul.
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => void share()}
          className="btn-solid fixed z-[9000] -translate-x-1/2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-xl ring-1 ring-white/20 active:scale-95 dark:bg-white dark:text-black dark:ring-black/10"
          style={{ left: pos.x, top: pos.y }}
          data-no-share
        >
          {LABEL[language] ?? LABEL.de}
        </button>
      )}
      {note && (
        <div className="fixed bottom-28 left-1/2 z-[9000] -translate-x-1/2 rounded-full bg-black px-4 py-2 text-sm text-white shadow-xl dark:bg-white dark:text-black">
          {note}
        </div>
      )}
    </>,
    document.body,
  );
}
