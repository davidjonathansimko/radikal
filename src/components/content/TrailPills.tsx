'use client';

/**
 * Pasul 0809002 — PASTILELE DE DRUM.
 *
 * În loc de butoane late de „Înapoi la…", drumul se adună în pastile mici:
 *   [Auch sie waren unter uns ✕] [Dumitru & Ștefan ✕] [Partea 01 ✕]
 *
 * Apăsând ✕ pe o pastilă, ea și tot ce vine după ea se ridică, iar cititorul
 * se întoarce exact la nivelul de dinaintea ei. Nimic nu se pierde pe drum.
 */

import React from 'react';
import Link from 'next/link';

export interface TrailStep {
  slug: string;
  name: string;
}

interface TrailPillsProps {
  /** Rubricile prin care ai trecut, de la prima spre ultima. */
  steps: TrailStep[];
  /** Adresa rubricii principale, unde duce ✕ de pe prima pastilă. */
  rootHref: string;
  rootLabel: string;
  /** Cum se construiește adresa unei rubrici. */
  hrefFor: (slug: string) => string;
}

export default function TrailPills({ steps, rootHref, rootLabel, hrefFor }: TrailPillsProps) {
  return (
    <nav
      aria-label="Drum"
      className="mb-4 flex flex-wrap items-center gap-1.5"
    >
      <Link
        href={rootHref}
        className="max-w-[9rem] truncate rounded-full px-2 py-1 text-xs font-medium text-black/50 transition-colors hover:text-black dark:text-white/50 dark:hover:text-white"
      >
        {rootLabel}
      </Link>

      {steps.map((step, i) => {
        // ✕ te duce acolo unde erai ÎNAINTE de pastila asta.
        const back = i === 0 ? rootHref : hrefFor(steps[i - 1].slug);
        const isLast = i === steps.length - 1;

        return (
          <div
            key={step.slug}
            // `force-white-text` pe pastila plină: fără ea, regula generală a
            // temei luminoase face textul negru pe fundal negru.
            className={`flex items-center gap-0.5 rounded-full border py-0.5 pl-2.5 pr-1 text-xs leading-none ${
              isLast
                ? 'force-white-text border-transparent bg-black dark:bg-white'
                : 'border-black/15 dark:border-white/15'
            }`}
          >
            <Link
              href={hrefFor(step.slug)}
              className={`max-w-[8rem] truncate py-1 ${
                isLast
                  ? 'text-white dark:text-black'
                  : 'text-black/70 dark:text-white/70'
              }`}
            >
              {step.name}
            </Link>
            <Link
              href={back}
              aria-label={`Ieși din ${step.name}`}
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] transition-colors ${
                isLast
                  ? 'text-white hover:bg-white/25 dark:text-black dark:hover:bg-black/15'
                  : 'text-black/45 hover:bg-black/10 dark:text-white/45 dark:hover:bg-white/10'
              }`}
            >
              ✕
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
