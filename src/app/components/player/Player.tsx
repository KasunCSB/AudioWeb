'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
import { getFileInputAcceptAttribute } from '@/utils/audioUtils';
import { UI_CONFIG } from '@/config/constants';

const Player: React.FC<PlayerProps> = ({ isVisible = true, onClose, asPage = false, onPlayingChange, onTrackChange }) => {
  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState<number>(UI_CONFIG.VOLUME.DEFAULT);
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
  
  // Notify parent component when playing state changes
  useEffect(() => {
    if (onPlayingChange) {
      onPlayingChange(isPlaying);
    }
  }, [isPlaying, onPlayingChange]);

  // Notify parent component when track changes
  useEffect(() => {
    if (onTrackChange && playlist.length > 0) {
      const current = playlist[currentTrackIndex] || null;
      const nextIndex = currentTrackIndex < playlist.length - 1 ? currentTrackIndex + 1 : (repeatMode === 1 ? 0 : -1);
      const next = nextIndex >= 0 ? playlist[nextIndex] : null;
      onTrackChange(current, next);
    }
  }, [currentTrackIndex, playlist, repeatMode, onTrackChange]);

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

  // Listen for custom events from navbar controls
  useEffect(() => {
    const handlePlayPauseEvent = () => {
      handlePlayPause();
    };

    const handleNextEvent = () => {
      handleNext();
    };

    const handlePreviousEvent = () => {
      handlePrevious();
    };

    window.addEventListener('playerPlayPause', handlePlayPauseEvent);
    window.addEventListener('playerNext', handleNextEvent);
    window.addEventListener('playerPrevious', handlePreviousEvent);

    return () => {
      window.removeEventListener('playerPlayPause', handlePlayPauseEvent);
      window.removeEventListener('playerNext', handleNextEvent);
      window.removeEventListener('playerPrevious', handlePreviousEvent);
    };
  }, [handlePlayPause, handleNext, handlePrevious]);

  // Event handlers
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  const containerClass = asPage 
    ? "min-h-screen bg-black overflow-hidden" 
    : "fixed left-0 right-0 bottom-0 bg-black overflow-hidden z-40" + " top-[calc(4.5rem-1px)]"; // Start 1px higher to cover navbar border

  // Always render audio element to keep playback alive, but hide UI when not visible
  return (
    <>
      {/* Audio element always rendered to maintain playback */}
      <audio ref={audioRef} />
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={getFileInputAcceptAttribute()}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Player UI - only shown when visible */}
      {isVisible && (
    <div className={containerClass}>
      <main 
        className="w-full relative flex flex-col items-center justify-start pt-4 sm:pt-6 pb-4 sm:pb-6 overflow-y-auto custom-scrollbar-auto"
        style={{
          background: 'rgba(20, 20, 28, 0.92)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='white' fill-opacity='0'/%3E%3Ccircle cx='20' cy='20' r='1' fill='white' fill-opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundBlendMode: 'overlay',
          height: 'calc(100vh - 4.5rem)', // Full height minus navbar
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
          <div className="w-72 lg:w-80 xl:w-96 flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar-auto">
            <div 
              className="rounded-[20px] lg:rounded-[24px] p-4 lg:p-6 flex-shrink-0"
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
          </div>

          {/* Right Section - Lyrics Area (Expanded to full height) */}
          {playlist.length > 0 && (
            <div className="flex-1 flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-120px)]">
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
            </div>
          )}
        </div>

        {/* Mobile and Small Tablet Layout */}
        <div className="md:hidden w-full h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar-auto">
          <div className="px-3 sm:px-4 pt-2 pb-6 space-y-3 sm:space-y-4">
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
                  className="w-full rounded-2xl p-4 sm:p-5 flex-1 overflow-hidden"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <LyricsDisplay
                    currentTrack={currentTrack}
                    currentTime={currentTime}
                  />
                </div>
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
      )}
    </>
  );
};

export default Player;
