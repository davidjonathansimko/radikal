// Bookmark/Favorite System / Lesezeichen/Favoriten-System / Sistem Marcaje/Favorite
// Save and organize favorite content
// Inhalte speichern und organisieren
// Salvează și organizează conținutul preferat

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getSupabaseClient } from '@/lib/supabase';

const supabase = getSupabaseClient();

// Types
export interface Bookmark {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'post' | 'page' | 'modal';
  title: string;
  slug: string;
  excerpt?: string;
  image_url?: string;
  created_at: string;
  collection_id?: string;
  notes?: string;
}

export interface BookmarkCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  bookmark_count?: number;
}

interface BookmarkButtonProps {
  contentId: string;
  contentType: 'post' | 'page' | 'modal';
  title: string;
  slug: string;
  excerpt?: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/**
 * Bookmark Button Component
 */
export default function BookmarkButton({
  contentId,
  contentType,
  title,
  slug,
  excerpt,
  imageUrl,
  size = 'md',
  showLabel = false,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCollections, setShowCollections] = useState(false);

  // Check if content is bookmarked
  const checkBookmarkStatus = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .single();

    setIsBookmarked(!!data);
    setIsLoading(false);
  }, [contentId]);

  useEffect(() => {
    checkBookmarkStatus();
  }, [checkBookmarkStatus]);

  const toggleBookmark = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Redirect to login or show message
      return;
    }

    setIsLoading(true);

    if (isBookmarked) {
      // Remove bookmark
      await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', contentId);
      setIsBookmarked(false);
    } else {
      // Add bookmark
      await supabase.from('bookmarks').insert({
        user_id: user.id,
        content_id: contentId,
        content_type: contentType,
        title,
        slug,
        excerpt,
        image_url: imageUrl,
      });
      setIsBookmarked(true);
    }

    setIsLoading(false);
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div className="relative">
      <button
        onClick={toggleBookmark}
        disabled={isLoading}
        className={`
          ${sizeClasses[size]}
          inline-flex items-center justify-center gap-2
          rounded-lg transition-all duration-200
          ${isBookmarked 
            ? 'bg-red-600 text-white' 
            : 'bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700'
          }
          disabled:opacity-50
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black
        `}
        aria-label={isBookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen hinzufügen'}
        title={isBookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen hinzufügen'}
      >
        <svg
          className="w-5 h-5"
          fill={isBookmarked ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        {showLabel && (
          <span className="text-sm">
            {isBookmarked ? 'Gespeichert' : 'Speichern'}
          </span>
        )}
      </button>
    </div>
  );
}

/**
 * Bookmarks List Component
 */
interface BookmarksListProps {
  userId?: string;
  collectionId?: string;
}

export function BookmarksList({ userId, collectionId }: BookmarksListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookmarks = useCallback(async () => {
    setIsLoading(true);

    let query = supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (collectionId) {
      query = query.eq('collection_id', collectionId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setBookmarks(data);
    }

    setIsLoading(false);
  }, [userId, collectionId]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const removeBookmark = async (bookmarkId: string) => {
    await supabase.from('bookmarks').delete().eq('id', bookmarkId);
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex gap-4 p-4 bg-zinc-800/50 rounded-lg">
            <div className="w-20 h-20 bg-zinc-700 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-700 rounded w-3/4" />
              <div className="h-3 bg-zinc-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <p>Noch keine Lesezeichen</p>
        <p className="text-sm mt-1">Speichere Artikel, um sie später zu lesen</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark) => (
        <article
          key={bookmark.id}
          className="flex gap-4 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          {bookmark.image_url && (
            <a href={`/blog/${bookmark.slug}`} className="flex-shrink-0">
              <Image
                src={bookmark.image_url}
                alt=""
                width={80}
                height={80}
                className="w-20 h-20 object-cover rounded-lg"
              />
            </a>
          )}
          <div className="flex-1 min-w-0">
            <a
              href={`/blog/${bookmark.slug}`}
              className="text-white font-medium hover:text-red-500 transition-colors line-clamp-1"
            >
              {bookmark.title}
            </a>
            {bookmark.excerpt && (
              <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                {bookmark.excerpt}
              </p>
            )}
            {bookmark.notes && (
              <p className="text-sm text-gray-500 mt-2 italic">
                &ldquo;{bookmark.notes}&rdquo;
              </p>
            )}
          </div>
          <button
            onClick={() => removeBookmark(bookmark.id)}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-red-500 transition-colors"
            aria-label="Lesezeichen entfernen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </article>
      ))}
    </div>
  );
}

