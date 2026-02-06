// Background animation component with particles and rotating images / Hintergrundanimations-Komponente mit Partikeln und rotierenden Bildern / Componentă animație fundal cu particule și imagini rotative
// This creates the beautiful moving particle effect and cycling background images
// Dies erstellt den schönen bewegenden Partikeleffekt und wechselnde Hintergrundbilder
// Aceasta creează efectul frumos de particule în mișcare și imagini de fundal care se schimbă

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';

// Particle component / Partikel-Komponente / Componentă particulă
interface Particle {
  id: number;
  x: number; // Horizontal position / Horizontale Position / Poziție orizontală
  y: number; // Vertical position / Vertikale Position / Poziție verticală
  size: number; // Particle size / Partikelgröße / Dimensiune particulă
  speed: number; // Movement speed / Bewegungsgeschwindigkeit / Viteză de mișcare
  opacity: number; // Transparency / Transparenz / Transparență
}

export default function BackgroundAnimation() {
  // Get current pathname to detect blog pages / Aktuellen Pfadnamen abrufen, um Blog-Seiten zu erkennen / Obține calea curentă pentru a detecta paginile de blog
  const pathname = usePathname();
  
  // Get theme context / Themenkontext abrufen / Obține contextul temei
  const { theme } = useTheme();
  
  // Check if we're on an individual blog post page / Prüfen, ob wir uns auf einer einzelnen Blog-Post-Seite befinden / Verifică dacă suntem pe o pagină de postare de blog individuală
  // This pattern matches /blogs/[slug] but not /blogs (the blog list page)
  // Dieses Muster passt auf /blogs/[slug], aber nicht auf /blogs (die Blog-Listenseite)
  // Acest model se potrivește cu /blogs/[slug] dar nu cu /blogs (pagina listă bloguri)
  const isOnBlogPost = pathname.startsWith('/blogs/') && pathname !== '/blogs';
  
  // State for background image cycling / Zustand für Hintergrundbildwechsel / Stare pentru ciclarea imaginii de fundal
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // State for particle animation / Zustand für Partikelanimation / Stare pentru animația particulelor
  const [particles, setParticles] = useState<Particle[]>([]);

  // Background images array (1.jpg to 12.jpg) / Array der Hintergrundbilder (1.jpg bis 12.jpg) / Matrice de imagini de fundal (1.jpg până la 12.jpg)
  const backgroundImages = Array.from({ length: 12 }, (_, i) => `/${i + 1}.jpg`);

  // Initialize particles on component mount / Partikel beim Laden der Komponente initialisieren / Inițializează particulele la montarea componentei
  useEffect(() => {
    // Only create particles when NOT on individual blog posts / Nur Partikel erstellen, wenn NICHT auf einzelnen Blog-Posts / Creează particule doar când NU suntem pe postări de blog individuale
    if (!isOnBlogPost) {
      // Create initial particles / Anfangspartikel erstellen / Creează particulele inițiale
      const initialParticles: Particle[] = [];
      for (let i = 0; i < 50; i++) {
        initialParticles.push({
          id: i,
          x: Math.random() * window.innerWidth, // Random horizontal position / Zufällige horizontale Position / Poziție orizontală aleatorie
          y: Math.random() * window.innerHeight, // Random vertical position / Zufällige vertikale Position / Poziție verticală aleatorie
          size: Math.random() * 4 + 2, // Random size between 2-6px / Zufällige Größe zwischen 2-6px / Dimensiune aleatorie între 2-6px
          speed: Math.random() * 2 + 0.5, // Random speed / Zufällige Geschwindigkeit / Viteză aleatorie
          opacity: Math.random() * 0.2 + 0.05, // Random opacity / Zufällige Transparenz (reduced visibility) / Opacitate aleatorie (vizibilitate redusă)
        });
      }
      setParticles(initialParticles);
    } else {
      // Clear particles when on blog post / Partikel löschen, wenn auf Blog-Post / Șterge particulele când suntem pe o postare de blog
      setParticles([]);
    }
  }, [isOnBlogPost]); // React to changes in blog post detection / Auf Änderungen in der Blog-Post-Erkennung reagieren

  // Animate particles movement / Partikelbewegung animieren / Animează mișcarea particulelor
  useEffect(() => {
    // Only animate particles when NOT on individual blog posts / Nur Partikel animieren, wenn NICHT auf einzelnen Blog-Posts / Animează particulele doar când NU suntem pe postări de blog individuale
    if (!isOnBlogPost) {
      const animateParticles = () => {
        setParticles(prevParticles =>
          prevParticles.map(particle => ({
            ...particle,
            // Move particle upward and slightly to the right / Partikel nach oben und leicht nach rechts bewegen / Mută particula în sus și ușor spre dreapta
            y: particle.y - particle.speed,
            x: particle.x + Math.sin(particle.y * 0.01) * 0.5,
            // Reset particle position when it goes off screen / Partikelposition zurücksetzen, wenn es den Bildschirm verlässt / Resetează poziția particulei când iese din ecran
            ...(particle.y < -10 && {
              y: window.innerHeight + 10,
              x: Math.random() * window.innerWidth,
            }),
          }))
        );
      };

      // Animate particles every 50ms / Partikel alle 50ms animieren / Animează particulele la fiecare 50ms
      const intervalId = setInterval(animateParticles, 50);
      return () => clearInterval(intervalId);
    }
  }, [isOnBlogPost]); // React to changes in blog post detection / Auf Änderungen in der Blog-Post-Erkennung reagieren

  // Change background image every 4 seconds / Hintergrundbild alle 4 Sekunden wechseln / Schimbă imaginea de fundal la fiecare 4 secunde
  useEffect(() => {
    // Only cycle background images when NOT on individual blog posts / Nur Hintergrundbilder wechseln, wenn NICHT auf einzelnen Blog-Posts / Ciclează imaginile de fundal doar când NU suntem pe postări de blog individuale
    if (!isOnBlogPost) {
      const intervalId = setInterval(() => {
        setCurrentImageIndex(prevIndex => (prevIndex + 1) % backgroundImages.length);
      }, 4000); // 4 seconds / 4 Sekunden / 4 secunde

      return () => clearInterval(intervalId);
    }
  }, [backgroundImages.length, isOnBlogPost]); // React to changes in blog post detection / Auf Änderungen in der Blog-Post-Erkennung reagieren

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Only show background animation when NOT on individual blog post pages / Hintergrundanimation nur anzeigen, wenn NICHT auf einzelnen Blog-Post-Seiten / Afișează animația de fundal doar când NU suntem pe pagini de posturi de blog individuale */}
      {!isOnBlogPost && (
        <>
          {/* Background images with smooth transitions / Hintergrundbilder mit sanften Übergängen / Imagini de fundal cu tranziții line */}
          <div className="absolute inset-0">
            {backgroundImages.map((image, index) => (
              <Image
                key={index}
                src={image}
                alt={`Background ${index + 1}`}
                fill
                className={`object-cover transition-opacity duration-1000 ${
                  index === currentImageIndex ? 'opacity-50' : 'opacity-0'
                }`}
                style={{
                  filter: 'blur(0.5px)', // Reduced blur for clearer images / Reduzierte Unschärfe für klarere Bilder / Estompare redusă pentru imagini mai clare
                }}
                priority={index === 0} // Prioritize first image loading / Laden des ersten Bildes priorisieren / Prioritizează încărcarea primei imagini
              />
            ))}
          </div>

          {/* Gradient overlay for better text readability / Gradient-Overlay für bessere Textlesbarkeit / Suprapunere gradient pentru lizibilitate mai bună a textului */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
          
          {/* Particle animation overlay / Partikelanimations-Overlay / Suprapunere animație particule */}
          <div className="absolute inset-0">
            {particles.map(particle => (
              <div
                key={particle.id}
                className={`absolute rounded-full transition-colors duration-500 ${
                  theme === 'dark' ? 'bg-white' : 'bg-black'
                }`}
                style={{
                  left: `${particle.x}px`,
                  top: `${particle.y}px`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  opacity: particle.opacity,
                  boxShadow: theme === 'dark' 
                    ? '0 0 10px rgba(255, 255, 255, 0.3)' 
                    : '0 0 10px rgba(0, 0, 0, 0.2)', // Soft glow effect / Sanfter Leuchteffekt / Efect de strălucire moale
                }}
              />
            ))}
          </div>

          {/* Additional animated elements for visual appeal / Zusätzliche animierte Elemente für visuelle Attraktivität / Elemente animate suplimentare pentru atractivitate vizuală */}
          
        </>
      )}
      
      {/* When on blog post, show a minimal transparent background / Bei Blog-Posts einen minimalen transparenten Hintergrund anzeigen / Când suntem pe o postare de blog, afișează un fundal transparent minim */}
      {isOnBlogPost && (
        <div className={`absolute inset-0 transition-colors duration-500 ${
          theme === 'dark' ? 'bg-black/20' : 'bg-white/15'
        }`} />
      )}
    </div>
  );
}
