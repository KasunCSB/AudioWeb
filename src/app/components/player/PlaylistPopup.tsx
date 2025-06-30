import { AudioTrack } from './types';
import { ResizablePopup } from './ResizablePopup';
import { AnimatedMusicBars } from './AnimatedMusicBars';

interface PlaylistPopupProps {
  show: boolean;
  playlist: AudioTrack[];
  position: { x: number; y: number };
  onClose: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onSelectTrack: (index: number) => void;
  onRemoveTrack: (index: number) => void;
  isPlaying?: boolean;
}

export const PlaylistPopup: React.FC<PlaylistPopupProps> = ({
  show,
  playlist,
  position,
  onClose,
  onMouseDown,
  onSelectTrack,
  onRemoveTrack,
  isPlaying = false
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!show || playlist.length === 0) return null;

  return (
    <ResizablePopup
      show={show}
      position={position}
      onClose={onClose}
      onMouseDown={onMouseDown}
      title={`Playlist (${playlist.length} songs)`}
      minWidth={380}
      minHeight={480}
      maxWidth={650}
      maxHeight={750}
    >
      <div className="space-y-2">
        {playlist.map((track, index) => (
          <div
            key={track.id}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer hover:bg-white/10 group ${
              track.isActive ? 'bg-white/15' : ''
            }`}
            onClick={() => onSelectTrack(index)}
          >
            <div className="text-sm text-white/60 w-6 flex-shrink-0">
              {track.isActive ? (
                <AnimatedMusicBars className="w-4 h-4" isPlaying={isPlaying} />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
              {track.albumArt ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={track.albumArt} 
                  alt="Album art" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.5 13.93A1 1 0 014 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2a1 1 0 01.5-.069l3.883-2.884a1 1 0 011 0z"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate text-sm ${track.isActive ? 'text-white' : 'text-white/80'}`}>
                {track.title}
              </p>
              <p className="text-xs text-white/60 truncate">
                {track.artist}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">{formatTime(track.duration)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTrack(index);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ResizablePopup>
  );
};
