// Blog list component for displaying blog posts / Blog-Listen-Komponente zur Anzeige von Blog-Posts / Componentă listă blog pentru afișarea posturilor de blog
// This component shows the latest blogs with pagination and beautiful styling
// Diese Komponente zeigt die neuesten Blogs mit Paginierung und schönem Styling
// Această componentă afișează cele mai recente bloguri cu paginare și stilizare frumoasă

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { de, enUS, ro, ru } from 'date-fns/locale';
import { BlogPost } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from '@/hooks/useTranslation';
import { createClient } from '@/lib/supabase';
import { 
  FaRegHeart,
  FaShare, 
  FaWhatsapp, 
  FaTelegram, 
  FaEnvelope,
  FaTwitter,
  FaFacebook 
} from 'react-icons/fa';
import { TfiComment } from 'react-icons/tfi';
// Skeleton Loading / Skeleton-Laden / Încărcare Skeleton
import { BlogCardSkeleton } from '@/components/Skeleton';

interface BlogListProps {
  initialPosts?: BlogPost[];
  showOlderButton?: boolean;
  filterYear?: number | null;
  filterMonth?: number | null; // 0-indexed (0 = January)
}

// Pasul 2208002 (punctul 13) — coloanele de care are nevoie LISTA de bloguri.
// `content` (textul intreg al articolului) NU este cerut: pe card se afiseaza
// doar `excerpt`, iar articolele lungi ar incarca degeaba sute de kilobytes.
const BLOG_LIST_COLUMNS = [
  'id',
  'title',
  'slug',
  'excerpt',
  'image_url',
  'tags',
  'created_at',
  'updated_at',
  'published',
  'likes_count',
  // Pasul 2308001 — CORECTARE: `views` NU exista in `blog_posts`.
  // Il ceream degeaba, iar Postgres respingea INTREAGA cerere cu
  // „column blog_posts.views does not exist", deci nu se incarca niciun blog.
  'is_dynamic',
].join(', ');

