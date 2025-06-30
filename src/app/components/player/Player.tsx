'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Navbar from '../navbar';
import { AudioTrack, PlayerProps, EqualizerSettings } from './types';
import { useAudioManager } from './hooks/useAudioManager';
import { useDragHandler } from './hooks/useDragHandler';
import { useFileHandler } from './hooks/useFileHandler';
import { useSleepTimer } from './hooks/useSleepTimer';
import { useMediaSession } from './hooks/useMediaSession';
import { AlbumArt } from './AlbumArt';
import { ProgressBar } from './ProgressBar';
import { MainControls } from './MainControls';
import { SecondaryControls } from './SecondaryControls';
import { VolumeControl } from './VolumeControl';
import { PlaylistPopup } from './PlaylistPopup';
import { SleepTimerPopup } from './SleepTimerPopup';
import { EqualizerPopup } from './EqualizerPopup';
import { BackButton } from './BackButton';
import { LottieAnimation } from './LottieAnimation';
import { LyricsDisplay } from './LyricsDisplay';
import { PlayerStyles } from './PlayerStyles';

const Player: React.FC<PlayerProps> = ({ isVisible = true, onClose, asPage = false }) => {
  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0);
  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [shuffleQueue, setShuffleQueue] = useState<number[]>([]);
  const [shuffleHistory, setShuffleHistory] = useState<number[]>([]);
  const [shuffleIndex, setShuffleIndex] = useState(0);
  const [sleepTimer, setSleepTimer] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [equalizerSettings, setEqualizerSettings] = useState<EqualizerSettings>({
    bass: 0,
    mid: 0,
    treble: 0,
    lowerMid: 0,
    upperMid: 0,
    presence: 0,
    brilliance: 0,
    preset: 'flat'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentTrack = playlist[currentTrackIndex];

  // Shuffle utility function
  const generateShuffleQueue = useCallback((excludeCurrentIndex?: number) => {
    const indices = Array.from({ length: playlist.length }, (_, i) => i);
    if (excludeCurrentIndex !== undefined) {
      indices.splice(excludeCurrentIndex, 1);
    }
    
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    return indices;
  }, [playlist.length]);

  // Effect to generate shuffle queue when shuffle is enabled or playlist changes
  useEffect(() => {
    if (isShuffled && playlist.length > 1) {
      const newQueue = generateShuffleQueue(currentTrackIndex);
      setShuffleQueue(newQueue);
      setShuffleHistory([currentTrackIndex]);
      setShuffleIndex(0);
    }
  }, [isShuffled, playlist.length, generateShuffleQueue, currentTrackIndex]);

  // Toggle shuffle function
  const handleShuffleToggle = useCallback(() => {
    const newShuffled = !isShuffled;
    setIsShuffled(newShuffled);
    
    if (newShuffled && playlist.length > 1) {
      // Enable shuffle - generate new queue
      const newQueue = generateShuffleQueue(currentTrackIndex);
      setShuffleQueue(newQueue);
      setShuffleHistory([currentTrackIndex]);
      setShuffleIndex(0);
    } else {
      // Disable shuffle - clear queue
      setShuffleQueue([]);
      setShuffleHistory([]);
      setShuffleIndex(0);
    }
  }, [isShuffled, playlist.length, generateShuffleQueue, currentTrackIndex]);

  // Navigation state helpers
  const canGoPrevious = useMemo(() => {
    if (isShuffled) {
      return shuffleHistory.length > 1;
    }
    return currentTrackIndex > 0;
  }, [isShuffled, shuffleHistory.length, currentTrackIndex]);

  const canGoNext = useMemo(() => {
    if (isShuffled) {
      return shuffleIndex < shuffleQueue.length - 1 || repeatMode === 1;
    }
    return currentTrackIndex < playlist.length - 1;
  }, [isShuffled, shuffleIndex, shuffleQueue.length, repeatMode, currentTrackIndex, playlist.length]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (isShuffled && shuffleQueue.length > 0) {
      // Shuffle mode
      if (shuffleIndex < shuffleQueue.length - 1) {
        // Move to next song in shuffle queue
        const nextShuffleIndex = shuffleIndex + 1;
        const nextTrackIndex = shuffleQueue[nextShuffleIndex];
        
        setShuffleIndex(nextShuffleIndex);
        setCurrentTrackIndex(nextTrackIndex);
        setShuffleHistory(prev => [...prev, nextTrackIndex]);
        setPlaylist(prev => prev.map((track, index) => ({
          ...track,
          isActive: index === nextTrackIndex
        })));
        setCurrentTime(0);
      } else if (repeatMode === 1) {
        // Repeat all - generate new shuffle queue
        const newQueue = generateShuffleQueue();
        const nextTrackIndex = newQueue[0];
        
        setShuffleQueue(newQueue);
        setShuffleIndex(0);
        setCurrentTrackIndex(nextTrackIndex);
        setShuffleHistory([nextTrackIndex]);
        setPlaylist(prev => prev.map((track, index) => ({
          ...track,
          isActive: index === nextTrackIndex
        })));
        setCurrentTime(0);
      }
    } else {
      // Normal mode
      if (currentTrackIndex < playlist.length - 1) {
        const nextIndex = currentTrackIndex + 1;
        setCurrentTrackIndex(nextIndex);
        setPlaylist(prev => prev.map((track, index) => ({
          ...track,
          isActive: index === nextIndex
        })));
        setCurrentTime(0);
      }
    }
  }, [currentTrackIndex, playlist.length, isShuffled, shuffleQueue, shuffleIndex, repeatMode, generateShuffleQueue]);

  const handlePrevious = useCallback(() => {
    if (isShuffled && shuffleHistory.length > 1) {
      // Shuffle mode - go back in history
      const newHistory = [...shuffleHistory];
      newHistory.pop(); // Remove current track
      const prevTrackIndex = newHistory[newHistory.length - 1];
      
      setShuffleHistory(newHistory);
      setCurrentTrackIndex(prevTrackIndex);
      
      // Update shuffle index to match the history position
      const shufflePos = shuffleQueue.findIndex(index => index === prevTrackIndex);
      if (shufflePos !== -1) {
        setShuffleIndex(shufflePos);
      }
      
      setPlaylist(prev => prev.map((track, index) => ({
        ...track,
        isActive: index === prevTrackIndex
      })));
      setCurrentTime(0);
    } else {
      // Normal mode
      if (currentTrackIndex > 0) {
        const prevIndex = currentTrackIndex - 1;
        setCurrentTrackIndex(prevIndex);
        setPlaylist(prev => prev.map((track, index) => ({
          ...track,
          isActive: index === prevIndex
        })));
        setCurrentTime(0);
      }
    }
  }, [currentTrackIndex, isShuffled, shuffleHistory, shuffleQueue]);

  const selectTrack = useCallback((index: number) => {
    setCurrentTrackIndex(index);
    setPlaylist(prev => prev.map((track, trackIndex) => ({
      ...track,
      isActive: trackIndex === index
    })));
    setCurrentTime(0);
    setIsPlaying(true);
    
    // Update shuffle state if shuffle is enabled
    if (isShuffled) {
      setShuffleHistory([index]);
      const shufflePos = shuffleQueue.findIndex(queueIndex => queueIndex === index);
      if (shufflePos !== -1) {
        setShuffleIndex(shufflePos);
      } else {
        // Track not in current shuffle queue, generate new one
        const newQueue = generateShuffleQueue(index);
        setShuffleQueue(newQueue);
        setShuffleIndex(0);
      }
    }
  }, [isShuffled, shuffleQueue, generateShuffleQueue]);

  const removeTrack = useCallback((indexToRemove: number) => {
    setPlaylist(prev => {
      const updated = prev.filter((_, index) => index !== indexToRemove);
      
      // Update shuffle queue and history
      if (isShuffled) {
        // Remove the track from shuffle queue and update indices
        const newQueue = shuffleQueue
          .filter(queueIndex => queueIndex !== indexToRemove)
          .map(queueIndex => queueIndex > indexToRemove ? queueIndex - 1 : queueIndex);
        
        const newHistory = shuffleHistory
          .filter(historyIndex => historyIndex !== indexToRemove)
          .map(historyIndex => historyIndex > indexToRemove ? historyIndex - 1 : historyIndex);
        
        setShuffleQueue(newQueue);
        setShuffleHistory(newHistory);
        
        // Update shuffle index
        if (shuffleIndex > 0 && shuffleQueue[shuffleIndex] === indexToRemove) {
          setShuffleIndex(Math.max(0, shuffleIndex - 1));
        }
      }
      
      if (indexToRemove < currentTrackIndex) {
        setCurrentTrackIndex(currentTrackIndex - 1);
      } else if (indexToRemove === currentTrackIndex) {
        setCurrentTrackIndex(0);
        setIsPlaying(false);
        setCurrentTime(0);
        
        // Reset shuffle state if current track is removed
        if (isShuffled && updated.length > 1) {
          const newQueue = generateShuffleQueue(0);
          setShuffleQueue(newQueue);
          setShuffleHistory([0]);
          setShuffleIndex(0);
        }
      }
      
      return updated;
    });
  }, [currentTrackIndex, isShuffled, shuffleQueue, shuffleHistory, shuffleIndex, generateShuffleQueue]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
  }, []);

  // Custom hooks
  const { audioRef, handlePlayPause, handleProgressChange } = useAudioManager(
    playlist,
    currentTrackIndex,
    isPlaying,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    volume,
    repeatMode,
    handleNext,
    equalizerSettings
  );

  const { popupPositions, handleMouseDown } = useDragHandler();

  const { isDragOver, handleFileUpload, handleDragOver, handleDragLeave, handleDrop } = useFileHandler(
    playlist,
    setPlaylist,
    setCurrentTrackIndex
  );

  useSleepTimer(sleepTimer, setIsPlaying, setSleepTimer, audioRef);

  // Media Session API integration for browser controls
  const handleSeekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [audioRef, setCurrentTime]);

  const handlePlay = useCallback(() => {
    if (!isPlaying) {
      handlePlayPause();
    }
  }, [isPlaying, handlePlayPause]);

  const handlePause = useCallback(() => {
    if (isPlaying) {
      handlePlayPause();
    }
  }, [isPlaying, handlePlayPause]);

  useMediaSession({
    currentTrack,
    isPlaying,
    handlePlay,
    handlePause,
    handleNext,
    handlePrevious,
    handleSeekTo,
    duration,
    currentTime
  });

  // Event handlers
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  if (!isVisible) return null;

  const containerClass = asPage ? "min-h-screen bg-black overflow-hidden" : "fixed inset-0 z-50 bg-black overflow-hidden";

  return (
    <div className={containerClass}>
      <Navbar />
      
      <audio ref={audioRef} />
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.lrc"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      <main 
        className="w-full relative flex flex-col items-center justify-start pt-4 sm:pt-6 pb-4 sm:pb-6 overflow-y-auto custom-scrollbar-auto"
        style={{
          background: 'rgba(20, 20, 28, 0.92)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='white' fill-opacity='0'/%3E%3Ccircle cx='20' cy='20' r='1' fill='white' fill-opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundBlendMode: 'overlay',
          height: '100vh',
          marginTop: '4rem', // Account for navbar
        }}
      >
        {/* Back Button */}
        <div className="fixed top-16 sm:top-18 left-2 sm:left-4 md:left-8 z-10">
          <BackButton asPage={asPage} onClose={onClose} />
        </div>

        {/* Lottie Animation */}
        <LottieAnimation show={!currentTrack} />

        {/* Desktop and Tablet Layout */}
        <div className="hidden md:flex w-full max-w-[1400px] gap-4 lg:gap-8 px-4 lg:px-8 pt-2">
          
          {/* Left Section - Player Controls */}
          <div className="w-72 lg:w-80 xl:w-96 flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-120px)] overflow-hidden">
            <div 
              className="rounded-[20px] lg:rounded-[24px] p-4 lg:p-6 mb-3 lg:mb-4 flex-shrink-0"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              <AlbumArt
                currentTrack={currentTrack}
                onUploadClick={() => fileInputRef.current?.click()}
                isDragOver={isDragOver}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />

              {currentTrack && (
                <div className="space-y-4 lg:space-y-6 mt-4 lg:mt-6">
                  <ProgressBar
                    currentTime={currentTime}
                    duration={duration}
                    onProgressChange={handleProgressChange}
                  />

                  <MainControls
                    isPlaying={isPlaying}
                    onPlayPause={handlePlayPause}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    canGoPrevious={canGoPrevious}
                    canGoNext={canGoNext}
                  />

                  <SecondaryControls
                    isShuffled={isShuffled}
                    onShuffleToggle={handleShuffleToggle}
                    repeatMode={repeatMode}
                    onRepeatToggle={() => setRepeatMode((repeatMode + 1) % 3)}
                    onPlaylistToggle={() => setShowPlaylist(!showPlaylist)}
                    onSleepTimerToggle={() => setShowSleepTimer(!showSleepTimer)}
                    onEqualizerToggle={() => setShowEqualizer(!showEqualizer)}
                    onVisualizationToggle={() => setShowVisualization(!showVisualization)}
                    sleepTimer={sleepTimer}
                    showVisualization={showVisualization}
                  />

                  <VolumeControl
                    volume={volume}
                    onVolumeChange={handleVolumeChange}
                  />
                </div>
              )}
            </div>

            {/* Up Next Section */}
            {playlist.length > 0 && (
              <div 
                className="rounded-[16px] lg:rounded-[20px] p-3 lg:p-4 cursor-pointer transition-all duration-200 hover:bg-white/5 flex-1 min-h-0 overflow-y-auto custom-scrollbar-enhanced"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                <h3 className="text-xs lg:text-sm font-semibold text-white/80 mb-2 lg:mb-3 flex items-center justify-between sticky top-0 bg-inherit z-10">
                  <span>Up Next</span>
                  <div className="flex items-center gap-1 lg:gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="p-1 lg:p-1.5 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all duration-200"
                      title="Add More Songs"
                    >
                      <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPlaylist(true);
                      }}
                      className="p-1 lg:p-1.5 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all duration-200"
                      title="View Playlist"
                    >
                      <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </h3>
                <div className="space-y-2">
                  {currentTrackIndex < playlist.length - 1 ? (
                    playlist.slice(currentTrackIndex + 1).map((track, index) => (
                      <div 
                        key={`${track.title}-${currentTrackIndex + 1 + index}`}
                        className="flex items-center gap-2 lg:gap-3 p-1.5 lg:p-2 rounded-xl hover:bg-white/5 transition-all duration-200 cursor-pointer"
                        onClick={() => selectTrack(currentTrackIndex + 1 + index)}
                      >
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg overflow-hidden flex-shrink-0">
                          {track.albumArt ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={track.albumArt} 
                              alt="Album art" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center">
                              <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.5 13.93A1 1 0 014 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2a1 1 0 01.5-.069l3.883-2.884a1 1 0 011 0z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs lg:text-sm font-medium text-white truncate">
                            {track.title}
                          </p>
                          <p className="text-xs text-white/60 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs lg:text-sm text-white/60 text-center py-4">No more tracks</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Section - Lyrics Area */}
          {playlist.length > 0 && (
            <div className="flex-1 flex flex-col gap-4 lg:gap-6 h-[calc(100vh-140px)] lg:h-[calc(100vh-120px)]">
              <div 
                className="rounded-[20px] lg:rounded-[24px] p-4 lg:p-6 flex-1 overflow-y-auto custom-scrollbar-enhanced min-h-0"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                }}
              >
                <LyricsDisplay
                  currentTrack={currentTrack}
                  currentTime={currentTime}
                />
              </div>

              {/* Desktop Up Next Preview */}
              {playlist.length > 1 && (
                <div 
                  className="rounded-[16px] lg:rounded-[20px] p-3 lg:p-4 transition-all duration-200 flex-shrink-0"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <div className="flex items-center justify-between mb-2 lg:mb-3">
                    <h3 className="text-sm lg:text-base font-semibold text-white/80">
                      Up Next {/* Debug: Playlist length: {playlist.length}, Current: {currentTrackIndex} */}
                    </h3>
                    {currentTrackIndex < playlist.length - 1 && (
                      <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                  {currentTrackIndex < playlist.length - 1 ? (
                    <div 
                      className="flex items-center gap-3 lg:gap-4 cursor-pointer hover:bg-white/5 hover:scale-[1.02] rounded-lg p-2 -m-2 transition-all duration-200"
                      onClick={() => selectTrack(currentTrackIndex + 1)}
                    >
                      <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-lg overflow-hidden flex-shrink-0">
                        {playlist[currentTrackIndex + 1].albumArt ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={playlist[currentTrackIndex + 1].albumArt} 
                            alt="Album art" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/10 flex items-center justify-center">
                            <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.5 13.93A1 1 0 014 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2a1 1 0 01.5-.069l3.883-2.884a1 1 0 011 0z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm lg:text-base font-medium text-white truncate">
                          {playlist[currentTrackIndex + 1].title}
                        </p>
                        <p className="text-xs lg:text-sm text-white/60 truncate">
                          {playlist[currentTrackIndex + 1].artist}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-4">
                      <p className="text-sm text-white/60">
                        {repeatMode === 1 ? "Will repeat this playlist" : repeatMode === 2 ? "Will repeat this track" : "End of playlist"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile and Small Tablet Layout */}
        <div className="md:hidden w-full h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar-auto">
          <div className="px-3 sm:px-4 pt-2 pb-safe space-y-3 sm:space-y-4">
            {/* Album Art or Upload Area */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <AlbumArt
                  currentTrack={currentTrack}
                  onUploadClick={() => fileInputRef.current?.click()}
                  isDragOver={isDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                />
              </div>
            </div>

            {currentTrack ? (
              <>
                {/* Progress Bar */}
                <div 
                  className="w-full rounded-2xl p-3 sm:p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <ProgressBar
                    currentTime={currentTime}
                    duration={duration}
                    onProgressChange={handleProgressChange}
                  />
                </div>

                {/* Main Controls */}
                <div 
                  className="w-full rounded-2xl p-4 sm:p-5"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <MainControls
                    isPlaying={isPlaying}
                    onPlayPause={handlePlayPause}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    canGoPrevious={canGoPrevious}
                    canGoNext={canGoNext}
                  />
                </div>

                {/* Secondary Controls and Volume */}
                <div 
                  className="w-full rounded-2xl p-3 sm:p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <div className="space-y-3 sm:space-y-4">
                    <SecondaryControls
                      isShuffled={isShuffled}
                      onShuffleToggle={handleShuffleToggle}
                      repeatMode={repeatMode}
                      onRepeatToggle={() => setRepeatMode((repeatMode + 1) % 3)}
                      onPlaylistToggle={() => setShowPlaylist(!showPlaylist)}
                      onSleepTimerToggle={() => setShowSleepTimer(!showSleepTimer)}
                      onEqualizerToggle={() => setShowEqualizer(!showEqualizer)}
                      onVisualizationToggle={() => setShowVisualization(!showVisualization)}
                      sleepTimer={sleepTimer}
                      showVisualization={showVisualization}
                    />

                    <VolumeControl
                      volume={volume}
                      onVolumeChange={handleVolumeChange}
                    />
                  </div>
                </div>

                {/* Lyrics Display */}
                <div 
                  className="w-full rounded-2xl p-4 sm:p-5 min-h-[150px] max-h-[300px] sm:max-h-[400px] overflow-y-auto"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <LyricsDisplay
                    currentTrack={currentTrack}
                    currentTime={currentTime}
                  />
                </div>

                {/* Mobile Up Next Preview */}
                {playlist.length > 1 && (
                  <div 
                    className="w-full rounded-2xl p-3 sm:p-4 transition-all duration-200"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs sm:text-sm font-semibold text-white/80">Up Next</h3>
                      {currentTrackIndex < playlist.length - 1 && (
                        <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                    {currentTrackIndex < playlist.length - 1 ? (
                      <div 
                        className="flex items-center gap-3 cursor-pointer active:scale-95 transition-all duration-200 hover:bg-white/5 rounded-lg p-2 -m-2"
                        onClick={() => selectTrack(currentTrackIndex + 1)}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0">
                          {playlist[currentTrackIndex + 1].albumArt ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={playlist[currentTrackIndex + 1].albumArt} 
                              alt="Album art" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.5 13.93A1 1 0 014 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2a1 1 0 01.5-.069l3.883-2.884a1 1 0 011 0z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-white truncate">
                            {playlist[currentTrackIndex + 1].title}
                          </p>
                          <p className="text-xs sm:text-sm text-white/60 truncate">
                            {playlist[currentTrackIndex + 1].artist}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-3">
                        <p className="text-xs sm:text-sm text-white/60">
                          {repeatMode === 1 ? "Will repeat this playlist" : repeatMode === 2 ? "Will repeat this track" : "End of playlist"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </main>

      {/* Popups - Fixed positioning for mobile */}
      <PlaylistPopup
        show={showPlaylist}
        playlist={playlist}
        position={popupPositions.playlist}
        onClose={() => setShowPlaylist(false)}
        onMouseDown={(e) => handleMouseDown('playlist', e)}
        onSelectTrack={selectTrack}
        onRemoveTrack={removeTrack}
        isPlaying={isPlaying}
      />

      <SleepTimerPopup
        show={showSleepTimer}
        position={popupPositions.sleepTimer}
        sleepTimer={sleepTimer}
        onClose={() => setShowSleepTimer(false)}
        onMouseDown={(e) => handleMouseDown('sleepTimer', e)}
        onSetTimer={setSleepTimer}
        onCancelTimer={() => setSleepTimer(0)}
      />

      <EqualizerPopup
        show={showEqualizer}
        position={popupPositions.equalizer}
        settings={equalizerSettings}
        onClose={() => setShowEqualizer(false)}
        onMouseDown={(e) => handleMouseDown('equalizer', e)}
        onUpdateSettings={setEqualizerSettings}
      />

      <PlayerStyles />
    </div>
  );
};

export default Player;
