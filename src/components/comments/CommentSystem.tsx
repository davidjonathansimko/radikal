// Enhanced Comment System / Verbessertes Kommentarsystem / Sistem Comentarii Îmbunătățit
// Advanced comments with reactions, replies, and moderation
// Erweiterte Kommentare mit Reaktionen, Antworten und Moderation
// Comentarii avansate cu reacții, răspunsuri și moderare

'use client';

import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Types
interface CommentAuthor {
  id: string;
  name: string;
  avatar?: string;
  isAdmin?: boolean;
}

interface CommentReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export interface Comment {
  id: string;
  content: string;
  author: CommentAuthor;
  createdAt: Date;
  updatedAt?: Date;
  parentId?: string;
  replies?: Comment[];
  reactions: CommentReaction[];
  isEdited?: boolean;
  isPinned?: boolean;
  isApproved?: boolean;
}

interface CommentSystemProps {
  postId: string;
  comments: Comment[];
  currentUser?: CommentAuthor | null;
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  onEditComment: (id: string, content: string) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
  onReact: (commentId: string, emoji: string) => Promise<void>;
  onReport?: (commentId: string, reason: string) => Promise<void>;
  onPin?: (commentId: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Main Comment System Component
 */
export default function CommentSystem({
  postId,
  comments,
  currentUser,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onReact,
  onReport,
  onPin,
  isLoading = false,
}: CommentSystemProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Handle submit new comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setSubmitting(true);
    try {
      await onAddComment(newComment, replyingTo || undefined);
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Sort comments: pinned first, then by date
  const sortedComments = [...comments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const topLevelComments = sortedComments.filter((c) => !c.parentId);

  return (
    <section aria-label="Kommentare" className="mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          Kommentare ({comments.length})
        </h2>
      </div>

      {/* Comment Form */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <CommentAvatar author={currentUser} size="md" />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Schreibe einen Kommentar..."
                rows={3}
                className="
                  w-full px-4 py-3 
                  bg-zinc-800 border border-zinc-700 
                  rounded-lg text-white 
                  placeholder-gray-500 resize-none
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
                "
                aria-label="Neuer Kommentar"
              />
              <div className="flex justify-between items-center mt-3">
                <p className="text-sm text-gray-400">
                  Markdown wird unterstützt
                </p>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="
                    px-6 py-2 
                    bg-red-600 hover:bg-red-700 
                    text-white font-medium 
                    rounded-lg transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black
                  "
                >
                  {submitting ? 'Wird gesendet...' : 'Kommentieren'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-6 bg-zinc-800/50 rounded-lg text-center">
          <p className="text-gray-400">
            Bitte{' '}
            <a href="/login" className="text-red-500 hover:underline">
              melde dich an
            </a>
            , um einen Kommentar zu schreiben.
          </p>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      ) : topLevelComments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>Noch keine Kommentare. Sei der Erste!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {topLevelComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              allComments={comments}
              onReply={(id) => setReplyingTo(id)}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
              onReact={onReact}
              onReport={onReport}
              onPin={onPin}
              replyingTo={replyingTo}
              editingId={editingId}
              setEditingId={setEditingId}
              onAddComment={onAddComment}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Individual Comment Card
 */
interface CommentCardProps {
  comment: Comment;
  currentUser?: CommentAuthor | null;
  allComments: Comment[];
  onReply: (id: string) => void;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReact: (commentId: string, emoji: string) => Promise<void>;
  onReport?: (commentId: string, reason: string) => Promise<void>;
  onPin?: (commentId: string) => Promise<void>;
  replyingTo: string | null;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  depth?: number;
}

function CommentCard({
  comment,
  currentUser,
  allComments,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onReport,
  onPin,
  replyingTo,
  editingId,
  setEditingId,
  onAddComment,
  depth = 0,
}: CommentCardProps) {
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isOwner = currentUser?.id === comment.author.id;
  const isAdmin = currentUser?.isAdmin;
  const canModerate = isOwner || isAdmin;

  // Get replies to this comment
  const replies = allComments.filter((c) => c.parentId === comment.id);

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!editContent.trim()) return;
    setSubmitting(true);
    try {
      await onEdit(comment.id, editContent);
      setEditingId(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle reply submit
  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await onAddComment(replyContent, comment.id);
      setReplyContent('');
      onReply('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article
      className={`
        ${depth > 0 ? 'ml-8 md:ml-12 pl-4 border-l-2 border-zinc-700' : ''}
        ${comment.isPinned ? 'bg-zinc-800/30 p-4 rounded-lg -ml-4' : ''}
      `}
      aria-label={`Kommentar von ${comment.author.name}`}
    >
      {/* Pinned indicator */}
      {comment.isPinned && (
        <div className="flex items-center gap-2 text-red-500 text-sm mb-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.617 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.018 1 1 0 01-.285-1.05l1.715-5.349L10 6.417V16h2a1 1 0 110 2H8a1 1 0 110-2h2V6.417L6.237 7.583l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.018 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" />
          </svg>
          <span>Angepinnter Kommentar</span>
        </div>
      )}

      <div className="flex gap-4">
        <CommentAvatar author={comment.author} size="md" />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white">{comment.author.name}</span>
            {comment.author.isAdmin && (
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                Admin
              </span>
            )}
            <span className="text-gray-500 text-sm">
              {format(new Date(comment.createdAt), 'dd. MMM yyyy, HH:mm', {
                locale: de,
              })}
            </span>
            {comment.isEdited && (
              <span className="text-gray-500 text-sm italic">(bearbeitet)</span>
            )}
          </div>

          {/* Content */}
          {editingId === comment.id ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="
                  w-full px-4 py-3 
                  bg-zinc-800 border border-zinc-700 
                  rounded-lg text-white resize-none
                  focus:outline-none focus:ring-2 focus:ring-red-500
                "
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleEditSubmit}
                  disabled={submitting}
                  className="
                    px-4 py-1.5 bg-red-600 hover:bg-red-700 
                    text-white text-sm rounded-lg transition-colors
                    disabled:opacity-50
                  "
                >
                  {submitting ? 'Speichern...' : 'Speichern'}
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditContent(comment.content);
                  }}
                  className="
                    px-4 py-1.5 bg-zinc-700 hover:bg-zinc-600 
                    text-white text-sm rounded-lg transition-colors
                  "
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-gray-300 whitespace-pre-wrap break-words">
              {comment.content}
            </div>
          )}

          {/* Reactions */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {comment.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => onReact(comment.id, reaction.emoji)}
                className={`
                  flex items-center gap-1 px-2 py-1 
                  rounded-full text-sm transition-colors
                  ${
                    reaction.hasReacted
                      ? 'bg-red-600/20 text-red-400 border border-red-600/50'
                      : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 border border-transparent'
                  }
                `}
                aria-label={`${reaction.emoji} ${reaction.count} Reaktionen`}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
            <ReactionPicker onSelect={(emoji) => onReact(comment.id, emoji)} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3">
            {currentUser && depth < 3 && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Antworten
              </button>
            )}

            {canModerate && (
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                  aria-expanded={showActions}
                  aria-haspopup="menu"
                >
                  •••
                </button>
                {showActions && (
                  <div
                    className="
                      absolute left-0 top-full mt-1 
                      bg-zinc-800 border border-zinc-700 
                      rounded-lg shadow-lg z-10 min-w-[140px]
                    "
                    role="menu"
                  >
                    {isOwner && (
                      <button
                        onClick={() => {
                          setEditingId(comment.id);
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-700 transition-colors"
                        role="menuitem"
                      >
                        Bearbeiten
                      </button>
                    )}
                    {isAdmin && onPin && (
                      <button
                        onClick={() => {
                          onPin(comment.id);
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-700 transition-colors"
                        role="menuitem"
                      >
                        {comment.isPinned ? 'Nicht mehr anpinnen' : 'Anpinnen'}
                      </button>
                    )}
                    {canModerate && (
                      <button
                        onClick={() => {
                          if (confirm('Möchtest du diesen Kommentar wirklich löschen?')) {
                            onDelete(comment.id);
                          }
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-zinc-700 transition-colors"
                        role="menuitem"
                      >
                        Löschen
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isOwner && onReport && (
              <button
                onClick={() => {
                  const reason = prompt('Grund für die Meldung:');
                  if (reason) onReport(comment.id, reason);
                }}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                Melden
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && currentUser && (
            <div className="mt-4 flex gap-3">
              <CommentAvatar author={currentUser} size="sm" />
              <div className="flex-1">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Antwort an @${comment.author.name}...`}
                  rows={2}
                  className="
                    w-full px-4 py-2 
                    bg-zinc-800 border border-zinc-700 
                    rounded-lg text-white text-sm resize-none
                    focus:outline-none focus:ring-2 focus:ring-red-500
                  "
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleReplySubmit}
                    disabled={!replyContent.trim() || submitting}
                    className="
                      px-4 py-1.5 bg-red-600 hover:bg-red-700 
                      text-white text-sm rounded-lg transition-colors
                      disabled:opacity-50
                    "
                  >
                    {submitting ? 'Antworten...' : 'Antworten'}
                  </button>
                  <button
                    onClick={() => {
                      onReply('');
                      setReplyContent('');
                    }}
                    className="
                      px-4 py-1.5 bg-zinc-700 hover:bg-zinc-600 
                      text-white text-sm rounded-lg transition-colors
                    "
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {replies.length > 0 && (
        <div className="mt-6 space-y-6">
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              allComments={allComments}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReact={onReact}
              onReport={onReport}
              onPin={onPin}
              replyingTo={replyingTo}
              editingId={editingId}
              setEditingId={setEditingId}
              onAddComment={onAddComment}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </article>
  );
}

/**
 * Comment Avatar Component
 */
interface CommentAvatarProps {
  author: CommentAuthor;
  size?: 'sm' | 'md' | 'lg';
}

function CommentAvatar({ author, size = 'md' }: CommentAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  if (author.avatar) {
    return (
      <img
        src={author.avatar}
        alt={`Avatar von ${author.name}`}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  // Generate initials
  const initials = author.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        bg-gradient-to-br from-red-600 to-red-800 
        flex items-center justify-center 
        text-white font-medium
      `}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

/**
 * Reaction Picker
 */
interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
}

function ReactionPicker({ onSelect }: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-8 h-8 
          flex items-center justify-center 
          rounded-full bg-zinc-800 hover:bg-zinc-700 
          text-gray-400 transition-colors
        "
        aria-label="Reaktion hinzufügen"
        aria-expanded={isOpen}
      >
        +
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="
              absolute bottom-full left-0 mb-2 
              flex gap-1 p-2 
              bg-zinc-800 border border-zinc-700 
              rounded-lg shadow-lg z-20
            "
          >
            {reactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onSelect(emoji);
                  setIsOpen(false);
                }}
                className="
                  w-8 h-8 
                  flex items-center justify-center 
                  rounded hover:bg-zinc-700 
                  transition-colors text-lg
                "
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Comment Skeleton Loader
 */
function CommentSkeleton() {
  return (
    <div className="flex gap-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-zinc-700" />
      <div className="flex-1">
        <div className="flex gap-2 mb-2">
          <div className="h-4 w-24 bg-zinc-700 rounded" />
          <div className="h-4 w-32 bg-zinc-700 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-zinc-700 rounded" />
          <div className="h-4 w-3/4 bg-zinc-700 rounded" />
        </div>
        <div className="flex gap-2 mt-3">
          <div className="h-6 w-12 bg-zinc-700 rounded-full" />
          <div className="h-6 w-12 bg-zinc-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export { CommentCard, CommentAvatar, ReactionPicker, CommentSkeleton };