export default function BlogList({ initialPosts = [], showOlderButton = true, filterYear = null, filterMonth = null }: BlogListProps) {
  // Get language context / Sprachkontext abrufen / Obține contextul limbii
  const { language } = useLanguage();
  
  // DeepL Translation hook / DeepL Übersetzungs-Hook / Hook traducere DeepL
  const { translateBatch, isTranslating } = useTranslation();
  
  // Component state / Komponentenstatus / Stare componentă
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  
  // Pasul 1123: Mobile carousel state
  const [isMobile, setIsMobile] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Detect mobile for swipeable carousel
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track active slide via scroll position
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || !isMobile) return;
    const handleScroll = () => {
      const scrollLeft = carousel.scrollLeft;
      const cardWidth = carousel.offsetWidth;
      if (cardWidth === 0) return;
      const idx = Math.round(scrollLeft / cardWidth);
      setActiveSlide(Math.max(0, Math.min(idx, Math.min(posts.length, 6) - 1)));
    };
    // Listen to both scroll and touchend for reliability
    carousel.addEventListener('scroll', handleScroll, { passive: true });
    carousel.addEventListener('touchend', () => {
      // Small delay to let momentum scroll settle
      setTimeout(handleScroll, 150);
    }, { passive: true });
    // Initial check
    handleScroll();
    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      carousel.removeEventListener('touchend', handleScroll);
    };
  }, [isMobile, posts.length]);
  
  // Translation state / Übersetzungsstatus / Stare traducere
  const [translatedPosts, setTranslatedPosts] = useState<Map<string, { title: string; excerpt: string; tags: string[] }>>(new Map());
  
  // Supabase client / Supabase-Client / Client Supabase
  const supabase = createClient();

  // Load blog posts from Supabase with optimized performance / Blog-Posts aus Supabase laden mit optimierter Performance / Încărcă postările de blog din Supabase cu performanță optimizată
  const loadPosts = async (pageNum: number = 1, reset: boolean = false) => {
    setLoading(true);
    try {
      const from = (pageNum - 1) * 10;
      const to = from + 9;

      // Build query with optional month filter / Query mit optionalem Monatsfilter erstellen / Construiește query cu filtru opțional pe lună
      // Pasul 2208002 (punctul 13): `blog_posts` are acum multe coloane
      // (efecte de imagine, setarile modalului etc.). Pentru LISTA nu avem
      // nevoie de ele — mai ales de `content`, care este cel mai mare camp.
      // Cerem doar ce se foloseste efectiv, deci lista se incarca mai repede
      // si consuma mai putin trafic pe telefon.
      let query = supabase
        .from('blog_posts')
        .select(BLOG_LIST_COLUMNS)
        .eq('published', true)
        .order('created_at', { ascending: false });

      // Apply month filter if provided / Monatsfilter anwenden wenn vorhanden / Aplică filtrul pe lună dacă există
      if (filterYear !== null && filterMonth !== null) {
        // Calculate start and end of month / Start und Ende des Monats berechnen / Calculează începutul și sfârșitul lunii
        const startOfMonth = new Date(filterYear, filterMonth, 1);
        const endOfMonth = new Date(filterYear, filterMonth + 1, 0, 23, 59, 59, 999);
        
        query = query
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString());
      }

      let { data, error } = await query.range(from, to);

      // Pasul 2308001 — PLASA DE SIGURANTA.
      // Codul `42703` inseamna „coloana nu exista". Se poate intampla daca un
      // fisier SQL nu a fost inca rulat (de exemplu `is_dynamic`). Inainte,
      // asta lasa pagina complet goala: „Keine Blogs gefunden".
      // Acum cerem pur si simplu toate coloanele si mergem mai departe, ca sa
      // NU ramana niciodata cititorul fara articole.
      if (error && (error as { code?: string }).code === '42703') {
        console.warn(
          '[BlogList] O coloană lipsește din `blog_posts` — reîncerc cu toate coloanele. ' +
          'Probabil un fișier SQL nu a fost încă rulat.',
          error.message,
        );

        let fallback = supabase
          .from('blog_posts')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false });

        if (filterYear !== null && filterMonth !== null) {
          const s = new Date(filterYear, filterMonth, 1);
          const e = new Date(filterYear, filterMonth + 1, 0, 23, 59, 59, 999);
          fallback = fallback.gte('created_at', s.toISOString()).lte('created_at', e.toISOString());
        }

        const retry = await fallback.range(from, to);
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error('Error loading posts:', error);
        return;
      }

      // Pasul 2208002 (punctul 13): cerem o lista explicita de coloane, deci
      // TypeScript nu mai poate deduce singur tipul. Randurile au exact
      // campurile de care are nevoie cardul, asa ca precizarea este sigura.
      const newPosts = (data || []) as unknown as BlogPost[];
      
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      
      // Check if there are more posts / Prüfen, ob es weitere Posts gibt / Verifică dacă există mai multe postări
      setHasMore(newPosts.length === 10);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial posts / Anfängliche Posts laden / Încărcă postările inițiale
  useEffect(() => {
    // EXPLANATION: Always try to load posts when component mounts or filter changes
    // This fixes the issue where sometimes no blogs are shown when navigating
    // from other pages (like "über uns" -> "blogs entdecken")
    console.log('BlogList: Component mounted or filter changed, loading posts...');
    setPage(1);
    loadPosts(1, true);
  }, [filterYear, filterMonth]); // Reload when filter changes / Neu laden wenn Filter sich ändert / Reîncarcă când filtrul se schimbă

  // 🌐 DeepL AUTO-TRANSLATION: Translate posts when language changes
  // 🌐 DeepL AUTO-ÜBERSETZUNG: Posts automatisch übersetzen wenn Sprache sich ändert
  // 🌐 DeepL TRADUCERE AUTOMATĂ: Traduce postările când limba se schimbă
  useEffect(() => {
    const translatePosts = async () => {
      // Skip if Romanian (original language) or no posts / Überspringen wenn Rumänisch oder keine Posts / Sari peste dacă este Română sau nu sunt postări
      if (language === 'ro' || posts.length === 0) {
        setTranslatedPosts(new Map());
        return;
      }

      console.log(`🌐 DeepL: Translating ${posts.length} posts to ${language}...`);

      // Collect all texts to translate / Alle zu übersetzenden Texte sammeln / Colectează toate textele pentru traducere
      const titles = posts.map(post => post.title);
      const excerpts = posts.map(post => post.excerpt);
      
      // Collect all unique tags / Alle einzigartigen Tags sammeln / Colectează toate tag-urile unice
      const allTags: string[] = [];
      posts.forEach(post => {
        if (post.tags) {
          const tagsArray = Array.isArray(post.tags) ? post.tags : [post.tags];
          tagsArray.forEach(tag => {
            if (!allTags.includes(tag)) allTags.push(tag);
          });
        }
      });

      try {
        // Translate in batch for efficiency / Im Batch übersetzen für Effizienz / Traduce în lot pentru eficiență
        const [translatedTitles, translatedExcerpts, translatedTags] = await Promise.all([
          translateBatch(titles, language),
          translateBatch(excerpts, language),
          allTags.length > 0 ? translateBatch(allTags, language) : Promise.resolve([]),
        ]);

        // Create tag translation map / Tag-Übersetzungs-Map erstellen / Creează maparea traducerilor tag-urilor
        const tagTranslationMap = new Map<string, string>();
        allTags.forEach((tag, index) => {
          tagTranslationMap.set(tag, translatedTags[index] || tag);
        });

        // Create translation map / Übersetzungs-Map erstellen / Creează maparea traducerilor
        const newTranslations = new Map<string, { title: string; excerpt: string; tags: string[] }>();
        posts.forEach((post, index) => {
          const postTagsArray = post.tags ? (Array.isArray(post.tags) ? post.tags : [post.tags]) : [];
          const translatedPostTags = postTagsArray.map(tag => tagTranslationMap.get(tag) || tag);
          newTranslations.set(post.id, {
            title: translatedTitles[index] || post.title,
            excerpt: translatedExcerpts[index] || post.excerpt,
            tags: translatedPostTags,
          });
        });

        setTranslatedPosts(newTranslations);
        console.log('✅ DeepL: Posts translated successfully');
      } catch (error) {
        console.error('❌ DeepL: Failed to translate posts:', error);
      }
    };

    translatePosts();
  }, [language, posts, translateBatch]);

  // Pasul 2308001 — GATA CU SCLIPIREA ÎN ROMÂNĂ.
  //
  // Înainte scria `|| post.title`. Adică: „dacă traducerea nu a venit încă,
  // arată româna". De aceea, o clipă, cititorul german vedea textul românesc
  // și abia apoi se schimba. Arăta neîngrijit.
  //
  // Acum ordinea este:
  //   1. traducerea proaspătă de la DeepL
  //   2. traducerea salvată în baza de date (title_de, title_en, …)
  //   3. NIMIC — un loc gol, până vine traducerea
  // Româna nu se mai arată niciodată unui cititor care a ales altă limbă.
  const localized = (post: BlogPost, field: 'title' | 'excerpt'): string => {
    if (language === 'ro') return (post[field] as string) ?? '';

    const fresh = translatedPosts.get(post.id)?.[field];
    if (fresh) return fresh as string;

    const stored = (post as unknown as Record<string, unknown>)[`${field}_${language}`];
    if (typeof stored === 'string' && stored.trim()) return stored;

    return '';
  };

  const getTranslatedTitle = (post: BlogPost) => localized(post, 'title');

  const getTranslatedExcerpt = (post: BlogPost) => localized(post, 'excerpt');

  const getTranslatedTags = (post: BlogPost): string[] => {
    if (language !== 'ro' && !translatedPosts.get(post.id)) return [];
    const tags = language === 'ro' ? post.tags : (translatedPosts.get(post.id)?.tags || post.tags);
    if (!tags) return [];
    return Array.isArray(tags) ? tags : [tags];
  };

  // Load more posts / Weitere Posts laden / Încărcă mai multe postări
  const loadMorePosts = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage, false);
  };

  // Handle post like / Post-Like behandeln / Gestionează like-ul postării
  const handleLike = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to login if not authenticated / Zur Anmeldung weiterleiten, wenn nicht authentifiziert / Redirecționează la conectare dacă nu este autentificat
        window.location.href = '/auth/login';
        return;
      }

      // Check if already liked / Prüfen, ob bereits geliked / Verifică dacă deja a primit like
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Remove like / Like entfernen / Elimină like-ul
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        // Add like / Like hinzufügen / Adaugă like
        await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });
        
        setLikedPosts(prev => new Set(prev).add(postId));
      }

      // Update post likes count / Post-Likes-Anzahl aktualisieren / Actualizează numărul de like-uri al postării
      loadPosts(1, true);
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  // Share functionality / Teilen-Funktionalität / Funcționalitate de distribuire
  const sharePost = (post: BlogPost, platform: string) => {
    const url = `${window.location.origin}/blogs/${post.slug}`;
    // Use DeepL translated text for sharing / DeepL-übersetzten Text zum Teilen verwenden / Folosește textul tradus de DeepL pentru distribuire
    const title = getTranslatedTitle(post);
    const text = getTranslatedExcerpt(post);

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
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
    }
  };

  // Format date based on language / Datum je nach Sprache formatieren / Formatează data în funcție de limbă
  // Format date based on language / Datum je nach Sprache formatieren / Formatează data în funcție de limbă
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const localeMap = { de, en: enUS, ro, ru };
    const locale = localeMap[language as keyof typeof localeMap] || enUS;
    return formatDistanceToNow(date, { addSuffix: true, locale });
  };

  if (posts.length === 0 && loading) {
    // Show skeleton while loading / Skeleton während des Ladens anzeigen / Afișează skeleton în timpul încărcării
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {[...Array(3)].map((_, i) => (
          <BlogCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (posts.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        {/* 
          EXPLANATION: Replace t('blog.noBlogs') with user-friendly text with theme-aware colors
          Users should see "No blogs found" not "noBlogs"
        */}
        <p className="text-gray-700 dark:text-white/80 text-lg">
          {language === 'de' ? 'Keine Blogs gefunden' : 'No blogs found'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Message showing only last 6 blogs / Nachricht zeigt nur die letzten 6 Blogs / Mesaj arată doar ultimele 6 bloguri */}
      <div className="mb-4 lg:mb-8 text-center">
        <p className="text-gray-600 dark:text-white/60 text-sm lg:text-lg font-medium">
          {language === 'de' ? 'Angezeigt werden die letzten 6 Blogbeiträge' : 
           language === 'en' ? 'Showing the last 6 blog posts' : 
           language === 'ro' ? 'Sunt afișate ultimele 6 postări de blog' : 
           'Показаны последние 6 публикаций в блоге'}
        </p>
      </div>
      
      {/* 🌐 DeepL Translation indicator / DeepL Übersetzungsindikator / Indicator traducere DeepL */}
      {isTranslating && language !== 'ro' && (
        <div className="fixed top-4 right-4 bg-blue-500/90 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-pulse">
          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          <span className="text-sm font-medium">
            {language === 'de' ? 'Übersetze Blogs...' : 
             language === 'en' ? 'Translating blogs...' : 
             'Перевод блогов...'}
          </span>
        </div>
      )}

      {/* Pasul 1125: Mobile = single card with left/right arrows, Desktop = vertical stack */}
      <div className="relative">
        {/* Left arrow — mobile only (always rendered when activeSlide > 0) */}
        {isMobile && activeSlide > 0 && (
          <button
            onClick={() => {
              const carousel = carouselRef.current;
              if (!carousel) return;
              const cardWidth = carousel.offsetWidth;
              carousel.scrollTo({ left: (activeSlide - 1) * cardWidth, behavior: 'smooth' });
            }}
            className="btn-solid absolute left-2 top-1/2 -translate-y-1/2 z-40 bg-black/85 dark:bg-white/30 backdrop-blur-md text-white rounded-full w-10 h-10 flex items-center justify-center shadow-xl border border-white/40 dark:border-white/20 active:scale-90 transition-all"
            aria-label="Previous blog"
            style={{ pointerEvents: 'auto' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        )}
        {/* Right arrow — mobile only */}
        {isMobile && activeSlide < Math.min(posts.length, 6) - 1 && (
          <button
            onClick={() => {
              const carousel = carouselRef.current;
              if (!carousel) return;
              const cardWidth = carousel.offsetWidth;
              carousel.scrollTo({ left: (activeSlide + 1) * cardWidth, behavior: 'smooth' });
            }}
            className="btn-solid absolute right-2 top-1/2 -translate-y-1/2 z-40 bg-black/85 dark:bg-white/30 backdrop-blur-md text-white rounded-full w-10 h-10 flex items-center justify-center shadow-xl border border-white/40 dark:border-white/20 active:scale-90 transition-all"
            aria-label="Next blog"
            style={{ pointerEvents: 'auto' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}

        {/* Dot indicators moved below carousel */}

      <div 
        ref={carouselRef}
        className={isMobile 
          ? "flex overflow-x-auto snap-x snap-mandatory scrollbar-hide" 
          : "space-y-8"
        }
        style={isMobile ? { scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' } : {}}
      >
        {posts.slice(0, 6).map((post, index) => (
          <React.Fragment key={post.id}>
            <div className={isMobile ? "snap-center flex-shrink-0 w-full px-1" : ""}
              style={isMobile ? { maxHeight: 'calc(100vh - 160px)' } : {}}
            >
            <Link href={`/blogs/${post.slug}`}>
            <article 
              className={`backdrop-blur-[1.5px] rounded-xl p-3 lg:p-6 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/15 transition-all duration-300 lg:hover:scale-[1.02] animate-fadeIn cursor-pointer group border border-gray-300 dark:border-white/10 ${isMobile ? 'shadow-md overflow-y-auto' : ''}`}
              style={isMobile ? { maxHeight: 'calc(100vh - 170px)' } : { animationDelay: `${index * 0.1}s` }}
            >
              {/* Post header with theme-aware colors / Post-Kopf mit themenabhängigen Farben / Antet postare cu culori adaptate la temă */}
              <header className="mb-2">
                <h2 className="text-lg sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-200">
                  {getTranslatedTitle(post)}
                  {/* Pasul 2208002 (punctul 6) — INDICATOR pentru blogurile dinamice.
                      Un mic semn discret, langa titlu, care arata ca articolul
                      poate fi ASCULTAT („Play Blog"). Pentru articolele obisnuite
                      nu apare absolut nimic — cardul ramane exact ca inainte. */}
                  {post.is_dynamic && (
                    <span
                      title={
                        language === 'de' ? 'Dieser Artikel kann angehört werden' :
                        language === 'ro' ? 'Acest articol poate fi ascultat' :
                        language === 'ru' ? 'Эту статью можно послушать' :
                        'This article can be listened to'
                      }
                      aria-label={
                        language === 'de' ? 'Hörbarer Artikel' :
                        language === 'ro' ? 'Articol care poate fi ascultat' :
                        language === 'ru' ? 'Аудио-статья' :
                        'Listenable article'
                      }
                      className="ml-2 inline-flex translate-y-[-2px] items-center gap-1 rounded-full border border-gray-400/50 dark:border-white/25 px-2 py-[2px] align-middle text-[10px] font-medium tracking-wide text-gray-700 dark:text-white/75"
                    >
                      <svg width="9" height="9" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                        <path d="M3 1.5v11l9-5.5-9-5.5z" />
                      </svg>
                      PLAY
                    </span>
                  )}
                </h2>
              
              {/* Post metadata with theme-aware colors / Post-Metadaten mit themenabhängigen Farben / Metadate postare cu culori adaptate la temă */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-white/60">
                <time dateTime={post.created_at}>
                  {formatDate(post.created_at)}
                </time>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex gap-2">
                    {getTranslatedTags(post).slice(0, 3).map((tag, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-gray-300 dark:bg-white/10 text-gray-700 dark:text-white/80 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </header>

            {/* Post content / Post-Inhalt / Conținut postare */}
            <div className="mb-4">
              {/* Featured image / Hauptbild / Imagine principală */}
              {post.image_url && (
                <div className="mb-3 rounded-lg overflow-hidden">
                  <Image
                    src={post.image_url}
                    alt={getTranslatedTitle(post)}
                    width={800}
                    height={400}
                    /* Pasul 21082026 — performanta: nu mai descarcam 800px pe mobil */
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABBEFITEGEjJBUf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AlgBDtv/Z"
                    className="w-full h-28 sm:h-64 object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              {/* Post excerpt with theme-aware colors / Post-Auszug mit themenabhängigen Farben / Extras postare cu culori adaptate la temă */}
              <p className="text-gray-700 dark:text-white/80 leading-relaxed text-sm lg:text-lg line-clamp-2 lg:line-clamp-none">
                {getTranslatedExcerpt(post)}
              </p>
            </div>

            {/* Responsive footer — auto-stretch, monochrome, uniform spacing, never overflow */}
            <footer className="flex flex-col items-stretch gap-2 pt-3 border-t border-gray-300 dark:border-white/20 overflow-hidden">
              {/* Like & Comments — equal spacing from card edges */}
              <div className="flex items-center justify-between w-full">
                {/* Like button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLike(post.id);
                  }}
                  className={`flex items-center gap-2 transition-colors duration-200 ${
                    likedPosts.has(post.id) 
                      ? 'text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300' 
                      : 'text-gray-600 dark:text-white/60 hover:text-red-500 dark:hover:text-red-400'
                  }`}
                >
                  <FaRegHeart className={likedPosts.has(post.id) ? 'fill-current' : ''} />
                  <span>{post.likes_count || 0}</span>
                </button>
                
                {/* Comments button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `/blogs/${post.slug}#comments`;
                  }}
                  className="flex items-center gap-2 text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                >
                  <TfiComment />
                  <span>{post.comments_count || 0}</span>
                </button>
              </div>

              {/* Pasul 2102001: Share buttons — all in one row, flex-wrap for long labels (Russian) */}
              <div className="flex items-center gap-1.5 w-full overflow-x-auto">
                <span className="text-gray-700 dark:text-white/70 flex-shrink-0 font-bold text-sm">
                  {language === 'de' ? 'Teilen:' : 
                   language === 'en' ? 'Share:' : 
                   language === 'ro' ? 'Distribuie:' : 
                   'Отправить:'}
                </span>
                <div className="flex items-center gap-2.5 flex-shrink-0 share-buttons-row">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sharePost(post, 'whatsapp');
                  }}
                  className="text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  title="WhatsApp"
                >
                  <FaWhatsapp className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sharePost(post, 'telegram');
                  }}
                  className="text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  title="Telegram"
                >
                  <FaTelegram className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sharePost(post, 'email');
                  }}
                  className="text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  title="Email"
                >
                  <FaEnvelope className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sharePost(post, 'twitter');
                  }}
                  className="text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  title="Twitter"
                >
                  <FaTwitter className="w-[18px] h-[18px]" />
                </button>
                </div>
              </div>

              {/* Read more indicator */}
              <div className="text-right">
                <span className="text-base sm:text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors duration-200">
                  {language === 'de' ? 'Weiterlesen' : 
                   language === 'en' ? 'Read More' : 
                   language === 'ro' ? 'Citește Mai Mult' : 
                   'Читать далее'} →
                </span>
              </div>
            </footer>
          </article>
        </Link>
        {/* Separator — only on desktop / Separator — nur auf Desktop / Separator — doar pe desktop */}
        {!isMobile && index < Math.min(posts.length, 6) - 1 && (
          <div className="border-b-2 border-gray-300 dark:border-white/20 my-2" />
        )}
        </div>
        </React.Fragment>
        ))}
      </div>

      </div>

      {/* Load more button / Mehr laden-Button / Buton încarcă mai mult */}
      {showOlderButton && hasMore && (
        <div className="text-center mt-12">
          <button
            onClick={loadMorePosts}
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4 border-2" />
                <span>
                  {language === 'de' ? 'Laden...' : 
                   language === 'en' ? 'Loading...' : 
                   language === 'ro' ? 'Se încarcă...' : 
                   'Загрузка...'}
                </span>
              </div>
            ) : (
              language === 'de' ? 'Ältere Blogs laden' : 
              language === 'en' ? 'Load Older Blogs' : 
              language === 'ro' ? 'Încarcă Bloguri Mai Vechi' : 
              'Загрузить старые блоги'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
