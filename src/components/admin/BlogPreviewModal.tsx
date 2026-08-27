'use client';

// =====================================================================
// Pasul 2208002 (punctul 10) — PREVIZUALIZARE „așa se va vedea"
// =====================================================================
// Pana acum se previzualizau doar efectele de imagine. Acum vezi
// ARTICOLUL INTREG, exact asa cum il va vedea cititorul: imaginea cu
// efectele alese, titlul, textul impartit in paragrafe si eticheta
// „PLAY" daca articolul este dinamic.
//
// Este doar o fereastra de verificare — nu salveaza si nu schimba nimic.
// =====================================================================

import React, { useEffect } from 'react';
import ImageEffectLayers, {
  effectsFilter,
  type ImageEffectSettings,
} from '@/components/ImageEffectLayers';

interface BlogPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  tags: string[];
  effects: ImageEffectSettings;
  isDynamic: boolean;
}

export default function BlogPreviewModal({
  isOpen,
  onClose,
  title,
  excerpt,
  content,
  imageUrl,
  tags,
  effects,
  isDynamic,
}: BlogPreviewModalProps) {
  // Esc inchide fereastra
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Blocam derularea paginii din spate
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Previzualizare articol"
      onClick={onClose}
    >
      <div
        className="my-6 w-full max-w-2xl rounded-2xl bg-white text-gray-900 shadow-2xl dark:bg-[#0b0b0b] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---- Bara de sus ---- */}
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-3 dark:border-white/10">
          <span className="text-xs font-semibold uppercase tracking-wide opacity-60">
            Previzualizare — așa se va vedea
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Închide"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 sm:px-8 sm:py-7">
          {/* ---- Imaginea, cu efectele alese ---- */}
          {imageUrl && (
            <div className="relative mb-5 overflow-hidden rounded-xl" style={{ aspectRatio: '16/9' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{ filter: effectsFilter(effects) }}
              />
              <ImageEffectLayers settings={effects} zIndex={2} />

              {isDynamic && (
                // Pasul 2308001: previzualizarea arata acum EXACT butonul real —
                // mare, pe mijloc, cu bataie de inima. Inainte era un semn mic
                // in colt, care nu semana cu ce vede cititorul.
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-white">
                  <span
                    className="play-blog-heartbeat flex items-center justify-center rounded-full bg-black/50 shadow-2xl ring-1 ring-white/25 backdrop-blur-md"
                    style={{ width: 'clamp(72px, 18%, 110px)', aspectRatio: '1' }}
                  >
                    <svg
                      viewBox="0 0 60 60"
                      fill="none" stroke="currentColor" strokeWidth="2.6"
                      strokeLinecap="round" strokeLinejoin="round"
                      aria-hidden="true"
                      style={{ width: '58%', height: '58%' }}
                    >
                      <circle cx="30" cy="30" r="27" />
                      <path d="M24 19l18 11-18 11V19z" fill="currentColor" stroke="none" />
                    </svg>
                  </span>
                  <span className="rounded-full bg-black/55 px-4 py-1.5 text-sm font-semibold tracking-wide shadow-lg backdrop-blur-md">
                    Play Blog
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ---- Titlul ---- */}
          <h1 className="mb-2 text-2xl font-bold leading-tight sm:text-3xl">
            {title || <span className="opacity-40">(fără titlu)</span>}
          </h1>

          {/* ---- Metadate ---- */}
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs opacity-60">
            <span>{new Date().toLocaleDateString('de-DE')}</span>
            <span>{minutes} min</span>
            <span>{words.toLocaleString('ro-RO')} cuvinte</span>
            {tags.slice(0, 4).map((t) => (
              <span key={t} className="rounded-full bg-black/10 px-2 py-0.5 dark:bg-white/10">
                #{t}
              </span>
            ))}
          </div>

          {/* ---- Rezumatul ---- */}
          {excerpt && (
            <p className="mb-5 border-l-2 border-black/20 pl-3 text-sm italic opacity-75 dark:border-white/25">
              {excerpt}
            </p>
          )}

          {/* ---- Textul ---- */}
          <div className="space-y-4 text-[15px] leading-relaxed sm:text-base">
            {paragraphs.length ? (
              paragraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p className="opacity-40">(fără conținut)</p>
            )}
          </div>

          <p className="mt-6 border-t border-black/10 pt-4 text-[11px] opacity-50 dark:border-white/10">
            Aceasta este doar o verificare. Textul afișat cititorilor va fi tradus
            automat prin DeepL, iar referințele biblice vor fi colorate.
          </p>
        </div>
      </div>
    </div>
  );
}
