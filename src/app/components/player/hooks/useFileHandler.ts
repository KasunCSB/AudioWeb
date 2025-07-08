import { useState, useCallback } from 'react';
import { AudioTrack, LyricLine } from '../types';
import * as musicMetadata from 'music-metadata-browser';

// Parse LRC format lyrics with timing information
const parseLrcFormat = (lrcContent: string): LyricLine[] => {
  // Remove language prefix if present (e.g., "eng||")
  const content = lrcContent.replace(/^[a-z]{2,3}\|\|/, '').trim();
  
  const lines = content.split('\n');
  const lyrics: LyricLine[] = [];
  
  for (let line of lines) {
    line = line.trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Remove language prefix like "eng||" from individual lines too
    line = line.replace(/^[a-z]{2,3}\|\|/, '');
    
    // Skip metadata lines like [ar:Artist], [ti:Title], etc.
    if (line.match(/^\[(ar|al|ti|length|offset|by|tool|ve|re):/i)) {
      continue;
    }
    
    // Extract lyrics text from timestamp lines - handle various timestamp formats
    const timestampMatch = line.match(/^\[(\d{1,2}):(\d{2})\.(\d{2})\]\s*(.*)$/) || 
                          line.match(/^\[(\d{1,2}):(\d{2}):(\d{2})\]\s*(.*)$/) ||
                          line.match(/^\[(\d{1,2}):(\d{2})\]\s*(.*)$/);
    
    if (timestampMatch) {
      const minutes = parseInt(timestampMatch[1]);
      const seconds = parseInt(timestampMatch[2]);
      const milliseconds = timestampMatch[3] ? parseInt(timestampMatch[3]) : 0;
      const text = timestampMatch[timestampMatch.length - 1].trim();
      
      if (text) {
        const time = minutes * 60 + seconds + milliseconds / 100;
        lyrics.push({ time, text });
      }
    }
  }
  
  // Sort by time
  lyrics.sort((a, b) => a.time - b.time);
  
  console.log('Parsed LRC lyrics:', lyrics.length, 'lines with timing'); // Debug log
  return lyrics;
};

export const useFileHandler = (
  playlist: AudioTrack[],
  setPlaylist: (tracks: AudioTrack[] | ((prev: AudioTrack[]) => AudioTrack[])) => void,
  setCurrentTrackIndex: (index: number) => void
) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Extract metadata from audio file
  const extractMetadata = async (file: File): Promise<Partial<AudioTrack>> => {
    try {
      const metadata = await musicMetadata.parseBlob(file);
      const { common, format } = metadata;
      
      let albumArt = '';
      if (common.picture && common.picture.length > 0) {
        const picture = common.picture[0];
        const blob = new Blob([picture.data], { type: picture.format });
        albumArt = URL.createObjectURL(blob);
      }

      // Extract lyrics from metadata
      let lyrics = '';
      
      console.log('Extracting lyrics for:', file.name); // Debug log
      
      if (common.lyrics && common.lyrics.length > 0) {
        lyrics = common.lyrics[0];
        console.log('Found common.lyrics:', lyrics.substring(0, 100)); // Debug log
      }
      
      let lrcLyrics: LyricLine[] | undefined;
      
      if (!lyrics && metadata.native) {
        // ID3v2 tags - only look for USLT (standard lyrics tag)
        if (metadata.native.id3v2) {
          const usltTag = metadata.native.id3v2.find(tag => tag.id === 'USLT');
          if (usltTag && usltTag.value) {
            if (typeof usltTag.value === 'string') {
              lyrics = usltTag.value;
            } else if (usltTag.value.text) {
              lyrics = usltTag.value.text;
            } else if (usltTag.value.description && usltTag.value.lyrics) {
              lyrics = usltTag.value.lyrics;
            }
          }
        }
        
        // Vorbis comments - only look for LYRICS tag
        if (!lyrics && metadata.native.vorbis) {
          const lyricsTag = metadata.native.vorbis.find(tag => 
            tag.id === 'LYRICS'
          );
          if (lyricsTag && lyricsTag.value) {
            lyrics = lyricsTag.value;
          }
        }
      }
      
      if (lyrics) {
        lyrics = lyrics.trim();
        
        // Remove language prefix if present
        lyrics = lyrics.replace(/^[a-z]{2,3}\|\|/i, '');
        
        lyrics = lyrics.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        lyrics = lyrics.replace(/\n{3,}/g, '\n\n');
        
        // Parse LRC format if it contains timestamp patterns
        if (/\[\d{1,2}:\d{2}[\.\:]\d{2}\]/.test(lyrics)) {
          lrcLyrics = parseLrcFormat(lyrics);
          lyrics = ''; // Clear simple lyrics since we have LRC
        }
      }

      return {
        title: common.title || file.name.replace(/\.[^/.]+$/, ""),
        artist: common.artist || "Unknown Artist",
        album: common.album || "Unknown Album",
        year: common.year,
        genre: common.genre && common.genre.length > 0 ? common.genre[0] : undefined,
        duration: format.duration || 0,
        albumArt,
        lyrics,
        lrcLyrics
      };
    } catch (error) {
      console.warn('Failed to extract metadata:', error);
      return {
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Unknown Artist",
        album: "Unknown Album",
        duration: 0,
        lyrics: ''
      };
    }
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/')
    );
    
    const lrcFiles = Array.from(files).filter(file => 
      file.name.toLowerCase().endsWith('.lrc')
    );

    console.log('Processing files:', audioFiles.length, 'audio files,', lrcFiles.length, 'LRC files'); // Debug log

    // Create a map of LRC files by their base name (without extension)
    const lrcMap = new Map<string, File>();
    lrcFiles.forEach(file => {
      const baseName = file.name.replace(/\.lrc$/i, '').toLowerCase();
      console.log('Adding LRC file to map:', baseName, '→', file.name); // Debug log
      lrcMap.set(baseName, file);
    });

    const newTracks: AudioTrack[] = [];
    
    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      const metadata = await extractMetadata(file);
      
      // Check for corresponding LRC file
      const audioBaseName = file.name.replace(/\.[^/.]+$/, '').toLowerCase();
      const lrcFile = lrcMap.get(audioBaseName);
      let lrcLyrics: LyricLine[] | undefined;
      
      console.log('Looking for LRC file for:', audioBaseName, 'Found:', !!lrcFile); // Debug log
      
      if (lrcFile) {
        try {
          const lrcContent = await lrcFile.text();
          console.log('LRC content length:', lrcContent.length); // Debug log
          lrcLyrics = parseLrcFormat(lrcContent);
          console.log('Parsed LRC lyrics length:', lrcLyrics.length); // Debug log
        } catch (error) {
          console.warn('Failed to read LRC file:', error);
        }
      }

      const track: AudioTrack = {
        id: `${Date.now()}-${i}`,
        title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
        artist: metadata.artist || "Unknown Artist",
        album: metadata.album || "Unknown Album",
        year: metadata.year,
        genre: metadata.genre,
        duration: metadata.duration || 0,
        file,
        url: URL.createObjectURL(file),
        isActive: playlist.length === 0 && i === 0,
        albumArt: metadata.albumArt,
        lyrics: metadata.lyrics || '',
        lrcLyrics: lrcLyrics || metadata.lrcLyrics
      };
      
      newTracks.push(track);
    }

    setPlaylist(prev => {
      // Filter out duplicates based on file name and size
      const filteredTracks = newTracks.filter(newTrack => {
        return !prev.some(existingTrack => 
          existingTrack.file.name === newTrack.file.name && 
          existingTrack.file.size === newTrack.file.size
        );
      });
      
      const duplicateCount = newTracks.length - filteredTracks.length;
      if (duplicateCount > 0) {
        console.log(`Skipped ${duplicateCount} duplicate track${duplicateCount > 1 ? 's' : ''}`);
      }
      
      const updated = [...prev, ...filteredTracks];
      if (prev.length === 0 && updated.length > 0) {
        updated[0].isActive = true;
      }
      return updated;
    });

    if (playlist.length === 0 && newTracks.length > 0) {
      setCurrentTrackIndex(0);
    }
  }, [playlist.length, setPlaylist, setCurrentTrackIndex]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    try {
      e.preventDefault();
    } catch {
      // Ignore passive event listener error
    }
    
    // Check if any of the dragged files are audio or LRC files
    const items = Array.from(e.dataTransfer.items);
    const hasValidFiles = items.some(item => {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        return file && (file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.lrc'));
      }
      return false;
    });
    
    if (hasValidFiles) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    try {
      e.preventDefault();
    } catch {
      // Ignore passive event listener error
    }
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    try {
      e.preventDefault();
    } catch {
      // Ignore passive event listener error
    }
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  return {
    isDragOver,
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};
