// Blog Intro Modal with typewriter effect
// Modal that appears before viewing a blog post with a custom question
// Displays blog image on left, question with typewriter effect on right

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { BlogPost } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

interface BlogIntroModalProps {
  post: BlogPost;
  onComplete: () => void;
}

export default function BlogIntroModal({ post, onComplete }: BlogIntroModalProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { translate } = useTranslation();
  
  // State for typewriter effect
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [displayedQuestion, setDisplayedQuestion] = useState('');
  const [titleComplete, setTitleComplete] = useState(false);
  const [questionComplete, setQuestionComplete] = useState(false);
  const [showModal, setShowModal] = useState(true);
  
  // 🌐 DeepL: State for translated modal content
  const [translatedModalTitle, setTranslatedModalTitle] = useState<string>('');
  const [translatedModalQuestion, setTranslatedModalQuestion] = useState<string>('');
  
  // State for countdown timer - 4 seconds
  const [countdown, setCountdown] = useState(4);

  // Hide footer and navigation when modal is open
  useEffect(() => {
    // Hide footer and navigation
    const footer = document.querySelector('footer');
    const nav = document.querySelector('nav');
    const mobileNavs = document.querySelectorAll('[data-mobile-nav]');
    
    if (footer) (footer as HTMLElement).style.display = 'none';
    if (nav) (nav as HTMLElement).style.display = 'none';
    mobileNavs.forEach(el => (el as HTMLElement).style.display = 'none');
    
    // Add modal-open class for CSS fix
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
    
    // Completely lock the body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.documentElement.style.overflow = 'hidden';
    
    // Cleanup - restore visibility when modal closes
    return () => {
      if (footer) (footer as HTMLElement).style.display = '';
      if (nav) (nav as HTMLElement).style.display = '';
      mobileNavs.forEach(el => (el as HTMLElement).style.display = '');
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Get title and question based on language (original or already translated in database)
  const getModalTitle = useCallback(() => {
    // If we have a DeepL translation, use it / Dacă avem traducere DeepL, o folosim
    if (translatedModalTitle) return translatedModalTitle;
    
    // Otherwise use existing database translations / Altfel folosește traducerile din bază
    switch (language) {
      case 'en': return post.modal_title_en || post.modal_title || 'Do you seek the truth?';
      case 'ro': return post.modal_title_ro || post.modal_title || 'Dorești adevărul?';
      case 'ru': return post.modal_title_ru || post.modal_title || 'Ты ищешь истину?';
      default: return post.modal_title || 'Suchst du die Wahrheit?';
    }
  }, [language, post, translatedModalTitle]);

  const getModalQuestion = useCallback(() => {
    // If we have a DeepL translation, use it / Dacă avem traducere DeepL, o folosim
    if (translatedModalQuestion) return translatedModalQuestion;
    
    // Otherwise use existing database translations / Altfel folosește traducerile din bază
    switch (language) {
      case 'en': return post.modal_question_en || post.modal_question || 'This word is not for everyone, but only for those who are ready to accept the truth and God\'s will. And you?';
      case 'ro': return post.modal_question_ro || post.modal_question || 'Cuvântul acesta nu este pentru toți, ci doar pentru aceia care sunt gata să accepte adevărul și voia lui Dumnezeu. Și tu?';
      case 'ru': return post.modal_question_ru || post.modal_question || 'Это слово не для всех, а только для тех, кто готов принять истину и волю Божью. А ты?';
      default: return post.modal_question || 'Dieses Wort ist nicht für alle, sondern nur für diejenigen, die bereit sind, die Wahrheit und Gottes Willen anzunehmen. Und du?';
    }
  }, [language, post, translatedModalQuestion]);

  // 🌐 DeepL: Auto-translate modal title and question when language changes
  // Folosește DeepL pentru traducere automată când limba nu este Română
  useEffect(() => {
    const translateModalContent = async () => {
      // Skip if Romanian (original language) or no modal content
      if (language === 'ro' || (!post.modal_title && !post.modal_question)) {
        setTranslatedModalTitle('');
        setTranslatedModalQuestion('');
        return;
      }

      // Get original Romanian text (or default)
      const originalTitle = post.modal_title || 'Dorești adevărul?';
      const originalQuestion = post.modal_question || 'Cuvântul acesta nu este pentru toți, ci doar pentru aceia care sunt gata să accepte adevărul și voia lui Dumnezeu. Și tu?';

      try {
        // Translate title and question with DeepL
        const [title, question] = await Promise.all([
          translate(originalTitle, language),
          translate(originalQuestion, language),
        ]);

        setTranslatedModalTitle(title);
        setTranslatedModalQuestion(question);
        console.log('✅ DeepL: Modal content translated');
      } catch (error) {
        console.error('❌ DeepL: Failed to translate modal content:', error);
      }
    };

    translateModalContent();
  }, [post.modal_title, post.modal_question, language, translate]);

  // Typewriter effect for title
  useEffect(() => {
    const title = getModalTitle();
    let currentIndex = 0;
    
    const titleInterval = setInterval(() => {
      if (currentIndex <= title.length) {
        setDisplayedTitle(title.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(titleInterval);
        setTitleComplete(true);
      }
    }, 70); // Speed of typing for title

    return () => clearInterval(titleInterval);
  }, [getModalTitle]);

  // Typewriter effect for question (starts after title is complete)
  useEffect(() => {
    if (!titleComplete) return;

    const question = getModalQuestion();
    let currentIndex = 0;
    
    // Small delay before starting question
    const startDelay = setTimeout(() => {
      const questionInterval = setInterval(() => {
        if (currentIndex <= question.length) {
          setDisplayedQuestion(question.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(questionInterval);
          setQuestionComplete(true);
        }
      }, 50); // Speed of typing for question (faster)

      return () => clearInterval(questionInterval);
    }, 300);

    return () => clearTimeout(startDelay);
  }, [titleComplete, getModalQuestion]);

  // Auto-close modal 2 (made it 3 seconds to test the length=.) seconds after question is complete
  useEffect(() => {
    if (questionComplete) {
      // Start countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const closeTimer = setTimeout(() => {
        setShowModal(false);
        // Small delay for fade-out animation
        setTimeout(onComplete, 500);
      }, 4000);

      return () => {
        clearTimeout(closeTimer);
        clearInterval(countdownInterval);
      };
    }
  }, [questionComplete, onComplete]);

  if (!showModal) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 opacity-0 pointer-events-none">
        {/* Fade out */}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 opacity-100">
      {/* Blurred background with blog image preview - theme aware */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: post.image_url ? `url('${post.image_url}')` : 'none',
          filter: theme === 'dark' ? 'blur(8px) brightness(0.3)' : 'blur(8px) brightness(1.2)'
        }}
      />
      
      {/* Theme-aware overlay */}
      <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/70' : 'bg-white/80'}`} />

      {/* Modal Content - on mobile: flex-col with image fixed height, text auto-sizes to fit */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center w-full max-w-6xl mx-4 lg:mx-8 gap-4 sm:gap-8 lg:gap-16 animate-fadeIn max-h-[90vh] lg:max-h-none overflow-hidden">
        
        {/* Left side - Blog Image with frame effect */}
        {/* On small mobile: image has max height to leave room for text */}
        <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl flex-shrink-0">
          {/* Decorative frame border - theme aware */}
          <div className={`absolute -inset-2 bg-gradient-to-br rounded-lg ${theme === 'dark' ? 'from-white/20 via-transparent to-white/10' : 'from-black/10 via-transparent to-black/5'}`} />
          
          {/* Image container - constrained height on small mobile */}
          <div className="relative overflow-hidden rounded-lg shadow-2xl max-h-[30vh] sm:max-h-[35vh] lg:max-h-none">
            {post.image_url ? (
              <Image
                src={post.image_url}
                alt={post.title}
                width={600}
                height={400}
                className="w-full h-auto object-cover"
                priority
              />
            ) : (
              <div className={`w-full h-64 flex items-center justify-center ${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
                <span className={`text-lg ${theme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>📖</span>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Text content */}
        {/* On small mobile: text auto-sizes to fill remaining space, thinner font weight */}
        <div className="flex-1 min-h-0 max-w-lg xl:max-w-xl text-center lg:text-left px-4 overflow-hidden">
          {/* Title with typewriter effect - TEKTUR FONT */}
          {/* Mobile: smaller + thinner text to fit; uses clamp() for auto-sizing on very small screens */}
          <h2 className={`font-tektur text-[clamp(1.25rem,5.5vw,2.25rem)] sm:text-5xl lg:text-6xl xl:text-7xl mb-3 sm:mb-6 lg:mb-8 tracking-wide font-light sm:font-normal ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            {displayedTitle}
            {!titleComplete && <span className="animate-pulse">|</span>}
          </h2>

          {/* Question with typewriter effect - normal font */}
          {/* Mobile: smaller text with lighter weight for readability */}
          <p className={`text-[clamp(0.75rem,3vw,1rem)] sm:text-lg lg:text-xl xl:text-2xl leading-relaxed tracking-wider uppercase font-light sm:font-normal ${theme === 'dark' ? 'text-white/80' : 'text-black/70'}`}>
            {displayedQuestion}
            {titleComplete && !questionComplete && <span className="animate-pulse">|</span>}
          </p>

          {/* HIDDEN FOR NOW - Progress indicator with digital countdown timer (appears when question is complete) 
              Comentat pentru efect mai misterios - userul nu știe când apare blogul
          {questionComplete && (
            <div className="mt-8 lg:mt-12 animate-fadeIn">
              <div className={`flex items-center justify-center lg:justify-start gap-3 ${theme === 'dark' ? 'text-white/70' : 'text-black/60'}`}>
                {/* Digital countdown display */}
                {/* <div className="font-mono text-2xl sm:text-3xl tracking-widest">
                  <span className={theme === 'dark' ? 'text-white' : 'text-black'}>00:0{countdown}</span>
                </div>
                <span className={`text-sm ${theme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                  {language === 'de' ? 'Öffnet...' :
                   language === 'en' ? 'Opening...' :
                   language === 'ro' ? 'Se deschide...' :
                   'Открывается...'}
                </span>
              </div>
              
              {/* Progress bar - theme aware */}
              {/* <div className={`mt-4 w-48 lg:w-64 h-1 rounded-full overflow-hidden mx-auto lg:mx-0 ${theme === 'dark' ? 'bg-white/20' : 'bg-black/10'}`}>
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-linear ${theme === 'dark' ? 'bg-white/60' : 'bg-black/40'}`}
                  style={{ width: `${((4 - countdown) / 4) * 100}%` }}
                />
              </div>
            </div>
          )}
          END HIDDEN SECTION */}
        </div>
      </div>

      {/* Decorative geometric lines - theme aware */}
      <div className={`absolute bottom-8 right-8 opacity-20 hidden lg:block`}>
        <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 140 L70 80 L130 140" stroke={theme === 'dark' ? 'white' : 'black'} strokeWidth="1" />
          <path d="M30 140 L70 100 L110 140" stroke={theme === 'dark' ? 'white' : 'black'} strokeWidth="1" />
          <circle cx="70" cy="80" r="3" fill={theme === 'dark' ? 'white' : 'black'} />
          <circle cx="130" cy="10" r="2" fill={theme === 'dark' ? 'white' : 'black'} />
        </svg>
      </div>

      {/* HIDDEN FOR NOW - Skip button - theme aware 
          Comentat pentru efect mai misterios
      <button
        onClick={() => {
          setShowModal(false);
          setTimeout(onComplete, 100);
        }}
        className={`absolute bottom-4 right-4 text-xs transition-colors duration-300 ${theme === 'dark' ? 'text-white/30 hover:text-white/60' : 'text-black/30 hover:text-black/60'}`}
      >
        {language === 'de' ? 'Überspringen →' :
         language === 'en' ? 'Skip →' :
         language === 'ro' ? 'Sari →' :
         'Пропустить →'}
      </button>
      END HIDDEN SKIP BUTTON */}
    </div>
  );
}
