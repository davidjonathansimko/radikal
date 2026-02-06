// Admin dashboard for managing blog posts / Admin-Dashboard zur Verwaltung von Blog-Posts
// This provides CRUD operations for blog posts - only accessible by admin
// Dies bietet CRUD-Operationen für Blog-Posts - nur für Admin zugänglich

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { createClient } from '@/lib/supabase';
import { BlogPost } from '@/types';
import { autoTranslateBlogPost } from '@/utils/translation';
import ImageUpload from '@/components/ImageUpload';
import { 
  FaPlus, 
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
  FaEnvelope,
  FaChartLine
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
    modal_question: ''
  });

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
      const adminEmail = 'davidsimko22@yahoo.com';
      if (user.email === adminEmail) {
        setIsAdmin(true);
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
        modal_question: formData.modal_question || null
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
          modal_question: formData.modal_question || null
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
      modal_question: post.modal_question || ''
    });
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
      modal_question: ''
    });
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
          <h1 className="text-4xl font-bold text-white mb-4 animate-fadeIn">
            Admin Dashboard
          </h1>
          <p className="text-white/80 mb-6 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Verwalte deine Blog-Posts und Inhalte
          </p>
          
          {/* Action buttons / Aktions-Buttons */}
          <div className="flex flex-wrap gap-4 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={() => {
                setShowCreateForm(true);
                setEditingPost(null);
                resetForm();
              }}
              className="btn-primary flex items-center gap-2"
            >
              <FaPlus />
              <span>Neuen Post erstellen</span>
            </button>
            
            {/* Analytics Dashboard Link / Analytics-Dashboard-Link */}
            <Link
              href="/admin/analytics"
              className="btn-secondary flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-3 rounded-lg transition-all duration-300"
            >
              <FaChartLine />
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
                  </div>
                )}
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

        {/* Posts list / Posts-Liste */}
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
              {posts.map((post) => (
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

                    {/* Action buttons / Aktions-Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(`/blogs/${post.slug}`, '_blank')}
                        className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors duration-200"
                        title="Ansehen"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => startEditing(post)}
                        className="p-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg transition-colors duration-200"
                        title="Bearbeiten"
                      >
                        <FaEdit />
                      </button>
                      {/* Newsletter button - only for published posts / Newsletter-Button - nur für veröffentlichte Posts */}
                      {post.published && (
                        <button
                          onClick={() => sendNewsletterNotification(post)}
                          disabled={sendingNewsletter}
                          className="p-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Newsletter an Abonnenten senden"
                        >
                          {sendingNewsletter ? <FaSpinner className="animate-spin" /> : <FaBell />}
                        </button>
                      )}
                      <button
                        onClick={() => deletePost(post.id)}
                        className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors duration-200"
                        title="Löschen"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
