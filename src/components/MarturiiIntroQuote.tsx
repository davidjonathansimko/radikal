// Ecran de intrare pentru pagina Mărturii
// Pasul 2608003 — două fraze, una după alta, apoi pagina.
//
// Aceeași liniște ca la ecranul de intrare al paginii Despre: fără muzică,
// fără butoane, fără poveste. Doar versetul, apoi gândul care urmează din el.

'use client';

import React, { useRef } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAppFullscreen } from '@/lib/appFullscreen';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// ===========================================================================
// ⏱️  Cât stă fiecare frază pe ecran, în SECUNDE.
//     Schimbă doar aceste două numere dacă vrei alt ritm.
// ===========================================================================
const VERSE_PAUSE_S = 3.5;
const SECOND_PAUSE_S = 3.0;

/** Evrei 13:8 — versetul din care pornește totul */
const verses: Record<string, string> = {
  de: 'Jesus Christus ist derselbe gestern und heute und in Ewigkeit!',
  en: 'Jesus Christ is the same yesterday and today and forever!',
  ro: 'Isus Hristos este același ieri și azi și în veci!',
  ru: 'Иисус Христос вчера и сегодня и вовеки Тот же!',
};

const references: Record<string, string> = {
  de: 'Hebräer 13,8',
  en: 'Hebrews 13:8',
  ro: 'Evrei 13:8',
  ru: 'Евреям 13:8',
};

/** A doua frază — contrastul: El nu se schimbă, noi da. */
const secondLines: Record<string, string> = {
  de: 'Der Mensch aber ist wandelbar, wandelbar wie das Wetter.',
  en: 'But man is changeable, changeable as the weather.',
  ro: 'Dar omul este schimbător, schimbător ca vremea.',
  ru: 'А человек изменчив, изменчив, как погода.',
};

interface MarturiiIntroQuoteProps {
  onFinish: () => void;
  /**
   * Pasul 2608004 — textele vin din pagina, ca sa poata fi schimbate din
   * Setari → Pagini → Marturii. Daca lipsesc, se folosesc cele de mai sus.
   */
  verse?: string;
  reference?: string;
  secondLine?: string;
}

