'use client';

// Triunghi rotunjit al carui contur se deseneaza continuu (SVG pur).
// `rotate`: 0 = varful in sus (inapoi sus), 90 = spre dreapta (play), 180 = in jos.
// `tone="light"` = alb pe fundal intunecat (peste imagini), `auto` = urmeaza tema.

interface TriangleLoaderProps {
  size?: number;
  rotate?: 0 | 90 | 180 | 270;
  tone?: 'auto' | 'light';
  className?: string;
}

const PATH =
  'M -4.595 -140.689 L 39.21 -64.816 L 83.016 11.056 L -4.595 11.056 L -92.205 11.056 L -48.4 -64.816 Z';

export default function TriangleLoader({ size = 30, rotate = 0, tone = 'auto', className = '' }: TriangleLoaderProps) {
  const track = tone === 'light' ? 'stroke-white/25' : 'stroke-[#d8d8d8] dark:stroke-white/15';
  const line = tone === 'light' ? 'stroke-white' : 'stroke-black dark:stroke-white';

  return (
    <span className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
      <svg
        width={size}
        height={size}
        viewBox="-115 -165 230 200"
        fill="none"
        style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
      >
        <path d={PATH} className={track} strokeWidth="22" strokeLinejoin="round" strokeLinecap="round" />
        <path
          d={PATH}
          pathLength={1}
          className={`triangle-loader-stroke ${line}`}
          strokeWidth="22"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
