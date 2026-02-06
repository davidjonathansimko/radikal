// Share Buttons Component / Teilen-Buttons-Komponente / Componenta Butoane Distribuire
// Social media sharing buttons with copy link functionality
// Social Media Teilen-Buttons mit Link-Kopierfunktion
// Butoane pentru distribuire pe social media cu funcționalitate de copiere link

'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  FaTwitter, 
  FaFacebookF, 
  FaLinkedinIn, 
  FaWhatsapp, 
  FaTelegram,
  FaEnvelope,
  FaLink,
  FaCheck,
  FaShare
} from 'react-icons/fa';

// Translations / Übersetzungen
const translations = {
  de: {
    share: 'Teilen',
    copyLink: 'Link kopieren',
    copied: 'Kopiert!',
    shareOn: 'Teilen auf',
    shareVia: 'Teilen via'
  },
  en: {
    share: 'Share',
    copyLink: 'Copy link',
    copied: 'Copied!',
    shareOn: 'Share on',
    shareVia: 'Share via'
  },
  ro: {
    share: 'Distribuie',
    copyLink: 'Copiază linkul',
    copied: 'Copiat!',
    shareOn: 'Distribuie pe',
    shareVia: 'Distribuie prin'
  },
  ru: {
    share: 'Поделиться',
    copyLink: 'Копировать ссылку',
    copied: 'Скопировано!',
    shareOn: 'Поделиться в',
    shareVia: 'Поделиться через'
  }
};

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  // Visual variants / Visuelle Varianten
  variant?: 'horizontal' | 'vertical' | 'minimal';
  // Size options / Größenoptionen
  size?: 'sm' | 'md' | 'lg';
  // Show labels / Labels anzeigen
  showLabels?: boolean;
  // Custom class / Benutzerdefinierte Klasse
  className?: string;
}

// Social platforms configuration / Konfiguration der sozialen Plattformen
const socialPlatforms = [
  {
    name: 'Twitter',
    icon: FaTwitter,
    color: 'hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2]',
    getUrl: (url: string, title: string) => 
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  },
  {
    name: 'Facebook',
    icon: FaFacebookF,
    color: 'hover:bg-[#4267B2]/20 hover:text-[#4267B2]',
    getUrl: (url: string) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  },
  {
    name: 'LinkedIn',
    icon: FaLinkedinIn,
    color: 'hover:bg-[#0A66C2]/20 hover:text-[#0A66C2]',
    getUrl: (url: string, title: string) => 
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
  },
  {
    name: 'WhatsApp',
    icon: FaWhatsapp,
    color: 'hover:bg-[#25D366]/20 hover:text-[#25D366]',
    getUrl: (url: string, title: string) => 
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`
  },
  {
    name: 'Telegram',
    icon: FaTelegram,
    color: 'hover:bg-[#0088cc]/20 hover:text-[#0088cc]',
    getUrl: (url: string, title: string) => 
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  },
  {
    name: 'Email',
    icon: FaEnvelope,
    color: 'hover:bg-gray-500/20 hover:text-gray-400',
    getUrl: (url: string, title: string, description?: string) => 
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description || title}\n\n${url}`)}`
  }
];

const ShareButtons: React.FC<ShareButtonsProps> = ({
  url,
  title,
  description,
  variant = 'horizontal',
  size = 'md',
  showLabels = false,
  className = ''
}) => {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.de;
  
  // State for copy link feedback / Status für Link-Kopier-Feedback
  const [copied, setCopied] = useState(false);

  // Size classes / Größenklassen
  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'p-2.5 text-base',
    lg: 'p-3 text-lg'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // Handle share click / Teilen-Klick behandeln
  const handleShare = (platform: typeof socialPlatforms[0]) => {
    const shareUrl = platform.getUrl(url, title, description);
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  // Handle copy link / Link kopieren behandeln
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers / Fallback für ältere Browser
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle native share (mobile) / Native Teilen-Funktion (mobil)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url
        });
      } catch (err) {
        // User cancelled or share failed
      }
    }
  };

  // Layout classes based on variant / Layout-Klassen basierend auf Variante
  const containerClasses = {
    horizontal: 'flex flex-wrap items-center gap-2',
    vertical: 'flex flex-col gap-2',
    minimal: 'flex items-center gap-1'
  };

  // Minimal variant / Minimale Variante
  if (variant === 'minimal') {
    return (
      <div className={`${containerClasses[variant]} ${className}`}>
        {/* Native share button (mobile) / Native Teilen-Button (mobil) */}
        {'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className={`rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all duration-200 ${sizeClasses[size]}`}
            title={t.share}
          >
            <FaShare className={iconSizes[size]} />
          </button>
        )}
        
        {/* Copy link button / Link-Kopier-Button */}
        <button
          onClick={handleCopyLink}
          className={`rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all duration-200 ${sizeClasses[size]} ${copied ? 'text-green-400 bg-green-500/20' : ''}`}
          title={copied ? t.copied : t.copyLink}
        >
          {copied ? <FaCheck className={iconSizes[size]} /> : <FaLink className={iconSizes[size]} />}
        </button>
      </div>
    );
  }

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      {/* Share label / Teilen-Label */}
      {showLabels && (
        <span className="text-sm text-white/60 mr-2">{t.share}:</span>
      )}

      {/* Social platform buttons / Soziale Plattform-Buttons */}
      {socialPlatforms.map((platform) => (
        <button
          key={platform.name}
          onClick={() => handleShare(platform)}
          className={`rounded-full bg-white/10 text-white/60 transition-all duration-200 ${sizeClasses[size]} ${platform.color}`}
          title={`${t.shareOn} ${platform.name}`}
          aria-label={`${t.shareOn} ${platform.name}`}
        >
          <platform.icon className={iconSizes[size]} />
        </button>
      ))}

      {/* Copy link button / Link-Kopier-Button */}
      <button
        onClick={handleCopyLink}
        className={`rounded-full transition-all duration-200 ${sizeClasses[size]} ${
          copied 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
        }`}
        title={copied ? t.copied : t.copyLink}
        aria-label={t.copyLink}
      >
        {copied ? (
          <FaCheck className={iconSizes[size]} />
        ) : (
          <FaLink className={iconSizes[size]} />
        )}
      </button>

      {/* Copied feedback toast / Kopiert-Feedback-Toast */}
      {copied && showLabels && (
        <span className="text-sm text-green-400 animate-fadeIn ml-2">{t.copied}</span>
      )}
    </div>
  );
};

// Floating share button for mobile / Schwebender Teilen-Button für Mobil
interface FloatingShareButtonProps {
  url: string;
  title: string;
  description?: string;
}

export const FloatingShareButton: React.FC<FloatingShareButtonProps> = ({
  url,
  title,
  description
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-40 md:hidden">
      {/* Share options panel / Teilen-Optionen-Panel */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 glass-effect rounded-xl p-3 animate-fadeIn shadow-xl">
          <ShareButtons
            url={url}
            title={title}
            description={description}
            variant="vertical"
            size="md"
          />
        </div>
      )}

      {/* Toggle button / Umschalt-Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-white text-black rotate-45' 
            : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
        }`}
      >
        <FaShare className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
      </button>
    </div>
  );
};

export default ShareButtons;
