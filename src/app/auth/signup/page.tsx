// Signup page component / Registrierungs-Seiten-Komponente
// This allows new users to create accounts with email or GitHub
// Dies ermöglicht neuen Benutzern, Konten mit E-Mail oder GitHub zu erstellen

'use client';

import React, { useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { createClient } from '@/lib/supabase';
import { FaGoogle, FaEnvelope, FaEye, FaEyeSlash, FaUser } from 'react-icons/fa';

export default function SignupPage() {
  // Get language context and router / Sprachkontext und Router abrufen
  const { t,language } = useLanguage();
  const router = useRouter();
  
  // Component state / Komponentenstatus
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Supabase client / Supabase-Client
  const supabase = createClient();

  // Keep nav/footer hidden on auth pages - add modal-active immediately before paint
  // Nav/Footer auf Auth-Seiten versteckt halten
  // Menține nav/footer ascunse pe paginile auth
  useLayoutEffect(() => {
    document.body.classList.add('modal-active');
    return () => {
      // Pasul 12005: Don't remove if redirecting after successful auth
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
        // Transfer pending language from WelcomeModal to persistent localStorage
        const pendingLang = sessionStorage.getItem('radikalPendingLanguage');
        if (pendingLang) {
          localStorage.setItem('radikalSelectedLanguage', pendingLang);
          sessionStorage.removeItem('radikalPendingLanguage');
        }
        router.replace('/'); // Redirect to home if already logged in / Zur Startseite weiterleiten, wenn bereits angemeldet
      }
    };
    checkUser();
  }, [router, supabase.auth]);

  // Validate password strength / Passwortstärke validieren
  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return language === 'de' ? 'Passwort muss mindestens 8 Zeichen lang sein.' : 
      language === 'en' ? 'Password must be at least 8 characters long.' : 
      language === 'ro' ? 'Parola trebuie să aibă cel puțin 8 caractere.' : 
      'Пароль должен содержать не менее 8 символов.';
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      return language === 'de' ? 'Passwort muss mindestens einen Kleinbuchstaben enthalten.' : 
      language === 'en' ? 'Password must contain at least one lowercase letter.' : 
      language === 'ro' ? 'Parola trebuie să conțină cel puțin o literă mică.' : 
      'Пароль должен содержать как минимум одну строчную букву.';
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      return language === 'de' ? 'Passwort muss mindestens einen Großbuchstaben enthalten.' : 
      language === 'en' ? 'Password must contain at least one uppercase letter.' : 
      language === 'ro' ? 'Parola trebuie să conțină cel puțin o literă mare.' : 
      'Пароль должен содержать как минимум одну заглавную букву.';
    }
    if (!/(?=.*\d)/.test(pwd)) {
      return language === 'de' ? 'Passwort muss mindestens eine Zahl enthalten.' : 
      language === 'en' ? 'Password must contain at least one number.' : 
      language === 'ro' ? 'Parola trebuie să conțină cel puțin un număr.' : 
      'Пароль должен содержать как минимум одну цифру.';
    }
    return '';
  };

  // Handle email/password signup / E-Mail/Passwort-Registrierung behandeln
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Validate form inputs / Formulareingaben validieren
    if (password !== confirmPassword) {
      setError(language === 'de' ? 'Passwörter stimmen nicht überein.' : 
      language === 'en' ? 'Passwords do not match.' : 
      language === 'ro' ? 'Parolele nu se potrivesc/ nu sunt la fel.' : 
      'Пароли не совпадают.');
      setLoading(false);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        setMessage(language === 'de'  ? '🎉 Willkommen bei RADIKAL! Deine Registrierung war erfolgreich. Bitte überprüfe deine E-Mail, um dein Konto zu bestätigen.' :
        language === 'en' ? '🎉 Welcome to RADIKAL! Your registration was successful. Please check your email to confirm your account.' :
        language === 'ro' ? '🎉 Bine ai venit la RADIKAL! Înregistrarea ta a fost cu succes. Te rugăm să verifici emailul pentru a confirma contul.' :
        '🎉 Добро пожаловать в RADIKAL! Регистрация прошла успешно. Пожалуйста, проверьте вашу электронную почту для подтверждения аккаунта.');
      }
    } catch (err) {
      setError(language === 'de' ? 'Die Registrierung konnte nicht abgeschlossen werden. Bitte versuche es erneut.' :
      language === 'en' ? 'Registration could not be completed. Please try again.' :
      language === 'ro' ? 'Înregistrarea nu a putut fi finalizată. Te rugăm să încerci din nou.' :
      'Регистрация не могла быть завершена. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google signup / Google-Registrierung behandeln
  const handleGoogleSignup = async () => {
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
      setError(language=== 'de' ? 'Ein Fehler ist bei der Google-Registrierung aufgetreten.' :
      language === 'en' ? 'An error occurred during Google registration.' :
      language === 'ro' ? 'A apărut o eroare în timpul înregistrării cu Google.' :
      'Произошла ошибка при регистрации через Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-white dark:bg-black overflow-y-auto">
      <div className="max-w-md w-full space-y-2 sm:space-y-6 py-3 sm:py-0">
        {/* Header / Kopfbereich */}
        <div className="text-center">
          <h2 className="text-xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-2 animate-fadeIn">
            {language=== 'de' ? 'Registrieren' : 
            language === 'en' ? 'Sign Up' : 
            language === 'ro' ? 'Înscriere' : 
            'Регистрация'}
          </h2>
          <p className="text-sm sm:text-base text-white/80 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            {language === 'de' ? 'Erstelle dein Konto bei RADIKAL.' : 
            language === 'en' ? 'Create your account at RADIKAL.' : 
            language === 'ro' ? 'Creează-ți contul la RADIKAL.' : 
            'Создайте учетную запись в RADIKAL.'}
          </p>
        </div>

        {/* Signup form / Registrierungsformular */}
        <div className="glass-effect rounded-2xl p-3 sm:p-8 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          {/* Error and success messages / Fehler- und Erfolgsmeldungen */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm text-center">
              <div className="text-2xl mb-2">✓</div>
              {message}
            </div>
          )}

          {/* Google signup button / Google-Registrierungs-Button */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-1.5 sm:py-3 bg-gray-600 hover:bg-gray-700 text-sm sm:text-base font-medium rounded-lg transition-colors duration-200 mb-2 sm:mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: '#ffffff' }}
          >
            <FaGoogle className="text-xl" style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff' }}>
              {language === 'de' ? 'Mit Google registrieren' : 
              language === 'en' ? 'Sign up with Google' : 
              language === 'ro' ? 'Înregistrare cu Google' : 
              'Зарегистрироваться с Google'} </span>
          </button>

          {/* Divider / Trenner */}
          <div className="relative my-2 sm:my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black/50 text-white/60">{
              language === 'de' ? 'oder' : 
              language === 'en' ? 'or' : 
              language === 'ro' ? 'sau' : 'или'}</span>
            </div>
          </div>

          {/* Email signup form / E-Mail-Registrierungsformular */}
          <form onSubmit={handleEmailSignup} className="space-y-1.5 sm:space-y-4">
            {/* Full name input / Vollständiger Name Eingabe */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-white/80 mb-1 sm:mb-2">
                {language === 'de' ? 'Vollständiger Name' : 
                language === 'en' ? 'Full Name' : 
                language === 'ro' ? 'Nume complet' : 
                'Полное имя'}
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-1.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    language==='de' ?"Dein vollständiger Name" : 
                    language === 'en' ? "Your full name" : 
                    language === 'ro' ? "Numele tău complet" : 
                    "Ваше полное имя"}
                />
              </div>
            </div>

            {/* Email input / E-Mail-Eingabe */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1 sm:mb-2">
                {language==='de' ? 'E-Mail' : 
                language === 'en' ? 'Email' : 
                language === 'ro' ? 'Adresa de Email' : 
                'Электронная почта'}
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-1.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="deine@email.com"
                />
              </div>
            </div>

            {/* Password input / Passwort-Eingabe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1 sm:mb-2">
                {language==='de' ? 'Passwort' : 
                language === 'en' ? 'Password' : 
                language === 'ro' ? 'Parolă' : 
                'Пароль'}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pr-10 pl-4 py-1.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <p className="text-white/60 text-xs mt-0.5 sm:mt-1">
                {language==='de' ? 'Mindestens 8 Zeichen, mit Groß- und Kleinbuchstaben und einer Zahl' : 
                language === 'en' ? 'At least 8 characters, with uppercase and lowercase letters and a number' : 
                language === 'ro' ? 'Cel puțin 8 caractere, cu litere mari și mici și un număr' : 
                'Минимум 8 символов, с заглавными и строчными буквами и цифрой'}
              </p>
            </div>

            {/* Confirm password input / Passwort bestätigen Eingabe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-1 sm:mb-2">
                {language==='de' ? 'Passwort bestätigen' : 
                language === 'en' ? 'Confirm Password' : 
                language === 'ro' ? 'Confirmare parolă' : 
                'Подтверждение пароля'}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pr-10 pl-4 py-1.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Signup button / Registrierungs-Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner w-4 h-4 border-2" />
                  <span>{language==='de' ? 'Registrierung läuft...' : 
                  language === 'en' ? 'Registering...' : 
                  language === 'ro' ? 'Se înregistrează...' : 
                  'Регистрация...'}
                  </span>
                </div>
              ) : (
                language === 'de' ? 'Konto erstellen' : 
                language === 'en' ? 'Create Account' : 
                language === 'ro' ? 'Creează cont' : 
                'Создать аккаунт'
              )}
            </button>
          </form>

          {/* Sign in link / Anmelde-Link */}
          <div className="mt-2 sm:mt-6 text-center">
            <span className="text-white/60 text-sm">
              {language==='de' ? 'Bereits ein Konto?' : 
              language === 'en' ? 'Already have an account?' : 
              language === 'ro' ? 'Ai deja un cont?' : 
              'Уже есть аккаунт?'}
              {' '}
            </span>
            <Link
              href="/auth/login"
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm font-medium"
            >
              {language==='de' ? ' Anmelden' : 
              language === 'en' ? ' Sign In' : 
              language === 'ro' ? ' Conectare' : 
              ' Войти'} 
            </Link>
          </div>
        </div>

        {/* Back to home link / Zurück zur Startseite Link */}
        <div className="text-center animate-fadeIn" style={{ animationDelay: '0.6s' }}>
          <Link
            href="/"
            className="text-white/60 hover:text-white transition-colors duration-200 text-sm"
          >
            {language==='de' ? '← Zurück zur Startseite' : 
            language === 'en' ? '← Back to Home' : 
            language === 'ro' ? '← Înapoi la Acasă' : 
            '← Назад на главную'}
          </Link>
        </div>
      </div>
    </div>
  );
}
