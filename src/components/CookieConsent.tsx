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
      <div className="border-t border-white/15 bg-black/90 shadow-[0_-12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {/* Main Banner */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="mb-2 flex items-center gap-2.5 font-cinzel text-base font-semibold uppercase tracking-wide text-white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 4 4 0 0 1-4-4 1 1 0 0 0-1-1z" />
                  <circle cx="8.5" cy="11" r="1" fill="currentColor" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                  <circle cx="15.5" cy="13.5" r="0.8" fill="currentColor" />
                </svg>
                Cookie-Einstellungen
              </h3>
              <p className="text-sm leading-relaxed text-white/70">
                Wir verwenden Cookies, um Ihnen die beste Erfahrung auf unserer Website zu bieten. 
                Einige Cookies sind für die Funktion der Website erforderlich, während andere uns helfen, 
                die Website zu verbessern.{' '}
                <Link 
                  href="/datenschutz" 
                  className="text-white underline decoration-white/40 underline-offset-2 hover:decoration-white"
                >
                  Mehr erfahren
                </Link>
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="rounded-lg border border-white/25 px-4 py-2 text-sm text-white/75 transition-colors hover:border-white/50 hover:text-white"
              >
                {showDetails ? 'Weniger anzeigen' : 'Anpassen'}
              </button>
              <button
                onClick={acceptNecessary}
                className="rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                Nur notwendige
              </button>
              <button
                onClick={acceptAll}
                className="rounded-lg bg-white px-6 py-2 text-sm font-semibold text-black transition-colors hover:bg-white/85"
              >
                Alle akzeptieren
              </button>
            </div>
          </div>

          {/* Detailed Settings */}
          {showDetails && (
            <div className="mt-6 pt-6 border-t border-white/15">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Necessary Cookies */}
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Notwendige Cookies</h4>
                    <span className="rounded border border-white/20 px-2 py-1 text-xs text-white/70">
                      Immer aktiv
                    </span>
                  </div>
                  <p className="text-sm text-white/55">
                    Diese Cookies sind für die grundlegende Funktionalität der Website erforderlich.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Analyse-Cookies</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.analytics}
                        onChange={(e) => setSettings({ ...settings, analytics: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                    </label>
                  </div>
                  <p className="text-sm text-white/55">
                    Helfen uns zu verstehen, wie Besucher die Website nutzen.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Marketing-Cookies</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.marketing}
                        onChange={(e) => setSettings({ ...settings, marketing: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                    </label>
                  </div>
                  <p className="text-sm text-white/55">
                    Werden verwendet, um relevante Inhalte anzuzeigen.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={saveCustomSettings}
                  className="rounded-lg bg-white px-6 py-2 text-sm font-semibold text-black transition-colors hover:bg-white/85"
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
