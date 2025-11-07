import { useState, useEffect } from 'react';
import { EqualizerSettings } from '../types';
import { STORAGE_KEYS } from '@/config/constants';
import { createLogger } from '@/utils/logger';

const logger = createLogger('EQPersistence');

// Schema version for equalizer settings stored in localStorage. Increment when
// the shape or semantics of the stored data change so we can migrate safely.
const CURRENT_EQ_SCHEMA_VERSION = 1;

const defaultSettings: EqualizerSettings = {
  band32: 0,
  band64: 0,
  band125: 0,
  band250: 0,
  band500: 0,
  band1k: 0,
  band2k: 0,
  band4k: 0,
  band8k: 0,
  band16k: 0,
  bassTone: 0,
  trebleTone: 0,
  preset: 'flat',
  enabled: true,
};

export const useEqualizerPersistence = () => {
  const [settings, setSettings] = useState<EqualizerSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EQUALIZER_SETTINGS);
      if (stored) {
        // Try to parse and sanitize legacy/unknown shapes to avoid passing
        // corrupted or out-of-range values into the WebAudio chain which can
        // cause distortion.
  const raw = JSON.parse(stored) as unknown;

  // If the stored value already includes a schemaVersion we can use it
  // to guide migrations in future. For now we only support version 1.
  const rawObj = raw as Record<string, unknown>;
  const storedVersion = rawObj && typeof rawObj['schemaVersion'] === 'number' ? (rawObj['schemaVersion'] as number) : 0;

        // Build a sanitized settings object by pulling expected keys and
        // clamping numeric ranges to safe values. This prevents really large
        // numbers or wrong types from being applied.
        const sanitizeNumber = (v: unknown, fallback = 0) => {
          const n = Number(v as unknown as number);
          if (Number.isNaN(n)) return fallback;
          // Clamp to ±24dB absolute safety; UI exposes ±12dB, but allow twice
          // that range and clamp further down to UI range to be safe.
          const clamped = Math.max(-24, Math.min(24, n));
          // Final clamp to UI-supported ±12dB to avoid extreme effects
          return Math.max(-12, Math.min(12, clamped));
        };

        const sanitized: EqualizerSettings & { schemaVersion: number } = {
          schemaVersion: CURRENT_EQ_SCHEMA_VERSION,
          band32: sanitizeNumber(rawObj['band32'], defaultSettings.band32),
          band64: sanitizeNumber(rawObj['band64'], defaultSettings.band64),
          band125: sanitizeNumber(rawObj['band125'], defaultSettings.band125),
          band250: sanitizeNumber(rawObj['band250'], defaultSettings.band250),
          band500: sanitizeNumber(rawObj['band500'], defaultSettings.band500),
          band1k: sanitizeNumber(rawObj['band1k'], defaultSettings.band1k),
          band2k: sanitizeNumber(rawObj['band2k'], defaultSettings.band2k),
          band4k: sanitizeNumber(rawObj['band4k'], defaultSettings.band4k),
          band8k: sanitizeNumber(rawObj['band8k'], defaultSettings.band8k),
          band16k: sanitizeNumber(rawObj['band16k'], defaultSettings.band16k),
          bassTone: sanitizeNumber(rawObj['bassTone'], defaultSettings.bassTone),
          trebleTone: sanitizeNumber(rawObj['trebleTone'], defaultSettings.trebleTone),
          preset: typeof rawObj['preset'] === 'string' ? (rawObj['preset'] as string) : defaultSettings.preset,
          enabled: typeof rawObj['enabled'] === 'boolean' ? (rawObj['enabled'] as boolean) : defaultSettings.enabled,
        } as EqualizerSettings & { schemaVersion: number };

        setSettings(sanitized);
        // Persist the sanitized version back so older malformed entries are
        // corrected for future loads.
        try {
          localStorage.setItem(STORAGE_KEYS.EQUALIZER_SETTINGS, JSON.stringify(sanitized));
        } catch (e) {
          logger.warn('Failed to persist sanitized equalizer settings:', e);
        }
        logger.info('Equalizer settings loaded from localStorage:', sanitized.preset, `(schema ${storedVersion} -> ${CURRENT_EQ_SCHEMA_VERSION})`);
      } else {
        logger.debug('No stored equalizer settings found, using defaults');
      }
    } catch (error) {
      logger.error('Failed to load equalizer settings:', error);
      setSettings(defaultSettings);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return; // Don't save on initial load

    try {
      localStorage.setItem(STORAGE_KEYS.EQUALIZER_SETTINGS, JSON.stringify(settings));
      logger.debug('Equalizer settings saved to localStorage');
    } catch (error) {
      logger.error('Failed to save equalizer settings:', error);
    }
  }, [settings, isLoaded]);

  const updateSettings = (newSettings: EqualizerSettings) => {
    setSettings(newSettings);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    logger.info('Equalizer settings reset to defaults');
  };

  return {
    settings,
    updateSettings,
    resetSettings,
    isLoaded,
  };
};
