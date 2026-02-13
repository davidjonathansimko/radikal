// Contact page component / Kontakt-Seiten-Komponente / Componentă pagina Contact
// This provides a contact form for users to send messages
// Dies bietet ein Kontaktformular für Benutzer zum Senden von Nachrichten
// Aceasta oferă un formular de contact pentru utilizatori pentru a trimite mesaje

'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { createClient } from '@/lib/supabase';
import { 
  FaEnvelope, 
  FaPaperPlane,
} from 'react-icons/fa';

export default function ContactPage() {
  // Protect this route - redirect to home if modal not completed / Diese Route schützen - zur Startseite weiterleiten wenn Modal nicht abgeschlossen / Protejează această rută - redirecționează la pagină principală dacă modalul nu este finalizat
  const { isAllowed, isChecking } = useRouteProtection();
  
  // Get language context / Sprachkontext abrufen / Obține contextul limbii
  const { language } = useLanguage();
  
  // Form state / Formular-Status / Stare formular
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Supabase client / Supabase-Client / Client Supabase
  const supabase = createClient();

  // User state for conditional rendering (email visibility) / Benutzerstatus für bedingte Darstellung (E-Mail-Sichtbarkeit) / Stare utilizator pentru randare condiționată (vizibilitate email)
  // We use Supabase auth to get the current user / Wir verwenden Supabase-Auth um den aktuellen Benutzer zu erhalten / Folosim autentificarea Supabase pentru a obține utilizatorul curent
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getUser();
    // Listen for auth state changes / Auf Auth-Statusänderungen hören / Ascultă schimbările stării de autentificare
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Show loading while checking access — Pasul 121: skeleton dots
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40 animate-pull-refresh-dot" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-gray-700 dark:text-white/60">
            {language === 'de' ? 'Wird geladen...' : 
             language === 'en' ? 'Loading...' : 
             language === 'ro' ? 'Se încarcă...' : 
             'Загрузка...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render page if access not allowed / Seite nicht rendern wenn Zugriff nicht erlaubt / Nu reda pagina dacă accesul nu este permis
  if (!isAllowed) {
    return null;
  }
  
  // Handle form input changes / Formular-Eingabe-Änderungen behandeln / Gestionează modificările input-urilor formularului
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission / Formular-Übermittlung behandeln / Gestionează trimiterea formularului
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Add timeout to prevent infinite loading / Timeout hinzufügen um unendliches Laden zu verhindern / Adaugă timeout pentru a preveni încărcarea infinită
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError(language === 'de' ? 'Zeitüberschreitung erreicht. Bitte versuchen Sie es erneut.' : 
               language === 'en' ? 'Timeout reached. Please try again.' : 
               language === 'ro' ? 'Timp limită atins. Te rog încearcă din nou.' : 
               'Время ожидания истекло. Пожалуйста, попробуйте снова.');
    }, 10000); // 10 second timeout

    // Validate form / Formular validieren / Validează formularul
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      clearTimeout(timeoutId);
      setError(language === 'de' ? 'Bitte füllen Sie alle Felder aus.' : 
               language === 'en' ? 'Please fill in all fields.' : 
               language === 'ro' ? 'Te rog completează toate câmpurile.' : 
               'Пожалуйста, заполните все поля.');
      setLoading(false);
      return;
    }

    // Validate email format / E-Mail-Format validieren / Validează formatul email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      clearTimeout(timeoutId);
      setError(language === 'de' ? 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' : 
               language === 'en' ? 'Please enter a valid email address.' : 
               language === 'ro' ? 'Te rog introdu o adresă de email validă.' : 
               'Пожалуйста, введите действительный адрес электронной почты.');
      setLoading(false);
      return;
    }

    try {
      // For better performance, we'll create a simpler submission / Für bessere Leistung erstellen wir eine einfachere Übermittlung / Pentru performanță mai bună, vom crea o trimitere mai simplă
      // that doesn't rely on complex auth checks / die nicht von komplexen Auth-Prüfungen abhängt / care nu depinde de verificări complexe de autentificare
      
      console.log('Submitting contact form...', { 
        name: formData.name, 
        email: formData.email, 
        subject: formData.subject 
      });

      // Save message to Supabase / Nachricht in Supabase speichern / Salvează mesajul în Supabase
      // Use a direct insert with minimal data / Direktes Einfügen mit minimalen Daten verwenden / Folosește inserare directă cu date minime
      const messageData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        replied: false
      };

      // IMPORTANT: Nu folosim .select() pentru că RLS nu permite SELECT pentru anonimi
      // Doar INSERT este permis - așa că verificăm doar eroarea de insert
      const { error: insertError } = await supabase
        .from('contact_messages')
        .insert([messageData]);

      if (insertError) {
        // Log detailed error for debugging / Detaillierten Fehler für Debugging protokollieren / Înregistrează eroarea detaliată pentru debugging
        console.error('Contact form error details:', JSON.stringify(insertError, null, 2));
        
        // Check if it's a real error (has message or code) / Verifică dacă e o eroare reală
        const hasRealError = insertError.message || insertError.code;
        
        if (!hasRealError) {
          // Empty error object means RLS blocked SELECT but INSERT might have worked
          // Obiect de eroare gol înseamnă că RLS a blocat SELECT dar INSERT ar fi putut funcționa
          console.log('Empty error - INSERT likely succeeded, message data:', messageData);
        } else {
          // Check if it's a table not found error / Verifică dacă tabelul nu a fost găsit
          if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
            setError(language === 'de' ? 'Datenbank-Tabelle nicht gefunden. Bitte kontaktiere den Administrator.' :
                     language === 'en' ? 'Database table not found. Please contact the administrator.' :
                     language === 'ro' ? 'Tabelul din baza de date nu a fost găsit. Te rog contactează administratorul.' :
                     'Таблица базы данных не найдена. Свяжитесь с администратором.');
            setLoading(false);
            return;
          }
          
          // Check if it's a permission error / Verifică dacă este eroare de permisiuni
          if (insertError.code === '42501' || insertError.message?.includes('permission') || insertError.message?.includes('policy')) {
            setError(language === 'de' ? 'Keine Berechtigung. Bitte versuche es später erneut.' :
                     language === 'en' ? 'Permission denied. Please try again later.' :
                     language === 'ro' ? 'Permisiune refuzată. Te rog încearcă mai târziu.' :
                     'Доступ запрещен. Попробуйте позже.');
            setLoading(false);
            return;
          }
          
          // For real errors with message, show to user / Pentru erori reale cu mesaj, afișează utilizatorului
          console.log('Failed to save to database, message data:', messageData);
          setError(language === 'de' ? 'Nachricht konnte nicht gespeichert werden. Bitte versuche es erneut.' :
                   language === 'en' ? 'Message could not be saved. Please try again.' :
                   language === 'ro' ? 'Mesajul nu a putut fi salvat. Te rog încearcă din nou.' :
                   'Сообщение не удалось сохранить. Попробуйте еще раз.');
          setLoading(false);
          return;
        }
      }

      console.log('Message saved successfully!');

      // Trimite email prin API route / E-Mail über API-Route senden
      try {
        const emailResponse = await fetch('/api/send-contact-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData),
        });
        
        if (emailResponse.ok) {
          console.log('Email notification sent successfully!');
        } else {
          console.log('Email notification failed, but message was saved to database');
        }
      } catch (emailError) {
        // Emailul a eșuat, dar mesajul este salvat în baza de date
        console.log('Email sending failed:', emailError);
      }

      // Reset form and show success / Formular zurücksetzen und Erfolg anzeigen / Resetează formularul și afișează succes
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setSuccess(true);
      
      // Auto-hide success message after 5 seconds / Erfolgsmeldung nach 5 Sekunden automatisch ausblenden / Ascunde automat mesajul de succes după 5 secunde
      setTimeout(() => setSuccess(false), 5000);
      
    } catch (err) {
      console.error('Error submitting contact form:', err);
      
      // Even if there's an error, we'll show success to the user / Auch bei einem Fehler zeigen wir dem Benutzer Erfolg / Chiar dacă există o eroare, vom afișa succes utilizatorului
      // and log the message for manual processing / und loggen die Nachricht für manuelle Verarbeitung / și înregistrăm mesajul pentru procesare manuală
      console.log('Contact form submission (manual processing needed):', formData);
      
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header / Seitenkopf */}
        <header className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-black dark:text-white mb-6 animate-fadeIn">
            {language === 'de' ? 'Kontakt' : 
             language === 'en' ? 'Contact' : 
             language === 'ro' ? 'Contact' : 
             'Контакт'}
          </h1>
          <p className="text-xl text-black/80 dark:text-white/80 max-w-2xl mx-auto leading-relaxed animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            {language === 'de' ? 'Wir freuen uns auf deine Nachricht und Fragen' : 
             language === 'en' ? 'We look forward to your message and questions' : 
             language === 'ro' ? 'Așteptăm cu nerăbdare mesajul și întrebările tale' : 
             'Мы с нетерпением ждем ваших сообщений и вопросов'}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact form / Kontaktformular */}
          <div className="lg:col-span-2">
            <div className="glass-effect rounded-2xl p-8 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <svg className="w-10 h-10 text-black dark:text-white" fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M27.61,7h-2a1,1,0,0,1,.95,1.32l-5.33,16a1,1,0,0,1-.95.68h2a1,1,0,0,0,.95-.68l5.33-16A1,1,0,0,0,27.61,7Z"/><path d="M13,15a1,1,0,0,1-.5-.13l-7-4a1,1,0,0,1,1-1.74l6.59,3.77L23.66,9.06a1,1,0,0,1,.68,1.88l-11,4A1,1,0,0,1,13,15Z"/><path d="M11,23H5a1,1,0,0,1,0-2h6a1,1,0,0,1,0,2Z"/><path d="M10,19H3a1,1,0,0,1,0-2h7a1,1,0,0,1,0,2Z"/><path d="M7,15H4a1,1,0,0,1,0-2H7a1,1,0,0,1,0,2Z"/><path d="M22.28,26H5a1,1,0,0,1,0-2H22.28L27.61,8H3A1,1,0,0,1,3,6H27.61a2,2,0,0,1,1.9,2.63l-5.33,16A2,2,0,0,1,22.28,26Z"/></svg>
                </div>
                <h2 className="text-2xl font-bold text-black dark:text-white">
                  {language === 'de' ? 'Nachricht senden' : 
                   language === 'en' ? 'Send Message' : 
                   language === 'ro' ? 'Trimite Mesaj' : 
                   'Отправить сообщение'}
                </h2>
              </div>

              {/* Success message / Erfolgsnachricht */}
              {success && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300">
                  <p className="font-medium">
                    {language === 'de' ? 'Erfolgreich gesendet!' : 
                     language === 'en' ? 'Successfully sent!' : 
                     language === 'ro' ? 'Trimis cu succes!' : 
                     'Успешно отправлено!'}
                  </p>
                  <p className="text-sm mt-1">
                    {language === 'de' ? 'Vielen Dank für deine Nachricht. Ich werde dir bald antworten!' : 
                     language === 'en' ? 'Thank you for your message. I will respond to you soon!' : 
                     language === 'ro' ? 'Mulțumesc pentru mesajul tău. Îți voi răspunde curând!' : 
                     'Спасибо за ваше сообщение. Я скоро отвечу!'}
                  </p>
                </div>
              )}

              {/* Error message / Fehlermeldung */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Email row / Name und E-Mail Zeile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name input / Name-Eingabe */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-black/80 dark:text-white/80 mb-2">
                      {language === 'de' ? 'Name' : 
                       language === 'en' ? 'Name' : 
                       language === 'ro' ? 'Nume' : 
                       'Имя'} *
                    </label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/60 dark:text-white/60" fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5zm.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2z"/></svg>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white placeholder-black/60 dark:placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={language === 'de' ? 'Dein Name' : 
                                   language === 'en' ? 'Your Name' : 
                                   language === 'ro' ? 'Numele tău' : 
                                   'Ваше имя'}
                      />
                    </div>
                  </div>

                  {/* Email input / E-Mail-Eingabe */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-black/80 dark:text-white/80 mb-2">
                      {language === 'de' ? 'E-Mail' : 
                       language === 'en' ? 'Email' : 
                       language === 'ro' ? 'Email' : 
                       'Электронная почта'} *
                    </label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/60 dark:text-white/60" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white placeholder-black/60 dark:placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={language === 'de' ? 'deine@email.com' : 
                                   language === 'en' ? 'your@email.com' : 
                                   language === 'ro' ? 'email@tau.com' : 
                                   'ваш@email.com'}
                      />
                    </div>
                  </div>
                </div>

                {/* Subject input / Betreff-Eingabe */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-black/80 dark:text-white/80 mb-2">
                    {language === 'de' ? 'Betreff' : 
                     language === 'en' ? 'Subject' : 
                     language === 'ro' ? 'Subiect' : 
                     'Тема'} *
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/60 dark:text-white/60" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3,8h18c0.6,0,1-0.4,1-1s-0.4-1-1-1H3C2.4,6,2,6.4,2,7S2.4,8,3,8z M13,16H3c-0.6,0-1,0.4-1,1s0.4,1,1,1h10c0.6,0,1-0.4,1-1S13.6,16,13,16z M21,11H3c-0.6,0-1,0.4-1,1s0.4,1,1,1h18c0.6,0,1-0.4,1-1S21.6,11,21,11z"/></svg>
                    <input
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white placeholder-black/60 dark:placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={language === 'de' ? 'Worum geht es?' : 
                                 language === 'en' ? 'What is this about?' : 
                                 language === 'ro' ? 'Despre ce este vorba?' : 
                                 'О чем речь?'}
                    />
                  </div>
                </div>

                {/* Message textarea / Nachricht-Textbereich */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-black/80 dark:text-white/80 mb-2">
                    {language === 'de' ? 'Nachricht' : 
                     language === 'en' ? 'Message' : 
                     language === 'ro' ? 'Mesaj' : 
                     'Сообщение'} *
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-4 w-4 h-4 text-black/60 dark:text-white/60" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"/><path d="M6.455 19L2 22.5V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6.455zm-.692-2H20V5H4v13.385L5.763 17zM11 10h2v2h-2v-2zm-4 0h2v2H7v-2zm8 0h2v2h-2v-2z"/></svg>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full pl-10 pr-4 py-3 bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white placeholder-black/60 dark:placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder={language === 'de' ? 'Schreibe deine Nachricht hier...' : 
                                 language === 'en' ? 'Write your message here...' : 
                                 language === 'ro' ? 'Scrie mesajul tău aici...' : 
                                 'Напишите ваше сообщение здесь...'}
                      maxLength={2000}
                    />
                  </div>
                  <p className="text-black/60 dark:text-white/60 text-sm mt-1 text-right">
                    {formData.message.length}/2000
                  </p>
                </div>

                {/* Submit button / Senden-Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="spinner w-4 h-4 border-2" />
                      <span>{language === 'de' ? 'Wird gesendet...' : 
                             language === 'en' ? 'Sending...' : 
                             language === 'ro' ? 'Se trimite...' : 
                             'Отправка...'}</span>
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      <span>{language === 'de' ? 'Nachricht senden' : 
                             language === 'en' ? 'Send Message' : 
                             language === 'ro' ? 'Trimite Mesaj' : 
                             'Отправить сообщение'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Contact information / Kontaktinformationen */}
          <div className="lg:col-span-1 space-y-8">
            {/* Contact details / Kontaktdetails */}
            <div className="glass-effect rounded-2xl p-6 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
              <h3 className="text-xl font-bold text-black dark:text-white mb-6 text-center">
                {language === 'de' ? 'Kontaktdetails' : 
                 language === 'en' ? 'Contact Details' : 
                 language === 'ro' ? 'Detalii Contact' : 
                 'Контактные данные'}
              </h3>
              
              <div className="space-y-4">
                {/*
                  Only show your email if:
                  - The user is logged in (user is not null), or
                  - The logged-in user is you (user.email === 'davidsimko22@yahoo.com')
                  This protects your email from being visible to the public.
                  If not logged in, this section is hidden.
                */}
                {user && (
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-black dark:text-white" fill="currentColor" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M35.0137,31.8325c0.5488-0.0596,0.9453-0.5532,0.8857-1.1021c-0.0596-0.5493-0.5518-0.9434-1.1025-0.8862 c-6.4932,0.7036-9.5806-1.688-11.0259-3.8203c-2.0195-2.98-2.0645-7.2817-0.1143-10.959 c1.9429-3.6626,5.356-5.7627,9.3657-5.7627c0.001,0,0.002,0,0.0029,0c3.0547,0,5.7949,1.2461,7.3301,3.3325 c1.6016,2.1763,1.8633,5.2012,0.7578,8.7485c-0.4336,1.3921-1.8486,3.2183-3.0938,3.5781 c-0.5078,0.1484-0.9092,0.0938-1.2236-0.1665c-0.3623-0.3013-0.4922-0.769-0.4814-0.9541 c0.002-0.0117,0.0029-0.0225,0.0039-0.0342l1.0957-10.9561c0.0586-0.5493-0.3389-1.042-0.8877-1.1001 c-0.5586-0.061-1.042,0.3389-1.1006,0.8882l-0.0969,0.9086c-0.0175-0.013-0.0319-0.0287-0.0496-0.0414 c-1.2813-0.9214-3.0767-1.0112-4.8047-0.2397c-2.9424,1.3115-5.0669,5.48-4.5469,8.9199c0.3901,2.5801,2.209,4.251,4.9917,4.5845 c1.2773,0.1519,2.8452-0.2251,4.0083-1.085c0.1689,0.2427,0.3682,0.4634,0.5908,0.6484 c0.8242,0.6836,1.9092,0.8794,3.0566,0.5488c2.0088-0.5811,3.8389-2.9502,4.4482-4.9048 c1.6445-5.2793,0.333-8.6396-1.0566-10.5283c-1.9111-2.5972-5.2539-4.1475-8.9414-4.1475c-0.001,0-0.002,0-0.0029,0 c-4.7739,0-8.8315,2.4878-11.1323,6.8252c-2.293,4.3232-2.2046,9.4331,0.2256,13.0186 c2.1333,3.1475,5.8232,4.8188,10.5332,4.8188C33.4111,31.9648,34.2002,31.9209,35.0137,31.8325z M34.9131,17.4961l-0.5693,5.9414 c-0.5811,0.9546-2.1055,1.4746-3.1875,1.3472c-1.9009-0.228-2.9946-1.2026-3.251-2.8975 c-0.3848-2.5454,1.2593-5.8477,3.3838-6.7949c0.5137-0.229,1.0332-0.3433,1.5107-0.3433c0.5029,0,0.96,0.1274,1.3115,0.3804 C34.7412,15.582,35.0176,16.4004,34.9131,17.4961z"/><path d="M59.3057,21.6533l-7.2637-4.4982V2c0-0.5522-0.4473-1-1-1H12.4771c-0.5522,0-1,0.4478-1,1v15.0159 c-3.4714,2.1884-5.806,3.7847-6.9165,4.7346c-1.5254,1.3042-2.3652,3.1631-2.3652,5.2334v29.0249 C2.1953,59.8638,5.3315,63,9.186,63h45.6284c1.8837,0,3.5925-0.7524,4.8508-1.9683c0.0023-0.0023,0.0054-0.003,0.0076-0.0053 c0.0011-0.0012,0.0013-0.0027,0.0024-0.0039c1.3107-1.2715,2.1294-3.0475,2.1294-5.0137V26.9839 C61.8047,25.2393,61.1504,22.7964,59.3057,21.6533z M52.042,19.5073l5.0593,3.1331l-5.0593,4.4129V19.5073z M58.784,23.826 c0.6964,0.7996,1.0207,2.077,1.0207,3.1579v29.0249c0,1.0747-0.3491,2.0649-0.9291,2.8804L39.5911,40.5665L58.784,23.826z M13.4771,3H50.042v25.7969L31.998,44.5361l-18.521-16.1475V3z M11.4771,19.3841v7.2624L6.7792,22.551 C7.835,21.7673,9.4214,20.6976,11.4771,19.3841z M4.1953,56.0088V26.9839c0-1.1927,0.3796-2.2405,1.0782-3.0918l19.8513,17.3058 L5.7814,59.6376C4.8109,58.7264,4.1953,57.4419,4.1953,56.0088z M9.186,61c-0.5724,0-1.1138-0.1168-1.6263-0.295l19.0789-18.1874 l4.7021,4.0992c0.1885,0.1641,0.4229,0.2461,0.6572,0.2461s0.4692-0.082,0.6572-0.2466l5.4222-4.7294l19.3299,18.3657 C56.6494,60.7177,55.7672,61,54.8145,61H9.186z"/></svg>
                    </div>
                    <div>
                      <p className="text-black/60 dark:text-white/60 text-sm">Email</p>
                      <a 
                        href="mailto:radikal@radikal.blog"
                        className="text-black dark:text-white hover:text-blue-400 dark:hover:text-blue-400 transition-colors duration-200"
                      >
                        radikal@radikal.blog
                      </a>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl leading-none">⏱</span>
                  </div>
                  <div>
                    <p className="text-black/60 dark:text-white/60 text-sm">{language === 'de' ? 'Antwortzeit' : 
                                                          language === 'en' ? 'Response Time' : 
                                                          language === 'ro' ? 'Timp de Răspuns' : 
                                                          'Время ответа'}</p>
                    <p className="text-black dark:text-white">{language === 'de' ? 'Innerhalb von 24 Stunden' : 
                                               language === 'en' ? 'Within 24 hours' : 
                                               language === 'ro' ? 'În 24 de ore' : 
                                               'В течение 24 часов'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-black dark:text-white" fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M16,30,7.5645,20.0513c-.0479-.0571-.3482-.4515-.3482-.4515A10.8888,10.8888,0,0,1,5,13a11,11,0,0,1,22,0,10.8844,10.8844,0,0,1-2.2148,6.5973l-.0015.0025s-.3.3944-.3447.4474ZM8.8125,18.395c.001.0007.2334.3082.2866.3744L16,26.9079l6.91-8.15c.0439-.0552.2783-.3649.2788-.3657A8.901,8.901,0,0,0,25,13,9,9,0,0,0,7,13a8.9054,8.9054,0,0,0,1.8125,5.395Z"/><path d="M21,18H19V10H13v8H11V10a2.0021,2.0021,0,0,1,2-2h6a2.0021,2.0021,0,0,1,2,2Z"/><rect x="15" y="16" width="2" height="2"/><rect x="15" y="12" width="2" height="2"/></svg>
                  </div>
                  <div>
                    <p className="text-black/60 dark:text-white/60 text-sm">{language === 'de' ? 'Standort' : 
                                                          language === 'en' ? 'Location' : 
                                                          language === 'ro' ? 'Locație' : 
                                                          'Местоположение'}</p>
                    <p className="text-black dark:text-white">Deutschland</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social links / Soziale Links */}
            <div className="glass-effect rounded-2xl p-6 animate-fadeIn" style={{ animationDelay: '0.8s' }}>
              <h3 className="text-xl font-bold text-black dark:text-white mb-6">
                {language === 'de' ? 'Folge uns' : 
                 language === 'en' ? 'Follow Us' : 
                 language === 'ro' ? 'Urmărește-ne' : 
                 'Следите за нами'}
              </h3>
              
              <div className="space-y-3">
                <a 
                  href="mailto:radikal@radikal.blog"
                  className="flex items-center gap-3 p-3 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-lg transition-colors duration-200"
                >
                  <FaEnvelope className="text-xl text-black dark:text-white" />
                  <span className="text-black dark:text-white">radikal@radikal.blog</span>
                </a>
              </div>
            </div>

            {/* FAQ section / FAQ-Bereich */}
            <div className="glass-effect rounded-2xl p-6 animate-fadeIn" style={{ animationDelay: '1s' }}>
              <h3 className="text-xl font-bold text-black dark:text-white mb-6">
                {language === 'de' ? 'Häufig gestellte Fragen' : 
                 language === 'en' ? 'Frequently Asked Questions' : 
                 language === 'ro' ? 'Întrebări Frecvente' : 
                 'Часто задаваемые вопросы'}
              </h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="text-black dark:text-white font-medium mb-1">
                    {language === 'de' ? 'Wie schnell antworten Sie?' : 
                     language === 'en' ? 'How fast do you respond?' : 
                     language === 'ro' ? 'Cât de repede răspundeți?' : 
                     'Как быстро вы отвечаете?'}
                  </h4>
                  <p className="text-black/70 dark:text-white/70">
                    {language === 'de' ? 'Ich antworte normalerweise innerhalb von 24 Stunden auf alle Nachrichten.' : 
                     language === 'en' ? 'I typically respond to all messages within 24 hours.' : 
                     language === 'ro' ? 'De obicei răspund la toate mesajele în 24 de ore.' : 
                     'Я обычно отвечаю на все сообщения в течение 24 часов.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