export default function MarturiiIntroQuote({
  onFinish,
  verse,
  reference,
  secondLine,
}: MarturiiIntroQuoteProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { reduced: reduceMotion } = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const verseWordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const citeRef = useRef<HTMLElement>(null);
  const secondWordsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const lang = verses[language] ? language : 'de';

  // Pasul 2708016 — in aplicatie, versetul ocupa tot ecranul.
  useAppFullscreen(true);

  // Textul scris de tine bate textul din cod.
  const verseText = (verse || '').trim() || verses[lang];
  const referenceText = (reference || '').trim() || references[lang];
  const secondText = (secondLine || '').trim() || secondLines[lang];

  const bgColor = theme === 'dark' ? '#000000' : '#ffffff';
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const textLight = theme === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';

  useGSAP(
    () => {
      const verseWords = verseWordsRef.current.filter(Boolean);
      const secondWords = secondWordsRef.current.filter(Boolean);

      // Fără cuvinte pe ecran nu are ce anima — mergem direct la pagină.
      if (verseWords.length === 0 || !citeRef.current) {
        onFinish();
        return;
      }

      // Cine a cerut din sistem „mai puțină mișcare" vede textul liniștit.
      if (reduceMotion) {
        const t = setTimeout(onFinish, (VERSE_PAUSE_S + SECOND_PAUSE_S) * 1000);
        return () => clearTimeout(t);
      }

      gsap.set(verseWords, { opacity: 0, filter: 'blur(10px)', y: 8, x: -15 });
      gsap.set(citeRef.current, { opacity: 0, y: 15, x: -10 });
      gsap.set(secondWords, { opacity: 0, filter: 'blur(10px)', y: 8, x: -15 });

      const tl = gsap.timeline({ onComplete: onFinish });

      // ---- Fraza 1: versetul, cuvânt cu cuvânt
      tl.to(verseWords, {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        x: 0,
        duration: 0.8,
        stagger: { each: 0.18, ease: 'power1.inOut' },
        ease: 'power2.out',
      })
        .to(citeRef.current, { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' }, '-=0.8')
        .to({}, { duration: VERSE_PAUSE_S })
        .to(citeRef.current, {
          opacity: 0,
          filter: 'blur(8px)',
          x: 20,
          duration: 0.6,
          ease: 'power2.in',
        })
        .to(
          [...verseWords].reverse(),
          {
            opacity: 0,
            filter: 'blur(12px)',
            x: 30,
            duration: 0.4,
            stagger: { each: 0.06, ease: 'power1.in' },
            ease: 'power2.in',
          },
          '-=0.3',
        );

      // ---- Fraza 2: „Dar omul este schimbător…"
      if (secondWords.length > 0) {
        tl.to(secondWords, {
          opacity: 1,
          filter: 'blur(0px)',
          y: 0,
          x: 0,
          duration: 0.8,
          stagger: { each: 0.16, ease: 'power1.inOut' },
          ease: 'power2.out',
        })
          .to({}, { duration: SECOND_PAUSE_S })
          .to([...secondWords].reverse(), {
            opacity: 0,
            filter: 'blur(12px)',
            x: 30,
            duration: 0.4,
            stagger: { each: 0.05, ease: 'power1.in' },
            ease: 'power2.in',
          });
      }
    },
    { scope: containerRef, dependencies: [lang, reduceMotion, verseText, secondText] },
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      style={{ backgroundColor: bgColor }}
      role="status"
      aria-live="polite"
    >
      <div className="flex-1 flex items-center justify-center" ref={containerRef}>
        <div className="text-center max-w-4xl mx-auto px-6 relative">
          {/* Fraza 1 — versetul */}
          <blockquote
            className="font-cinzel text-2xl md:text-3xl lg:text-4xl xl:text-5xl italic leading-relaxed mb-8 min-h-[180px] flex items-center justify-center px-4 flex-wrap"
            style={{
              color: textColor,
              textShadow: '0 0 20px rgba(255,255,255,0.15)',
              // globals.css pune o linie verticală pe orice <blockquote> — o anulăm.
              borderLeft: 'none',
              paddingLeft: 0,
              outline: 'none',
            }}
          >
            {/* Pasul 2708007 — ghilimelele fac parte din frază, nu stau deasupra ei.
                Înainte erau două semne fixe, care nu se stingeau niciodată: rămâneau
                pe ecran și peste fraza următoare, tăind cuvintele. Acum intră o dată
                cu primul cuvânt, se închid după ultimul și dispar împreună cu el. */}
            {['\u201E', ...verseText.split(' '), '\u201C'].map((word, index) => (
              <span
                key={index}
                ref={(el) => {
                  verseWordsRef.current[index] = el;
                }}
                className="inline-block mx-1 tracking-wider"
                style={{ opacity: 0 }}
              >
                {word}
              </span>
            ))}
          </blockquote>

          <cite
            ref={citeRef}
            className="block font-cinzel text-xl md:text-2xl lg:text-3xl font-medium mt-6"
            style={{ color: textLight, opacity: 0, transform: 'translateY(20px)' }}
          >
            — {referenceText}
          </cite>

          {/* Fraza 2 — apare exact pe locul primei, după ce aceea dispare */}
          <p
            className="absolute inset-x-0 top-0 font-cinzel text-2xl md:text-3xl lg:text-4xl italic leading-relaxed min-h-[180px] flex items-center justify-center px-4 flex-wrap pointer-events-none"
            style={{ color: textColor }}
          >
            {secondText.split(' ').map((word, index) => (
              <span
                key={index}
                ref={(el) => {
                  secondWordsRef.current[index] = el;
                }}
                className="inline-block mx-1 tracking-wider"
                style={{ opacity: 0 }}
              >
                {word}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}
