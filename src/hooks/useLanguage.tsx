// Language context and hook for internationalization / Sprachkontext und Hook für Internationalisierung / Context și hook pentru limbă pentru internaționalizare
// This provides German/English translation functionality throughout the app
// Dies bietet deutsche/englische Übersetzungsfunktionalität in der gesamten App
// Aceasta oferă funcționalitate de traducere germană/engleză în întreaga aplicație

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '@/types';

// Language context interface / Sprachkontext-Schnittstelle / Interfață context limbă
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string; // Translation function / Übersetzungsfunktion / Funcție de traducere
  mounted: boolean; // Whether the component is mounted / Ob die Komponente gemountet ist / Dacă componenta este montată
}

// Translation dictionary / Übersetzungswörterbuch / Dicționar de traduceri
const translations = {
  de: {
    // Navigation / Navigation / Navigare
    'nav.blogs': 'Blogs',
    'nav.quotes': 'Bibelzitate',
    'nav.about': 'Über uns',
    'nav.contact': 'Kontakt',
    'nav.login': 'Anmelden',
    'nav.logout': 'Abmelden',
    'nav.admin': 'Admin',
    'nav.backToHome': 'Zurück zur Startseite',
    
    // Home page / Startseite / Pagină principală
    'home.title': 'RADIKAL.',
    'home.subtitle': 'Radikale Bibellehre Blog',
    'home.welcome': 'Willkommen bei RADIKAL.!',
    'home.description': 'Entdecke radikale Bibellehren und tiefgreifende geistliche Einsichten. Diese Plattform bietet authentische biblische Wahrheiten, die dein Leben transformieren können.',
    'home.seeBlogs': 'Blogs ansehen',
    'home.email': 'E-Mail',
    'home.github': 'GitHub',
    'home.vercel': 'Powered by Vercel',
    'home.backToMenu': 'Zurück zum Hauptmenü',
    
    // Blog page / Blog-Seite / Pagină blog
    'blog.title': 'Neueste Blogs',
    'blog.subtitle': 'Entdecke tiefgreifende Einblicke in die Bibel und radikale Lehren, die dein Leben transformieren können.',
    'blog.olderBlogs': 'Ältere Blogs',
    'blog.loadMore': 'Mehr laden',
    'blog.loadOlderBlogs': 'Ältere Blogs laden',
    'blog.loading': 'Laden...',
    'blog.noBlogs': 'Keine Blogs gefunden',
    'blog.readMore': 'Weiterlesen',
    'blog.like': 'Gefällt mir',
    'blog.comment': 'Kommentieren',
    'blog.share': 'Teilen',
    'blog.comments': 'Kommentare',
    'blog.writeComment': 'Kommentar schreiben',
    'blog.postComment': 'Kommentar posten',
    'blog.submitComment': 'Kommentar posten',
    'blog.backToBlogs': 'Zurück zu den Blogs',
    'blog.postNotFound': 'Post nicht gefunden',
    'blog.loginToComment': 'Melde dich an, um einen Kommentar zu hinterlassen.',
    'blog.login': 'Anmelden',
    'blog.noComments': 'Noch keine Kommentare. Sei der Erste!',
    'blog.writeCommentPlaceholder': 'Schreibe einen Kommentar...',
    
    // Admin / Admin / Admin
    'admin.createPost': 'Neuen Post erstellen',
    'admin.editPost': 'Post bearbeiten',
    'admin.deletePost': 'Post löschen',
    'admin.title': 'Titel',
    'admin.content': 'Inhalt',
    'admin.excerpt': 'Auszug',
    'admin.publish': 'Veröffentlichen',
    'admin.save': 'Speichern',
    'admin.cancel': 'Abbrechen',
    
    // Authentication / Authentifizierung / Autentificare
    'auth.signIn': 'Anmelden',
    'auth.signUp': 'Registrieren',
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.confirmPassword': 'Passwort bestätigen',
    'auth.signInWithGithub': 'Mit Github anmelden',
    'auth.signInWithEmail': 'Mit E-Mail anmelden',
    'auth.dontHaveAccount': 'Noch kein Konto?',
    'auth.haveAccount': 'Bereits ein Konto?',
    
    // Contact / Kontakt / Contact
    'contact.title': 'Kontakt',
    'contact.subtitle': 'Hast du Fragen, Anregungen oder möchtest du einfach Hallo sagen? Ich freue mich auf deine Nachricht!',
    'contact.sendMessage': 'Nachricht senden',
    'contact.successDetail': 'Vielen Dank für deine Nachricht! Ich werde dir so schnell wie möglich antworten.',
    'contact.fillAllFields': 'Bitte fülle alle Felder aus.',
    'contact.validEmail': 'Bitte gib eine gültige E-Mail-Adresse ein.',
    'contact.sending': 'Wird gesendet...',
    'contact.timeout': 'Zeitüberschreitung. Bitte versuche es erneut.',
    'contact.name': 'Name',
    'contact.email': 'E-Mail',
    'contact.subject': 'Betreff',
    'contact.message': 'Nachricht',
    'contact.send': 'Senden',
    'contact.success': 'Nachricht erfolgreich gesendet!',
    'contact.responseTime': 'Antwortzeit',
    'contact.responseTimeValue': 'Innerhalb 24-48 Stunden',
    'contact.location': 'Standort',
    'contact.placeholderName': 'Dein Name',
    'contact.placeholderEmail': 'deine@email.com',
    'contact.placeholderSubject': 'Worum geht es?',
    'contact.placeholderMessage': 'Deine Nachricht...',
    'contact.contactDetails': 'Kontaktdetails',
    'contact.followUs': 'Folge uns',
    'contact.faq': 'Häufige Fragen',
    'contact.faqResponse': 'Wie schnell bekomme ich eine Antwort?',
    'contact.faqResponseAnswer': 'Ich antworte normalerweise innerhalb von 24-48 Stunden.',
    'contact.faqGuest': 'Kann ich Gastbeiträge einreichen?',
    'contact.faqGuestAnswer': 'Gerne! Sende mir deine Ideen und wir können darüber sprechen.',
    
    // About / Über uns / Despre noi
    'about.title': 'Über Radikal.',
    'about.subtitle': 'Eine Plattform für authentische Bibellehre und geistliche Transformation.',
    'about.mission': 'Unsere Mission',
    'about.missionText1': 'RADIKAL. ist mehr als nur ein Blog – es ist eine Bewegung für authentische biblische Wahrheit. Wir glauben an die transformative Kraft des Wortes Gottes und möchten Menschen dabei helfen, eine tiefere Beziehung zu Jesus Christus zu entwickeln.',
    'about.missionText2': 'In einer Zeit, in der viele oberflächliche Lehren verbreitet werden, stehen wir für radikale biblische Wahrheiten, die das Leben von Grund auf verändern können. Unsere Inhalte basieren ausschließlich auf der Heiligen Schrift und zielen darauf ab, Gläubige zu ermutigen und zu stärken.',
    'about.valuesTitle': 'Unsere Werte',
    'about.biblicalTruth': 'Biblische Wahrheit',
    'about.biblicalTruthText': 'Wir halten an der Autorität und Unfehlbarkeit der Heiligen Schrift fest und lehren nur das, was in der Bibel zu finden ist.',
    'about.community': 'Gemeinschaft',
    'about.communityText': 'Wir fördern eine Gemeinschaft von Gläubigen, die sich gegenseitig ermutigen und im Glauben wachsen.',
    'about.prayerDevotion': 'Gebet & Hingabe',
    'about.prayerDevotionText': 'Wir glauben an die Kraft des Gebets und ermutigen zu einer tiefen, persönlichen Beziehung zu Gott.',
    'about.transformation': 'Transformation',
    'about.transformationText': 'Wir streben nach echter Lebensveränderung durch die Anwendung biblischer Prinzipien im Alltag.',
    'about.authorTitle': 'Über den Autor',
    'about.authorText': 'D.S. ist ein leidenschaftlicher Bibellehrer und Autor, der sein Leben der Verkündigung der biblischen Wahrheit gewidmet hat. Mit jahrelanger Erfahrung in der Bibelauslegung und einer tiefen Liebe zum Wort Gottes, teilt er praktische und transformative Einsichten aus der Heiligen Schrift.',
    'about.getInTouch': 'Kontakt aufnehmen',
    'about.joinMovement': 'Werde Teil der Bewegung',
    'about.joinText': 'Entdecke authentische biblische Wahrheiten und lass dich von Gottes Wort transformieren. Begleite uns auf dieser Reise des Glaubens und geistlichen Wachstums.',
    'about.exploreBlogs': 'Blogs entdecken',
    'about.contact': 'Kontakt',
    
    // Quotes / Zitate / Citate
    'quotes.title': 'Inspirierende Bibelzitate',
    'quotes.verse': 'Weil du aber lau bist und weder kalt noch warm, werde ich dich ausspeien aus meinem Munde.',
    'quotes.reference': 'Offenbarung 3:16',
    'quotes.hope': 'Hoffnung',
    'quotes.faith': 'Glaube',
    'quotes.love': 'Liebe',
    
    // Common / Allgemein / General
    'common.loading': 'Lädt...',
    'common.error': 'Fehler',
    'common.success': 'Erfolgreich',
    'common.yes': 'Ja',
    'common.no': 'Nein',
    'common.ok': 'OK',
    'common.cancel': 'Abbrechen',
    
    // Language / Sprache / Limbă
    'language.german': 'Deutsch',
    'language.english': 'Englisch',
    'language.romanian': 'Rumänisch',
    'language.russian': 'Russisch',
    'language.switch': 'Sprache wechseln',
    
    // Footer / Fußzeile / Subsol
    'footer.copyright': '© 2025 RADIKAL. Alle Rechte vorbehalten.',
    'footer.builtWith': 'Entwickelt mit ❤️ und Next.js + Supabase',
  },
  en: {
    // Navigation / Navigation
    'nav.blogs': 'Blogs',
    'nav.quotes': 'Bible Quotes',
    'nav.about': 'About Us',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.admin': 'Admin',
    'nav.backToHome': 'Back to Home',
    
    // Home page / Startseite
    'home.title': 'RADICALLY.',
    'home.subtitle': 'Radical Bible Teaching Blog',
    'home.welcome': 'Welcome to RADIKAL.!',
    'home.description': 'Discover radical Bible teachings and profound spiritual insights. This platform offers authentic biblical truths that can transform your life.',
    'home.seeBlogs': 'View Blogs',
    'home.email': 'Email',
    'home.github': 'GitHub',
    'home.vercel': 'Powered by Vercel',
    'home.backToMenu': 'Back to Main Menu',
    
    // Blog page / Blog-Seite
    'blog.title': 'Latest Blogs',
    'blog.subtitle': 'Discover deep insights into the Bible and radical teachings that can transform your life.',
    'blog.olderBlogs': 'Older Blogs',
    'blog.loadMore': 'Load More',
    'blog.loadOlderBlogs': 'Load Older Blogs',
    'blog.loading': 'Loading...',
    'blog.noBlogs': 'No blogs found',
    'blog.readMore': 'Read More',
    'blog.like': 'Like',
    'blog.comment': 'Comment',
    'blog.share': 'Share',
    'blog.comments': 'Comments',
    'blog.writeComment': 'Write a comment',
    'blog.postComment': 'Post Comment',
    'blog.submitComment': 'Post Comment',
    'blog.backToBlogs': 'Back to Blogs',
    'blog.postNotFound': 'Post not found',
    'blog.loginToComment': 'Sign in to leave a comment.',
    'blog.login': 'Sign In',
    'blog.noComments': 'No comments yet. Be the first!',
    'blog.writeCommentPlaceholder': 'Write a comment...',
    
    // Admin / Admin
    'admin.createPost': 'Create New Post',
    'admin.editPost': 'Edit Post',
    'admin.deletePost': 'Delete Post',
    'admin.title': 'Title',
    'admin.content': 'Content',
    'admin.excerpt': 'Excerpt',
    'admin.publish': 'Publish',
    'admin.save': 'Save',
    'admin.cancel': 'Cancel',
    
    // Authentication / Authentifizierung
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.signInWithGithub': 'Sign in with Github',
    'auth.signInWithEmail': 'Sign in with Email',
    'auth.dontHaveAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    
    // Contact / Kontakt
    'contact.title': 'Contact Me',
    'contact.subtitle': 'Do you have questions, suggestions, or just want to say hello? I look forward to your message!',
    'contact.sendMessage': 'Send Message',
    'contact.successDetail': 'Thank you for your message! I will get back to you as soon as possible.',
    'contact.fillAllFields': 'Please fill in all fields.',
    'contact.validEmail': 'Please enter a valid email address.',
    'contact.sending': 'Sending...',
    'contact.timeout': 'Timeout. Please try again.',
    'contact.name': 'Name',
    'contact.email': 'Email',
    'contact.subject': 'Subject',
    'contact.message': 'Message',
    'contact.send': 'Send',
    'contact.success': 'Message sent successfully!',
    'contact.responseTime': 'Response Time',
    'contact.responseTimeValue': 'Within 24-48 hours',
    'contact.location': 'Location',
    'contact.placeholderName': 'Your Name',
    'contact.placeholderEmail': 'your@email.com',
    'contact.placeholderSubject': 'What is this about?',
    'contact.placeholderMessage': 'Your message...',
    'contact.contactDetails': 'Contact Details',
    'contact.followUs': 'Follow Us',
    'contact.faq': 'FAQ',
    'contact.faqResponse': 'How quickly will I get a response?',
    'contact.faqResponseAnswer': 'I usually respond within 24-48 hours.',
    'contact.faqGuest': 'Can I submit guest posts?',
    'contact.faqGuestAnswer': 'Absolutely! Send me your ideas and we can discuss them.',
    
    // About / Über uns
    'about.title': 'About Radikal.',
    'about.subtitle': 'A platform for authentic Bible teaching and spiritual transformation.',
    'about.mission': 'Our Mission',
    'about.missionText1': 'RADIKAL. is more than just a blog – it\'s a movement for authentic biblical truth. We believe in the transformative power of God\'s Word and want to help people develop a deeper relationship with Jesus Christ.',
    'about.missionText2': 'In a time when many superficial teachings are spread, we stand for radical biblical truths that can fundamentally change lives. Our content is based exclusively on the Holy Scriptures and aims to encourage and strengthen believers.',
    'about.valuesTitle': 'Our Values',
    'about.biblicalTruth': 'Biblical Truth',
    'about.biblicalTruthText': 'We adhere to the authority and infallibility of Scripture and teach only what is found in the Bible.',
    'about.community': 'Community',
    'about.communityText': 'We foster a community of believers who encourage each other and grow in faith.',
    'about.prayerDevotion': 'Prayer & Devotion',
    'about.prayerDevotionText': 'We believe in the power of prayer and encourage a deep, personal relationship with God.',
    'about.transformation': 'Transformation',
    'about.transformationText': 'We strive for genuine life change through the application of biblical principles in everyday life.',
    'about.authorTitle': 'About the Author',
    'about.authorText': 'D.S. is a passionate Bible teacher and author who has dedicated his life to proclaiming biblical truth. With years of experience in biblical interpretation and a deep love for God\'s Word, he shares practical and transformative insights from Scripture.',
    'about.getInTouch': 'Get in Touch',
    'about.joinMovement': 'Join the Movement',
    'about.joinText': 'Discover authentic biblical truths and let yourself be transformed by God\'s Word. Join us on this journey of faith and spiritual growth.',
    'about.exploreBlogs': 'Explore Blogs',
    'about.contact': 'Contact',
    
    // Quotes / Zitate
    'quotes.title': 'Inspiring Bible Quotes',
    'quotes.verse': 'So then because thou art lukewarm, and neither cold nor hot, I will spue thee out of my mouth.',
    'quotes.reference': 'Revelation 3:16',
    'quotes.hope': 'Hope',
    'quotes.faith': 'Faith',
    'quotes.love': 'Love',
    
    // Common / Allgemein
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.cancel': 'Cancel',
    
    // Language / Sprache
    'language.german': 'German',
    'language.english': 'English',
    'language.romanian': 'Romanian',
    'language.russian': 'Russian',
    'language.switch': 'Switch Language',
    
    // Footer / Fußzeile
    'footer.copyright': '© 2025 RADIKAL. All rights reserved.',
    'footer.builtWith': 'Built with ❤️ and Next.js + Supabase',
  },
  ro: {
    // Navigation / Navigare
    'nav.blogs': 'Bloguri',
    'nav.quotes': 'Citate Biblice',
    'nav.about': 'Despre noi',
    'nav.contact': 'Contact',
    'nav.login': 'Conectare',
    'nav.logout': 'Deconectare',
    'nav.admin': 'Admin',
    'nav.backToHome': 'Înapoi acasă',
    
    // Home page / Pagina principală
    'home.title': 'RADICAL.',
    'home.subtitle': 'Blog de Învățătură Biblică Radicală',
    'home.welcome': 'Bun venit la RADIKAL.!',
    'home.description': 'Descoperă învățături biblice radicale și înțelegeri spirituale profunde. Această platformă oferă adevăruri biblice autentice care îți pot transforma viața.',
    'home.seeBlogs': 'Vezi Blogurile',
    'home.email': 'Email',
    'home.github': 'GitHub',
    'home.vercel': 'Alimentat de Vercel',
    'home.backToMenu': 'Înapoi la meniul principal',
    
    // Blog page / Pagina blog
    'blog.title': 'Bloguri Recente',
    'blog.subtitle': 'Descoperă perspective profunde asupra Bibliei și învățături radicale care îți pot transforma viața.',
    'blog.olderBlogs': 'Bloguri Mai Vechi',
    'blog.loadMore': 'Încarcă Mai Multe',
    'blog.loadOlderBlogs': 'Încarcă Bloguri Mai Vechi',
    'blog.loading': 'Se încarcă...',
    'blog.noBlogs': 'Nu s-au găsit bloguri',
    'blog.readMore': 'Citește Mai Mult',
    'blog.like': 'Îmi place',
    'blog.comment': 'Comentează',
    'blog.share': 'Distribuie',
    'blog.comments': 'Comentarii',
    'blog.writeComment': 'Scrie un comentariu',
    'blog.postComment': 'Postează Comentariul',
    'blog.submitComment': 'Postează Comentariul',
    'blog.backToBlogs': 'Înapoi la Bloguri',
    'blog.postNotFound': 'Postarea nu a fost găsită',
    'blog.loginToComment': 'Conectează-te pentru a lăsa un comentariu.',
    'blog.login': 'Conectează-te',
    'blog.noComments': 'Încă nu sunt comentarii. Fii primul!',
    'blog.writeCommentPlaceholder': 'Scrie un comentariu...',
    
    // Admin / Admin
    'admin.createPost': 'Creează Postare Nouă',
    'admin.title': 'Postări',
    'admin.newPost': 'Postare Nouă',
    'admin.edit': 'Editează',
    'admin.delete': 'Șterge',
    'admin.deleteConfirm': 'Ești sigur că vrei să ștergi această postare?',
    'admin.postTitle': 'Titlul Postării',
    'admin.postContent': 'Conținutul Postării',
    'admin.postExcerpt': 'Extras din Postare',
    'admin.publishedDate': 'Data Publicării',
    'admin.featuredImage': 'Imagine Principală',
    'admin.save': 'Salvează',
    'admin.publish': 'Publică',
    'admin.draft': 'Ciornă',
    
    // Auth / Autentificare
    'auth.login': 'Conectare',
    'auth.signup': 'Înregistrare',
    'auth.email': 'Email',
    'auth.password': 'Parolă',
    'auth.confirmPassword': 'Confirmă Parola',
    'auth.forgotPassword': 'Ai uitat parola?',
    'auth.noAccount': 'Nu ai cont?',
    'auth.hasAccount': 'Ai deja cont?',
    'auth.signUp': 'Înregistrează-te',
    'auth.signIn': 'Conectează-te',
    'auth.signOut': 'Deconectează-te',
    
    // About / Despre
    'about.title': 'Despre Radikal.',
    'about.subtitle': 'O platformă pentru învățătură biblică autentică și transformare spirituală.',
    'about.mission': 'Misiunea Noastră',
    'about.missionText1': 'RADIKAL. este mai mult decât un simplu blog – este o mișcare pentru adevărul biblic autentic. Credem în puterea transformatoare a Cuvântului lui Dumnezeu și dorim să îi ajutăm pe oameni să dezvolte o relație mai profundă cu Isus Cristos.',
    'about.missionText2': 'Într-o vreme în care multe învățături superficiale sunt răspândite, noi susținem adevărurile biblice radicale care pot schimba viețile în mod fundamental. Conținutul nostru se bazează exclusiv pe Sfintele Scripturi și are ca scop să încurajeze și să întărească credincioșii.',
    'about.valuesTitle': 'Valorile Noastre',
    'about.biblicalTruth': 'Adevărul Biblic',
    'about.biblicalTruthText': 'Ne aderăm la autoritatea și infailibilitatea Scripturii și învățăm doar ceea ce se găsește în Biblie.',
    'about.community': 'Comunitate',
    'about.communityText': 'Promovăm o comunitate de credincioși care se încurajează reciproc și cresc în credință.',
    'about.prayerDevotion': 'Rugăciune și Devotament',
    'about.prayerDevotionText': 'Credem în puterea rugăciunii și încurajăm o relație profundă și personală cu Dumnezeu.',
    'about.transformation': 'Transformare',
    'about.transformationText': 'Ne străduim pentru o schimbare genuină a vieții prin aplicarea principiilor biblice în viața de zi cu zi.',
    'about.authorTitle': 'Despre Autor',
    'about.authorText': 'D.S. este un învățător biblic pasionat și autor care și-a dedicat viața proclamării adevărului biblic. Cu ani de experiență în interpretarea biblică și o dragoste profundă pentru Cuvântul lui Dumnezeu, el împărtășește perspective practice și transformatoare din Scriptură.',
    'about.getInTouch': 'Ia legătura',
    'about.joinMovement': 'Alătură-te Mișcării',
    'about.joinText': 'Descoperă adevăruri biblice autentice și lasă-te transformat de Cuvântul lui Dumnezeu. Alătură-te nouă în această călătorie a credinței și creșterii spirituale.',
    'about.exploreBlogs': 'Explorează Blogurile',
    'about.contact': 'Contact',
    
    // Contact / Contact
    'contact.title': 'Contact',
    'contact.subtitle': 'Ai întrebări, sugestii sau vrei doar să spui salut? Aștept cu nerăbdare mesajul tău!',
    'contact.sendMessage': 'Trimite Mesaj',
    'contact.successDetail': 'Mulțumesc pentru mesajul tău! Îți voi răspunde cât mai curând posibil.',
    'contact.fillAllFields': 'Te rog completează toate câmpurile.',
    'contact.validEmail': 'Te rog introdu o adresă de email validă.',
    'contact.sending': 'Se trimite...',
    'contact.timeout': 'Timpul a expirat. Te rog încearcă din nou.',
    'contact.getInTouch': 'Ia legătura cu noi',
    'contact.name': 'Nume',
    'contact.email': 'Email',
    'contact.subject': 'Subiect',
    'contact.message': 'Mesaj',
    'contact.send': 'Trimite',
    'contact.success': 'Mesaj trimis cu succes!',
    'contact.error': 'Eroare la trimiterea mesajului',
    'contact.responseTime': 'Timp de Răspuns',
    'contact.responseTimeValue': 'În 24-48 de ore',
    'contact.location': 'Locație',
    'contact.placeholderName': 'Numele tău',
    'contact.placeholderEmail': 'email@tau.com',
    'contact.placeholderSubject': 'Despre ce este vorba?',
    'contact.placeholderMessage': 'Mesajul tău...',
    'contact.contactDetails': 'Detalii de Contact',
    'contact.followUs': 'Urmărește-ne',
    'contact.faq': 'Întrebări Frecvente',
    'contact.faqResponse': 'Cât de repede voi primi un răspuns?',
    'contact.faqResponseAnswer': 'De obicei răspund în 24-48 de ore.',
    'contact.faqGuest': 'Pot să trimit articole ca invitat?',
    'contact.faqGuestAnswer': 'Absolut! Trimite-mi ideile tale și putem discuta despre ele.',
    
    // Quotes / Citate
    'quotes.title': 'Citate Biblice Inspiraționale',
    'quotes.verse': 'Așa, pentru că ești căldicel și nici rece, nici fierbinte, am să te vărs din gura Mea.',
    'quotes.reference': 'Apocalipsa 3:16',
    'quotes.subtitle': 'Înțelepciune și încurajare din Scriptură',
    'quotes.newQuote': 'Citat Nou',
    'quotes.refresh': 'Împrospătează',
    
    // Common / Comun
    'common.loading': 'Se încarcă...',
    'common.error': 'Eroare',
    'common.success': 'Succes',
    'common.yes': 'Da',
    'common.no': 'Nu',
    'common.ok': 'OK',
    'common.cancel': 'Anulează',
    
    // Language / Limbă
    'language.german': 'Germană',
    'language.english': 'Engleză',
    'language.romanian': 'Română',
    'language.russian': 'Rusă',
    'language.switch': 'Schimbă Limba',
    
    // Footer / Subsol
    'footer.copyright': '© 2025 RADIKAL. Toate drepturile rezervate.',
    'footer.builtWith': 'Dezvoltat cu ❤️ și Next.js + Supabase',
  },
  ru: {
    // Navigation / Навигация
    'nav.blogs': 'Блоги',
    'nav.quotes': 'Библейские Цитаты',
    'nav.about': 'О нас',
    'nav.contact': 'Контакт',
    'nav.login': 'Войти',
    'nav.logout': 'Выйти',
    'nav.admin': 'Админ',
    'nav.backToHome': 'Назад домой',
    
    // Home page / Главная страница
    'home.title': 'RADIKAL.',
    'home.subtitle': 'Блог Радикального Библейского Учения',
    'home.welcome': 'Добро пожаловать в RADIKAL.!',
    'home.description': 'Откройте для себя радикальные библейские учения и глубокие духовные прозрения. Эта платформа предлагает подлинные библейские истины, которые могут преобразить вашу жизнь.',
    'home.seeBlogs': 'Посмотреть Блоги',
    'home.email': 'Электронная почта',
    'home.github': 'GitHub',
    'home.vercel': 'Работает на Vercel',
    'home.backToMenu': 'Назад к главному меню',
    
    // Blog page / Страница блога
    'blog.title': 'Последние Блоги',
    'blog.subtitle': 'Откройте для себя глубокие прозрения в Библию и радикальные учения, которые могут преобразить вашу жизнь.',
    'blog.olderBlogs': 'Старые Блоги',
    'blog.loadMore': 'Загрузить Больше',
    'blog.loadOlderBlogs': 'Загрузить Старые Блоги',
    'blog.loading': 'Загрузка...',
    'blog.noBlogs': 'Блоги не найдены',
    'blog.readMore': 'Читать Далее',
    'blog.like': 'Нравится',
    'blog.comment': 'Комментировать',
    'blog.share': 'Поделиться',
    'blog.comments': 'Комментарии',
    'blog.writeComment': 'Написать комментарий',
    'blog.postComment': 'Опубликовать Комментарий',
    'blog.submitComment': 'Опубликовать Комментарий',
    'blog.backToBlogs': 'Назад к Блогам',
    'blog.postNotFound': 'Пост не найден',
    'blog.loginToComment': 'Войдите, чтобы оставить комментарий.',
    'blog.login': 'Войти',
    'blog.noComments': 'Пока нет комментариев. Будьте первым!',
    'blog.writeCommentPlaceholder': 'Написать комментарий...',
    
    // Admin / Админ
    'admin.createPost': 'Создать Новый Пост',
    'admin.title': 'Посты',
    'admin.newPost': 'Новый Пост',
    'admin.edit': 'Редактировать',
    'admin.delete': 'Удалить',
    'admin.deleteConfirm': 'Вы уверены, что хотите удалить этот пост?',
    'admin.postTitle': 'Заголовок Поста',
    'admin.postContent': 'Содержание Поста',
    'admin.postExcerpt': 'Выдержка из Поста',
    'admin.publishedDate': 'Дата Публикации',
    'admin.featuredImage': 'Главное Изображение',
    'admin.save': 'Сохранить',
    'admin.publish': 'Опубликовать',
    'admin.draft': 'Черновик',
    
    // Auth / Аутентификация
    'auth.login': 'Войти',
    'auth.signup': 'Регистрация',
    'auth.email': 'Электронная почта',
    'auth.password': 'Пароль',
    'auth.confirmPassword': 'Подтвердить Пароль',
    'auth.forgotPassword': 'Забыли пароль?',
    'auth.noAccount': 'Нет аккаунта?',
    'auth.hasAccount': 'Уже есть аккаунт?',
    'auth.signUp': 'Зарегистрироваться',
    'auth.signIn': 'Войти',
    'auth.signOut': 'Выйти',
    
    // About / О нас
    'about.title': 'О Radikal.',
    'about.subtitle': 'Платформа для подлинного библейского учения и духовного преобразования.',
    'about.mission': 'Наша Миссия',
    'about.missionText1': 'RADIKAL. - это больше, чем просто блог – это движение за подлинную библейскую истину. Мы верим в преобразующую силу Слова Божьего и хотим помочь людям развить более глубокие отношения с Иисусом Христом.',
    'about.missionText2': 'В время, когда распространяются многие поверхностные учения, мы выступаем за радикальные библейские истины, которые могут кардинально изменить жизни. Наш контент основан исключительно на Священном Писании и направлен на то, чтобы ободрить и укрепить верующих.',
    'about.valuesTitle': 'Наши Ценности',
    'about.biblicalTruth': 'Библейская Истина',
    'about.biblicalTruthText': 'Мы придерживаемся авторитета и непогрешимости Писания и учим только тому, что находится в Библии.',
    'about.community': 'Сообщество',
    'about.communityText': 'Мы воспитываем сообщество верующих, которые ободряют друг друга и растут в вере.',
    'about.prayerDevotion': 'Молитва и Посвящение',
    'about.prayerDevotionText': 'Мы верим в силу молитвы и поощряем глубокие, личные отношения с Богом.',
    'about.transformation': 'Преобразование',
    'about.transformationText': 'Мы стремимся к подлинному изменению жизни через применение библейских принципов в повседневной жизни.',
    'about.authorTitle': 'Об Авторе',
    'about.authorText': 'D.S. - страстный учитель Библии и автор, который посвятил свою жизнь провозглашению библейской истины. Имея многолетний опыт в библейской интерпретации и глубокую любовь к Слову Божьему, он делится практическими и преобразующими прозрениями из Писания.',
    'about.getInTouch': 'Связаться',
    'about.joinMovement': 'Присоединиться к Движению',
    'about.joinText': 'Откройте для себя подлинные библейские истины и позвольте себе быть преобразованными Словом Божьим. Присоединяйтесь к нам в этом путешествии веры и духовного роста.',
    'about.exploreBlogs': 'Исследовать Блоги',
    'about.contact': 'Контакт',
    
    // Contact / Контакт
    'contact.title': 'Контакт',
    'contact.subtitle': 'Есть вопросы, предложения или просто хотите поздороваться? Жду ваше сообщение!',
    'contact.sendMessage': 'Отправить Сообщение',
    'contact.successDetail': 'Спасибо за ваше сообщение! Я отвечу вам как можно скорее.',
    'contact.fillAllFields': 'Пожалуйста, заполните все поля.',
    'contact.validEmail': 'Пожалуйста, введите действительный адрес электронной почты.',
    'contact.sending': 'Отправка...',
    'contact.timeout': 'Тайм-аут. Пожалуйста, попробуйте еще раз.',
    'contact.getInTouch': 'Свяжитесь с нами',
    'contact.name': 'Имя',
    'contact.email': 'Электронная почта',
    'contact.subject': 'Тема',
    'contact.message': 'Сообщение',
    'contact.send': 'Отправить',
    'contact.success': 'Сообщение успешно отправлено!',
    'contact.error': 'Ошибка при отправке сообщения',
    'contact.responseTime': 'Время Ответа',
    'contact.responseTimeValue': 'В течение 24-48 часов',
    'contact.location': 'Местоположение',
    'contact.placeholderName': 'Ваше имя',
    'contact.placeholderEmail': 'ваш@email.com',
    'contact.placeholderSubject': 'О чем это?',
    'contact.placeholderMessage': 'Ваше сообщение...',
    'contact.contactDetails': 'Контактные Данные',
    'contact.followUs': 'Подписывайтесь',
    'contact.faq': 'Часто Задаваемые Вопросы',
    'contact.faqResponse': 'Как быстро я получу ответ?',
    'contact.faqResponseAnswer': 'Обычно я отвечаю в течение 24-48 часов.',
    'contact.faqGuest': 'Могу ли я отправить гостевые статьи?',
    'contact.faqGuestAnswer': 'Конечно! Пришлите мне свои идеи, и мы можем обсудить их.',
    
    // Quotes / Цитаты
    'quotes.title': 'Вдохновляющие Библейские Цитаты',
    'quotes.verse': 'Но как ты тепл, а не горяч и не холоден, то извергну тебя из уст Моих.',
    'quotes.reference': 'Откровение 3:16',
    'quotes.subtitle': 'Мудрость и ободрение из Писания',
    'quotes.newQuote': 'Новая Цитата',
    'quotes.refresh': 'Обновить',
    
    // Common / Общее
    'common.loading': 'Загрузка...',
    'common.error': 'Ошибка',
    'common.success': 'Успех',
    'common.yes': 'Да',
    'common.no': 'Нет',
    'common.ok': 'ОК',
    'common.cancel': 'Отмена',
    
    // Language / Язык
    'language.german': 'Немецкий',
    'language.english': 'Английский',
    'language.romanian': 'Румынский',
    'language.russian': 'Русский',
    'language.switch': 'Сменить Язык',
    
    // Footer / Подвал
    'footer.copyright': '© 2025 RADIKAL. Все права защищены.',
    'footer.builtWith': 'Создано с ❤️ и Next.js + Supabase',
  },
};

