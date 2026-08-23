'use client';

// =====================================================================
// Pasul 2208001 — Modalul „Play Blog" (blog DINAMIC)
// =====================================================================
// Arata ca un reel:
//   • imaginea articolului pe tot ecranul, cu efectele SEPARATE ale
//     modalului (sepia / vignette / noise / grain dinamic)
//   • vocea porneste, iar textul apare animat, cuvant cu cuvant,
//     PERFECT sincronizat cu ce se aude
//   • bara de progres jos (play / pauza / cautare), acolo unde in mod
//     normal sta bara cu 4 optiuni, cu opacitate putin redusa
//   • „×" mereu vizibil, din prima clipa
//   • Like sub „×", iar Share sub Like (ca sa nu se incurce cu bara)
//
// Pana cand vocea NU e gata, se vad DOAR imaginea de fundal si „×".
// =====================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useHaptic } from '@/hooks/useHaptic';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useVoiceSyncedText } from '@/hooks/useVoiceSyncedText';
import { paginateWords, pageIndexForWord } from '@/lib/paginateText';
import { getSupabaseClient } from '@/lib/supabase';
import { isAdminUser } from '@/lib/isAdmin';
import { fetchCustomAudioForLang } from '@/lib/customAudio';
import ImageEffectLayers, {
  effectsFilter,
  type ImageEffectSettings,
} from '@/components/ImageEffectLayers';

export interface PlayBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text: string;
  imageUrl: string | null;
  slug: string;
  /**
   * Pasul A18 — id-ul articolului, ca sa putem cauta inregistrarea TA
   * pentru limba curenta. Optional: daca lipseste, totul merge pe TTS.
   */
  blogId?: string;
  language: string;
  effects: ImageEffectSettings;
  backgroundOpacity: number; // 0–100
  isLiked: boolean;
  onToggleLike: () => void;
}

