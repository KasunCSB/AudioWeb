/**
 * Audio utility functions for format validation, file handling, and quality detection
 */

import { AUDIO_FORMATS, SUPPORTED_MIME_TYPES, SUPPORTED_EXTENSIONS, LYRICS_FORMATS, ERROR_MESSAGES } from '@/config/constants';
import { createLogger } from './logger';

const logger = createLogger('AudioUtils');

/**
 * Check if a file is a supported audio format
 */
export function isAudioFile(file: File): boolean {
  // Check MIME type first
  if (file.type && SUPPORTED_MIME_TYPES.includes(file.type as never)) {
    return true;
  }
  
  // Fallback to extension check (some files may not have MIME type)
  const extension = getFileExtension(file.name);
  return SUPPORTED_EXTENSIONS.includes(extension as never);
}

/**
 * Check if a file is a lyrics file
 */
export function isLyricsFile(file: File): boolean {
  const extension = getFileExtension(file.name);
  return extension === LYRICS_FORMATS.LRC.extension || extension === LYRICS_FORMATS.TXT.extension;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : '';
}

/**
 * Get audio format information from file
 */
export function getAudioFormat(file: File): { format: string; description: string } | null {
  const extension = getFileExtension(file.name);
  
  // Find format by extension
  for (const [key, format] of Object.entries(AUDIO_FORMATS)) {
    if (format.extension === extension) {
      return {
        format: key,
        description: format.description,
      };
    }
  }
  
  // Check MIME type if extension not found
  if (file.type) {
    for (const [key, format] of Object.entries(AUDIO_FORMATS)) {
      if (format.mimeTypes.includes(file.type as never)) {
        return {
          format: key,
          description: format.description,
        };
      }
    }
  }
  
  return null;
}

/**
 * Determine if audio format is lossless
 */
export function isLosslessFormat(formatName: string): boolean {
  const losslessFormats = ['FLAC', 'WAV', 'AIFF', 'AIFC', 'APE', 'ALAC', 'WV', 'TTA'];
  return losslessFormats.includes(formatName.toUpperCase());
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration from seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format bitrate for display
 */
export function formatBitrate(bitrate: number): string {
  if (bitrate >= 1000) {
    return `${(bitrate / 1000).toFixed(0)} Mbps`;
  }
  return `${bitrate} kbps`;
}

/**
 * Format sample rate for display
 */
export function formatSampleRate(sampleRate: number): string {
  if (sampleRate >= 1000) {
    return `${(sampleRate / 1000).toFixed(1)} kHz`;
  }
  return `${sampleRate} Hz`;
}

/**
 * Get audio quality description from bitrate and sample rate
 */
export function getQualityDescription(bitrate?: number, sampleRate?: number, lossless?: boolean): string {
  if (lossless) {
    if (sampleRate && sampleRate >= 96000) {
      return 'Hi-Res Lossless';
    }
    return 'Lossless';
  }
  
  if (!bitrate) return 'Unknown';
  
  if (bitrate >= 320) return 'Very High';
  if (bitrate >= 192) return 'High';
  if (bitrate >= 128) return 'Medium';
  return 'Low';
}

/**
 * Sanitize filename for display
 */
export function sanitizeFilename(filename: string): string {
  // Remove extension
  const lastDot = filename.lastIndexOf('.');
  const nameWithoutExt = lastDot !== -1 ? filename.substring(0, lastDot) : filename;
  
  // Replace underscores and hyphens with spaces
  return nameWithoutExt.replace(/[_-]/g, ' ').trim();
}

/**
 * Extract track number from filename (e.g., "01 - Song.mp3" -> 1)
 */
export function extractTrackNumber(filename: string): number | undefined {
  const match = filename.match(/^(\d{1,3})[.\s-]/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Validate audio file size
 */
export function validateFileSize(file: File, maxSizeMB: number = 500): { valid: boolean; error?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit. File size: ${formatFileSize(file.size)}`,
    };
  }
  
  return { valid: true };
}

/**
 * Create a safe object URL with cleanup tracking
 */
const objectURLs = new Set<string>();

export function createObjectURL(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  objectURLs.add(url);
  logger.debug('Created object URL:', url);
  return url;
}

/**
 * Revoke object URL and remove from tracking
 */
export function revokeObjectURL(url: string): void {
  if (objectURLs.has(url)) {
    URL.revokeObjectURL(url);
    objectURLs.delete(url);
    logger.debug('Revoked object URL:', url);
  }
}

/**
 * Clean up all tracked object URLs
 */
export function revokeAllObjectURLs(): void {
  logger.info(`Revoking ${objectURLs.size} object URLs`);
  objectURLs.forEach(url => URL.revokeObjectURL(url));
  objectURLs.clear();
}

/**
 * Get browser audio codec support
 */
export function getBrowserCodecSupport(): Record<string, boolean> {
  const audio = document.createElement('audio');
  
  return {
    mp3: !!audio.canPlayType('audio/mpeg'),
    aac: !!audio.canPlayType('audio/aac') || !!audio.canPlayType('audio/mp4'),
    ogg: !!audio.canPlayType('audio/ogg'),
    opus: !!audio.canPlayType('audio/opus') || !!audio.canPlayType('audio/ogg; codecs="opus"'),
    wav: !!audio.canPlayType('audio/wav'),
    flac: !!audio.canPlayType('audio/flac'),
    webm: !!audio.canPlayType('audio/webm'),
  };
}

/**
 * Check if browser supports a specific audio format
 */
export function canPlayFormat(mimeType: string): boolean {
  const audio = document.createElement('audio');
  const result = audio.canPlayType(mimeType);
  return result === 'probably' || result === 'maybe';
}

/**
 * Get user-friendly error message for audio errors
 */
export function getAudioErrorMessage(error: MediaError | null): string {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR;
  
  switch (error.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return ERROR_MESSAGES.AUDIO_ABORT_ERROR;
    case MediaError.MEDIA_ERR_NETWORK:
      return ERROR_MESSAGES.AUDIO_NETWORK_ERROR;
    case MediaError.MEDIA_ERR_DECODE:
      return ERROR_MESSAGES.AUDIO_DECODE_ERROR;
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return ERROR_MESSAGES.AUDIO_NOT_SUPPORTED;
    default:
      return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clone an object (for non-circular objects)
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  
  const clonedObj = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  
  return clonedObj;
}

/**
 * Generate the accept attribute value for file input
 * Returns a comma-separated list of all supported audio formats and lyrics files
 * Prioritizes extensions for better OS file picker display
 */
export function getFileInputAcceptAttribute(): string {
  // Get all unique extensions (these show up nicely in OS file pickers)
  const extensions = [...new Set(SUPPORTED_EXTENSIONS)];
  
  // Add lyrics file extensions
  const lyricsExtensions = ['.lrc', '.txt'];
  
  // Combine extensions only (MIME types often don't display well in file pickers)
  const allFormats = [
    ...extensions,
    ...lyricsExtensions,
  ];
  
  return allFormats.join(',');
}
