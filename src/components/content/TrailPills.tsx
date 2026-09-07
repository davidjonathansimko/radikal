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
      className="scrollbar-hide -mx-4 mb-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6"
    >
      <Link
        href={rootHref}
        className="flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium text-black/50 transition-colors hover:text-black dark:text-white/50 dark:hover:text-white"
      >
        {rootLabel}
      </Link>

      {steps.map((step, i) => {
        // ✕ te duce acolo unde erai ÎNAINTE de pastila asta.
        const back = i === 0 ? rootHref : hrefFor(steps[i - 1].slug);
        const isLast = i === steps.length - 1;

        return (
          <span
            key={step.slug}
            className={`flex flex-shrink-0 items-center gap-1 rounded-full border py-1 pl-3 pr-1 text-xs ${
              isLast
                ? 'border-transparent bg-black text-white dark:bg-white dark:text-black'
                : 'border-black/15 text-black/70 dark:border-white/15 dark:text-white/70'
            }`}
          >
            <Link href={hrefFor(step.slug)} className="max-w-[10rem] truncate whitespace-nowrap">
              {step.name}
            </Link>
            <Link
              href={back}
              aria-label={`Ieși din ${step.name}`}
              className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                isLast
                  ? 'hover:bg-white/25 dark:hover:bg-black/20'
                  : 'hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              ✕
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
