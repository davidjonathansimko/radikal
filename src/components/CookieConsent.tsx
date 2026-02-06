// Cookie Consent Banner for GDPR Compliance / Cookie-Zustimmungs-Banner für DSGVO-Konformität / Banner consimțământ cookie pentru conformitate GDPR
// This component displays a cookie consent banner at the bottom of the page
// Diese Komponente zeigt ein Cookie-Zustimmungs-Banner am unteren Rand der Seite an
// Această componentă afișează un banner de consimțământ pentru cookie-uri în partea de jos a paginii

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CookieSettings {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: '',
  });

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Small delay to prevent flash on load
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const saveConsent = (consentSettings: CookieSettings) => {
    localStorage.setItem('cookie-consent', JSON.stringify(consentSettings));
    setShowBanner(false);
    
    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { 
      detail: consentSettings 
    }));
  };

  const acceptAll = () => {
    const consentSettings: CookieSettings = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    saveConsent(consentSettings);
  };

  const acceptNecessary = () => {
    const consentSettings: CookieSettings = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    saveConsent(consentSettings);
  };

  const saveCustomSettings = () => {
    const consentSettings: CookieSettings = {
      ...settings,
      timestamp: new Date().toISOString(),
    };
    saveConsent(consentSettings);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-slide-up">
      <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 shadow-2xl">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {/* Main Banner */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg mb-2 flex items-center gap-2">
                🍪 Cookie-Einstellungen
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Wir verwenden Cookies, um Ihnen die beste Erfahrung auf unserer Website zu bieten. 
                Einige Cookies sind für die Funktion der Website erforderlich, während andere uns helfen, 
                die Website zu verbessern.{' '}
                <Link 
                  href="/datenschutz" 
                  className="text-red-400 hover:text-red-300 underline"
                >
                  Mehr erfahren
                </Link>
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:border-gray-500 transition-colors text-sm"
              >
                {showDetails ? 'Weniger anzeigen' : 'Anpassen'}
              </button>
              <button
                onClick={acceptNecessary}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Nur notwendige
              </button>
              <button
                onClick={acceptAll}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Alle akzeptieren
              </button>
            </div>
          </div>

          {/* Detailed Settings */}
          {showDetails && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Necessary Cookies */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Notwendige Cookies</h4>
                    <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">
                      Immer aktiv
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Diese Cookies sind für die grundlegende Funktionalität der Website erforderlich.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Analyse-Cookies</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.analytics}
                        onChange={(e) => setSettings({ ...settings, analytics: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Helfen uns zu verstehen, wie Besucher die Website nutzen.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Marketing-Cookies</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.marketing}
                        onChange={(e) => setSettings({ ...settings, marketing: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Werden verwendet, um relevante Inhalte anzuzeigen.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={saveCustomSettings}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Einstellungen speichern
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to check cookie consent
export function getCookieConsent(): CookieSettings | null {
  if (typeof window === 'undefined') return null;
  
  const consent = localStorage.getItem('cookie-consent');
  if (!consent) return null;
  
  try {
    return JSON.parse(consent) as CookieSettings;
  } catch {
    return null;
  }
}

// Helper function to check if specific cookie type is allowed
export function isCookieAllowed(type: 'analytics' | 'marketing'): boolean {
  const consent = getCookieConsent();
  if (!consent) return false;
  return consent[type] === true;
}
