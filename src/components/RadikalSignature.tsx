'use client';

import React from 'react';
import { useSignature } from '@/lib/signature';

/** Semnatura fina „RADIKAL." (text in Cinzel sau logoul redesenat in contur, monocrom). Culoarea o ia din text. */
export default function RadikalSignature({ where, className = '', style }: { where: 'reels' | 'playBlog'; className?: string; style?: React.CSSProperties }) {
  const s = useSignature();
  if (!s[where]) return null;

  return (
    <div className={`pointer-events-none select-none ${className}`} style={style} aria-hidden="true">
      {s.style === 'logo' ? (
        <svg width="74" height="22" viewBox="0 0 96 28" fill="none" className="mx-auto opacity-60">
          <rect x="1" y="1" width="94" height="26" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
          <text x="48" y="19.5" textAnchor="middle" fontFamily="'Poppins', 'Inter', Arial, sans-serif" fontWeight="700" fontSize="15" fill="currentColor" letterSpacing="0.3">
            radikal.
          </text>
        </svg>
      ) : (
        <span className="block text-center font-cinzel text-[11px] font-semibold uppercase tracking-[0.32em] opacity-55">RADIKAL.</span>
      )}
    </div>
  );
}
