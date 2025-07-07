'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';

interface AboutPopupProps {
  show: boolean;
  onClose: () => void;
  isPlaying?: boolean;
}

const Logo: React.FC = () => {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="w-24 h-24 mx-auto mb-6">
      <Image
        src="/images/aw-logo.svg"
        alt="AudioWeb Logo"
        width={96}
        height={96}
        className="w-full h-full object-contain select-none"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        draggable={false}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      />
    </div>
  );
};

const TechStackItem: React.FC<{ 
  icon: React.ReactNode; 
  name: string; 
  description: string; 
}> = ({ icon, name, description }) => (
  <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200">
    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1 text-left">
      <div className="text-sm font-medium text-white text-left">{name}</div>
      <div className="text-xs text-white/60 text-left">{description}</div>
    </div>
  </div>
);

export const AboutPopup: React.FC<AboutPopupProps> = ({ show, onClose, isPlaying = false }) => {
  // Play a pleasant sound effect when popup opens (only if music is playing)
  useEffect(() => {
    if (show && isPlaying) {
      try {
        // Create a brief, pleasant sound effect
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        
        // Create a pleasant ascending chord
        const playNote = (frequency: number, startTime: number, duration: number) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(frequency, startTime);
          oscillator.type = 'sine';
          
          // Smooth envelope
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        };
        
        // Play a pleasant chord progression: C - E - G (C major chord)
        const currentTime = audioContext.currentTime;
        playNote(523.25, currentTime, 0.3); // C5
        playNote(659.25, currentTime + 0.1, 0.3); // E5
        playNote(783.99, currentTime + 0.2, 0.3); // G5
        
      } catch {
        // Silently fail if audio context is not available
      }
    }
  }, [show, isPlaying]);

  if (!show) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(20px) saturate(120%)',
        WebkitBackdropFilter: 'blur(20px) saturate(120%)',
      }}
      onClick={handleBackdropClick}
    >
      <div 
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl p-6"
        style={{
          background: 'rgba(20, 20, 28, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 flex items-center justify-center"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center space-y-6">
          {/* Logo */}
          <Logo />

          {/* Copyright */}
          <div className="flex items-center justify-center gap-2 text-white/80">
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path d="M15 9a3 3 0 0 0-6 0v6a3 3 0 0 0 6 0"/>
            </svg>
            <span className="text-sm">2025 Kasun Chanaka</span>
          </div>

          {/* Introductory Text */}
          <div className="text-center space-y-3">
            <p className="text-white/90 text-sm leading-relaxed">
              A modern audio player built with latest web technologies. 
              Experience seamless music playback with an intuitive interface designed for music enthusiasts.
              This project is still under development, so there maybe rough edges.
            </p>
          </div>

          {/* Technical Stack */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white text-center">Built With</h3>
            <div className="grid grid-cols-1 gap-3">
              <TechStackItem
                icon={
                  <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.354-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.015-4.49-4.491S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117v-6.038H8.148zm7.704 0c-2.476 0-4.49 2.015-4.49 4.49s2.014 4.49 4.49 4.49 4.49-2.014 4.49-4.49-2.014-4.49-4.49-4.49zm0 7.51c-1.665 0-3.019-1.355-3.019-3.02s1.354-3.019 3.019-3.019 3.019 1.355 3.019 3.019-1.354 3.02-3.019 3.02zM8.148 24c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588V24H8.148zm0-7.51c-1.665 0-3.019 1.355-3.019 3.02S6.483 22.529 8.148 22.529h3.117V16.49H8.148z"/>
                  </svg>
                }
                name="Figma"
                description="UI/UX Design"
              />
              <TechStackItem
                icon={
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 01-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 00-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 00-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 01-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 01-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 01.174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 004.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 002.466-2.163 11.944 11.944 0 002.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747C23.472 4.188 18.651.248 12.925.07 12.58.036 11.716.005 11.572 0z"/>
                  </svg>
                }
                name="Next.js"
                description="React Framework"
              />
              <TechStackItem
                icon={
                  <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.15 2.587L18.21.21a1.494 1.494 0 00-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 00-1.276.057L.327 7.261A1 1 0 00.326 8.74L3.899 12 .326 15.26a1 1 0 00.001 1.479L1.65 17.94a.999.999 0 001.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 001.704.29l4.942-2.377A1.5 1.5 0 0024 20.06V3.939a1.5 1.5 0 00-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/>
                  </svg>
                }
                name="VS Code"
                description="Development Environment"
              />
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center space-y-3">
            <p className="text-white/80 text-sm">
              Love open source? Your contributions can make this project even better!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <a
              href="https://paypal.me/AnonymousVX22"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-300 transition-all duration-200 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 18h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zM4 22h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1z"/>
                <path d="M20 8H4V6c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v2zM6 10h12l-1 6H7l-1-6z"/>
                <path d="M17 2H7C5.9 2 5 2.9 5 4v1h14V4c0-1.1-.9-2-2-2z"/>
                <circle cx="9" cy="13" r="1"/>
                <circle cx="15" cy="13" r="1"/>
              </svg>
              <span className="font-medium">Buy me a coffee</span>
            </a>
            
            <a
              href="https://github.com/KasunCSB"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-200 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 10.956.557-.085-.003-.204-.003-.446v-1.611c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.997.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .319-.192.694-.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="font-medium">See me on GitHub</span>
            </a>
          </div>

          {/* AI Credit */}
          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-white/60 text-xs italic">
              This project might not be possible without the help of AI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
