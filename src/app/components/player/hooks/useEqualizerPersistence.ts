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
        const parsed = JSON.parse(stored) as EqualizerSettings;
        setSettings(parsed);
        logger.info('Equalizer settings loaded from localStorage:', parsed.preset);
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
