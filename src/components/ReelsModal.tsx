// Reels Modal — sistem tip YouTube Shorts pentru RADIKAL.
//
// - Derulare VERTICALA cu snap (un reel pe ecran), in ordine
// - Textul apare animat cuvant cu cuvant, cu EXACT acelasi sistem GSAP
//   ca WelcomeModal.tsx si AboutIntroQuote.tsx
// - Buton de LIKE in dreapta (stil YouTube)
// - Buton SAGEATA catre articol — DOAR daca reel-ul e legat de un blog
// - TEMA: foloseste useTheme() (acelasi buton soare/luna din bara de jos),
//   deci se schimba automat impreuna cu restul aplicatiei
//
// Performanta: animam DOAR reel-ul vizibil (IntersectionObserver) si
// distrugem timeline-ul cand iese din ecran.

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { createClient } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';

export interface Reel {
  id: string;
  content: string;
  reference: string | null;
  blog_post_id: string | null;
  likes_count: number;
  blog_slug?: string | null;
}

interface ReelsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Un singur reel (o "pagina" pe tot ecranul)
// ---------------------------------------------------------------------------
function ReelSlide({
  reel,
  isDark,
  language,
  isLiked,
  likeCount,
  onToggleLike,
  onOpenBlog,
  onActive,
}: {
  reel: Reel;
  isDark: boolean;
  language: string;
  isLiked: boolean;
  likeCount: number;
  onToggleLike: (reel: Reel) => void;
  onOpenBlog: (slug: string) => void;
  onActive: (id: string) => void;
}) {
  const slideRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const citeRef = useRef<HTMLElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const textColor = isDark ? '#ffffff' : '#000000';
  const textLight = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';
  const textVeryLight = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const bgTransparent = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const borderColorLight = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)';

  // Animatia porneste doar cand reel-ul devine vizibil
  useEffect(() => {
    const el = slideRef.current;
    if (!el) return;

    const play = () => {
      const words = wordsRef.current.filter(Boolean);
      if (words.length === 0) return;

      tlRef.current?.kill();

      gsap.set(words, { opacity: 0, filter: 'blur(10px)', y: 8, x: -15 });
      if (citeRef.current) gsap.set(citeRef.current, { opacity: 0, y: 15, x: -10 });

      const tl = gsap.timeline();
      tl.to(words, {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        x: 0,
        duration: 0.8,
        stagger: { each: 0.18, ease: 'power1.inOut' },
        ease: 'power2.out',
      });

      if (citeRef.current) {
        tl.to(citeRef.current, { opacity: 1, y: 0, x: 0, duration: 1.2, ease: 'power2.out' }, '-=0.8');
      }

      tlRef.current = tl;
    };

    const reset = () => {
      tlRef.current?.kill();
      tlRef.current = null;
      const words = wordsRef.current.filter(Boolean);
      gsap.set(words, { opacity: 0 });
      if (citeRef.current) gsap.set(citeRef.current, { opacity: 0 });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            onActive(reel.id);
            play();
          } else {
            reset();
          }
        });
      },
      { threshold: [0, 0.6, 1] }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      tlRef.current?.kill();
      tlRef.current = null;
    };
  }, [reel.id, onActive]);

  const words = reel.content.split(' ');

  return (
    <section
      ref={slideRef}
      className="relative h-full w-full flex-shrink-0 snap-start snap-always flex items-center justify-center px-6"
      style={{ scrollSnapStop: 'always' }}
    >
      {/* Textul animat, centrat */}
      <div className="text-center max-w-3xl mx-auto px-4 pr-20 sm:pr-24">
        <blockquote
          className="font-cinzel text-2xl md:text-3xl lg:text-4xl italic leading-relaxed flex items-center justify-center flex-wrap"
          style={{ color: textColor }}
        >
          {words.map((word, index) => (
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
        </blockquote>

        {reel.reference && (
          <cite
            ref={citeRef}
            className="block font-cinzel text-lg md:text-xl font-medium mt-8 not-italic"
            style={{ color: textLight, opacity: 0 }}
          >
            — {reel.reference}
          </cite>
        )}
      </div>

      {/* Bara de actiuni din DREAPTA (stil YouTube Shorts) */}
      <div className="absolute right-4 sm:right-6 bottom-24 flex flex-col items-center gap-6">
        {/* LIKE — mereu prezent, si pentru reels fara blog */}
        <button
          onClick={() => onToggleLike(reel)}
          aria-pressed={isLiked}
          aria-label={
            language === 'de' ? 'Gefällt mir' :
            language === 'en' ? 'Like' :
            language === 'ro' ? 'Îmi place' : 'Нравится'
          }
          className="flex flex-col items-center gap-1 rounded-full p-3 transition-transform duration-200 active:scale-90 hover:scale-110"
          style={{ backgroundColor: bgTransparent, border: `1px solid ${borderColorLight}` }}
        >
          <svg
            className="w-7 h-7 transition-colors duration-200"
            viewBox="0 0 24 24"
            fill={isLiked ? '#ef4444' : 'none'}
            stroke={isLiked ? '#ef4444' : textColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="text-xs font-semibold tabular-nums" style={{ color: textLight }}>
            {likeCount}
          </span>
        </button>

        {/* SAGEATA catre articol — DOAR daca reel-ul apartine unui blog */}
        {reel.blog_slug && (
          <button
            onClick={() => onOpenBlog(reel.blog_slug as string)}
            aria-label={
              language === 'de' ? 'Zum Artikel' :
              language === 'en' ? 'Go to article' :
              language === 'ro' ? 'Mergi la articol' : 'К статье'
            }
            className="flex flex-col items-center gap-1 rounded-full p-3 transition-transform duration-200 active:scale-90 hover:scale-110"
            style={{ backgroundColor: bgTransparent, border: `1px solid ${borderColorLight}` }}
          >
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke={textColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <span className="text-[10px] font-semibold" style={{ color: textVeryLight }}>
              {language === 'de' ? 'Artikel' :
               language === 'en' ? 'Article' :
               language === 'ro' ? 'Articol' : 'Статья'}
            </span>
          </button>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Modalul principal
// ---------------------------------------------------------------------------
export default function ReelsModal({ isOpen, onClose }: ReelsModalProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';

  const [reels, setReels] = useState<Reel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [, setActiveId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const bgColor = isDark ? '#000000' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const textVeryLight = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const bgTransparent = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const borderColorLight = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)';

  const handleActive = useCallback((id: string) => setActiveId(id), []);

  // Incarcam reels-urile publicate
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        setUserId(user?.id ?? null);

        const { data, error } = await supabase
          .from('reels')
          .select('id, content, reference, blog_post_id, likes_count, blog_posts(slug)')
          .eq('published', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (cancelled) return;

        if (error) {
          console.debug('Reels load issue:', error.code);
          setReels([]);
        } else {
          const mapped: Reel[] = (data || []).map((row: Record<string, unknown>) => {
            const bp = row.blog_posts as { slug?: string } | { slug?: string }[] | null;
            const slug = Array.isArray(bp) ? bp[0]?.slug ?? null : bp?.slug ?? null;
            return {
              id: row.id as string,
              content: row.content as string,
              reference: (row.reference as string) ?? null,
              blog_post_id: (row.blog_post_id as string) ?? null,
              likes_count: (row.likes_count as number) ?? 0,
              blog_slug: slug,
            };
          });

          setReels(mapped);
          setLikeCounts(
            Object.fromEntries(mapped.map((r) => [r.id, r.likes_count]))
          );

          // Ce a apreciat deja utilizatorul curent
          if (user && mapped.length > 0) {
            const { data: likes } = await supabase
              .from('reel_likes')
              .select('reel_id')
              .eq('user_id', user.id)
              .in('reel_id', mapped.map((r) => r.id));

            if (!cancelled && likes) {
              setLikedIds(new Set(likes.map((l) => l.reel_id as string)));
            }
          }
        }
      } catch (err) {
        console.debug('Reels load error:', err);
        if (!cancelled) setReels([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Blocam scroll-ul paginii cat timp modalul e deschis, si il restauram exact
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  // Like / Unlike — optimist, cu revenire in caz de eroare
  const handleToggleLike = useCallback(
    async (reel: Reel) => {
      if (!userId) {
        // Vizitatorii NU pot da like fara cont — dar nu ii blocam brutal
        router.push('/auth/login');
        return;
      }

      const supabase = createClient();
      const wasLiked = likedIds.has(reel.id);

      // Actualizare optimista (UI instant)
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(reel.id);
        else next.add(reel.id);
        return next;
      });
      setLikeCounts((prev) => ({
        ...prev,
        [reel.id]: Math.max(0, (prev[reel.id] ?? 0) + (wasLiked ? -1 : 1)),
      }));

      try {
        if (wasLiked) {
          await supabase.from('reel_likes').delete().eq('reel_id', reel.id).eq('user_id', userId);
        } else {
          // upsert cu ignoreDuplicates -> niciodata 409 Conflict
          await supabase
            .from('reel_likes')
            .upsert({ reel_id: reel.id, user_id: userId }, { onConflict: 'reel_id,user_id', ignoreDuplicates: true });
        }
      } catch {
        // Revenim la starea anterioara daca serverul a refuzat
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(reel.id);
          else next.delete(reel.id);
          return next;
        });
        setLikeCounts((prev) => ({
          ...prev,
          [reel.id]: Math.max(0, (prev[reel.id] ?? 0) + (wasLiked ? 1 : -1)),
        }));
      }
    },
    [likedIds, userId, router]
  );

  const handleOpenBlog = useCallback(
    (slug: string) => {
      onClose();
      router.push(`/blogs/${slug}`);
    },
    [onClose, router]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col"
      style={{ backgroundColor: bgColor, color: textColor }}
      role="dialog"
      aria-modal="true"
      aria-label="Reels"
    >
      {/* Buton de inchidere */}
      <button
        onClick={onClose}
        aria-label={
          language === 'de' ? 'Schließen' :
          language === 'en' ? 'Close' :
          language === 'ro' ? 'Închide' : 'Закрыть'
        }
        className="absolute top-4 right-4 z-10 rounded-full p-3 transition-transform duration-200 hover:scale-110 active:scale-90"
        style={{ backgroundColor: bgTransparent, border: `1px solid ${borderColorLight}` }}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div
            className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: borderColorLight, borderTopColor: 'transparent' }}
          />
        </div>
      ) : reels.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-8">
          <p className="text-center text-lg" style={{ color: textVeryLight }}>
            {language === 'de' ? 'Noch keine Reels vorhanden.' :
             language === 'en' ? 'No reels yet.' :
             language === 'ro' ? 'Încă nu există reels.' : 'Пока нет реелсов.'}
          </p>
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto snap-y snap-mandatory overscroll-contain"
            style={{ scrollbarWidth: 'none' }}
          >
            {reels.map((reel) => (
              <div key={reel.id} className="h-full w-full">
                <ReelSlide
                  reel={reel}
                  isDark={isDark}
                  language={language}
                  isLiked={likedIds.has(reel.id)}
                  likeCount={likeCounts[reel.id] ?? 0}
                  onToggleLike={handleToggleLike}
                  onOpenBlog={handleOpenBlog}
                  onActive={handleActive}
                />
              </div>
            ))}
          </div>

          {/* Indiciu discret de derulare */}
          <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
            <svg className="w-5 h-5 animate-bounce" viewBox="0 0 24 24" fill="none" stroke={textVeryLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </>
      )}

      {/* Ascundem scrollbar-ul fara sa afectam alte componente */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
