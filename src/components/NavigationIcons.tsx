// Pictogramele barei de navigare: inima si steagurile limbilor.
// Mutate din Navigation.tsx ca fisierul acela sa fie mai usor de citit.

import React from 'react';

// Custom like/thumbs-up SVG icon for Liked Posts / Benutzerdefiniertes Like-SVG für Gelikte Beiträge / Pictogramă SVG like personalizată pentru Postări Apreciate
export const HeartIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.017 31.992c-9.088 0-9.158-0.377-10.284-1.224-0.597-0.449-1.723-0.76-5.838-1.028-0.298-0.020-0.583-0.134-0.773-0.365-0.087-0.107-2.143-3.105-2.143-7.907 0-4.732 1.472-6.89 1.534-6.99 0.182-0.293 0.503-0.47 0.847-0.47 3.378 0 8.062-4.313 11.21-11.841 0.544-1.302 0.657-2.159 2.657-2.159 1.137 0 2.413 0.815 3.042 1.86 1.291 2.135 0.636 6.721 0.029 9.171 2.063-0.017 5.796-0.045 7.572-0.045 2.471 0 4.107 1.473 4.156 3.627 0.017 0.711-0.077 1.619-0.282 2.089 0.544 0.543 1.245 1.36 1.276 2.414 0.038 1.36-0.852 2.395-1.421 2.989 0.131 0.395 0.391 0.92 0.366 1.547-0.063 1.542-1.253 2.535-1.994 3.054 0.061 0.422 0.11 1.218-0.026 1.834-0.535 2.457-4.137 3.443-9.928 3.443zM3.426 27.712c3.584 0.297 5.5 0.698 6.51 1.459 0.782 0.589 0.662 0.822 9.081 0.822 2.568 0 7.59-0.107 7.976-1.87 0.153-0.705-0.59-1.398-0.593-1.403-0.203-0.501 0.023-1.089 0.518-1.305 0.008-0.004 2.005-0.719 2.050-1.835 0.030-0.713-0.46-1.142-0.471-1.16-0.291-0.452-0.185-1.072 0.257-1.38 0.005-0.004 1.299-0.788 1.267-1.857-0.024-0.849-1.143-1.447-1.177-1.466-0.25-0.143-0.432-0.39-0.489-0.674-0.056-0.282 0.007-0.579 0.183-0.808 0 0 0.509-0.808 0.49-1.566-0.037-1.623-1.782-1.674-2.156-1.674-2.523 0-9.001 0.025-9.001 0.025-0.349 0.002-0.652-0.164-0.84-0.443s-0.201-0.627-0.092-0.944c0.977-2.813 1.523-7.228 0.616-8.736-0.267-0.445-0.328-0.889-1.328-0.889-0.139 0-0.468 0.11-0.812 0.929-3.341 7.995-8.332 12.62-12.421 13.037-0.353 0.804-1.016 2.47-1.016 5.493 0 3.085 0.977 5.473 1.447 6.245z" />
  </svg>
);

// Flag SVG components — detailed with borders / Flaggen-SVG-Komponenten — detailliert mit Rahmen / Componente SVG steaguri — detaliate cu borduri
export const FlagDE = ({ className = "w-5 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 342" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="114" y="0" fill="#000000" rx="8"/>
    <rect width="512" height="114" y="114" fill="#DD0000"/>
    <rect width="512" height="114" y="228" fill="#FFCC00" rx="8"/>
    <rect width="512" height="342" rx="12" fill="none" stroke="#121B21" strokeWidth="12"/>
  </svg>
);

export const FlagGB = ({ className = "w-5 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 342" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="342" rx="12" fill="#012169"/>
    <path d="M0,0 L512,342 M512,0 L0,342" stroke="#FFFFFF" strokeWidth="57"/>
    <path d="M0,0 L512,342 M512,0 L0,342" stroke="#C8102E" strokeWidth="38"/>
    <path d="M256,0 V342 M0,171 H512" stroke="#FFFFFF" strokeWidth="85"/>
    <path d="M256,0 V342 M0,171 H512" stroke="#C8102E" strokeWidth="51"/>
    <rect width="512" height="342" rx="12" fill="none" stroke="#121B21" strokeWidth="12"/>
  </svg>
);

export const FlagRO = ({ className = "w-5 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 342" xmlns="http://www.w3.org/2000/svg">
    <rect width="171" height="342" x="0" fill="#002B7F" rx="8"/>
    <rect width="170" height="342" x="171" fill="#FCD116"/>
    <rect width="171" height="342" x="341" fill="#CE1126" rx="8"/>
    <rect width="512" height="342" rx="12" fill="none" stroke="#121B21" strokeWidth="12"/>
  </svg>
);

export const FlagRU = ({ className = "w-5 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 342" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="114" y="0" fill="#FFFFFF" rx="8"/>
    <rect width="512" height="114" y="114" fill="#0039A6"/>
    <rect width="512" height="114" y="228" fill="#D52B1E" rx="8"/>
    <rect width="512" height="342" rx="12" fill="none" stroke="#121B21" strokeWidth="12"/>
  </svg>
);

// Helper component to render the correct flag / Hilfskomponente zur Anzeige der richtigen Flagge / Componentă ajutătoare pentru a reda steagul corect
export const LanguageFlag = ({ lang, className = "w-5 h-4" }: { lang: string; className?: string }) => {
  switch (lang) {
    case 'de': return <FlagDE className={className} />;
    case 'en': return <FlagGB className={className} />;
    case 'ro': return <FlagRO className={className} />;
    case 'ru': return <FlagRU className={className} />;
    default: return <FlagDE className={className} />;
  }
};
