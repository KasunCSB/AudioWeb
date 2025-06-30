import { ResizablePopup } from './ResizablePopup';

interface SleepTimerPopupProps {
  show: boolean;
  position: { x: number; y: number };
  sleepTimer: number;
  onClose: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onSetTimer: (minutes: number) => void;
  onCancelTimer: () => void;
}

export const SleepTimerPopup: React.FC<SleepTimerPopupProps> = ({
  show,
  position,
  sleepTimer,
  onClose,
  onMouseDown,
  onSetTimer,
  onCancelTimer
}) => {
  if (!show) return null;

  return (
    <ResizablePopup
      show={show}
      position={position}
      onClose={onClose}
      onMouseDown={onMouseDown}
      title="Sleep Timer"
      minWidth={320}
      minHeight={380}
      maxWidth={420}
      maxHeight={450}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[5, 10, 15, 30, 45, 60].map((minutes) => (
            <button
              key={minutes}
              onClick={() => {
                onSetTimer(minutes);
                onClose();
              }}
              className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200 text-sm"
            >
              {minutes}m
            </button>
          ))}
        </div>
        {sleepTimer > 0 && (
          <div className="text-center">
            <p className="text-white/70 text-sm mb-2">Timer set for {sleepTimer} minutes</p>
            <button
              onClick={() => {
                onCancelTimer();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-200 text-sm"
            >
              Cancel Timer
            </button>
          </div>
        )}
      </div>
    </ResizablePopup>
  );
};
