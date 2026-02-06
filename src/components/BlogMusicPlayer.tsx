// Blog Music Player Component
// Auto-playing music player for the blogs page with volume control

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeDown, FaMusic } from 'react-icons/fa';
import { useLanguage } from '@/hooks/useLanguage';

export default function BlogMusicPlayer() {
  const { language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3); // Start at 30% volume
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize audio when component mounts
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      setIsLoaded(true);
      setError(false);
      // Auto-play when loaded
      playAudio();
    };

    const handleError = () => {
      setError(true);
      setIsLoaded(false);
      console.log('Blog song not found - music player will be hidden');
    };

    const handleEnded = () => {
      // Loop the song
      audio.currentTime = 0;
      playAudio();
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);
    
    // Set initial volume
    audio.volume = volume;

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const playAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.log('Auto-play blocked by browser - user interaction required');
      setIsPlaying(false);
    }
  };

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Don't render if there's an error (song not found)
  if (error) {
    return null;
  }

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src="/blogsong.mp3"
        preload="auto"
        loop={false}
      />

      {/* Music player UI */}
      <div className="blog-music-player">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          disabled={!isLoaded}
          title={isPlaying ? 
            (language === 'de' ? 'Pausieren' : 'Pause') : 
            (language === 'de' ? 'Abspielen' : 'Play')
          }
        >
          {!isLoaded ? (
            <FaMusic className="animate-spin" />
          ) : isPlaying ? (
            <FaPause />
          ) : (
            <FaPlay />
          )}
        </button>

        {/* Volume Control */}
        <div className="volume-control">
          <FaVolumeDown style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            title={language === 'de' ? 'Lautstärke' : 'Volume'}
          />
          <FaVolumeUp style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }} />
        </div>

        {/* Song Info */}
        <div className="song-info">
          <div style={{ fontSize: '11px', opacity: 0.8 }}>
            {language === 'de' ? '🎵 Blog Musik' : '🎵 Blog Music'}
          </div>
          <div style={{ fontSize: '10px', opacity: 0.6 }}>
            {isLoaded ? (
              isPlaying ? 
                (language === 'de' ? 'Läuft...' : 'Playing...') : 
                (language === 'de' ? 'Pausiert' : 'Paused')
            ) : (
              language === 'de' ? 'Lädt...' : 'Loading...'
            )}
          </div>
        </div>
      </div>
    </>
  );
}
