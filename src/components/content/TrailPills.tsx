'use client';

/**
 * Drumul prin rubrici, pe un singur rand, ca un cuprins:
 *   Zeugnisse › Auch sie waren unter uns › [Dumitru & Ștefan ✕]
 *
 * Ultimul pas este plin (unde esti acum) si are ✕ care te urca un nivel.
 * Pasii de dinainte sunt text simplu: apesi pe ei si te intorci acolo.
 * Daca drumul e lung, se deruleaza lateral si ramane vizibil ultimul pas.
 */

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import UpLink from '@/components/content/UpLink';

export interface TrailStep {
  slug: string;
  name: string;
}

interface TrailPillsProps {
  /** Rubricile prin care ai trecut, de la prima spre ultima. */
  steps: TrailStep[];
  /** Adresa rubricii principale, unde duce ✕ de pe prima pastila. */
  rootHref: string;
  rootLabel: string;
  /** Cum se construieste adresa unei rubrici. */
  hrefFor: (slug: string) => string;
}

export default function TrailPills({ steps, rootHref, rootLabel, hrefFor }: TrailPillsProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rowRef.current;
    if (el) el.scrollTo({ left: el.scrollWidth });
  }, [steps.length]);

  return (
    <nav aria-label="Drum" className="mb-4 -mx-4 sm:mx-0">
      <div
        ref={rowRef}
        className="flex items-center gap-1 overflow-x-auto whitespace-nowrap px-4 pb-1 sm:px-0"
        style={{ scrollbarWidth: 'none' }}
      >
        <UpLink
          href={rootHref}
          className="shrink-0 rounded-full px-2.5 py-1.5 text-xs font-medium text-black/60 transition-colors hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
        >
          {rootLabel}
        </UpLink>

        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          // ✕ te duce acolo unde erai inainte de pasul asta.
          const back = i === 0 ? rootHref : hrefFor(steps[i - 1].slug);

          return (
            <React.Fragment key={step.slug}>
              <span aria-hidden="true" className="shrink-0 text-xs text-black/30 dark:text-white/30">
                ›
              </span>

              {isLast ? (
                <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-black py-0.5 pl-3 pr-1 text-xs leading-none dark:bg-white">
                  <Link
                    href={hrefFor(step.slug)}
                    className="max-w-[11rem] truncate py-1.5 font-medium text-white dark:text-black"
                  >
                    {step.name}
                  </Link>
                  <UpLink
                    href={back}
                    aria-label={`Ieși din ${step.name}`}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] text-white/80 transition-colors hover:bg-white/25 dark:text-black/70 dark:hover:bg-black/15"
                  >
                    ✕
                  </UpLink>
                </div>
              ) : (
                <UpLink
                  href={hrefFor(step.slug)}
                  className="max-w-[9rem] shrink-0 truncate rounded-full px-2.5 py-1.5 text-xs font-medium text-black/60 transition-colors hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  {step.name}
                </UpLink>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