/**
 * Collections Manager
 */
export function CollectionsManager() {
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('bookmark_collections')
      .select('*, bookmarks(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setCollections(
        data.map((c: any) => ({
          ...c,
          bookmark_count: c.bookmarks?.[0]?.count || 0,
        }))
      );
    }

    setIsLoading(false);
  };

  const createCollection = async () => {
    if (!newCollectionName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('bookmark_collections')
      .insert({
        user_id: user.id,
        name: newCollectionName,
        is_public: false,
      })
      .select()
      .single();

    if (!error && data) {
      setCollections((prev) => [{ ...data, bookmark_count: 0 }, ...prev]);
      setNewCollectionName('');
    }
  };

  const deleteCollection = async (collectionId: string) => {
    await supabase
      .from('bookmark_collections')
      .delete()
      .eq('id', collectionId);

    setCollections((prev) => prev.filter((c) => c.id !== collectionId));
  };

  return (
    <div className="space-y-6">
      {/* Create Collection */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
          placeholder="Neue Sammlung erstellen..."
          className="
            flex-1 px-4 py-2 
            bg-zinc-800 border border-zinc-700 
            rounded-lg text-white
            focus:outline-none focus:ring-2 focus:ring-red-500
          "
        />
        <button
          onClick={createCollection}
          disabled={!newCollectionName.trim()}
          className="
            px-4 py-2 
            bg-red-600 hover:bg-red-700 
            text-white rounded-lg transition-colors
            disabled:opacity-50
          "
        >
          Erstellen
        </button>
      </div>

      {/* Collections List */}
      <div className="space-y-2">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
          >
            <a
              href={`/bookmarks/${collection.id}`}
              className="flex-1"
            >
              <h3 className="text-white font-medium">{collection.name}</h3>
              <p className="text-sm text-gray-400">
                {collection.bookmark_count} Lesezeichen
              </p>
            </a>
            <button
              onClick={() => deleteCollection(collection.id)}
              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
              aria-label="Sammlung löschen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Hook for bookmark functionality
 */
export function useBookmark(contentId: string) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .single();

    setIsBookmarked(!!data);
    setIsLoading(false);
  }, [contentId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const toggle = useCallback(async (metadata?: Partial<Bookmark>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isBookmarked) {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', contentId);
      setIsBookmarked(false);
    } else {
      await supabase.from('bookmarks').insert({
        user_id: user.id,
        content_id: contentId,
        ...metadata,
      });
      setIsBookmarked(true);
    }
  }, [contentId, isBookmarked]);

  return { isBookmarked, isLoading, toggle };
}

/**
 * SQL for bookmarks system
 */
export const BOOKMARKS_SQL = `
-- Bookmark Collections Table
CREATE TABLE IF NOT EXISTS bookmark_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookmarks Table
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('post', 'page', 'modal')),
  title TEXT NOT NULL,
  slug VARCHAR(255) NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  collection_id UUID REFERENCES bookmark_collections(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_collection ON bookmarks(collection_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_collections_user ON bookmark_collections(user_id);

-- RLS
ALTER TABLE bookmark_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own collections" ON bookmark_collections
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view public collections" ON bookmark_collections
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can manage own bookmarks" ON bookmarks
  FOR ALL USING (user_id = auth.uid());
`;
