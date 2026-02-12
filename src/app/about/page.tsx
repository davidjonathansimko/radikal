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
            {language === 'de' ? 'Entdecke RADIKAL' : 
             language === 'en' ? 'Discover RADIKAL' : 
             language === 'ro' ? 'Descoperă RADIKAL' : 
             'Открой RADIKAL'}
          </p>
        </header>

        {/* Main content / Hauptinhalt / Conținut principal */}
        <div className="space-y-16">
          {/* Mission section / Missions-Bereich / Secțiune misiune */}
          <section className="glass-effect rounded-2xl p-8 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="text-black/90 dark:text-white/90">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 234.022 234.022" className="w-12 h-12" fill="currentColor">
                  <path d="M175.952,35.375h-11.788H157.4V5.025C157.4,2.25,155.15,0,152.375,0H81.648c-2.776,0-5.026,2.25-5.026,5.025v30.35h-6.767 H58.07c-2.776,0-5.025,2.25-5.025,5.026c0,2.776,2.25,5.026,5.025,5.026h6.76v89.269c0,20.787,12.224,38.767,29.859,47.147 c-17.635,8.381-29.859,26.364-29.859,47.153c0,2.776,2.25,5.025,5.026,5.025h94.308c2.776,0,5.026-2.25,5.026-5.025 c0-20.789-12.224-38.772-29.859-47.153c17.635-8.38,29.859-26.361,29.859-47.147V45.426h6.762c2.776,0,5.025-2.25,5.025-5.026 C180.977,37.625,178.727,35.375,175.952,35.375z M86.674,10.051h60.676v25.325H86.674V10.051z M158.84,223.971H75.18 c2.492-20.87,20.301-37.103,41.83-37.103C138.54,186.868,156.348,203.101,158.84,223.971z M117.01,176.817 c-21.528,0-39.324-16.232-41.818-37.096h47.338c0.003,0,0.005,0.001,0.008,0.001c0.002,0,0.005-0.001,0.007-0.001h36.283 C156.334,160.585,138.538,176.817,117.01,176.817z M104.243,114.738c0.282-2.75,0.485-4.737,7.001-10.041 c4.56-3.713,7.238-9.267,8.789-14.045c4.853,6.385,10.671,17.263,9.737,26.535c-0.535,5.207-5.802,10.192-8.832,12.484h-10.111 C104.681,124.765,103.825,118.899,104.243,114.738z M159.138,129.67h-24.106c2.334-3.179,4.284-7.06,4.737-11.466 c1.835-18.221-13.7-38.533-20.489-41.873c-1.476-0.725-3.213-0.679-4.649,0.116c-1.438,0.795-2.398,2.248-2.568,3.882 c-0.342,3.265-2.292,12.606-7.165,16.572c-8.237,6.706-10.05,10.923-10.654,16.821c-0.385,3.825-0.177,9.889,3.376,15.948H74.882 V45.426h6.767h70.727h6.764V129.67z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-black dark:text-white">
                {language === 'de' ? 'Unsere Mission: Ein Schmerzensruf um die Wahrheit' : 
                 language === 'en' ? 'Our Mission: A Cry for Truth' : 
                 language === 'ro' ? 'Misiunea Noastră: Un strigăt pentru Adevăr' : 
                 'Наша миссия: Крик о правде'}
              </h2>
            </div>
            <div className="text-black/80 dark:text-white/80 leading-relaxed space-y-4">
              
              <p>
                {language === 'de' ? 'RADIKAL entstand aus der Schmerz über das Schweigen des Wortes in unseren Gemeinden. Die Wahrheit mag verwunden, aber die Ungewissheit bringt den Tod. Lieber durch das Wort erschüttert werden, als in der Lüge zugrunde zu gehen.' : 
                 language === 'en' ? 'RADIKAL was born out of the pain of the silence of the Word in our churches. Truth may wound, but uncertainty brings death. Better to be shaken by the Word than to perish in the lie.' : 
                 language === 'ro' ? 'RADIKAL s-a născut din durerea tăcerii Cuvântului în bisericile noastre. Adevărul poate răni, dar incertitudinea aduce moartea. Mai bine să fii zguduit de Cuvânt decât să pieri în minciună.' : 
                 'RADIKAL возник из боли молчания Слова в наших церквах. Истина может ранить, но неопределенность приносит смерть. Лучше быть потрясенным Словом, чем погибнуть во лжи.'}
              </p>
              <p>
                {language === 'de' ? 'Wo laute Kompromisse die Lehre ersticken, suchen ehrliche Christen nach dem vergessenen Fundament – denn Gottes Wort ist keine menschliche Meinung, sondern die Einheit von Gebote und Gnade. ' : 
                 language === 'en' ? 'Where loud compromises stifle doctrine, honest Christians seek the forgotten foundation – because God’s Word is not a human opinion, but the unity of command and grace.' : 
                 language === 'ro' ? 'Acolo unde compromisurile zgomotoase sufocă doctrina, creștinii sinceri caută fundamentul uitat – pentru că Cuvântul lui Dumnezeu nu este o opinie umană, ci unitatea dintre poruncă și har.' : 
                 'Там, где громкие компромиссы душат доктрину, честные христиане ищут забытый фундамент – потому что Слово Божье не человеческое мнение, а единство заповеди и благодати.'}
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
                  <div className="text-black/90 dark:text-white/90">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-8 h-8" fill="none">
                      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M39.25 26.53V7.47L24 4.53L8.75 7.47v19.06c0 3.17 1.621 6.174 3.813 8.747V10.426L24 8.22l11.438 2.205v24.85c-1.163 1.366-2.486 2.61-3.812 3.693V13.38L24 11.91l-7.625 1.47v25.588a36 36 0 0 0 3.816 2.718l-.003-25.35L24 15.602l3.813.735l-.003 25.35c-1.85 1.138-3.323 1.783-3.81 1.783V19.292" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-black dark:text-white">
                    {language === 'de' ? 'Demut' : 
                     language === 'en' ? 'Humility' : 
                     language === 'ro' ? 'Umilință' : 
                     'Смирение'}
                  </h3>
                </div>
                <p className="text-black/80 dark:text-white/80 leading-relaxed">
                  {language === 'de' ? 'Ich erhebe mich über niemanden. Ich nehme an keiner Debatte teil – ich schreibe nur. Du allein entscheidest, ob du bleibst oder gehst. „Wer meint, etwas zu sein, obwohl er nichts ist, der betrügt sich selbst.“ (Galater 6,3) ' : 
                   language === 'en' ? 'I will not exalt myself above anyone. I will not engage in any debate – I only write. You alone decide whether you stay or go. "For if anyone thinks he is something when he is nothing, he deceives himself." (Galatians 6:3)' : 
                   language === 'ro' ? 'Nu mă voi ridica deasupra nimănui. Nu voi participa la nicio dezbatere – eu doar scriu. Tu singur decizi dacă rămâi sau pleci. "Căci dacă cineva se crede ceva, deși nu este nimic, se înșală pe sine însuși." (Galateni 6:3)' : 
                   'Я не возвышусь над кем-либо. Я не буду участвовать в дебатах – я только пишу. Только ты решаешь, остаться или уйти. "Ибо если кто думает, что он что-то, хотя он ничто, тот обманывает самого себя." (Галатам 6:3)'}
                </p>
              </div>

              {/* Value 2 / Wert 2 / Valoare 2 */}
              <div className="glass-effect rounded-xl p-6 hover:bg-white/15 dark:hover:bg-white/15 hover:bg-black/15 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-black/90 dark:text-white/90">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-8 h-8" fill="none">
                      <path fill="currentColor" d="M375.344 18.438c-1.137-.01-2.276.007-3.438.03c-13.273.27-28.187 2.787-45.562 8.126c-22.4 6.883-38.08 27.877-35.844 50.312c1.62 16.34 15.186 34.143 30.875 45.625c24.664 18.046 42.29 36.65 54.375 54.44l7.625 48.843l18.47-2.907l-5.064-32.437c-1.34-23-7.98-45.714-22.342-69.095c14.54 8.79 27.36 18.46 38.03 28.156l28.22 55.72l16.656-8.438l-26.53-52.406c-7.148-17.347-17.845-33.647-33.783-49.03c15.97 4.774 30.48 10.84 42.97 17.436l39.906 45.22l14-12.376l-40.5-45.875l-.094.095C441.37 85.048 426.1 72.19 406.063 61.687v-.093c-.278-.243-.558.187-.812.187c-25.3-1.83-47.73-.167-62.28 3.69c13.373-10.633 34.805-18.547 64.592-21.25l47.375 18.31l6.75-17.436l-41.375-16l-.093-.032c-13.467-6.492-27.824-10.464-44.876-10.625m-237.688.03c-16.838.232-31.037 4.164-44.375 10.595l-41.468 16.03l6.72 17.438l47.406-18.31c29.77 2.706 51.224 10.62 64.593 21.25c-14.55-3.857-36.98-5.52-62.28-3.69c-.254 0-.534-.43-.813-.186v.093C87.4 72.192 72.132 85.047 60.188 99.876l-.124-.094l-40.5 45.876l14.03 12.375l39.906-45.22c12.49-6.596 27-12.662 42.97-17.437c-15.94 15.384-26.668 31.684-33.814 49.03l-26.53 52.407l16.687 8.438L101 149.53c10.672-9.694 23.49-19.366 38.03-28.155c-14.36 23.38-21 46.095-22.343 69.094l-5.03 32.436l18.468 2.906l7.594-48.78c12.084-17.806 29.684-36.437 54.374-54.5c15.69-11.483 29.254-29.286 30.875-45.626c2.234-22.435-13.414-43.43-35.814-50.312c-19.113-5.873-35.252-8.32-49.5-8.125zM307.72 235.814c-11.41 0-24.272 4.91-40.22 22.718v130.814c19.24-13.898 38.485-19.628 56.563-19.844c22.987-.275 43.643 7.632 61.562 15.438c17.92 7.805 33.542 15.33 44.156 16.468c5.308.57 9.002-.088 12.564-2.312c3.187-1.99 6.62-5.816 10-12.53L431.688 256.81c-10.648 7.425-20.88 11.553-30.72 12.688c-13.806 1.592-26.063-2.53-36.75-7.97c-21.37-10.875-38.164-25.762-56.5-25.717zm-99.376 5c-18.118-.082-35.583 15.45-57.406 27.093c-10.912 5.822-23.348 10.394-37.407 9.156c-10.018-.88-20.423-4.782-31.186-12.156L62.906 393.47c13.616 13.096 25.344 15.566 38.594 13.842c14.267-1.855 30.332-9.854 47.406-18.093s35.31-16.776 55.438-17.22c14.575-.32 29.73 4.21 44.47 15.344V259.47c-16.255-18.45-24.774-18.62-40.47-18.658zM45.438 278.875l-24.782 158.22l194.906 13v19h83.563v-18.97l195.53-13.03l-24.78-158.22l-15.53 1.22l16.936 106.5l.44 2.78l-1.158 2.53c-4.76 10.555-10.745 18.306-18.312 23.033c-3.66 2.285-7.59 3.727-11.594 4.53l.03.188l-1.998.188l-.25.03c-.958.136-1.915.217-2.875.282h-.125L258.563 437.28l-.782.064l-.75-.063l-158.467-10.967h-.094c-4.606.203-9.278-.1-13.97-.97c-.03-.005-.063.006-.094 0c-13.02-2.434-26.164-9.29-38.25-22.124l-3.125-3.314l.69-4.5l17.405-115.312l-15.688-1.22zM324.28 388.188c-18.502.22-37.827 6.678-59.436 27.625l-2.344 2.28l124.563-12.03c-2.944-1.34-5.893-2.688-8.907-4c-17.257-7.518-35.372-14.096-53.875-13.875zm-119.53 2.5c-14.906.328-30.94 7.28-47.72 15.375c-3.318 1.6-6.69 3.246-10.06 4.875L254 418.344l-2.72-3.125c-17.09-19.683-31.624-24.86-46.53-24.533z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-black dark:text-white">
                    {language === 'de' ? 'Biblische Erkenntnis – absolut notwendig' : 
                     language === 'en' ? 'Biblical Insight – Absolutely Essential' : 
                     language === 'ro' ? 'Să cunosc Biblia – absolut esențial' : 
                     'Библейское познание – абсолютно необходимо'}
                  </h3>
                </div>
                <p className="text-black/80 dark:text-white/80 leading-relaxed">
                  {language === 'de' ? 'Der Mangel an Erkenntnis bringt uns geistlich um. „Mein Volk geht zugrunde aus Mangel an Erkenntnis.“ (Hosea 4,6)' :
                   language === 'en' ? 'Lack of insight is spiritually deadly. "My people are destroyed for lack of knowledge." (Hosea 4:6)' : 
                   language === 'ro' ? 'Lipsa de cunoștință este spiritual mortală. "Poporul Meu piere din lipsa de cunoștință." (Osea 4:6)' : 
                   'Отсутствие познания духовно губительно. "Мой народ погибает за недостатком знания." (Осия 4:6)'}
                </p>
              </div>

              {/* Value 3 / Wert 3 / Valoare 3 */}
              <div className="glass-effect rounded-xl p-6 hover:bg-white/15 dark:hover:bg-white/15 hover:bg-black/15 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-black/90 dark:text-white/90">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-8 h-8" fill="none">
                      <path fill="currentColor" d="M6.29 19.923q-1.001 0-1.703-.701t-.702-1.703V9.577q0-.213.144-.356t.356-.144t.356.144t.144.356v7.942q0 .597.404 1q.404.404 1 .404t1-.403t.403-1V6.48q0-1 .701-1.702q.701-.701 1.702-.701t1.703.701t.702 1.703v11.038q0 .597.404 1q.404.404 1 .404q.598 0 1-.403q.404-.404.404-1V6.48q0-1 .7-1.702q.701-.701 1.702-.701t1.703.701t.702 1.703v7.942q0 .213-.144.356t-.356.144t-.356-.144t-.144-.356V6.481q0-.597-.403-1q-.404-.404-1.001-.404t-1 .404t-.403 1v11.038q0 1.002-.701 1.703t-1.702.701t-1.703-.701t-.702-1.703V6.481q0-.597-.404-1q-.404-.404-1-.404q-.598 0-1 .404q-.404.403-.404 1v11.038q0 1.002-.7 1.703q-.701.701-1.703.701" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-black dark:text-white">
                    {language === 'de' ? 'Das Wort des Menschen ist Trug' : 
                     language === 'en' ? 'Man\'s Word is Deception' : 
                     language === 'ro' ? 'Cuvântul omului este înșelător' : 
                     'Слово человека – обман'}
                  </h3>
                </div>
                <p className="text-black/80 dark:text-white/80 leading-relaxed">
                  {language === 'de' ? 'Aber das Wort des Herrn ist ohne Trug. „Verflucht ist der Mann, der auf Menschen vertraut.“ (Jeremia 17,5)' : 
                   language === 'en' ? 'But the word of the Lord is without deception. "Cursed is the man who trusts in man." (Jeremiah 17:5)' :
                   language === 'ro' ? 'Dar cuvântul Domnului este fără înșelare. "Blestemat este omul care se încrede în om." (Ieremia 17:5)' :
                   'Но слово Господа без обмана. "Проклят человек, который надеется на человека." (Иеремия 17:5)'}
                </p>
              </div>

              {/* Value 4 / Wert 4 / Valoare 4 */}
              <div className="glass-effect rounded-xl p-6 hover:bg-white/15 dark:hover:bg-white/15 hover:bg-black/15 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-black/90 dark:text-white/90">
                    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="currentColor">
                      <path d="M71 22.406v102.53h202.25v18.69h-73.22v36.968h-18.686v-36.97H79.156l43.375 53.782h180.44v18.688H180.905v36.97H162.22v-36.97h-39.407v163.562h58.53v-44.75H157.47V316.22h74.155V282.56H193.72v-18.687h97.218v18.688h-40.625v33.656h73.28v18.686h-32.437v44.75h26.313v18.688h-63.69l-2.686 74.03-18.688-.687 2.656-73.343H93.032V398h-.22l-28.687 92.844h79.844l9.81-70.688 18.5 2.563-9.468 68.124H453.25L424.562 398h-30.03V197.78l51.812-64.25V22.407h-64.406v52.438h-39.22V22.406h-65.124v52.438h-38.53V22.406h-65.126v52.438h-38.5V22.406H71zm129.03 312.5v44.75h72.44v-44.75h-72.44z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-black dark:text-white">
                    {language === 'de' ? 'Wachsamkeit' : 
                     language === 'en' ? 'Vigilance' : 
                     language === 'ro' ? 'Vigilență' : 
                     'Бдительность'}
                  </h3>
                </div>
                <p className="text-black/80 dark:text-white/80 leading-relaxed">
                  {language === 'de' ? 'Der Schlaf der Toten. „Wache auf, der du schläfst, und stehe auf aus den Toten, so wird Christus dich erleuchten!“ (Epheser 5,14)' :
                   language === 'en' ? 'The sleep of the dead. "Awake, O sleeper, and arise from the dead, and Christ will shine on you!" (Ephesians 5:14)' :
                   language === 'ro' ? 'Somnul morților. "Trezeste-te, tu care dormi, și scoală-te din morți, și Hristos te va lumina!" (Efeseni 5:14)' :
                   'Сон мертвых. "Проснись, спящий, и встань из мертвых, и Христос осветит тебя!" (Ефесянам 5:14)'}
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
                  <span className="text-2xl font-bold text-black dark:text-white">D</span>
                </div>
                
                <div className="flex justify-center gap-4">
                  
                </div>
              </div>
            </div>
          </section>

          {/* Call to action / Handlungsaufforderung */}
          <section className="text-center animate-fadeIn" style={{ animationDelay: '1s' }}>
            <div className="glass-effect rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
                {language === 'de' ? 'Entdecke' : 
                 language === 'en' ? 'Discover' : 
                 language === 'ro' ? 'Descoperă' : 
                 'Открой'}
              </h2>
              <p className="text-black/80 dark:text-white/80 mb-6 max-w-2xl mx-auto">
                {language === 'de' ? '...' : 
                 language === 'en' ? '...' : 
                 language === 'ro' ? '...' : 
                 '...'} 
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
