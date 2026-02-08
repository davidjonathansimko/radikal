// Story Phrases - Multilingual data for AboutStoryModal
// Bible translations: DE=Schlachter2000, RO=Cornilescu, EN=KJV, RU=Synodal

import { phrasesDE } from './storyPhrasesDE';
import { phrasesEN } from './storyPhrasesEN';
import { phrasesRO } from './storyPhrasesRO';
import { phrasesRU } from './storyPhrasesRU';

export type StoryPhrase = { main: string; sub: string | null };
export type LanguageKey = 'de' | 'en' | 'ro' | 'ru';

const phrasesMap: Record<LanguageKey, StoryPhrase[]> = {
  de: phrasesDE,
  en: phrasesEN,
  ro: phrasesRO,
  ru: phrasesRU,
};

export function getStoryPhrases(lang: LanguageKey): StoryPhrase[] {
  return phrasesMap[lang] || phrasesDE;
}
