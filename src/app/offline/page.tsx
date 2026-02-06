// Offline Page for PWA / Offline-Seite für PWA / Pagina Offline pentru PWA
// Displayed when user is offline and page is not cached
// Wird angezeigt, wenn der Benutzer offline ist und die Seite nicht gecached ist
// Afișată când utilizatorul este offline și pagina nu este în cache

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Optionally redirect back after coming online
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center p-8 max-w-md">
        {/* Offline Icon */}
        <div className="text-8xl mb-6 animate-pulse">
          📴
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4">
          Ohne Internetverbindung
        </h1>
        
        <p className="text-gray-400 mb-8 text-lg leading-relaxed">
          Sie sind derzeit offline. Bitte überprüfen Sie Ihre Internetverbindung 
          und versuchen Sie es erneut.
        </p>

        {/* Status indicator */}
        <div className={`inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full ${
          isOnline ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          {isOnline ? 'Verbindung wiederhergestellt!' : 'Keine Verbindung'}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            🔄 Erneut versuchen
          </button>
          
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            🏠 Zur Startseite
          </Link>
        </div>

        {/* Cached content hint */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-gray-500 text-sm">
            💡 <strong>Tipp:</strong> Bereits besuchte Seiten wurden möglicherweise 
            gespeichert und sind auch offline verfügbar.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <Link
              href="/"
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Startseite
            </Link>
            <span className="text-gray-600">•</span>
            <Link
              href="/blogs"
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Blog
            </Link>
            <span className="text-gray-600">•</span>
            <Link
              href="/about"
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Über uns
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
