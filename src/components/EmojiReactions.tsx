// Emoji Reactions Component / Emoji-Reaktionen-Komponente / Componenta Reacții Emoji
// Similar to LinkedIn reactions - multiple emoji options for posts
// Ähnlich wie LinkedIn-Reaktionen - mehrere Emoji-Optionen für Beiträge
// Similar cu reacțiile LinkedIn - mai multe opțiuni emoji pentru postări

'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { createClient } from '@/lib/supabase';

interface EmojiReactionsProps {
  postId: string;
  className?: string;
}

type ReactionType = 'like' | 'love' | 'pray' | 'wow' | 'clap' | 'fire' | 'think' | 'sad' | 'hallelujah' | 'blessed';

interface ReactionData {
  type: ReactionType;
  emoji: string;
  label: { de: string; en: string; ro: string; ru: string };
  count: number;
  hasReacted: boolean;
}

const reactionConfig: Omit<ReactionData, 'count' | 'hasReacted'>[] = [
  { type: 'like', emoji: '👍', label: { de: 'Gefällt mir', en: 'Like', ro: 'Îmi place', ru: 'Нравится' } },
  { type: 'love', emoji: '❤️', label: { de: 'Liebe', en: 'Love', ro: 'Iubesc', ru: 'Люблю' } },
  { type: 'pray', emoji: '🙏', label: { de: 'Amen', en: 'Amen', ro: 'Amin', ru: 'Аминь' } },
  { type: 'wow', emoji: '😮', label: { de: 'Wow', en: 'Wow', ro: 'Uau', ru: 'Вау' } },
  { type: 'clap', emoji: '👏', label: { de: 'Applaus', en: 'Applause', ro: 'Aplauze', ru: 'Аплодисменты' } },
  { type: 'fire' as ReactionType, emoji: '🔥', label: { de: 'Feuer', en: 'Fire', ro: 'Foc', ru: 'Огонь' } },
  { type: 'think' as ReactionType, emoji: '🤔', label: { de: 'Nachdenklich', en: 'Thinking', ro: 'Gânditor', ru: 'Задумчивый' } },
  { type: 'sad' as ReactionType, emoji: '😢', label: { de: 'Traurig', en: 'Sad', ro: 'Trist', ru: 'Грустно' } },
  { type: 'hallelujah' as ReactionType, emoji: '🙌', label: { de: 'Halleluja', en: 'Hallelujah', ro: 'Aleluia', ru: 'Аллилуйя' } },
  { type: 'blessed' as ReactionType, emoji: '✝️', label: { de: 'Gesegnet', en: 'Blessed', ro: 'Binecuvântat', ru: 'Благословен' } },
];

const translations = {
  de: {
    reactions: 'Reaktionen',
    reactFirst: 'Sei der Erste, der reagiert!',
    loginToReact: 'Anmelden um zu reagieren'
  },
  en: {
    reactions: 'Reactions',
    reactFirst: 'Be the first to react!',
    loginToReact: 'Login to react'
  },
  ro: {
    reactions: 'Reacții',
    reactFirst: 'Fii primul care reacționează!',
    loginToReact: 'Conectează-te pentru a reacționa'
  },
  ru: {
    reactions: 'Реакции',
    reactFirst: 'Будьте первым, кто отреагирует!',
    loginToReact: 'Войдите, чтобы реагировать'
  }
};

export default function EmojiReactions({ postId, className = '' }: EmojiReactionsProps) {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.de;
  const [reactions, setReactions] = useState<ReactionData[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Check user authentication
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    checkUser();
  }, [supabase.auth]);

  // Load reactions from localStorage (since we don't have a reactions table yet)
  useEffect(() => {
    const loadReactions = () => {
      const saved = localStorage.getItem(`radikal-reactions-${postId}`);
      const savedReactions = saved ? JSON.parse(saved) : {};
      const userReaction = localStorage.getItem(`radikal-user-reaction-${postId}`);

      const reactionData: ReactionData[] = reactionConfig.map(config => ({
        ...config,
        count: savedReactions[config.type] || 0,
        hasReacted: userReaction === config.type
      }));

      setReactions(reactionData);
      setLoading(false);
    };

    loadReactions();
  }, [postId]);

  // Handle reaction click - works for guests too using localStorage
  const handleReaction = (type: ReactionType) => {
    // No login required - guests can react using localStorage

    const currentUserReaction = localStorage.getItem(`radikal-user-reaction-${postId}`);
    const savedReactions = JSON.parse(localStorage.getItem(`radikal-reactions-${postId}`) || '{}');

    // If already reacted with same type, remove reaction
    if (currentUserReaction === type) {
      savedReactions[type] = Math.max(0, (savedReactions[type] || 0) - 1);
      localStorage.removeItem(`radikal-user-reaction-${postId}`);
    } else {
      // Remove previous reaction if exists
      if (currentUserReaction) {
        savedReactions[currentUserReaction] = Math.max(0, (savedReactions[currentUserReaction] || 0) - 1);
      }
      // Add new reaction
      savedReactions[type] = (savedReactions[type] || 0) + 1;
      localStorage.setItem(`radikal-user-reaction-${postId}`, type);
    }

    localStorage.setItem(`radikal-reactions-${postId}`, JSON.stringify(savedReactions));

    // Update state
    setReactions(prev => prev.map(r => ({
      ...r,
      count: savedReactions[r.type] || 0,
      hasReacted: localStorage.getItem(`radikal-user-reaction-${postId}`) === r.type
    })));
  };

  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);
  const topReactions = reactions.filter(r => r.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);

  if (loading) {
    return (
      <div className={`animate-pulse flex gap-2 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10" />
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Compact view - show top reactions */}
      <div className="flex items-center gap-2">
        {/* Reaction summary */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-full transition-all group"
        >
          {topReactions.length > 0 ? (
            <>
              <div className="flex -space-x-1">
                {topReactions.map(r => (
                  <span key={r.type} className="text-lg">{r.emoji}</span>
                ))}
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-white/70 ml-1">
                {totalReactions}
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-500 dark:text-white/50">{t.reactFirst}</span>
          )}
        </button>

        {/* Add reaction button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110"
        >
          <span className="text-lg">😊</span>
        </button>
      </div>

      {/* Expanded reaction picker */}
      {isExpanded && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-white/20 flex gap-1 animate-slideUp z-50">
          {reactions.map((reaction) => (
            <button
              key={reaction.type}
              onClick={() => {
                handleReaction(reaction.type);
                setIsExpanded(false);
              }}
              className={`group relative p-2 rounded-xl transition-all duration-200 hover:scale-125 hover:bg-gray-100 dark:hover:bg-white/10 ${
                reaction.hasReacted ? 'bg-blue-100 dark:bg-blue-500/20' : ''
              }`}
              title={reaction.label[language as keyof typeof reaction.label]}
            >
              <span className="text-2xl">{reaction.emoji}</span>
              
              {/* Count badge */}
              {reaction.count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gray-200 dark:bg-white/20 rounded-full text-xs font-medium flex items-center justify-center text-gray-700 dark:text-white/80">
                  {reaction.count}
                </span>
              )}
              
              {/* Tooltip */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {reaction.label[language as keyof typeof reaction.label]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}
