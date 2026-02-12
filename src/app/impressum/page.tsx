// Impressum (Legal Notice) Page - Required by German Law / Impressum-Seite - Gesetzlich vorgeschrieben in Deutschland / Pagina Imprint - Cerută de legea germană
// This page contains the legal notice required by German Telemediengesetz (TMG)
// Diese Seite enthält das Impressum gemäß § 5 TMG
// Această pagină conține informațiile legale cerute de legea germană TMG

'use client';

import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';

// Translations for Impressum page
const translations = {
  de: {
    backToHome: '← Zurück zur Startseite',
    title: 'Impressum',
    subtitle: 'Angaben gemäß § 5 TMG',
    
    // Provider info
    providerTitle: 'Angaben zum Diensteanbieter',
    blogName: 'RADIKAL Blog',
    providerNote: 'Dieser Blog wird als privates, nicht-kommerzielles Projekt betrieben. Gemäß § 5 TMG können private Blogs bestimmte Ausnahmen in Anspruch nehmen.',
    
    // Contact
    contactTitle: 'Kontakt',
    email: 'E-Mail',
    website: 'Website',
    
    // Responsible
    responsibleTitle: 'Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV',
    responsibleNote: 'Für Anfragen bezüglich der Inhalte wenden Sie sich bitte per E-Mail an uns.',
    
    // EU Dispute
    euDisputeTitle: 'EU-Streitschlichtung',
    euDisputeText: 'Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:',
    euDisputeNote: 'Unsere E-Mail-Adresse finden Sie oben im Impressum.',
    
    // Consumer dispute
    consumerDisputeTitle: 'Verbraucherstreitbeilegung/Universalschlichtungsstelle',
    consumerDisputeText: 'Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
    
    // Liability content
    liabilityContentTitle: 'Haftung für Inhalte',
    liabilityContentText1: 'Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.',
    liabilityContentText2: 'Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.',
    
    // Liability links
    liabilityLinksTitle: 'Haftung für Links',
    liabilityLinksText1: 'Derzeit enthält unser Angebot keine Links zu externen Websites Dritter. Sollten in Zukunft Links zu externen Seiten Dritter eingebunden werden, übernehmen wir keine Haftung für deren Inhalte, da wir auf diese keinen Einfluss haben.',
    liabilityLinksText2: 'Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich. Sollten Links hinzugefügt werden, werden diese zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.',
    
    // Copyright
    copyrightTitle: 'Urheberrecht',
    copyrightText1: 'Sämtliche Inhalte und Werke auf diesen Seiten wurden vom Betreiber persönlich erstellt und unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des Autors.',
    copyrightText2: 'Downloads und Kopien dieser Seite sind nicht gestattet. Sollten in Zukunft Inhalte Dritter auf dieser Seite erscheinen, werden diese ausdrücklich als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.',
    
    // Bible quotes
    bibleTitle: 'Verwendete Bibelübersetzungen',
    bibleText: 'Die auf dieser Website verwendeten Bibelzitate stammen aus verschiedenen Übersetzungen. Falls nicht anders angegeben, verwenden wir die Lutherbibel, Elberfelder (Deutsch), King James Version (Englisch), Dumitru Cornilescu (Rumänisch) und Synodal Translation (Russisch) sowie andere gemeinfreie Übersetzungen.',
    
    // Footer links
    privacy: 'Datenschutz',
    contact: 'Kontakt',
    home: 'Startseite',
  },
  en: {
    backToHome: '← Back to Home',
    title: 'Legal Notice',
    subtitle: 'Information according to § 5 TMG (German Telemedia Act)',
    
    providerTitle: 'Service Provider Information',
    blogName: 'RADIKAL Blog',
    providerNote: 'This blog is operated as a private, non-commercial project. According to § 5 TMG, private blogs can claim certain exceptions.',
    
    contactTitle: 'Contact',
    email: 'Email',
    website: 'Website',
    
    responsibleTitle: 'Responsible for Content according to § 55 Para. 2 RStV',
    responsibleNote: 'For inquiries regarding content, please contact us via email.',
    
    euDisputeTitle: 'EU Dispute Resolution',
    euDisputeText: 'The European Commission provides a platform for online dispute resolution (OS):',
    euDisputeNote: 'You can find our email address in the legal notice above.',
    
    consumerDisputeTitle: 'Consumer Dispute Resolution',
    consumerDisputeText: 'We are not willing or obligated to participate in dispute resolution proceedings before a consumer arbitration board.',
    
    liabilityContentTitle: 'Liability for Content',
    liabilityContentText1: 'As a service provider, we are responsible for our own content on these pages according to § 7 Para.1 TMG under general laws. However, according to §§ 8 to 10 TMG, we as a service provider are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.',
    liabilityContentText2: 'Obligations to remove or block the use of information according to general laws remain unaffected. However, liability in this regard is only possible from the time of knowledge of a specific legal violation. Upon becoming aware of such violations, we will remove this content immediately.',
    
    liabilityLinksTitle: 'Liability for Links',
    liabilityLinksText1: 'Currently, our website does not contain links to external third-party websites. Should links to external third-party pages be added in the future, we assume no liability for their content, as we have no influence over them.',
    liabilityLinksText2: 'The respective provider or operator is always responsible for the content of linked pages. Should links be added, they will be checked for possible legal violations at the time of linking. Upon becoming aware of legal violations, we will remove such links immediately.',
    
    copyrightTitle: 'Copyright',
    copyrightText1: 'All content and works on these pages were personally created by the operator and are subject to German copyright law. The reproduction, editing, distribution and any kind of exploitation outside the limits of copyright require the written consent of the author.',
    copyrightText2: 'Downloads and copies of this site are not permitted. Should third-party content appear on this site in the future, it will be expressly marked as such. Should you nevertheless become aware of a copyright infringement, please inform us accordingly. Upon becoming aware of legal violations, we will remove such content immediately.',
    
    bibleTitle: 'Bible Translations Used',
    bibleText: 'The Bible quotes used on this website come from various translations. Unless otherwise stated, we use the Luther Bible, Elberfelder (German), King James Version (English), Dumitru Cornilescu (Romanian) and Russian Synodal Translation (Russian) as well as other public domain translations.',
    
    privacy: 'Privacy Policy',
    contact: 'Contact',
    home: 'Home',
  },
  ro: {
    backToHome: '← Înapoi la Pagina Principală',
    title: 'Imprimat Legal',
    subtitle: 'Informații conform § 5 TMG (Legea germană a telemedia)',
    
    providerTitle: 'Informații despre Furnizor',
    blogName: 'RADIKAL Blog',
    providerNote: 'Acest blog este operat ca un proiect privat, necomercial. Conform § 5 TMG, blogurile private pot beneficia de anumite excepții.',
    
    contactTitle: 'Contact',
    email: 'Email',
    website: 'Website',
    
    responsibleTitle: 'Responsabil pentru Conținut conform § 55 Alin. 2 RStV',
    responsibleNote: 'Pentru întrebări referitoare la conținut, vă rugăm să ne contactați prin email.',
    
    euDisputeTitle: 'Soluționarea Disputelor UE',
    euDisputeText: 'Comisia Europeană oferă o platformă pentru soluționarea online a disputelor (OS):',
    euDisputeNote: 'Puteți găsi adresa noastră de email în informațiile legale de mai sus.',
    
    consumerDisputeTitle: 'Soluționarea Disputelor Consumatorilor',
    consumerDisputeText: 'Nu suntem dispuși sau obligați să participăm la proceduri de soluționare a disputelor în fața unei comisii de arbitraj pentru consumatori.',
    
    liabilityContentTitle: 'Răspunderea pentru Conținut',
    liabilityContentText1: 'Ca furnizor de servicii, suntem responsabili pentru propriul conținut de pe aceste pagini conform § 7 Alin.1 TMG în conformitate cu legile generale. Cu toate acestea, conform §§ 8 până la 10 TMG, noi ca furnizor de servicii nu suntem obligați să monitorizăm informațiile terților transmise sau stocate sau să investigăm circumstanțele care indică o activitate ilegală.',
    liabilityContentText2: 'Obligațiile de a elimina sau bloca utilizarea informațiilor conform legilor generale rămân neafectate. Cu toate acestea, răspunderea în această privință este posibilă doar din momentul cunoașterii unei încălcări legale specifice. La cunoașterea unor astfel de încălcări, vom elimina imediat acest conținut.',
    
    liabilityLinksTitle: 'Răspunderea pentru Link-uri',
    liabilityLinksText1: 'În prezent, site-ul nostru nu conține link-uri către site-uri externe ale terților. În cazul în care în viitor vor fi adăugate link-uri către pagini externe ale terților, nu ne asumăm răspunderea pentru conținutul acestora, deoarece nu avem nicio influență asupra lor.',
    liabilityLinksText2: 'Furnizorul sau operatorul respectiv al paginilor este întotdeauna responsabil pentru conținutul paginilor legate. Dacă vor fi adăugate link-uri, acestea vor fi verificate pentru posibile încălcări legale la momentul legării. La cunoașterea încălcărilor legale, vom elimina imediat astfel de link-uri.',
    
    copyrightTitle: 'Drepturi de Autor',
    copyrightText1: 'Tot conținutul și lucrările de pe aceste pagini au fost create personal de către operator și sunt supuse legii germane a drepturilor de autor. Reproducerea, editarea, distribuirea și orice fel de exploatare în afara limitelor drepturilor de autor necesită consimțământul scris al autorului.',
    copyrightText2: 'Descărcările și copiile acestui site nu sunt permise. Dacă în viitor vor apărea conținuturi ale terților pe acest site, acestea vor fi marcate în mod expres ca atare. Dacă totuși deveniți conștienți de o încălcare a drepturilor de autor, vă rugăm să ne informați în mod corespunzător. La cunoașterea încălcărilor legale, vom elimina imediat un astfel de conținut.',
    
    bibleTitle: 'Traduceri Biblice Folosite',
    bibleText: 'Citatele biblice folosite pe acest site provin din diverse traduceri. Dacă nu se specifică altfel, folosim Lutherbibel, Elberfelder (Germană), King James Version (Engleză), Dumitru Cornilescu (Română) și Traducerea Sinodală (Rusă) precum și alte traduceri din domeniul public.',
    
    privacy: 'Politica de Confidențialitate',
    contact: 'Contact',
    home: 'Acasă',
  },
  ru: {
    backToHome: '← Вернуться на главную',
    title: 'Юридическая информация',
    subtitle: 'Информация согласно § 5 TMG (Закон Германии о телемедиа)',
    
    providerTitle: 'Информация о поставщике услуг',
    blogName: 'RADIKAL Blog',
    providerNote: 'Этот блог работает как частный, некоммерческий проект. Согласно § 5 TMG, частные блоги могут претендовать на определённые исключения.',
    
    contactTitle: 'Контакт',
    email: 'Эл. почта',
    website: 'Веб-сайт',
    
    responsibleTitle: 'Ответственный за содержание согласно § 55 Абз. 2 RStV',
    responsibleNote: 'По вопросам содержания, пожалуйста, свяжитесь с нами по электронной почте.',
    
    euDisputeTitle: 'Урегулирование споров ЕС',
    euDisputeText: 'Европейская комиссия предоставляет платформу для онлайн-урегулирования споров (OS):',
    euDisputeNote: 'Наш адрес электронной почты вы найдёте выше в юридической информации.',
    
    consumerDisputeTitle: 'Урегулирование потребительских споров',
    consumerDisputeText: 'Мы не готовы и не обязаны участвовать в процедурах урегулирования споров перед потребительским арбитражем.',
    
    liabilityContentTitle: 'Ответственность за содержание',
    liabilityContentText1: 'Как поставщик услуг мы несём ответственность за собственное содержание на этих страницах согласно § 7 Абз.1 TMG в соответствии с общими законами. Однако согласно §§ 8-10 TMG мы как поставщик услуг не обязаны отслеживать переданную или сохранённую информацию третьих лиц или расследовать обстоятельства, указывающие на незаконную деятельность.',
    liabilityContentText2: 'Обязательства по удалению или блокировке использования информации согласно общим законам остаются незатронутыми. Однако ответственность в этом отношении возможна только с момента получения информации о конкретном нарушении закона. При получении информации о таких нарушениях мы немедленно удалим это содержание.',
    
    liabilityLinksTitle: 'Ответственность за ссылки',
    liabilityLinksText1: 'В настоящее время наш сайт не содержит ссылок на внешние веб-сайты третьих лиц. Если в будущем будут добавлены ссылки на внешние страницы третьих лиц, мы не несём ответственности за их содержание, так как не имеем на него влияния.',
    liabilityLinksText2: 'Соответствующий поставщик или оператор страниц всегда несёт ответственность за содержание связанных страниц. Если будут добавлены ссылки, они будут проверены на возможные нарушения закона в момент создания. При получении информации о нарушениях закона мы немедленно удалим такие ссылки.',
    
    copyrightTitle: 'Авторское право',
    copyrightText1: 'Всё содержание и произведения на этих страницах были лично созданы оператором и подлежат немецкому авторскому праву. Воспроизведение, редактирование, распространение и любое использование за пределами авторского права требуют письменного согласия автора.',
    copyrightText2: 'Загрузки и копии этого сайта не разрешены. Если в будущем на этом сайте появится содержание третьих лиц, оно будет явно обозначено как таковое. Если вы всё же узнаете о нарушении авторских прав, пожалуйста, сообщите нам об этом. При получении информации о нарушениях закона мы немедленно удалим такое содержание.',
    
    bibleTitle: 'Используемые переводы Библии',
    bibleText: 'Библейские цитаты, используемые на этом сайте, взяты из различных переводов. Если не указано иное, мы используем Лютеранскую Библию, Эльберфельдер (немецкий), King James Version (английский), Думитру Корнилеску (румынский) и Синодальный перевод (русский), а также другие общедоступные переводы.',
    
    privacy: 'Политика конфиденциальности',
    contact: 'Контакт',
    home: 'Главная',
  },
};

