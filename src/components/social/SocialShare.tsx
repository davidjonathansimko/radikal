// Enhanced Social Sharing / Erweiterte Social Sharing / Partajare Socială Îmbunătățită
// Social media sharing with tracking and customization
// Social-Media-Teilen mit Tracking und Anpassung
// Partajare social media cu tracking și personalizare

'use client';

import React, { useState, useCallback } from 'react';

// Social platforms configuration
interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  shareUrl: (url: string, title: string, text?: string) => string;
  supportsNativeShare?: boolean;
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'twitter',
    name: 'X (Twitter)',
    color: '#000000',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    shareUrl: (url, title) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    shareUrl: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    shareUrl: (url, title) =>
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    color: '#25D366',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    shareUrl: (url, title) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    color: '#0088CC',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    shareUrl: (url, title) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    id: 'email',
    name: 'E-Mail',
    color: '#666666',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    shareUrl: (url, title, text) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text || title}\n\n${url}`)}`,
  },
];

interface SocialShareProps {
  url: string;
  title: string;
  text?: string;
  platforms?: string[];
  onShare?: (platform: string) => void;
  variant?: 'horizontal' | 'vertical' | 'compact';
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Social Share Component
 */
export default function SocialShare({
  url,
  title,
  text,
  platforms = ['twitter', 'facebook', 'linkedin', 'whatsapp', 'email'],
  onShare,
  variant = 'horizontal',
  showLabels = true,
  size = 'md',
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [shareCount, setShareCount] = useState<Record<string, number>>({});

  // Filter platforms
  const activePlatforms = SOCIAL_PLATFORMS.filter((p) =>
    platforms.includes(p.id)
  );

  // Handle share
  const handleShare = useCallback(
    async (platform: SocialPlatform) => {
      // Try native share first for mobile
      if (navigator.share && platform.supportsNativeShare !== false) {
        try {
          await navigator.share({
            title,
            text,
            url,
          });
          onShare?.(platform.id);
          return;
        } catch {
          // User cancelled or not supported, fall through to URL share
        }
      }

      // Open share URL
      const shareUrl = platform.shareUrl(url, title, text);
      window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
      
      onShare?.(platform.id);
      
      // Update local share count
      setShareCount((prev) => ({
        ...prev,
        [platform.id]: (prev[platform.id] || 0) + 1,
      }));
    },
    [url, title, text, onShare]
  );

  // Copy link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShare?.('copy');
    } catch {
      console.error('Failed to copy link');
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  // Variant classes
  const containerClasses = {
    horizontal: 'flex flex-wrap gap-2',
    vertical: 'flex flex-col gap-2',
    compact: 'flex gap-1',
  };

  return (
    <div className={containerClasses[variant]} role="group" aria-label="Teilen">
      {activePlatforms.map((platform) => (
        <button
          key={platform.id}
          onClick={() => handleShare(platform)}
          className={`
            ${sizeClasses[size]}
            inline-flex items-center justify-center gap-2
            rounded-lg transition-all duration-200
            hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black
            ${variant === 'compact' ? '' : 'p-2'}
          `}
          style={{
            backgroundColor: platform.color,
            color: 'white',
          }}
          aria-label={`Auf ${platform.name} teilen`}
          title={`Auf ${platform.name} teilen`}
        >
          {platform.icon}
          {showLabels && variant !== 'compact' && (
            <span className="hidden sm:inline text-sm">{platform.name}</span>
          )}
        </button>
      ))}

      {/* Copy Link Button */}
      <button
        onClick={handleCopyLink}
        className={`
          ${sizeClasses[size]}
          inline-flex items-center justify-center gap-2
          bg-zinc-700 hover:bg-zinc-600 text-white
          rounded-lg transition-all duration-200
          hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black
          ${variant === 'compact' ? '' : 'p-2'}
        `}
        aria-label="Link kopieren"
        title={copied ? 'Kopiert!' : 'Link kopieren'}
      >
        {copied ? (
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
        {showLabels && variant !== 'compact' && (
          <span className="hidden sm:inline text-sm">
            {copied ? 'Kopiert!' : 'Link'}
          </span>
        )}
      </button>
    </div>
  );
}

/**
 * Floating Share Button
 */
interface FloatingShareButtonProps {
  url: string;
  title: string;
  text?: string;
  position?: 'left' | 'right';
}

export function FloatingShareButton({
  url,
  title,
  text,
  position = 'left',
}: FloatingShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`
        fixed top-1/2 -translate-y-1/2 z-40
        ${position === 'left' ? 'left-4' : 'right-4'}
      `}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-12 h-12 
          bg-red-600 hover:bg-red-700 
          text-white rounded-full shadow-lg
          flex items-center justify-center
          transition-transform duration-200
          hover:scale-110
        "
        aria-expanded={isOpen}
        aria-label="Teilen"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`
              absolute top-0 mt-14
              bg-zinc-900 rounded-lg shadow-xl p-3 border border-zinc-800
              ${position === 'left' ? 'left-0' : 'right-0'}
            `}
          >
            <SocialShare
              url={url}
              title={title}
              text={text}
              variant="vertical"
              showLabels={false}
              size="md"
              onShare={() => setIsOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Share Count Display
 */
interface ShareCountsProps {
  counts: Record<string, number>;
}

export function ShareCounts({ counts }: ShareCountsProps) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      <span>{total} mal geteilt</span>
    </div>
  );
}

/**
 * Native Share Hook
 */
export function useNativeShare() {
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const share = useCallback(
    async (data: { title: string; text?: string; url: string }) => {
      if (!canShare) {
        throw new Error('Native sharing not supported');
      }

      await navigator.share(data);
    },
    [canShare]
  );

  return { canShare, share };
}

export { SOCIAL_PLATFORMS };
