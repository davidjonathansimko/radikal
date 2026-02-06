// Comment Moderation Panel / Kommentar-Moderationspanel / Panou Moderare Comentarii
// Admin panel for moderating comments
// Admin-Panel zur Moderation von Kommentaren
// Panou admin pentru moderarea comentariilor

'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface PendingComment {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  postTitle: string;
  postSlug: string;
  createdAt: Date;
  reportCount?: number;
  reportReasons?: string[];
}

interface ModerationPanelProps {
  pendingComments: PendingComment[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onBanUser: (email: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Comment Moderation Panel for Admins
 */
export default function ModerationPanel({
  pendingComments,
  onApprove,
  onReject,
  onBanUser,
  isLoading = false,
}: ModerationPanelProps) {
  const [filter, setFilter] = useState<'pending' | 'reported'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);

  const filteredComments = pendingComments.filter((c) =>
    filter === 'reported' ? (c.reportCount || 0) > 0 : true
  );

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await onApprove(id);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    try {
      await onReject(id);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Kommentar-Moderation</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${filter === 'pending' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-zinc-800 text-gray-400 hover:text-white'
                }
              `}
            >
              Ausstehend ({pendingComments.length})
            </button>
            <button
              onClick={() => setFilter('reported')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${filter === 'reported' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-zinc-800 text-gray-400 hover:text-white'
                }
              `}
            >
              Gemeldet ({pendingComments.filter(c => (c.reportCount || 0) > 0).length})
            </button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="divide-y divide-zinc-800">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">
            Wird geladen...
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Keine Kommentare zur Moderation
          </div>
        ) : (
          filteredComments.map((comment) => (
            <ModerationItem
              key={comment.id}
              comment={comment}
              onApprove={() => handleApprove(comment.id)}
              onReject={() => handleReject(comment.id)}
              onBanUser={() => onBanUser(comment.authorEmail)}
              isProcessing={processing === comment.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Single Moderation Item
 */
interface ModerationItemProps {
  comment: PendingComment;
  onApprove: () => void;
  onReject: () => void;
  onBanUser: () => void;
  isProcessing: boolean;
}

function ModerationItem({
  comment,
  onApprove,
  onReject,
  onBanUser,
  isProcessing,
}: ModerationItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-medium text-white">{comment.authorName}</span>
            <span className="text-gray-500 text-sm">{comment.authorEmail}</span>
            {comment.reportCount && comment.reportCount > 0 && (
              <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded-full">
                {comment.reportCount} Meldungen
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-400 mb-2">
            Am{' '}
            <a
              href={`/blog/${comment.postSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-500 hover:underline"
            >
              {comment.postTitle}
            </a>
            {' · '}
            {format(new Date(comment.createdAt), 'dd. MMM yyyy, HH:mm', {
              locale: de,
            })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={isProcessing}
            className="
              px-4 py-2 
              bg-green-600 hover:bg-green-700 
              text-white text-sm font-medium 
              rounded-lg transition-colors
              disabled:opacity-50
            "
            aria-label="Kommentar genehmigen"
          >
            ✓
          </button>
          <button
            onClick={onReject}
            disabled={isProcessing}
            className="
              px-4 py-2 
              bg-red-600 hover:bg-red-700 
              text-white text-sm font-medium 
              rounded-lg transition-colors
              disabled:opacity-50
            "
            aria-label="Kommentar ablehnen"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-4 p-4 bg-zinc-800/50 rounded-lg">
        <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
      </div>

      {/* Report Reasons */}
      {comment.reportReasons && comment.reportReasons.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {expanded ? '▼' : '▶'} Meldegründe anzeigen
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1">
              {comment.reportReasons.map((reason, index) => (
                <li key={index} className="text-sm text-gray-400 pl-4">
                  • {reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Ban User Option */}
      <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-end">
        <button
          onClick={() => {
            if (confirm(`Benutzer ${comment.authorEmail} wirklich sperren?`)) {
              onBanUser();
            }
          }}
          className="
            text-sm text-gray-500 hover:text-red-500 
            transition-colors
          "
        >
          Benutzer sperren
        </button>
      </div>
    </article>
  );
}

/**
 * Spam Detection Utility
 */
export function detectSpam(content: string): {
  isSpam: boolean;
  reasons: string[];
  score: number;
} {
  const reasons: string[] = [];
  let score = 0;

  // Check for common spam patterns
  const spamPatterns = [
    { pattern: /https?:\/\/[^\s]+/gi, reason: 'Enthält Links', weight: 2 },
    { pattern: /viagra|cialis|casino|lottery/gi, reason: 'Spam-Wörter', weight: 5 },
    { pattern: /(.)\1{5,}/g, reason: 'Wiederholte Zeichen', weight: 3 },
    { pattern: /[A-Z]{10,}/g, reason: 'Übermäßige Großschreibung', weight: 2 },
    { pattern: /\$\d+/g, reason: 'Geldbeträge', weight: 2 },
    { pattern: /free\s+money|earn\s+cash/gi, reason: 'Geld-Spam', weight: 4 },
    { pattern: /click\s+here|check\s+this/gi, reason: 'Klick-Aufforderung', weight: 3 },
  ];

  spamPatterns.forEach(({ pattern, reason, weight }) => {
    if (pattern.test(content)) {
      reasons.push(reason);
      score += weight;
    }
  });

  // Check content length
  if (content.length < 5) {
    reasons.push('Zu kurz');
    score += 2;
  }

  if (content.length > 10000) {
    reasons.push('Zu lang');
    score += 2;
  }

  // Check for excessive emoji (simplified regex for ES5 compatibility)
  const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]+/g;
  const emojiMatches = content.match(emojiRegex) || [];
  const emojiCount = emojiMatches.length;
  if (emojiCount > 10) {
    reasons.push('Zu viele Emojis');
    score += 2;
  }

  return {
    isSpam: score >= 5,
    reasons,
    score,
  };
}

/**
 * Comment Notification Settings
 */
interface NotificationSettingsProps {
  settings: {
    emailOnNewComment: boolean;
    emailOnReply: boolean;
    emailOnReport: boolean;
    autoApprove: boolean;
    spamFiltering: boolean;
  };
  onUpdate: (settings: NotificationSettingsProps['settings']) => void;
}

export function NotificationSettings({
  settings,
  onUpdate,
}: NotificationSettingsProps) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        Benachrichtigungseinstellungen
      </h3>

      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.emailOnNewComment}
            onChange={(e) =>
              onUpdate({ ...settings, emailOnNewComment: e.target.checked })
            }
            className="w-5 h-5 rounded bg-zinc-800 border-zinc-600 text-red-500 focus:ring-red-500"
          />
          <span className="text-gray-300">
            E-Mail bei neuen Kommentaren
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.emailOnReply}
            onChange={(e) =>
              onUpdate({ ...settings, emailOnReply: e.target.checked })
            }
            className="w-5 h-5 rounded bg-zinc-800 border-zinc-600 text-red-500 focus:ring-red-500"
          />
          <span className="text-gray-300">
            E-Mail bei Antworten auf Kommentare
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.emailOnReport}
            onChange={(e) =>
              onUpdate({ ...settings, emailOnReport: e.target.checked })
            }
            className="w-5 h-5 rounded bg-zinc-800 border-zinc-600 text-red-500 focus:ring-red-500"
          />
          <span className="text-gray-300">
            E-Mail bei gemeldeten Kommentaren
          </span>
        </label>

        <div className="border-t border-zinc-800 pt-4 mt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoApprove}
              onChange={(e) =>
                onUpdate({ ...settings, autoApprove: e.target.checked })
              }
              className="w-5 h-5 rounded bg-zinc-800 border-zinc-600 text-red-500 focus:ring-red-500"
            />
            <span className="text-gray-300">
              Kommentare automatisch genehmigen
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer mt-4">
            <input
              type="checkbox"
              checked={settings.spamFiltering}
              onChange={(e) =>
                onUpdate({ ...settings, spamFiltering: e.target.checked })
              }
              className="w-5 h-5 rounded bg-zinc-800 border-zinc-600 text-red-500 focus:ring-red-500"
            />
            <span className="text-gray-300">
              Spam-Filter aktivieren
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

export { ModerationItem };
