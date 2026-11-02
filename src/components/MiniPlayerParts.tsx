'use client';

// Piese comune ale playerului mic (bara si ferestrele lui).

import React from 'react';
import Image from 'next/image';

export const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

export function PlayIcon({ playing, size = 18 }: { playing: boolean; size?: number }) {
  return playing ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function Cover({ src, size, round = false, radius }: { src?: string | null; size: number; round?: boolean; radius?: number }) {
  return (
    <span
      className={`relative block shrink-0 overflow-hidden bg-black/20 ${round ? 'rounded-full' : radius ? '' : 'rounded-md'}`}
      style={{ width: size, height: size, borderRadius: round ? undefined : radius }}
    >
      {src ? <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" /> : <span className="flex h-full w-full items-center justify-center font-cinzel text-xs font-bold text-white/80">R.</span>}
    </span>
  );
}
