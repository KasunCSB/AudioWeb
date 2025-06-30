import { AudioTrack } from './types';

interface AlbumArtProps {
  currentTrack: AudioTrack | null;
  onUploadClick: () => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export const AlbumArt: React.FC<AlbumArtProps> = ({
  currentTrack,
  onUploadClick,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop
}) => {
  if (!currentTrack) {
    return (
      <div className="flex justify-center mt-8 mb-16">
        <div 
          className={`w-full max-w-lg mx-auto h-80 sm:h-96 rounded-[24px] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer ${
            isDragOver 
              ? 'border-white bg-white/10 scale-105' 
              : 'border-white/30 hover:border-white/50 hover:bg-white/5 hover:scale-102'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onUploadClick}
        >
          <div className="text-center space-y-6 p-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">Upload Your Music</h3>
              <p className="text-white/70 text-base sm:text-lg mb-4">Drag & drop audio files here</p>
              <p className="text-white/50 text-sm">or click to browse your files</p>
            </div>
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <span>Supports MP3, WAV, FLAC, and more</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative group">
        <div 
          className="w-full aspect-square rounded-[20px] overflow-hidden shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
          style={{
            background: currentTrack.albumArt ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
            backdropFilter: currentTrack.albumArt ? 'none' : 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {currentTrack.albumArt ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={currentTrack.albumArt} 
              alt={`${currentTrack.album} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.5 13.93A1 1 0 014 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2a1 1 0 01.5-.069l3.883-2.884a1 1 0 011 0z"/>
                  <path d="M11 8a1 1 0 011-1h5a1 1 0 011 1v8a1 1 0 01-1 1h-5a1 1 0 01-1-1V8z"/>
                </svg>
              </div>
              <p className="text-white/70">No Album Art</p>
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-xl font-semibold text-white mb-1 truncate">
          {currentTrack.title}
        </h1>
        <p className="text-white/70 mb-1 truncate">{currentTrack.artist}</p>
        <p className="text-white/50 text-sm truncate">{currentTrack.album}</p>
      </div>
    </div>
  );
};
