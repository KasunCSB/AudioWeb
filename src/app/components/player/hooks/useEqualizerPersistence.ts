import { useState, useEffect } from 'react';
import { EqualizerSettings } from '../types';
import { STORAGE_KEYS } from '@/config/constants';
import { createLogger } from '@/utils/logger';

const logger = createLogger('EQPersistence');

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
  enabled: false,
};

export const useEqualizerPersistence = (shouldInit: boolean = false) => {
  const [settings, setSettings] = useState<EqualizerSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize (load or save defaults) only when the player UI is ready
  // `shouldInit` should be true when the player has become visible and at
  // least one track is available. This avoids early localStorage access on
  // fresh starts or before UI is ready.
  useEffect(() => {
    if (!shouldInit || isLoaded) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EQUALIZER_SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored) as EqualizerSettings;
        setSettings(parsed);
        logger.info('Equalizer settings loaded from localStorage:', parsed.preset);
      } else {
        // Fresh user: persist the defaults now that UI is ready
        setSettings(defaultSettings);
        try {
          localStorage.setItem(STORAGE_KEYS.EQUALIZER_SETTINGS, JSON.stringify(defaultSettings));
          logger.debug('No stored equalizer settings found; saved defaults to localStorage');
        } catch (err) {
          logger.error('Failed to save default equalizer settings:', err);
        }
      }
    } catch (error) {
      logger.error('Failed to initialize equalizer settings from localStorage:', error);
      setSettings(defaultSettings);
    } finally {
      setIsLoaded(true);
    }
  }, [shouldInit, isLoaded]);

  // Save settings to localStorage whenever they change — but only after init
  useEffect(() => {
    if (!isLoaded) return; // Don't save before initialization

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
