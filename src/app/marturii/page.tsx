// Pagina Mărturii — pasul 2608003 (pasul 1 din 4)
//
// Ce face acum:
//   • arată ecranul de intrare cu versetul (Evrei 13:8), o singură dată
//   • apoi pagina: semnul cărții, un text scurt, apoi rubricile
//   • tot textul se poate schimba din Setări → Pagini → Mărturii
//
// Ce urmează (pașii 2–4): panoul de creare din admin, lista mărturiilor
// dintr-o rubrică, căutarea și legătura cu reels.

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { getSupabaseClient } from '@/lib/supabase';
import { usePageText } from '@/lib/pageContent';
import { registerPageDefaults } from '@/lib/pageDefaults';
import BackToTopButton from '@/components/BackToTopButton';
import MarturiiIntroQuote from '@/components/MarturiiIntroQuote';
import { MARTURII_ACTIVE_KEY } from '@/lib/marturiiSession';

type Lang = 'ro' | 'de' | 'en' | 'ru';

const T: Record<Lang, Record<string, string>> = {
  de: {
    // —— Ecranul de intrare (se poate schimba din Setări → Pagini)
    // Scrie „nu" ca să oprești ecranul de intrare cu totul.
    introEnabled: 'da',
    introVerse: 'Jesus Christus ist derselbe gestern und heute und in Ewigkeit!',
    introReference: 'Hebräer 13,8',
    introSecond: 'Der Mensch aber ist wandelbar, wandelbar wie das Wetter.',
    // —— Pagina
    title: 'Zeugnisse',
    intro: 'Hi test text Marturii',
    sectionsTitle: 'Rubriken',
    empty: 'Es gibt noch keine Rubriken.',
    emptyHint: 'Lege die erste Rubrik im Admin-Bereich an.',
    loading: 'Wird geladen …',
    open: 'Öffnen',
    soon: 'Die Zeugnisse dieser Rubrik folgen in Kürze.',
    back: 'Zurück zur Startseite',
  },
  en: {
    introEnabled: 'da',
    introVerse: 'Jesus Christ is the same yesterday and today and forever!',
    introReference: 'Hebrews 13:8',
    introSecond: 'But man is changeable, changeable as the weather.',
    title: 'Testimonies',
    intro: 'Hi test text Marturii',
    sectionsTitle: 'Sections',
    empty: 'There are no sections yet.',
    emptyHint: 'Create the first section in the admin area.',
    loading: 'Loading …',
    open: 'Open',
    soon: 'The testimonies of this section are coming soon.',
    back: 'Back to home',
  },
  ro: {
    introEnabled: 'da',
    introVerse: 'Isus Hristos este același ieri și azi și în veci!',
    introReference: 'Evrei 13:8',
    introSecond: 'Dar omul este schimbător, schimbător ca vremea.',
    title: 'Mărturii',
    intro: 'Hi test text Marturii',
    sectionsTitle: 'Rubrici',
    empty: 'Nu există încă nicio rubrică.',
    emptyHint: 'Creează prima rubrică din panoul de administrare.',
    loading: 'Se încarcă …',
    open: 'Deschide',
    soon: 'Mărturiile din această rubrică vin în curând.',
    back: 'Înapoi la pagina principală',
  },
  ru: {
    introEnabled: 'da',
    introVerse: 'Иисус Христос вчера и сегодня и вовеки Тот же!',
    introReference: 'Евреям 13:8',
    introSecond: 'А человек изменчив, изменчив, как погода.',
    title: 'Свидетельства',
    intro: 'Hi test text Marturii',
    sectionsTitle: 'Рубрики',
    empty: 'Рубрик пока нет.',
    emptyHint: 'Создайте первую рубрику в панели администратора.',
    loading: 'Загрузка …',
    open: 'Открыть',
    soon: 'Свидетельства этой рубрики появятся скоро.',
    back: 'На главную',
  },
};

registerPageDefaults('marturii', T);


interface Section {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export default function MarturiiPage() {
  const { language } = useLanguage();
  const lang = (['ro', 'de', 'en', 'ru'].includes(language) ? language : 'de') as Lang;
  const t = usePageText('marturii', T, lang);

  // Pasul 2608006 — ecranul de intrare apare doar când VII din altă parte.
  // Când te plimbi prin mărturii (rubrică → mărturie → înapoi) nu mai apare.
  // Se poate și opri de tot din Setări → Pagini → Mărturii (câmpul „introEnabled").
  const introOff = String(t.introEnabled ?? 'da').trim().toLowerCase() === 'nu';
  const [showIntro, setShowIntro] = useState(false);
  const [introChecked, setIntroChecked] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  useEffect(() => {
    let alreadyInside = false;
    try {
      alreadyInside = sessionStorage.getItem(MARTURII_ACTIVE_KEY) === '1';
      sessionStorage.setItem(MARTURII_ACTIVE_KEY, '1');
    } catch {
      /* filă privată */
    }
    setShowIntro(!alreadyInside);
    setIntroChecked(true);
  }, []);

