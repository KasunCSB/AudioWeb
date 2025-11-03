import { useCallback, useEffect, useRef } from 'react';
import { AudioTrack, EqualizerSettings } from '../types';
import { createLogger } from '@/utils/logger';
import { getAudioErrorMessage } from '@/utils/audioUtils';
import { EQUALIZER_BANDS } from '@/config/constants';

const logger = createLogger('AudioManager');

// Simple Web Audio API chain storage
interface AudioChain {
  context: AudioContext;
  source: MediaElementAudioSourceNode;
  preGain: GainNode;                   // Input level control
  filters: BiquadFilterNode[];
  bassToneFilter: BiquadFilterNode;    // Advanced bass enhancement
  trebleToneFilter: BiquadFilterNode;  // Advanced treble enhancement
  compressor: DynamicsCompressorNode;  // Prevents distortion
  gainNode: GainNode;
  connected: boolean;
}

const audioChainStorage = new WeakMap<HTMLAudioElement, AudioChain>();

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
  const audioChainRef = useRef<AudioChain | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFadingRef = useRef<boolean>(false);

  // Fade in audio
  const fadeIn = useCallback((duration: number = 800) => {
    const audio = audioRef.current;
    const chain = audioChainRef.current;
    
    if (!audio) return;

    const targetVolume = volume / 100;

    if (chain?.gainNode && chain.connected) {
      try {
        isFadingRef.current = true;
        const now = chain.context.currentTime;
        chain.gainNode.gain.cancelScheduledValues(now);
        chain.gainNode.gain.setValueAtTime(0, now);
        chain.gainNode.gain.linearRampToValueAtTime(targetVolume, now + duration / 1000);
        
        if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = setTimeout(() => {
          isFadingRef.current = false;
        }, duration);
        return;
      } catch (error) {
        logger.error('Fade in failed:', error);
      }
    }
    
    audio.volume = targetVolume;
  }, [volume]);

  // Fade out audio
  const fadeOut = useCallback((duration: number = 800): Promise<void> => {
    return new Promise((resolve) => {
      const audio = audioRef.current;
      const chain = audioChainRef.current;
      
      if (!audio) {
        resolve();
        return;
      }

      if (chain?.gainNode && chain.connected) {
        try {
          isFadingRef.current = true;
          const now = chain.context.currentTime;
          const currentVolume = chain.gainNode.gain.value;
          chain.gainNode.gain.cancelScheduledValues(now);
          chain.gainNode.gain.setValueAtTime(currentVolume, now);
          chain.gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000);
          
          if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
          fadeTimeoutRef.current = setTimeout(() => {
            isFadingRef.current = false;
            resolve();
          }, duration);
          return;
        } catch (error) {
          logger.error('Fade out failed:', error);
        }
      }
      
      audio.volume = 0;
      resolve();
    });
  }, []);

  // Initialize Web Audio API chain once
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Check if already initialized
    const existingChain = audioChainStorage.get(audio);
    if (existingChain && existingChain.connected) {
      logger.debug('Audio chain already initialized');
      audioChainRef.current = existingChain;
      return;
    }

    // Initialize on first user interaction
    const initAudioChain = () => {
      try {
        logger.start('Initializing professional Web Audio API chain');

        // Create AudioContext
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        
        // Create MediaElementSource (can only be done once per element)
        const source = audioContext.createMediaElementSource(audio);
        
        // Pre-gain to prevent overload (reduces input by 20% to give headroom for EQ boosts)
        const preGain = audioContext.createGain();
        preGain.gain.value = 0.8; // Reduce input to prevent distortion from heavy EQ
        
        // Create 10-band EQ with BiquadFilters (musical Q values for smooth sound)
        const filters: BiquadFilterNode[] = [];
        EQUALIZER_BANDS.forEach((band, index) => {
          const filter = audioContext.createBiquadFilter();
          filter.type = index === 0 ? 'lowshelf' : index === EQUALIZER_BANDS.length - 1 ? 'highshelf' : 'peaking';
          filter.frequency.value = band.frequency;
          // Musical Q values: lower = smoother, less resonance/noise
          filter.Q.value = index === 0 || index === EQUALIZER_BANDS.length - 1 ? 0.7 : 1.0;
          filter.gain.value = 0;
          filters.push(filter);
        });

        // Advanced Bass Tone control (low shelf at 100Hz, wide Q for smooth boost)
        const bassToneFilter = audioContext.createBiquadFilter();
        bassToneFilter.type = 'lowshelf';
        bassToneFilter.frequency.value = 100; // Lower than 32Hz band for deep enhancement
        bassToneFilter.Q.value = 0.5; // Smooth, wide curve
        bassToneFilter.gain.value = 0;

        // Advanced Treble Tone control (high shelf at 8kHz, wide Q for air)
        const trebleToneFilter = audioContext.createBiquadFilter();
        trebleToneFilter.type = 'highshelf';
        trebleToneFilter.frequency.value = 8000; // Covers brilliance and air
        trebleToneFilter.Q.value = 0.5; // Smooth, wide curve
        trebleToneFilter.gain.value = 0;

        // Optimized Limiter - prevents distortion without pumping
        // Sweet spot between gentle and protective
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.value = -10;  // Catch peaks early
        compressor.knee.value = 20;        // Smooth but effective
        compressor.ratio.value = 6;        // Strong enough to prevent clipping (was 3, too weak)
        compressor.attack.value = 0.005;   // Fast enough to catch peaks (5ms)
        compressor.release.value = 0.1;    // Quick recovery (100ms)

        // Create gain node for volume
        const gainNode = audioContext.createGain();
        gainNode.gain.value = volume / 100;

        // Connect professional audio chain: source → pre-gain → tone controls → EQ → compressor → gain → destination
        source.connect(preGain);
        preGain.connect(bassToneFilter);
        bassToneFilter.connect(trebleToneFilter);
        
        let currentNode: AudioNode = trebleToneFilter;
        filters.forEach(filter => {
          currentNode.connect(filter);
          currentNode = filter;
        });
        
        currentNode.connect(compressor);
        compressor.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Store chain
        const chain: AudioChain = {
          context: audioContext,
          source,
          preGain,
          filters,
          bassToneFilter,
          trebleToneFilter,
          compressor,
          gainNode,
          connected: true,
        };

        audioChainRef.current = chain;
        audioChainStorage.set(audio, chain);

        logger.info('✓ Professional Web Audio API chain initialized successfully');
        logger.debug(`Chain: ${filters.length} EQ bands + Bass/Treble Tone + Limiter`);
        logger.debug(`Frequencies: ${EQUALIZER_BANDS.map(b => b.frequency + 'Hz').join(', ')}`);
        
      } catch (error: unknown) {
        const err = error as Error;
        if (err.message && err.message.includes('already connected')) {
          logger.debug('Audio source already connected (expected)');
        } else {
          logger.error('Failed to initialize audio chain:', error);
          logger.warn('Falling back to basic HTML5 audio');
        }
      }
    };

    // Try immediate init
    audio.addEventListener('play', initAudioChain, { once: true });

    return () => {
      audio.removeEventListener('play', initAudioChain);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [volume]);

  // Update equalizer settings
  useEffect(() => {
    const chain = audioChainRef.current;
    if (!chain || !chain.connected || chain.filters.length === 0) {
      return;
    }

    try {
      const gains = [
        equalizerSettings.band32,
        equalizerSettings.band64,
        equalizerSettings.band125,
        equalizerSettings.band250,
        equalizerSettings.band500,
        equalizerSettings.band1k,
        equalizerSettings.band2k,
        equalizerSettings.band4k,
        equalizerSettings.band8k,
        equalizerSettings.band16k,
      ];

      const now = chain.context.currentTime;
      
      // Update 10-band EQ
      gains.forEach((gain, index) => {
        if (chain.filters[index]) {
          const targetGain = equalizerSettings.enabled ? gain : 0;
          chain.filters[index].gain.cancelScheduledValues(now);
          chain.filters[index].gain.setValueAtTime(chain.filters[index].gain.value, now);
          chain.filters[index].gain.linearRampToValueAtTime(targetGain, now + 0.05);
        }
      });

      // Update Advanced Bass Tone control
      const targetBassTone = equalizerSettings.enabled ? equalizerSettings.bassTone : 0;
      chain.bassToneFilter.gain.cancelScheduledValues(now);
      chain.bassToneFilter.gain.setValueAtTime(chain.bassToneFilter.gain.value, now);
      chain.bassToneFilter.gain.linearRampToValueAtTime(targetBassTone, now + 0.05);

      // Update Advanced Treble Tone control
      const targetTrebleTone = equalizerSettings.enabled ? equalizerSettings.trebleTone : 0;
      chain.trebleToneFilter.gain.cancelScheduledValues(now);
      chain.trebleToneFilter.gain.setValueAtTime(chain.trebleToneFilter.gain.value, now);
      chain.trebleToneFilter.gain.linearRampToValueAtTime(targetTrebleTone, now + 0.05);

      logger.debug(`EQ updated: ${equalizerSettings.preset}, Bass: ${equalizerSettings.bassTone}dB, Treble: ${equalizerSettings.trebleTone}dB, enabled: ${equalizerSettings.enabled}`);
    } catch (error) {
      logger.error('Failed to update EQ:', error);
    }
  }, [equalizerSettings]);

  // Auto-load and play when track changes
  useEffect(() => {
    const audio = audioRef.current;
    const currentTrack = playlist[currentTrackIndex];
    if (!audio || !currentTrack) return;

    if (audio.src !== currentTrack.url) {
      logger.debug('Loading track:', currentTrack.title);
      audio.src = currentTrack.url;
      audio.load();
      
      if (isPlaying) {
        const playNewTrack = async () => {
          try {
            // Resume audio context if suspended
            const chain = audioChainRef.current;
            if (chain?.context && chain.context.state === 'suspended') {
              await chain.context.resume();
            }
            
            await audio.play();
            fadeIn(800);
            logger.info('✓ Auto-play started');
          } catch (error) {
            logger.error('Auto-play failed:', error);
            setIsPlaying(false);
          }
        };
        playNewTrack();
      }
    }
  }, [playlist, currentTrackIndex, isPlaying, setIsPlaying, fadeIn]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      logger.debug(`Audio loaded: ${audio.duration.toFixed(2)}s`);
    };
    
    const handleEnded = () => {
      logger.debug('Track ended');
      if (repeatMode === 2) {
        audio.currentTime = 0;
        audio.play().catch(err => logger.error('Repeat play failed:', err));
      } else {
        handleNext();
      }
    };
    
    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      const errorMessage = getAudioErrorMessage(target.error);
      logger.error('Playback error:', errorMessage);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [repeatMode, handleNext, setCurrentTime, setDuration, setIsPlaying]);

  // Update volume
  useEffect(() => {
    const audio = audioRef.current;
    const chain = audioChainRef.current;
    
    if (!audio) return;

    const targetVolume = volume / 100;

    if (chain?.gainNode && chain.connected && !isFadingRef.current) {
      try {
        const now = chain.context.currentTime;
        chain.gainNode.gain.cancelScheduledValues(now);
        chain.gainNode.gain.setValueAtTime(chain.gainNode.gain.value, now);
        chain.gainNode.gain.linearRampToValueAtTime(targetVolume, now + 0.1);
      } catch {
        audio.volume = targetVolume;
      }
    } else if (!isFadingRef.current) {
      audio.volume = targetVolume;
    }
  }, [volume]);

  // Play/Pause handler
  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    const currentTrack = playlist[currentTrackIndex];
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      fadeOut(800).then(() => {
        audio.pause();
        setIsPlaying(false);
        logger.debug('Paused');
      });
    } else {
      const startPlayback = async () => {
        try {
          // Resume audio context if needed
          const chain = audioChainRef.current;
          if (chain?.context && chain.context.state === 'suspended') {
            await chain.context.resume();
            logger.debug('Audio context resumed');
          }

          // Load if needed
          if (audio.src !== currentTrack.url) {
            logger.debug('Loading:', currentTrack.title);
            audio.src = currentTrack.url;
            audio.load();
          }
          
          await audio.play();
          setIsPlaying(true);
          fadeIn(800);
          logger.info('✓ Playing');
          
        } catch (error: unknown) {
          const err = error as Error;
          logger.error('Play failed:', err.message);
          setIsPlaying(false);
        }
      };

      startPlayback();
    }
  }, [isPlaying, playlist, currentTrackIndex, setIsPlaying, fadeIn, fadeOut]);

  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = Number(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [setCurrentTime]);

  const handleSeek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = time;
    setCurrentTime(time);
  }, [setCurrentTime]);

  const getAnalyser = useCallback(() => {
    // Could add analyzer node here in future
    return null;
  }, []);

  return {
    audioRef,
    handlePlayPause,
    handleProgressChange,
    handleSeek,
    getAnalyser,
  };
};
