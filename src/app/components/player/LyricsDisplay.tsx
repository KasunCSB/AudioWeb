import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AudioTrack } from './types';

interface LyricsDisplayProps {
  currentTrack: AudioTrack | null;
  currentTime: number;
}

export const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  currentTrack,
  currentTime
}) => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ y: 0, scrollOffset: 0 });
  const [isManualScrolling, setIsManualScrolling] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const manualScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Set initial value
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get the current active lyric line index based on real-time
  const { currentLineIndex, displayLines } = useMemo(() => {
    if (!currentTrack?.lrcLyrics || currentTrack.lrcLyrics.length === 0) {
      return { currentLineIndex: -1, displayLines: [] };
    }

    const lyrics = currentTrack.lrcLyrics;
    let activeIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }

    return {
      currentLineIndex: activeIndex,
      displayLines: lyrics
    };
  }, [currentTrack?.lrcLyrics, currentTime]);

  // Simple function to set manual scrolling state
  const startManualScrolling = () => {
    setIsManualScrolling(true);
    
    // Clear existing timeout
    if (manualScrollTimeoutRef.current) {
      clearTimeout(manualScrollTimeoutRef.current);
    }
    
    // Reset to auto-scroll after 3 seconds
    manualScrollTimeoutRef.current = setTimeout(() => {
      setIsManualScrolling(false);
    }, 3000);
  };

  // Handle manual scrolling with mouse wheel (desktop only)
  const handleWheel = (e: React.WheelEvent) => {
    if (isMobile) return; // Disable wheel scrolling on mobile
    
    e.preventDefault();
    
    const scrollSpeed = 0.01;
    const deltaY = e.deltaY * scrollSpeed;
    
    setScrollOffset(prev => {
      const visibleLines = 6;
      const maxOffset = Math.max(0, displayLines.length - visibleLines);
      return Math.min(Math.max(prev + deltaY, 0), maxOffset);
    });
    
    startManualScrolling();
  };

  // Handle mouse/touch drag
  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    setDragStart({ y: clientY, scrollOffset });
    startManualScrolling();
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;
    
    const dragSpeed = isMobile ? 0.015 : 0.02; // More sensitive on mobile
    const deltaY = (dragStart.y - clientY) * dragSpeed;
    const newScrollOffset = dragStart.scrollOffset + deltaY;
    
    const visibleLines = isMobile ? 4 : 6;
    const maxOffset = Math.max(0, displayLines.length - visibleLines);
    setScrollOffset(Math.min(Math.max(newScrollOffset, 0), maxOffset));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Mouse event handlers (desktop only)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return; // Disable mouse events on mobile
    e.preventDefault();
    handleDragStart(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return; // Disable mouse events on mobile
    handleDragMove(e.clientY);
  };

  const handleMouseUp = () => {
    if (isMobile) return; // Disable mouse events on mobile
    handleDragEnd();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      handleDragStart(touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      handleDragMove(touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (manualScrollTimeoutRef.current) {
        clearTimeout(manualScrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to current line when not manually scrolling
  useEffect(() => {
    if (!isManualScrolling && currentLineIndex >= 0 && displayLines.length > 0) {        // Use setTimeout to ensure DOM is fully rendered before measuring
        const measureAndScroll = () => {
          if (lyricsContainerRef.current) {
            const children = lyricsContainerRef.current.children;
            if (children.length > 1) {
              // Measure actual distance between two consecutive lines
              const firstLineRect = children[0].getBoundingClientRect();
              const secondLineRect = children[1].getBoundingClientRect();
              const actualLineSpacing = secondLineRect.top - firstLineRect.top;
              
              // Get root font size for accurate rem calculation
              const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
              const actualLineSpacingRem = actualLineSpacing / rootFontSize;
              
              // More responsive adjustment factor based on screen size
              const expectedSpacing = isMobile ? 3.5 : 4; // Increased mobile spacing
              const adjustmentFactor = actualLineSpacingRem / expectedSpacing;
              
              // Calculate target position - position current line 3 lines from top
              const targetVisiblePosition = 3; // Fixed position: 3 lines from top
              const rawTargetOffset = Math.max(0, currentLineIndex - targetVisiblePosition);
              const adjustedTargetOffset = rawTargetOffset * adjustmentFactor;
              
              const visibleLines = isMobile ? 5 : 6;
              const maxRawOffset = Math.max(0, displayLines.length - visibleLines);
              const maxAdjustedOffset = maxRawOffset * adjustmentFactor;
              const finalScrollOffset = Math.min(adjustedTargetOffset, maxAdjustedOffset);
              
              setScrollOffset(finalScrollOffset);
              return;
            }
          }
          
          // Fallback to simple positioning if measurement fails
          const targetVisiblePosition = 3; // Fixed position: 3 lines from top
          const visibleLines = isMobile ? 5 : 6;
          const targetScrollOffset = Math.max(0, currentLineIndex - targetVisiblePosition);
          const maxScrollOffset = Math.max(0, displayLines.length - visibleLines);
          const finalScrollOffset = Math.min(targetScrollOffset, maxScrollOffset);
          
          setScrollOffset(finalScrollOffset);
        };
      
      // Small delay to ensure rendering is complete
      setTimeout(measureAndScroll, 50);
    }
  }, [currentLineIndex, isManualScrolling, displayLines.length, isMobile]);

  // Reset when track changes
  useEffect(() => {
    if (currentTrack) {
      setScrollOffset(0);
      setIsDragging(false);
      setIsManualScrolling(false);
      
      // Clear any pending timeouts
      if (manualScrollTimeoutRef.current) {
        clearTimeout(manualScrollTimeoutRef.current);
        manualScrollTimeoutRef.current = null;
      }
    }
  }, [currentTrack]);

  // Add global mouse move and up listeners when dragging (desktop only)
  useEffect(() => {
    if (isMobile) return; // Skip global mouse events on mobile
    
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dragSpeed = 0.02;
        const deltaY = (dragStart.y - e.clientY) * dragSpeed;
        const newScrollOffset = dragStart.scrollOffset + deltaY;
        
        const visibleLines = 6;
        const maxOffset = Math.max(0, displayLines.length - visibleLines);
        setScrollOffset(Math.min(Math.max(newScrollOffset, 0), maxOffset));
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, displayLines.length, isMobile]);

  if (!currentTrack) {
    return (
      <div className="h-full flex items-center justify-center px-4 py-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white/60 mb-2">No Track Selected</h3>
          <p className="text-white/40">Select a track to view lyrics</p>
        </div>
      </div>
    );
  }

  // Show LRC lyrics if available
  if (currentTrack.lrcLyrics && currentTrack.lrcLyrics.length > 0) {
    return (
      <div className="h-full flex flex-col px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 flex-shrink-0 gap-2 sm:gap-0">
          <h3 className="text-lg sm:text-xl font-semibold text-white">Lyrics</h3>
          <div className="text-xs sm:text-sm text-white/60 truncate">
            {currentTrack.title} - {currentTrack.artist}
          </div>
        </div>
        
        <div className="flex-1 relative overflow-hidden px-1 sm:px-2 py-1 sm:py-2">
          {/* Lyrics container - always start from beginning, scroll when needed */}
          <div 
            ref={containerRef}
            className={`h-full select-none ${isMobile ? 'touch-pan-y' : ''}`}
            style={{ 
              cursor: isMobile ? 'default' : (isDragging ? 'grabbing' : 'grab'),
              scrollbarWidth: 'none', /* Firefox */
              msOverflowStyle: 'none', /* IE and Edge */
              touchAction: isMobile ? 'pan-y' : 'none' /* Allow vertical scrolling on mobile only */
            }}
            onWheel={!isMobile ? handleWheel : undefined}
            onMouseDown={!isMobile ? handleMouseDown : undefined}
            onMouseMove={!isMobile ? handleMouseMove : undefined}
            onMouseUp={!isMobile ? handleMouseUp : undefined}
            onTouchStart={isMobile ? handleTouchStart : undefined}
            onTouchMove={isMobile ? handleTouchMove : undefined}
            onTouchEnd={isMobile ? handleTouchEnd : undefined}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none; /* Chrome, Safari and Opera */
              }
            `}</style>
            <div 
              ref={lyricsContainerRef}
              className="space-y-2 sm:space-y-3 max-w-4xl mx-auto transition-transform duration-700 ease-out"
              style={{
                transform: `translateY(${-scrollOffset * (isMobile ? 3.5 : 4)}rem)`,
                paddingBottom: isMobile ? '40vh' : '30vh' // Add bottom padding for last lyrics
              }}
            >
              {displayLines.map((line, index) => {
                const isCurrentLine = index === currentLineIndex;
                
                return (
                  <div
                    key={index}
                    className={`lyrics-line text-center leading-relaxed px-2 sm:px-3 py-1 sm:py-2 transition-all duration-500 ease-out ${
                      isCurrentLine
                        ? 'text-white text-lg sm:text-2xl font-medium opacity-100 lyrics-active'
                        : 'text-white/40 text-base sm:text-xl opacity-60'
                    }`}
                    style={{
                      textShadow: isCurrentLine ? '0 2px 8px rgba(255, 255, 255, 0.1)' : 'none',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto',
                      lineHeight: isMobile ? '1.3' : '1.4',
                      margin: '0 auto',
                      maxWidth: '100%',
                      minHeight: isMobile ? '3rem' : '2.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      whiteSpace: 'normal',
                      WebkitHyphens: 'auto',
                      MozHyphens: 'auto',
                      msHyphens: 'auto'
                    }}
                  >
                    <span className="block w-full px-2">{line.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show simple lyrics if available
  if (currentTrack.lyrics) {
    return (
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-3 gap-1 sm:gap-0">
          <h3 className="text-lg sm:text-xl font-semibold text-white">Lyrics</h3>
          <div className="text-xs sm:text-sm text-white/60 truncate">
            {currentTrack.title} - {currentTrack.artist}
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-1 sm:px-2">
          <div className="text-white/80 leading-relaxed whitespace-pre-line text-base sm:text-lg text-center px-2 sm:px-3"
               style={{
                 wordBreak: 'break-word',
                 overflowWrap: 'break-word',
                 hyphens: 'auto',
                 WebkitHyphens: 'auto',
                 MozHyphens: 'auto',
                 msHyphens: 'auto'
               }}>
            {currentTrack.lyrics}
          </div>
        </div>
      </div>
    );
  }

  // No lyrics available
  return (
    <div className="h-full flex items-center justify-center px-4 py-4">
      <div className="text-center max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white/60 mb-2">No Lyrics Available</h3>
        <p className="text-white/40">This track doesn&apos;t have a LRC file</p>
      </div>
    </div>
  );
};
