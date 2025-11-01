import { useState, useCallback } from 'react';
import { AudioTrack, LyricLine } from '../types';
import * as musicMetadata from 'music-metadata-browser';

// Parse LRC format lyrics with timing information
const parseLrcFormat = (lrcContent: string): LyricLine[] => {
  // Remove language prefix if present (e.g., "eng||" or "eng:")
  const content = lrcContent.replace(/^[a-z]{2,3}(\|\||:)/i, '').trim();
  
  const lines = content.split('\n');
  const lyrics: LyricLine[] = [];
  
  for (let line of lines) {
    line = line.trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Remove language prefix like "eng||" from individual lines too
    line = line.replace(/^[a-z]{2,3}(\|\||:)/i, '');
    
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

// Extract USLT lyrics using jsmediatags
const extractUSLTLyrics = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    // Dynamically import jsmediatags only on client side
    if (typeof window === 'undefined') {
      resolve('');
      return;
    }
    
    import('jsmediatags').then(({ default: jsmediatags }) => {
      jsmediatags.read(file, {
        onSuccess: (tag: { tags: { USLT?: { lyrics: string }; lyrics?: { lyrics: string }; [key: string]: unknown } }) => {
          console.log('jsmediatags read success, available tags:', Object.keys(tag.tags)); // Debug log
          
          // Check for USLT tag (Unsynchronized lyrics)
          if (tag.tags.USLT && tag.tags.USLT.lyrics) {
            console.log('Found USLT lyrics via jsmediatags, length:', tag.tags.USLT.lyrics.length);
            resolve(tag.tags.USLT.lyrics);
            return;
          }
          
          // Also check for 'lyrics' tag
          if (tag.tags.lyrics && typeof tag.tags.lyrics === 'object' && 'lyrics' in tag.tags.lyrics) {
            console.log('Found lyrics tag via jsmediatags');
            resolve(tag.tags.lyrics.lyrics);
            return;
          }
          
          console.log('No USLT/lyrics found via jsmediatags');
          resolve('');
        },
        onError: (error: { type: string; info: string }) => {
          console.warn('jsmediatags error:', error.type, error.info);
          resolve('');
        }
      });
    }).catch((error: unknown) => {
      console.warn('Failed to load jsmediatags:', error);
      resolve('');
    });
  });
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
      
      console.log('Extracting metadata for:', file.name); // Debug log
      
      let albumArt = '';
      if (common.picture && common.picture.length > 0) {
        const picture = common.picture[0];
        const blob = new Blob([new Uint8Array(picture.data)], { type: picture.format });
        albumArt = URL.createObjectURL(blob);
      }

      // Extract lyrics - first try jsmediatags for USLT
      let lyrics = '';
      let lrcLyrics: LyricLine[] | undefined;
      
      console.log('Attempting to extract USLT lyrics via jsmediatags...');
      const usltLyrics = await extractUSLTLyrics(file);
      
      if (usltLyrics) {
        lyrics = usltLyrics;
        console.log('Successfully extracted USLT lyrics, length:', lyrics.length);
        
        // Check if it's LRC format
        if (/\[\d{1,2}:\d{2}[\.\:]\d{2}\]/.test(lyrics)) {
          console.log('Detected LRC format in USLT lyrics, parsing...');
          lrcLyrics = parseLrcFormat(lyrics);
          console.log('Parsed LRC lyrics from USLT:', lrcLyrics.length, 'lines');
          lyrics = ''; // Clear simple lyrics since we have LRC
        }
      }
      
      // Fallback to music-metadata-browser if no USLT found
      if (!lyrics && !lrcLyrics) {
        console.log('No USLT found, trying music-metadata-browser...');
        
        if (common.lyrics && common.lyrics.length > 0) {
          lyrics = common.lyrics[0];
          console.log('Found common.lyrics:', lyrics.substring(0, 100));
        }
      }
      
      // Process lyrics if found
      if (lyrics && !lrcLyrics) {
        lyrics = lyrics.trim();
        
        console.log('Raw lyrics before processing:', lyrics.substring(0, 200));
        
        // Remove language prefix if present (e.g., "eng||" or "eng:")
        lyrics = lyrics.replace(/^[a-z]{2,3}(\|\||:)/i, '');
        
        lyrics = lyrics.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        lyrics = lyrics.replace(/\n{3,}/g, '\n\n');
        
        // Parse LRC format if it contains timestamp patterns
        if (/\[\d{1,2}:\d{2}[\.\:]\d{2}\]/.test(lyrics)) {
          console.log('Detected LRC format in metadata, parsing...');
          lrcLyrics = parseLrcFormat(lyrics);
          console.log('Parsed LRC lyrics from metadata:', lrcLyrics.length, 'lines');
          lyrics = ''; // Clear simple lyrics since we have LRC
        } else {
          console.log('Using simple lyrics format');
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
          console.log('Parsed LRC lyrics from file length:', lrcLyrics.length); // Debug log
        } catch (error) {
          console.warn('Failed to read LRC file:', error);
        }
      }
      
      // Use LRC file if available, otherwise fall back to metadata LRC lyrics
      const finalLrcLyrics = lrcLyrics || metadata.lrcLyrics;
      const finalLyrics = finalLrcLyrics ? '' : (metadata.lyrics || ''); // Clear simple lyrics if we have LRC
      
      if (finalLrcLyrics) {
        console.log('Using LRC lyrics for', audioBaseName, '- lines:', finalLrcLyrics.length);
      } else if (finalLyrics) {
        console.log('Using simple lyrics for', audioBaseName, '- length:', finalLyrics.length);
      } else {
        console.log('No lyrics found for', audioBaseName);
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
        lyrics: finalLyrics,
        lrcLyrics: finalLrcLyrics
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
