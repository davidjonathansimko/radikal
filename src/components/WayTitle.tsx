'use client';

/**
 * Pasul 2708026 — „Der Weg", între logo și meniu.
 *
 * Apare cu aceeași animație ca versetele de intro: cuvintele intră unul câte
 * unul, din ceață. Când cititorul coboară în pagină, se sting la fel de
 * liniștit și lasă locul pilulei de progres. Când urcă înapoi sus, revin.
 */

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useLanguage } from '@/hooks/useLanguage';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const WORDS: Record<string, string> = {
  de: 'Der Weg',
  en: 'The Way',
  ro: 'Calea',
  ru: 'Путь',
};

export default function WayTitle({ visible }: { visible: boolean }) {
  const { language } = useLanguage();
  const { reduced: reduceMotion } = useReducedMotion();
  const text = WORDS[language] || WORDS.de;
  const words = text.split(' ');

  const rootRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);

  // Rămâne montat cât timp se stinge, ca animația de ieșire să se poată vedea.
  const [mounted, setMounted] = useState(visible);
  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  useGSAP(
    () => {
      const live = wordsRef.current.filter((w): w is HTMLSpanElement => Boolean(w?.isConnected));
      if (live.length === 0) return;

      if (reduceMotion) {
        gsap.set(live, { opacity: visible ? 1 : 0, filter: 'blur(0px)', y: 0 });
        if (!visible) setMounted(false);
        return;
      }

      if (visible) {
        gsap.fromTo(
          live,
          { opacity: 0, filter: 'blur(8px)', y: 6 },
          {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            duration: 0.7,
            stagger: { each: 0.12, ease: 'power1.inOut' },
            ease: 'power2.out',
          },
        );
      } else {
        gsap.to([...live].reverse(), {
          opacity: 0,
          filter: 'blur(8px)',
          y: -5,
          duration: 0.5,
          stagger: { each: 0.06, ease: 'power1.inOut' },
          ease: 'power2.inOut',
          onComplete: () => setMounted(false),
        });
      }
    },
    { scope: rootRef, dependencies: [visible, text, reduceMotion] },
  );

  if (!mounted) return null;

  return (
    <div ref={rootRef} className="flex-1 flex justify-center px-2">
      <span className="flex items-baseline gap-1.5 font-cinzel text-[13px] font-semibold uppercase tracking-[0.2em] text-black/70 dark:text-white/70">
        {words.map((word, i) => (
          <span
            key={i}
            ref={(el) => {
              wordsRef.current[i] = el;
            }}
            className="inline-block"
            style={{ opacity: 0, willChange: 'opacity, filter, transform' }}
          >
            {word}
          </span>
        ))}
      </span>
    </div>
  );
}
