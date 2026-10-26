'use client';

// Pictograme pentru fereastra „Benachrichtigungen" — redesenate ca SVG animat
// dupa animatiile Lottie (phone-notification, newspaper, activity-log).
// Culorile urmeaza tema (currentColor); animatiile se opresc la „reduced motion".

import React from 'react';

type P = { className?: string; size?: number };

export function PhoneBellIcon({ className = '', size = 64 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="16" y="6" width="32" height="52" rx="6" />
      <path d="M27 11h10" />
      <circle cx="32" cy="52" r="1.2" fill="currentColor" />
      <g className="notif-bell">
        <path d="M32 20c-5 0-8 3.6-8 8.5V34l-2.5 3.5h21L40 34v-5.5c0-4.900-3-8.500-8-8.500z" />
        <path d="M29.500 40.500a2.800 2.800 0 0 0 5 0" />
      </g>
      <circle cx="41" cy="21" r="3.200" fill="currentColor" stroke="none" className="notif-blink" />
    </svg>
  );
}

export function NewspaperIcon({ className = '', size = 30 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M10 8h28a2 2 0 0 1 2 2v28a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V10a2 2 0 0 1 2-2z" />
      <rect x="14" y="14" width="10" height="9" rx="1" />
      <path d="M29 15h6" className="notif-draw" style={{ ['--len' as string]: 6 }} />
      <path d="M29 20h6" className="notif-draw" style={{ ['--len' as string]: 6, animationDelay: '0.15s' }} />
      <path d="M14 29h21" className="notif-draw" style={{ ['--len' as string]: 21, animationDelay: '0.3s' }} />
      <path d="M14 35h21" className="notif-draw" style={{ ['--len' as string]: 21, animationDelay: '0.45s' }} />
    </svg>
  );
}

export function ActivityIcon({ className = '', size = 30 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="6" y="6" width="36" height="36" rx="6" />
      <path d="M11 25h6l4-10 6 18 4-8h6" className="notif-draw" style={{ ['--len' as string]: 60 }} />
    </svg>
  );
}

export function VerseIcon({ className = '', size = 30 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 57.88 57.88" fill="currentColor" aria-hidden="true" className={className}>
      <g className="notif-sway">
        <path d="M57.469,15.017L47.384,5.94H26v-4c0-0.553-0.448-1-1-1s-1,0.447-1,1v4H0v20h24v30c0,0.553,0.448,1,1,1s1-0.447,1-1v-30 h21.384l10.083-9.075c0.263-0.235,0.413-0.572,0.413-0.925S57.73,15.251,57.469,15.017z M46.616,23.94H2v-16h44.616l8.889,8 L46.616,23.94z" />
      </g>
    </svg>
  );
}