  const finishIntro = useCallback(() => setShowIntro(false), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = getSupabaseClient();
      const { data, error } = await sb
        .from('testimony_sections')
        .select('id, slug, name_ro, name_de, name_en, name_ru, description_ro, description_de, description_en, description_ru')
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        // Tabelul lipsește = fișierul SQL nu a fost rulat încă.
        if (error.code === '42P01') setTableMissing(true);
        setSections([]);
        return;
      }

      const rows = (data || []) as unknown as Record<string, unknown>[];
      setSections(
        rows.map((r) => ({
          id: r.id as string,
          slug: r.slug as string,
          name: ((r[`name_${lang}`] as string) || (r.name_ro as string) || '').trim(),
          description: ((r[`description_${lang}`] as string) || (r.description_ro as string) || null),
        })),
      );
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasSections = useMemo(() => sections.length > 0, [sections]);

  // Cât timp verificăm, nu clipim conținutul.
  if (!introChecked) return <div className="min-h-screen" aria-hidden="true" />;

  if (showIntro && !introOff) {
    return (
      <MarturiiIntroQuote
        onFinish={finishIntro}
        verse={t.introVerse}
        reference={t.introReference}
        secondLine={t.introSecond}
      />
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ---------- Antet: semnul cărții, centrat, cu textul dedesubt ---------- */}
        <header className="text-center mb-16">
          <div className="mx-auto mb-6 flex justify-center text-black/90 dark:text-white/90">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              className="w-16 h-16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M19.5,11h7c0.276,0,0.5-0.224,0.5-0.5S26.776,10,26.5,10h-7c-0.276,0-0.5,0.224-0.5,0.5S19.224,11,19.5,11z" />
              <path d="M19.5,14h7c0.276,0,0.5-0.224,0.5-0.5S26.776,13,26.5,13h-7c-0.276,0-0.5,0.224-0.5,0.5S19.224,14,19.5,14z" />
              <path d="M19.5,17h7c0.276,0,0.5-0.224,0.5-0.5S26.776,16,26.5,16h-7c-0.276,0-0.5,0.224-0.5,0.5S19.224,17,19.5,17z" />
              <path d="M19.5,20h7c0.276,0,0.5-0.224,0.5-0.5S26.776,19,26.5,19h-7c-0.276,0-0.5,0.224-0.5,0.5S19.224,20,19.5,20z" />
              <path d="M28.5,5h-10C18.224,5,18,5.224,18,5.5S18.224,6,18.5,6h10C28.776,6,29,6.225,29,6.5v19c0,0.275-0.224,0.5-0.5,0.5h-25C3.224,26,3,25.775,3,25.5v-19C3,6.225,3.224,6,3.5,6H15v17.5c0,0.276,0.224,0.5,0.5,0.5s0.5-0.224,0.5-0.5v-18C16,5.224,15.776,5,15.5,5h-12C2.673,5,2,5.673,2,6.5v19C2,26.327,2.673,27,3.5,27h25c0.827,0,1.5-0.673,1.5-1.5v-19C30,5.673,29.327,5,28.5,5z" />
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-black dark:text-white mb-6 animate-fadeIn">
            {t.title}
          </h1>

          <p className="mx-auto max-w-2xl text-black/80 dark:text-white/80 leading-relaxed animate-fadeIn">
            {t.intro}
          </p>
        </header>

        {/* ---------- Rubricile ---------- */}
        <section className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-2xl font-bold text-black dark:text-white text-center mb-8">
            {t.sectionsTitle}
          </h2>

          {loading ? (
            <p className="text-center text-black/50 dark:text-white/50">{t.loading}</p>
          ) : !hasSections ? (
            <div className="glass-effect rounded-2xl p-8 text-center">
              <p className="text-black/70 dark:text-white/70">{t.empty}</p>
              {tableMissing ? (
                <p className="mt-2 text-xs text-black/45 dark:text-white/45">
                  Rulează <code className="rounded bg-black/10 px-1 dark:bg-white/10">STEP_2608003_MARTURII.sql</code> în Supabase.
                </p>
              ) : (
                <p className="mt-2 text-xs text-black/45 dark:text-white/45">{t.emptyHint}</p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {sections.map((s) => (
                <Link
                  key={s.id}
                  href={`/marturii/${s.slug}`}
                  className="glass-effect group rounded-2xl p-6 transition-transform duration-300 hover:scale-[1.02]"
                >
                  <h3 className="font-cinzel text-xl font-semibold text-black dark:text-white">
                    {s.name}
                  </h3>
                  {s.description && (
                    <p className="mt-2 text-sm leading-relaxed text-black/70 dark:text-white/70">
                      {s.description}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-black/60 dark:text-white/60">
                    {t.open}
                    <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="mt-16 text-center">
          <Link
            href="/"
            className="text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white transition-colors"
          >
            ← {t.back}
          </Link>
        </div>
      </div>

      <BackToTopButton />
    </div>
  );
}