function fmt(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayBlogModal({
  isOpen,
  onClose,
  title,
  text,
  imageUrl,
  slug,
  blogId,
  language,
  effects,
  backgroundOpacity,
  isLiked,
  onToggleLike,
}: PlayBlogModalProps) {
  const { language: uiLang } = useLanguage();
  const { tapLight } = useHaptic();
  const { reduced: reduceMotion } = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [shareMsg, setShareMsg] = useState('');

  // ------------------------------------------------------------------
  // Pasul A13 — modul „freeze" (doar pentru admin)
  // Ascunde toate butoanele de pe ecran, ca sa poti face captura video
  // curata cu Snipping Tool. Se iese din el:
  //   - pe desktop: tasta Escape
  //   - pe mobil: butonul „back" al telefonului SAU tragi in jos (pull-refresh)
  // ------------------------------------------------------------------
  const [isAdmin, setIsAdmin] = useState(false);
  const [frozen, setFrozen] = useState(false);

  useBodyScrollLock(isOpen);
  useFocusTrap(containerRef, isOpen);

  // ------------------------------------------------------------------
  // Pasul 2208002 (punctul 3) — audio PREGENERAT
  // Intrebam serverul daca articolul are deja un fisier mp3 salvat.
  // Daca da, il folosim: pornire instantanee si ZERO cost.
  // Daca nu, totul merge exact ca inainte (voce ceruta in direct).
  // ------------------------------------------------------------------
  const [prebuiltUrl, setPrebuiltUrl] = useState<string | null>(null);
  const [prebuiltChecked, setPrebuiltChecked] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPrebuiltChecked(false);
      setPrebuiltUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // Pasul A18 — INTAI cautam inregistrarea TA pentru limba curenta.
        // Daca exista, o folosim si nu mai intrebam deloc de TTS.
        // Daca nu exista (sau ai sters-o), cadem inapoi pe TTS, exact
        // ca inainte — fara sa fie nevoie sa regenerezi nimic.
        if (blogId) {
          const mine = await fetchCustomAudioForLang(blogId, language);
          if (mine?.audio_url) {
            if (!cancelled) { setPrebuiltUrl(mine.audio_url); setPrebuiltChecked(true); }
            return;
          }
        }

        const res = await fetch(
          `/api/blog-audio?slug=${encodeURIComponent(slug)}&language=${encodeURIComponent(language)}`,
        );
        const data = await res.json();
        if (!cancelled) setPrebuiltUrl(data?.audioUrl || null);
      } catch {
        if (!cancelled) setPrebuiltUrl(null);
      } finally {
        if (!cancelled) setPrebuiltChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, slug, language, blogId]);

  const {
    isReady,
    isPlaying,
    error,
    words,
    spokenCount,
    elapsed,
    total,
    toggle,
    pause,
    seek,
  } = useVoiceSyncedText({
    text,
    language,
    // Asteptam raspunsul despre fisierul pregenerat, ca sa nu pornim
    // din greseala cererile catre Google cand exista deja un mp3.
    enabled: isOpen && prebuiltChecked,
    blogSlug: slug,
    blogTitle: title,
    prebuiltUrl,
    // Pasul 2308005: 0.9 (0.8 era prea încet și suna forțat).
    // Nu este alta voce — este EXACT vocea Chirp3-HD aleasa de noi.
    // Doar redarea in browser e putin mai lenta.
    playbackRate: 0.95,
  });

  // ------------------------------------------------------------------
  // Pasul 2208002 (punctul 7) — CONTINUARE DE UNDE AI RAMAS
  // Pozitia se salveaza local, in browserul cititorului. Nimic pe server.
  // ------------------------------------------------------------------
  const resumeKey = `radikalPlayBlog:${slug}:${language}`;
  const resumedRef = useRef(false);
  const [resumeOffer, setResumeOffer] = useState<number | null>(null);

  // La deschidere verificam daca exista o pozitie salvata
  useEffect(() => {
    if (!isOpen) {
      resumedRef.current = false;
      setResumeOffer(null);
      return;
    }
    try {
      const raw = localStorage.getItem(resumeKey);
      const saved = raw ? parseFloat(raw) : 0;
      // Oferim continuarea doar daca s-au ascultat cel putin 20 de secunde
      if (saved > 20) setResumeOffer(saved);
    } catch {
      /* localStorage poate fi blocat */
    }
  }, [isOpen, resumeKey]);

  // Salvam pozitia din cand in cand
  useEffect(() => {
    if (!isOpen || !isReady || elapsed <= 0) return;
    try {
      // Daca articolul e aproape terminat, stergem — data viitoare se ia de la capat
      if (total > 0 && elapsed > total - 15) localStorage.removeItem(resumeKey);
      else localStorage.setItem(resumeKey, String(Math.floor(elapsed)));
    } catch {
      /* ignoram */
    }
  }, [isOpen, isReady, elapsed, total, resumeKey]);

  const acceptResume = useCallback(() => {
    if (resumeOffer == null) return;
    resumedRef.current = true;
    seek(resumeOffer);
    setResumeOffer(null);
  }, [resumeOffer, seek]);

  const declineResume = useCallback(() => {
    resumedRef.current = true;
    setResumeOffer(null);
    try {
      localStorage.removeItem(resumeKey);
    } catch {
      /* ignoram */
    }
  }, [resumeKey]);

  // ------------------------------------------------------------------
  // Pasul 2208002 (punctul 8) — MEDIA SESSION
  // Titlul articolului si butoanele play/pauza apar pe ecranul de blocare
  // al telefonului si in casti, exact ca la un podcast.
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !isReady) return;
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const ms = navigator.mediaSession;
    try {
      ms.metadata = new MediaMetadata({
        title,
        artist: 'RADIKAL.',
        album: 'Radikale Bibellehre',
        artwork: imageUrl
          ? [
              { src: imageUrl, sizes: '512x512', type: 'image/jpeg' },
              { src: imageUrl, sizes: '256x256', type: 'image/jpeg' },
            ]
          : [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
      });

      ms.setActionHandler('play', () => toggle());
      ms.setActionHandler('pause', () => toggle());
      ms.setActionHandler('seekbackward', () => seek(Math.max(0, elapsedRef.current - 15)));
      ms.setActionHandler('seekforward', () => seek(elapsedRef.current + 30));
      ms.setActionHandler('seekto', (d) => {
        if (typeof d.seekTime === 'number') seek(d.seekTime);
      });
      ms.setActionHandler('stop', () => onClose());
    } catch {
      /* browserele vechi nu au MediaMetadata */
    }

    return () => {
      try {
        (['play', 'pause', 'seekbackward', 'seekforward', 'seekto', 'stop'] as const).forEach((a) =>
          ms.setActionHandler(a, null),
        );
        ms.metadata = null;
      } catch {
        /* ignoram */
      }
    };
  }, [isOpen, isReady, title, imageUrl, toggle, seek, onClose]);

  // Pozitia curenta, ca sa o poata folosi butoanele de pe ecranul de blocare
  const elapsedRef = useRef(0);
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  // Starea play/pauza pe ecranul de blocare
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch {
      /* ignoram */
    }
  }, [isPlaying]);

  // Esc inchide modalul
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Pasul A13 — daca esti in „freeze", Escape doar iese din freeze.
        // Abia a doua apasare inchide modalul.
        if (frozen) { setFrozen(false); return; }
        onClose();
      }
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, toggle, frozen]);

  // ------------------------------------------------------------------
  // Pasul A13 — cine este admin?
  // Butonul de „freeze" apare DOAR pentru admin, nu pentru cititori.
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    (async () => {
      try {
        const { data: { user } } = await getSupabaseClient().auth.getUser();
        if (alive) setIsAdmin(isAdminUser(user));
      } catch {
        /* daca nu merge, pur si simplu nu aratam butonul */
      }
    })();
    return () => { alive = false; };
  }, [isOpen]);

  // Cand modalul se inchide, iesim automat din „freeze"
  useEffect(() => {
    if (!isOpen) setFrozen(false);
  }, [isOpen]);

  // ------------------------------------------------------------------
  // Pasul A13 — iesirea din „freeze" pe MOBIL
  //
  // 1) Butonul „back" al telefonului. Cand intram in freeze punem o
  //    intrare falsa in istoric; „back" o scoate, noi prindem `popstate`
  //    si iesim din freeze — fara sa parasim pagina.
  // 2) Tragerea in jos (gestul de „pull to refresh"). Modalul blocheaza
  //    scroll-ul paginii, deci gestul nu face refresh; il folosim noi.
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !frozen) return;

    // 1) butonul back
    window.history.pushState({ playBlogFrozen: true }, '');
    const onPop = () => setFrozen(false);
    window.addEventListener('popstate', onPop);

    // 2) tragerea in jos
    let startY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (startY == null) return;
      const dy = (e.touches[0]?.clientY ?? startY) - startY;
      if (dy > 70) { setFrozen(false); startY = null; }
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      // Curatam intrarea falsa din istoric, daca mai este acolo
      if (window.history.state?.playBlogFrozen) window.history.back();
    };
  }, [isOpen, frozen]);

  // Cand se inchide, oprim vocea
  useEffect(() => {
    if (!isOpen) pause();
  }, [isOpen, pause]);

  // Textul urmareste cuvantul curent (derulare lina)
  // Pasul 2308003: NU mai derulam. Textul se schimba pagina cu pagina,
  // deci `scrollIntoView` nu mai are ce cauta aici — el era si motivul
  // pentru care ultimele randuri pareau „taiate" spre invizibil.

  // ------------------------------------------------------------------
  // Pasul 2308003 — pagini de text, ca la reels
  // Impartim cuvintele in pagini si aratam doar pagina in care se afla
  // cuvantul rostit acum.
  // ------------------------------------------------------------------
  const pages = useMemo(() => paginateWords(words), [words]);
  const currentPage = useMemo(
    () => pageIndexForWord(pages, Math.max(0, spokenCount - 1)),
    [pages, spokenCount],
  );
  const pageStart = pages[currentPage]?.start ?? 0;
  const pageEnd = pages[currentPage]?.end ?? words.length;
  const pageWords = useMemo(
    () => words.slice(pageStart, pageEnd),
    [words, pageStart, pageEnd],
  );

  /** Blogul s-a terminat? (vocea a ajuns la capat) */
  const finished = isReady && total > 0 && elapsed >= total - 0.35;

  // ---------------- Share ----------------
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return `https://www.radikal.blog/blogs/${slug}?play=1`;
    // Link-ul deschide DIRECT modalul dinamic (`?play=1`).
    // Daca aplicatia nu e instalata, browserul deschide oricum www.radikal.blog.
    return `${window.location.origin}/blogs/${slug}?play=1`;
  }, [slug]);

  const handleShare = useCallback(async () => {
    tapLight();
    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setShareMsg(
        uiLang === 'de' ? 'Link kopiert' :
        uiLang === 'en' ? 'Link copied' :
        uiLang === 'ro' ? 'Link copiat' :
        'Ссылка скопирована',
      );
      setTimeout(() => setShareMsg(''), 2200);
    } catch {
      /* utilizatorul a anulat share-ul */
    }
  }, [shareUrl, title, tapLight, uiLang]);

  if (!isOpen) return null;

  const uiVisible = isReady; // TOT ce nu e imagine/„×" apare doar cand vocea e gata

  // Pasul 2308002 — DE CE portal:
  // Modalul era randat in interiorul paginii de articol. Daca un parinte are
  // `transform`, `filter` sau `opacity`, el creeaza un „stacking context" nou,
  // iar `z-[9999]` din interior nu mai conteaza fata de header sau de bara de
  // jos: acestea raman deasupra. Mutandu-l direct in `document.body`, modalul
  // devine cu adevarat principal si acopera tot ecranul.
  const modal = (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] overflow-hidden bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* ---------- FUNDAL: imaginea + efectele modalului ---------- */}
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: effectsFilter(effects), opacity: backgroundOpacity / 100 }}
        />
      )}
      <ImageEffectLayers settings={effects} zIndex={1} />

      {/* ---------- „×" — MEREU vizibil, din prima clipa ----------
          Pasul A13: dispare cat timp esti in „freeze". */}
      {!frozen && (
      <button
        onClick={() => { tapLight(); onClose(); }}
        aria-label={uiLang === 'de' ? 'Schließen' : uiLang === 'ro' ? 'Închide' : 'Close'}
        className="absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-opacity hover:opacity-100"
        style={{ opacity: 0.75 }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      )}

      {/* ---------- LIKE (sub „×") + SHARE (sub Like) ---------- */}
      {!frozen && (
      <div
        className={`absolute right-4 top-[76px] z-30 flex flex-col items-center gap-3 transition-opacity duration-700 ${
          uiVisible ? 'opacity-70' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => { tapLight(); onToggleLike(); }}
          aria-pressed={isLiked}
          aria-label="Like"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-transform active:scale-90"
        >
          <svg
            width="22" height="22" viewBox="0 0 24 24"
            fill={isLiked ? '#ef4444' : 'none'}
            stroke={isLiked ? '#ef4444' : 'currentColor'}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* SHARE — doar iconul, fara text (SVG-ul cerut, viewBox 0 0 24 24) */}
        <button
          onClick={handleShare}
          aria-label={uiLang === 'de' ? 'Teilen' : uiLang === 'ro' ? 'Distribuie' : 'Share'}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-transform active:scale-90"
        >
          <svg
            width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>

        {/* FREEZE — Pasul A13, doar pentru admin.
            Ascunde toate butoanele ca sa poti face captura curata.
            Iesi cu Escape (desktop), butonul back sau tragand in jos (mobil). */}
        {isAdmin && (
          <button
            onClick={() => { tapLight(); setFrozen(true); }}
            aria-label="Freeze — ascunde butoanele pentru captură"
            title="Ascunde butoanele (Escape / back / trage în jos pentru a reveni)"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-transform active:scale-90"
          >
            <svg
              width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="5" y="10" width="14" height="11" rx="2.5" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <line x1="12" y1="14" x2="12" y2="17.5" />
            </svg>
          </button>
        )}

        {shareMsg && (
          <span className="rounded-full bg-black/60 px-2 py-1 text-[10px] whitespace-nowrap">
            {shareMsg}
          </span>
        )}
      </div>
      )}

      {/* ---------- TEXTUL sincronizat cu vocea ----------
          Pasul 2308003: NU mai este un text lung cu scroll.
          Se vede o singura „pagina", exact ca la reels. Cand vocea
          trece mai departe, pagina veche iese animat si intra cea noua.
          `pr-20` tine textul departe de butoanele × / inima / share. */}
      <div
        className={`absolute inset-0 z-20 flex items-center justify-center overflow-hidden px-6 pb-36 pt-24 pr-20 transition-opacity duration-700 ${
          uiVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="w-full max-w-2xl">
          <p
            key={currentPage}
            ref={textRef}
            className={`text-center font-cinzel text-2xl italic leading-relaxed tracking-wider md:text-3xl lg:text-4xl ${
              reduceMotion ? '' : 'play-blog-page'
            }`}
          >
            {pageWords.map((w, i) => {
              const absolute = pageStart + i;
              const spoken = absolute < spokenCount;

              // Pasul A03 — DE CE ERA SACADAT SI RAMANEA IN URMA.
              //
              // Aici se adunau intarzieri peste intarzieri:
              //   - cascada „distance * 45 ms" pentru cuvintele deja rostite
              //   - „li * 26 ms" pentru fiecare litera din cuvant
              //   - tranzitia de 620 ms
              // La un cuvant de 10 litere insemna 260 + 620 = 880 ms pana era
              // complet vizibil. De aceea auzeai cuvantul si abia apoi il
              // vedeai — iar la cuvinte lungi ramanerea in urma se vedea si
              // mai tare. Sacadarea venea din faptul ca intarzierea era
              // DIFERITA de la cuvant la cuvant, deci ritmul sarea.
              //
              // Acum: fara cascada retroactiva, intarzierea literelor este
              // PLAFONATA (deci un cuvant lung nu mai ramane in urma fata de
              // unul scurt) si tranzitia e mai scurta. Rezultatul curge egal,
              // ca la reels.

              // Pasul A07 — CURGEREA, EXACT CA LA REELS.
              //
              // La reels animatia GSAP este: opacity 0→1, blur 10px→0,
              // y 8→0, x -15→0, pe 0,8 s cu ease „power2.out". De aceea
              // cuvintele par ca se FORMEAZA, nu ca se aprind.
              //
              // Aici aveam valori mult mai mici (blur 5, y 6, x -3) si o
              // tranzitie de 0,42 s — prea scurta si prea „seaca", asa ca
              // literele apareau brusc. Acum folosim exact aceleasi valori
              // ca la reels.
              const ahead = absolute - (spokenCount - 1);

              // Cuvintele care urmeaza sunt deja putin vizibile, in trepte,
              // ca ochiul sa le vada „venind" (val care se apropie).
              const anticipation =
                !spoken && ahead >= 1 && ahead <= 3 ? [0.34, 0.24, 0.18][ahead - 1] : 0.12;

              const opacity = spoken ? 1 : anticipation;
              // Aceleasi valori de start ca la reels: blur 10, y 8, x -15
              const blurPx = spoken ? 0 : 10;
              const liftPx = spoken ? 0 : 8;
              const shiftPx = spoken ? 0 : -15;

              const letters = Array.from(w);

              return (
                <span
                  key={`${absolute}-${w}`}
                  className="mx-1 inline-block whitespace-nowrap"
                >
                  {letters.map((ch, li) => (
                    <span
                      key={li}
                      className="inline-block"
                      style={{
                        opacity,
                        filter: reduceMotion ? 'none' : `blur(${blurPx}px)`,
                        transform: reduceMotion
                          ? 'none'
                          : `translate(${shiftPx}px, ${liftPx}px)`,
                        transition: reduceMotion
                          ? 'none'
                          : // 800 ms + „power2.out" = exact ca timeline-ul GSAP din reels
                            'opacity 800ms cubic-bezier(0.22, 1, 0.36, 1), ' +
                            'filter 800ms cubic-bezier(0.22, 1, 0.36, 1), ' +
                            'transform 800ms cubic-bezier(0.22, 1, 0.36, 1)',
                        // Pasul A03 — intarzierea literelor este PLAFONATA la
                        // 6 litere (max 132 ms). Asa „Gerechtigkeit" se scrie
                        // in acelasi ritm ca „und", iar textul nu ramane
                        // treptat in urma vocii.
                        transitionDelay: reduceMotion
                          ? '0ms'
                          : `${Math.min(li, 6) * 22}ms`,
                      }}
                    >
                      {ch}
                    </span>
                  ))}
                </span>
              );
            })}
          </p>
        </div>
      </div>

      {/* ---------- Pasul 2308003: finalul blogului ---------- */}
      {finished && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-black/75 px-8 text-center backdrop-blur-md play-blog-page">
          <p className="font-cinzel text-xl italic opacity-90 md:text-2xl">{title}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => { tapLight(); seek(0); }}
              className="rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-medium backdrop-blur-md transition-transform active:scale-95 hover:bg-white/20"
            >
              {uiLang === 'de' ? 'Nochmal hören' :
               uiLang === 'ro' ? 'Ascultă din nou' :
               uiLang === 'ru' ? 'Послушать снова' :
               'Replay'}
            </button>
            <button
              onClick={() => { tapLight(); onClose(); }}
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-transform active:scale-95 hover:bg-white/90"
            >
              {uiLang === 'de' ? 'Zurück zum Blog' :
               uiLang === 'ro' ? 'Înapoi la blog' :
               uiLang === 'ru' ? 'Назад к блогу' :
               'Back to blog'}
            </button>
          </div>
        </div>
      )}

      {/* ---------- Mesaj de eroare ---------- */}
      {error && (
        <div className="absolute inset-x-0 bottom-28 z-30 px-6 text-center text-sm text-red-300">
          {uiLang === 'de' ? 'Die Stimme konnte nicht geladen werden.' :
           uiLang === 'ro' ? 'Vocea nu a putut fi încărcată.' :
           'The voice could not be loaded.'}
        </div>
      )}

      {/* ---------- Pasul 2208002 (punctul 7): continuare de unde ai ramas ---------- */}
      {uiVisible && resumeOffer != null && (
        <div className="absolute inset-x-0 bottom-28 z-40 px-6">
          <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-2xl border border-white/15 bg-black/70 px-4 py-3 text-center backdrop-blur-xl">
            <p className="text-[13px] opacity-85">
              {uiLang === 'de' ? `Weiterhören ab ${fmt(resumeOffer)}?` :
               uiLang === 'ro' ? `Continui de la ${fmt(resumeOffer)}?` :
               uiLang === 'ru' ? `Продолжить с ${fmt(resumeOffer)}?` :
               `Continue from ${fmt(resumeOffer)}?`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { tapLight(); acceptResume(); }}
                className="rounded-full bg-white px-4 py-1.5 text-[12px] font-medium text-black transition-transform active:scale-95"
              >
                {uiLang === 'de' ? 'Weiter' :
                 uiLang === 'ro' ? 'Continuă' :
                 uiLang === 'ru' ? 'Продолжить' : 'Continue'}
              </button>
              <button
                onClick={() => { tapLight(); declineResume(); }}
                className="rounded-full border border-white/25 px-4 py-1.5 text-[12px] transition-transform active:scale-95"
              >
                {uiLang === 'de' ? 'Von vorn' :
                 uiLang === 'ro' ? 'De la început' :
                 uiLang === 'ru' ? 'Сначала' : 'From the start'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- BARA DE PROGRES — acolo unde sta bara cu 4 optiuni ----------
          Pasul A13: dispare in modul „freeze". */}
      {!frozen && (
      <div
        className={`absolute inset-x-0 z-30 px-4 transition-opacity duration-700 ${
          uiVisible ? 'opacity-80' : 'opacity-0 pointer-events-none'
        }`}
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)' }}
      >
        <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/15 bg-black/50 px-4 py-2 backdrop-blur-xl">
          <button
            onClick={() => { tapLight(); toggle(); }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/15 transition-transform active:scale-90"
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                <rect x="2" y="1" width="3.5" height="12" rx="1" />
                <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                <path d="M3 1.5v11l9-5.5-9-5.5z" />
              </svg>
            )}
          </button>

          <span className="w-10 flex-shrink-0 text-[11px] tabular-nums opacity-70">
            {fmt(elapsed)}
          </span>

          <input
            type="range"
            min={0}
            max={Math.max(1, Math.round(total))}
            value={Math.min(Math.round(elapsed), Math.max(1, Math.round(total)))}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Progres"
            className="h-1 w-full flex-1 cursor-pointer accent-white"
          />

          <span className="w-10 flex-shrink-0 text-right text-[11px] tabular-nums opacity-70">
            {fmt(total)}
          </span>
        </div>
      </div>
      )}
    </div>
  );

  // `document` nu exista la randarea pe server — de aceea verificam.
  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}
