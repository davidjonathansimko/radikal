// Newsletter Subscribe Component / Newsletter-Abonnieren-Komponente / Componentă Abonare Newsletter
// Allows users to subscribe to email notifications for new blog posts
// Ermöglicht Benutzern, E-Mail-Benachrichtigungen für neue Blog-Posts zu abonnieren
// Permite utilizatorilor să se aboneze la notificări email pentru bloguri noi

'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useLanguage } from '@/hooks/useLanguage';
import { FaBell, FaBellSlash, FaEnvelope, FaCheck, FaTimes } from 'react-icons/fa';

// Translations / Übersetzungen / Traduceri
const translations = {
  title: {
    de: 'Blog-Benachrichtigungen',
    en: 'Blog Notifications',
    ro: 'Notificări Blog',
    ru: 'Уведомления о блоге'
  },
  description: {
    de: 'Erhalte eine E-Mail, wenn ein neuer Blog-Beitrag veröffentlicht wird.',
    en: 'Get an email when a new blog post is published.',
    ro: 'Primește un email când un blog nou este publicat.',
    ru: 'Получите email, когда будет опубликован новый пост.'
  },
  emailPlaceholder: {
    de: 'Deine E-Mail-Adresse',
    en: 'Your email address',
    ro: 'Adresa ta de email',
    ru: 'Ваш email адрес'
  },
  subscribeButton: {
    de: 'Abonnieren',
    en: 'Subscribe',
    ro: 'Abonează-te',
    ru: 'Подписаться'
  },
  unsubscribeButton: {
    de: 'Abmelden',
    en: 'Unsubscribe',
    ro: 'Dezabonează-te',
    ru: 'Отписаться'
  },
  subscribing: {
    de: 'Wird abonniert...',
    en: 'Subscribing...',
    ro: 'Se abonează...',
    ru: 'Подписка...'
  },
  successSubscribed: {
    de: 'Erfolgreich abonniert! Du erhältst jetzt Benachrichtigungen.',
    en: 'Successfully subscribed! You will now receive notifications.',
    ro: 'Abonat cu succes! Vei primi acum notificări.',
    ru: 'Успешно подписаны! Теперь вы будете получать уведомления.'
  },
  successUnsubscribed: {
    de: 'Erfolgreich abgemeldet. Du erhältst keine Benachrichtigungen mehr.',
    en: 'Successfully unsubscribed. You will no longer receive notifications.',
    ro: 'Dezabonat cu succes. Nu vei mai primi notificări.',
    ru: 'Успешно отписаны. Вы больше не будете получать уведомления.'
  },
  alreadySubscribed: {
    de: 'Du bist bereits abonniert!',
    en: 'You are already subscribed!',
    ro: 'Ești deja abonat!',
    ru: 'Вы уже подписаны!'
  },
  errorGeneric: {
    de: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
    en: 'An error occurred. Please try again.',
    ro: 'A apărut o eroare. Te rog încearcă din nou.',
    ru: 'Произошла ошибка. Пожалуйста, попробуйте снова.'
  },
  invalidEmail: {
    de: 'Bitte gib eine gültige E-Mail-Adresse ein.',
    en: 'Please enter a valid email address.',
    ro: 'Te rog introdu o adresă de email validă.',
    ru: 'Пожалуйста, введите действительный email адрес.'
  },
  currentlySubscribed: {
    de: 'Du erhältst Benachrichtigungen',
    en: 'You are receiving notifications',
    ro: 'Primești notificări',
    ru: 'Вы получаете уведомления'
  }
};

interface NewsletterSubscribeProps {
  className?: string;
  variant?: 'inline' | 'card' | 'minimal';
}

