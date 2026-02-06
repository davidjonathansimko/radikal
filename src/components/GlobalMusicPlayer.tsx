// Global Music Player Component
// Plays music continuously across the entire website session

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeDown, FaMusic } from 'react-icons/fa';
import { useLanguage } from '@/hooks/useLanguage';

export default function GlobalMusicPlayer() {
  const { language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.2); // Start at 20% volume for background music
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize audio when component mounts
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      setIsLoaded(true);
      setError(false);
      // Auto-play when loaded (with user interaction detection)
      startAutoPlay();
    };

    const handleError = () => {
      setError(true);
      setIsLoaded(false);
      console.log('Blog song not found - global music player will be hidden');
    };

    const handleEnded = () => {
      // Loop the song seamlessly
      audio.currentTime = 0;
      if (isPlaying) {
        playAudio();
      }
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);
    
    // Set initial volume
    audio.volume = volume;
    audio.loop = true; // Enable looping

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const startAutoPlay = async () => {
    // Try to auto-play, but handle browser restrictions gracefully
    try {
      await playAudio();
    } catch (error) {
      console.log('Auto-play blocked by browser - user can start manually');
      setIsPlaying(false);
    }
  };

  const playAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.log('Playback error - user interaction may be required');
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
      console.error('Playback toggle error:', error);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
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
      />

      {/* Global music player UI - hover to expand */}
      <div className="global-music-player">
        {/* Always visible music icon */}
        <button
          className="minimize-btn"
          title={language === 'de' ? '🎵 Musik Player' : '🎵 Music Player'}
        >
          ♪
        </button>

        {/* Player controls (visible on hover) */}
        <button
          className="play-btn"
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
          <FaVolumeDown style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }} />
          <input
            type="range"
            min="0"
            max="0.8"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            title={language === 'de' ? 'Lautstärke' : 'Volume'}
          />
          <FaVolumeUp style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }} />
        </div>

        {/* Song Info */}
        <div className="song-info">
          <div style={{ fontSize: '10px', opacity: 0.9 }}>
            {language === 'de' ? '🎵 Musik' : '🎵 Music'}
          </div>
          <div style={{ fontSize: '9px', opacity: 0.7 }}>
            {isLoaded ? (
              isPlaying ? 
                (language === 'de' ? 'Läuft' : 'Playing') : 
                (language === 'de' ? 'Pause' : 'Paused')
            ) : (
              language === 'de' ? 'Lädt' : 'Loading'
            )}
          </div>
        </div>
      </div>
    </>
  );
}
