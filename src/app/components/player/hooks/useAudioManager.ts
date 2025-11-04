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
  trebleSmoothingFilter: BiquadFilterNode; // Low-pass filter to remove treble noise and harshness
  compressor: DynamicsCompressorNode;  // Prevents distortion (bass-friendly settings)
  safetyLimiter: DynamicsCompressorNode; // Hard limiter for extreme peaks
  bassCompensationGain: GainNode;      // Dynamic gain compensation for bass consistency
  presetNormalizationGain: GainNode;   // Normalizes preset volumes for consistent loudness
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
        // Stage 1: Pure bass lowshelf for clean, natural bass foundation
        const bassToneFilter = audioContext.createBiquadFilter();
        bassToneFilter.type = 'lowshelf';
        bassToneFilter.frequency.value = 70; // Slightly higher for cleaner, more pure bass (was 65Hz)
        bassToneFilter.Q.value = 0.6; // Softer Q for pure, clean bass without muddiness (was 0.707)
        bassToneFilter.gain.value = 0;

        // Stage 2: Bass punch filter for powerful impact with purity
        // Optimized Q and frequency for strong punch while maintaining clean bass
        const bassPunchFilter = audioContext.createBiquadFilter();
        bassPunchFilter.type = 'peaking';
        bassPunchFilter.frequency.value = 56; // Optimal frequency for punch (balanced between 55-58Hz)
        bassPunchFilter.Q.value = 0.9; // Balanced Q for powerful punch with clean response (was 0.8)
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
        trebleSparkleFilter.Q.value = 0.8; // Softer Q for pure, noise-free treble (reduced from 1.0)
        trebleSparkleFilter.gain.value = 0;

        // Stage 3: Treble smoothing filter - removes harsh frequencies and noise
        // Gentle low-pass filter above 16kHz to remove digital artifacts and ensure pure treble
        const trebleSmoothingFilter = audioContext.createBiquadFilter();
        trebleSmoothingFilter.type = 'lowpass';
        trebleSmoothingFilter.frequency.value = 18000; // Gentle rolloff above 18kHz
        trebleSmoothingFilter.Q.value = 0.707; // Butterworth response for smooth rolloff
        trebleSmoothingFilter.gain.value = 0; // No gain adjustment

        // Bass compensation gain - maintains consistent bass level to prevent ducking
        const bassCompensationGain = audioContext.createGain();
        bassCompensationGain.gain.value = 1.0; // Will be dynamically adjusted

        // Preset normalization gain - ensures consistent volume across all presets
        const presetNormalizationGain = audioContext.createGain();
        presetNormalizationGain.gain.value = 1.0; // Will be dynamically adjusted based on preset

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
        // treble sparkle → treble smoothing → EQ → bass compensation → preset normalization → 
        // compressor → safety limiter → gain → destination
        source.connect(highPassFilter);
        highPassFilter.connect(preGain);
        preGain.connect(bassToneFilter);
        bassToneFilter.connect(bassPunchFilter);
        bassPunchFilter.connect(trebleToneFilter);
        trebleToneFilter.connect(trebleSparkleFilter);
        trebleSparkleFilter.connect(trebleSmoothingFilter);
        
        let currentNode: AudioNode = trebleSmoothingFilter;
        filters.forEach(filter => {
          currentNode.connect(filter);
          currentNode = filter;
        });
        
        currentNode.connect(bassCompensationGain);
        bassCompensationGain.connect(presetNormalizationGain);
        presetNormalizationGain.connect(compressor);
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
          trebleSmoothingFilter,
          compressor,
          safetyLimiter,
          bassCompensationGain,
          presetNormalizationGain,
          gainNode,
          connected: true,
        };

        audioChainRef.current = chain;
        audioChainStorage.set(audio, chain);

        logger.info('Professional Web Audio API chain initialized successfully');
        logger.debug(`Chain: High-pass → ${filters.length} EQ bands + Dual-Stage Bass/Treble + Treble Smoothing + Bass Compensation + Preset Normalization + Compressor + Safety Limiter`);
        logger.debug(`Frequencies: ${EQUALIZER_BANDS.map(b => b.frequency + 'Hz').join(', ')}`);
        logger.debug(`Bass: Lowshelf (70Hz, Q=0.6 - pure) + Punch (56Hz, Q=0.9 - powerful) | Treble: Highshelf (11kHz) + Sparkle (14kHz) + Smoothing (18kHz lowpass)`);
        logger.debug(`High-pass filter: 25Hz cutoff (removes subsonic frequencies)`);
        
        // Immediately apply EQ settings after chain initialization
        // This ensures settings loaded from localStorage are applied at runtime
        // Use setTimeout to ensure the chain is fully connected before applying settings
        setTimeout(() => {
          if (chain && chain.connected && chain.filters.length > 0) {
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
              
              // Calculate bass boost for pre-gain and compensation
              const bassBoost = equalizerSettings.enabled 
                ? Math.max(0, 
                    Math.max(equalizerSettings.band32, 0) +
                    Math.max(equalizerSettings.band64, 0) +
                    Math.max(equalizerSettings.band125, 0) +
                    Math.max(equalizerSettings.bassTone, 0)
                  )
                : 0;

              const totalPositiveGain = equalizerSettings.enabled
                ? gains.reduce((sum, gain) => sum + Math.max(0, gain), 0) + 
                  Math.max(0, equalizerSettings.bassTone) + 
                  Math.max(0, equalizerSettings.trebleTone)
                : 0;

              // Apply pre-gain adjustment
              let preGainValue = 0.7;
              if (bassBoost > 0) {
                const bassReduction = Math.min(0.3, (bassBoost / 24) * 0.3);
                preGainValue -= bassReduction;
              }
              if (totalPositiveGain > 20) {
                const gainReduction = Math.min(0.1, ((totalPositiveGain - 20) / 30) * 0.1);
                preGainValue -= gainReduction;
              }
              preGainValue = Math.max(0.4, Math.min(0.85, preGainValue));
              chain.preGain.gain.cancelScheduledValues(now);
              chain.preGain.gain.setValueAtTime(preGainValue, now);
              
              // Apply all EQ settings immediately
              gains.forEach((gain, index) => {
                if (chain.filters[index]) {
                  const targetGain = equalizerSettings.enabled ? gain : 0;
                  chain.filters[index].gain.cancelScheduledValues(now);
                  chain.filters[index].gain.setValueAtTime(targetGain, now);
                }
              });

              // Apply bass tone
              const targetBassTone = equalizerSettings.enabled ? equalizerSettings.bassTone : 0;
              chain.bassToneFilter.gain.cancelScheduledValues(now);
              chain.bassToneFilter.gain.setValueAtTime(targetBassTone, now);
              
              const bassPunchGain = targetBassTone * 0.5;
              chain.bassPunchFilter.gain.cancelScheduledValues(now);
              chain.bassPunchFilter.gain.setValueAtTime(bassPunchGain, now);

              // Apply treble tone
              const targetTrebleTone = equalizerSettings.enabled ? equalizerSettings.trebleTone : 0;
              chain.trebleToneFilter.gain.cancelScheduledValues(now);
              chain.trebleToneFilter.gain.setValueAtTime(targetTrebleTone, now);
              
              const trebleSparkleGain = targetTrebleTone * 0.3;
              chain.trebleSparkleFilter.gain.cancelScheduledValues(now);
              chain.trebleSparkleFilter.gain.setValueAtTime(trebleSparkleGain, now);

              // Apply bass compensation
              let bassCompensation = 1.0;
              if (bassBoost > 0 && equalizerSettings.enabled) {
                const compensationFactor = 1.0 + (bassBoost / 24) * 0.41;
                bassCompensation = Math.min(1.41, compensationFactor);
              }
              if (targetBassTone > 0 && targetTrebleTone > 0 && equalizerSettings.enabled) {
                const synergyBoost = Math.min(targetBassTone, targetTrebleTone) * 0.02;
                bassCompensation = Math.min(1.5, bassCompensation + synergyBoost);
              }
              chain.bassCompensationGain.gain.cancelScheduledValues(now);
              chain.bassCompensationGain.gain.setValueAtTime(bassCompensation, now);

              // Apply preset normalization
              let presetNormalization = 1.0;
              if (equalizerSettings.enabled) {
                const currentGain = totalPositiveGain;
                const referenceGain = 20;
                if (currentGain > referenceGain) {
                  const reduction = Math.min(0.3, ((currentGain - referenceGain) / referenceGain) * 0.3);
                  presetNormalization = 1.0 - reduction;
                } else if (currentGain < referenceGain) {
                  const boost = Math.min(0.15, ((referenceGain - currentGain) / referenceGain) * 0.15);
                  presetNormalization = 1.0 + boost;
                }
                presetNormalization = Math.max(0.7, Math.min(1.15, presetNormalization));
              }
              chain.presetNormalizationGain.gain.cancelScheduledValues(now);
              chain.presetNormalizationGain.gain.setValueAtTime(presetNormalization, now);

              logger.info('EQ settings applied after chain initialization:', equalizerSettings.preset);
              logger.debug(`Initialized with preset: ${equalizerSettings.preset}, Bass: ${targetBassTone}dB, Treble: ${targetTrebleTone}dB`);
            } catch (error) {
              logger.error('Failed to apply EQ settings after initialization:', error);
            }
          }
        }, 50); // Small delay to ensure chain is fully connected
        
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
  }, [volume, equalizerSettings]); // Add equalizerSettings dependency so settings are available when chain initializes

  // Update equalizer settings with dynamic pre-gain adjustment
  // This effect runs whenever equalizerSettings changes OR when chain becomes available
  useEffect(() => {
    const chain = audioChainRef.current;
    if (!chain || !chain.connected || chain.filters.length === 0) {
      // Chain not ready yet - settings will be applied when chain initializes
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
      
      // Stage 2: Bass punch filter (50% of bass tone for powerful punch with purity)
      // Balanced gain for strong punch while maintaining clean, pure bass tone
      const bassPunchGain = targetBassTone * 0.5; // 50% of main bass tone (balanced for punch and purity)
      chain.bassPunchFilter.gain.cancelScheduledValues(now);
      chain.bassPunchFilter.gain.setValueAtTime(chain.bassPunchFilter.gain.value, now);
      chain.bassPunchFilter.gain.linearRampToValueAtTime(bassPunchGain, now + 0.05);

      // Update Dual-Stage Treble Enhancement
      const targetTrebleTone = equalizerSettings.enabled ? equalizerSettings.trebleTone : 0;
      
      // Stage 1: Main treble highshelf (full value)
      chain.trebleToneFilter.gain.cancelScheduledValues(now);
      chain.trebleToneFilter.gain.setValueAtTime(chain.trebleToneFilter.gain.value, now);
      chain.trebleToneFilter.gain.linearRampToValueAtTime(targetTrebleTone, now + 0.05);
      
      // Stage 2: Treble sparkle filter (30% of treble tone for pure, noise-free treble)
      // Reduced from 45% to minimize noise while maintaining presence
      const trebleSparkleGain = targetTrebleTone * 0.3; // 30% of main treble tone (reduced for pure treble)
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

      // Preset Volume Normalization - ensures consistent loudness across all presets
      // Calculate total gain for current preset and normalize to reference level
      // This prevents volume jumps when switching presets
      let presetNormalization = 1.0; // No normalization
      
      if (equalizerSettings.enabled) {
        // Calculate RMS-like total gain (considers both positive and negative gains)
        // Use perceptual loudness approximation (positive gains contribute more)
        const totalPositiveGain = gains.reduce((sum, gain) => sum + Math.max(0, gain), 0) + 
                                  Math.max(0, targetBassTone) + 
                                  Math.max(0, targetTrebleTone);
        // Negative gains are not currently used in normalization; compute only if needed later
        
        // Reference level: target around 20dB total positive gain (balanced preset)
        // Presets with more gain need reduction, presets with less gain need boost
        const referenceGain = 20; // Target total positive gain
        const currentGain = totalPositiveGain;
        
        // Calculate normalization factor (inverse relationship)
        // If current gain is higher than reference, reduce volume
        // If current gain is lower than reference, boost volume
        if (currentGain > referenceGain) {
          // Reduce volume for high-gain presets
          // Scale: 20dB = 1.0, 40dB = ~0.7 (30% reduction)
          const reduction = Math.min(0.3, ((currentGain - referenceGain) / referenceGain) * 0.3);
          presetNormalization = 1.0 - reduction;
        } else if (currentGain < referenceGain) {
          // Boost volume for low-gain presets (but limit to prevent clipping)
          // Scale: 20dB = 1.0, 10dB = ~1.15 (15% boost max)
          const boost = Math.min(0.15, ((referenceGain - currentGain) / referenceGain) * 0.15);
          presetNormalization = 1.0 + boost;
        }
        
        // Clamp normalization between 0.7 (30% reduction) and 1.15 (15% boost)
        presetNormalization = Math.max(0.7, Math.min(1.15, presetNormalization));
      }
      
      // Apply preset normalization with smooth transition
      chain.presetNormalizationGain.gain.cancelScheduledValues(now);
      chain.presetNormalizationGain.gain.setValueAtTime(chain.presetNormalizationGain.gain.value, now);
      chain.presetNormalizationGain.gain.linearRampToValueAtTime(presetNormalization, now + 0.15);

      logger.debug(`EQ updated: ${equalizerSettings.preset}, Bass: ${equalizerSettings.bassTone}dB, Treble: ${equalizerSettings.trebleTone}dB, enabled: ${equalizerSettings.enabled}`);
      logger.debug(`Pre-gain: ${(preGainValue * 100).toFixed(1)}% | Bass compensation: +${((bassCompensation - 1.0) * 100).toFixed(1)}% | Preset normalization: ${(presetNormalization * 100).toFixed(1)}%`);
      logger.debug(`Bass punch: ${bassPunchGain.toFixed(1)}dB (50% of tone - powerful) | Treble sparkle: ${trebleSparkleGain.toFixed(1)}dB (30% of tone - pure)`);
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