export default function ImpressumPage() {
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
          <h1 className="text-4xl md:text-5xl font-cinzel font-bold mt-4 mb-4">
            {t.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.subtitle}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          
          {/* Anbieter */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.providerTitle}</h2>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <p className="text-gray-700 dark:text-gray-300 text-lg">
                <strong className="text-black dark:text-white text-xl">{t.blogName}</strong><br /><br />
                {t.providerNote}
              </p>
            </div>
          </section>

          {/* Kontakt */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.contactTitle}</h2>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 flex items-center gap-3">
                <span className="w-7 h-7 flex-shrink-0">
                  <svg className="w-7 h-7" viewBox="0 0 1920 1920" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 1694.235h1920V226H0v1468.235ZM112.941 376.664V338.94H1807.06v37.723L960 1111.233l-847.059-734.57ZM1807.06 526.198v950.513l-351.134-438.89-88.32 70.475 378.353 472.998H174.042l378.353-472.998-88.32-70.475-351.134 438.89V526.198L960 1260.768l847.059-734.57Z" fillRule="evenodd"/>
                  </svg>
                </span>
                <span>{t.email}: <a href="mailto:kontakt@radikal-blog.de" className="text-red-600 dark:text-red-400 hover:underline">kontakt@radikal-blog.de</a></span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center gap-3">
                <span className="w-7 h-7 flex-shrink-0">
                  <svg className="w-7 h-7" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="m429.2,82.8c-46.2-46.3-107.8-71.8-173.2-71.8s-127,25.5-173.2,71.8-71.8,107.8-71.8,173.2 25.5,127 71.8,173.2 107.8,71.8 173.2,71.8 127-25.5 173.2-71.8 71.8-107.8 71.8-173.2-25.5-127-71.8-173.2zm49.6,162.2h-95c-0.9-37.8-6.2-74.2-15.5-106.5 18.1-9.3 35-21 50.5-34.8 35,37.4 57.3,86.8 60,141.3zm-211.8,22h94.9c-0.8,34.8-5.6,68.1-13.9,97.9-25.6-10.3-52.9-16.3-81-17.6v-80.3zm136-178.6c-12.8,11.3-26.8,20.9-41.6,28.9-3.8-10.6-8.1-20.6-12.9-30-9.5-18.8-20.3-34.2-32.2-46 32.5,9.1 62,25.4 86.7,47.1zm-136-52c22.9,5.1 44.5,26.2 61.9,60.6 4.7,9.3 8.9,19.2 12.6,29.7-23.5,9.7-48.6,15.4-74.5,16.7v-107zm81.1,111.4c8.2,29.6 12.9,62.7 13.7,97.3h-94.8v-79.6c28.2-1.3 55.5-7.4 81.1-17.7zm-103.1,97.2h-94.9c0.8-34.6 5.5-67.7 13.7-97.3 25.6,10.4 53,16.4 81.1,17.6v79.7zm.1-208.6v107c-25.9-1.3-51.1-7-74.5-16.7 3.7-10.5 7.9-20.4 12.6-29.7 17.4-34.4 39-55.5 61.9-60.6zm-49.3,4.9c-11.9,11.8-22.7,27.3-32.2,46-4.7,9.4-9,19.4-12.9,30-14.8-8-28.7-17.6-41.6-28.9 24.7-21.7 54.2-38 86.7-47.1zm-102.5,62.4c15.5,13.8 32.4,25.4 50.5,34.8-9.3,32.4-14.7,68.7-15.5,106.5h-95c2.7-54.5 25-103.9 60-141.3zm-60,163.3h95c0.9,38.1 6.3,74.6 15.7,107.1-18,9.3-34.9,20.8-50.3,34.6-35.3-37.5-57.7-87-60.4-141.7zm76.2,157c12.8-11.2 26.7-20.8 41.4-28.7 3.8,10.3 8,20.2 12.7,29.4 9.5,18.8 20.3,34.2 32.2,46.1-32.3-9.1-61.7-25.3-86.3-46.8zm135.6,51.6c-22.9-5.1-44.5-26.2-61.9-60.6-4.6-9.1-8.7-18.8-12.4-29.1 23.4-9.7 48.5-15.4 74.3-16.6v106.3zm-81-110.7c-8.3-29.8-13.1-63.1-13.9-97.9h94.9v80.3c-28.1,1.2-55.4,7.2-81,17.6zm103,110.7v-106.3c25.8,1.3 50.9,6.9 74.3,16.6-3.7,10.3-7.8,20-12.4,29.1-17.4,34.4-39,55.5-61.9,60.6zm49.3-4.9c11.9-11.8 22.7-27.3 32.2-46.1 4.7-9.2 8.9-19.1 12.7-29.4 14.7,7.9 28.6,17.5 41.4,28.7-24.6,21.6-54,37.8-86.3,46.8zm102.2-62c-15.4-13.7-32.3-25.3-50.3-34.6 9.4-32.5 14.8-69.1 15.7-107.1h95c-2.8,54.7-25.2,104.2-60.4,141.7z"/>
                  </svg>
                </span>
                <span>{t.website}: <a href="https://www.radikal.blog" className="text-red-600 dark:text-red-400 hover:underline">www.radikal.blog</a></span>
              </p>
            </div>
          </section>

          {/* Verantwortlich für den Inhalt */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">
              {t.responsibleTitle}
            </h2>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <p className="text-gray-700 dark:text-gray-300">
                <strong className="text-black dark:text-white">{t.blogName}</strong><br />
                {t.responsibleNote}
              </p>
            </div>
          </section>

          {/* EU-Streitschlichtung */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.euDisputeTitle}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t.euDisputeText}
              <a 
                href="https://ec.europa.eu/consumers/odr/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-red-600 dark:text-red-400 hover:underline ml-1"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              {t.euDisputeNote}
            </p>
          </section>

          {/* Verbraucherstreitbeilegung */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4 break-words" style={{ wordBreak: 'break-word', hyphens: 'auto' }}>
              <span className="hidden sm:inline">{t.consumerDisputeTitle}</span>
              <span className="sm:hidden text-xl">
                {language === 'de' ? (
                  <>Verbraucherstreitbeilegung/{'\u200B'}Universalschlichtungsstelle</>
                ) : (
                  t.consumerDisputeTitle
                )}
              </span>
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t.consumerDisputeText}
            </p>
          </section>

          {/* Haftung für Inhalte */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.liabilityContentTitle}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t.liabilityContentText1}
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              {t.liabilityContentText2}
            </p>
          </section>

          {/* Haftung für Links */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.liabilityLinksTitle}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t.liabilityLinksText1}
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              {t.liabilityLinksText2}
            </p>
          </section>

          {/* Urheberrecht */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.copyrightTitle}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t.copyrightText1}
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              {t.copyrightText2}
            </p>
          </section>

          {/* Bibel-Zitate */}
          <section className="mb-12">
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">{t.bibleTitle}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t.bibleText}
            </p>
          </section>

        </div>

        {/* Footer Links */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap gap-4">
            <Link href="/datenschutz" className="text-red-600 dark:text-red-400 hover:underline">
              {t.privacy}
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