// Create language context / Sprachkontext erstellen
const LanguageContext = createContext<LanguageContextType | null>(null);

// Language provider component / Sprachanbieter-Komponente
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('de');
  const [mounted, setMounted] = useState(false);

  // Load saved language from localStorage - Now supports 4 languages / Gespeicherte Sprache aus localStorage laden - Unterstützt jetzt 4 Sprachen
  useEffect(() => {
    const savedLanguage = localStorage.getItem('radikal-language') as Language;
    if (savedLanguage && (savedLanguage === 'de' || savedLanguage === 'en' || savedLanguage === 'ro' || savedLanguage === 'ru')) {
      setLanguage(savedLanguage);
    }
    setMounted(true);
  }, []);

  // Save language to localStorage / Sprache in localStorage speichern
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('radikal-language', language);
    }
  }, [language, mounted]);

  // Translation function with better error handling / Übersetzungsfunktion mit besserer Fehlerbehandlung
  const t = (key: string): string => {
    // Return empty string if key is empty
    if (!key) return '';
    
    // Always try to get translation, even during SSR
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = null;
        break;
      }
    }
    
    // If no translation found, try fallback languages in order: German -> English -> Romanian -> Russian
    if (!value && language !== 'de') {
      // Try German first as primary fallback
      let fallbackValue: any = translations.de;
      for (const k of keys) {
        if (fallbackValue && typeof fallbackValue === 'object') {
          fallbackValue = fallbackValue[k];
        } else {
          fallbackValue = null;
          break;
        }
      }
      value = fallbackValue;
      
      // If still no value and not English, try English
      if (!value && language !== 'en') {
        let englishValue: any = translations.en;
        for (const k of keys) {
          if (englishValue && typeof englishValue === 'object') {
            englishValue = englishValue[k];
          } else {
            englishValue = null;
            break;
          }
        }
        value = englishValue;
      }
    }
    
    // Return translation or a fallback text for all 4 languages instead of the key
    if (!value) {
      // Provide better fallbacks for common keys in all supported languages
      const fallbacks: { [key: string]: string } = {
        'home.title': 'RADIKAL.',
        'home.subtitle': 
          language === 'de' ? 'Radikale Bibellehre Blog' : 
          language === 'en' ? 'Radical Bible Teaching Blog' :
          language === 'ro' ? 'Blog de Învățătură Biblică Radicală' :
          'Блог Радикального Библейского Учения',
        'home.welcome': 
          language === 'de' ? 'Willkommen bei RADIKAL.!' : 
          language === 'en' ? 'Welcome to RADIKAL.!' :
          language === 'ro' ? 'Bun venit la RADIKAL.!' :
          'Добро пожаловать в RADIKAL.!',
        'home.description': 
          language === 'de' ? 'Entdecke radikale Bibellehren und tiefgreifende geistliche Einsichten.' : 
          language === 'en' ? 'Discover radical Bible teachings and profound spiritual insights.' :
          language === 'ro' ? 'Descoperă învățături biblice radicale și înțelegeri spirituale profunde.' :
          'Откройте для себя радикальные библейские учения и глубокие духовные прозрения.',
        'home.email': 
          language === 'de' ? 'E-Mail' : 
          language === 'en' ? 'Email' :
          language === 'ro' ? 'Email' :
          'Электронная почта',
        'home.seeBlogs': 
          language === 'de' ? 'Blogs ansehen' : 
          language === 'en' ? 'View Blogs' :
          language === 'ro' ? 'Vezi Blogurile' :
          'Посмотреть Блоги',
        'home.github': 'GitHub',
        'home.vercel': 'Powered by Vercel',
        'nav.blogs': 
          language === 'de' ? 'Blogs' : 
          language === 'en' ? 'Blogs' :
          language === 'ro' ? 'Bloguri' :
          'Блоги',
        'nav.quotes': 
          language === 'de' ? 'Bibelzitate' : 
          language === 'en' ? 'Bible Quotes' :
          language === 'ro' ? 'Citate Biblice' :
          'Библейские Цитаты',
        'nav.about': 
          language === 'de' ? 'Über uns' : 
          language === 'en' ? 'About' :
          language === 'ro' ? 'Despre noi' :
          'О нас',
        'nav.contact': 
          language === 'de' ? 'Kontakt' : 
          language === 'en' ? 'Contact' :
          language === 'ro' ? 'Contact' :
          'Контакт',
        'nav.login': 
          language === 'de' ? 'Anmelden' : 
          language === 'en' ? 'Login' :
          language === 'ro' ? 'Conectare' :
          'Войти',
        'nav.logout': 
          language === 'de' ? 'Abmelden' : 
          language === 'en' ? 'Logout' :
          language === 'ro' ? 'Deconectare' :
          'Выйти',
        'nav.backToHome': 
          language === 'de' ? 'Zurück zur Startseite' : 
          language === 'en' ? 'Back to Home' :
          language === 'ro' ? 'Înapoi acasă' :
          'Назад домой',
        'blog.title': 
          language === 'de' ? 'Neueste Blogs' : 
          language === 'en' ? 'Latest Blogs' :
          language === 'ro' ? 'Bloguri Recente' :
          'Последние Блоги',
        'blog.readMore': 
          language === 'de' ? 'Weiterlesen' : 
          language === 'en' ? 'Read More' :
          language === 'ro' ? 'Citește Mai Mult' :
          'Читать Далее',
        'common.loading': 
          language === 'de' ? 'Lädt...' : 
          language === 'en' ? 'Loading...' :
          language === 'ro' ? 'Se încarcă...' :
          'Загрузка...'
      };
      
      // Return fallback or formatted key as last resort
      return fallbacks[key] || key.split('.').pop() || key;
    }
    
    return value;
  };

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t,
    mounted,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      <div suppressHydrationWarning>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

// Custom hook to use language context / Custom Hook zur Verwendung des Sprachkontexts
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
