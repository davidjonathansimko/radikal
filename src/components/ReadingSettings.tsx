// Reading Settings Component for font size, line height, etc. / Leseeinstellungen-Komponente für Schriftgröße, Zeilenabstand, etc. / Componentă Setări Citire pentru dimensiune font, înălțime linie, etc.
// Allows users to customize their reading experience
// Ermöglicht Benutzern, ihre Leseerfahrung anzupassen
// Permite utilizatorilor să își personalizeze experiența de citire

'use client';

import { useState, useEffect, useCallback } from 'react';

interface ReadingSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: 'default' | 'serif' | 'mono' | 'dyslexia';
  maxWidth: number;
  theme: 'default' | 'sepia' | 'night';
}

const DEFAULT_SETTINGS: ReadingSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: 'default',
  maxWidth: 720,
  theme: 'default',
};

const STORAGE_KEY = 'radikal-reading-settings';

export function useReadingSettings() {
  const [settings, setSettings] = useState<ReadingSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.warn('[ReadingSettings] Failed to load:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: Partial<ReadingSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.warn('[ReadingSettings] Failed to save:', error);
      }
      return updated;
    });
  }, []);

  // Reset to defaults
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('[ReadingSettings] Failed to reset:', error);
    }
  }, []);

  return {
    settings,
    isLoaded,
    saveSettings,
    resetSettings,
    setFontSize: (fontSize: number) => saveSettings({ fontSize }),
    setLineHeight: (lineHeight: number) => saveSettings({ lineHeight }),
    setFontFamily: (fontFamily: ReadingSettings['fontFamily']) => saveSettings({ fontFamily }),
    setMaxWidth: (maxWidth: number) => saveSettings({ maxWidth }),
    setTheme: (theme: ReadingSettings['theme']) => saveSettings({ theme }),
  };
}

// Font family CSS mapping
const FONT_FAMILIES = {
  default: 'inherit',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
  dyslexia: 'OpenDyslexic, Arial, sans-serif',
};

// Theme color mapping
const THEMES = {
  default: {
    bg: 'bg-black',
    text: 'text-white',
    prose: 'prose-invert',
  },
  sepia: {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    prose: 'prose-amber',
  },
  night: {
    bg: 'bg-gray-950',
    text: 'text-gray-300',
    prose: 'prose-invert',
  },
};

interface ReadingSettingsPanelProps {
  className?: string;
  onClose?: () => void;
}

export default function ReadingSettingsPanel({ 
  className = '',
  onClose,
}: ReadingSettingsPanelProps) {
  const {
    settings,
    setFontSize,
    setLineHeight,
    setFontFamily,
    setMaxWidth,
    setTheme,
    resetSettings,
  } = useReadingSettings();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        title="Leseeinstellungen"
        aria-label="Leseeinstellungen öffnen"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              onClose?.();
            }}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-12 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-white">Leseeinstellungen</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Font Size */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm flex justify-between mb-2">
                <span>Schriftgröße</span>
                <span className="text-white">{settings.fontSize}px</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSize(Math.max(12, settings.fontSize - 2))}
                  className="w-8 h-8 bg-gray-700 rounded text-white hover:bg-gray-600"
                >
                  A-
                </button>
                <input
                  type="range"
                  min="12"
                  max="28"
                  value={settings.fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="flex-1"
                />
                <button
                  onClick={() => setFontSize(Math.min(28, settings.fontSize + 2))}
                  className="w-8 h-8 bg-gray-700 rounded text-white hover:bg-gray-600"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Line Height */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm flex justify-between mb-2">
                <span>Zeilenabstand</span>
                <span className="text-white">{settings.lineHeight}</span>
              </label>
              <input
                type="range"
                min="1.2"
                max="2.5"
                step="0.1"
                value={settings.lineHeight}
                onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Max Width */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm flex justify-between mb-2">
                <span>Textbreite</span>
                <span className="text-white">{settings.maxWidth}px</span>
              </label>
              <input
                type="range"
                min="500"
                max="1000"
                step="20"
                value={settings.maxWidth}
                onChange={(e) => setMaxWidth(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Font Family */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm block mb-2">Schriftart</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'default', label: 'Standard' },
                  { value: 'serif', label: 'Serif' },
                  { value: 'mono', label: 'Mono' },
                  { value: 'dyslexia', label: 'Legasthenie' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFontFamily(option.value as ReadingSettings['fontFamily'])}
                    className={`px-3 py-2 rounded text-sm transition-colors ${
                      settings.fontFamily === option.value
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm block mb-2">Farbschema</label>
              <div className="flex gap-2">
                {[
                  { value: 'default', label: 'Dunkel', color: 'bg-gray-900' },
                  { value: 'sepia', label: 'Sepia', color: 'bg-amber-100' },
                  { value: 'night', label: 'Nacht', color: 'bg-gray-950' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value as ReadingSettings['theme'])}
                    className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                      settings.theme === option.value
                        ? 'ring-2 ring-red-500'
                        : ''
                    } ${option.color} ${option.value === 'sepia' ? 'text-amber-900' : 'text-white'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset button */}
            <button
              onClick={resetSettings}
              className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors text-sm"
            >
              Zurücksetzen
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Wrapper component that applies reading settings to content
interface ReadingContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ReadingContent({ children, className = '' }: ReadingContentProps) {
  const { settings, isLoaded } = useReadingSettings();

  if (!isLoaded) {
    return <div className={className}>{children}</div>;
  }

  const theme = THEMES[settings.theme];
  const fontFamily = FONT_FAMILIES[settings.fontFamily];

  return (
    <div
      className={`transition-colors duration-300 ${theme.bg} ${theme.text} ${className}`}
      style={{
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
        fontFamily,
      }}
    >
      <div
        className="mx-auto px-4"
        style={{ maxWidth: `${settings.maxWidth}px` }}
      >
        {children}
      </div>
    </div>
  );
}

export { FONT_FAMILIES, THEMES };
export type { ReadingSettings };
