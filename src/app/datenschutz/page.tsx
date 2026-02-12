// Datenschutz (Privacy Policy) Page for GDPR Compliance / Datenschutz-Seite für DSGVO-Konformität / Pagina Politica de Confidențialitate pentru conformitate GDPR
// This page contains the privacy policy required by German and EU law
// Diese Seite enthält die Datenschutzerklärung gemäß deutschem und EU-Recht
// Această pagină conține politica de confidențialitate cerută de legislația germană și UE

'use client';

import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';

// Translations for Datenschutz page
const translations = {
  de: {
    backToHome: '← Zurück zur Startseite',
    title: 'Datenschutzerklärung',
    titleLine1: 'DATENSCHUTZ-',
    titleLine2: 'ERKLÄRUNG',
    subtitle: 'Zuletzt aktualisiert: Januar 2026',
    
    // 1. Introduction
    introTitle: '1. Einleitung',
    introText: 'Mit der folgenden Datenschutzerklärung möchten wir Sie darüber aufklären, welche Arten Ihrer personenbezogenen Daten (nachfolgend auch kurz als "Daten" bezeichnet) wir zu welchen Zwecken und in welchem Umfang verarbeiten. Die Datenschutzerklärung gilt für alle von uns durchgeführten Verarbeitungen personenbezogener Daten, sowohl im Rahmen der Erbringung unserer Leistungen als auch insbesondere auf unserer Webseite.',
    
    // 2. Responsible
    responsibleTitle: '2. Verantwortlicher',
    responsibleName: 'RADIKAL Blog',
    responsibleEmail: 'E-Mail',
    
    // 3. Processing overview
    processingTitle: '3. Übersicht der Verarbeitungen',
    processingIntro: 'Die nachfolgende Übersicht fasst die Arten der verarbeiteten Daten und die Zwecke ihrer Verarbeitung zusammen:',
    processingItems: [
      'Bestandsdaten (z.B. Namen, Adressen)',
      'Inhaltsdaten (z.B. Kommentare, Eingaben in Formularen)',
      'Kontaktdaten (z.B. E-Mail-Adressen)',
      'Nutzungsdaten (z.B. besuchte Seiten, Zugriffszeiten)',
      'Meta-/Kommunikationsdaten (z.B. IP-Adressen, Geräte-Informationen)',
    ],
    
    // 4. Legal basis
    legalTitle: '4. Rechtsgrundlagen',
    legalIntro: 'Im Folgenden teilen wir die Rechtsgrundlagen der DSGVO mit, auf deren Basis wir personenbezogene Daten verarbeiten:',
    legalItems: [
      { title: 'Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)', text: 'Die betroffene Person hat ihre Einwilligung gegeben.' },
      { title: 'Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)', text: 'Verarbeitung für die Erfüllung eines Vertrags.' },
      { title: 'Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO)', text: 'Verarbeitung zur Erfüllung einer rechtlichen Verpflichtung.' },
      { title: 'Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO)', text: 'Verarbeitung zur Wahrung berechtigter Interessen.' },
    ],
    
    // 5. Cookies
    cookiesTitle: '5. Cookies',
    cookiesIntro: 'Wir verwenden Cookies auf unserer Website. Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden. Einige Cookies sind technisch notwendig, während andere uns helfen, die Website zu verbessern.',
    cookiesNecessary: 'Notwendige Cookies',
    cookiesNecessaryText: 'Diese Cookies sind für die Funktion der Website erforderlich und können nicht deaktiviert werden.',
    cookiesAnalytics: 'Analyse-Cookies',
    cookiesAnalyticsText: 'Mit Ihrer Einwilligung verwenden wir Analyse-Cookies, um zu verstehen, wie Besucher unsere Website nutzen.',
    cookiesSettings: 'Cookie-Einstellungen ändern',
    cookiesSettingsText: 'Sie können Ihre Cookie-Einstellungen jederzeit über die Browser-Einstellungen verwalten. Die meisten Browser bieten die Möglichkeit, Cookies zu blockieren oder zu löschen.',
    
    // 6. Hosting
    hostingTitle: '6. Hosting',
    hostingText: 'Unsere Website wird bei Vercel Inc. gehostet. Die Domain www.radikal.blog wird über checkdomain.de verwaltet. Vercel und checkdomain können technische Daten wie IP-Adressen und Zugriffszeiten erfassen, die für den Betrieb der Website erforderlich sind.',
    
    // 7. Database
    databaseTitle: '7. Datenbank (Supabase)',
    databaseText: 'Für die Speicherung von Daten nutzen wir Supabase. Supabase speichert Ihre Daten sicher in der EU (Deutschland/Frankfurt).',
    
    // 8. Your rights
    rightsTitle: '8. Ihre Rechte',
    rightsIntro: 'Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:',
    rightsItems: [
      'Recht auf Auskunft über Ihre gespeicherten Daten',
      'Recht auf Berichtigung unrichtiger Daten',
      'Recht auf Löschung Ihrer Daten',
      'Recht auf Einschränkung der Verarbeitung',
      'Recht auf Datenübertragbarkeit',
      'Recht auf Widerspruch gegen die Verarbeitung',
    ],
    
    // 9. Contact forms
    contactTitle: '9. Kontaktformular',
    contactText: 'Wenn Sie uns über ein Kontaktformular kontaktieren, speichern wir die von Ihnen angegebenen Daten (Name, E-Mail, Nachricht) zur Bearbeitung Ihrer Anfrage. Diese Daten werden nach Abschluss der Bearbeitung gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.',
    
    // 10. Comments
    commentsTitle: '10. Kommentare',
    commentsText: 'Wenn Sie Kommentare auf unserem Blog hinterlassen, speichern wir die von Ihnen eingegebenen Daten sowie Ihre IP-Adresse und den Zeitpunkt der Erstellung. Dies dient der Sicherheit und der Möglichkeit, rechtswidrige Kommentare zu verfolgen.',
    
    // 11. Newsletter
    newsletterTitle: '11. Newsletter',
    newsletterText: 'Wenn Sie unseren Newsletter abonnieren, speichern wir Ihre E-Mail-Adresse. Sie können den Newsletter jederzeit über den Abmeldelink in jeder E-Mail oder direkt in der Anwendung auf der Blogseite unter „Newsletter-Einstellungen" abbestellen.',
    
    // Footer links
    impressum: 'Impressum',
    contact: 'Kontakt',
    home: 'Startseite',
  },
  en: {
    backToHome: '← Back to Home',
    title: 'Privacy Policy',
    titleLine1: 'PRIVACY',
    titleLine2: 'POLICY',
    subtitle: 'Last updated: January 2026',
    
    introTitle: '1. Introduction',
    introText: 'With the following privacy policy, we would like to inform you about the types of your personal data (hereinafter also referred to as "data") that we process, for what purposes and to what extent. The privacy policy applies to all processing of personal data carried out by us, both in the context of providing our services and in particular on our website.',
    
    responsibleTitle: '2. Data Controller',
    responsibleName: 'RADIKAL Blog',
    responsibleEmail: 'Email',
    
    processingTitle: '3. Overview of Processing',
    processingIntro: 'The following overview summarizes the types of data processed and the purposes of their processing:',
    processingItems: [
      'Inventory data (e.g., names, addresses)',
      'Content data (e.g., comments, form entries)',
      'Contact data (e.g., email addresses)',
      'Usage data (e.g., pages visited, access times)',
      'Meta/communication data (e.g., IP addresses, device information)',
    ],
    
    legalTitle: '4. Legal Basis',
    legalIntro: 'Below we share the legal bases of the GDPR on which we process personal data:',
    legalItems: [
      { title: 'Consent (Art. 6 para. 1 lit. a GDPR)', text: 'The data subject has given consent.' },
      { title: 'Contract Performance (Art. 6 para. 1 lit. b GDPR)', text: 'Processing for the fulfillment of a contract.' },
      { title: 'Legal Obligation (Art. 6 para. 1 lit. c GDPR)', text: 'Processing to fulfill a legal obligation.' },
      { title: 'Legitimate Interests (Art. 6 para. 1 lit. f GDPR)', text: 'Processing to protect legitimate interests.' },
    ],
    
    cookiesTitle: '5. Cookies',
    cookiesIntro: 'We use cookies on our website. Cookies are small text files that are stored on your device. Some cookies are technically necessary, while others help us improve the website.',
    cookiesNecessary: 'Necessary Cookies',
    cookiesNecessaryText: 'These cookies are required for the website to function and cannot be disabled.',
    cookiesAnalytics: 'Analytics Cookies',
    cookiesAnalyticsText: 'With your consent, we use analytics cookies to understand how visitors use our website.',
    cookiesSettings: 'Change Cookie Settings',
    cookiesSettingsText: 'You can manage your cookie settings at any time through your browser settings. Most browsers offer the option to block or delete cookies.',
    
    hostingTitle: '6. Hosting',
    hostingText: 'Our website is hosted by Vercel Inc. The domain www.radikal.blog is managed through checkdomain.de. Vercel and checkdomain may collect technical data such as IP addresses and access times necessary for the operation of the website.',
    
    databaseTitle: '7. Database (Supabase)',
    databaseText: 'We use Supabase for data storage. Supabase stores your data securely in the EU (Germany/Frankfurt).',
    
    rightsTitle: '8. Your Rights',
    rightsIntro: 'You have the following rights regarding your personal data:',
    rightsItems: [
      'Right to access your stored data',
      'Right to rectification of inaccurate data',
      'Right to erasure of your data',
      'Right to restriction of processing',
      'Right to data portability',
      'Right to object to processing',
    ],
    
    contactTitle: '9. Contact Form',
    contactText: 'When you contact us via a contact form, we store the data you provide (name, email, message) to process your request. This data will be deleted after processing is complete, unless there are legal retention obligations.',
    
    commentsTitle: '10. Comments',
    commentsText: 'When you leave comments on our blog, we store the data you enter as well as your IP address and the time of creation. This is for security and the ability to track illegal comments.',
    
    newsletterTitle: '11. Newsletter',
    newsletterText: 'When you subscribe to our newsletter, we store your email address. You can unsubscribe from the newsletter at any time via the unsubscribe link in each email or directly in the application on the blogs page under "Newsletter Settings".',
    
    impressum: 'Legal Notice',
    contact: 'Contact',
    home: 'Home',
  },
  ro: {
    backToHome: '← Înapoi la Pagina Principală',
    title: 'Politica de Confidențialitate',
    titleLine1: 'POLITICA DE',
    titleLine2: 'CONFIDENȚIALITATE',
    subtitle: 'Ultima actualizare: Ianuarie 2026',
    
    introTitle: '1. Introducere',
    introText: 'Cu următoarea politică de confidențialitate, dorim să vă informăm despre tipurile de date personale (denumite în continuare și "date") pe care le procesăm, în ce scopuri și în ce măsură. Politica de confidențialitate se aplică tuturor procesărilor de date personale efectuate de noi, atât în contextul furnizării serviciilor noastre, cât și în special pe site-ul nostru.',
    
    responsibleTitle: '2. Operator de Date',
    responsibleName: 'RADIKAL Blog',
    responsibleEmail: 'Email',
    
    processingTitle: '3. Prezentare Generală a Procesării',
    processingIntro: 'Următoarea prezentare generală rezumă tipurile de date procesate și scopurile procesării lor:',
    processingItems: [
      'Date de inventar (de ex., nume, adrese)',
      'Date de conținut (de ex., comentarii, introduceri în formulare)',
      'Date de contact (de ex., adrese de email)',
      'Date de utilizare (de ex., pagini vizitate, ore de acces)',
      'Date meta/comunicare (de ex., adrese IP, informații despre dispozitiv)',
    ],
    
    legalTitle: '4. Temei Legal',
    legalIntro: 'Mai jos vă prezentăm temeiurile legale ale GDPR pe baza cărora procesăm datele personale:',
    legalItems: [
      { title: 'Consimțământ (Art. 6 alin. 1 lit. a GDPR)', text: 'Persoana vizată și-a dat consimțământul.' },
      { title: 'Executarea Contractului (Art. 6 alin. 1 lit. b GDPR)', text: 'Procesare pentru îndeplinirea unui contract.' },
      { title: 'Obligație Legală (Art. 6 alin. 1 lit. c GDPR)', text: 'Procesare pentru îndeplinirea unei obligații legale.' },
      { title: 'Interese Legitime (Art. 6 alin. 1 lit. f GDPR)', text: 'Procesare pentru protejarea intereselor legitime.' },
    ],
    
    cookiesTitle: '5. Cookie-uri',
    cookiesIntro: 'Folosim cookie-uri pe site-ul nostru. Cookie-urile sunt fișiere text mici care sunt stocate pe dispozitivul dvs. Unele cookie-uri sunt necesare din punct de vedere tehnic, în timp ce altele ne ajută să îmbunătățim site-ul.',
    cookiesNecessary: 'Cookie-uri Necesare',
    cookiesNecessaryText: 'Aceste cookie-uri sunt necesare pentru funcționarea site-ului și nu pot fi dezactivate.',
    cookiesAnalytics: 'Cookie-uri de Analiză',
    cookiesAnalyticsText: 'Cu consimțământul dvs., folosim cookie-uri de analiză pentru a înțelege cum vizitatorii folosesc site-ul nostru.',
    cookiesSettings: 'Modificați Setările Cookie',
    cookiesSettingsText: 'Puteți gestiona setările cookie în orice moment prin setările browserului dumneavoastră. Majoritatea browserelor oferă opțiunea de a bloca sau șterge cookie-urile.',
    
    hostingTitle: '6. Găzduire',
    hostingText: 'Site-ul nostru este găzduit de Vercel Inc. Domeniul www.radikal.blog este administrat prin checkdomain.de. Vercel și checkdomain pot colecta date tehnice precum adrese IP și ore de acces necesare pentru funcționarea site-ului.',
    
    databaseTitle: '7. Baza de Date (Supabase)',
    databaseText: 'Folosim Supabase pentru stocarea datelor. Supabase stochează datele dvs. în siguranță în UE (Germania/Frankfurt).',
    
    rightsTitle: '8. Drepturile Dvs.',
    rightsIntro: 'Aveți următoarele drepturi referitoare la datele dvs. personale:',
    rightsItems: [
      'Dreptul de a accesa datele stocate',
      'Dreptul la rectificarea datelor incorecte',
      'Dreptul la ștergerea datelor',
      'Dreptul la restricționarea procesării',
      'Dreptul la portabilitatea datelor',
      'Dreptul de a vă opune procesării',
    ],
    
    contactTitle: '9. Formular de Contact',
    contactText: 'Când ne contactați prin formularul de contact, stocăm datele pe care le furnizați (nume, email, mesaj) pentru a procesa cererea dvs. Aceste date vor fi șterse după finalizarea procesării, cu excepția cazului în care există obligații legale de păstrare.',
    
    commentsTitle: '10. Comentarii',
    commentsText: 'Când lăsați comentarii pe blogul nostru, stocăm datele pe care le introduceți, precum și adresa dvs. IP și ora creării. Acest lucru este pentru securitate și capacitatea de a urmări comentariile ilegale.',
    
    newsletterTitle: '11. Newsletter',
    newsletterText: 'Când vă abonați la newsletter-ul nostru, stocăm adresa dvs. de email. Vă puteți dezabona de la newsletter în orice moment prin link-ul de dezabonare din fiecare email sau direct din aplicație pe pagina de bloguri sub „Setări Newsletter".',
    
    impressum: 'Imprimat Legal',
    contact: 'Contact',
    home: 'Acasă',
  },
  ru: {
    backToHome: '← Вернуться на главную',
    title: 'Политика конфиденциальности',
    titleLine1: 'ПОЛИТИКА',
    titleLine2: 'КОНФИДЕНЦИАЛЬНОСТИ',
    subtitle: 'Последнее обновление: Январь 2026',
    
    introTitle: '1. Введение',
    introText: 'В следующей политике конфиденциальности мы хотели бы проинформировать вас о типах ваших персональных данных (далее также называемых "данными"), которые мы обрабатываем, в каких целях и в каком объёме. Политика конфиденциальности применяется ко всей обработке персональных данных, осуществляемой нами, как в контексте предоставления наших услуг, так и особенно на нашем веб-сайте.',
    
    responsibleTitle: '2. Оператор данных',
    responsibleName: 'RADIKAL Blog',
    responsibleEmail: 'Эл. почта',
    
    processingTitle: '3. Обзор обработки',
    processingIntro: 'Следующий обзор обобщает типы обрабатываемых данных и цели их обработки:',
    processingItems: [
      'Инвентарные данные (например, имена, адреса)',
      'Контентные данные (например, комментарии, записи в формах)',
      'Контактные данные (например, адреса электронной почты)',
      'Данные об использовании (например, посещённые страницы, время доступа)',
      'Мета/коммуникационные данные (например, IP-адреса, информация об устройстве)',
    ],
    
    legalTitle: '4. Правовая основа',
    legalIntro: 'Ниже мы сообщаем правовые основы GDPR, на основании которых мы обрабатываем персональные данные:',
    legalItems: [
      { title: 'Согласие (Ст. 6 п. 1 лит. a GDPR)', text: 'Субъект данных дал согласие.' },
      { title: 'Исполнение договора (Ст. 6 п. 1 лит. b GDPR)', text: 'Обработка для выполнения договора.' },
      { title: 'Юридическое обязательство (Ст. 6 п. 1 лит. c GDPR)', text: 'Обработка для выполнения юридического обязательства.' },
      { title: 'Законные интересы (Ст. 6 п. 1 лит. f GDPR)', text: 'Обработка для защиты законных интересов.' },
    ],
    
    cookiesTitle: '5. Cookies',
    cookiesIntro: 'Мы используем cookies на нашем веб-сайте. Cookies — это небольшие текстовые файлы, которые сохраняются на вашем устройстве. Некоторые cookies технически необходимы, другие помогают нам улучшить веб-сайт.',
    cookiesNecessary: 'Необходимые Cookies',
    cookiesNecessaryText: 'Эти cookies необходимы для работы веб-сайта и не могут быть отключены.',
    cookiesAnalytics: 'Аналитические Cookies',
    cookiesAnalyticsText: 'С вашего согласия мы используем аналитические cookies, чтобы понять, как посетители используют наш веб-сайт.',
    cookiesSettings: 'Изменить настройки Cookies',
    cookiesSettingsText: 'Вы можете управлять настройками cookies в любое время через настройки вашего браузера. Большинство браузеров предлагают возможность блокировать или удалять cookies.',
    
    hostingTitle: '6. Хостинг',
    hostingText: 'Наш веб-сайт размещён на Vercel Inc. Домен www.radikal.blog управляется через checkdomain.de. Vercel и checkdomain могут собирать технические данные, такие как IP-адреса и время доступа, необходимые для работы веб-сайта.',
    
    databaseTitle: '7. База данных (Supabase)',
    databaseText: 'Мы используем Supabase для хранения данных. Supabase хранит ваши данные безопасно в ЕС (Германия/Франкфурт).',
    
    rightsTitle: '8. Ваши права',
    rightsIntro: 'Вы имеете следующие права в отношении ваших персональных данных:',
    rightsItems: [
      'Право на доступ к вашим сохранённым данным',
      'Право на исправление неточных данных',
      'Право на удаление ваших данных',
      'Право на ограничение обработки',
      'Право на переносимость данных',
      'Право на возражение против обработки',
    ],
    
    contactTitle: '9. Контактная форма',
    contactText: 'Когда вы связываетесь с нами через контактную форму, мы сохраняем предоставленные вами данные (имя, email, сообщение) для обработки вашего запроса. Эти данные будут удалены после завершения обработки, если нет юридических обязательств по их хранению.',
    
    commentsTitle: '10. Комментарии',
    commentsText: 'Когда вы оставляете комментарии в нашем блоге, мы сохраняем введённые вами данные, а также ваш IP-адрес и время создания. Это делается для безопасности и возможности отслеживания незаконных комментариев.',
    
    newsletterTitle: '11. Рассылка',
    newsletterText: 'Когда вы подписываетесь на нашу рассылку, мы сохраняем ваш адрес электронной почты. Вы можете отписаться от рассылки в любое время через ссылку отписки в каждом письме или непосредственно в приложении на странице блогов в разделе «Настройки рассылки».',
    
    impressum: 'Юридическая информация',
    contact: 'Контакт',
    home: 'Главная',
  },
};

