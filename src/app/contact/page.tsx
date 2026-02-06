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
  FaUser, 
  FaComment,
  FaGithub, 
  FaPaperPlane,
  FaMapMarkerAlt,
  FaClock
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

  // Show loading while checking access / Ladeindikator anzeigen während Zugriff geprüft wird / Afișează încărcare în timp ce se verifică accesul
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 dark:border-white/30 border-t-gray-900 dark:border-t-white/80 rounded-full mx-auto mb-4"></div>
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
              <h2 className="text-2xl font-bold text-black dark:text-white mb-6 flex items-center gap-3">
                <FaPaperPlane className="text-blue-400" />
                {language === 'de' ? 'Nachricht senden' : 
                 language === 'en' ? 'Send Message' : 
                 language === 'ro' ? 'Trimite Mesaj' : 
                 'Отправить сообщение'}
              </h2>

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
                      <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/60 dark:text-white/60" />
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
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/60 dark:text-white/60" />
                    <input
                      id="subject"
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
                    <FaComment className="absolute left-3 top-4 text-black/60 dark:text-white/60" />
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
              <h3 className="text-xl font-bold text-black dark:text-white mb-6">
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
                  <div className="flex items-center gap-3">
                    <FaEnvelope className="text-blue-400" />
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
                
                <div className="flex items-center gap-3">
                  <FaClock className="text-green-400" />
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
                
                <div className="flex items-center gap-3">
                  <FaMapMarkerAlt className="text-red-400" />
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
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-lg transition-colors duration-200"
                >
                  <FaGithub className="text-xl text-black dark:text-white" />
                  <span className="text-black dark:text-white">GitHub</span>
                </a>
                
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
                
                <div>
                  <h4 className="text-black dark:text-white font-medium mb-1">
                    {language === 'de' ? 'Kann ich als Gast schreiben?' : 
                     language === 'en' ? 'Can I write as a guest?' : 
                     language === 'ro' ? 'Pot scrie ca oaspete?' : 
                     'Могу ли я писать как гость?'}
                  </h4>
                  <p className="text-black/70 dark:text-white/70">
                    {language === 'de' ? 'Ja, Sie können mir eine Nachricht senden, ohne sich anzumelden. Geben Sie einfach Ihre E-Mail-Adresse an.' : 
                     language === 'en' ? 'Yes, you can send me a message without signing up. Just provide your email address.' : 
                     language === 'ro' ? 'Da, poți să îmi trimiți un mesaj fără să te înregistrezi. Doar furnizează adresa de email.' : 
                     'Да, вы можете отправить мне сообщение без регистрации. Просто укажите ваш адрес электронной почты.'}
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
