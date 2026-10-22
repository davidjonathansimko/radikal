'use client';

// Pasul 2210006 — nivelul 4: la capatul arborelui, textele finale apar ca
// carduri mari, cu o sageata care le deschide (acordeon).

import React, { useState } from 'react';
import Link from 'next/link';

export interface AccordionItem {
  id: string;
  href: string;
  title: string;
  excerpt?: string | null;
}

export default function AccordionCards({
  items,
  readLabel,
}: {
  items: AccordionItem[];
  readLabel: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <li
            key={item.id}
            className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10"
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : item.id)}
              className="btn-solid flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            >
              <span className="min-w-0 flex-1 font-cinzel text-lg font-semibold leading-snug text-black dark:text-white">
                {item.title}
              </span>
              <svg
                className={`h-4 w-4 shrink-0 text-black/50 transition-transform duration-300 dark:text-white/50 ${
                  open ? 'rotate-180' : ''
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {open && (
              <div className="border-t border-black/10 px-5 py-4 dark:border-white/10">
                {item.excerpt && (
                  <p className="mb-4 text-sm leading-relaxed text-black/70 dark:text-white/70">
                    {item.excerpt}
                  </p>
                )}
                <Link
                  href={item.href}
                  className="inline-block rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 dark:bg-white dark:text-black"
                >
                  {readLabel} ›
                </Link>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
