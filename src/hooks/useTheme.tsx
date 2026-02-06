// Theme context and hook for dark/light mode switching / Themenkontext und Hook für Dark/Light-Modus-Umschaltung / Context și hook pentru temă pentru comutare mod întunecat/luminos

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Added 'bw' (black & white / Schwarz-Weiß / alb-negru) theme option
export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Load saved theme from localStorage immediately / Gespeichertes Theme sofort aus localStorage laden / Încărcă tema salvată din localStorage imediat
  useEffect(() => {
    // Get the current theme from the document class if it exists / Das aktuelle Theme aus der Dokumentenklasse abrufen, falls vorhanden / Obține tema curentă din clasa documentului dacă există
    const currentTheme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
    const savedTheme = localStorage.getItem('radikal-theme') as Theme;
    
  if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setTheme(savedTheme);
      // Ensure the document class matches / Sicherstellen, dass die Dokumentenklasse übereinstimmt / Asigură-te că clasa documentului se potrivește
      if (savedTheme !== currentTheme) {
  document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(savedTheme);
      }
    } else {
      setTheme(currentTheme);
    }
    setMounted(true);
  }, []);

  // Save theme to localStorage and update document class / Theme in localStorage speichern und Dokumentenklasse aktualisieren / Salvează tema în localStorage și actualizează clasa documentului
  useEffect(() => {
    if (!mounted) return;
    
    localStorage.setItem('radikal-theme', theme);
    
    // For Tailwind CSS darkMode: 'class' strategy: / Für Tailwind CSS darkMode: 'class' Strategie: / Pentru strategia Tailwind CSS darkMode: 'class':
    // - Dark mode: add 'dark' class to html / - Dark Modus: 'dark' Klasse zu html hinzufügen / - Mod întunecat: adaugă clasa 'dark' la html
    // - Light mode: remove 'dark' class from html (Tailwind uses base styles) / - Light Modus: 'dark' Klasse von html entfernen (Tailwind verwendet Basisstile) / - Mod luminos: elimină clasa 'dark' din html (Tailwind folosește stiluri de bază)
    // We also add 'light' class for custom CSS that needs it / Wir fügen auch 'light' Klasse für benutzerdefiniertes CSS hinzu, das es benötigt / Adăugăm și clasa 'light' pentru CSS personalizat care are nevoie de ea
    document.documentElement.classList.remove('dark', 'light');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      // Light mode - no 'dark' class means Tailwind uses base (light) styles / Light Modus - keine 'dark' Klasse bedeutet Tailwind verwendet Basis (light) Stile / Mod luminos - fără clasa 'dark' înseamnă că Tailwind folosește stiluri de bază (luminos)
      // Add 'light' class for any custom CSS that needs it / 'light' Klasse für benutzerdefiniertes CSS hinzufügen, das es benötigt / Adaugă clasa 'light' pentru orice CSS personalizat care are nevoie de ea
      document.documentElement.classList.add('light');
    }
    
    // Update theme color for mobile browsers / Themenfarbe für mobile Browser aktualisieren / Actualizează culoarea temei pentru browsere mobile
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff');
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
  setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <div suppressHydrationWarning>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