export default function NewsletterSubscribe({ className = '', variant = 'card' }: NewsletterSubscribeProps) {
  const { language } = useLanguage();
  const supabase = createClient();
  
  // State / Zustand / Stare
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Check current subscription status / Aktuellen Abonnement-Status prüfen / Verifică statusul curent al abonamentului
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        // Get current user / Aktuellen Benutzer abrufen / Obține utilizatorul curent
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email) {
          setUserEmail(user.email);
          setEmail(user.email);
          
          // Check if already subscribed / Prüfen ob bereits abonniert / Verifică dacă este deja abonat
          const { data, error } = await supabase
            .from('newsletter_subscribers')
            .select('is_active')
            .eq('email', user.email)
            .single();
          
          if (data && !error) {
            setIsSubscribed(data.is_active);
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkSubscriptionStatus();
  }, [supabase]);

  // Validate email / E-Mail validieren / Validează email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle subscribe / Abonnieren verarbeiten / Procesează abonarea
  const handleSubscribe = async () => {
    // Validate email / E-Mail validieren / Validează email
    if (!isValidEmail(email)) {
      setMessage({ type: 'error', text: translations.invalidEmail[language] });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Get current user for user_id / Aktuellen Benutzer für user_id abrufen / Obține utilizatorul curent pentru user_id
      const { data: { user } } = await supabase.auth.getUser();

      // Check if already exists / Prüfen ob bereits existiert / Verifică dacă există deja
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id, is_active')
        .eq('email', email)
        .single();

      if (existing) {
        if (existing.is_active) {
          setMessage({ type: 'success', text: translations.alreadySubscribed[language] });
          setIsSubscribed(true);
        } else {
          // Reactivate subscription / Abonnement reaktivieren / Reactivează abonamentul
          const { error } = await supabase
            .from('newsletter_subscribers')
            .update({ is_active: true, language })
            .eq('id', existing.id);

          if (error) throw error;
          
          setMessage({ type: 'success', text: translations.successSubscribed[language] });
          setIsSubscribed(true);
        }
      } else {
        // Create new subscription / Neues Abonnement erstellen / Creează abonament nou
        const { error } = await supabase
          .from('newsletter_subscribers')
          .insert({
            email,
            language,
            user_id: user?.id || null,
            is_active: true
          });

        if (error) throw error;
        
        setMessage({ type: 'success', text: translations.successSubscribed[language] });
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      setMessage({ type: 'error', text: translations.errorGeneric[language] });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle unsubscribe / Abmelden verarbeiten / Procesează dezabonarea
  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ is_active: false })
        .eq('email', email);

      if (error) throw error;
      
      setMessage({ type: 'success', text: translations.successUnsubscribed[language] });
      setIsSubscribed(false);
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setMessage({ type: 'error', text: translations.errorGeneric[language] });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state / Ladezustand / Stare de încărcare
  if (isCheckingStatus) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-12 bg-black/10 dark:bg-white/10 rounded-lg"></div>
      </div>
    );
  }

  // Minimal variant / Minimale Variante / Variantă minimală
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isSubscribed ? (
          <button
            onClick={handleUnsubscribe}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            <FaBell className="w-4 h-4" />
            <span>{translations.currentlySubscribed[language]}</span>
          </button>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={isLoading || !userEmail}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-black/10 dark:bg-white/10 text-black dark:text-white rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <FaBellSlash className="w-4 h-4" />
            <span>{translations.subscribeButton[language]}</span>
          </button>
        )}
      </div>
    );
  }

  // Card variant (default) / Karten-Variante / Variantă card
  return (
    <div className={`glass-effect rounded-2xl p-6 ${className}`}>
      {/* Title / Titel / Titlu */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-black/10 dark:bg-white/10 rounded-lg">
          <FaBell className="w-5 h-5 text-black dark:text-white" />
        </div>
        <h3 className="text-lg font-semibold text-black dark:text-white">
          {translations.title[language]}
        </h3>
      </div>

      {/* Description / Beschreibung / Descriere */}
      <p className="text-black/70 dark:text-white/70 text-sm mb-4">
        {translations.description[language]}
      </p>

      {/* Subscription status / Abonnement-Status / Status abonament */}
      {isSubscribed ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-500 dark:text-green-400">
            <FaCheck className="w-4 h-4" />
            <span className="text-sm font-medium">{translations.currentlySubscribed[language]}</span>
          </div>
          <p className="text-xs text-black/50 dark:text-white/50">{email}</p>
          <button
            onClick={handleUnsubscribe}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-500 dark:text-red-400 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
            ) : (
              <>
                <FaBellSlash className="w-4 h-4" />
                {translations.unsubscribeButton[language]}
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Email input / E-Mail-Eingabe / Input email */}
          {!userEmail && (
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={translations.emailPlaceholder[language]}
                className="w-full pl-10 pr-4 py-2.5 bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:border-black/40 dark:focus:border-white/40 transition-colors"
              />
            </div>
          )}

          {/* Subscribe button / Abonnieren-Button / Buton abonare */}
          <button
            onClick={handleSubscribe}
            disabled={isLoading || (!userEmail && !email)}
            className="w-full py-2.5 px-4 bg-black/20 dark:bg-white/20 hover:bg-black/30 dark:hover:bg-white/30 text-black dark:text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 dark:border-white/30 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                {translations.subscribing[language]}
              </>
            ) : (
              <>
                <FaBell className="w-4 h-4" />
                {translations.subscribeButton[language]}
              </>
            )}
          </button>
        </div>
      )}

      {/* Message / Nachricht / Mesaj */}
      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-500 dark:text-green-400' 
            : 'bg-red-500/20 text-red-500 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <FaCheck className="w-4 h-4" /> : <FaTimes className="w-4 h-4" />}
          {message.text}
        </div>
      )}
    </div>
  );
}
