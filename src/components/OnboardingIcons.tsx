'use client';

// Doua pictograme animate, refacute in SVG dupa fisierele Lottie `write-letter.json` si `on-off-toggle.json`.
// Culoarea urmeaza tema (`currentColor`); animatiile sunt in globals.css (`.wl-*`, `.tg-*`).

import React from 'react';

const SHEET = 'M2070.7 814.8V2079.6H1181.8V2185.2A149 149 0 0 1 884 2185.2V814.8A149 149 0 0 1 1032.9 665.9H1921.8A149 149 0 0 1 2070.7 814.8Z';
const FOOT = 'M1181.8 2079.6H2368.5V2185.2A149 149 0 0 1 2219.6 2334.1H1032.9A149 149 0 0 1 1181.8 2185.2Z';

const LINES = [
  'M1062 977.4H1893',
  'M1062 1252.7H1649',
  'M1062 1528.1H1375',
  'M1062 1803.5H1299',
];

/** Foaie de hartie pe care un creion scrie patru randuri. */
export function WriteLetterIcon({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="476 350 2300 2300"
      style={{ overflow: 'visible' }}
      fill="none"
      stroke="currentColor"
      strokeWidth={38}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={SHEET} />
      <path d={FOOT} />
      {LINES.map((d, i) => (
        <path key={i} d={d} pathLength={1} className={`wl-line wl-line-${i + 1}`} />
      ))}
      <g className="wl-pencil">
        <path d="M274 -59L0 0L58 -274" />
        <path d="M940 -725L604 -389L274 -59L58 -274L604 -820L725 -941" />
        <path d="M1040 -825L940 -725L725 -941L824 -1040L906 -1040L1040 -906Z" />
      </g>
    </svg>
  );
}

/** Comutator pornit/oprit: butonul rotund aluneca dintr-o parte in alta. */
export function ToggleIcon({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="30 50 132 92"
      fill="none"
      stroke="currentColor"
      strokeWidth={10.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect className="tg-track" x="44.3" y="65" width="103.4" height="62" rx="31" />
      <circle className="tg-knob" cx="0" cy="96" r="12.9" />
    </svg>
  );
}
