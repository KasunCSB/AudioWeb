import { EqualizerSettings } from './types';
import { ResizablePopup } from './ResizablePopup';

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

  const handlePresetChange = (preset: string) => {
    onUpdateSettings({ ...settings, preset });
  };

  const handleSliderChange = (key: keyof EqualizerSettings, value: number) => {
    onUpdateSettings({ 
      ...settings, 
      [key]: value,
      preset: 'custom'
    });
  };

  return (
    <ResizablePopup
      show={show}
      position={position}
      onClose={onClose}
      onMouseDown={onMouseDown}
      title="Equalizer"
      minWidth={360}
      minHeight={560}
      maxWidth={500}
      maxHeight={700}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {['flat', 'rock', 'pop', 'jazz', 'classical', 'electronic', 'vocal', 'bass_boost'].map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetChange(preset)}
              className={`p-3 rounded-xl transition-all duration-200 text-sm capitalize ${
                settings.preset === preset 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              {preset.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {[
            { key: 'bass' as const, label: 'Bass (60Hz)', value: settings.bass },
            { key: 'lowerMid' as const, label: 'Low Mid (170Hz)', value: settings.lowerMid },
            { key: 'mid' as const, label: 'Mid (350Hz)', value: settings.mid },
            { key: 'upperMid' as const, label: 'High Mid (1kHz)', value: settings.upperMid },
            { key: 'treble' as const, label: 'Treble (3.5kHz)', value: settings.treble },
            { key: 'presence' as const, label: 'Presence (10kHz)', value: settings.presence },
            { key: 'brilliance' as const, label: 'Brilliance (14kHz)', value: settings.brilliance }
          ].map(({ key, label, value }) => (
            <div key={key}>
              <label className="text-white/70 text-xs mb-2 block flex justify-between">
                <span>{label}</span>
                <span>{value > 0 ? '+' : ''}{value}dB</span>
              </label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={value}
                onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${value < 0 ? '#ef4444' : '#10b981'} ${Math.abs(value) * 5}%, rgba(255,255,255,0.2) ${Math.abs(value) * 5}%)`
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </ResizablePopup>
  );
};
