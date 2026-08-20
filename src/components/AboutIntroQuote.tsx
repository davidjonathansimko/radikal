// About intro quote screen / Zitat-Einstiegsbildschirm / Ecran introductiv cu citat
// Shows a single Bible verse for a few seconds before the About page appears.
// Zeigt einen Bibelvers für einige Sekunden, bevor die Über-uns-Seite erscheint.
// Afișează un verset biblic câteva secunde înainte să apară pagina Despre noi.
//
// No music, no interaction, no story — deliberately the same calm look as the
// opening screen of the story modal.

'use client';

import React, { useRef } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// ===========================================================================
// ⏱️  DURATA PAUZEI DE CITIRE (identica cu WelcomeModal.tsx)
//     In WelcomeModal linia ~213:  .to({}, { duration: 3.5 })
//     Schimba DOAR acest numar daca vrei alta durata. Este in SECUNDE.
// ===========================================================================
const READING_PAUSE_S = 3.5;

// Pastrat pentru compatibilitate cu importurile existente (milisecunde).
export const INTRO_DURATION_MS = READING_PAUSE_S * 1000;

// Versetul: Proverbe 29:25 / Sprüche 29,25 / Proverbs 29:25 / Притчи 29:25
const bibleVerses: Record<string, string> = {
  de: 'Menschenfurcht bringt zu Fall',
  en: 'The fear of man brings a snare',
  ro: 'Frica de oameni este o capcană',
  ru: 'Боязнь пред людьми ставит сеть',
};

const bibleReferences: Record<string, string> = {
  de: 'Sprüche 29,25',
  en: 'Proverbs 29:25',
  ro: 'Proverbe 29:25',
  ru: 'Притчи 29:25',
};

interface AboutIntroQuoteProps {
  onFinish: () => void;
}

export default function AboutIntroQuote({ onFinish }: AboutIntroQuoteProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();

  // Refs identice cu WelcomeModal / Same refs as WelcomeModal
  const verseContainerRef = useRef<HTMLDivElement>(null);
  const verseTextRef = useRef<HTMLQuoteElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const citeRef = useRef<HTMLElement>(null);

  // Limba curenta cu fallback sigur / Current language with safe fallback
  const lang = bibleVerses[language] ? language : 'de';

  // Culori adaptate la tema / Theme-aware colors
  const bgColor = theme === 'dark' ? '#000000' : '#ffffff';
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const textLight = theme === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';

  // GSAP Animation - copie 1:1 a timeline-ului din WelcomeModal.tsx
  useGSAP(() => {
    if (!citeRef.current) return;

    const words = wordsRef.current.filter(Boolean);
    if (words.length === 0) {
      onFinish();
      return;
    }

    // Stare initiala: ascunse, cu blur, usor spre stanga
    gsap.set(words, {
      opacity: 0,
      filter: 'blur(10px)',
      y: 8,
      x: -15,
    });
    gsap.set(citeRef.current, {
      opacity: 0,
      y: 15,
      x: -10,
    });

    const tl = gsap.timeline({
      onComplete: () => {
        onFinish();
      },
    });

    // Faza 1: cuvintele apar unul cate unul (stanga -> dreapta)
    tl.to(words, {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      x: 0,
      duration: 0.8,
      stagger: {
        each: 0.18,
        ease: 'power1.inOut',
      },
      ease: 'power2.out',
    })
      // Referinta apare dupa cuvinte
      .to(
        citeRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'power2.out',
        },
        '-=0.8'
      )
      // Faza 2: pauza de citire (3.5 secunde)
      .to({}, { duration: READING_PAUSE_S })
      // Faza 3: dispare mai intai referinta
      .to(citeRef.current, {
        opacity: 0,
        filter: 'blur(8px)',
        x: 20,
        duration: 0.6,
        ease: 'power2.in',
      })
      // Apoi cuvintele dispar de la DREAPTA la STANGA
      .to(
        [...words].reverse(),
        {
          opacity: 0,
          filter: 'blur(12px)',
          x: 30,
          duration: 0.4,
          stagger: {
            each: 0.06,
            ease: 'power1.in',
          },
          ease: 'power2.in',
        },
        '-=0.3'
      );
  }, { scope: verseContainerRef, dependencies: [lang] });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      style={{ backgroundColor: bgColor }}
      role="status"
      aria-live="polite"
    >
      <div className="flex-1 flex items-center justify-center" ref={verseContainerRef}>
        <div className="text-center max-w-4xl mx-auto px-6 relative">
          {/* Versetul cu animatie GSAP cuvant cu cuvant */}
          <blockquote
            ref={verseTextRef}
            className="font-cinzel text-2xl md:text-3xl lg:text-4xl xl:text-5xl italic leading-relaxed mb-8 min-h-[180px] flex items-center justify-center px-4 flex-wrap"
            style={{
              color: textColor,
              textShadow: '0 0 20px rgba(255,255,255,0.15)',
            }}
          >
            <span className="inline tracking-wider">&quot;</span>
            {bibleVerses[lang].split(' ').map((word, index) => (
              <span
                key={index}
                ref={(el) => {
                  wordsRef.current[index] = el;
                }}
                className="inline-block mx-1 tracking-wider"
                style={{ opacity: 0 }}
              >
                {word}
              </span>
            ))}
            <span className="inline tracking-wider">&quot;</span>
          </blockquote>

          {/* Referinta biblica - animata cu GSAP */}
          <cite
            ref={citeRef}
            className="block font-cinzel text-xl md:text-2xl lg:text-3xl font-medium mt-6"
            style={{
              color: textLight,
              opacity: 0,
              transform: 'translateY(20px)',
            }}
          >
            — {bibleReferences[lang]}
          </cite>
        </div>
      </div>
    </div>
  );
}
