// Login page component / Anmelde-Seiten-Komponente
// This provides user authentication with email and GitHub options
// Dies bietet Benutzer-Authentifizierung mit E-Mail- und GitHub-Optionen

'use client';

import React, { useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { createClient } from '@/lib/supabase';
import { FaGoogle, FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function LoginPage() {
  // Get language context and router / Sprachkontext und Router abrufen
  // EXPLANATION: We need both 't' and 'language' from useLanguage hook
  // 't' is for translation function, 'language' tells us current language (de/en)
  const { t, language } = useLanguage();
  const router = useRouter();
  
  // Component state / Komponentenstatus
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Track if login was successful to keep modal-active during redirect
  // Verfolgt ob Login erfolgreich war um modal-active während Weiterleitung beizubehalten
  // Urmărește dacă login-ul a fost reușit pentru a păstra modal-active în timpul redirecționării
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  // Supabase client / Supabase-Client
  const supabase = createClient();

  // Keep nav/footer hidden on auth pages - add modal-active immediately before paint
  // Nav/Footer auf Auth-Seiten versteckt halten - modal-active sofort vor dem Zeichnen hinzufügen
  // Menține nav/footer ascunse pe paginile auth - adaugă modal-active imediat înainte de randare
  useLayoutEffect(() => {
    document.body.classList.add('modal-active');
    return () => {
      // Pasul 12005: Don't remove modal-active if login was successful — the home page will manage it
      // Nicht entfernen wenn Login erfolgreich war — die Startseite verwaltet es
      // Nu elimina dacă login-ul a fost reușit — pagina principală o va gestiona
      if (!document.body.dataset.loginSuccess) {
        document.body.classList.remove('modal-active');
      }
    };
  }, []);

  // Check if user is already authenticated / Prüfen, ob Benutzer bereits authentifiziert ist
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        document.body.dataset.loginSuccess = 'true';
        router.push('/'); // Redirect to home if already logged in / Zur Startseite weiterleiten, wenn bereits angemeldet
      }
    };
    checkUser();
  }, [router, supabase.auth]);

  // Handle email/password login / E-Mail/Passwort-Anmeldung behandeln
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        // Pasul 12005: Mark login as successful so modal-active stays during redirect
        document.body.dataset.loginSuccess = 'true';
        setLoginSuccess(true);
        // Transfer pending language from WelcomeModal to persistent localStorage
        // Übertrage ausstehende Sprache vom WelcomeModal in persistenten localStorage
        // Transferă limba în așteptare din WelcomeModal în localStorage persistent
        const pendingLang = sessionStorage.getItem('radikalPendingLanguage');
        if (pendingLang) {
          localStorage.setItem('radikalSelectedLanguage', pendingLang);
          sessionStorage.removeItem('radikalPendingLanguage');
        }
        router.push('/'); // Redirect to home after successful login / Nach erfolgreicher Anmeldung zur Startseite weiterleiten
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login / Google-Anmeldung behandeln
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError(language === 'de' ? 'Ein Fehler ist bei der Google-Anmeldung aufgetreten.' :
              language === 'en' ? 'An error occurred during Google login.' :
              language === 'ro' ? 'A apărut o eroare la autentificarea cu Google.' :
              'Произошла ошибка при входе через Google.');
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset / Passwort-Reset behandeln
  const handlePasswordReset = async () => {
    if (!email) {
      setError('Bitte gib deine E-Mail-Adresse ein.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage(language === 'de' ? 'Ein Link zum Zurücksetzen des Passworts wurde an deine E-Mail gesendet.' : 
                   language === 'en' ? 'A password reset link has been sent to your email.' : 
                   language === 'ro' ? 'Un link pentru resetarea parolei a fost trimis la email-ul tău.' : 
                   'Ссылка для сброса пароля отправлена на вашу электронную почту.');
      }
    } catch (err) {
      setError(language === 'de' ? 'Ein Fehler ist beim Zurücksetzen des Passworts aufgetreten.' : 
               language === 'en' ? 'An error occurred while resetting the password.' : 
               language === 'ro' ? 'A apărut o eroare la resetarea parolei.' : 
               'Произошла ошибка при сбросе пароля.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
      <div className="max-w-md w-full space-y-4 sm:space-y-6">
        {/* Header / Kopfbereich */}
        <div className="text-center">
          {/* 
            EXPLANATION: Instead of using t('auth.signIn') which shows "signIn" to users,
            we use direct text that's user-friendly in both languages 
          */}
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 animate-fadeIn">
            {language === 'de' ? 'Anmelden' : language === 'en' ? 'Sign In' : language === 'ro' ? 'Conectare' : 'Войти'}
          </h2>
          <p className="text-sm sm:text-base text-white/80 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            {language === 'de' ? 'Willkommen zurück bei RADIKAL.' : 
            language === 'en' ?'Welcome back to RADIKAL.':
            language === 'ro' ? 'Bine ai revenit la RADIKAL.' :
            'С возвращением в RADIKAL.'}
          </p>
        </div>

        {/* Login form / Anmeldeformular */}
        <div className="glass-effect rounded-2xl p-5 sm:p-8 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          {/* Error and success messages / Fehler- und Erfolgsmeldungen */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm">
              {message}
            </div>
          )}

          {/* Google login button / Google-Anmelde-Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 sm:py-3 dark:bg-gray-600 bg-gray-400 hover:bg-gray-300 text-white font-medium rounded-lg transition-colors duration-200 mb-4 sm:mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaGoogle className="text-xl" />
            <span>{language === 'de' ? 'Mit Google anmelden' : language === 'en' ? 'Sign in with Google' : language === 'ro' ? 'Conectare cu Google' : 'Войти с Google'}</span>
          </button>

          {/* Divider / Trenner */}
          <div className="relative my-3 sm:my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black/30 text-white/60">
                {language === 'de' ? 'oder' : 
                 language === 'en' ? 'or' : 
                 language === 'ro' ? 'sau' : 
                 'или'}
              </span>
            </div>
          </div>

          {/* Email login form / E-Mail-Anmeldeformular */}
          <form onSubmit={handleEmailLogin} className="space-y-3 sm:space-y-4">
            {/* Email input / E-Mail-Eingabe */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1 sm:mb-2">
                {/* EXPLANATION: Replace t('auth.email') with actual word "Email" */}
                {language === 'de' ? 'E-Mail' : language === 'en' ? 'Email' : language === 'ro' ? 'Adresa de Email' : 'Email'}
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder= {language === 'de' ?"deine@email.com" : 
                    language === 'en' ? "your@email.com" : 
                    language === 'ro' ? "adresa@email.com" : 
                    "ваша@почта.com"}
                />
              </div>
            </div>

            {/* Password input / Passwort-Eingabe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1 sm:mb-2">
                {/* EXPLANATION: Replace t('auth.password') with actual word "Password" */}
                {language === 'de' ? 'Passwort' : 
                language === 'en' ? 'Password' : 
                language === 'ro' ? 'Parola' : 
                'Пароль'}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pr-10 pl-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Login button / Anmelde-Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full  dark: btn-secondary  disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner w-4 h-4 border-2" />
                  <span>{language === 'de' ? 'Anmeldung läuft...' : 'Signing in...'}</span>
                </div>
              ) : (
                /* EXPLANATION: Replace t('auth.signIn') with actual button text */
                language === 'de' ? 'Anmelden' : 
                language === 'en' ? 'Sign In' : 
                language === 'ro' ? 'Conectare' : 
                'Войти'
              )}
            </button>
          </form>

          {/* Additional options / Zusätzliche Optionen */}
          <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
            {/* Forgot password link / Passwort vergessen Link */}
            <button
              onClick={handlePasswordReset}
              disabled={loading}
              className="w-full text-sm font-medium text-gray-800 dark:text-white hover:text-gray-600 dark:hover:text-white/80 transition-colors duration-200 disabled:opacity-50"
            >
              {language === 'de' ? 'Passwort vergessen?' : 
               language === 'en' ? 'Forgot password?' : 
               language === 'ro' ? 'Ai uitat parola?' : 
               'Забыли пароль?'}
            </button>

            {/* Sign up link / Registrierungs-Link */}
            <div className="text-center">
              <span className="text-white/60 text-sm">
                {language === 'de' ? 'Haben Sie noch kein Konto?' : 
                 language === 'en' ? "Don't have an account?" : 
                 language === 'ro' ? 'Nu ai un cont?' : 
                 'У вас нет аккаунта?'}{' '}
              </span>
              <Link
                href="/auth/signup"
                className="dark text-blue-100 : text-gray-200  hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                {language === 'de' ? 'Registrieren' : 
                 language === 'en' ? 'Sign Up' : 
                 language === 'ro' ? 'Înregistrare' : 
                 'Регистрация'}
              </Link>
            </div>
          </div>
        </div>

        {/* Back to home link / Zurück zur Startseite Link */}
        <div className="text-center animate-fadeIn" style={{ animationDelay: '0.6s' }}>
          <Link
            href="/"
            className="text-white/60 hover:text-white transition-colors duration-200 text-sm"
          >
            {language === 'de' ? '← Zurück zur Startseite' : 
             language === 'en' ? '← Back to Home' : 
             language === 'ro' ? '← Înapoi Acasă' : 
             '← Назад домой'}
          </Link>
        </div>
      </div>
    </div>
  );
}
