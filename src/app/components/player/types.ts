/**
 * Represents a single line of synchronized lyrics
 */
export interface LyricLine {
  /** Time in seconds when this lyric line should be displayed */
  time: number;
  /** The lyric text */
  text: string;
}

/**
 * Extended metadata information for audio tracks
 * Includes comprehensive tag support for various audio formats
 */
export interface AudioMetadata {
  // Basic information
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  year?: number;
  genre?: string;
  
  // Extended information
  composer?: string;
  conductor?: string;
  lyricist?: string;
  performer?: string;
  
  // Track information
  trackNumber?: number;
  trackTotal?: number;
  discNumber?: number;
  discTotal?: number;
  
  // Audio quality information
  bitrate?: number; // in kbps
  sampleRate?: number; // in Hz
  channels?: number; // 1 = mono, 2 = stereo, etc.
  codec?: string;
  format?: string; // e.g., 'FLAC', 'MP3', 'WAV'
  lossless?: boolean;
  
  // Additional metadata
  copyright?: string;
  publisher?: string;
  comment?: string;
  description?: string;
  isrc?: string; // International Standard Recording Code
  barcode?: string;
  catalogNumber?: string;
  
  // ReplayGain for volume normalization
  replaygainTrackGain?: number;
  replaygainTrackPeak?: number;
  replaygainAlbumGain?: number;
  replaygainAlbumPeak?: number;
  
  // Ratings and mood
  rating?: number; // 0-5 or 0-100 depending on source
  mood?: string;
  bpm?: number;
  key?: string; // Musical key (e.g., 'C major', 'A minor')
  
  // Lyrics
  lyrics?: string;
  syncedLyrics?: string;
}

/**
 * Represents a complete audio track with metadata and playback information
 */
export interface AudioTrack {
  /** Unique identifier for the track */
  id: string;
  
  /** Track title */
  title: string;
  
  /** Track artist */
  artist: string;
  
  /** Album name */
  album?: string;
  
  /** Track duration in seconds */
  duration: number;
  
  /** Original file object */
  file: File;
  
  /** Object URL for playback */
  url: string;
  
  /** Whether this track is currently active/playing */
  isActive: boolean;
  
  /** Album artwork as data URL or object URL */
  albumArt?: string;
  
  /** Release year */
  year?: number;
  
  /** Genre */
  genre?: string;
  
  /** Plain text lyrics */
  lyrics?: string;
  
  /** Time-synchronized lyrics from LRC files */
  lrcLyrics?: LyricLine[];
  
  /** Extended metadata information */
  metadata?: AudioMetadata;
  
  /** Error message if track failed to load */
  error?: string;
  
  /** Loading state */
  isLoading?: boolean;
}

export interface PlayerProps {
  isVisible?: boolean;
  onClose?: () => void;
  asPage?: boolean;
  onPlayingChange?: (isPlaying: boolean) => void;
  onTrackChange?: (currentTrack: AudioTrack | null, nextTrack: AudioTrack | null) => void;
}

export interface PopupPositions {
  playlist: { x: number; y: number };
  equalizer: { x: number; y: number };
  sleepTimer: { x: number; y: number };
  lyrics: { x: number; y: number };
}

export interface EqualizerSettings {
  bass: number;
  mid: number;
  treble: number;
  lowerMid: number;
  upperMid: number;
  presence: number;
  brilliance: number;
  preset: string;
}
