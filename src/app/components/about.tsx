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
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M8 24c2.208 0 4-1.792 4-4v-4H8c-2.208 0-4 1.792-4 4s1.792 4 4 4z" fill="#0ACF83"/>
                    <path d="M4 12c0-2.208 1.792-4 4-4h4v8H8c-2.208 0-4-1.792-4-4z" fill="#A259FF"/>
                    <path d="M4 4c0-2.208 1.792-4 4-4h4v8H8C5.792 8 4 6.208 4 4z" fill="#F24E1E"/>
                    <path d="M12 0h4c2.208 0 4 1.792 4 4s-1.792 4-4 4h-4V0z" fill="#FF7262"/>
                    <path d="M20 12c0 2.208-1.792 4-4 4s-4-1.792-4-4 1.792-4 4-4 4 1.792 4 4z" fill="#1ABCFE"/>
                  </svg>
                }
                name="Figma"
                description="UI/UX Design"
              />
              <TechStackItem
                icon={
                  <svg className="w-6 h-6" viewBox="0 0 180 180" fill="none">
                    <mask id="mask0_408_139" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
                      <circle cx="90" cy="90" r="90" fill="black"/>
                    </mask>
                    <g mask="url(#mask0_408_139)">
                      <circle cx="90" cy="90" r="90" fill="black"/>
                      <path d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z" fill="url(#paint0_linear_408_139)"/>
                      <rect x="115" y="54" width="12" height="72" fill="url(#paint1_linear_408_139)"/>
                    </g>
                    <defs>
                      <linearGradient id="paint0_linear_408_139" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white"/>
                        <stop offset="1" stopColor="white" stopOpacity="0"/>
                      </linearGradient>
                      <linearGradient id="paint1_linear_408_139" x1="121" y1="54" x2="120.799" y2="106.875" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white"/>
                        <stop offset="1" stopColor="white" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12M6 8V6a2 2 0 012-2h8a2 2 0 012 2v2M6 8v10a2 2 0 002 2h8a2 2 0 002-2V8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10h1a2 2 0 012 2v2a2 2 0 01-2 2h-1" />
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
