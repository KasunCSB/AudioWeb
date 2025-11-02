import { useEffect, useRef } from 'react';

export const useSleepTimer = (
  sleepTimer: number,
  setIsPlaying: (playing: boolean) => void,
  setSleepTimer: (timer: number) => void,
  audioRef: React.RefObject<HTMLAudioElement | null>
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sleepTimerRef = useRef(sleepTimer);

  // Keep sleepTimerRef in sync with sleepTimer
  useEffect(() => {
    sleepTimerRef.current = sleepTimer;
  }, [sleepTimer]);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Only start a new timer if sleepTimer > 0
    if (sleepTimer > 0) {
      timerRef.current = setInterval(() => {
        const currentTimer = sleepTimerRef.current;
        const newTimer = currentTimer - 1;
        
        if (newTimer <= 0) {
          // Timer reached 0, pause playback
          setIsPlaying(false);
          if (audioRef.current) {
            audioRef.current.pause();
          }
          setSleepTimer(0);
          
          // Clear the interval
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        } else {
          setSleepTimer(newTimer);
        }
      }, 1000);
    }

    // Cleanup on unmount or when sleepTimer becomes 0 from outside
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [sleepTimer, setIsPlaying, setSleepTimer, audioRef]);

  return {};
};
