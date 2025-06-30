import { useCallback, useEffect, useRef } from 'react';
import { AudioTrack, EqualizerSettings } from '../types';

export const useAudioManager = (
  playlist: AudioTrack[],
  currentTrackIndex: number,
  isPlaying: boolean,
  setIsPlaying: (playing: boolean) => void,
  setCurrentTime: (time: number) => void,
  setDuration: (duration: number) => void,
  volume: number,
  repeatMode: number,
  handleNext: () => void,
  equalizerSettings: EqualizerSettings
) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);

  // Initialize audio context and equalizer
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audio);
      const gainNode = audioContext.createGain();

      // Create filter nodes for each frequency band
      const frequencies = [60, 170, 350, 1000, 3500, 10000, 14000]; // Hz
      const filters = frequencies.map((freq, index) => {
        const filter = audioContext.createBiquadFilter();
        filter.type = index === 0 ? 'lowshelf' : index === frequencies.length - 1 ? 'highshelf' : 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });

      // Connect audio graph
      source.connect(filters[0]);
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      filters[filters.length - 1].connect(gainNode);
      gainNode.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      gainNodeRef.current = gainNode;
      filtersRef.current = filters;

      return () => {
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
      };
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }, []);

  // Update equalizer when settings change
  useEffect(() => {
    const filters = filtersRef.current;
    if (filters.length === 0) return;

    const { bass, lowerMid, mid, upperMid, treble, presence, brilliance } = equalizerSettings;
    const gains = [bass, lowerMid, mid, upperMid, treble, presence, brilliance];

    // Apply preset values
    if (equalizerSettings.preset !== 'flat') {
      const presets = {
        rock: [5, 3, -1, 2, 4, 3, 2],
        pop: [2, 1, 0, 2, 3, 2, 1],
        jazz: [3, 2, 1, 2, 1, 2, 3],
        classical: [3, 2, 1, 0, 2, 3, 4],
        electronic: [4, 2, 0, 3, 4, 3, 2],
        vocal: [1, 3, 4, 3, 1, 2, 1],
        bass_boost: [8, 5, 2, 0, 0, 0, 0],
        treble_boost: [0, 0, 0, 2, 4, 6, 8]
      };

      const presetGains = presets[equalizerSettings.preset as keyof typeof presets] || gains;
      presetGains.forEach((gain, index) => {
        if (filters[index]) {
          filters[index].gain.setValueAtTime(gain, audioContextRef.current?.currentTime || 0);
        }
      });
    } else {
      gains.forEach((gain, index) => {
        if (filters[index]) {
          filters[index].gain.setValueAtTime(gain, audioContextRef.current?.currentTime || 0);
        }
      });
    }
  }, [equalizerSettings]);

  // Auto-load and play when track changes
  useEffect(() => {
    const audio = audioRef.current;
    const currentTrack = playlist[currentTrackIndex];
    if (!audio || !currentTrack) return;

    // Load the new track
    if (audio.src !== currentTrack.url) {
      audio.src = currentTrack.url;
      audio.load();
      
      // Auto-play if playing state is true
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    }
  }, [playlist, currentTrackIndex, isPlaying]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (repeatMode === 2) {
        // Repeat one
        audio.currentTime = 0;
        audio.play();
      } else if (repeatMode === 1 && currentTrackIndex < playlist.length - 1) {
        // Repeat all - go to next track
        handleNext();
      } else if (currentTrackIndex < playlist.length - 1) {
        // Normal - go to next track
        handleNext();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode, currentTrackIndex, playlist.length, handleNext, setCurrentTime, setDuration, setIsPlaying]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    const currentTrack = playlist[currentTrackIndex];
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.pause();
    } else {
      // Ensure the correct audio source is loaded
      if (audio.src !== currentTrack.url) {
        audio.src = currentTrack.url;
        audio.load();
      }
      audio.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, playlist, currentTrackIndex, setIsPlaying]);

  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = Number(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [setCurrentTime]);

  return {
    audioRef,
    handlePlayPause,
    handleProgressChange
  };
};
