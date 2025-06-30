interface SecondaryControlsProps {
  isShuffled: boolean;
  onShuffleToggle: () => void;
  repeatMode: number;
  onRepeatToggle: () => void;
  onPlaylistToggle: () => void;
  onSleepTimerToggle: () => void;
  onEqualizerToggle: () => void;
  onVisualizationToggle: () => void;
  sleepTimer: number;
  showVisualization: boolean;
}

export const SecondaryControls: React.FC<SecondaryControlsProps> = ({
  isShuffled,
  onShuffleToggle,
  repeatMode,
  onRepeatToggle,
  onPlaylistToggle,
  onSleepTimerToggle,
  onEqualizerToggle,
  onVisualizationToggle,
  sleepTimer,
  showVisualization
}) => {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
      {/* Shuffle */}
      <button
        onClick={onShuffleToggle}
        className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 mobile-no-select touch-target flex items-center justify-center ${
          isShuffled ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
        }`}
        style={{ backdropFilter: 'blur(8px)' }}
        title="Shuffle"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 20L16 8M4 4L16 16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M14 6L18 2L22 6L18 10z"/>
          <path d="M14 18L18 14L22 18L18 22z"/>
        </svg>
      </button>

      {/* Repeat */}
      <button
        onClick={onRepeatToggle}
        className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 relative mobile-no-select touch-target flex items-center justify-center ${
          repeatMode > 0 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
        }`}
        style={{ backdropFilter: 'blur(8px)' }}
        title="Repeat"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/>
        </svg>
        {repeatMode === 2 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-white text-black text-[10px] sm:text-xs flex items-center justify-center rounded-full font-bold">
            1
          </span>
        )}
      </button>

      {/* Playlist */}
      <button
        onClick={onPlaylistToggle}
        className="p-2 sm:p-2.5 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 mobile-no-select touch-target flex items-center justify-center"
        style={{ backdropFilter: 'blur(8px)' }}
        title="Playlist"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sleep Timer */}
      <button
        onClick={onSleepTimerToggle}
        className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 mobile-no-select touch-target flex items-center justify-center ${
          sleepTimer > 0 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
        }`}
        style={{ backdropFilter: 'blur(8px)' }}
        title="Sleep Timer"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
        </svg>
      </button>

      {/* Equalizer */}
      <button
        onClick={onEqualizerToggle}
        className="p-2 sm:p-2.5 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 mobile-no-select touch-target flex items-center justify-center"
        style={{ backdropFilter: 'blur(8px)' }}
        title="Equalizer"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4v7m0 0v9m0-9h12m-12 0V4m12 7v9m0-9V4m-6 0v16" />
        </svg>
      </button>

      {/* Visualization */}
      <button
        onClick={onVisualizationToggle}
        className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 mobile-no-select touch-target flex items-center justify-center ${
          showVisualization ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
        }`}
        style={{ backdropFilter: 'blur(8px)' }}
        title="Visualization"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18m6-18v18M3 12h18" />
        </svg>
      </button>
    </div>
  );
};
