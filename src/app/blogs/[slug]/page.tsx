// Individual blog post page / Einzelne Blog-Post-Seite / Pagină postare blog individuală
// This displays a single blog post with comments and sharing functionality
// Dies zeigt einen einzelnen Blog-Post mit Kommentaren und Teilen-Funktionalität
// Aceasta afișează o singură postare de blog cu comentarii și funcționalitate de distribuire

'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { de, enUS, ro, ru } from 'date-fns/locale';
import { BlogPost, Comment } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { useTranslation } from '@/hooks/useTranslation';
import { useGuestMode, isGuestMode, getGuestId } from '@/hooks/useGuestMode';
import ImageEffectLayers, { DEFAULT_IMAGE_EFFECTS, type ImageEffectSettings } from '@/components/ImageEffectLayers';
import { buildBibleRefRegex } from '@/lib/bibleRefPattern';
// Pasul 2208002 (punctul 11) — modalul „Play Blog" se descarca DOAR cand
// cititorul apasa Play. Pentru articolele obisnuite nu intra deloc in pagina,
// deci articolele statice raman la fel de rapide ca inainte.
const PlayBlogModal = dynamic(() => import('@/components/PlayBlogModal'), { ssr: false });
import { createClient } from '@/lib/supabase';
import ReadingProgress, { CircularReadingProgress } from '@/components/ReadingProgress';
import { calculateReadingTime, getShortReadingTime } from '@/utils/readingTime';
import { ReadingModeToggle, FontSizeControls, useReadingMode } from '@/components/ReadingMode';
import { BlogPostSchema, BreadcrumbSchema } from '@/components/schema';
import { 
  FaShare, 
  FaWhatsapp, 
  FaTelegram, 
  FaEnvelope,
  FaTwitter,
  FaArrowLeft,
  FaClock,
  FaLink,
  FaDiscord,
  FaCheck,
  FaSms
} from 'react-icons/fa';
import { TfiComment } from 'react-icons/tfi';
import { CiHeart } from 'react-icons/ci';

// Dynamic imports for heavy components (loaded only when needed)
const BlogIntroModal = dynamic(() => import('@/components/BlogIntroModal'), { ssr: false });
const ShareButtons = dynamic(() => import('@/components/ShareButtons'), { ssr: false });
// BookmarkButton commented out - replaced by Liked Posts / BookmarkButton auskommentiert - ersetzt durch Liked Posts / BookmarkButton comentat - înlocuit cu Liked Posts
// const BookmarkButton = dynamic(() => import('@/components/BookmarkButton'), { ssr: false });
const RelatedPosts = dynamic(() => import('@/components/RelatedPosts'), { ssr: false });
const EmojiReactions = dynamic(() => import('@/components/EmojiReactions'), { ssr: false });
const PrintButton = dynamic(() => import('@/components/PrintButton'), { ssr: false });
const FloatingTableOfContents = dynamic(() => import('@/components/TableOfContents').then(m => ({ default: m.FloatingTableOfContents })), { ssr: false });
const TextToSpeech = dynamic(() => import('@/components/TextToSpeech'), { ssr: false });
const ReadingSettings = dynamic(() => import('@/components/ReadingSettings'), { ssr: false });
const SocialShare = dynamic(() => import('@/components/social/SocialShare'), { ssr: false });
const ArticleNavigation = dynamic(() => import('@/components/ArticleNavigation'), { ssr: false });

