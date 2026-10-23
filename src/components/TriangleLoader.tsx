'use client';

// Pasul 2210013: dreptunghi-triunghi rotunjit care se deseneaza continuu (SVG pur, fara librarie).
// Urmeaza tema: pista gri deschis, linia neagra (light) sau alba (dark).

interface TriangleLoaderProps {
  size?: number;
  className?: string;
}

const PATH =
  'M -4.595 -140.689 L 39.21 -64.816 L 83.016 11.056 L -4.595 11.056 L -92.205 11.056 L -48.4 -64.816 Z';

export default function TriangleLoader({ size = 30, className = '' }: TriangleLoaderProps) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
      <svg width={size} height={size} viewBox="-115 -165 230 200" fill="none">
        <path
          d={PATH}
          className="stroke-[#d8d8d8] dark:stroke-white/15"
          strokeWidth="22"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={PATH}
          pathLength={1}
          className="triangle-loader-stroke stroke-black dark:stroke-white"
          strokeWidth="22"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
