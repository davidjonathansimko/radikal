// Bookmarks Hook / Lesezeichen-Hook / Hook Bookmark-uri
// Custom hook for managing user bookmarks and reading lists
// Benutzerdefinierter Hook zur Verwaltung von Benutzer-Lesezeichen und Leselisten
// Hook personalizat pentru gestionarea bookmark-urilor și listelor de lectură

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { BlogPost } from '@/types';

// Types / Typen
interface Bookmark {
  id: string;
  post_id: string;
  created_at: string;
  notes?: string;
  collection: string;
}

interface BookmarkedPost extends BlogPost {
  bookmark_id: string;
  bookmarked_at: string;
  notes?: string;
  collection: string;
}

interface UseBookmarksReturn {
  // State
  bookmarks: Bookmark[];
  bookmarkedPosts: BookmarkedPost[];
  loading: boolean;
  error: string | null;
  
  // Actions
  addBookmark: (postId: string, notes?: string, collection?: string) => Promise<boolean>;
  removeBookmark: (postId: string) => Promise<boolean>;
  toggleBookmark: (postId: string) => Promise<boolean>;
  isBookmarked: (postId: string) => boolean;
  updateBookmarkNotes: (postId: string, notes: string) => Promise<boolean>;
  getBookmarksByCollection: (collection: string) => BookmarkedPost[];
  
  // Data refresh
  refresh: () => Promise<void>;
}

export function useBookmarks(): UseBookmarksReturn {
  // State / Zustand
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<BookmarkedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize Supabase client / Supabase-Client initialisieren
  const supabase = createClient();

  // Get current user / Aktuellen Benutzer abrufen
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    // Listen for auth changes / Auf Auth-Änderungen hören
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch bookmarks / Lesezeichen abrufen
  const fetchBookmarks = useCallback(async () => {
    // If user is not logged in, clear bookmarks silently (no error)
    if (!userId) {
      setBookmarks([]);
      setBookmarkedPosts([]);
      setLoading(false);
      setError(null); // Clear any previous error
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch bookmarks with post details / Lesezeichen mit Post-Details abrufen
      // Only select columns that exist in the database
      const { data, error: fetchError } = await supabase
        .from('bookmarks')
        .select(`
          id,
          post_id,
          created_at,
          notes,
          collection,
          blog_posts (
            id,
            title,
            title_en,
            excerpt,
            excerpt_en,
            content,
            content_en,
            image_url,
            tags,
            published,
            created_at,
            updated_at,
            likes_count,
            slug
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Better error checking - Supabase sometimes returns empty error objects
      if (fetchError) {
        const errorMsg = fetchError.message || fetchError.details || fetchError.hint || 
          (fetchError.code === '42P01' ? 'Tabelle "bookmarks" existiert nicht. Bitte BOOKMARKS_SETUP.sql ausführen.' :
          JSON.stringify(fetchError));
        throw new Error(errorMsg);
      }

      // Transform data / Daten transformieren
      const bookmarksList: Bookmark[] = [];
      const postsList: BookmarkedPost[] = [];

      (data || []).forEach((item: any) => {
        if (item.blog_posts && item.blog_posts.published) {
          bookmarksList.push({
            id: item.id,
            post_id: item.post_id,
            created_at: item.created_at,
            notes: item.notes,
            collection: item.collection
          });

          postsList.push({
            ...item.blog_posts,
            bookmark_id: item.id,
            bookmarked_at: item.created_at,
            notes: item.notes,
            collection: item.collection
          });
        }
      });

      setBookmarks(bookmarksList);
      setBookmarkedPosts(postsList);
    } catch (err: any) {
      // Better error handling - handle different error types
      const errorMessage = err?.message || err?.error_description || err?.details || 
        (typeof err === 'string' ? err : 'Fehler beim Laden der Lesezeichen');
      console.error('Error fetching bookmarks:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch on user change / Bei Benutzeränderung abrufen
  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Add bookmark / Lesezeichen hinzufügen
  const addBookmark = async (
    postId: string, 
    notes?: string, 
    collection: string = 'default'
  ): Promise<boolean> => {
    if (!userId) {
      setError('Please log in to bookmark posts');
      return false;
    }

    try {
      const { error: insertError } = await supabase
        .from('bookmarks')
        .insert({
          user_id: userId,
          post_id: postId,
          notes,
          collection
        });

      if (insertError) {
        // Handle duplicate / Duplikat behandeln
        if (insertError.code === '23505') {
          return true; // Already bookmarked / Bereits als Lesezeichen gespeichert
        }
        throw insertError;
      }

      // Refresh bookmarks / Lesezeichen aktualisieren
      await fetchBookmarks();
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || err?.error_description || 'Fehler beim Hinzufügen des Lesezeichens';
      console.error('Error adding bookmark:', errorMessage, err);
      setError(errorMessage);
      return false;
    }
  };

  // Remove bookmark / Lesezeichen entfernen
  const removeBookmark = async (postId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (deleteError) throw deleteError;

      // Update local state immediately / Lokalen Status sofort aktualisieren
      setBookmarks(prev => prev.filter(b => b.post_id !== postId));
      setBookmarkedPosts(prev => prev.filter(p => p.id !== postId));

      return true;
    } catch (err: any) {
      const errorMessage = err?.message || err?.error_description || 'Fehler beim Entfernen des Lesezeichens';
      console.error('Error removing bookmark:', errorMessage, err);
      setError(errorMessage);
      return false;
    }
  };

  // Toggle bookmark / Lesezeichen umschalten
  const toggleBookmark = async (postId: string): Promise<boolean> => {
    if (isBookmarked(postId)) {
      return removeBookmark(postId);
    } else {
      return addBookmark(postId);
    }
  };

  // Check if post is bookmarked / Prüfen, ob Post als Lesezeichen gespeichert ist
  const isBookmarked = useCallback((postId: string): boolean => {
    return bookmarks.some(b => b.post_id === postId);
  }, [bookmarks]);

  // Update bookmark notes / Lesezeichen-Notizen aktualisieren
  const updateBookmarkNotes = async (postId: string, notes: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error: updateError } = await supabase
        .from('bookmarks')
        .update({ notes })
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (updateError) throw updateError;

      // Update local state / Lokalen Status aktualisieren
      setBookmarks(prev => prev.map(b => 
        b.post_id === postId ? { ...b, notes } : b
      ));
      setBookmarkedPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, notes } : p
      ));

      return true;
    } catch (err: any) {
      const errorMessage = err?.message || err?.error_description || 'Fehler beim Aktualisieren der Notizen';
      console.error('Error updating bookmark notes:', errorMessage, err);
      setError(errorMessage);
      return false;
    }
  };

  // Get bookmarks by collection / Lesezeichen nach Sammlung abrufen
  const getBookmarksByCollection = useCallback((collection: string): BookmarkedPost[] => {
    return bookmarkedPosts.filter(p => p.collection === collection);
  }, [bookmarkedPosts]);

  // Return hook values / Hook-Werte zurückgeben
  return {
    bookmarks,
    bookmarkedPosts,
    loading,
    error,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    updateBookmarkNotes,
    getBookmarksByCollection,
    refresh: fetchBookmarks
  };
}

export default useBookmarks;
