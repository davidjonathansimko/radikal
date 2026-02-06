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
    liabilityLinksText1: 'Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.',
    liabilityLinksText2: 'Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.',
    
    // Copyright
    copyrightTitle: 'Urheberrecht',
    copyrightText1: 'Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.',
    copyrightText2: 'Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.',
    
    // Bible quotes
    bibleTitle: 'Verwendete Bibelübersetzungen',
    bibleText: 'Die auf dieser Website verwendeten Bibelzitate stammen aus verschiedenen Übersetzungen. Falls nicht anders angegeben, verwenden wir die Lutherbibel, Elberfelder oder andere gemeinfreie Übersetzungen.',
    
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
    liabilityLinksText1: 'Our offer contains links to external third-party websites, over whose content we have no influence. Therefore, we cannot assume any liability for this external content. The respective provider or operator of the pages is always responsible for the content of the linked pages.',
    liabilityLinksText2: 'The linked pages were checked for possible legal violations at the time of linking. Illegal content was not recognizable at the time of linking. However, permanent content control of the linked pages is not reasonable without concrete evidence of a legal violation. Upon becoming aware of legal violations, we will remove such links immediately.',
    
    copyrightTitle: 'Copyright',
    copyrightText1: 'The content and works created by the site operators on these pages are subject to German copyright law. The reproduction, editing, distribution and any kind of exploitation outside the limits of copyright require the written consent of the respective author or creator.',
    copyrightText2: 'Downloads and copies of this site are only permitted for private, non-commercial use. Insofar as the content on this site was not created by the operator, the copyrights of third parties are respected. In particular, third-party content is marked as such. Should you nevertheless become aware of a copyright infringement, please inform us accordingly. Upon becoming aware of legal violations, we will remove such content immediately.',
    
    bibleTitle: 'Bible Translations Used',
    bibleText: 'The Bible quotes used on this website come from various translations. Unless otherwise stated, we use Luther Bible, Elberfelder or other public domain translations.',
    
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
    liabilityLinksText1: 'Oferta noastră conține link-uri către site-uri web externe ale terților, asupra al căror conținut nu avem nicio influență. Prin urmare, nu putem asuma nicio răspundere pentru acest conținut extern. Furnizorul sau operatorul respectiv al paginilor este întotdeauna responsabil pentru conținutul paginilor legate.',
    liabilityLinksText2: 'Paginile legate au fost verificate pentru posibile încălcări legale în momentul legării. Conținutul ilegal nu era recognoscibil la momentul legării. Cu toate acestea, controlul permanent al conținutului paginilor legate nu este rezonabil fără dovezi concrete ale unei încălcări legale. La cunoașterea încălcărilor legale, vom elimina imediat astfel de link-uri.',
    
    copyrightTitle: 'Drepturi de Autor',
    copyrightText1: 'Conținutul și lucrările create de operatorii site-ului pe aceste pagini sunt supuse legii germane a drepturilor de autor. Reproducerea, editarea, distribuirea și orice fel de exploatare în afara limitelor drepturilor de autor necesită consimțământul scris al autorului sau creatorului respectiv.',
    copyrightText2: 'Descărcările și copiile acestui site sunt permise numai pentru uz privat, necomercial. În măsura în care conținutul de pe acest site nu a fost creat de operator, drepturile de autor ale terților sunt respectate. În special, conținutul terților este marcat ca atare. Dacă totuși deveniți conștienți de o încălcare a drepturilor de autor, vă rugăm să ne informați în mod corespunzător. La cunoașterea încălcărilor legale, vom elimina imediat un astfel de conținut.',
    
    bibleTitle: 'Traduceri Biblice Folosite',
    bibleText: 'Citatele biblice folosite pe acest site provin din diverse traduceri. Dacă nu se specifică altfel, folosim traduceri Cornilescu, Luther sau alte traduceri din domeniul public.',
    
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
    liabilityLinksText1: 'Наше предложение содержит ссылки на внешние веб-сайты третьих лиц, на содержание которых мы не имеем влияния. Поэтому мы не можем нести ответственность за это внешнее содержание. Соответствующий поставщик или оператор страниц всегда несёт ответственность за содержание связанных страниц.',
    liabilityLinksText2: 'Связанные страницы были проверены на возможные нарушения закона в момент создания ссылки. Незаконное содержание не было распознано в момент создания ссылки. Однако постоянный контроль содержания связанных страниц необоснован без конкретных доказательств нарушения закона. При получении информации о нарушениях закона мы немедленно удалим такие ссылки.',
    
    copyrightTitle: 'Авторское право',
    copyrightText1: 'Содержание и произведения, созданные операторами сайта на этих страницах, подлежат немецкому авторскому праву. Воспроизведение, редактирование, распространение и любое использование за пределами авторского права требуют письменного согласия соответствующего автора или создателя.',
    copyrightText2: 'Загрузки и копии этого сайта разрешены только для частного, некоммерческого использования. Поскольку содержание на этом сайте не было создано оператором, соблюдаются авторские права третьих лиц. В частности, содержание третьих лиц обозначается как таковое. Если вы всё же узнаете о нарушении авторских прав, пожалуйста, сообщите нам об этом. При получении информации о нарушениях закона мы немедленно удалим такое содержание.',
    
    bibleTitle: 'Используемые переводы Библии',
    bibleText: 'Библейские цитаты, используемые на этом сайте, взяты из различных переводов. Если не указано иное, мы используем Синодальный перевод, Лютеранскую Библию или другие общедоступные переводы.',
    
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
                <span className="text-2xl">📧</span>
                <span>{t.email}: <a href="mailto:kontakt@radikal-blog.de" className="text-red-600 dark:text-red-400 hover:underline">kontakt@radikal-blog.de</a></span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center gap-3">
                <span className="text-2xl">🌐</span>
                <span>{t.website}: <a href="https://radikal-blog.vercel.app" className="text-red-600 dark:text-red-400 hover:underline">radikal-blog.vercel.app</a></span>
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
            <h2 className="text-2xl font-cinzel font-bold text-red-600 dark:text-red-500 mb-4">
              {t.consumerDisputeTitle}
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
