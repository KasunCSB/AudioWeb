'use client';

import React, { useState, useEffect } from 'react';

interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  duration: number;
}

interface NowPlayingBarProps {
  currentTrack: AudioTrack;
  nextTrack?: AudioTrack | null;
  isPlaying: boolean;
  isPlayerVisible?: boolean; // New prop to control visibility of controls
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onOpenPlayer?: () => void;
}

export const NowPlayingBar: React.FC<NowPlayingBarProps> = ({
  currentTrack,
  nextTrack,
  isPlaying,
  isPlayerVisible = false,
  onPlayPause,
  onNext,
  onPrevious,
  onOpenPlayer,
}) => {
  const [showUpNext, setShowUpNext] = useState(false);

  // Reset to "Now Playing" when track changes (unless in Player UI where we show "Up Next" first)
  useEffect(() => {
    setShowUpNext(isPlayerVisible ? true : false);
  }, [currentTrack.id, isPlayerVisible]);

  // Toggle between views with different timing based on context
  // Home page: "Now Playing" 20s → "Up Next" 10s
  // Player UI: "Up Next" 20s → "Now Playing" 10s
  useEffect(() => {
    // Only toggle if there's actually a next track and we're playing
    if (!nextTrack || !isPlaying) {
      setShowUpNext(false);
      return;
    }

    let timeout: NodeJS.Timeout;
    
    const scheduleNext = () => {
      // In Player UI: start with Up Next (20s), then Now Playing (10s)
      // On Home: start with Now Playing (20s), then Up Next (10s)
      const delay = showUpNext 
        ? (isPlayerVisible ? 20000 : 10000) // If showing Up Next: 20s in Player, 10s on Home
        : (isPlayerVisible ? 10000 : 20000); // If showing Now Playing: 10s in Player, 20s on Home
      
      timeout = setTimeout(() => {
        setShowUpNext(prev => !prev);
      }, delay);
    };

    scheduleNext();

    return () => clearTimeout(timeout);
  }, [nextTrack, showUpNext, isPlaying, isPlayerVisible]);

  return (
    <>
      {/* Album Art - Clickable to open player, changes with text (fade transition) */}
      <button
        onClick={onOpenPlayer}
        className="w-8 h-8 md:w-9 md:h-9 rounded-md md:rounded-lg overflow-hidden flex-shrink-0 shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer relative"
        title="Open Player"
      >
        {/* Current Track Album Art */}
        <div 
          className={`absolute inset-0 transition-opacity duration-500 ${
            showUpNext && nextTrack && isPlaying ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {currentTrack.albumArt ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={currentTrack.albumArt} 
              alt="Album art" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 md:w-4 md:h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
          )}
        </div>

        {/* Next Track Album Art (fades in when showing "Up Next") */}
        {nextTrack && (
          <div 
            className={`absolute inset-0 transition-opacity duration-500 ${
              showUpNext && isPlaying ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {nextTrack.albumArt ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={nextTrack.albumArt} 
                alt="Next track album art" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 md:w-4 md:h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>
            )}
          </div>
        )}
      </button>

      {/* Track Info with Rolling Animation - Vertical on mobile, horizontal on desktop */}
      <div className="flex-1 min-w-0 overflow-hidden relative h-16 md:h-9">
        {/* Mobile: Vertical layout with rolling text */}
        <div className="md:hidden">
          {/* Now Playing / Paused */}
          <div 
            className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-in-out ${
              showUpNext && nextTrack && isPlaying ? 'roll-text-exit' : 'roll-text-enter'
            }`}
            style={{
              transform: showUpNext && nextTrack && isPlaying ? 'translateY(-100%)' : 'translateY(0)',
              opacity: showUpNext && nextTrack && isPlaying ? 0 : 1,
            }}
          >
            <div className="flex items-center gap-1">
              <span className={`w-1 h-1 rounded-full flex-shrink-0 ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
              <span className="text-[10px] text-white/60 font-medium">{isPlaying ? 'Now Playing' : 'Paused'}</span>
            </div>
            <p className="text-xs font-semibold text-white truncate">
              {currentTrack.title}
            </p>
            <p className="text-[10px] text-white/60 truncate">
              {currentTrack.artist}
            </p>
          </div>

          {/* Up Next (only shows when there's actually a next track) */}
          {nextTrack && (
            <div 
              className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-in-out ${
                showUpNext && isPlaying ? 'roll-text-enter' : 'roll-text-exit'
              }`}
              style={{
                transform: showUpNext && isPlaying ? 'translateY(0)' : 'translateY(100%)',
                opacity: showUpNext && isPlaying ? 1 : 0,
              }}
            >
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full flex-shrink-0 bg-blue-500"></span>
                <span className="text-[10px] text-white/60 font-medium">Up Next</span>
              </div>
              <p className="text-xs font-semibold text-white truncate">
                {nextTrack.title}
              </p>
              <p className="text-[10px] text-white/60 truncate">
                {nextTrack.artist}
              </p>
            </div>
          )}
        </div>

        {/* Desktop: Horizontal single-line layout with rolling text */}
        <div className="hidden md:block">
          {/* Now Playing / Paused */}
          <div 
            className={`absolute inset-0 flex items-center transition-all duration-700 ease-in-out ${
              showUpNext && nextTrack && isPlaying ? 'roll-text-exit' : 'roll-text-enter'
            }`}
            style={{
              transform: showUpNext && nextTrack && isPlaying ? 'translateY(-100%)' : 'translateY(0)',
              opacity: showUpNext && nextTrack && isPlaying ? 0 : 1,
            }}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mr-2 ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
            <span className="text-xs text-white/60 font-medium mr-2 flex-shrink-0">{isPlaying ? 'Now Playing:' : 'Paused:'}</span>
            <span className="text-sm font-semibold text-white truncate mr-1">{currentTrack.title}</span>
            <span className="text-xs text-white/60 flex-shrink-0">by</span>
            <span className="text-xs text-white/70 truncate ml-1">{currentTrack.artist}</span>
          </div>

          {/* Up Next (only shows when there's actually a next track) */}
          {nextTrack && (
            <div 
              className={`absolute inset-0 flex items-center transition-all duration-700 ease-in-out ${
                showUpNext && isPlaying ? 'roll-text-enter' : 'roll-text-exit'
              }`}
              style={{
                transform: showUpNext && isPlaying ? 'translateY(0)' : 'translateY(100%)',
                opacity: showUpNext && isPlaying ? 1 : 0,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mr-2 bg-blue-500"></span>
              <span className="text-xs text-white/60 font-medium mr-2 flex-shrink-0">Up Next:</span>
              <span className="text-sm font-semibold text-white truncate mr-1">{nextTrack.title}</span>
              <span className="text-xs text-white/60 flex-shrink-0">by</span>
              <span className="text-xs text-white/70 truncate ml-1">{nextTrack.artist}</span>
            </div>
          )}
        </div>
      </div>

      {/* Playback Controls - Always visible */}
      <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
        <button
          onClick={onPrevious}
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-md md:rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all duration-200 group"
          title="Previous"
        >
          <svg className="w-3 h-3 md:w-4 md:h-4 text-white/80 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
          </svg>
        </button>

        <button
          onClick={onPlayPause}
          className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-md md:rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 transition-all duration-200 group"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={onNext}
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-md md:rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all duration-200 group"
          title="Next"
        >
          <svg className="w-3 h-3 md:w-4 md:h-4 text-white/80 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z" />
          </svg>
        </button>
      </div>
    </>
  );
};
