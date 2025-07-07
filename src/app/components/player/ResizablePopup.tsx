import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ResizablePopupProps {
  show: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export const ResizablePopup: React.FC<ResizablePopupProps> = ({
  show,
  position,
  onClose,
  onMouseDown,
  title,
  children,
  className = '',
  style = {},
  minWidth = 320,
  minHeight = 200,
  maxWidth,
  maxHeight
}) => {
  const [size, setSize] = useState({ 
    width: Math.max(minWidth, 400), 
    height: Math.max(minHeight, 500) 
  });
  const [isMobile, setIsMobile] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const popupRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleResizeStart = useCallback((direction: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  }, [size]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    let newWidth = size.width;
    let newHeight = size.height;

    if (isResizing.includes('right')) {
      newWidth = Math.max(minWidth, resizeStart.width + deltaX);
      if (maxWidth) newWidth = Math.min(maxWidth, newWidth);
    }
    if (isResizing.includes('left')) {
      newWidth = Math.max(minWidth, resizeStart.width - deltaX);
      if (maxWidth) newWidth = Math.min(maxWidth, newWidth);
    }
    if (isResizing.includes('bottom')) {
      newHeight = Math.max(minHeight, resizeStart.height + deltaY);
      if (maxHeight) newHeight = Math.min(maxHeight, newHeight);
    }
    if (isResizing.includes('top')) {
      newHeight = Math.max(minHeight, resizeStart.height - deltaY);
      if (maxHeight) newHeight = Math.min(maxHeight, newHeight);
    }

    setSize({ width: newWidth, height: newHeight });
  }, [isResizing, resizeStart, size, minWidth, minHeight, maxWidth, maxHeight]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (!show) return null;

  const resizeHandles = [
    { direction: 'right', className: 'absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize' },
    { direction: 'bottom', className: 'absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize' },
    { direction: 'bottom-right', className: 'absolute bottom-0 right-0 w-3 h-3 cursor-nw-resize' },
  ];

  return (
    <div 
      ref={popupRef}
      className={`fixed z-40 ${className}`}
      style={{
        left: isMobile ? '50%' : `${position.x}px`,
        top: isMobile ? '50%' : `${position.y}px`,
        transform: isMobile ? 'translate(-50%, -50%)' : 'none',
        width: isMobile ? '90vw' : `${size.width}px`,
        height: isMobile ? '80vh' : `${size.height}px`,
        maxWidth: isMobile ? '400px' : 'none',
        maxHeight: isMobile ? '600px' : 'none',
        ...style
      }}
    >
      <div 
        className="h-full rounded-[20px] overflow-hidden relative"
        style={{
          background: 'rgba(20, 20, 28, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 16px 64px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="p-6 h-full popup-content">
          <div 
            className="flex items-center justify-between mb-6 cursor-move select-none flex-shrink-0 pb-4 border-b border-white/10"
            onMouseDown={onMouseDown}
          >
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="scroll-content custom-scrollbar" ref={scrollContentRef}>
            {children}
          </div>
        </div>
        
        {/* Resize Handles - Only show on desktop */}
        {!isMobile && resizeHandles.map(({ direction, className }) => (
          <div
            key={direction}
            className={`${className} hover:bg-white/20 transition-colors duration-200`}
            onMouseDown={(e) => handleResizeStart(direction, e)}
          />
        ))}
      </div>
    </div>
  );
};
