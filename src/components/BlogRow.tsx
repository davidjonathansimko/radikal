'use client';

// Banda de carduri a paginii Blogs (telefon): glisare circulara, cu o mica vibratie la fiecare card.

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/types';
import { categoryName, type Category } from '@/lib/categories';
import { useHaptic } from '@/hooks/useHaptic';

const CATEGORY_LABEL: Record<string, string> = { de: 'Kategorie', en: 'Category', ro: 'Categorie', ru: 'Категория' };

interface Props {
  posts: BlogPost[];
  heading: string;
  /** Carduri putin mai mici, pentru doua benzi pe acelasi ecran. */
  compact?: boolean;
  /** 'normal' = Blog / titlu / data; 'catdesc' = Categorie + descrierea blogului. */
  subMode: 'normal' | 'catdesc';
  tour?: boolean;
  language: string;
  categories: Category[];
  getTitle: (p: BlogPost) => string;
  getExcerpt: (p: BlogPost) => string;
  formatDate: (s: string) => string;
}

export default function BlogRow({ posts, heading, compact = false, subMode, tour = false, language, categories, getTitle, getExcerpt, formatDate }: Props) {
  const { tapSelection } = useHaptic();
  const loopRef = useRef<HTMLDivElement>(null);
  const n = posts.length;
  const copies = n > 1 ? 3 : 1;

  useEffect(() => {
    const el = loopRef.current;
    if (!el || n < 1) return;
    const cards = el.querySelectorAll<HTMLElement>('[data-loop-card]');
    if (cards.length < n * copies) return;

    const looping = n > 1;
    const span = () => (looping ? cards[n].offsetLeft - cards[0].offsetLeft : 0);
    const stride = () => (cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 1);
    const jump = (delta: number) => {
      el.style.scrollSnapType = 'none';
      el.scrollLeft += delta;
      requestAnimationFrame(() => {
        el.style.scrollSnapType = '';
      });
    };
    if (looping) {
      el.style.scrollSnapType = 'none';
      el.scrollLeft = span();
      requestAnimationFrame(() => {
        el.style.scrollSnapType = '';
      });
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let raf = 0;
    let lastIndex = Math.round(el.scrollLeft / stride());
    const onScroll = () => {
      // O scurta vibratie cand trece un card, ca la un cadran cu repere.
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          const idx = Math.round(el.scrollLeft / stride());
          if (idx !== lastIndex) {
            lastIndex = idx;
            tapSelection();
          }
        });
      }
      if (!looping) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const w = span();
        if (el.scrollLeft < w * 0.4) jump(w);
        else if (el.scrollLeft > w * 1.6) jump(-w);
      }, 90);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener('scroll', onScroll);
    };
  }, [n, copies, tapSelection]);

  const cardW = compact ? 'w-[27vw] min-w-[104px] max-w-[132px] sm:w-[20vw]' : 'w-[42vw] min-w-[150px] max-w-[220px] sm:w-[28vw]';
  const label = CATEGORY_LABEL[language] ?? CATEGORY_LABEL.de;

  return (
    <div className={compact ? 'mb-2' : ''}>
      <p className={`-mx-0 mb-2 text-left font-bold text-black dark:text-white ${compact ? 'text-[13px]' : 'text-base'}`}>{heading}</p>
      <div
        ref={loopRef}
        {...(tour ? { 'data-tour': 'cards' } : {})}
        className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {Array.from({ length: copies }, (_, copy) => posts.map((post) => ({ post, copy }))).flat().map(({ post, copy }) => {
          const catIds = (post as unknown as { category_ids?: string[] | null }).category_ids ?? [];
          const cat = categories.find((c) => catIds.includes(c.id));
          const title = getTitle(post);
          return (
            <Link key={`${copy}-${post.id}`} data-loop-card href={`/blogs/${post.slug}`} className={`block shrink-0 snap-start ${cardW}`}>
              <div className="force-white-text relative aspect-square w-full overflow-hidden rounded-md bg-neutral-900">
                {post.image_url && <Image src={post.image_url} alt="" fill sizes="220px" className="object-cover brightness-[0.65]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/40" aria-hidden="true" />
                {/* Logoul mic, sus-stanga, ca insigna din Spotify */}
                <Image
                  src={'/radikal.logo.wei\u00df.hintergrund.png'}
                  alt=""
                  width={120}
                  height={120}
                  className={`absolute left-1.5 top-1.5 h-auto rounded-[2px] ${compact ? 'w-[28px]' : 'w-[38px]'}`}
                  style={{ height: 'auto' }}
                />
                <div className={`absolute inset-0 flex items-center justify-center text-center ${compact ? 'p-2 pt-5' : 'p-3 pt-6'}`}>
                  <span
                    className={`font-cinzel font-bold leading-snug drop-shadow-lg ${compact ? 'line-clamp-4 text-[11px]' : 'line-clamp-4 text-[15px]'}`}
                    style={{ color: '#ffffff' }}
                  >
                    {title}
                  </span>
                </div>
              </div>
              {subMode === 'catdesc' ? (
                <>
                  <p className={`mt-1.5 truncate text-black/55 dark:text-white/55 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                    {cat ? `${label}: ${categoryName(cat, language)}` : 'Blog'}
                  </p>
                  <p className={`mt-0.5 line-clamp-3 leading-snug text-black dark:text-white ${compact ? 'text-[10px]' : 'text-xs'}`}>{getExcerpt(post)}</p>
                </>
              ) : (
                <>
                  <p className={`mt-1.5 truncate text-black/55 dark:text-white/55 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                    {cat ? categoryName(cat, language) : 'Blog'}
                  </p>
                  <p className={`mt-0.5 line-clamp-2 font-bold leading-snug text-black dark:text-white ${compact ? 'text-xs' : 'text-sm'}`}>{title}</p>
                  <p className={`mt-0.5 truncate text-black/55 dark:text-white/55 ${compact ? 'text-[10px]' : 'text-xs'}`}>{formatDate(post.created_at)}</p>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
