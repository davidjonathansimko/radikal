// Admin dashboard for managing blog posts / Admin-Dashboard zur Verwaltung von Blog-Posts
// This provides CRUD operations for blog posts - only accessible by admin
// Dies bietet CRUD-Operationen für Blog-Posts - nur für Admin zugänglich

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { createClient } from '@/lib/supabase';
import { isAdminUser } from '@/lib/isAdmin';
import { BlogPost } from '@/types';
import { autoTranslateBlogPost } from '@/utils/translation';
import ImageUpload from '@/components/ImageUpload';
import ReelsAdmin from '@/components/admin/ReelsAdmin';
import StoryContentAdmin from '@/components/admin/StoryContentAdmin';
import MaintenanceAdmin from '@/components/admin/MaintenanceAdmin';
import IntroTextAdmin from '@/components/admin/IntroTextAdmin';
import PageContentAdmin from '@/components/admin/PageContentAdmin';
import AdminUsersPanel from '@/components/admin/AdminUsersPanel';
import AdminRequestsPanel from '@/components/admin/AdminRequestsPanel';
import { countPendingRequests } from '@/lib/adminRoles';
import BibleRefPicker from '@/components/admin/BibleRefPicker';
// Pasul 2208001 — efecte de imagine (sepia / vignette / noise / grain)
import ImageEffectsEditor from '@/components/admin/ImageEffectsEditor';
import NewsAdmin from '@/components/admin/NewsAdmin';
import CategoriesAdmin from '@/components/admin/CategoriesAdmin';
import CategoryPicker from '@/components/CategoryPicker';
import { fetchCategories, matchesSelectedCategories, type Category } from '@/lib/categories';
// Pasul 2208002 — punctul 3 (audio pregenerat) si punctul 10 (previzualizare)
import BlogAudioGenerator from '@/components/admin/BlogAudioGenerator';
import CustomAudioManager from '@/components/admin/CustomAudioManager';
import BlogPreviewModal from '@/components/admin/BlogPreviewModal';
import ImageEffectLayers, { DEFAULT_IMAGE_EFFECTS, effectsFilter, type ImageEffectSettings } from '@/components/ImageEffectLayers';
import AdminListFilterBar from '@/components/admin/AdminListFilterBar';
// Pasul A08 — pictograme SVG monocrome (fara emoji colorate)
import {
  IconDocument,
  IconFilm,
  IconWrench,
  IconWindow,
  IconUsers,
  IconBell,
  IconPlus,
  IconChart,
  IconMegaphone,
  IconTag,
  // Pasul 2308006-B — pictograme monocrome pentru butoanele din lista
  IconEye,
  IconPencil,
  IconSend,
  IconTrash,
  IconSpinner,
} from '@/components/admin/AdminIcons';
// Pasul 2308006-D — limba panoului, salvata per utilizator
import { useAdminLang } from '@/hooks/useAdminLang';
import AdminLangSwitcher from '@/components/admin/AdminLangSwitcher';
import { useAdminListFilter } from '@/components/admin/useAdminListFilter';
import { 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaSave, 
  FaTimes,
  FaCheck,
  FaImage,
  FaLanguage,
  FaSpinner,
  FaBell,
  FaEnvelope
} from 'react-icons/fa';
import Link from 'next/link';

