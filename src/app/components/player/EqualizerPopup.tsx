import { EqualizerSettings } from './types';
import { ResizablePopup } from './ResizablePopup';
import { EQUALIZER_BANDS, EQUALIZER_PRESETS } from '@/config/constants';

interface EqualizerPopupProps {
  show: boolean;
  position: { x: number; y: number };
  settings: EqualizerSettings;
  onClose: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onUpdateSettings: (settings: EqualizerSettings) => void;
}

export const EqualizerPopup: React.FC<EqualizerPopupProps> = ({
  show,
  position,
  settings,
  onClose,
  onMouseDown,
  onUpdateSettings
}) => {
  if (!show) return null;

  const handlePresetChange = (presetKey: string) => {
    const preset = EQUALIZER_PRESETS[presetKey as keyof typeof EQUALIZER_PRESETS];
    if (!preset) return;

    // Apply preset gains to all bands + tone controls
    const newSettings: EqualizerSettings = {
      band32: preset.gains[0],
      band64: preset.gains[1],
      band125: preset.gains[2],
      band250: preset.gains[3],
      band500: preset.gains[4],
      band1k: preset.gains[5],
      band2k: preset.gains[6],
      band4k: preset.gains[7],
      band8k: preset.gains[8],
      band16k: preset.gains[9],
      bassTone: preset.bassTone,
      trebleTone: preset.trebleTone,
      preset: presetKey,
      enabled: settings.enabled,
    };

    onUpdateSettings(newSettings);
  };

  const handleSliderChange = (key: keyof EqualizerSettings, value: number) => {
    if (key === 'preset' || key === 'enabled') return;
    
    onUpdateSettings({ 
      ...settings, 
      [key]: value,
      preset: 'custom' // Switch to custom when manually adjusting
    });
  };

  const handleResetAll = () => {
    onUpdateSettings({
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
      enabled: settings.enabled,
    });
  };

  const handleToggleEnabled = () => {
    onUpdateSettings({
      ...settings,
      enabled: !settings.enabled,
    });
  };

  // Calculate fill percentage correctly
  const getSliderFillPercentage = (value: number): number => {
    // Range is -12 to +12, so 24 total range
    // At -12: 0%, at 0: 50%, at +12: 100%
    return ((value + 12) / 24) * 100;
  };

  // Get slider color based on value
  const getSliderColor = (value: number): string => {
    if (value < 0) return '#ef4444'; // red
    if (value > 0) return '#10b981'; // green
    return '#94a3b8'; // neutral gray
  };

  const bands = [
    { key: 'band32' as const, label: EQUALIZER_BANDS[0].label, desc: EQUALIZER_BANDS[0].description, value: settings.band32 },
    { key: 'band64' as const, label: EQUALIZER_BANDS[1].label, desc: EQUALIZER_BANDS[1].description, value: settings.band64 },
    { key: 'band125' as const, label: EQUALIZER_BANDS[2].label, desc: EQUALIZER_BANDS[2].description, value: settings.band125 },
    { key: 'band250' as const, label: EQUALIZER_BANDS[3].label, desc: EQUALIZER_BANDS[3].description, value: settings.band250 },
    { key: 'band500' as const, label: EQUALIZER_BANDS[4].label, desc: EQUALIZER_BANDS[4].description, value: settings.band500 },
    { key: 'band1k' as const, label: EQUALIZER_BANDS[5].label, desc: EQUALIZER_BANDS[5].description, value: settings.band1k },
    { key: 'band2k' as const, label: EQUALIZER_BANDS[6].label, desc: EQUALIZER_BANDS[6].description, value: settings.band2k },
    { key: 'band4k' as const, label: EQUALIZER_BANDS[7].label, desc: EQUALIZER_BANDS[7].description, value: settings.band4k },
    { key: 'band8k' as const, label: EQUALIZER_BANDS[8].label, desc: EQUALIZER_BANDS[8].description, value: settings.band8k },
    { key: 'band16k' as const, label: EQUALIZER_BANDS[9].label, desc: EQUALIZER_BANDS[9].description, value: settings.band16k },
  ];

  // Get all preset keys
  const presetKeys = Object.keys(EQUALIZER_PRESETS);

  return (
    <ResizablePopup
      show={show}
      position={position}
      onClose={onClose}
      onMouseDown={onMouseDown}
      title="Studio Equalizer"
      minWidth={420}
      minHeight={680}
      maxWidth={600}
      maxHeight={900}
    >
      <div className="space-y-4">
        {/* EQ Enable/Disable Toggle & Reset */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleToggleEnabled}
            className={`flex-1 p-3 rounded-xl transition-all duration-200 text-sm font-medium ${
              settings.enabled
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {settings.enabled ? '✓ EQ Enabled' : '✗ EQ Disabled'}
          </button>
          <button
            onClick={handleResetAll}
            className="p-3 rounded-xl transition-all duration-200 text-sm bg-white/10 text-white/70 hover:bg-white/15 border border-white/10"
            title="Reset all bands to 0dB"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Preset Buttons - Scrollable Grid */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Presets</h3>
          <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
            {presetKeys.map((presetKey) => {
              const preset = EQUALIZER_PRESETS[presetKey as keyof typeof EQUALIZER_PRESETS];
              return (
                <button
                  key={presetKey}
                  onClick={() => handlePresetChange(presetKey)}
                  className={`p-2.5 rounded-lg transition-all duration-200 text-xs font-medium capitalize ${
                    settings.preset === presetKey 
                      ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50 shadow-lg' 
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                  }`}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Band Sliders - 10 Band Professional EQ */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Frequency Bands • Range: ±12dB
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {bands.map(({ key, label, desc, value }) => {
              const fillPercentage = getSliderFillPercentage(value);
              const sliderColor = getSliderColor(value);
              
              return (
                <div key={key} className="space-y-1.5">
                  <label className="text-white/80 text-xs font-medium flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">{label}</span>
                      <span className="text-white/40 text-[10px]">{desc}</span>
                    </span>
                    <span className={`font-mono text-sm ${
                      value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-white/50'
                    }`}>
                      {value > 0 ? '+' : ''}{value.toFixed(1)}dB
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={value}
                      onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                      disabled={!settings.enabled}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-custom"
                      style={{
                        background: `linear-gradient(to right, ${sliderColor} 0%, ${sliderColor} ${fillPercentage}%, rgba(255,255,255,0.1) ${fillPercentage}%, rgba(255,255,255,0.1) 100%)`,
                        opacity: settings.enabled ? 1 : 0.3,
                      }}
                    />
                    {/* Center marker */}
                    <div 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/20 pointer-events-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advanced Tone Controls */}
        <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
          <h3 className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            Advanced Tone Controls
          </h3>
          
          {/* Bass Tone */}
          <div className="space-y-1.5">
            <label className="text-white/80 text-xs font-medium flex justify-between items-center">
              <span className="flex items-center gap-2">
                <span className="font-semibold">🎵 Bass Tone</span>
                <span className="text-white/40 text-[10px]">Deep bass enhancement</span>
              </span>
              <span className={`font-mono text-sm ${
                settings.bassTone > 0 ? 'text-green-400' : settings.bassTone < 0 ? 'text-red-400' : 'text-white/50'
              }`}>
                {settings.bassTone > 0 ? '+' : ''}{settings.bassTone.toFixed(1)}dB
              </span>
            </label>
            <div className="relative">
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={settings.bassTone}
                onChange={(e) => handleSliderChange('bassTone' as keyof EqualizerSettings, Number(e.target.value))}
                disabled={!settings.enabled}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer slider-custom"
                style={{
                  background: `linear-gradient(to right, ${getSliderColor(settings.bassTone)} 0%, ${getSliderColor(settings.bassTone)} ${getSliderFillPercentage(settings.bassTone)}%, rgba(255,255,255,0.1) ${getSliderFillPercentage(settings.bassTone)}%, rgba(255,255,255,0.1) 100%)`,
                  opacity: settings.enabled ? 1 : 0.3,
                }}
              />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/20 pointer-events-none" />
            </div>
          </div>

          {/* Treble Tone */}
          <div className="space-y-1.5">
            <label className="text-white/80 text-xs font-medium flex justify-between items-center">
              <span className="flex items-center gap-2">
                <span className="font-semibold">🎶 Treble Tone</span>
                <span className="text-white/40 text-[10px]">Crisp treble enhancement</span>
              </span>
              <span className={`font-mono text-sm ${
                settings.trebleTone > 0 ? 'text-green-400' : settings.trebleTone < 0 ? 'text-red-400' : 'text-white/50'
              }`}>
                {settings.trebleTone > 0 ? '+' : ''}{settings.trebleTone.toFixed(1)}dB
              </span>
            </label>
            <div className="relative">
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={settings.trebleTone}
                onChange={(e) => handleSliderChange('trebleTone' as keyof EqualizerSettings, Number(e.target.value))}
                disabled={!settings.enabled}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer slider-custom"
                style={{
                  background: `linear-gradient(to right, ${getSliderColor(settings.trebleTone)} 0%, ${getSliderColor(settings.trebleTone)} ${getSliderFillPercentage(settings.trebleTone)}%, rgba(255,255,255,0.1) ${getSliderFillPercentage(settings.trebleTone)}%, rgba(255,255,255,0.1) 100%)`,
                  opacity: settings.enabled ? 1 : 0.3,
                }}
              />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/20 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="pt-3 border-t border-white/10">
          <p className="text-[10px] text-white/40 text-center leading-relaxed">
            {settings.enabled 
              ? `🎛️ Professional 10-band EQ + Bass/Treble Tone + Limiter • ${EQUALIZER_PRESETS[settings.preset as keyof typeof EQUALIZER_PRESETS]?.name || 'Custom'}`
              : '⏸️ Equalizer is currently disabled'
            }
          </p>
        </div>
      </div>
    </ResizablePopup>
  );
};
