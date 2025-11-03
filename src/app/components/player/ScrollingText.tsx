import { useEffect, useRef, useState } from 'react';

interface ScrollingTextProps {
  text: string;
  className?: string;
  speed?: number; // Pixels per second
  pauseOnHover?: boolean;
  pauseDuration?: number; // Pause at each end in ms
}

export const ScrollingText: React.FC<ScrollingTextProps> = ({
  text,
  className = '',
  speed = 50,
  pauseOnHover = false,
  pauseDuration = 1000,
}) => {
  // Edge case: Validate and sanitize props
  const safeSpeed = Math.max(1, Math.min(speed, 1000)); // Between 1 and 1000 px/s
  const safePauseDuration = Math.max(0, Math.min(pauseDuration, 10000)); // Between 0 and 10 seconds
  const safeText = text || ''; // Handle null/undefined text
  
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number | null>(null);
  const stateRef = useRef<{
    phase: 'scrolling-right' | 'pause-right' | 'scrolling-left' | 'pause-left';
    progress: number;
    phaseStartTime: number;
  }>({
    phase: 'pause-left',
    progress: 0,
    phaseStartTime: 0,
  });

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.scrollWidth;
        
        // Edge case: Zero or negative dimensions
        if (containerWidth <= 0 || textWidth <= 0) {
          setShouldScroll(false);
          return;
        }
        
        const needsScroll = textWidth > containerWidth + 5; // 5px buffer
        setShouldScroll(needsScroll);
        
        // Reset to start if text changes
        if (textRef.current) {
          textRef.current.style.transform = 'translateX(0)';
        }
        
        // Edge case: Ensure valid timestamp
        const now = performance.now();
        if (!isFinite(now) || now < 0) {
          stateRef.current.phaseStartTime = 0;
        } else {
          stateRef.current.phaseStartTime = now;
        }
        
        stateRef.current = {
          phase: 'pause-left',
          progress: 0,
          phaseStartTime: stateRef.current.phaseStartTime,
        };
      }
    };

    // Check on mount and when text changes
    checkOverflow();

    // Edge case: Empty text
    if (!text || text.trim().length === 0) {
      setShouldScroll(false);
      return;
    }

    // Check on resize
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [text]);

  useEffect(() => {
    if (!shouldScroll || !textRef.current || isPaused) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (textRef.current && !shouldScroll) {
        textRef.current.style.transform = 'translateX(0)';
      }
      return;
    }

    const element = textRef.current;
    const container = containerRef.current;
    
    // Edge case: Container or element not available
    if (!container || !element) {
      return;
    }

    const containerWidth = container.offsetWidth;
    const textWidth = element.scrollWidth;
    const maxScroll = textWidth - containerWidth;

    // Edge case: No scroll distance (shouldn't happen due to shouldScroll check, but safety)
    if (maxScroll <= 0) {
      element.style.transform = 'translateX(0)';
      return;
    }

    // Use validated speed from props
    const effectiveSpeed = safeSpeed;

    // Initialize start time
    stateRef.current.phaseStartTime = performance.now();

    const animate = (timestamp: number) => {
      // Edge case: Element removed from DOM during animation
      if (!element.isConnected) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        return;
      }

      const state = stateRef.current;
      const elapsed = timestamp - state.phaseStartTime;

      switch (state.phase) {
        case 'pause-left': {
          // Pause at start position
          element.style.transform = 'translateX(0)';
          if (elapsed >= safePauseDuration) {
            state.phase = 'scrolling-right';
            state.progress = 0;
            state.phaseStartTime = timestamp;
          }
          break;
        }

        case 'scrolling-right': {
          // Scroll from left to right (text moves left)
          const duration = (maxScroll / effectiveSpeed) * 1000; // ms
          // Edge case: Prevent NaN or Infinity
          const safeDuration = Math.max(duration, 100); // Minimum 100ms
          state.progress = Math.min(elapsed / safeDuration, 1);
          const position = Math.max(0, Math.min(state.progress * maxScroll, maxScroll));
          element.style.transform = `translateX(-${position}px)`;
          
          if (state.progress >= 1) {
            state.phase = 'pause-right';
            state.progress = 0;
            state.phaseStartTime = timestamp;
            // Ensure we're at exact end position
            element.style.transform = `translateX(-${maxScroll}px)`;
          }
          break;
        }

        case 'pause-right': {
          // Pause at end position
          element.style.transform = `translateX(-${maxScroll}px)`;
          if (elapsed >= safePauseDuration) {
            state.phase = 'scrolling-left';
            state.progress = 0;
            state.phaseStartTime = timestamp;
          }
          break;
        }

        case 'scrolling-left': {
          // Scroll from right to left (text moves right)
          const duration = (maxScroll / effectiveSpeed) * 1000; // ms
          // Edge case: Prevent NaN or Infinity
          const safeDuration = Math.max(duration, 100); // Minimum 100ms
          state.progress = Math.min(elapsed / safeDuration, 1);
          const position = Math.max(0, Math.min(maxScroll * (1 - state.progress), maxScroll));
          element.style.transform = `translateX(-${position}px)`;
          
          if (state.progress >= 1) {
            state.phase = 'pause-left';
            state.progress = 0;
            state.phaseStartTime = timestamp;
            // Ensure we're at exact start position
            element.style.transform = 'translateX(0)';
          }
          break;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation immediately
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shouldScroll, safeSpeed, safePauseDuration, text, isPaused]);

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        ref={textRef}
        className="inline-block whitespace-nowrap"
        style={{ 
          willChange: shouldScroll ? 'transform' : 'auto',
          transition: 'none', // Disable CSS transitions, use JS animation
        }}
      >
        {safeText}
      </span>
    </div>
  );
};
