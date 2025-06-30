export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  file: File;
  url: string;
  isActive: boolean;
  albumArt?: string;
  year?: number;
  genre?: string;
  lyrics?: string;
  lrcLyrics?: LyricLine[]; // For time-synced lyrics from LRC files
}

export interface PlayerProps {
  isVisible?: boolean;
  onClose?: () => void;
  asPage?: boolean;
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
