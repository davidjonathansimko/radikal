// Bible quote component with Revelation 3:16 / Bibelzitat-Komponente mit Offenbarung 3:16
// This displays the specific verse Revelation 3:16 in multiple languages
// Dies zeigt den spezifischen Vers Offenbarung 3:16 in mehreren Sprachen an

'use client';

import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';

export default function BibleQuotes() {
  // Get language from language context / Sprache aus Sprachkontext abrufen
  const { language } = useLanguage();

  return (
    <div className="w-full max-w-md mx-auto text-center">
      {/* Bible verse symbol / Bibelvers-Symbol */}
     

      {/* Quote text with Cinzel font / Zitattext mit Cinzel-Schrift / Text citat cu font Cinzel */}
      <blockquote 
        className="text-white text-center font-bold leading-relaxed mb-3 text-shadow-lg text-2xl sm:text-3xl md:text-4xl"
        style={{ fontFamily: "'Cinzel', Georgia, 'Times New Roman', serif" }}
      >
        &quot;{language === 'de' ? 'Weil du aber lauwarm bist und weder kalt noch heiß, will ich dich ausspucken aus meinem Mund.' : 
          language === 'en' ? 'So then because thou art lukewarm, and neither cold nor hot, I will spue thee out of my mouth.' : 
          language === 'ro' ? 'Dar, fiindcă eşti căldicel, nici rece, nici în clocot, am să te vărs din gura Mea.' : 
          'Но как ты тепл, а не горяч и не холоден, то извергну тебя из уст Моих.'}&quot;
      </blockquote>

      {/* Bible reference with Cinzel font / Bibelstelle mit Cinzel-Schrift / Referință biblică cu font Cinzel */}
      <cite 
        className="block text-white/90 text-center text-base sm:text-lg font-medium text-shadow"
        style={{ fontFamily: "'Cinzel', Georgia, 'Times New Roman', serif" }}
      >
        — {language === 'de' ? 'Offenbarung 3:16' : 
           language === 'en' ? 'Revelation 3:16' : 
           language === 'ro' ? 'Apocalipsa 3:16' : 
           'Откровение 3:16'}
      </cite>
    </div>
  );
}
