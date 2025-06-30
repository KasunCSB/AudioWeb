import { useEffect } from 'react';

export const useSleepTimer = (
  sleepTimer: number,
  setIsPlaying: (playing: boolean) => void,
  setSleepTimer: (timer: number) => void,
  audioRef: React.RefObject<HTMLAudioElement | null>
) => {
  useEffect(() => {
    if (sleepTimer > 0) {
      const timer = setTimeout(() => {
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setSleepTimer(0);
      }, sleepTimer * 60 * 1000);

      return () => clearTimeout(timer);
    }
  }, [sleepTimer, setIsPlaying, setSleepTimer, audioRef]);

  return {};
};
