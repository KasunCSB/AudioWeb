interface VolumeControlProps {
  volume: number;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  onVolumeChange
}) => {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.5 13.93A1 1 0 014 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2a1 1 0 01.5-.069l3.883-2.884a1 1 0 011 0z"/>
      </svg>
      <input
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={onVolumeChange}
        className="flex-1 h-2 sm:h-3 bg-white/20 rounded-lg appearance-none cursor-pointer mobile-no-select touch-target"
        style={{
          background: `linear-gradient(to right, #ffffff ${volume}%, rgba(255,255,255,0.2) ${volume}%)`,
          minHeight: '44px'
        }}
      />
      <span className="text-xs sm:text-sm text-white/60 min-w-[2ch] flex-shrink-0">{volume}</span>
    </div>
  );
};
