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
  highPassFilter: BiquadFilterNode;    // Removes subsonic frequencies to prevent noise
  preGain: GainNode;                   // Input level control (dynamically adjusted)
  filters: BiquadFilterNode[];
  bassToneFilter: BiquadFilterNode;    // Professional bass lowshelf (deep, natural)
  bassPunchFilter: BiquadFilterNode;   // Additional bass punch at fundamental frequency
  trebleToneFilter: BiquadFilterNode;  // Professional treble highshelf (crystal clear)
  trebleSparkleFilter: BiquadFilterNode; // Additional treble sparkle at air frequencies
  compressor: DynamicsCompressorNode;  // Prevents distortion (bass-friendly settings)
  safetyLimiter: DynamicsCompressorNode; // Hard limiter for extreme peaks
  bassCompensationGain: GainNode;      // Dynamic gain compensation for bass consistency
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
        
        // High-pass filter to remove subsonic frequencies (<20Hz) that cause noise/distortion
        // This is critical for preventing issues when bass is boosted
        const highPassFilter = audioContext.createBiquadFilter();
        highPassFilter.type = 'highpass';
        highPassFilter.frequency.value = 25; // Remove frequencies below 25Hz (subsonic)
        highPassFilter.Q.value = 0.707; // Butterworth-like response
        highPassFilter.gain.value = 0; // No gain adjustment
        
        // Pre-gain to prevent overload (reduces input to give headroom for EQ boosts)
        // Will be dynamically adjusted based on bass boost amount
        const preGain = audioContext.createGain();
        preGain.gain.value = 0.7; // Start with 30% reduction (more conservative than before)
        
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

        // Professional Dual-Stage Bass Enhancement
        // Stage 1: Deep lowshelf for overall bass warmth and depth
        const bassToneFilter = audioContext.createBiquadFilter();
        bassToneFilter.type = 'lowshelf';
        bassToneFilter.frequency.value = 65; // Lower frequency for deeper bass foundation
        bassToneFilter.Q.value = 0.707; // Butterworth response - musical and natural
        bassToneFilter.gain.value = 0;

        // Stage 2: Bass punch filter at fundamental frequency (50-60Hz) for impact
        // This adds punch and maintains consistency - prevents ducking
        const bassPunchFilter = audioContext.createBiquadFilter();
        bassPunchFilter.type = 'peaking';
        bassPunchFilter.frequency.value = 55; // Bass fundamental for punch and impact
        bassPunchFilter.Q.value = 1.2; // Slightly tighter Q for focused punch
        bassPunchFilter.gain.value = 0;

        // Professional Dual-Stage Treble Enhancement
        // Stage 1: Highshelf for overall treble presence and air
        const trebleToneFilter = audioContext.createBiquadFilter();
        trebleToneFilter.type = 'highshelf';
        trebleToneFilter.frequency.value = 11000; // Higher frequency for crystal clear air
        trebleToneFilter.Q.value = 0.707; // Butterworth response - smooth and natural
        trebleToneFilter.gain.value = 0;

        // Stage 2: Treble sparkle filter at air frequencies (14-16kHz) for consistency
        // This adds sparkle and maintains presence throughout the track
        const trebleSparkleFilter = audioContext.createBiquadFilter();
        trebleSparkleFilter.type = 'peaking';
        trebleSparkleFilter.frequency.value = 14000; // Air frequencies for sparkle
        trebleSparkleFilter.Q.value = 1.0; // Balanced Q for natural sparkle
        trebleSparkleFilter.gain.value = 0;

        // Bass compensation gain - maintains consistent bass level to prevent ducking
        const bassCompensationGain = audioContext.createGain();
        bassCompensationGain.gain.value = 1.0; // Will be dynamically adjusted

        // Bass-Friendly Compressor - prevents distortion while preserving bass punch
        // Slower attack allows bass transients to pass through, preventing ducking
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.value = -6;   // Slightly higher threshold - less aggressive
        compressor.knee.value = 15;        // Softer knee for gentler compression
        compressor.ratio.value = 3.5;      // Lower ratio for more natural dynamics
        compressor.attack.value = 0.01;    // Slower attack (10ms) - lets bass transients through!
        compressor.release.value = 0.2;    // Longer release (200ms) - smoother, less pumping

        // Safety Limiter - hard limiter for extreme peaks (catches what compressor misses)
        // This is critical for preventing clipping when bass is heavily boosted
        const safetyLimiter = audioContext.createDynamicsCompressor();
        safetyLimiter.threshold.value = -3;  // Catch peaks before clipping
        safetyLimiter.knee.value = 0;        // Hard knee for hard limiting
        safetyLimiter.ratio.value = 20;      // Very high ratio = hard limiter
        safetyLimiter.attack.value = 0.001;  // Ultra-fast attack (1ms) to catch all peaks
        safetyLimiter.release.value = 0.05;  // Very fast release (50ms)

        // Create gain node for volume
        const gainNode = audioContext.createGain();
        gainNode.gain.value = volume / 100;

        // Connect professional audio chain with dual-stage tone controls:
        // source → high-pass → pre-gain → bass lowshelf → bass punch → treble highshelf → 
        // treble sparkle → EQ → bass compensation → compressor → safety limiter → gain → destination
        source.connect(highPassFilter);
        highPassFilter.connect(preGain);
        preGain.connect(bassToneFilter);
        bassToneFilter.connect(bassPunchFilter);
        bassPunchFilter.connect(trebleToneFilter);
        trebleToneFilter.connect(trebleSparkleFilter);
        
        let currentNode: AudioNode = trebleSparkleFilter;
        filters.forEach(filter => {
          currentNode.connect(filter);
          currentNode = filter;
        });
        
        currentNode.connect(bassCompensationGain);
        bassCompensationGain.connect(compressor);
        compressor.connect(safetyLimiter);
        safetyLimiter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Store chain
        const chain: AudioChain = {
          context: audioContext,
          source,
          highPassFilter,
          preGain,
          filters,
          bassToneFilter,
          bassPunchFilter,
          trebleToneFilter,
          trebleSparkleFilter,
          compressor,
          safetyLimiter,
          bassCompensationGain,
          gainNode,
          connected: true,
        };

        audioChainRef.current = chain;
        audioChainStorage.set(audio, chain);

        logger.info('Professional Web Audio API chain initialized successfully');
        logger.debug(`Chain: High-pass → ${filters.length} EQ bands + Dual-Stage Bass/Treble + Bass Compensation + Compressor + Safety Limiter`);
        logger.debug(`Frequencies: ${EQUALIZER_BANDS.map(b => b.frequency + 'Hz').join(', ')}`);
        logger.debug(`Bass: Lowshelf (65Hz) + Punch (55Hz peaking) | Treble: Highshelf (11kHz) + Sparkle (14kHz peaking)`);
        logger.debug(`High-pass filter: 25Hz cutoff (removes subsonic frequencies)`);
        
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

  // Update equalizer settings with dynamic pre-gain adjustment
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
      
      // Calculate total bass boost (32Hz + 64Hz + 125Hz + bassTone)
      // This helps us determine how much pre-gain reduction we need
      const bassBoost = equalizerSettings.enabled 
        ? Math.max(0, 
            Math.max(equalizerSettings.band32, 0) +
            Math.max(equalizerSettings.band64, 0) +
            Math.max(equalizerSettings.band125, 0) +
            Math.max(equalizerSettings.bassTone, 0)
          )
        : 0;

      // Calculate total positive gain across all bands (for overall headroom)
      const totalPositiveGain = equalizerSettings.enabled
        ? gains.reduce((sum, gain) => sum + Math.max(0, gain), 0) + 
          Math.max(0, equalizerSettings.bassTone) + 
          Math.max(0, equalizerSettings.trebleTone)
        : 0;

      // Dynamic pre-gain reduction based on bass boost and total gain
      // More aggressive bass boost = more pre-gain reduction to prevent clipping
      // Formula: base 0.7 (30% reduction) - additional reduction for bass boost
      // Maximum reduction: 0.4 (60% reduction) when bass is heavily boosted
      let preGainValue = 0.7; // Base reduction
      
      if (bassBoost > 0) {
        // Additional reduction for bass boost: up to 30% more reduction for extreme bass
        // Linear scaling: 0dB bass = 0% extra, 24dB bass = 30% extra reduction
        const bassReduction = Math.min(0.3, (bassBoost / 24) * 0.3);
        preGainValue -= bassReduction;
      }
      
      // Additional reduction for high total gain (when many bands are boosted)
      if (totalPositiveGain > 20) {
        const gainReduction = Math.min(0.1, ((totalPositiveGain - 20) / 30) * 0.1);
        preGainValue -= gainReduction;
      }
      
      // Clamp pre-gain between 0.4 (60% reduction) and 0.85 (15% reduction)
      preGainValue = Math.max(0.4, Math.min(0.85, preGainValue));
      
      // Update pre-gain with smooth transition
      chain.preGain.gain.cancelScheduledValues(now);
      chain.preGain.gain.setValueAtTime(chain.preGain.gain.value, now);
      chain.preGain.gain.linearRampToValueAtTime(preGainValue, now + 0.1);
      
      // Update 10-band EQ
      gains.forEach((gain, index) => {
        if (chain.filters[index]) {
          const targetGain = equalizerSettings.enabled ? gain : 0;
          chain.filters[index].gain.cancelScheduledValues(now);
          chain.filters[index].gain.setValueAtTime(chain.filters[index].gain.value, now);
          chain.filters[index].gain.linearRampToValueAtTime(targetGain, now + 0.05);
        }
      });

      // Update Dual-Stage Bass Enhancement
      const targetBassTone = equalizerSettings.enabled ? equalizerSettings.bassTone : 0;
      
      // Stage 1: Main bass lowshelf (full value)
      chain.bassToneFilter.gain.cancelScheduledValues(now);
      chain.bassToneFilter.gain.setValueAtTime(chain.bassToneFilter.gain.value, now);
      chain.bassToneFilter.gain.linearRampToValueAtTime(targetBassTone, now + 0.05);
      
      // Stage 2: Bass punch filter (60% of bass tone for powerful punch and presence)
      // This adds punch at the fundamental frequency and ensures bass feels integrated, not below volume
      const bassPunchGain = targetBassTone * 0.6; // 60% of main bass tone (increased for better presence)
      chain.bassPunchFilter.gain.cancelScheduledValues(now);
      chain.bassPunchFilter.gain.setValueAtTime(chain.bassPunchFilter.gain.value, now);
      chain.bassPunchFilter.gain.linearRampToValueAtTime(bassPunchGain, now + 0.05);

      // Update Dual-Stage Treble Enhancement
      const targetTrebleTone = equalizerSettings.enabled ? equalizerSettings.trebleTone : 0;
      
      // Stage 1: Main treble highshelf (full value)
      chain.trebleToneFilter.gain.cancelScheduledValues(now);
      chain.trebleToneFilter.gain.setValueAtTime(chain.trebleToneFilter.gain.value, now);
      chain.trebleToneFilter.gain.linearRampToValueAtTime(targetTrebleTone, now + 0.05);
      
      // Stage 2: Treble sparkle filter (45% of treble tone for consistent air and presence)
      // This adds sparkle at air frequencies and maintains presence throughout
      const trebleSparkleGain = targetTrebleTone * 0.45; // 45% of main treble tone (increased for better integration)
      chain.trebleSparkleFilter.gain.cancelScheduledValues(now);
      chain.trebleSparkleFilter.gain.setValueAtTime(chain.trebleSparkleFilter.gain.value, now);
      chain.trebleSparkleFilter.gain.linearRampToValueAtTime(trebleSparkleGain, now + 0.05);

      // Dynamic Bass Compensation - ensures bass feels integrated with volume, not below it
      // When bass is boosted, add compensation to maintain perceived level and punch
      // Formula: More bass boost = more compensation (up to +5dB max for better integration)
      let bassCompensation = 1.0; // No compensation
      
      if (bassBoost > 0 && equalizerSettings.enabled) {
        // Scale compensation: 0dB bass = 1.0, 24dB bass = 1.41 (5dB boost max)
        // This ensures bass feels integrated with volume, not reduced or "below" it
        const compensationFactor = 1.0 + (bassBoost / 24) * 0.41; // Max +5dB (increased from +3dB)
        bassCompensation = Math.min(1.41, compensationFactor);
      }
      
      // Additional bass/treble synergy compensation
      // When both bass and treble are boosted, add slight overall compensation
      // This ensures they work hand-in-hand for best audio output
      if (targetBassTone > 0 && targetTrebleTone > 0 && equalizerSettings.enabled) {
        const synergyBoost = Math.min(targetBassTone, targetTrebleTone) * 0.02; // Up to +0.24dB
        bassCompensation = Math.min(1.5, bassCompensation + synergyBoost);
      }
      
      // Apply bass compensation with smooth transition
      chain.bassCompensationGain.gain.cancelScheduledValues(now);
      chain.bassCompensationGain.gain.setValueAtTime(chain.bassCompensationGain.gain.value, now);
      chain.bassCompensationGain.gain.linearRampToValueAtTime(bassCompensation, now + 0.1);

      logger.debug(`EQ updated: ${equalizerSettings.preset}, Bass: ${equalizerSettings.bassTone}dB, Treble: ${equalizerSettings.trebleTone}dB, enabled: ${equalizerSettings.enabled}`);
      logger.debug(`Pre-gain: ${(preGainValue * 100).toFixed(1)}% | Bass compensation: +${((bassCompensation - 1.0) * 100).toFixed(1)}% (max +5dB)`);
      logger.debug(`Bass punch: ${bassPunchGain.toFixed(1)}dB (60% of tone) | Treble sparkle: ${trebleSparkleGain.toFixed(1)}dB (45% of tone)`);
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
            logger.info('Auto-play started');
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
          logger.info('Playing');
          
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