export default function DatenschutzPage() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.de;
  
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white py-20 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href="/"
            className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-4 inline-flex items-center gap-2 transition-colors"
          >
            {t.backToHome}
          </Link>
          {/* Desktop: un rând / Mobile: două rânduri */}
          <h1 className="font-cinzel font-bold mt-4 mb-4">
            {/* Desktop - afișează titlul complet */}
            <span className="hidden md:block text-4xl lg:text-5xl">
              {t.title}
            </span>
            {/* Mobile - afișează pe două rânduri, puțin mai mic */}
            <span className="block md:hidden">
              <span className="block text-2xl sm:text-3xl">{t.titleLine1}</span>
              <span className="block text-xl sm:text-2xl">{t.titleLine2}</span>
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.subtitle}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          
          {/* 1. Introduction */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.introTitle}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t.introText}
            </p>
          </section>

          {/* 2. Responsible */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.responsibleTitle}</h2>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <p className="text-gray-700 dark:text-gray-300">
                <strong className="text-black dark:text-white">{t.responsibleName}</strong><br /><br />
                {t.responsibleEmail}: <a href="mailto:kontakt@radikal-blog.de" className="text-red-600 dark:text-red-400 hover:underline">kontakt@radikal-blog.de</a>
              </p>
            </div>
          </section>

          {/* 3. Processing overview */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.processingTitle}</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t.processingIntro}
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              {t.processingItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 4. Legal basis */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.legalTitle}</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t.legalIntro}
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              {t.legalItems.map((item, index) => (
                <li key={index}><strong>{item.title}</strong> - {item.text}</li>
              ))}
            </ul>
          </section>

          {/* 5. Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.cookiesTitle}</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t.cookiesIntro}
            </p>
            
            <h3 className="text-xl font-semibold text-black dark:text-white mt-6 mb-3">{t.cookiesNecessary}</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t.cookiesNecessaryText}
            </p>
            
            <h3 className="text-xl font-semibold text-black dark:text-white mt-6 mb-3">{t.cookiesAnalytics}</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t.cookiesAnalyticsText}
            </p>
            
            <h3 className="text-xl font-semibold text-black dark:text-white mt-6 mb-3">{t.cookiesSettings}</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {t.cookiesSettingsText}
            </p>
          </section>

          {/* 6. Hosting */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.hostingTitle}</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t.hostingText}
            </p>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                <strong>Vercel Inc.</strong><br />
                340 S Lemon Ave #4133<br />
                Walnut, CA 91789, USA<br />
                <a href="https://vercel.com/legal/privacy-policy" className="text-red-600 dark:text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  Vercel Privacy Policy
                </a>
              </p>
            </div>
          </section>

          {/* 7. Database */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.databaseTitle}</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t.databaseText}
            </p>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                <strong>Supabase Inc.</strong><br />
                <a href="https://supabase.com/privacy" className="text-red-600 dark:text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  Supabase Privacy Policy
                </a>
              </p>
            </div>
          </section>

          {/* 8. Your rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.rightsTitle}</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t.rightsIntro}
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              {t.rightsItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 9. Contact form */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.contactTitle}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t.contactText}
            </p>
          </section>

          {/* 10. Comments */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.commentsTitle}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t.commentsText}
            </p>
          </section>

          {/* 11. Newsletter */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.newsletterTitle}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t.newsletterText}
            </p>
          </section>

        </div>

        {/* Footer Links */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap gap-4">
            <Link href="/impressum" className="text-red-600 dark:text-red-400 hover:underline">
              {t.impressum}
            </Link>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <Link href="/contact" className="text-red-600 dark:text-red-400 hover:underline">
              {t.contact}
            </Link>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <Link href="/" className="text-red-600 dark:text-red-400 hover:underline">
              {t.home}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
