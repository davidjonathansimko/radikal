// Login page component / Anmelde-Seiten-Komponente
// This provides user authentication with email and GitHub options
// Dies bietet Benutzer-Authentifizierung mit E-Mail- und GitHub-Optionen

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { createClient } from '@/lib/supabase';
import { FaGithub, FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa';

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
  
  // Supabase client / Supabase-Client
  const supabase = createClient();

  // Check if user is already authenticated / Prüfen, ob Benutzer bereits authentifiziert ist
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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
        router.push('/'); // Redirect to home after successful login / Nach erfolgreicher Anmeldung zur Startseite weiterleiten
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  // Handle GitHub login / GitHub-Anmeldung behandeln
  const handleGithubLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Ein Fehler ist bei der GitHub-Anmeldung aufgetreten.');
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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header / Kopfbereich */}
        <div className="text-center">
          {/* 
            EXPLANATION: Instead of using t('auth.signIn') which shows "signIn" to users,
            we use direct text that's user-friendly in both languages 
          */}
          <h2 className="text-3xl font-bold text-white mb-2 animate-fadeIn">
            {language === 'de' ? 'Anmelden' : language === 'en' ? 'Sign In' : language === 'ro' ? 'Conectare' : 'Войти'}
          </h2>
          <p className="text-white/80 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            {language === 'de' ? 'Willkommen zurück bei RADIKAL.' : 
            language === 'en' ?'Welcome back to RADIKAL.':
            language === 'ro' ? 'Bine ai revenit la RADIKAL.' :
            'С возвращением в RADIKAL.'}
          </p>
        </div>

        {/* Login form / Anmeldeformular */}
        <div className="glass-effect rounded-2xl p-8 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
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

          {/* GitHub login button / GitHub-Anmelde-Button */}
          <button
            onClick={handleGithubLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 dark:bg-gray-600 bg-gray-400 hover:bg-gray-300 text-white font-medium rounded-lg transition-colors duration-200 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaGithub className="text-xl" />
            {/* 
              EXPLANATION: Replace t('auth.signInWithGithub') with user-friendly text
              Users should see "Sign in with GitHub" not "signInWithGithub"
            */}
            <span>{language === 'de' ? 'Mit GitHub anmelden' : language === 'en' ? 'Sign in with GitHub' : language === 'ro' ? 'Conectare cu GitHub' : 'Войти с GitHub'}</span>
          </button>

          {/* Divider / Trenner */}
          <div className="relative my-6">
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
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {/* Email input / E-Mail-Eingabe */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
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
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder= {language === 'de' ?"deine@email.com" : 
                    language === 'en' ? "your@email.com" : 
                    language === 'ro' ? "adresa@email.com" : 
                    "ваша@почта.com"}
                />
              </div>
            </div>

            {/* Password input / Passwort-Eingabe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
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
                  className="w-full pr-10 pl-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="mt-6 space-y-4">
            {/* Forgot password link / Passwort vergessen Link */}
            <button
              onClick={handlePasswordReset}
              disabled={loading}
              className="w-full text-sm font-medium dark text-blue-100 : text-gray-800  hover:text-white transition-colors duration-200 disabled:opacity-50"
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
