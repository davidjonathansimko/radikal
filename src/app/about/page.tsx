// About page component / Über-uns-Seiten-Komponente / Componentă pagina Despre noi
// This displays information about the RADIKAL blog and its mission
// Dies zeigt Informationen über den RADIKAL-Blog und seine Mission
// Aceasta afișează informații despre blogul RADIKAL și misiunea sa

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import AboutStoryModal from '@/components/AboutStoryModal';

export default function AboutPage() {
  // Protect this route - redirect to home if modal not completed / Diese Route schützen - zur Startseite weiterleiten wenn Modal nicht abgeschlossen / Protejează această rută - redirecționează la pagină principală dacă modalul nu este finalizat
  const { isAllowed, isChecking } = useRouteProtection();
  
  // Get language / Sprache abrufen / Obține limba
  const { language } = useLanguage();
  
  // State for story modal / Zustand für Geschichte-Modal / Stare pentru modalul povestii
  const [showStoryModal, setShowStoryModal] = useState(true);
  
  // Handle story modal completion / Story-Modal Abschluss behandeln / Gestionează finalizarea modalului povestii
  const handleStoryComplete = () => {
    setShowStoryModal(false);
  };

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

  return (
    <>
      {/* Story Modal - appears every time About page is visited */}
      {showStoryModal && (
        <AboutStoryModal 
          onComplete={handleStoryComplete}
          onSkip={handleStoryComplete}
        />
      )}
      
      {/* Background page - disabled when modal is open to prevent interaction */}
      <div className={`min-h-screen py-12 ${showStoryModal ? 'pointer-events-none select-none' : ''}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header / Seitenkopf / Antet pagină */}
        <header className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-black dark:text-white mb-6 animate-fadeIn">
            {language === 'de' ? 'Über uns' : 
             language === 'en' ? 'About Us' : 
             language === 'ro' ? 'Despre Noi' : 
             'О нас'}
          </h1>
          <p className="text-xl text-black/80 dark:text-white/80 max-w-2xl mx-auto leading-relaxed animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            {language === 'de' ? 'Entdecke die Mission und Vision hinter RADIKAL' : 
             language === 'en' ? 'Discover the mission and vision behind RADIKAL' : 
             language === 'ro' ? 'Descoperă misiunea și viziunea din spatele RADIKAL' : 
             'Узнай миссию и видение RADIKAL'}
          </p>
        </header>

        {/* Main content / Hauptinhalt / Conținut principal */}
        <div className="space-y-16">
          {/* Mission section / Missions-Bereich / Secțiune misiune */}
          <section className="glass-effect rounded-2xl p-8 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl text-black/90 dark:text-white/90">🕯</div>
              <h2 className="text-2xl font-bold text-black dark:text-white">
                {language === 'de' ? 'Unsere Mission: Ein Schmerzensruf um die Wahrheit' : 
                 language === 'en' ? 'Our Mission: A Cry for Truth' : 
                 language === 'ro' ? 'Misiunea Noastră: Un strigăt pentru Adevăr' : 
                 'Наша миссия: Крик о правде'}
              </h2>
            </div>
            <div className="text-black/80 dark:text-white/80 leading-relaxed space-y-4">
              <p>
                {language === 'de' ? 'RADIKAL steht für authentische und kompromisslose biblische Wahrheiten. ' :
                 language === 'en' ? 'RADIKAL stands for authentic and uncompromising biblical truths. ' :
                 language === 'ro' ? 'RADIKAL reprezintă adevăruri biblice autentice și necompromise. ' :
                 'RADIKAL означает подлинные и бескомпромиссные библейские истины. '}
              </p>
              <p>
                {language === 'de' ? 'Dies ist ein Schrei aus tiefstem Schmerz über die Lauheit, die unsere Kirchen verunreinigt. Wir wenden uns gegen das bloße Namenschristentum und die leere Tradition' : 
                 language === 'en' ? 'This is a cry from the depths of pain over the lukewarmness that contaminates our churches. We stand against mere nominal Christianity and empty tradition' : 
                 language === 'ro' ? 'Acesta este un strigăt din adâncul durerii față de căldiceala care contaminează bisericile noastre. Ne ridicăm împotriva creștinismului nominal și a tradiției goale' : 
                 'Это крик из глубины боли по поводу теплохладности, которая загрязняет наши церкви. Мы выступаем против номинального христианства и пустой традиции'}
              </p>
            </div>
          </section>

          {/* Values section / Werte-Bereich / Secțiune valori */}
          <section className="animate-fadeIn" style={{ animationDelay: '0.6s' }}>
            <h2 className="text-3xl font-bold text-black dark:text-white text-center mb-12">
              {language === 'de' ? 'Unsere Werte' : 
               language === 'en' ? 'Our Values' : 
               language === 'ro' ? 'Valorile Noastre' : 
               'Наши ценности'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Value 1 / Wert 1 / Valoare 1 */}
              <div className="glass-effect rounded-xl p-6 hover:bg-white/15 dark:hover:bg-white/15 hover:bg-black/15 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl text-black/90 dark:text-white/90">√</div>
                  <h3 className="text-xl font-semibold text-black dark:text-white">
                    {language === 'de' ? 'Biblische Wahrheit' : 
                     language === 'en' ? 'Biblical Truth' : 
                     language === 'ro' ? 'Adevărul Biblic' : 
                     'Библейская истина'}
                  </h3>
                </div>
                <p className="text-black/80 dark:text-white/80 leading-relaxed">
                  {language === 'de' ? 'Unsere Radikalität ist die Liebe zur unverfälschten Wurzel der Wahrheit Gottes. Der Herr wird die Lauen aus Seinem Mund speien (Offb 3,16).' : 
                   language === 'en' ? 'Our radicalness is the love for the unadulterated root of God\'s truth. The Lord will spew the lukewarm out of His mouth (Rev 3:16).' : 
                   language === 'ro' ? 'Radicalitatea noastră este dragostea pentru rădăcina nealterată a adevărului lui Dumnezeu. Domnul va vărsa căldiceii din gura Sa (Apoc 3:16).' : 
                   'Наша радикальность - это любовь к неразбавленному корню истины Божьей. Господь извергнет теплых из уст Своих (Откр 3:16).'}
                </p>
              </div>

              {/* Value 2 / Wert 2 / Valoare 2 */}
              <div className="glass-effect rounded-xl p-6 hover:bg-white/15 dark:hover:bg-white/15 hover:bg-black/15 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl text-black/90 dark:text-white/90">⚍</div>
                  <h3 className="text-xl font-semibold text-black dark:text-white">
                    {language === 'de' ? 'Gemeinschaft' : 
                     language === 'en' ? 'Community' : 
                     language === 'ro' ? 'Comunitate' : 
                     'Сообщество'}
                  </h3>
                </div>
                <p className="text-black/80 dark:text-white/80 leading-relaxed">
                  {language === 'de' ? 'Dies bricht uns das Herz. Wir flehen dich an: Nimm die Wahrheit an. Wenn du im Kompromiss lebst, bitten wir dich schweren Herzens zu gehen.' :
                   language === 'en' ? 'This breaks our hearts. We implore you: embrace the truth. If you live in compromise, we ask you with a heavy heart to leave.' : 
                   language === 'ro' ? 'Aceasta ne frânge inima. Te implorăm: îmbrățișează adevărul. Dacă trăiești în compromis, te rugăm cu inima grea să pleci.' : 
                   'Это разбивает нам сердце. Мы умоляем тебя: прими истину. Если ты живешь в компромиссе, мы с тяжелым сердцем просим тебя уйти.'}
                </p>
              </div>

              {/* Value 3 / Wert 3 / Valoare 3 */}
              <div className="glass-effect rounded-xl p-6 hover:bg-white/15 dark:hover:bg-white/15 hover:bg-black/15 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl text-black/90 dark:text-white/90">✟</div>
                  <h3 className="text-xl font-semibold text-black dark:text-white">
                    {language === 'de' ? 'Gebet & Hingabe' : 
                     language === 'en' ? 'Prayer & Devotion' : 
                     language === 'ro' ? 'Rugăciune & Devotament' : 
                     'Молитва и посвящение'}
                  </h3>
                </div>
                <p className="text-black/80 dark:text-white/80 leading-relaxed">
                  {language === 'de' ? 'Die Zeit der Entscheidung ist da. Wähle das Leben durch totale Hingabe und Gebet. Nimm dein Kreuz auf dich' : 
                   language === 'en' ? 'The time of decision is here. Choose life through total devotion and prayer. Take up your cross' :
                   language === 'ro' ? 'Timpul deciziei este aici. Alege viața prin devotament total și rugăciune. Ia-ți crucea' :
                   'Время решения пришло. Выбери жизнь через полное посвящение и молитву. Возьми свой крест'}
                </p>
              </div>

              {/* Value 4 / Wert 4 / Valoare 4 */}
              <div className="glass-effect rounded-xl p-6 hover:bg-white/15 dark:hover:bg-white/15 hover:bg-black/15 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl text-black/90 dark:text-white/90">✦</div>
                  <h3 className="text-xl font-semibold text-black dark:text-white">
                    {language === 'de' ? 'Transformation' : 
                     language === 'en' ? 'Transformation' : 
                     language === 'ro' ? 'Transformare' : 
                     'Преображение'}
                  </h3>
                </div>
                <p className="text-black/80 dark:text-white/80 leading-relaxed">
                  {language === 'de' ? 'Es gibt keinen Mittelweg. Wähle die radikale Erneuerung durch Gottes Wort. Wer nicht für Ihn ist, ist gegen Ihn. Triff jetzt deine Wahl.' :
                   language === 'en' ? 'There is no middle ground. Choose radical renewal through God\'s Word. Whoever is not for Him is against Him. Make your choice now.' :
                   language === 'ro' ? 'Nu există cale de mijloc. Alege reînnoirea radicală prin Cuvântul lui Dumnezeu. Cine nu este pentru El este împotriva Lui. Fă-ți alegerea acum.' :
                   'Нет среднего пути. Выбери радикальное обновление через Слово Божье. Кто не за Него, тот против Него. Сделай свой выбор сейчас.'}
                </p>
              </div>
            </div>
          </section>

          {/* Author section / Autor-Bereich / Secțiune autor */}
          <section className="glass-effect rounded-2xl p-8 animate-fadeIn" style={{ animationDelay: '0.8s' }}>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
                {language === 'de' ? 'Über den Autor' : 
                 language === 'en' ? 'About the Author' : 
                 language === 'ro' ? 'Despre Autor' : 
                 'Об авторе'}
              </h2>
              <div className="max-w-2xl mx-auto">
                <div className="w-24 h-24 bg-black/20 dark:bg-white/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-2xl font-bold text-black dark:text-white">D.S.</span>
                </div>
                <p className="text-black/80 dark:text-white/80 leading-relaxed mb-6">
                  {language === 'de' ? 'David ist ein leidenschaftlicher Verkündiger des Wortes Gottes mit dem Herzschlag, Menschen zur radikalen Nachfolge Jesu zu ermutigen. Durch jahrelange Bibelstudien und praktische Gemeindeerfahrung teilt er Einsichten, die Leben verändern.' : 
                   language === 'en' ? 'David is a passionate preacher of God\'s Word with a heartbeat to encourage people towards radical discipleship of Jesus. Through years of Bible study and practical church experience, he shares insights that change lives.' : 
                   language === 'ro' ? 'David este un predicator pasionat al Cuvântului lui Dumnezeu cu dorința de a încuraja oamenii către o ucenicie radicală a lui Isus. Prin ani de studiu biblic și experiență practică în biserică, împărtășește perspective care schimbă vieți.' : 
                   'Давид - страстный проповедник Слова Божьего с сердцем, направленным на то, чтобы побуждать людей к радикальному ученичеству Иисуса. Через годы изучения Библии и практического церковного опыта он делится прозрениями, которые изменяют жизни.'}
                </p>
                <div className="flex justify-center gap-4">
                  <a 
                    href="mailto:davidsimko22@yahoo.com"
                    className="btn-secondary"
                  >
                    {language === 'de' ? 'Kontakt aufnehmen' : 
                     language === 'en' ? 'Get in Touch' : 
                     language === 'ro' ? 'Ia Legătura' : 
                     'Связаться'}
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Call to action / Handlungsaufforderung */}
          <section className="text-center animate-fadeIn" style={{ animationDelay: '1s' }}>
            <div className="glass-effect rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
                {language === 'de' ? 'Werde Teil der Bewegung' : 
                 language === 'en' ? 'Join the Movement' : 
                 language === 'ro' ? 'Alătură-te Mișcării' : 
                 'Присоединяйся к движению'}
              </h2>
              <p className="text-black/80 dark:text-white/80 mb-6 max-w-2xl mx-auto">
                {language === 'de' ? 'Entdecke authentische biblische Wahrheiten und lass dich von Gottes Wort transformieren. Begleite uns auf dieser Reise des Glaubens und geistlichen Wachstums.' : 
                 language === 'en' ? 'Discover authentic biblical truths and let yourself be transformed by God\'s Word. Join us on this journey of faith and spiritual growth.' : 
                 language === 'ro' ? 'Descoperă adevăruri biblice autentice și lasă-te transformat de Cuvântul lui Dumnezeu. Alătură-te nouă în această călătorie de credință și creștere spirituală.' : 
                 'Открой подлинные библейские истины и позволь себе быть преображенным Словом Божьим. Присоединяйся к нам в этом путешествии веры и духовного роста.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/blogs" className="btn-primary">
                  {language === 'de' ? 'Blogs entdecken' : 
                   language === 'en' ? 'Explore Blogs' : 
                   language === 'ro' ? 'Explorează Blogurile' : 
                   'Исследовать блоги'}
                </Link>
                <Link href="/contact" className="btn-secondary">
                  {language === 'de' ? 'Kontakt' : 
                   language === 'en' ? 'Contact' : 
                   language === 'ro' ? 'Contact' : 
                   'Контакт'}
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
    </>
  );
}
