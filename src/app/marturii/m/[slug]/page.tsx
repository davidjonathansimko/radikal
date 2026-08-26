// Pagina unei mărturii — pasul 2608005 (pasul 3)
//
// Textul: dacă ai scris tu traducerea pentru limba cititorului, aceea se
// afișează. Dacă nu, se afișează originalul și îl traduce DeepL, ca la blog.

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from '@/hooks/useTranslation';
import { getSupabaseClient } from '@/lib/supabase';
import BackToTopButton from '@/components/BackToTopButton';
import ImageEffectLayers, {
  DEFAULT_IMAGE_EFFECTS,
  type ImageEffectSettings,
} from '@/components/ImageEffectLayers';
import { pickTestimonyText, hasOwnTranslation, type TestimonyRow } from '@/lib/testimonies';

const PlayBlogModal = dynamic(() => import('@/components/PlayBlogModal'), { ssr: false });

type Lang = 'ro' | 'de' | 'en' | 'ru';

const T: Record<Lang, Record<string, string>> = {
  de: { loading: 'Wird geladen …', notFound: 'Dieses Zeugnis gibt es nicht.', back: 'Zurück zu den Zeugnissen', listen: 'Zeugnis anhören' },
  en: { loading: 'Loading …', notFound: 'This testimony does not exist.', back: 'Back to testimonies', listen: 'Listen to the testimony' },
  ro: { loading: 'Se încarcă …', notFound: 'Această mărturie nu există.', back: 'Înapoi la mărturii', listen: 'Ascultă mărturia' },
  ru: { loading: 'Загрузка …', notFound: 'Такого свидетельства нет.', back: 'Назад к свидетельствам', listen: 'Слушать свидетельство' },
};

export default function TestimonyPage() {
  const params = useParams();
  const slug = String(params?.slug ?? '');
  const { language } = useLanguage();
  const lang = (['ro', 'de', 'en', 'ru'].includes(language) ? language : 'de') as Lang;
  const t = T[lang];
  const { translate } = useTranslation();

  const [row, setRow] = useState<TestimonyRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayOpen, setIsPlayOpen] = useState(false);

  // Textul tradus de DeepL, folosit doar dacă nu ai scris tu traducerea.
  const [autoTitle, setAutoTitle] = useState('');
  const [autoContent, setAutoContent] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = getSupabaseClient();
      const { data } = await sb
        .from('testimonies')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();
      setRow((data as unknown as TestimonyRow) ?? null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const ownTitle = row ? pickTestimonyText(row, 'title', lang) : '';
  const ownContent = row ? pickTestimonyText(row, 'content', lang) : '';

  // DeepL intră în joc DOAR pentru limbile în care nu ai scris nimic.
  useEffect(() => {
    if (!row || lang === 'ro') {
      setAutoTitle('');
      setAutoContent('');
      return;
    }

    let alive = true;
    (async () => {
      const needTitle = !hasOwnTranslation(row, 'title', lang);
      const needContent = !hasOwnTranslation(row, 'content', lang);
      if (!needTitle && !needContent) return;

      const [ti, co] = await Promise.all([
        needTitle ? translate(row.title, lang, 'ro') : Promise.resolve(''),
        needContent ? translate(row.content, lang, 'ro') : Promise.resolve(''),
      ]);
      if (!alive) return;
      setAutoTitle(ti);
      setAutoContent(co);
    })();

    return () => {
      alive = false;
    };
  }, [row, lang, translate]);

  const displayTitle = autoTitle || ownTitle;
  const displayContent = autoContent || ownContent;

  const effects: ImageEffectSettings = useMemo(() => {
    const r = (row ?? {}) as Record<string, unknown>;
    return {
      ...DEFAULT_IMAGE_EFFECTS,
      effectNoise: Boolean(r.effect_noise),
      effectGrain: Boolean(r.effect_grain),
      effectSepia: Boolean(r.effect_sepia),
      effectVignette: Boolean(r.effect_vignette),
      sepiaIntensity: (r.sepia_intensity as number) ?? DEFAULT_IMAGE_EFFECTS.sepiaIntensity,
      vignetteIntensity: (r.vignette_intensity as number) ?? DEFAULT_IMAGE_EFFECTS.vignetteIntensity,
      grainOpacity: (r.grain_opacity as number) ?? DEFAULT_IMAGE_EFFECTS.grainOpacity,
      effectBw: Boolean(r.effect_bw),
      effectBloom: Boolean(r.effect_bloom),
      effectLetterbox: Boolean(r.effect_letterbox),
      effectLightLeak: Boolean(r.effect_light_leak),
    };
  }, [row]);

  if (loading) {
    return (
      <div className="min-h-screen py-20 text-center text-black/50 dark:text-white/50">{t.loading}</div>
    );
  }

  if (!row) {
    return (
      <div className="min-h-screen py-20 text-center">
        <p className="text-black/70 dark:text-white/70">{t.notFound}</p>
        <Link href="/marturii" className="mt-4 inline-block text-black/60 underline dark:text-white/60">
          ← {t.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {row.image_url && (
          <div className="relative mb-6 overflow-hidden rounded-2xl">
            <Image
              src={row.image_url}
              alt={displayTitle}
              width={1200}
              height={600}
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
              className="h-56 w-full object-cover sm:h-80"
            />
            <ImageEffectLayers settings={effects} zIndex={1} />

            {row.is_dynamic && (
              <button
                onClick={() => setIsPlayOpen(true)}
                className="force-white-text absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-white"
                aria-label={t.listen}
              >
                <span
                  className="play-blog-heartbeat flex items-center justify-center rounded-full bg-black/50 shadow-2xl ring-1 ring-white/25 backdrop-blur-md"
                  style={{ width: 'clamp(76px, 20vw, 108px)', height: 'clamp(76px, 20vw, 108px)' }}
                >
                  <svg
                    viewBox="0 0 60 60"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ width: 'clamp(44px, 11vw, 64px)', height: 'clamp(44px, 11vw, 64px)' }}
                  >
                    <circle cx="30" cy="30" r="27" />
                    <path d="M24 19l18 11-18 11V19z" fill="currentColor" stroke="none" />
                  </svg>
                </span>
                <span
                  className="rounded-full bg-black/55 px-4 py-1.5 font-semibold tracking-wide shadow-lg backdrop-blur-md"
                  style={{ fontSize: 'clamp(12px, 3.2vw, 15px)' }}
                >
                  {t.listen}
                </span>
              </button>
            )}
          </div>
        )}

        <h1 className="mb-6 font-cinzel text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl">
          {displayTitle}
        </h1>

        <div className="prose prose-lg prose-gray max-w-none dark:prose-invert">
          {displayContent.split('\n').filter(Boolean).map((paragraph, i) => (
            <p key={i} className="leading-relaxed text-black/85 dark:text-white/85">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/marturii"
            className="text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            ← {t.back}
          </Link>
        </div>
      </article>

      {isPlayOpen && (
        <PlayBlogModal
          isOpen={isPlayOpen}
          onClose={() => setIsPlayOpen(false)}
          title={displayTitle}
          text={displayContent}
          imageUrl={row.image_url}
          slug={row.slug}
          blogId={row.id}
          language={language}
          effects={effects}
          backgroundOpacity={35}
          isLiked={false}
          onToggleLike={() => {}}
        />
      )}

      <BackToTopButton />
    </div>
  );
}
