import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  onSeek
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [smoothTime, setSmoothTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  // Use dragging time if dragging, otherwise use smooth interpolated time
  const displayTime = isDragging ? dragTime : smoothTime;

  // Smooth time interpolation using requestAnimationFrame
  useEffect(() => {
    if (isDragging) {
      // Don't interpolate while dragging
      return;
    }

    const interpolateTime = () => {
      setSmoothTime(prev => {
        const diff = currentTime - prev;
        
        // If the difference is large (seeking occurred), jump immediately
        if (Math.abs(diff) > 1) {
          lastTimeRef.current = currentTime;
          return currentTime;
        }
        
        // Smooth interpolation for small changes
        const smoothFactor = 0.15;
        const newTime = prev + diff * smoothFactor;
        lastTimeRef.current = newTime;
        return newTime;
      });
      
      animationFrameRef.current = requestAnimationFrame(interpolateTime);
    };

    animationFrameRef.current = requestAnimationFrame(interpolateTime);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentTime, isDragging]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = () => {
    setIsDragging(true);
    setDragTime(currentTime);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onSeek(dragTime);
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    if (isDragging) {
      setDragTime(newTime);
    } else {
      // If not dragging but change happens (e.g., click), seek immediately
      setSmoothTime(newTime);
      onSeek(newTime);
    }
  }, [isDragging, onSeek]);

  // Handle touch events
  const handleTouchStart = () => {
    setIsDragging(true);
    setDragTime(currentTime);
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      onSeek(dragTime);
    }
  };

  // Clean up if dragging is interrupted
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onSeek(dragTime);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        onSeek(dragTime);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, dragTime, onSeek]);

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="relative">
        <input
          ref={inputRef}
          type="range"
          min="0"
          max={duration || 0}
          value={displayTime || 0}
          onChange={handleChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full h-2 sm:h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider mobile-no-select touch-target"
          style={{
            background: `linear-gradient(to right, #ffffff ${duration > 0 ? (displayTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) ${duration > 0 ? (displayTime / duration) * 100 : 0}%)`,
            minHeight: '44px'
          }}
        />
      </div>
      <div className="flex justify-between text-xs sm:text-sm text-white/60">
        <span>{formatTime(displayTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};
