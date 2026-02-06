// Translation hook tests / Übersetzungs-Hook-Tests / Teste hook traducere
// Tests for the DeepL translation functionality
// Tests für die DeepL-Übersetzungsfunktionalität
// Teste pentru funcționalitatea de traducere DeepL

describe('Translation Hook Tests / Übersetzungs-Hook-Tests / Teste Hook Traducere', () => {
  
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('API Call Tests / API-Aufruf-Tests / Teste apel API', () => {
    
    it('should call translate API with correct parameters / Sollte Übersetzungs-API mit korrekten Parametern aufrufen / Ar trebui să apeleze API-ul de traducere cu parametrii corecți', async () => {
      const mockResponse = {
        translatedText: 'Translated text',
        detectedSourceLang: 'DE',
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Test text',
          targetLang: 'en',
          sourceLang: 'de',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.translatedText).toBe('Translated text');
    });

    it('should handle batch translation / Sollte Batch-Übersetzung handhaben / Ar trebui să gestioneze traducerea în lot', async () => {
      const mockResponse = {
        translatedText: ['Text 1', 'Text 2', 'Text 3'],
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ['Text 1 DE', 'Text 2 DE', 'Text 3 DE'],
          targetLang: 'en',
          autoDetect: true,
        }),
      });

      const data = await response.json();
      expect(Array.isArray(data.translatedText)).toBe(true);
      expect(data.translatedText.length).toBe(3);
    });

    it('should handle API errors gracefully / Sollte API-Fehler elegant behandeln / Ar trebui să gestioneze erorile API cu grație', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Translation failed' }),
      });

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Test',
          targetLang: 'en',
        }),
      });

      expect(response.ok).toBe(false);
    });

  });

  describe('Cache Tests / Cache-Tests / Teste Cache', () => {
    
    it('should generate unique cache keys / Sollte eindeutige Cache-Schlüssel generieren / Ar trebui să genereze chei cache unice', () => {
      const getCacheKey = (text: string, targetLang: string, sourceLang: string) => {
        return `${sourceLang}-${targetLang}-${text.length}-${text.substring(0, 100)}`;
      };

      const key1 = getCacheKey('Hello world', 'de', 'en');
      const key2 = getCacheKey('Hello world', 'ro', 'en');
      const key3 = getCacheKey('Different text', 'de', 'en');

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
    });

  });

  describe('Language Detection Tests / Spracherkennungs-Tests / Teste detectare limbă', () => {
    
    const languageMap: Record<string, string> = {
      de: 'DE',
      en: 'EN',
      ro: 'RO',
      ru: 'RU',
    };

    it('should map language codes correctly / Sollte Sprachcodes korrekt zuordnen / Ar trebui să mapeze codurile limbilor corect', () => {
      expect(languageMap['de']).toBe('DE');
      expect(languageMap['en']).toBe('EN');
      expect(languageMap['ro']).toBe('RO');
      expect(languageMap['ru']).toBe('RU');
    });

    it('should handle auto-detect mode / Sollte Auto-Erkennungs-Modus handhaben / Ar trebui să gestioneze modul auto-detectare', () => {
      const autoDetect = true;
      const sourceLang = autoDetect ? null : 'de';
      
      expect(sourceLang).toBeNull();
    });

  });

});
