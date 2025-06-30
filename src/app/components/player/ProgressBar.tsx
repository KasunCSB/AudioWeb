import React from 'react';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onProgressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  onProgressChange
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="relative">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={onProgressChange}
          className="w-full h-2 sm:h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider mobile-no-select touch-target"
          style={{
            background: `linear-gradient(to right, #ffffff ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) ${duration ? (currentTime / duration) * 100 : 0}%)`,
            minHeight: '44px'
          }}
        />
      </div>
      <div className="flex justify-between text-xs sm:text-sm text-white/60">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};
