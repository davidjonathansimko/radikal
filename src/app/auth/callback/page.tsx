// Auth callback page for OAuth providers / Auth-Callback-Seite für OAuth-Anbieter
// This handles the redirect after OAuth authentication (GitHub, etc.)
// Dies behandelt die Weiterleitung nach OAuth-Authentifizierung (GitHub, etc.)

'use client';

import { useEffect, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useLanguage } from '@/hooks/useLanguage';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClient();
 const { t,language } = useLanguage();

  // Keep nav/footer hidden on auth callback page
  useLayoutEffect(() => {
    document.body.classList.add('modal-active');
    return () => {
      // Pasul 12005: Don't remove if redirecting after successful auth
      if (!document.body.dataset.loginSuccess) {
        document.body.classList.remove('modal-active');
      }
    };
  }, []);

  useEffect(() => {
    // Handle the OAuth callback / OAuth-Callback behandeln
    const handleAuthCallback = async () => {
      try {
        // Get the auth token from URL fragments / Auth-Token aus URL-Fragmenten abrufen
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/auth/login?error=callback_error');
          return;
        }

        if (data.session) {
          // User is authenticated, redirect to home / Benutzer ist authentifiziert, zur Startseite weiterleiten
          document.body.dataset.loginSuccess = 'true';
          // Transfer pending language from WelcomeModal to persistent localStorage
          const pendingLang = sessionStorage.getItem('radikalPendingLanguage');
          if (pendingLang) {
            localStorage.setItem('radikalSelectedLanguage', pendingLang);
            sessionStorage.removeItem('radikalPendingLanguage');
          }
          router.push('/');
        } else {
          // No session found, redirect to login / Keine Session gefunden, zur Anmeldung weiterleiten
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        router.push('/auth/login?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router, supabase.auth]);

  // Show loading spinner while processing / Lade-Spinner während der Verarbeitung anzeigen
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          {language==='de' ? 'Authentifizierung wird verarbeitet...' : 
          language === 'en' ? 'Authenticating...' : 
          language === 'ro' ? 'Se procesează autentificarea...' : 
          'Аутентификация выполняется...'}
        </h2>
        <p className="text-white/60">
          {language==='de' ? 'Bitte warten, du wirst automatisch weitergeleitet.' : 
          language === 'en' ? 'Please wait, you will be redirected automatically.' : 
          language === 'ro' ? 'Te rugăm să aștepți, vei fi redirecționat automat.' : 
          'Пожалуйста, подождите, вы будете автоматически перенаправлены.'}
        </p>
      </div>
    </div>
  );
}