export default function AdminPage() {
  // Get language context and router / Sprachkontext und Router abrufen
  const { t, language } = useLanguage();
  const router = useRouter();
  
  // Component state with performance optimizations / Komponentenstatus mit Performance-Optimierungen
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  // Pasul 2308004 (C) — rubricile din admin
  const [mainTab, setMainTab] = useState<'create' | 'settings'>('create');
  const [subTab, setSubTab] = useState<string>('blogs');
  // Pasul 2308005 (D) — cate cereri asteapta aprobarea (bulina rosie)
  const [pendingCount, setPendingCount] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [creating, setCreating] = useState(false);
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [newsletterResult, setNewsletterResult] = useState<{sent: number; failed: number; total: number} | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    image_url: '',
    tags: '',
    published: false,
    // Modal intro fields
    show_intro_modal: false,
    modal_title: '',
    modal_question: '',
    // Pasul 2308010 — traducerea scrisa de mana, pe limbi (gol = DeepL)
    modal_title_de: '',
    modal_question_de: '',
    modal_title_en: '',
    modal_question_en: '',
    modal_title_ro: '',
    modal_question_ro: '',
    modal_title_ru: '',
    modal_question_ru: '',
  });

  // Pasul 2108002 — fragmente marcate manual ca referinte biblice
  const [bibleRefs, setBibleRefs] = useState<string[]>([]);

  // ------------------------------------------------------------------
  // Pasul 2208001 — efecte de imagine + blog STATIC / DINAMIC
  // ------------------------------------------------------------------
  /** true = blog DINAMIC (are butonul „Play Blog"); false = static, ca până acum */
  const [isDynamic, setIsDynamic] = useState(false);
  /** Efectele IMAGINII articolului */
  const [postEffects, setPostEffects] = useState<ImageEffectSettings>(DEFAULT_IMAGE_EFFECTS);
  /** Efectele MODALULUI „Play Blog" — complet separate */
  const [modalEffects, setModalEffects] = useState<ImageEffectSettings>(DEFAULT_IMAGE_EFFECTS);
  const [modalBgOpacity, setModalBgOpacity] = useState(35);

  // ------------------------------------------------------------------
  // Pasul A15 — opacitate + umbra, reglabile la FIECARE blog in parte
  // (imaginea articolului si imaginea de fundal). Valorile merg in
  // coloanele adaugate de `STEP_A15_IMAGE_OPACITY.sql`.
  // ------------------------------------------------------------------
  const [postImageOpacity, setPostImageOpacity] = useState(100);
  const [postImageShadow, setPostImageShadow] = useState(30);
  const [backgroundOpacity, setBackgroundOpacity] = useState(100);
  const [backgroundShadow, setBackgroundShadow] = useState(0);
  const [modalBgShadow, setModalBgShadow] = useState(0);

  // Pasul 2508000 — aceleasi doua reglaje, dar pentru TEMA LUMINOASA.
  // `null` = „foloseste valorile de la tema intunecata" (comportamentul de pana acum).
  const [modalBgOpacityLight, setModalBgOpacityLight] = useState<number | null>(null);
  const [modalBgShadowLight, setModalBgShadowLight] = useState<number | null>(null);
  /** Ce tema previzualizezi acum in panoul „Play Blog" */
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');

  // ------------------------------------------------------------------
  // Pasul A17 — CATEGORII
  // `allCategories` = lista din baza de date (se incarca o singura data).
  // `postCategoryIds` = ce categorii are blogul pe care il editezi acum.
  // `filterCategoryIds` = ce categorii sunt bifate in FILTRUL listei.
  // ------------------------------------------------------------------
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [postCategoryIds, setPostCategoryIds] = useState<string[]>([]);
  const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>([]);

  /**
   * Pasul A18 — in ce limbi ai incarcat inregistrarea ta pentru blogul
   * pe care il editezi. Generatorul TTS le sare, iar cand incarci sau
   * stergi ceva, lista se actualizeaza singura.
   */
  const [customAudioLangs, setCustomAudioLangs] = useState<string[]>([]);

  // Pasul 2308006-D — limba panoului de administrare (salvata per cont)
  const { lang: adminLang, setLang: setAdminLang, t: adminT } = useAdminLang();

  /**
   * Pasul 2308006-F — „acest articol este pentru pagina News".
   * Bifat + publicat = apare la News. Ciorna = nu il vede nimeni.
   */
  const [isNews, setIsNews] = useState(false);

  useEffect(() => {
    void fetchCategories().then(setAllCategories);
  }, []);

  /** Pasul 2208002 (punctul 10) — fereastra de previzualizare a articolului */
  const [showPreview, setShowPreview] = useState(false);

  /**
   * Pasul 2308010 — traducerile scrise de mana pentru modalul de intro.
   * Camp gol -> trimitem `null`, adica „foloseste DeepL, ca pana acum".
   */
  const modalLangColumns = () => ({
    modal_title_de: formData.modal_title_de.trim() || null,
    modal_question_de: formData.modal_question_de.trim() || null,
    modal_title_en: formData.modal_title_en.trim() || null,
    modal_question_en: formData.modal_question_en.trim() || null,
    modal_title_ro: formData.modal_title_ro.trim() || null,
    modal_question_ro: formData.modal_question_ro.trim() || null,
    modal_title_ru: formData.modal_title_ru.trim() || null,
    modal_question_ru: formData.modal_question_ru.trim() || null,
  });

  /** Coloanele de efecte, gata de trimis la Supabase */
  const effectColumns = () => ({
    effect_noise: postEffects.effectNoise,
    effect_grain: postEffects.effectGrain,
    effect_sepia: postEffects.effectSepia,
    effect_vignette: postEffects.effectVignette,
    sepia_intensity: postEffects.sepiaIntensity,
    vignette_intensity: postEffects.vignetteIntensity,
    grain_opacity: postEffects.grainOpacity,
    is_dynamic: isDynamic,
    modal_background_opacity: modalBgOpacity,
    modal_effect_noise: modalEffects.effectNoise,
    modal_effect_grain: modalEffects.effectGrain,
    modal_effect_sepia: modalEffects.effectSepia,
    modal_effect_vignette: modalEffects.effectVignette,
    modal_sepia_intensity: modalEffects.sepiaIntensity,
    modal_vignette_intensity: modalEffects.vignetteIntensity,
    modal_grain_opacity: modalEffects.grainOpacity,
    // Pasul 2308005 (E) — efecte noi
    effect_bw: Boolean(postEffects.effectBw),
    effect_bloom: Boolean(postEffects.effectBloom),
    effect_letterbox: Boolean(postEffects.effectLetterbox),
    effect_light_leak: Boolean(postEffects.effectLightLeak),
    modal_effect_bw: Boolean(modalEffects.effectBw),
    modal_effect_bloom: Boolean(modalEffects.effectBloom),
    modal_effect_letterbox: Boolean(modalEffects.effectLetterbox),
    modal_effect_light_leak: Boolean(modalEffects.effectLightLeak),
    // Pasul 2308006-E — cat de tare se vede fiecare efect
    noise_intensity: postEffects.noiseIntensity ?? 35,
    bw_intensity: postEffects.bwIntensity ?? 50,
    bloom_intensity: postEffects.bloomIntensity ?? 50,
    letterbox_size: postEffects.letterboxSize ?? 8,
    light_leak_intensity: postEffects.lightLeakIntensity ?? 50,
    modal_noise_intensity: modalEffects.noiseIntensity ?? 35,
    modal_bw_intensity: modalEffects.bwIntensity ?? 50,
    modal_bloom_intensity: modalEffects.bloomIntensity ?? 50,
    modal_letterbox_size: modalEffects.letterboxSize ?? 8,
    modal_light_leak_intensity: modalEffects.lightLeakIntensity ?? 50,
    // Pasul A15 — opacitate / umbra per blog
    post_image_opacity: postImageOpacity,
    post_image_shadow: postImageShadow,
    background_opacity: backgroundOpacity,
    background_shadow: backgroundShadow,
    modal_background_shadow: modalBgShadow,
    // Pasul 2508000 — reglaje separate pentru tema luminoasa
    modal_background_opacity_light: modalBgOpacityLight,
    modal_background_shadow_light: modalBgShadowLight,
    // Pasul A17 — in ce categorii intra acest blog
    category_ids: postCategoryIds,
    // Pasul 2308006-F — articol pentru pagina News
    is_news: isNews,
    news_pinned_at: isNews ? new Date().toISOString() : null,
  });

  // Pasul 2108002 — cautare + filtru an/luna pentru articole (separat de reels)
  //
  // Pasul A17 — INAINTE de cautare si de filtrul pe an, taiem lista dupa
  // categoriile bifate. Asa „2026 → august" se aplica deja doar peste
  // categoria aleasa, exact ca in imaginea trimisa.
  const postsByCategory = useMemo(
    () => posts.filter((p) => matchesSelectedCategories(p.category_ids, filterCategoryIds)),
    [posts, filterCategoryIds],
  );

  const postsFilter = useAdminListFilter<BlogPost>(
    postsByCategory,
    useCallback((p: BlogPost) => `${p.title} ${p.excerpt ?? ''} ${p.slug ?? ''}`, []),
  );

  // Supabase client / Supabase-Client
  const supabase = createClient();

  // Check admin access and load posts / Admin-Zugriff prüfen und Posts laden
  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Check admin access with faster loading / Admin-Zugriff mit schnellerem Laden prüfen
  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);
      
      // Check if user is admin / Prüfen, ob Benutzer Admin ist
      // Real protection is enforced by RLS in Supabase - this only hides the UI.
      if (isAdminUser(user)) {
        setIsAdmin(true);
        // Pasul 2308005 (D): cate cereri asteapta aprobarea?
        // Daca tabelul nu exista inca (SQL nerulat), functia intoarce 0
        // si nu se strica nimic — bulina pur si simplu nu apare.
        countPendingRequests().then(setPendingCount);
        // Load posts after admin verification with slight delay to prevent race condition
        setTimeout(() => loadPosts(), 100);
      } else {
        router.push('/'); // Redirect non-admin users / Nicht-Admin-Benutzer weiterleiten
        return;
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/auth/login');
    } finally {
      setInitialLoading(false);
    }
  };

  // Load blog posts with optimized query / Blog-Posts mit optimierter Abfrage laden
  const loadPosts = async () => {
    setLoading(true);
    try {
      // Select all required fields for BlogPost type
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20); // Limit initial load for faster performance

      if (error) {
        console.error('Error loading posts:', error);
        return;
      }

      setPosts(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Handle form input changes / Formular-Eingabe-Änderungen behandeln
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Generate slug from title / Slug aus Titel generieren
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  // Create new blog post / Neuen Blog-Post erstellen
  const createPost = async () => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.excerpt.trim()) {
      alert('Titel, Auszug und Inhalt sind erforderlich!');
      return;
    }

    setCreating(true);
    try {
      // Auto-translate content to English
      const translations = await autoTranslateBlogPost({
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt
      });

      const slug = generateSlug(formData.title);
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];

      // Optimized database insert
      const postData = {
        title: formData.title,
        title_en: translations.title_en,
        content: formData.content,
        content_en: translations.content_en,
        excerpt: formData.excerpt,
        excerpt_en: translations.excerpt_en,
        image_url: formData.image_url || null,
        slug: slug,
        tags: tagsArray,
        published: formData.published,
        author_id: user.id,
        likes_count: 0,
        comments_count: 0,
        // Modal intro fields
        show_intro_modal: formData.show_intro_modal,
        modal_title: formData.modal_title || null,
        modal_question: formData.modal_question || null,
        ...modalLangColumns(),
        // Pasul 2108002: fragmente marcate manual ca referinte biblice (apar cu rosu)
        bible_refs: bibleRefs,
        // Pasul 2208001: efecte de imagine + blog static/dinamic
        ...effectColumns()
      };

      const { error } = await supabase
        .from('blog_posts')
        .insert([postData]);

      if (error) {
        console.error('Error creating post:', error);
        alert('Fehler beim Erstellen des Posts: ' + error.message);
        return;
      }

      // Reset form and reload posts / Formular zurücksetzen und Posts neu laden
      resetForm();
      setShowCreateForm(false);
      
      // Optimized reload - only fetch new posts
      await loadPosts();
      alert('Post erfolgreich erstellt!');
    } catch (error) {
      console.error('Error:', error);
      alert('Ein Fehler ist aufgetreten!');
    } finally {
      setCreating(false);
    }
  };

  // Edit existing post / Bestehenden Post bearbeiten
  const updatePost = async () => {
    if (!editingPost || !formData.title.trim() || !formData.content.trim() || !formData.excerpt.trim()) {
      alert('Titel, Auszug und Inhalt sind erforderlich!');
      return;
    }

    setLoading(true);
    try {
      // Auto-translate content to English
      const translations = await autoTranslateBlogPost({
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt
      });

      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];

      const { error } = await supabase
        .from('blog_posts')
        .update({
          title: formData.title,
          title_en: translations.title_en,
          content: formData.content,
          content_en: translations.content_en,
          excerpt: formData.excerpt,
          excerpt_en: translations.excerpt_en,
          image_url: formData.image_url || null,
          tags: tagsArray,
          published: formData.published,
          updated_at: new Date().toISOString(),
          // Modal intro fields
          show_intro_modal: formData.show_intro_modal,
          modal_title: formData.modal_title || null,
          modal_question: formData.modal_question || null,
          ...modalLangColumns(),
          // Pasul 2108002: referinte biblice marcate manual
          bible_refs: bibleRefs,
          // Pasul 2208001: efecte de imagine + blog static/dinamic
          ...effectColumns()
        })
        .eq('id', editingPost.id);

      if (error) {
        console.error('Error updating post:', error);
        alert('Fehler beim Aktualisieren des Posts: ' + error.message);
        return;
      }

      // Reset form and reload posts / Formular zurücksetzen und Posts neu laden
      resetForm();
      setEditingPost(null);
      await loadPosts();
      alert('Post erfolgreich aktualisiert!');
    } catch (error) {
      console.error('Error:', error);
      alert('Ein Fehler ist aufgetreten!');
    } finally {
      setLoading(false);
    }
  };

  // Delete post / Post löschen
  const deletePost = async (postId: string) => {
    if (!confirm('Bist du sicher, dass du diesen Post löschen möchtest?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Error deleting post:', error);
        alert('Fehler beim Löschen des Posts!');
        return;
      }

      loadPosts();
      alert('Post erfolgreich gelöscht!');
    } catch (error) {
      console.error('Error:', error);
      alert('Ein Fehler ist aufgetreten!');
    }
  };

  // Start editing post / Post-Bearbeitung starten
  const startEditing = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      image_url: post.image_url || '',
      tags: post.tags ? (Array.isArray(post.tags) ? post.tags.join(', ') : post.tags) : '',
      published: post.published,
      // Modal fields
      show_intro_modal: post.show_intro_modal || false,
      modal_title: post.modal_title || '',
      modal_question: post.modal_question || '',
      modal_title_de: post.modal_title_de || '',
      modal_question_de: post.modal_question_de || '',
      modal_title_en: post.modal_title_en || '',
      modal_question_en: post.modal_question_en || '',
      modal_title_ro: post.modal_title_ro || '',
      modal_question_ro: post.modal_question_ro || '',
      modal_title_ru: post.modal_title_ru || '',
      modal_question_ru: post.modal_question_ru || '',
    });
    // Pasul 2108002: incarcam si referintele marcate manual
    setBibleRefs(Array.isArray(post.bible_refs) ? post.bible_refs : []);
    // Pasul 2208001: efectele si tipul (static/dinamic)
    setIsDynamic(Boolean(post.is_dynamic));
    setPostEffects({
      effectNoise: Boolean(post.effect_noise),
      effectGrain: Boolean(post.effect_grain),
      effectSepia: Boolean(post.effect_sepia),
      effectVignette: Boolean(post.effect_vignette),
      sepiaIntensity: post.sepia_intensity ?? DEFAULT_IMAGE_EFFECTS.sepiaIntensity,
      vignetteIntensity: post.vignette_intensity ?? DEFAULT_IMAGE_EFFECTS.vignetteIntensity,
      grainOpacity: post.grain_opacity ?? DEFAULT_IMAGE_EFFECTS.grainOpacity,
      // Pasul 2308005 (E)
      effectBw: Boolean(post.effect_bw),
      effectBloom: Boolean(post.effect_bloom),
      effectLetterbox: Boolean(post.effect_letterbox),
      effectLightLeak: Boolean(post.effect_light_leak),
      // Pasul 2308006-E — intensitatile (implicite daca SQL-ul nu e rulat)
      noiseIntensity: post.noise_intensity ?? 35,
      bwIntensity: post.bw_intensity ?? 50,
      bloomIntensity: post.bloom_intensity ?? 50,
      letterboxSize: post.letterbox_size ?? 8,
      lightLeakIntensity: post.light_leak_intensity ?? 50,
    });
    setModalEffects({
      effectNoise: Boolean(post.modal_effect_noise),
      effectGrain: Boolean(post.modal_effect_grain),
      effectSepia: Boolean(post.modal_effect_sepia),
      effectVignette: Boolean(post.modal_effect_vignette),
      sepiaIntensity: post.modal_sepia_intensity ?? DEFAULT_IMAGE_EFFECTS.sepiaIntensity,
      vignetteIntensity: post.modal_vignette_intensity ?? DEFAULT_IMAGE_EFFECTS.vignetteIntensity,
      grainOpacity: post.modal_grain_opacity ?? DEFAULT_IMAGE_EFFECTS.grainOpacity,
      // Pasul 2308005 (E)
      effectBw: Boolean(post.modal_effect_bw),
      effectBloom: Boolean(post.modal_effect_bloom),
      effectLetterbox: Boolean(post.modal_effect_letterbox),
      effectLightLeak: Boolean(post.modal_effect_light_leak),
      // Pasul 2308006-E — intensitatile pentru „Play Blog"
      noiseIntensity: post.modal_noise_intensity ?? 35,
      bwIntensity: post.modal_bw_intensity ?? 50,
      bloomIntensity: post.modal_bloom_intensity ?? 50,
      letterboxSize: post.modal_letterbox_size ?? 8,
      lightLeakIntensity: post.modal_light_leak_intensity ?? 50,
    });
    setModalBgOpacity(post.modal_background_opacity ?? 35);
    // Pasul A15 — daca SQL-ul nu a fost inca rulat, coloanele lipsesc si
    // folosim valorile implicite; nimic nu se strica.
    setPostImageOpacity(post.post_image_opacity ?? 100);
    setPostImageShadow(post.post_image_shadow ?? 30);
    setBackgroundOpacity(post.background_opacity ?? 100);
    setBackgroundShadow(post.background_shadow ?? 0);
    setModalBgShadow(post.modal_background_shadow ?? 0);
    setModalBgOpacityLight(
      typeof post.modal_background_opacity_light === 'number' ? post.modal_background_opacity_light : null,
    );
    setModalBgShadowLight(
      typeof post.modal_background_shadow_light === 'number' ? post.modal_background_shadow_light : null,
    );
    // Pasul 2308006-F
    setIsNews(Boolean(post.is_news));
    // Pasul A17
    setPostCategoryIds(Array.isArray(post.category_ids) ? post.category_ids : []);
    setShowCreateForm(false);
  };

  // Reset form / Formular zurücksetzen
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      image_url: '',
      tags: '',
      published: false,
      // Reset modal fields
      show_intro_modal: false,
      modal_title: '',
      modal_question: '',
      modal_title_de: '',
      modal_question_de: '',
      modal_title_en: '',
      modal_question_en: '',
      modal_title_ro: '',
      modal_question_ro: '',
      modal_title_ru: '',
      modal_question_ru: '',
    });
    setBibleRefs([]);
    // Pasul 2208001
    setIsDynamic(false);
    setPostEffects(DEFAULT_IMAGE_EFFECTS);
    setModalEffects(DEFAULT_IMAGE_EFFECTS);
    setModalBgOpacity(35);
    // Pasul A15
    setPostImageOpacity(100);
    setPostImageShadow(30);
    setBackgroundOpacity(100);
    setBackgroundShadow(0);
    setModalBgShadow(0);
    // Pasul 2508000
    setModalBgOpacityLight(null);
    setModalBgShadowLight(null);
    // Pasul A17
    setPostCategoryIds([]);
    // Pasul A18
    setCustomAudioLangs([]);
    // Pasul 2308006-F
    setIsNews(false);
  };

  // Send newsletter notification for a specific post / Newsletter-Benachrichtigung für einen bestimmten Post senden
  const sendNewsletterNotification = async (post: BlogPost) => {
    if (!confirm(`Newsletter an alle Abonnenten senden für:\n"${post.title}"?\n\nDies sendet eine E-Mail an ALLE aktiven Abonnenten!`)) {
      return;
    }

    setSendingNewsletter(true);
    setNewsletterResult(null);

    try {
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_NEWSLETTER_API_KEY || 'radikal-newsletter-2024-secret'}`
        },
        body: JSON.stringify({
          postTitle: post.title,
          postTitleEn: post.title_en || post.title,
          postSlug: post.slug,
          postExcerpt: post.excerpt,
          postExcerptEn: post.excerpt_en || post.excerpt
        })
      });

      const result = await response.json();

      if (response.ok) {
        setNewsletterResult({
          sent: result.sent || 0,
          failed: result.failed || 0,
          total: result.total || 0
        });
        alert(`✅ Newsletter erfolgreich gesendet!\n\nGesendet: ${result.sent}\nFehlgeschlagen: ${result.failed}\nGesamt Abonnenten: ${result.total}`);
      } else {
        alert(`❌ Fehler beim Senden: ${result.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      console.error('Newsletter send error:', error);
      alert('❌ Fehler beim Senden des Newsletters. Bitte prüfe die Konsole.');
    } finally {
      setSendingNewsletter(false);
    }
  };

  // Cancel editing / Bearbeitung abbrechen
  const cancelEditing = () => {
    setEditingPost(null);
    setShowCreateForm(false);
    resetForm();
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-white/60">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Zugriff verweigert</h1>
          <p className="text-white/80 mb-6">Du hast keine Berechtigung, diese Seite zu besuchen.</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Zur Startseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin header / Admin-Kopfbereich */}
        <header className="mb-12">
          {/* Pasul 2308006-D — alegerea limbii panoului, sus in dreapta.
              Se salveaza pentru contul tau, deci alt admin poate avea alta
              limba fara sa va incurcati. */}
          <div className="mb-4 flex items-center justify-end">
            <AdminLangSwitcher
              lang={adminLang}
              onChange={setAdminLang}
              label={adminT('lang.label')}
            />
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 animate-fadeIn">
            Admin Dashboard
          </h1>
          <p className="text-white/80 mb-6 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Verwalte deine Blog-Posts und Inhalte
          </p>
          
          {/* Action buttons / Aktions-Buttons
              Pasul A09 — „Neuen Post erstellen" apare DOAR la Blogs.
              Inainte statea mereu sus, chiar si cand erai la Reels sau la
              Setari, desi nu are nicio legatura cu ele. Acum butonul de
              creare urmeaza rubrica in care te afli:
                Creare → Blogs : „Neuen Post erstellen"
                Creare → Reels : butonul de creare este in panoul de reels
                Setari         : niciun buton de creare */}
          <div className="flex flex-wrap gap-4 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            {mainTab === 'create' && subTab === 'blogs' && (
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setEditingPost(null);
                  resetForm();
                }}
                className="btn-primary flex items-center gap-2"
              >
                <IconPlus className="h-4 w-4" />
                <span>Neuen Post erstellen</span>
              </button>
            )}

            {/* Analytics Dashboard Link / Analytics-Dashboard-Link
                Pasul A09 — fara degradeul albastru-mov. Stil RADIKAL:
                contur discret, alb pe negru. */}
            <Link
              href="/admin/analytics"
              className="flex items-center gap-2 rounded-lg border border-black/25 px-6 py-3 text-black/80 transition-colors duration-300 hover:border-black/50 hover:bg-black/5 hover:text-black dark:border-white/20 dark:text-white/80 dark:hover:border-white/40 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <IconChart className="h-4 w-4" />
              <span>Analytics Dashboard</span>
            </Link>
          </div>
        </header>

        {/* Create/Edit form / Erstellen/Bearbeiten-Formular */}
        {(showCreateForm || editingPost) && (
          <div className="glass-effect rounded-2xl p-8 mb-12 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingPost ? 'Post bearbeiten' : 'Neuen Post erstellen'}
              </h2>
              <button
                onClick={cancelEditing}
                className="text-white/60 hover:text-white transition-colors duration-200"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <form className="space-y-6">
              {/* Title input / Titel-Eingabe */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Titel *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Titel des Blog-Posts"
                />
              </div>

              {/* Info about automatic translation */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center gap-3">
                <FaLanguage className="text-blue-400 text-xl flex-shrink-0" />
                <p className="text-blue-300 text-sm">
                  Die Übersetzung in andere Sprachen erfolgt automatisch beim Speichern.
                </p>
              </div>

              {/* Excerpt input / Auszug-Eingabe */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Auszug *
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Kurze Beschreibung des Posts"
                />
              </div>

              {/* Content input / Inhalt-Eingabe */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Inhalt *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={12}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Vollständiger Inhalt des Blog-Posts"
                />
              </div>

              {/* Pasul 2108002: marcarea manuală a referințelor biblice */}
              <BibleRefPicker
                content={formData.content}
                value={bibleRefs}
                onChange={setBibleRefs}
              />

              {/* Pasul A17 — in ce categorii intra acest blog.
                  Poti bifa mai multe deodata (familie + căsnicie). */}
              <div className="rounded-lg border border-white/15 bg-white/5 p-4 [&_*]:text-white">
                <label className="mb-1 block text-sm font-medium text-white/80">
                  Categorii
                </label>
                <p className="mb-3 text-xs text-white/50">
                  Ajută cititorii să găsească articolul. Poți alege mai multe.
                </p>
                <CategoryPicker
                  categories={allCategories}
                  value={postCategoryIds}
                  onChange={setPostCategoryIds}
                  lang="ro"
                  placeholder="Caută o categorie…"
                />
              </div>

              {/* Image upload component / Bild-Upload-Komponente */}
              <div>
                <ImageUpload
                  onImageUploaded={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                  currentImageUrl={formData.image_url}
                />
              </div>

              {/* Tags input / Tags-Eingabe */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Tags (kommagetrennt)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              {/* Intro Modal Section */}
              <div className="border-t border-white/20 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>🎬</span> Intro Modal (optional)
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  Ein Modal mit Typewriter-Effekt, das erscheint bevor der Blog angezeigt wird.
                </p>

                {/* Enable intro modal checkbox */}
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="show_intro_modal"
                    name="show_intro_modal"
                    checked={formData.show_intro_modal}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <label htmlFor="show_intro_modal" className="text-white/80">
                    Intro Modal aktivieren
                  </label>
                </div>

                {/* Modal fields (only show if modal is enabled) */}
                {formData.show_intro_modal && (
                  <div className="space-y-4 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    {/* Modal Title */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Modal Titel (z.B. &quot;Dorești adevărul?&quot;)
                      </label>
                      <input
                        type="text"
                        name="modal_title"
                        value={formData.modal_title}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Dorești adevărul? / Suchst du die Wahrheit?"
                      />
                    </div>

                    {/* Modal Question */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Modal Frage/Text (wird mit Typewriter-Effekt angezeigt)
                      </label>
                      <textarea
                        name="modal_question"
                        value={formData.modal_question}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        placeholder="Cuvântul acesta nu este pentru toți, ci doar pentru aceia care sunt gata să accepte adevărul și voia lui Dumnezeu. Și tu?"
                      />
                    </div>

                    <p className="text-purple-300/70 text-xs">
                      💡 Die Übersetzung in andere Sprachen erfolgt automatisch.
                    </p>

                    {/* --------------------------------------------------------
                        Pasul 2308010 — SCRIE TU TEXTUL, PE FIECARE LIMBĂ.
                        Gol = traduce DeepL (ca până acum).
                        Scris = se folosește EXACT ce ai scris tu.
                        -------------------------------------------------------- */}
                    <details className="rounded-lg border border-purple-500/30 bg-black/20 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-purple-200">
                        Eigene Übersetzung schreiben (optional)
                      </summary>
                      <p className="mt-2 text-xs text-purple-300/70">
                        Leer lassen = DeepL übersetzt automatisch. Ausgefüllt = genau dein Text
                        wird angezeigt. Nützlich, wenn die Maschine den Sinn verfehlt
                        („Nu te lăsa… distras&ldquo; → „Lass dich nicht… ablenken&ldquo;).
                      </p>

                      <div className="mt-3 grid gap-4">
                        {([
                          ['de', 'Deutsch'],
                          ['en', 'English'],
                          ['ro', 'Română'],
                          ['ru', 'Русский'],
                        ] as const).map(([code, name]) => (
                          <div key={code} className="grid gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                              {name}
                            </p>
                            <input
                              type="text"
                              name={`modal_title_${code}`}
                              value={formData[`modal_title_${code}` as keyof typeof formData] as string}
                              onChange={handleInputChange}
                              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="Titel — leer = automatisch"
                            />
                            <textarea
                              name={`modal_question_${code}`}
                              value={formData[`modal_question_${code}` as keyof typeof formData] as string}
                              onChange={handleInputChange}
                              rows={2}
                              className="w-full resize-none rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="Frage/Text — leer = automatisch"
                            />
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>

              {/* ===== Pasul 2208001 — STATIC sau DINAMIC + efecte de imagine ===== */}
              <div className="border-t border-white/20 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>🎞️</span> Blog-Typ &amp; Bildeffekte
                </h3>

                <div className="grid sm:grid-cols-2 gap-3 mb-5">
                  <button
                    type="button"
                    onClick={() => setIsDynamic(false)}
                    className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                      !isDynamic
                        ? 'border-blue-400 bg-blue-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span className="block font-semibold">Statisch</span>
                    <span className="block text-xs opacity-70">Genau wie bisher.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDynamic(true)}
                    className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                      isDynamic
                        ? 'border-purple-400 bg-purple-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span className="block font-semibold">Dynamisch</span>
                    <span className="block text-xs opacity-70">
                      Zusätzlich der „Play Blog&ldquo;-Button auf dem Bild.
                    </span>
                  </button>
                </div>

                {/* Efectele IMAGINII articolului */}
                <div className="[&_*]:text-white">
                  <ImageEffectsEditor
                    title="Effekte für das Beitragsbild"
                    hint="Noise und Grain sind getrennt — du kannst eines oder beide wählen."
                    imageUrl={formData.image_url}
                    value={postEffects}
                    onChange={setPostEffects}
                    previewAspect="16/9"
                  />
                </div>

                {/* Efectele MODALULUI „Play Blog" — doar pentru bloguri dinamice */}
                {isDynamic && (
                  <div className="mt-4 [&_*]:text-white">
                    <ImageEffectsEditor
                      title={'Effekte NUR für das „Play Blog"-Modal'}
                      hint="Getrennte Einstellungen — das Modal darf ganz anders aussehen als das Beitragsbild."
                      imageUrl={formData.image_url}
                      value={modalEffects}
                      onChange={setModalEffects}
                      backgroundOpacity={modalBgOpacity}
                      onBackgroundOpacityChange={setModalBgOpacity}
                      previewAspect="9/16"
                    />
                  </div>
                )}

                {/* ------------------------------------------------------------
                    Pasul A15 — opacitate si umbra, reglabile la ACEST blog.
                    Sunt lucruri separate de „efecte": aici alegi doar cat de
                    tare se vede imaginea si cat de puternica ii este umbra.
                    ------------------------------------------------------------ */}
                <div className="mt-4 rounded-lg border border-white/15 bg-white/5 p-4">
                  <h4 className="mb-1 text-sm font-semibold text-white">
                    Transparenz &amp; Schatten (nur für diesen Beitrag)
                  </h4>
                  <p className="mb-4 text-xs text-white/60">
                    Gilt nur für diesen Blog — jeder Beitrag darf anders aussehen.
                  </p>

                  <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                  <div className="grid gap-4 sm:grid-cols-2 min-w-0">
                    {([
                      ['Beitragsbild — Deckkraft', postImageOpacity, setPostImageOpacity, '%'],
                      ['Beitragsbild — Schatten', postImageShadow, setPostImageShadow, '%'],
                      ['Hintergrundbild — Deckkraft', backgroundOpacity, setBackgroundOpacity, '%'],
                      ['Hintergrundbild — Schatten', backgroundShadow, setBackgroundShadow, '%'],
                    ] as const).map(([label, value, setter, unit]) => (
                      <label key={label} className="block">
                        <span className="mb-1 flex items-center justify-between text-xs text-white/80">
                          {label}
                          <span className="tabular-nums text-white/60">{value}{unit}</span>
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={value}
                          onChange={(e) => setter(Number(e.target.value))}
                          className="w-full cursor-pointer accent-white"
                        />
                      </label>
                    ))}

                    {isDynamic && (
                      <>
                      {/* ------------------------------------------------------
                          Pasul 2508000 — „Play Blog" are reglaje SEPARATE
                          pentru fiecare temă. Aceeași poză arată altfel pe alb
                          decât pe negru: pe temă luminoasă poza rămânea o pată
                          neagră și textul aproape dispărea.
                          ------------------------------------------------------ */}
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <span className="text-xs text-white/60">{'Reglaje „Play Blog" pentru:'}</span>
                        {([
                          ['dark', 'Temă întunecată'],
                          ['light', 'Temă luminoasă'],
                        ] as const).map(([id, label]) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setPreviewTheme(id)}
                            className={`btn-solid rounded-full border px-3 py-1 text-xs transition-colors ${
                              previewTheme === id
                                ? 'border-transparent bg-white text-black'
                                : 'border-white/25 text-white/60 hover:bg-white/10'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {previewTheme === 'dark' ? (
                        <>
                          <label className="block">
                            <span className="mb-1 flex items-center justify-between text-xs text-white/80">
                              {'„Play Blog" — Deckkraft'}
                              <span className="tabular-nums text-white/60">{modalBgOpacity}%</span>
                            </span>
                            <input
                              type="range" min={0} max={100}
                              value={modalBgOpacity}
                              onChange={(e) => setModalBgOpacity(Number(e.target.value))}
                              className="w-full cursor-pointer accent-white"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 flex items-center justify-between text-xs text-white/80">
                              {'„Play Blog" — Schatten'}
                              <span className="tabular-nums text-white/60">{modalBgShadow}%</span>
                            </span>
                            <input
                              type="range" min={0} max={100}
                              value={modalBgShadow}
                              onChange={(e) => setModalBgShadow(Number(e.target.value))}
                              className="w-full cursor-pointer accent-white"
                            />
                          </label>
                        </>
                      ) : (
                        <>
                          <label className="block">
                            <span className="mb-1 flex items-center justify-between text-xs text-white/80">
                              {'Hell — Deckkraft'}
                              <span className="tabular-nums text-white/60">
                                {modalBgOpacityLight ?? modalBgOpacity}%
                                {modalBgOpacityLight === null && ' (wie dunkel)'}
                              </span>
                            </span>
                            <input
                              type="range" min={0} max={100}
                              value={modalBgOpacityLight ?? modalBgOpacity}
                              onChange={(e) => setModalBgOpacityLight(Number(e.target.value))}
                              className="w-full cursor-pointer accent-white"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 flex items-center justify-between text-xs text-white/80">
                              {'Hell — Schatten'}
                              <span className="tabular-nums text-white/60">
                                {modalBgShadowLight ?? modalBgShadow}%
                                {modalBgShadowLight === null && ' (wie dunkel)'}
                              </span>
                            </span>
                            <input
                              type="range" min={0} max={100}
                              value={modalBgShadowLight ?? modalBgShadow}
                              onChange={(e) => setModalBgShadowLight(Number(e.target.value))}
                              className="w-full cursor-pointer accent-white"
                            />
                          </label>
                          <div className="sm:col-span-2">
                            <button
                              type="button"
                              onClick={() => { setModalBgOpacityLight(null); setModalBgShadowLight(null); }}
                              disabled={modalBgOpacityLight === null && modalBgShadowLight === null}
                              className="rounded-lg border border-white/25 px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 disabled:opacity-40"
                            >
                              Gleich wie dunkles Thema
                            </button>
                          </div>
                        </>
                      )}
                      </>
                    )}
                  </div>

                  {/* ----------------------------------------------------------
                      Pasul 2308009 — PREVIZUALIZARE LIVE.
                      Aceleasi formule ca pe pagina publica, ca sa vezi exact
                      ce se intampla cand tragi de fiecare cursor.
                      ---------------------------------------------------------- */}
                  <div className="lg:w-[300px]">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                      So sieht es aus
                    </p>

                    {formData.image_url ? (
                      <div className="grid gap-3">
                        {/* Imaginea articolului */}
                        <div>
                          <p className="mb-1 text-[11px] text-white/50">Beitragsbild</p>
                          <div
                            className="relative overflow-hidden rounded-lg bg-black"
                            style={{
                              aspectRatio: '16 / 9',
                              boxShadow:
                                postImageShadow > 0
                                  ? `0 ${Math.round(postImageShadow * 0.4)}px ${Math.round(
                                      postImageShadow * 0.9,
                                    )}px rgba(0,0,0,${(postImageShadow / 100) * 0.75})`
                                  : 'none',
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={formData.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                              style={{ opacity: postImageOpacity / 100, filter: effectsFilter(postEffects) }}
                            />
                            <ImageEffectLayers settings={postEffects} zIndex={2} />
                          </div>
                        </div>

                        {/* Imaginea de fundal a paginii, cu valul de deasupra */}
                        <div>
                          <p className="mb-1 text-[11px] text-white/50">Hintergrundbild (Seite)</p>
                          <div
                            className="relative overflow-hidden rounded-lg bg-black"
                            style={{ aspectRatio: '16 / 9' }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={formData.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                              style={{
                                opacity: backgroundOpacity / 100,
                                filter:
                                  backgroundShadow > 0
                                    ? `brightness(${1 - backgroundShadow / 200})`
                                    : 'none',
                              }}
                            />
                            {/* Acelasi val ca pe pagina publica (tema intunecata) */}
                            <div className="absolute inset-0 bg-black/50" />
                            <p className="absolute inset-0 flex items-center justify-center px-3 text-center text-[11px] leading-snug text-white">
                              Beispieltext — so gut ist der Text lesbar
                            </p>
                          </div>
                        </div>

                        {/* Modalul „Play Blog" — 9:16, exact ca pe telefon */}
                        {isDynamic && (
                          <div>
                            <p className="mb-1 text-[11px] text-white/50">
                              {previewTheme === 'light' ? '„Play Blog" — helles Thema' : '„Play Blog" — dunkles Thema'}
                            </p>
                            <div
                              className="relative mx-auto overflow-hidden rounded-lg bg-black"
                              style={{ aspectRatio: '9 / 16', maxHeight: '260px' }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={formData.image_url}
                                alt=""
                                className="h-full w-full object-cover"
                                style={{
                                  opacity:
                                    (previewTheme === 'light'
                                      ? modalBgOpacityLight ?? modalBgOpacity
                                      : modalBgOpacity) / 100,
                                  filter: [
                                    effectsFilter(modalEffects),
                                    (() => {
                                      const s =
                                        previewTheme === 'light'
                                          ? modalBgShadowLight ?? modalBgShadow
                                          : modalBgShadow;
                                      return s > 0 ? `brightness(${1 - s / 200})` : '';
                                    })(),
                                  ]
                                    .filter(Boolean)
                                    .join(' '),
                                }}
                              />
                              <ImageEffectLayers settings={modalEffects} zIndex={2} />
                              <p className="force-white-text absolute inset-0 z-[3] flex items-center justify-center px-4 text-center font-cinzel text-[11px] italic leading-relaxed text-white">
                                So erscheint der gesprochene Text
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-white/20 px-3 text-center text-xs text-white/40">
                        Lade zuerst ein Bild hoch — dann siehst du hier sofort, was jeder Regler bewirkt.
                      </div>
                    )}
                  </div>
                  </div>
                </div>

                {/* Pasul 2208002 (punctul 3) — audio generat O SINGURA DATA.
                    Apare doar la blogurile dinamice si doar dupa ce articolul
                    a fost salvat (are un `slug`). */}
                {isDynamic && editingPost?.slug && (
                  <BlogAudioGenerator
                    slug={editingPost.slug}
                    title={formData.title}
                    text={formData.content}
                    language="ro"
                    createdAt={editingPost?.created_at ?? null}
                    // Pasul A18 — limbile in care ai incarcat vocea ta
                    customAudioLangs={customAudioLangs}
                  />
                )}

                {isDynamic && !editingPost?.slug && (
                  <p className="mt-4 rounded-lg border border-white/15 bg-white/5 p-3 text-xs text-white/60">
                    🎧 Salvează întâi articolul. După aceea apare butonul
                    „Generează audio&ldquo;, care creează vocea <strong>o singură dată</strong>,
                    ca cititorii să nu producă niciun cost.
                  </p>
                )}

                {/* Pasul A18 — inregistrarile TALE, pe limbi.
                    In limbile in care incarci un fisier, TTS-ul nu se mai
                    genereaza deloc; in restul, ramane ca pana acum. */}
                {isDynamic && editingPost?.id && (
                  <div className="mt-4 [&_*]:text-white">
                    <CustomAudioManager
                      blogId={editingPost.id}
                      onLangsChange={setCustomAudioLangs}
                    />
                  </div>
                )}

                {/* Pasul 2208002 (punctul 10) — previzualizarea intregului articol */}
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="mt-4 w-full rounded-lg border border-white/25 px-4 py-2.5 text-sm text-white/85 transition-colors hover:bg-white/10"
                >
                  👁️ Previzualizează articolul întreg
                </button>
              </div>

              {/* Publish checkbox / Veröffentlichen-Checkbox */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="published"
                  name="published"
                  checked={formData.published}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="published" className="text-white/80">
                  Post veröffentlichen
                </label>
              </div>

              {/* -----------------------------------------------------------
                  Pasul 2308006-F — „Acest articol este pentru pagina News".
                  Asa nu mai incarci video-uri sau fisiere audio separate
                  (care ar costa spatiu si ar avea limita de marime):
                  folosesti articolul, cu tot ce stie el deja — poze, audio,
                  „Play Blog".
                  ----------------------------------------------------------- */}
              <div className="rounded-lg border border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isNews"
                    checked={isNews}
                    onChange={(e) => setIsNews(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/10"
                  />
                  <label htmlFor="isNews" className="text-white/80">
                    Articol pentru pagina „News&ldquo;
                  </label>
                </div>
                <p className="mt-2 text-xs text-white/40">
                  Apare pe pagina News doar dacă este și <strong>publicat</strong>,
                  iar rubrica News este pornită din Setări → News.
                  Dacă rămâne ciornă, nu îl vede nimeni.
                </p>
              </div>

              {/* Form actions / Formular-Aktionen */}
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={editingPost ? updatePost : createPost}
                  disabled={creating}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  <span>{creating ? 'Erstelle...' : (editingPost ? 'Aktualisieren' : 'Erstellen')}</span>
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={creating}
                  className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaTimes />
                  <span>Abbrechen</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =================================================================
            Pasul 2308004 (C) — RUBRICI
            Inainte totul era o gramada, unul sub altul. Acum exista doua
            rubrici mari, fiecare cu sub-rubrici. Continutul NU a fost
            modificat, doar grupat — deci nimic nu se poate strica.
            ================================================================= */}
        <nav className="mb-8 flex flex-wrap gap-2 border-b border-black/10 pb-3 dark:border-white/10">
          {([
            { id: 'create', label: 'Creare' },
            { id: 'settings', label: 'Setări' },
          ] as const).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setMainTab(t.id);
                // Fiecare rubrica isi deschide prima sub-rubrica
                setSubTab(t.id === 'create' ? 'blogs' : 'working');
              }}
              className={`btn-solid rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                mainTab === t.id
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              {t.label}
              {/* Pasul 2308005 (D): vezi din prima ca ai ceva de aprobat */}
              {t.id === 'settings' && pendingCount > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* ---------- Sub-rubrici ----------
            Pasul A04 — ORDONARE.
            Inainte sub-rubricile erau puse la gramada, fara nicio logica.
            Acum sunt grupate si au fiecare o pictograma, iar grupurile sunt
            despartite vizual. Ordinea urmeaza fluxul real de lucru:
              Creare : intai continutul lung (Blogs), apoi cel scurt (Reels)
              Setari : intai site-ul, apoi ce vede cititorul (Modals),
                       apoi oamenii (Utilizatori) si la final ce te asteapta
                       pe tine (Notificari). */}
        <div className="mb-8 flex flex-wrap items-center gap-1">
          {(mainTab === 'create'
            ? ([
                // Pasul 2308006-D — etichetele urmeaza limba aleasa de tine sus
                { id: 'blogs', label: adminT('tabs.blogs'), Icon: IconDocument, group: 'Conținut' },
                { id: 'reels', label: adminT('tabs.reels'), Icon: IconFilm, group: 'Conținut' },
              ] as const)
            : ([
                { id: 'working', label: 'Site în lucru', Icon: IconWrench, group: 'Site' },
                { id: 'modals', label: 'Modals', Icon: IconWindow, group: 'Site' },
                // Pasul 2508000 — textul paginilor fixe (Despre, Contact, Impressum…)
                { id: 'pages', label: 'Pagini', Icon: IconDocument, group: 'Site' },
                // Pasul A16 — noutati despre RADIKAL, invitatii, anunturi, reclame
                { id: 'news', label: adminT('tabs.news'), Icon: IconMegaphone, group: 'Site' },
                // Pasul A17 — categoriile blogurilor
                { id: 'categories', label: adminT('tabs.categories'), Icon: IconTag, group: 'Site' },
                { id: 'users', label: adminT('tabs.users'), Icon: IconUsers, group: 'Oameni' },
                { id: 'requests', label: 'Notificări', Icon: IconBell, group: 'Oameni' },
              ] as const)
          ).map((t, i, arr) => (
            <React.Fragment key={t.id}>
              {/* Linie subtire de despartire intre grupuri */}
              {i > 0 && arr[i - 1].group !== t.group && (
                <span
                  aria-hidden="true"
                  className="mx-2 h-4 w-px shrink-0 bg-black/20 dark:bg-white/15"
                />
              )}
              <button
                type="button"
                onClick={() => setSubTab(t.id)}
                title={t.group}
                className={`btn-solid inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  subTab === t.id
                    ? 'border-transparent bg-black text-white dark:bg-white dark:text-black'
                    : 'border-black/15 text-black/60 hover:bg-black/5 dark:border-white/15 dark:text-white/50 dark:hover:bg-white/10'
                }`}
              >
                {/* Pasul A08 — pictograme SVG monocrome, nu emoji colorate */}
                <t.Icon className="h-3.5 w-3.5" />
                {t.label}
                {/* Bulina rosie: cate cereri asteapta */}
                {t.id === 'requests' && pendingCount > 0 && (
                  <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* ---------- SETĂRI → Site în lucru ---------- */}
        {mainTab === 'settings' && subTab === 'working' && (
          <section className="glass-effect animate-fadeIn mb-12 rounded-2xl p-6">
            <h2 className="mb-1 text-xl font-bold text-white">Site în lucru</h2>
            <p className="mb-5 text-xs text-white/50">
              Îngheață site-ul pentru vizitatori cât timp lucrezi la el.
            </p>
            <MaintenanceAdmin />
          </section>
        )}

        {/* ---------- SETĂRI → Modals ---------- */}
        {mainTab === 'settings' && subTab === 'modals' && (
          <section className="animate-fadeIn mb-12 space-y-8">
            <div className="glass-effect rounded-2xl p-6">
              <h2 className="mb-1 text-xl font-bold text-white">Text sub logo (intrare)</h2>
              <p className="mb-5 text-xs text-white/50">
                Textul care apare sub logo-ul RADIKAL, înainte de modalul cu versetul.
              </p>
              <IntroTextAdmin />
            </div>

            <StoryContentAdmin />
          </section>
        )}

        {/* ---------- SETĂRI → Pagini (pasul 2508000) ---------- */}
        {mainTab === 'settings' && subTab === 'pages' && (
          <section className="animate-fadeIn mb-12">
            <div className="glass-effect rounded-2xl p-6">
              <h2 className="mb-1 text-xl font-bold text-black dark:text-white">Textul paginilor</h2>
              <p className="mb-5 text-xs text-black/50 dark:text-white/50">
                Schimbi textul unei pagini, iar la salvare se traduce singur în toate limbile.
                Oricând te poți întoarce la textul original.
              </p>
              <PageContentAdmin />
            </div>
          </section>
        )}

        {/* ---------- SETĂRI → News (pasul A16) ---------- */}
        {mainTab === 'settings' && subTab === 'news' && (
          <section className="animate-fadeIn mb-12">
            <div className="glass-effect rounded-2xl p-6">
              <h2 className="mb-1 text-xl font-bold text-white">News</h2>
              <p className="mb-5 text-xs text-white/50">
                Tot ce e nou: noutăți despre RADIKAL, invitații, anunțuri, reclame, poze.
                Fiecare știre poate avea text în toate cele 4 limbi.
              </p>
              <NewsAdmin />
            </div>
          </section>
        )}

        {/* ---------- SETĂRI → Categorii (pasul A17) ---------- */}
        {mainTab === 'settings' && subTab === 'categories' && (
          <section className="animate-fadeIn mb-12">
            <div className="glass-effect rounded-2xl p-6">
              <h2 className="mb-1 text-xl font-bold text-white">Categorii</h2>
              <p className="mb-5 text-xs text-white/50">
                Familie, prietenie, credință, frică, păcat, iubire, închinare… și oricâte
                altele vrei. Fiecare categorie are nume în toate cele 4 limbi, ca fiecare
                cititor să o vadă în limba lui.
              </p>
              <CategoriesAdmin />
            </div>
          </section>
        )}

        {/* ---------- SETĂRI → Utilizatori și drepturi ---------- */}
        {mainTab === 'settings' && subTab === 'users' && (
          <section className="glass-effect animate-fadeIn mb-12 rounded-2xl p-6">
            <h2 className="mb-1 text-xl font-bold text-white">Utilizatori și drepturi</h2>
            <p className="mb-5 text-xs text-white/50">
              Cine mai poate lucra la RADIKAL și exact ce poate face.
            </p>
            <AdminUsersPanel />
          </section>
        )}

        {/* ---------- SETĂRI → Notificări ---------- */}
        {mainTab === 'settings' && subTab === 'requests' && (
          <section className="glass-effect animate-fadeIn mb-12 rounded-2xl p-6">
            <h2 className="mb-1 text-xl font-bold text-white">Notificări</h2>
            <p className="mb-5 text-xs text-white/50">
              Ce au propus sub-adminii. Nimic nu ajunge public până nu aprobi tu.
            </p>
            <AdminRequestsPanel />
          </section>
        )}

        {/* ---------- CREARE → Reels ---------- */}
        {mainTab === 'create' && subTab === 'reels' && (
          <section className="animate-fadeIn mb-12">
            <ReelsAdmin />
          </section>
        )}

        {/* Posts list / Posts-Liste */}
        {mainTab === 'create' && subTab === 'blogs' && (
        <section className="animate-fadeIn" style={{ animationDelay: '0.6s' }}>
          <h2 className="text-2xl font-bold text-white mb-8">
            Alle Blog-Posts ({posts.length})
          </h2>
          
          {posts.length === 0 ? (
            <div className="glass-effect rounded-xl p-8 text-center">
              <p className="text-white/80 text-lg">Noch keine Blog-Posts vorhanden.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary mt-4"
              >
                Ersten Post erstellen
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pasul A17 — alegi INTAI categoria, apoi anul si luna.
                  Se pot bifa mai multe categorii deodata. */}
              <div className="rounded-xl border border-white/15 bg-white/5 p-4 [&_*]:text-white">
                <p className="mb-2 text-xs font-medium text-white/70">
                  Filtrează după categorie
                </p>
                <CategoryPicker
                  categories={allCategories}
                  value={filterCategoryIds}
                  onChange={setFilterCategoryIds}
                  lang="ro"
                  placeholder="Caută o categorie…"
                />
              </div>

              {/* Pasul 2108002: căutare + filtru an/lună, separat de cel al reels-urilor */}
              <AdminListFilterBar
                placeholder="Caută în articole…"
                search={postsFilter.search}
                setSearch={postsFilter.setSearch}
                year={postsFilter.year}
                setYear={postsFilter.setYear}
                month={postsFilter.month}
                setMonth={postsFilter.setMonth}
                years={postsFilter.years}
                monthNames={postsFilter.monthNames}
                totalCount={posts.length}
                filteredCount={postsFilter.filtered.length}
                isFiltering={postsFilter.isFiltering}
                onReset={postsFilter.reset}
              />

              {postsFilter.visible.length === 0 && (
                <p className="text-white/60 text-sm">Niciun articol nu corespunde căutării.</p>
              )}

              {postsFilter.visible.map((post) => (
                <div key={post.id} className="glass-effect rounded-xl p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Post info / Post-Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">
                          {post.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          post.published 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {post.published ? 'Veröffentlicht' : 'Entwurf'}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm mb-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-white/60 text-sm">
                        <span>Erstellt: {new Date(post.created_at).toLocaleDateString('de-DE')}</span>
                        <span>❤️ {post.likes_count}</span>
                        <span>💬 {post.comments_count}</span>
                        {post.tags && post.tags.length > 0 && (
                          <span>🏷️ {Array.isArray(post.tags) ? post.tags.join(', ') : post.tags}</span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons / Aktions-Buttons
                        Pasul 2308006-B: pictograme monocrome, in stil RADIKAL.
                        Culoarea vine din text, deci se potrivesc pe orice fundal. */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(`/blogs/${post.slug}`, '_blank')}
                        className="p-2 rounded-lg border border-white/15 text-white/60 transition-colors duration-200 hover:border-white/40 hover:bg-white/10 hover:text-white"
                        title="Ansehen"
                      >
                        <IconEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => startEditing(post)}
                        className="p-2 rounded-lg border border-white/15 text-white/60 transition-colors duration-200 hover:border-white/40 hover:bg-white/10 hover:text-white"
                        title="Bearbeiten"
                      >
                        <IconPencil className="w-4 h-4" />
                      </button>
                      {/* Newsletter button - only for published posts / Newsletter-Button - nur für veröffentlichte Posts */}
                      {post.published && (
                        <button
                          onClick={() => sendNewsletterNotification(post)}
                          disabled={sendingNewsletter}
                          className="p-2 rounded-lg border border-white/15 text-white/60 transition-colors duration-200 hover:border-white/40 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Newsletter an Abonnenten senden"
                        >
                          {sendingNewsletter
                            ? <IconSpinner className="w-4 h-4 animate-spin" />
                            : <IconSend className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => deletePost(post.id)}
                        className="p-2 rounded-lg border border-red-400/25 text-red-400/70 transition-colors duration-200 hover:border-red-400/60 hover:bg-red-500/10 hover:text-red-300"
                        title="Löschen"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {postsFilter.hiddenCount > 0 && !postsFilter.showAll && (
                <button
                  type="button"
                  onClick={() => postsFilter.setShowAll(true)}
                  className="w-full rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10"
                >
                  Arată toate ({postsFilter.hiddenCount} ascunse)
                </button>
              )}

              {postsFilter.showAll && !postsFilter.isFiltering && (
                <button
                  type="button"
                  onClick={() => postsFilter.setShowAll(false)}
                  className="w-full rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10"
                >
                  Arată doar ultimele 5
                </button>
              )}
            </div>
          )}
        </section>
        )}
      </div>

      {/* Pasul 2208002 (punctul 10) — previzualizarea articolului intreg */}
      <BlogPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={formData.title}
        excerpt={formData.excerpt}
        content={formData.content}
        imageUrl={formData.image_url}
        tags={formData.tags.split(',').map((t) => t.trim()).filter(Boolean)}
        effects={postEffects}
        isDynamic={isDynamic}
      />
    </div>
  );
}