export default function BlogPostPage() {
  // Protect this route - redirect to home if modal not completed / Diese Route schützen - zur Startseite weiterleiten wenn Modal nicht abgeschlossen / Protejează această rută - redirecționează la pagină principală dacă modalul nu este finalizat
  const { isAllowed, isChecking } = useRouteProtection();
  
  // Get route parameters, language and theme context / Route-Parameter, Sprach- und Themenkontext abrufen / Obține parametrii rutei, contextul limbii și temei
  const { slug } = useParams();
  const { language } = useLanguage();
  const { theme } = useTheme();
  
  // 🔒 Store the ORIGINAL Romanian slug from the database — NEVER changes after first load
  // This prevents URL translation (replaceState) from breaking DB queries
  // Speichert den ORIGINALEN rumänischen Slug — ändert sich NIE nach dem ersten Laden
  // Stochează slug-ul ORIGINAL românesc — nu se schimbă NICIODATĂ după prima încărcare
  const originalSlugRef = useRef<string>('');
  
  // Helper: get the slug string safely from useParams (can be string | string[])
  const slugString = typeof slug === 'string' ? slug : Array.isArray(slug) ? slug[0] : '';
  
  // Helper: Convert a title to a URL-friendly slug
  // Hilfsfunktion: Titel in URL-freundlichen Slug konvertieren
  // Ajutor: Convertește un titlu într-un slug URL-friendly
  const titleToSlug = useCallback((title: string): string => {
    // Cyrillic → Latin transliteration map for Russian
    // Кириллица → Латиница транслитерация для русского
    const cyrillicMap: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    };
    
    return title
      .toLowerCase()
      // Transliterate Cyrillic characters first (before NFD normalization strips them)
      .split('').map(ch => cyrillicMap[ch] !== undefined ? cyrillicMap[ch] : ch).join('')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics / Diakritische Zeichen entfernen
      .replace(/[äÄ]/g, 'a').replace(/[öÖ]/g, 'o').replace(/[üÜ]/g, 'u').replace(/[ß]/g, 'ss')
      .replace(/[ăâ]/g, 'a').replace(/[îÎ]/g, 'i').replace(/[șȘ]/g, 's').replace(/[țȚ]/g, 't')
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars / Sonderzeichen entfernen
      .replace(/\s+/g, '-') // Spaces to hyphens / Leerzeichen zu Bindestrichen
      .replace(/-+/g, '-') // Collapse multiple hyphens / Mehrfache Bindestriche zusammenfassen
      .replace(/^-|-$/g, '') // Trim hyphens / Bindestriche trimmen
      .substring(0, 80); // Limit length / Länge begrenzen
  }, []);

  // Pasul 2108002: mutat aici, deasupra lui highlightBibleReferences,
  // pentru ca acea functie citeste `post.bible_refs`.
  const [post, setPost] = useState<BlogPost | null>(null);

  // 📖 Highlight Bible references in blog text / Bibelreferenzen im Blogtext hervorheben / Evidențiază referințele biblice în textul blogului
  const highlightBibleReferences = useCallback((text: string): React.ReactNode => {
    // Pasul 2208002 (punctul 5): lista cartilor biblice si intreg tiparul
    // au fost mutate in `src/lib/bibleRefPattern.ts`, ca sa poata fi TESTATE.
    // Aici a ramas doar partea care coloreaza textul.

    // Pe langa detectarea automata folosim si fragmentele marcate MANUAL
    // de admin (`blog_posts.bible_refs`).
    const rawManual = (post as unknown as { bible_refs?: unknown })?.bible_refs;
    const manualRefs = (Array.isArray(rawManual) ? rawManual : [])
      .filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
      .sort((a: string, b: string) => b.length - a.length);

    // Pasul 2208002 (punctul 5) — tot tiparul a fost mutat in
    // `src/lib/bibleRefPattern.ts`, ca sa poata fi TESTAT. Testele sunt in
    // `src/lib/__tests__/bibleRefPattern.test.ts` si acopera si bug-ul
    // „Lukas 20,21–22". Aici a ramas doar colorarea.
    const bibleRefRegex = buildBibleRefRegex(manualRefs);

    const parts = text.split(bibleRefRegex);
    
    if (parts.length === 1) {
      // No Bible references found / Keine Bibelreferenzen gefunden / Nu s-au găsit referințe biblice
      return text;
    }

    return parts.map((part, i) => {
      if (bibleRefRegex.test(part)) {
        // Reset lastIndex after test / lastIndex nach Test zurücksetzen
        bibleRefRegex.lastIndex = 0;
        return (
          <span key={i} className="bible-ref">
            {part}
          </span>
        );
      }
      // Reset lastIndex / lastIndex zurücksetzen
      bibleRefRegex.lastIndex = 0;
      return part;
    });
    // Pasul 2108002: depinde de `post`, ca fragmentele marcate manual
    // sa fie aplicate imediat ce articolul s-a incarcat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post]);
  
  // Reading mode for font size adjustments / Lesemodus für Schriftgrößenanpassungen / Mod citire pentru ajustări dimensiune font
  const { fontSize } = useReadingMode();
  
  // Component state / Komponentenstatus / Stare componentă
  // Pasul 2108002: `post` este declarat aici, INAINTE de highlightBibleReferences,
  // pentru ca acea functie citeste `post.bible_refs`.
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // State for intro modal
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [introModalCompleted, setIntroModalCompleted] = useState(false);
  
  // 🌐 DeepL Translation hook and state / DeepL Übersetzungs-Hook und Status / Hook și stare traducere DeepL
  const { translate, translateBatch, isTranslating } = useTranslation();
  const [translatedTitle, setTranslatedTitle] = useState<string>('');
  const [translatedContent, setTranslatedContent] = useState<string>('');
  const [translatedExcerpt, setTranslatedExcerpt] = useState<string>('');
  const [translatedTags, setTranslatedTags] = useState<string[]>([]);
  
  // 🌐 DeepL: State for translated comments with "show original" option
  const [translatedComments, setTranslatedComments] = useState<Map<string, string>>(new Map());
  const [showOriginalComment, setShowOriginalComment] = useState<Set<string>>(new Set());
  
  // 💬 YouTube-style comment features state / YouTube-Stil Kommentar-Features-Status / Stare funcționalități comentarii stil YouTube
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginPopupMessage, setLoginPopupMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showReportModal, setShowReportModal] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [commentLikes, setCommentLikes] = useState<Map<string, { likes: number; dislikes: number; userReaction: 'like' | 'dislike' | null }>>(new Map());
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set()); // Track which comments have expanded replies / Verfolge welche Kommentare erweiterte Antworten haben

  // Pasul C2: modul vizitator — fara comentarii / Guest mode — no comments
  const { isGuest } = useGuestMode();

  // ------------------------------------------------------------------
  // Pasul 2208001 — BLOG DINAMIC („Play Blog")
  // ------------------------------------------------------------------
  const [isPlayOpen, setIsPlayOpen] = useState(false);

  /** Efectele imaginii ARTICOLULUI (alese la creare) */
  const postEffects: ImageEffectSettings = useMemo(() => {
    const p = (post ?? {}) as unknown as Record<string, unknown>;
    return {
      effectNoise: Boolean(p.effect_noise),
      effectGrain: Boolean(p.effect_grain),
      effectSepia: Boolean(p.effect_sepia),
      effectVignette: Boolean(p.effect_vignette),
      sepiaIntensity: (p.sepia_intensity as number) ?? DEFAULT_IMAGE_EFFECTS.sepiaIntensity,
      vignetteIntensity: (p.vignette_intensity as number) ?? DEFAULT_IMAGE_EFFECTS.vignetteIntensity,
      grainOpacity: (p.grain_opacity as number) ?? DEFAULT_IMAGE_EFFECTS.grainOpacity,
      // Pasul 2308005 (E)
      effectBw: Boolean(p.effect_bw),
      effectBloom: Boolean(p.effect_bloom),
      effectLetterbox: Boolean(p.effect_letterbox),
      effectLightLeak: Boolean(p.effect_light_leak),
      // Pasul 2308006-E — intensitatile alese in admin
      noiseIntensity: (p.noise_intensity as number) ?? 35,
      bwIntensity: (p.bw_intensity as number) ?? 50,
      bloomIntensity: (p.bloom_intensity as number) ?? 50,
      letterboxSize: (p.letterbox_size as number) ?? 8,
      lightLeakIntensity: (p.light_leak_intensity as number) ?? 50,
    };
  }, [post]);

  /** Efectele MODALULUI — complet separate de cele ale imaginii */
  const modalEffects: ImageEffectSettings = useMemo(() => {
    const p = (post ?? {}) as unknown as Record<string, unknown>;
    return {
      effectNoise: Boolean(p.modal_effect_noise),
      effectGrain: Boolean(p.modal_effect_grain),
      effectSepia: Boolean(p.modal_effect_sepia),
      effectVignette: Boolean(p.modal_effect_vignette),
      sepiaIntensity: (p.modal_sepia_intensity as number) ?? DEFAULT_IMAGE_EFFECTS.sepiaIntensity,
      vignetteIntensity: (p.modal_vignette_intensity as number) ?? DEFAULT_IMAGE_EFFECTS.vignetteIntensity,
      grainOpacity: (p.modal_grain_opacity as number) ?? DEFAULT_IMAGE_EFFECTS.grainOpacity,
      // Pasul 2308005 (E)
      effectBw: Boolean(p.modal_effect_bw),
      effectBloom: Boolean(p.modal_effect_bloom),
      effectLetterbox: Boolean(p.modal_effect_letterbox),
      effectLightLeak: Boolean(p.modal_effect_light_leak),
      // Pasul 2308006-E — intensitatile pentru „Play Blog"
      noiseIntensity: (p.modal_noise_intensity as number) ?? 35,
      bwIntensity: (p.modal_bw_intensity as number) ?? 50,
      bloomIntensity: (p.modal_bloom_intensity as number) ?? 50,
      letterboxSize: (p.modal_letterbox_size as number) ?? 8,
      lightLeakIntensity: (p.modal_light_leak_intensity as number) ?? 50,
    };
  }, [post]);

  // Pasul 2508000 — reglaje SEPARATE pentru tema luminoasa.
  // Aceeasi poza arata altfel pe alb decat pe negru. Daca nu ai atins
  // reglajele pentru lumina (raman `null`), se folosesc cele intunecate,
  // deci nimic nu se schimba de la sine.
  const modalBackgroundOpacity = useMemo(() => {
    const p = (post ?? {}) as unknown as Record<string, unknown>;
    const dark = (p.modal_background_opacity as number) ?? 35;
    if (theme !== 'light') return dark;
    const light = p.modal_background_opacity_light as number | null | undefined;
    return typeof light === 'number' ? light : dark;
  }, [post, theme]);

  const modalBackgroundShadow = useMemo(() => {
    const p = (post ?? {}) as unknown as Record<string, unknown>;
    const dark = (p.modal_background_shadow as number) ?? 0;
    if (theme !== 'light') return dark;
    const light = p.modal_background_shadow_light as number | null | undefined;
    return typeof light === 'number' ? light : dark;
  }, [post, theme]);

  // Link partajat („?play=1") -> deschidem direct modalul dinamic.
  // Daca aplicatia nu e instalata, browserul deschide oricum www.radikal.blog
  // si ajunge tot aici, deci comportamentul e identic.
  useEffect(() => {
    if (!post?.is_dynamic || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('play') === '1') setIsPlayOpen(true);
  }, [post]);
  
  // State for article navigation (prev/next) / Status für Artikelnavigation (vorheriger/nächster) / Stare pentru navigare articol (anterior/următor)
  const [prevArticle, setPrevArticle] = useState<{ slug: string; title: string } | null>(null);
  const [nextArticle, setNextArticle] = useState<{ slug: string; title: string } | null>(null);
  
  // Supabase client - memoized to prevent re-creation on every render
  // Supabase-Client - memoized um Neuerstellen bei jedem Render zu verhindern
  const supabase = useMemo(() => createClient(), []);

  // Load blog post and comments / Blog-Post und Kommentare laden / Încărcă postarea de blog și comentariile
  // Performance: Reset state when slug changes to prevent stale data accumulation
  useEffect(() => {
    // Reset state for new blog post to free memory / Status für neuen Blog-Post zurücksetzen
    setPost(null);
    setComments([]);
    setTranslatedTitle('');
    setTranslatedContent('');
    setTranslatedExcerpt('');
    setTranslatedTags([]);
    setTranslatedComments(new Map());
    setShowOriginalComment(new Set());
    setCommentLikes(new Map());
    setIsLiked(false);
    setShowIntroModal(false);
    setIntroModalCompleted(false);
    setLoading(true);
    
    // On navigation, slugString from useParams() is ALWAYS the real DB slug
    // Store it as original slug for all future DB queries (likes, comments, etc.)
    // Decode URI-encoded slugs (e.g. %C8%9B → ț) so DB queries match correctly
    // Bei Navigation ist slugString von useParams() IMMER der echte DB-Slug
    // La navigare, slugString din useParams() este ÎNTOTDEAUNA slug-ul real din DB
    if (slugString) {
      const decodedSlug = decodeURIComponent(slugString);
      originalSlugRef.current = decodedSlug;
      loadBlogPost(decodedSlug);
      loadComments(decodedSlug);
      checkUserAuth(decodedSlug);
    }
    
    // Cancel speech synthesis when navigating away
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [slugString]); // Load blog post when slug changes / Blog-Post laden wenn Slug sich ändert

  // Dynamic blog background image feature / Dynamische Blog-Hintergrundbild-Funktion / Funcție imagine fundal dinamică pentru blog
  // When user enters a blog to read it, the blog's image becomes the background / Wenn Benutzer einen Blog betritt um ihn zu lesen, wird das Blog-Bild zum Hintergrund / Când utilizatorul intră pe un blog pentru a-l citi, imaginea blogului devine fundalul
  useEffect(() => {
    if (post?.image_url) {
      // Pasul 1302005: Use a fixed-position div for background image instead of body background
      // Problem: background-attachment:'fixed' breaks scrolling on mobile (Pasul 1302003)
      //          background-attachment:'scroll' makes image stretch to full document height (viel zu groß!)
      // Solution: A fixed div stays viewport-sized and doesn't affect scrolling
      // Lösung: Ein fixiertes Div bleibt viewport-groß und beeinflusst das Scrollen nicht
      // Soluție: Un div fixat rămâne la dimensiunea viewport-ului și nu afectează scroll-ul
      
      // Remove existing background elements first / Existierende Hintergrund-Elemente zuerst entfernen
      const existingBg = document.getElementById('blog-background-image');
      if (existingBg) existingBg.remove();
      const existingOverlay = document.getElementById('blog-background-overlay');
      if (existingOverlay) existingOverlay.remove();
      
      // Create fixed background image div / Fixiertes Hintergrundbild-Div erstellen / Creează div fundal fixat
      const bgDiv = document.createElement('div');
      bgDiv.id = 'blog-background-image';
      bgDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url('${post.image_url}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        z-index: -2;
        pointer-events: none;
        opacity: ${(post.background_opacity ?? 100) / 100};
        filter: ${
          (post.background_shadow ?? 0) > 0
            ? `brightness(${1 - (post.background_shadow ?? 0) / 200})`
            : 'none'
        };
      `;
      document.body.appendChild(bgDiv);
      
      // Add dark overlay for text readability (theme-aware) / Dunkles Overlay für Textlesbarkeit / Overlay întunecat pentru lizibilitate
      const overlay = document.createElement('div');
      overlay.id = 'blog-background-overlay';
      
      // Theme-aware overlay color - improved visibility
      const overlayColor = theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.6)';
      
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${overlayColor};
        z-index: -1;
        pointer-events: none;
        transition: background 0.3s ease;
      `;
      document.body.appendChild(overlay);
      
      // Clear any leftover body background styles from previous approach
      // Lösche übrig gebliebene Body-Hintergrund-Stile / Șterge stiluri fundal rămase pe body
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.backgroundRepeat = '';
    }

    // Cleanup when leaving the blog / Aufräumen beim Verlassen des Blogs / Curățare când se părăsește blogul
    return () => {
      // Remove fixed background divs / Fixierte Hintergrund-Divs entfernen / Elimină div-urile fundal fixate
      const bgDiv = document.getElementById('blog-background-image');
      if (bgDiv) bgDiv.remove();
      const overlay = document.getElementById('blog-background-overlay');
      if (overlay) overlay.remove();
      
      // Also clear any body background styles just in case
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundColor = '';
    };
  }, [post?.image_url, post?.background_opacity, post?.background_shadow, theme]); // Only re-run when image URL or theme changes (not entire post object)

  // Load blog post data / Blog-Post-Daten laden / Încărcă datele postării de blog
  // Pasul 1302003: If exact slug not found, try ilike search as fallback
  // (handles cases where translated URL was bookmarked/cached by browser)
  const loadBlogPost = async (dbSlug?: string) => {
    const querySlug = dbSlug || originalSlugRef.current;
    if (!querySlug) return;
    
    try {
      // First try exact match / Zuerst exakte Übereinstimmung versuchen / Mai întâi încearcă potrivirea exactă
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', querySlug)
        .eq('published', true)
        .single();

      if (data && !error) {
        setPost(data);
        // Update originalSlugRef to the real DB slug
        originalSlugRef.current = data.slug;
        // Pasul 2308006-G — REPARATIE contor vizualizari.
        //
        // Inainte faceam UPDATE direct pe `blog_posts` din browser. Doua
        // probleme: (1) un vizitator nelogat NU are voie sa scrie in tabela
        // (regulile RLS), (2) daca doi cititori deschideau articolul in
        // acelasi timp, unul dintre ei pierdea numaratoarea. De aceea in
        // consola aparea „PATCH … 400 (Bad Request)" la FIECARE articol si
        // contorul practic nu crestea.
        //
        // Acum chemam functia `increment_blog_views` din baza de date
        // (fisier: STEP_2308006_FIXES.sql). Ea are voie sa scrie si aduna
        // corect. Daca functia inca nu a fost creata, nu se intampla nimic
        // rau — doar nu se numara, fara eroare rosie in consola.
        void supabase
          .rpc('increment_blog_views', { p_post_id: data.id })
          .then(({ error: viewsError }) => {
            if (viewsError) console.debug('Views counter skipped:', viewsError.code);
          });
        await loadAdjacentArticles(data.created_at);
        if (data.show_intro_modal && (data.modal_question || data.modal_title)) {
          setShowIntroModal(true);
        } else {
          setIntroModalCompleted(true);
        }
        return;
      }

      // Exact match failed — try partial/fuzzy search as fallback
      // (user may have refreshed a page with a translated slug that no longer exists in DB)
      // Exakte Übereinstimmung fehlgeschlagen — Fallback-Suche versuchen
      // Potrivirea exactă a eșuat — încearcă căutare parțială ca fallback
      console.warn(`Blog not found by slug "${querySlug}", trying fallback search...`);
      
      const { data: allPosts, error: searchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (allPosts && !searchError) {
        // Try to find a post whose slug partially matches the query
        const normalizeSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedQuery = normalizeSlug(querySlug);
        
        // First try: slug contains query or query contains slug
        let matchedPost = allPosts.find(p => {
          const ns = normalizeSlug(p.slug);
          return ns.includes(normalizedQuery) || normalizedQuery.includes(ns);
        });
        
        // Second try: check first 3+ words overlap
        if (!matchedPost) {
          const queryWords = querySlug.split('-').filter(w => w.length > 2);
          if (queryWords.length >= 2) {
            matchedPost = allPosts.find(p => {
              const slugWords = p.slug.split('-').filter((w: string) => w.length > 2);
              const overlap = queryWords.filter(qw => slugWords.some((sw: string) => sw.includes(qw) || qw.includes(sw)));
              return overlap.length >= Math.min(2, queryWords.length);
            });
          }
        }

        if (matchedPost) {
          console.log(`Fallback match found: "${matchedPost.slug}"`);
          setPost(matchedPost);
          originalSlugRef.current = matchedPost.slug;
          // Fix the URL to the correct slug so future refreshes work
          window.history.replaceState(null, '', `/blogs/${matchedPost.slug}`);
          // Pasul 2202000: Increment view count (fire-and-forget)
          supabase.from('blog_posts').update({ views: (matchedPost.views || 0) + 1 }).eq('id', matchedPost.id).then(() => {});
          await loadAdjacentArticles(matchedPost.created_at);
          if (matchedPost.show_intro_modal && (matchedPost.modal_question || matchedPost.modal_title)) {
            setShowIntroModal(true);
          } else {
            setIntroModalCompleted(true);
          }
          return;
        }
      }

      // No match found at all
      console.error('Blog post not found even after fallback search:', querySlug);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load adjacent articles for prev/next navigation / Benachbarte Artikel für Vor-/Zurück-Navigation laden / Încarcă articolele adiacente pentru navigare anterior/următor
  const loadAdjacentArticles = async (currentCreatedAt: string) => {
    try {
      // Get previous article (older) / Vorherigen Artikel abrufen (älter) / Obține articolul anterior (mai vechi)
      const { data: prevData } = await supabase
        .from('blog_posts')
        .select('slug, title')
        .eq('published', true)
        .lt('created_at', currentCreatedAt)
        .order('created_at', { ascending: false })
        .limit(1)
        // Pasul 2308006-G: `.single()` arunca eroarea 406 cand NU exista
        // articol mai vechi (adica la cel mai vechi articol). `.maybeSingle()`
        // returneaza linistit `null`.
        .maybeSingle();

      if (prevData) {
        setPrevArticle({ slug: prevData.slug, title: prevData.title });
      }

      // Get next article (newer) / Nächsten Artikel abrufen (neuer) / Obține articolul următor (mai nou)
      const { data: nextData } = await supabase
        .from('blog_posts')
        .select('slug, title')
        .eq('published', true)
        .gt('created_at', currentCreatedAt)
        .order('created_at', { ascending: true })
        .limit(1)
        // Pasul 2308006-G: la fel ca mai sus — la cel mai nou articol nu
        // exista „urmatorul", deci nu are voie sa fie eroare.
        .maybeSingle();

      if (nextData) {
        setNextArticle({ slug: nextData.slug, title: nextData.title });
      }
    } catch (error) {
      console.error('Error loading adjacent articles:', error);
    }
  };

  // Handle intro modal completion
  const handleIntroModalComplete = () => {
    setShowIntroModal(false);
    setIntroModalCompleted(true);
  };

  // Load comments for this post / Kommentare für diesen Post laden / Încărcă comentariile pentru această postare
  const loadComments = async (passedSlug?: string) => {
    // Pasul C2: vizitatorii nu incarca deloc comentariile
    if (isGuestMode()) return;

    const querySlug = passedSlug || originalSlugRef.current;
    if (!querySlug) return;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', querySlug) // Always use original Romanian slug as post identifier
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading comments:', error);
        return;
      }

      setComments(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Check user authentication / Benutzer-Authentifizierung prüfen / Verifică autentificarea utilizatorului
  const checkUserAuth = async (passedSlug?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    const querySlug = passedSlug || originalSlugRef.current;
    if (user && querySlug) {
      // Check if user has liked this post / Prüfen, ob Benutzer diesen Post geliked hat / Verifică dacă utilizatorul a apăsat like la această postare
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', querySlug)
        .eq('user_id', user.id)
        .single();
      
      setIsLiked(!!data);
    } else if (!user && querySlug) {
      // Pasul 2208001: like-ul vizitatorului, dupa id-ul anonim
      const guestId = getGuestId();
      if (guestId) {
        const { data } = await supabase.rpc('guest_liked_post', {
          p_post_id: querySlug,
          p_guest_id: guestId,
        });
        setIsLiked(data === true);
      }
    }
  };

  // 🌐 DeepL AUTO-TRANSLATION: Translate blog content when language changes
  // Performance: Only triggers when post.id or language changes (not entire post object)
  const postId = post?.id;
  const postTitle = post?.title;
  const postContent = post?.content;
  const postExcerpt = post?.excerpt;
  const postTags = post?.tags;
  
  useEffect(() => {
    const translateContent = async () => {
      if (!postTitle || !postContent || language === 'ro') {
        setTranslatedTitle('');
        setTranslatedContent('');
        setTranslatedExcerpt('');
        return;
      }

      try {
        const tagsToTranslate = Array.isArray(postTags) ? postTags : (postTags ? [postTags] : []);
        
        const [title, content, excerpt, tags] = await Promise.all([
          translate(postTitle, language),
          translate(postContent, language),
          translate(postExcerpt || '', language),
          tagsToTranslate.length > 0 ? translateBatch(tagsToTranslate, language) : Promise.resolve([]),
        ]);

        setTranslatedTitle(title);
        setTranslatedContent(content);
        setTranslatedExcerpt(excerpt);
        setTranslatedTags(tags);
      } catch (error) {
        console.error('DeepL translation failed:', error);
      }
    };

    translateContent();
  }, [postId, language, translate, translateBatch]);

  // 🌐 DeepL: Auto-translate comments when language changes (auto-detect source language)
  useEffect(() => {
    const translateCommentsContent = async () => {
      if (comments.length === 0) {
        setTranslatedComments(new Map());
        return;
      }

      try {
        const commentTexts = comments.map(c => c.content);
        // Use auto-detect (4th parameter = true) since comments can be in any language
        // Auto-Erkennung verwenden (4. Parameter = true) da Kommentare in jeder Sprache sein können
        // Folosește auto-detectare (al 4-lea parametru = true) deoarece comentariile pot fi în orice limbă
        const translated = await translateBatch(commentTexts, language, 'ro', true);
        
        const newMap = new Map<string, string>();
        comments.forEach((comment, index) => {
          newMap.set(comment.id, translated[index] || comment.content);
        });
        
        setTranslatedComments(newMap);
      } catch (error) {
        console.error('DeepL comments translation failed:', error);
      }
    };

    translateCommentsContent();
  }, [comments, language, translateBatch]);

  // Toggle showing original comment / Original-Kommentar umschalten / Comută afișarea comentariului original
  const toggleShowOriginal = (commentId: string) => {
    setShowOriginalComment(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // Get comment text (translated or original) / Kommentartext abrufen (übersetzt oder original) / Obține textul comentariului (tradus sau original)
  // Now works for ALL languages including Romanian (auto-detect source)
  // Funktioniert jetzt für ALLE Sprachen inklusive Rumänisch (Auto-Erkennung Quelle)
  // Acum funcționează pentru TOATE limbile inclusiv română (auto-detectare sursă)
  const getCommentText = (comment: Comment) => {
    if (showOriginalComment.has(comment.id)) return comment.content;
    return translatedComments.get(comment.id) || comment.content;
  };

  // Get display text (translated or original) / Anzeigetext abrufen (übersetzt oder original) / Obține textul pentru afișare (tradus sau original)
  //
  // Pasul 2308003 — DE CE apărea o clipită textul în română:
  // pana venea traducerea, `translatedX || post.x` afisa ORIGINALUL romanesc.
  // Cateva sute de milisecunde mai tarziu sosea traducerea si textul „sarea".
  // Acum, cat timp traducerea nu e gata, nu aratam text deloc (`''`) —
  // in locul lui se vede scheletul de incarcare care exista deja.
  // Rezultat: fara clipire, fara text gresit, nicio secunda.
  const waitingForTranslation = language !== 'ro' && !translatedTitle;
  const displayTitle = language === 'ro'
    ? post?.title
    : (translatedTitle || (waitingForTranslation ? '' : post?.title));
  const displayContent = language === 'ro'
    ? post?.content
    : (translatedContent || '');
  const displayExcerpt = language === 'ro'
    ? post?.excerpt
    : (translatedExcerpt || (waitingForTranslation ? '' : post?.excerpt));
  const displayTags = language === 'ro' ? (post?.tags || []) : (translatedTags.length > 0 ? translatedTags : (post?.tags || []));

  // Update browser tab title with translated blog title
  // Browser-Tab-Titel mit übersetztem Blog-Titel aktualisieren
  // Actualizează titlul tab-ului browserului cu titlul tradus al blogului
  useEffect(() => {
    if (displayTitle) {
      document.title = `${displayTitle} | RADIKAL`;
    }
    return () => { document.title = 'RADIKAL'; };
  }, [displayTitle]);

  // 🌐 Update URL slug to match translated title (cosmetic only — does NOT trigger navigation)
  // Uses window.history.replaceState which does NOT affect Next.js router or useParams
  // All DB queries use originalSlugRef.current, so this is 100% safe
  // Pasul 1302003: DISABLED URL slug translation — it causes "nicht gefunden" on pull-to-refresh
  // because the browser reloads with the translated URL which doesn't exist in DB.
  // URL-Slug-Übersetzung DEAKTIVIERT — verursacht "nicht gefunden" beim Pull-to-Refresh
  // Traducerea slug-ului URL DEZACTIVATĂ — cauzează "nu a fost găsit" la pull-to-refresh
  // The title is already translated in the page content, no need to also translate the URL.
  /*
  useEffect(() => {
    if (!displayTitle || !originalSlugRef.current) return;
    
    const dbSlug = originalSlugRef.current;
    
    if (language === 'ro') {
      const currentPath = window.location.pathname;
      if (currentPath !== `/blogs/${dbSlug}`) {
        window.history.replaceState(null, '', `/blogs/${dbSlug}`);
      }
    } else if (translatedTitle) {
      const translatedSlug = titleToSlug(translatedTitle);
      if (translatedSlug && translatedSlug !== dbSlug) {
        window.history.replaceState(null, '', `/blogs/${translatedSlug}`);
      }
    }
    
    return () => {
      if (dbSlug) {
        window.history.replaceState(null, '', `/blogs/${dbSlug}`);
      }
    };
  }, [displayTitle, translatedTitle, language, titleToSlug]);
  */

  // 💬 Show login required popup / Login-erforderlich-Popup anzeigen / Afișează popup autentificare necesară
  const showLoginRequired = (action: 'like' | 'dislike' | 'reply' | 'bloglike') => {
    const messages = {
      like: {
        de: 'Du musst angemeldet sein, um Kommentare zu liken.',
        en: 'You must be logged in to like comments.',
        ro: 'Trebuie să fii autentificat pentru a da like la comentarii.',
        ru: 'Вы должны войти, чтобы ставить лайки комментариям.'
      },
      dislike: {
        de: 'Du musst angemeldet sein, um Kommentare zu disliken.',
        en: 'You must be logged in to dislike comments.',
        ro: 'Trebuie să fii autentificat pentru a da dislike la comentarii.',
        ru: 'Вы должны войти, чтобы ставить дизлайки комментариям.'
      },
      reply: {
        de: 'Du musst angemeldet sein, um auf Kommentare zu antworten.',
        en: 'You must be logged in to reply to comments.',
        ro: 'Trebuie să fii autentificat pentru a răspunde la comentarii.',
        ru: 'Вы должны войти, чтобы отвечать на комментарии.'
      },
      bloglike: {
        de: 'Du musst angemeldet sein, um diesen Beitrag zu liken.',
        en: 'You must be logged in to like this post.',
        ro: 'Trebuie să fii autentificat pentru a da like la această postare.',
        ru: 'Вы должны войти, чтобы поставить лайк этому посту.'
      }
    };
    setLoginPopupMessage(messages[action][language as keyof typeof messages.like]);
    setShowLoginPopup(true);
    setTimeout(() => setShowLoginPopup(false), 3000);
  };

  // 👍 Handle comment like/dislike / Kommentar-Like/Dislike behandeln / Gestionează like/dislike comentariu
  const handleCommentReaction = async (commentId: string, isLike: boolean) => {
    if (!user) {
      showLoginRequired(isLike ? 'like' : 'dislike');
      return;
    }
    
    // For now, just update local state - full DB implementation requires the SQL tables
    // Für jetzt nur lokalen Status aktualisieren - volle DB-Implementierung erfordert SQL-Tabellen
    // Deocamdată actualizăm doar starea locală - implementarea completă DB necesită tabelele SQL
    setCommentLikes(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(commentId) || { likes: 0, dislikes: 0, userReaction: null };
      
      if (current.userReaction === (isLike ? 'like' : 'dislike')) {
        // Remove reaction / Reaktion entfernen / Elimină reacția
        newMap.set(commentId, {
          likes: isLike ? current.likes - 1 : current.likes,
          dislikes: !isLike ? current.dislikes - 1 : current.dislikes,
          userReaction: null
        });
      } else {
        // Add or change reaction / Reaktion hinzufügen oder ändern / Adaugă sau schimbă reacția
        newMap.set(commentId, {
          likes: isLike ? current.likes + 1 : (current.userReaction === 'like' ? current.likes - 1 : current.likes),
          dislikes: !isLike ? current.dislikes + 1 : (current.userReaction === 'dislike' ? current.dislikes - 1 : current.dislikes),
          userReaction: isLike ? 'like' : 'dislike'
        });
      }
      return newMap;
    });
  };

  // 💬 Handle reply to comment / Auf Kommentar antworten / Răspunde la comentariu
  const handleReply = (commentId: string) => {
    if (!user) {
      showLoginRequired('reply');
      return;
    }
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyContent('');
  };

  // 📨 Submit reply / Antwort absenden / Trimite răspunsul
  const submitReply = async (parentId: string) => {
    if (!replyContent.trim() || !user) return;
    
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: originalSlugRef.current,
          user_id: user.id,
          content: replyContent.trim(),
          author_email: user.email,
          author_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          parent_id: parentId
        });
      
      if (error) throw error;
      
      setReplyContent('');
      setReplyingTo(null);
      loadComments(); // Reload comments to show the new reply
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  // 🚨 Submit report / Meldung absenden / Trimite raportarea
  const submitReport = async (commentId: string) => {
    if (!reportReason.trim() || !user) return;
    
    try {
      // Send email report / E-Mail-Bericht senden / Trimite raport pe email
      const reportedComment = comments.find(c => c.id === commentId);
      
      await fetch('/api/send-report-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          commentContent: reportedComment?.content,
          commentAuthor: reportedComment?.author_name || reportedComment?.author_email,
          reporterEmail: user.email,
          reason: reportReason,
          blogSlug: originalSlugRef.current,
          language
        })
      });
      
      setReportReason('');
      setShowReportModal(null);
      
      // Show success message / Erfolgsmeldung anzeigen / Afișează mesaj de succes
      alert(language === 'de' ? 'Deine Meldung wurde gesendet.' : 
            language === 'en' ? 'Your report has been sent.' : 
            language === 'ro' ? 'Raportarea ta a fost trimisă.' : 
            'Ваша жалоба отправлена.');
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  // Handle post like / Post-Like behandeln / Gestionează like-ul postării
  const handleLike = async () => {
    // Pasul 2208001: si VIZITATORII pot da like (id anonim + RPC).
    if (!user) {
      const guestId = getGuestId();
      if (!guestId) {
        showLoginRequired('bloglike');
        return;
      }
      const next = !isLiked;
      setIsLiked(next); // optimist
      try {
        const { data, error } = await supabase.rpc('toggle_post_like_guest', {
          p_post_id: originalSlugRef.current,
          p_guest_id: guestId,
        });
        if (error) throw error;
        if (typeof data === 'boolean') setIsLiked(data);
      } catch (error) {
        setIsLiked(!next);
        console.error('Error handling guest like:', error);
      }
      return;
    }

    try {
      if (isLiked) {
        // Remove like / Like entfernen / Elimină like-ul
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', originalSlugRef.current)
          .eq('user_id', user.id);
        setIsLiked(false);
      } else {
        // Add like / Like hinzufügen / Adaugă like
        await supabase
          .from('likes')
          .insert({ post_id: originalSlugRef.current, user_id: user.id });
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  // Handle comment submission / Kommentar-Einreichung behandeln / Gestionează trimiterea comentariului
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Bitte melden Sie sich an, um einen Kommentar zu schreiben.');
      window.location.href = '/auth/login';
      return;
    }

    if (!newComment.trim()) {
      alert('Bitte geben Sie einen Kommentar ein.');
      return;
    }

    // Add loading state / Ladezustand hinzufügen / Adaugă stare de încărcare
    const submitButton = e.target as HTMLFormElement;
    const button = submitButton.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (button) {
      button.disabled = true;
      button.textContent = 'Wird gepostet...';
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: originalSlugRef.current,
          user_id: user.id,
          content: newComment,
          author_email: user.email,
          author_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymer Benutzer'
        });

      if (error) {
        console.error('Error submitting comment:', error);
        alert('Fehler beim Senden des Kommentars. Bitte versuchen Sie es erneut.');
        return;
      }

      setNewComment('');
      await loadComments(); // Reload comments / Kommentare neu laden / Reîncărcă comentariile
      alert('Kommentar erfolgreich gepostet!');
    } catch (error) {
      console.error('Error:', error);
      alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      // Reset button state / Button-Status zurücksetzen / Resetează starea butonului
      if (button) {
        button.disabled = false;
        button.textContent = language === 'de' ? 'Kommentar abschicken' : 
                            language === 'en' ? 'Submit Comment' : 
                            language === 'ro' ? 'Trimite Comentariu' : 
                            'Отправить комментарий';
      }
    }
  };

  // Share functionality / Teilen-Funktionalität / Funcționalitate de distribuire
  // State for copied link feedback
  const [linkCopied, setLinkCopied] = useState(false);
  const [discordCopied, setDiscordCopied] = useState(false);
  
  const sharePost = (platform: string) => {
    if (!post) return;
    
    const url = window.location.href;
    // Use DeepL translated text for sharing / DeepL-übersetzten Text zum Teilen verwenden / Folosește textul tradus de DeepL pentru distribuire
    const title = displayTitle || post.title;
    const text = displayExcerpt || post.excerpt;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${title} - ${text} ${url}`)}`);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
        break;
      case 'sms':
        // SMS share - opens native SMS app on mobile
        window.open(`sms:?body=${encodeURIComponent(`${title}\n${url}`)}`);
        break;
      case 'discord':
        // Discord doesn't have a direct share URL
        // Copy text to clipboard and open Discord web app so user can paste it
        navigator.clipboard.writeText(`**${title}**\n${text}\n${url}`);
        setDiscordCopied(true);
        setTimeout(() => setDiscordCopied(false), 2000);
        // Open Discord web app after small delay so user sees the "copied" feedback
        setTimeout(() => {
          window.open('https://discord.com/channels/@me', '_blank');
        }, 500);
        break;
      case 'copylink':
        navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
        break;
    }
  };

  // Format date / Datum formatieren / Formatează data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'de' ? de : language === 'ro' ? ro : language === 'ru' ? ru : enUS;
    return formatDistanceToNow(date, { addSuffix: true, locale });
  };

  // Show loading while checking access — Pasul 121: skeleton dots
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-gray-700 dark:text-white/60">
            {language === 'de' ? 'Wird geladen...' : 
             language === 'en' ? 'Loading...' : 
             language === 'ro' ? 'Se încarcă...' : 
             'Загрузка...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render page if access not allowed
  if (!isAllowed) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {language === 'de' ? 'Blog-Post nicht gefunden' : 
             language === 'en' ? 'Blog post not found' : 
             language === 'ro' ? 'Postarea blog nu a fost găsită' : 
             'Запись блога не найдена'}
          </h1>
          <Link href="/blogs" className="btn-primary">
            {language === 'de' ? 'Zurück zu den Blogs' : 
             language === 'en' ? 'Back to Blogs' : 
             language === 'ro' ? 'Înapoi la Bloguri' : 
             'Обратно к блогам'}
          </Link>
        </div>
      </div>
    );
  }

  // Show intro modal if needed
  if (showIntroModal && post) {
    return (
      <BlogIntroModal 
        post={post} 
        onComplete={handleIntroModalComplete} 
      />
    );
  }

  return (
    <article className="min-h-screen pt-6 sm:pt-12 pb-12">
      {/* JSON-LD Schema for SEO / JSON-LD Schema für SEO / Schema JSON-LD pentru SEO */}
      <BlogPostSchema
        title={displayTitle || post.title}
        description={displayExcerpt || post.excerpt}
        authorName="D.S."
        datePublished={post.created_at}
        dateModified={post.updated_at || post.created_at}
        image={post.image_url || '/exampleblog002.jpg'}
        url={`https://radikal-blog.vercel.app/blogs/${originalSlugRef.current}`}
      />
      <BreadcrumbSchema 
        items={[
          { name: 'Home', url: 'https://radikal-blog.vercel.app' },
          { name: 'Blogs', url: 'https://radikal-blog.vercel.app/blogs' },
          { name: displayTitle || post.title, url: `https://radikal-blog.vercel.app/blogs/${originalSlugRef.current}` }
        ]}
      />
      
      {/* Reading Progress Bar - white/black based on theme / Lesefortschrittsbalken - weiß/schwarz basierend auf Theme / Bară progres citire - alb/negru bazat pe temă */}
      <ReadingProgress 
        targetId="blog-content"
        height={3}
      />
      
      {/* Circular Progress with Back to Top / Kreisförmiger Fortschritt mit Zurück nach oben / Progres circular cu Înapoi sus */}
      <CircularReadingProgress />

      {/* Pasul 2208001 — modalul „Play Blog" pentru articolele dinamice */}
      {post.is_dynamic && (
        <PlayBlogModal
          isOpen={isPlayOpen}
          onClose={() => setIsPlayOpen(false)}
          title={displayTitle || post.title}
          text={displayContent || post.content || ''}
          imageUrl={post.image_url || null}
          slug={originalSlugRef.current || post.slug}
          // Pasul A18 — ca sa poata gasi inregistrarea proprie pe limbi
          blogId={post.id}
          language={language}
          effects={modalEffects}
          backgroundOpacity={modalBackgroundOpacity}
          backgroundShadow={modalBackgroundShadow}
          isLiked={isLiked}
          onToggleLike={handleLike}
        />
      )}
      
      {/* Floating Table of Contents for desktop / Schwebendes Inhaltsverzeichnis für Desktop / Cuprins flotant pentru desktop */}
      <FloatingTableOfContents contentSelector="#blog-content" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button - hidden in print / Zurück-Button - versteckt beim Drucken / Buton înapoi - ascuns la printare */}
        <Link 
          href="/blogs"
          className="back-button inline-flex items-center gap-2 text-gray-800 dark:text-white/80 hover:text-gray-600 dark:hover:text-white mb-4 sm:mb-8 transition-colors duration-200"
        >
          <FaArrowLeft />
          <span>
            {language === 'de' ? 'Zurück zu den Blogs' : 
             language === 'en' ? 'Back to Blogs' : 
             language === 'ro' ? 'Înapoi la Bloguri' : 
             'Обратно к блогам'}
          </span>
        </Link>

        {/* Post header with theme-aware text colors / Post-Kopf mit themenabhängigen Textfarben / Antet postare cu culori text adaptate la temă */}
        <header className="mb-8">
          {/* 🌐 DeepL Translation indicator / DeepL Übersetzungsindikator / Indicator traducere DeepL */}
          {isTranslating && language !== 'ro' && (
            <div className="fixed top-20 right-4 bg-blue-500/90 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-pulse">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span className="text-sm font-medium">
                {language === 'de' ? 'Übersetze Inhalt...' : 
                 language === 'en' ? 'Translating content...' : 
                 'Перевод содержимого...'}
              </span>
            </div>
          )}

          {/* 1. Featured image FIRST / Hauptbild ZUERST / Imagine principală PRIMA */}
          {post.image_url && (
            <div
              className="relative mb-6 rounded-2xl overflow-hidden animate-fadeIn"
              style={{
                // Pasul A15 — umbra imaginii, reglata la acest blog (0-100).
                // 0 = fara umbra. Daca SQL-ul nu a fost rulat, ramane 30.
                boxShadow:
                  (post.post_image_shadow ?? 30) > 0
                    ? `0 ${Math.round((post.post_image_shadow ?? 30) * 0.4)}px ${Math.round(
                        (post.post_image_shadow ?? 30) * 0.9,
                      )}px rgba(0,0,0,${((post.post_image_shadow ?? 30) / 100) * 0.75})`
                    : 'none',
              }}
            >
              <Image
                src={post.image_url}
                alt={displayTitle || post.title}
                width={1200}
                height={600}
                priority
                /* Pasul 21082026 — performanta: imaginea hero se serveste la dimensiunea reala */
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABBEFITEGEjJBUf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AlgBDtv/Z"
                className="w-full h-64 sm:h-96 object-cover"
                /* Pasul A15 — cat de vizibila e imaginea acestui blog */
                style={{ opacity: (post.post_image_opacity ?? 100) / 100 }}
              />

              {/* Pasul 2208001 — efectele imaginii alese la crearea articolului */}
              <ImageEffectLayers settings={postEffects} zIndex={1} />

              {/* Pasul 2308001 — BLOG DINAMIC: butonul „Play Blog".
                  MULT mai mare si exact pe MIJLOCUL imaginii, ca sa fie
                  imposibil de ratat. Pulseaza ca o inima, ca omul sa
                  observe imediat ca poate asculta articolul. */}
              {post.is_dynamic && (
                <button
                  onClick={() => setIsPlayOpen(true)}
                  // Pasul 2508000: `force-white-text` — butonul sta pe o poza,
                  // deci textul si sageata raman ALBE si pe tema luminoasa.
                  // Fara asta, regula globala le facea negre si nu se vedeau.
                  className="play-blog-enter force-white-text absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-white"
                  style={{ animationDelay: '0.9s' }}
                  aria-label="Play Blog"
                >
                  {/* Cercul mare, cu bataie de inima */}
                  <span
                    className="play-blog-heartbeat flex items-center justify-center rounded-full bg-black/50 shadow-2xl ring-1 ring-white/25 backdrop-blur-md transition-transform duration-300 group-hover:scale-105"
                    style={{ width: 'clamp(88px, 22vw, 124px)', height: 'clamp(88px, 22vw, 124px)' }}
                  >
                    <svg
                      viewBox="0 0 60 60"
                      fill="none" stroke="currentColor" strokeWidth="2.6"
                      strokeLinecap="round" strokeLinejoin="round"
                      aria-hidden="true"
                      style={{ width: 'clamp(52px, 13vw, 74px)', height: 'clamp(52px, 13vw, 74px)' }}
                    >
                      <circle cx="30" cy="30" r="27" />
                      <path d="M24 19l18 11-18 11V19z" fill="currentColor" stroke="none" />
                    </svg>
                  </span>

                  <span
                    className="rounded-full bg-black/55 px-4 py-1.5 font-semibold tracking-wide shadow-lg backdrop-blur-md"
                    style={{ fontSize: 'clamp(13px, 3.4vw, 16px)' }}
                  >
                    {language === 'de' ? 'Blog abspielen' :
                     language === 'en' ? 'Play Blog' :
                     language === 'ro' ? 'Redă blogul' :
                     'Слушать блог'}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* 2. Post metadata UNDER image / Metadaten UNTER Bild / Metadate SUB imagine */}
          {/* Fluid flex-stretch layout - auto-adapts to screen size */}
          {/* Mobile: clamp 360→13px, 390→14px, 400→15px, bolder text. Desktop (sm+): original text-base */}
          <div className="flex items-center justify-between text-gray-600 dark:text-white/60 mb-3 animate-fadeIn text-[clamp(0.85rem,calc(-0.15rem+5vw),0.9375rem)] sm:text-base font-semibold xs:font-medium sm:font-normal" style={{ animationDelay: '0.2s' }}>
            {/* Date + Reading time (on <360px they sit together left, on ≥360px date left / time right) */}
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <time dateTime={post.created_at}>
                {formatDate(post.created_at)}
              </time>
              {/* Reading time inline at <360px */}
              <span className="flex items-center gap-1 xs:hidden">
                <span className="mx-1">·</span>
                <FaClock className="text-[0.7em] flex-shrink-0" />
                <span>{getShortReadingTime(calculateReadingTime(post.content || '', language).minutes, language)}</span>
              </span>
            </div>
            
            {/* Reading time on right at ≥360px */}
            <span className="hidden xs:flex items-center gap-1.5 whitespace-nowrap">
              <FaClock className="text-[0.7em] flex-shrink-0" />
              <span>{calculateReadingTime(post.content || '', language).text}</span>
            </span>

            {/* Pasul 2202000: Social proof — view count display */}
            {typeof post.views === 'number' && post.views > 0 && (
              <span className="flex items-center gap-1 whitespace-nowrap text-gray-500 dark:text-white/50">
                <span className="mx-0.5">·</span>
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>{post.views.toLocaleString()}</span>
              </span>
            )}

            {/* BookmarkButton commented out - replaced by Liked Posts / BookmarkButton auskommentiert - ersetzt durch Liked Posts */}
            {/* <div className="xs:hidden flex-shrink-0">
              <BookmarkButton postId={post.id} variant="button" size="sm" className="!px-2 !py-1 !text-[10px] !gap-0.5" />
            </div> */}
          </div>

          {/* Row 2 - Tags on separate line, bolder on mobile */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4 sm:mb-6 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
              {(translatedTags.length > 0 ? translatedTags : (Array.isArray(post.tags) ? post.tags : [post.tags])).slice(0, 2).map((tag, idx) => (
                <span 
                  key={idx}
                  className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white/80 rounded-full text-xs sm:text-sm font-medium sm:font-normal whitespace-nowrap max-w-[90px] sm:max-w-none truncate"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 3. Title AFTER metadata / Titel NACH Metadaten / Titlu DUPĂ metadate */}
          {/* Pasul 2102003: Show skeleton pulse while waiting for DeepL translation instead of Romanian flash */}
          <h1 className="text-[clamp(1.5rem,6vw,2.25rem)] sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 animate-fadeIn tracking-wide">
            {language !== 'ro' && !translatedTitle ? (
              <span className="inline-block w-full h-[1.2em] bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
            ) : (
              displayTitle
            )}
          </h1>
        </header>

        {/* Post content with proper light/dark mode contrast and readable backdrop / Post-Inhalt mit richtigen Hell/Dunkel-Modus-Kontrast und lesbarem Hintergrund / Conținut postare cu contrast corect mod luminos/întunecat și fundal lizibil */}
        <div id="blog-content" className="blog-content-backdrop mb-12 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
          {/* Reading controls toolbar - all in one row on desktop */}
          {/* Desktop: FontSize + TTS + PDF + Focus in single row */}
          {/* Mobile: 2 rows with visible text labels */}
          <div className="reading-controls mb-6 pb-4 border-b border-gray-300 dark:border-white/20">
            {/* Desktop: Single row with all controls - NO wrap */}
            <div className="hidden md:flex items-center gap-2">
              <FontSizeControls />
              <div className="flex-1" />
              <PrintButton variant="icon" showLabel />
              {/* BookmarkButton commented out - replaced by Liked Posts */}
              {/* <BookmarkButton postId={post.id} variant="button" size="sm" className="!px-3 !py-1.5 !text-xs !gap-1.5 sm:!px-4 sm:!py-2 sm:!text-sm sm:!gap-2" /> */}
              <ReadingModeToggle />
            </div>
            
            {/* Mobile layout: responsive rows */}
            <div className="md:hidden flex flex-col gap-2">
              {/* Pasul 2102005: Row 1: FontSize + PDF + Focus — flex-wrap to prevent text cut-off */}
              <div className="flex items-center justify-between gap-1 w-full">
                <FontSizeControls />
                <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
                  <PrintButton variant="icon" showLabel />
                  <ReadingModeToggle />
                </div>
              </div>
            </div>

            {/* Pasul 2102003: TTS — SINGLE shared instance for both mobile and desktop (prevents double playback) */}
            <div className="w-full mt-2 md:mt-0">
              <TextToSpeech 
                text={displayContent || post.content || ''} 
                compact
                blogSlug={post.slug}
                blogTitle={displayTitle || post.title}
              />
            </div>
          </div>
          
          <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
            <div 
              className="blog-body-text text-gray-800 dark:text-white/95 leading-relaxed transition-all duration-200"
              style={{ fontSize: `${fontSize}%` }}
            >
              {/* Pasul 2202000: Show skeleton while translating to avoid Romanian flash */}
              {language !== 'ro' && !translatedContent ? (
                <div className="space-y-4 animate-pulse">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-full" />
                      <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-11/12" />
                      <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-10/12" />
                    </div>
                  ))}
                </div>
              ) : (
              <>
              {/* Apply Drop Cap effect to first paragraph / Drop Cap Effekt auf ersten Absatz anwenden / Aplică efectul Drop Cap la primul paragraf */}
              {displayContent && displayContent.split('\n\n').map((paragraph, index) => {
                // First paragraph gets drop cap effect / Erster Absatz bekommt Drop Cap Effekt / Primul paragraf primește efectul Drop Cap
                if (index === 0 && paragraph.trim()) {
                  return (
                    <p key={index} className="blog-drop-cap mb-6 text-justify">
                      {highlightBibleReferences(paragraph)}
                    </p>
                  );
                }
                // Second paragraph (first after drop cap) gets indent / Zweiter Absatz bekommt Einzug / Al doilea paragraf primește aliniat
                if (index === 1 && paragraph.trim()) {
                  return (
                    <p key={index} className="mb-4 text-justify paragraph-indent">
                      {highlightBibleReferences(paragraph)}
                    </p>
                  );
                }
                // Other paragraphs render normally without indent / Andere Absätze normal ohne Einzug rendern / Celelalte paragrafe normale fără aliniat
                if (paragraph.trim()) {
                  return (
                    <p key={index} className="mb-4 text-justify">
                      {highlightBibleReferences(paragraph)}
                    </p>
                  );
                }
                return null;
              })}
              </>
              )}
            </div>
          </div>
        </div>
        
        {/* Emoji Reactions / Emoji-Reaktionen / Reacții Emoji */}
        <div className="emoji-reactions mb-8 animate-fadeIn" style={{ animationDelay: '0.65s' }}>
          <EmojiReactions postId={post.id} />
        </div>

        {/* Post actions with share buttons / Post-Aktionen mit Teilen-Buttons / Acțiuni postare cu butoane distribuire */}
        <div className="post-actions flex flex-wrap items-center justify-between gap-4 py-6 border-t border-b border-gray-300 dark:border-white/20 mb-12 animate-fadeIn" style={{ animationDelay: '0.8s' }}>
          {/* Like button with theme-aware colors / Like-Button mit themenabhängigen Farben / Buton like cu culori adaptate la temă */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              isLiked 
                ? 'bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30' 
                : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white/80 hover:bg-gray-300 dark:hover:bg-white/20 hover:text-red-600 dark:hover:text-red-400'
            }`}
          >
            <CiHeart className={isLiked ? 'fill-current' : ''} />
            <span>
              {language === 'de' ? 'Gefällt mir' : 
               language === 'en' ? 'Like' : 
               language === 'ro' ? 'Îmi place' : 
               'Нравится'}
            </span>
          </button>

          {/* Share buttons with complete sentence / Teilen-Buttons mit vollständigem Satz / Butoane distribuire cu propoziție completă */}
          <div className="flex flex-col gap-2 w-full">
            <span className="text-gray-600 dark:text-white/60">
              {language === 'de' ? 'Teile diesen Artikel:' : 
               language === 'en' ? 'Share this article:' : 
               language === 'ro' ? 'Distribuie acest articol:' : 
               'Поделиться статьёй:'}
            </span>
            <div className="flex items-center flex-nowrap w-full justify-evenly">
            <button
              onClick={() => sharePost('whatsapp')}
              className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-300 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              title="WhatsApp"
            >
              <FaWhatsapp className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
            </button>
            <button
              onClick={() => sharePost('telegram')}
              className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-300 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              title="Telegram"
            >
              <FaTelegram className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
            </button>
            <button
              onClick={() => sharePost('email')}
              className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-300 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              title="Email"
            >
              <FaEnvelope className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
            </button>
            <button
              onClick={() => sharePost('twitter')}
              className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-300 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              title="Twitter / X"
            >
              <FaTwitter className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
            </button>
            <button
              onClick={() => sharePost('discord')}
              className={`hidden xs:flex w-9 h-9 items-center justify-center rounded-lg transition-colors duration-200 ${
                discordCopied 
                  ? 'bg-gray-300 dark:bg-white/20 text-gray-900 dark:text-white' 
                  : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-300 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-white'
              }`}
              title='Discord'
            >
             <FaDiscord className="w-4 h-4" />
            </button>
            <button
              onClick={() => sharePost('copylink')}
              className={`w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center rounded-lg transition-colors duration-200 ${
                linkCopied 
                  ? 'bg-gray-300 dark:bg-white/20 text-gray-900 dark:text-white' 
                  : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-300 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={language === 'de' ? 'Link kopieren' : 
                     language === 'en' ? 'Copy Link' : 
                     language === 'ro' ? 'Copiază Link' : 
                     'Копировать ссылку'}
            >
              {linkCopied ? <FaCheck className="w-3.5 h-3.5 xs:w-4 xs:h-4" /> : <FaLink className="w-3.5 h-3.5 xs:w-4 xs:h-4" />}
            </button>
            {/* SMS share button - mobile only */}
            <button
              onClick={() => sharePost('sms')}
              className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-300 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 md:hidden"
              title={language === 'de' ? 'Als SMS senden' : 
                     language === 'en' ? 'Send as SMS' : 
                     language === 'ro' ? 'Trimite ca SMS' : 
                     'Отправить как SMS'}
            >
              <FaSms className="w-4 h-4" />
            </button>
            </div>
          </div>
        </div>

        {/* Pasul C2: Vizitatorii NU au acces la comentarii */}
        {/* Guests have NO access to comments / Gäste haben KEINEN Zugriff auf Kommentare */}
        {isGuest && (
          <section className="comments-section animate-fadeIn" style={{ animationDelay: '1s' }}>
            <div className="glass-effect rounded-xl p-6 text-center">
              <p className="text-white/80">
                {language === 'de' ? 'Kommentare sind nur für registrierte Benutzer sichtbar.' :
                 language === 'en' ? 'Comments are only visible to registered users.' :
                 language === 'ro' ? 'Comentariile sunt vizibile doar pentru utilizatorii înregistrați.' :
                 'Комментарии видны только зарегистрированным пользователям.'}
              </p>
            </div>
          </section>
        )}

        {/* Comments section / Kommentarbereich / Secțiune comentarii */}
        <section
          id="comments"
          className="comments-section animate-fadeIn"
          style={{ animationDelay: '1s', display: isGuest ? 'none' : undefined }}
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <TfiComment />
            {language === 'de' ? 'Kommentare' : 
             language === 'en' ? 'Comments' : 
             language === 'ro' ? 'Comentarii' : 
             'Комментарии'} ({comments.length})
          </h2>

          {/* Comment form / Kommentar-Formular / Formular comentariu */}
          {user ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="glass-effect rounded-xl p-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={language === 'de' ? 'Schreibe einen Kommentar...' : 
                              language === 'en' ? 'Write a comment...' : 
                              language === 'ro' ? 'Scrie un comentariu...' : 
                              'Напишите комментарий...'}
                  className="w-full bg-transparent text-white placeholder-white/60 border-none resize-none focus:outline-none min-h-[100px]"
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-4">
                  <span className="text-white/60 text-sm">
                    {newComment.length}/1000
                  </span>
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="btn-primary dark:secondary disabled:opacity-50 disabled:cursor-not-allowed text-[11px] xs:text-sm"
                  >
                    {language === 'de' ? 'Kommentar veröffentlichen' : 
                     language === 'en' ? 'Post Comment' : 
                     language === 'ro' ? 'Publică Comentariul' : 
                     'Опубликовать комментарий'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="glass-effect rounded-xl p-6 text-center mb-8">
              <p className="text-white/80 mb-4">
                {language === 'de' ? 'Melde dich an, um einen Kommentar zu schreiben' : 
                 language === 'en' ? 'Login to comment' : 
                 language === 'ro' ? 'Conectează-te pentru a comenta' : 
                 'Войдите, чтобы комментировать'}
              </p>
              <Link href="/auth/login" className="btn-primary">
                {language === 'de' ? 'Anmelden' : 
                 language === 'en' ? 'Login' : 
                 language === 'ro' ? 'Conectare' : 
                 'Войти'}
              </Link>
            </div>
          )}

          {/* Comments list / Kommentarliste / Listă comentarii - YouTube Style with Threading */}
          <div className="space-y-6">
            {(() => {
              // Separate top-level comments from replies / Trenne Top-Level-Kommentare von Antworten / Separă comentariile principale de răspunsuri
              const topLevelComments = comments.filter(c => !c.parent_id);
              const repliesMap = new Map<string, typeof comments>();
              comments.forEach(c => {
                if (c.parent_id) {
                  const existing = repliesMap.get(c.parent_id) || [];
                  existing.push(c);
                  repliesMap.set(c.parent_id, existing);
                }
              });

              // Helper function to render a single comment / Hilfsfunktion zum Rendern eines einzelnen Kommentars
              const renderComment = (comment: typeof comments[0], isReply: boolean = false) => {
              // Generate avatar color based on username - DARKER colors to match RADIKAL
              // Avatar-Farbe basierend auf Benutzername generieren - DUNKLER Farben für RADIKAL
              // Generează culoare avatar bazată pe username - culori MAI ÎNCHISE pentru RADIKAL
              const userName = comment.author_name || comment.author_email?.split('@')[0] || 'Anonym';
              const initial = userName.charAt(0).toUpperCase();
              const avatarColors = [
                'bg-red-700', 'bg-blue-700', 'bg-green-700', 'bg-purple-700', 
                'bg-rose-700', 'bg-amber-700', 'bg-indigo-700', 'bg-teal-700',
                'bg-emerald-700', 'bg-cyan-700', 'bg-violet-700', 'bg-fuchsia-700'
              ];
              const colorIndex = userName.charCodeAt(0) % avatarColors.length;
              const avatarColor = avatarColors[colorIndex];
              
              // Get like/dislike data for this comment
              const likeData = commentLikes.get(comment.id) || { likes: 0, dislikes: 0, userReaction: null };
              
              // Calculate relative time
              const getRelativeTime = (dateString: string) => {
                const date = new Date(dateString);
                const now = new Date();
                const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
                
                if (diffInSeconds < 60) return language === 'de' ? 'gerade eben' : language === 'en' ? 'just now' : language === 'ro' ? 'chiar acum' : 'только что';
                if (diffInSeconds < 3600) {
                  const mins = Math.floor(diffInSeconds / 60);
                  return language === 'de' ? `vor ${mins} Min.` : language === 'en' ? `${mins}m ago` : language === 'ro' ? `acum ${mins} min` : `${mins} мин. назад`;
                }
                if (diffInSeconds < 86400) {
                  const hours = Math.floor(diffInSeconds / 3600);
                  return language === 'de' ? `vor ${hours} Std.` : language === 'en' ? `${hours}h ago` : language === 'ro' ? `acum ${hours} ore` : `${hours} ч. назад`;
                }
                if (diffInSeconds < 604800) {
                  const days = Math.floor(diffInSeconds / 86400);
                  return language === 'de' ? `vor ${days} Tag${days > 1 ? 'en' : ''}` : language === 'en' ? `${days}d ago` : language === 'ro' ? `acum ${days} zi${days > 1 ? 'le' : ''}` : `${days} дн. назад`;
                }
                if (diffInSeconds < 2592000) {
                  const weeks = Math.floor(diffInSeconds / 604800);
                  return language === 'de' ? `vor ${weeks} Woche${weeks > 1 ? 'n' : ''}` : language === 'en' ? `${weeks}w ago` : language === 'ro' ? `acum ${weeks} săpt.` : `${weeks} нед. назад`;
                }
                if (diffInSeconds < 31536000) {
                  const months = Math.floor(diffInSeconds / 2592000);
                  return language === 'de' ? `vor ${months} Monat${months > 1 ? 'en' : ''}` : language === 'en' ? `${months}mo ago` : language === 'ro' ? `acum ${months} lun${months > 1 ? 'i' : 'ă'}` : `${months} мес. назад`;
                }
                const years = Math.floor(diffInSeconds / 31536000);
                return language === 'de' ? `vor ${years} Jahr${years > 1 ? 'en' : ''}` : language === 'en' ? `${years}y ago` : language === 'ro' ? `acum ${years} an${years > 1 ? 'i' : ''}` : `${years} г. назад`;
              };

              return (
                <div key={comment.id} className={`flex gap-3 ${isReply ? '' : ''}`}>
                  {/* Avatar - YouTube Style with darker colors / Smaller for replies */}
                  <div className={`flex-shrink-0 ${isReply ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'} rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold shadow-lg`}>
                    {initial}
                  </div>
                  
                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    {/* Username and Time */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white text-sm hover:text-white/80 cursor-pointer">
                        @{userName.toLowerCase().replace(/\s+/g, '')}
                      </span>
                      <span className="text-white/50 text-xs">
                        {getRelativeTime(comment.created_at)}
                      </span>
                      {/* Translation indicator */}
                      {showOriginalComment.has(comment.id) && (
                        <span className="text-xs text-white/40 italic">
                          ({language === 'de' ? 'Original' : language === 'ro' ? 'Original' : language === 'en' ? 'Original' : 'Оригинал'})
                        </span>
                      )}
                    </div>
                    
                    {/* Comment Text */}
                    <p className="text-white/90 text-sm leading-relaxed mb-2">
                      {getCommentText(comment)}
                    </p>
                    
                    {/* Action Buttons - YouTube Style */}
                    <div className="flex items-center gap-1 -ml-2 flex-wrap">
                      {/* Like Button with count */}
                      <button 
                        onClick={() => handleCommentReaction(comment.id, true)}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-full transition-all duration-200 group/like ${
                          likeData.userReaction === 'like' 
                            ? 'text-blue-400 bg-blue-500/10' 
                            : 'text-white/60 hover:bg-white/10'
                        }`}
                        title={language === 'de' ? 'Gefällt mir' : language === 'en' ? 'Like' : language === 'ro' ? 'Îmi place' : 'Нравится'}
                      >
                        <svg className={`w-4 h-4 group-hover/like:scale-110 transition-transform ${likeData.userReaction === 'like' ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                        </svg>
                        {likeData.likes > 0 && <span className="text-xs">{likeData.likes}</span>}
                      </button>
                      
                      {/* Dislike Button */}
                      <button 
                        onClick={() => handleCommentReaction(comment.id, false)}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-full transition-all duration-200 group/dislike ${
                          likeData.userReaction === 'dislike' 
                            ? 'text-red-400 bg-red-500/10' 
                            : 'text-white/60 hover:bg-white/10'
                        }`}
                        title={language === 'de' ? 'Gefällt mir nicht' : language === 'en' ? 'Dislike' : language === 'ro' ? 'Nu îmi place' : 'Не нравится'}
                      >
                        <svg className={`w-4 h-4 group-hover/dislike:scale-110 transition-transform ${likeData.userReaction === 'dislike' ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 01-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 00.303-.54m.023-8.25H16.48a4.5 4.5 0 01-1.423-.23l-3.114-1.04a4.5 4.5 0 00-1.423-.23H6.504c-.618 0-1.217.247-1.605.729A11.95 11.95 0 002.25 12c0 .434.023.863.068 1.285C2.427 14.306 3.346 15 4.372 15h3.126c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.5a2.25 2.25 0 002.25 2.25.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384" />
                        </svg>
                      </button>
                      
                      {/* Reply Button */}
                      <button 
                        onClick={() => handleReply(comment.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                          replyingTo === comment.id 
                            ? 'text-blue-400 bg-blue-500/10' 
                            : 'text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {language === 'de' ? 'Antworten' : language === 'en' ? 'Reply' : language === 'ro' ? 'Răspunde' : 'Ответить'}
                      </button>
                      
                      {/* Translation Toggle - YouTube Style */}
                      {translatedComments.has(comment.id) && (
                        <button
                          onClick={() => toggleShowOriginal(comment.id)}
                          className="px-3 py-1.5 rounded-full text-blue-400 hover:bg-blue-500/10 text-xs font-medium transition-all duration-200 flex items-center gap-1.5"
                        >
                          {showOriginalComment.has(comment.id) ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                              {language === 'de' ? 'Übersetzung' : language === 'ro' ? 'Traducere' : language === 'en' ? 'Translation' : 'Перевод'}
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                              </svg>
                              {language === 'de' ? 'Original' : language === 'ro' ? 'Original' : language === 'en' ? 'Original' : 'Оригинал'}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* Reply Form - appears when replying */}
                    {replyingTo === comment.id && (
                      <div className="mt-3 pl-4 border-l-2 border-white/20">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={language === 'de' ? 'Antwort schreiben...' : 
                                      language === 'en' ? 'Write a reply...' : 
                                      language === 'ro' ? 'Scrie un răspuns...' : 
                                      'Написать ответ...'}
                          className="w-full bg-white/5 text-white placeholder-white/40 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px]"
                          maxLength={500}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="px-4 py-1.5 rounded-full text-white/60 hover:bg-white/10 text-xs font-medium transition-all"
                          >
                            {language === 'de' ? 'Abbrechen' : language === 'en' ? 'Cancel' : language === 'ro' ? 'Anulează' : 'Отмена'}
                          </button>
                          <button
                            onClick={() => submitReply(comment.id)}
                            disabled={!replyContent.trim()}
                            className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {language === 'de' ? 'Antworten' : language === 'en' ? 'Reply' : language === 'ro' ? 'Răspunde' : 'Ответить'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Three dots menu - Always visible / Immer sichtbar / Mereu vizibil */}
                  <div className="relative flex-shrink-0">
                    <button 
                      onClick={() => setActiveMenu(activeMenu === comment.id ? null : comment.id)}
                      className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/60 transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu — force-white-text keeps text white in light mode on dark bg-gray-900 */}
                    {activeMenu === comment.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-gray-900 rounded-lg shadow-xl py-1 z-50 border border-white/10 force-white-text">
                        <button
                          onClick={() => {
                            setActiveMenu(null);
                            if (!user) {
                              showLoginRequired('reply');
                            } else {
                              setShowReportModal(comment.id);
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-red-400 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                          </svg>
                          {language === 'de' ? 'Melden' : language === 'en' ? 'Report' : language === 'ro' ? 'Raportează' : 'Пожаловаться'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
              }; // End of renderComment helper function

              // Render threaded comments: top-level first, then replies underneath
              // Gewindete Kommentare rendern: Top-Level zuerst, dann Antworten darunter
              // Redare comentarii cu fire: principale mai întâi, apoi răspunsuri dedesubt
              return (
                <>
                  {topLevelComments.map((comment) => {
                    const replies = repliesMap.get(comment.id) || [];
                    const hasReplies = replies.length > 0;
                    const isExpanded = expandedReplies.has(comment.id);

                    return (
                      <div key={comment.id} className="space-y-0">
                        {/* Top-level comment / Hauptkommentar / Comentariu principal */}
                        {renderComment(comment, false)}
                        
                        {/* Replies section - YouTube style / Antworten-Bereich - YouTube-Stil / Secțiune răspunsuri - stil YouTube */}
                        {hasReplies && (
                          <div className="ml-12 mt-2">
                            {/* Toggle replies button / Antworten ein-/ausblenden / Arată/ascunde răspunsuri */}
                            <button
                              onClick={() => {
                                setExpandedReplies(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(comment.id)) {
                                    newSet.delete(comment.id);
                                  } else {
                                    newSet.add(comment.id);
                                  }
                                  return newSet;
                                });
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-blue-400 hover:bg-blue-500/10 text-xs font-semibold transition-all duration-200 mb-3"
                            >
                              <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                              {replies.length} {language === 'de' 
                                ? (replies.length === 1 ? 'Antwort' : 'Antworten') 
                                : language === 'en' 
                                  ? (replies.length === 1 ? 'reply' : 'replies') 
                                  : language === 'ro' 
                                    ? (replies.length === 1 ? 'răspuns' : 'răspunsuri') 
                                    : (replies.length === 1 ? 'ответ' : replies.length < 5 ? 'ответа' : 'ответов')}
                            </button>
                            
                            {/* Expanded replies / Erweiterte Antworten / Răspunsuri extinse */}
                            {isExpanded && (
                              <div className="space-y-4 border-l-2 border-white/10 pl-4">
                                {replies.map((reply) => renderComment(reply, true))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              );
            })()}
            
            {comments.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <p className="text-white/60 text-sm">
                  {language === 'de' ? 'Noch keine Kommentare. Sei der Erste!' : 
                   language === 'en' ? 'No comments yet. Be the first!' : 
                   language === 'ro' ? 'Încă nu există comentarii. Fii primul!' : 
                   'Пока нет комментариев. Будь первым!'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Article Navigation (Previous/Next) - ABOVE Related Posts / Artikelnavigation (Vorheriger/Nächster) - ÜBER Ähnliche Beiträge / Navigare Articol (Anterior/Următor) - DEASUPRA Postărilor Similare */}
        <div className="article-navigation animate-fadeIn" style={{ animationDelay: '1.05s' }}>
          <ArticleNavigation 
            prevArticle={prevArticle}
            nextArticle={nextArticle}
          />
        </div>

        {/* Related Posts - after article navigation / Ähnliche Beiträge - nach Artikelnavigation / Postări similare - după navigare articol */}
        <div className="related-posts mt-8 animate-fadeIn" style={{ animationDelay: '1.1s' }}>
          <RelatedPosts 
            currentPostId={post.id} 
            currentTags={Array.isArray(post.tags) ? post.tags : (post.tags ? [post.tags] : [])} 
          />
        </div>
      </div>
      
      {/* Login Required Popup / Login-erforderlich-Popup / Popup autentificare necesară */}
      {/* Centered on screen for both desktop and mobile */}
      {showLoginPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-gray-900 dark:bg-gray-800 text-white px-6 py-4 rounded-xl shadow-2xl border border-white/20 flex flex-col sm:flex-row items-center gap-3 max-w-sm w-full pointer-events-auto animate-fadeIn force-white-text">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <svg className="w-6 h-6 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium">{loginPopupMessage}</span>
            </div>
            <Link href="/auth/login" className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors text-center">
              {language === 'de' ? 'Anmelden' : language === 'en' ? 'Login' : language === 'ro' ? 'Conectare' : 'Войти'}
            </Link>
          </div>
        </div>
      )}
      
      {/* Report Modal / Melden-Modal / Modal raportare */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-white/10 shadow-2xl force-white-text">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
              {language === 'de' ? 'Kommentar melden' : 
               language === 'en' ? 'Report Comment' : 
               language === 'ro' ? 'Raportează comentariul' : 
               'Пожаловаться на комментарий'}
            </h3>
            <p className="text-white/60 text-sm mb-4">
              {language === 'de' ? 'Bitte beschreibe, warum du diesen Kommentar meldest:' : 
               language === 'en' ? 'Please describe why you are reporting this comment:' : 
               language === 'ro' ? 'Te rugăm să descrii de ce raportezi acest comentariu:' : 
               'Пожалуйста, опишите, почему вы жалуетесь на этот комментарий:'}
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={language === 'de' ? 'Grund der Meldung...' : 
                          language === 'en' ? 'Reason for report...' : 
                          language === 'ro' ? 'Motivul raportării...' : 
                          'Причина жалобы...'}
              className="w-full bg-white/5 text-white placeholder-white/40 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[120px] border border-white/10"
              maxLength={500}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowReportModal(null);
                  setReportReason('');
                }}
                className="px-4 py-2 rounded-lg text-white/60 hover:bg-white/10 text-sm font-medium transition-all"
              >
                {language === 'de' ? 'Abbrechen' : language === 'en' ? 'Cancel' : language === 'ro' ? 'Anulează' : 'Отмена'}
              </button>
              <button
                onClick={() => submitReport(showReportModal)}
                disabled={!reportReason.trim()}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {language === 'de' ? 'Melden' : language === 'en' ? 'Report' : language === 'ro' ? 'Raportează' : 'Пожаловаться'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
