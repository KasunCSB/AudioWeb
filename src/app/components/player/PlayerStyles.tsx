export const PlayerStyles = () => (
  <style jsx global>{`
    .slider::-webkit-slider-thumb {
      appearance: none;
      height: 16px;
      width: 16px;
      border-radius: 50%;
      background: #ffffff;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .slider::-moz-range-thumb {
      height: 16px;
      width: 16px;
      border-radius: 50%;
      background: #ffffff;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    /* Global Scroll Behavior */
    html {
      scroll-behavior: smooth;
      overflow-x: hidden;
    }

    body {
      overflow-x: hidden;
      scroll-behavior: smooth;
    }

    /* Global scrollbar hiding - completely invisible by default */
    * {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    *::-webkit-scrollbar {
      display: none;
    }

    /* Apply hidden scrollbars to html and body specifically */
    html, body {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    html::-webkit-scrollbar, body::-webkit-scrollbar {
      display: none;
    }

    /* Additional common elements that might scroll */
    div, section, main, article, aside, nav, ul, ol, li, pre, code {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    div::-webkit-scrollbar, 
    section::-webkit-scrollbar, 
    main::-webkit-scrollbar, 
    article::-webkit-scrollbar, 
    aside::-webkit-scrollbar, 
    nav::-webkit-scrollbar, 
    ul::-webkit-scrollbar, 
    ol::-webkit-scrollbar, 
    li::-webkit-scrollbar, 
    pre::-webkit-scrollbar, 
    code::-webkit-scrollbar {
      display: none;
    }

    /* Standard Custom Scrollbar - completely invisible */
    .custom-scrollbar {
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .custom-scrollbar::-webkit-scrollbar {
      display: none;
    }

    /* Enhanced Custom Scrollbar - completely invisible */
    .custom-scrollbar-enhanced {
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .custom-scrollbar-enhanced::-webkit-scrollbar {
      display: none;
    }

    /* Thin Custom Scrollbar - completely invisible */
    .custom-scrollbar-thin {
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .custom-scrollbar-thin::-webkit-scrollbar {
      display: none;
    }

    /* Invisible Scrollbar (still functional) */
    .custom-scrollbar-invisible {
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .custom-scrollbar-invisible::-webkit-scrollbar {
      display: none;
    }

    /* Auto-hide Scrollbar - completely invisible */
    .custom-scrollbar-auto {
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .custom-scrollbar-auto::-webkit-scrollbar {
      display: none;
    }

    /* Ensure proper touch scrolling on mobile */
    .custom-scrollbar,
    .custom-scrollbar-enhanced,
    .custom-scrollbar-thin,
    .custom-scrollbar-invisible,
    .custom-scrollbar-auto {
      -webkit-overflow-scrolling: touch;
    }

    /* Fix scrolling in flex containers - completely invisible scrollbar */
    .scroll-container {
      overflow-y: auto;
      min-height: 0;
      flex: 1;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .scroll-container::-webkit-scrollbar {
      display: none;
    }

    /* Popup content scrolling - completely invisible scrollbar */
    .popup-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }

    .popup-content > .scroll-content {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .popup-content > .scroll-content::-webkit-scrollbar {
      display: none;
    }

    /* Page level smooth scrolling */
    .page-scroll {
      scroll-behavior: smooth;
      overflow-x: hidden;
    }

    /* Better mobile scrolling */
    @media (max-width: 768px) {
      * {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      
      *::-webkit-scrollbar {
        display: none;
      }
      
      .custom-scrollbar,
      .custom-scrollbar-enhanced,
      .custom-scrollbar-thin {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      
      .custom-scrollbar::-webkit-scrollbar,
      .custom-scrollbar-enhanced::-webkit-scrollbar,
      .custom-scrollbar-thin::-webkit-scrollbar {
        display: none;
      }

      /* Mobile Touch Optimizations */
      button, input[type="range"], .touch-target {
        min-height: 44px !important;
        min-width: 44px !important;
      }

      /* Enhance touch feedback */
      button, .mobile-touch-feedback {
        -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1);
        transition: transform 0.1s ease, background-color 0.2s ease;
      }

      button:active, .mobile-touch-feedback:active {
        transform: scale(0.98);
      }

      /* Prevent text selection on controls */
      .mobile-no-select, button, input[type="range"] {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }

      /* Better mobile spacing */
      .mobile-spacing {
        padding: 12px 16px;
      }

      /* Improve touch events handling */
      * {
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
      }

      /* Better touch handling for lyrics */
      .lyrics-line {
        touch-action: manipulation;
        -webkit-touch-callout: none;
      }
    }

    /* Safe area support for mobile devices with notches */
    @supports (padding: max(0px)) {
      .pb-safe {
        padding-bottom: max(16px, env(safe-area-inset-bottom));
      }

      .pt-safe {
        padding-top: max(16px, env(safe-area-inset-top));
      }

      .pl-safe {
        padding-left: max(16px, env(safe-area-inset-left));
      }

      .pr-safe {
        padding-right: max(16px, env(safe-area-inset-right));
      }
    }

    /* Ultra-smooth, natural lyrics animations - NO TRANSFORM OR SCALING */
    .lyrics-line {
      transition: opacity 0.6s cubic-bezier(0.25, 0.8, 0.25, 1),
                  color 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
      transform-origin: center;
      will-change: opacity, color;
      white-space: normal;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
      -webkit-hyphens: auto;
      -moz-hyphens: auto;
      -ms-hyphens: auto;
      line-break: auto;
      word-break: break-word;
      contain: layout style;
      backface-visibility: hidden;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Completely separate, ultra-smooth active lyrics transition - NO TRANSFORM OR SCALING */
    .lyrics-active {
      transition: opacity 0.4s cubic-bezier(0.25, 0.8, 0.25, 1),
                  color 0.4s cubic-bezier(0.25, 0.8, 0.25, 1),
                  text-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      transition-delay: 0.02s;
    }

    .lyrics-container {
      transition: transform 1.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Responsive text breaking for lyrics */
    .lyrics-line span {
      display: inline-block;
      max-width: 100%;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
      -webkit-hyphens: auto;
      -moz-hyphens: auto;
      -ms-hyphens: auto;
      transition: inherit;
    }

    /* Prevent text overflow and clipping in lyrics */
    .lyrics-line:hover {
      overflow: visible;
      z-index: 10;
      position: relative;
    }

    /* Ultra-smooth flowing effect for non-active lyrics - NO TRANSFORM */
    .lyrics-line:not(.lyrics-active) {
      transition: opacity 0.8s cubic-bezier(0.25, 0.8, 0.25, 1),
                  color 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    /* Animated Music Bars */
    .music-bar-1 {
      width: 2px;
      background: white;
      border-radius: 9999px;
      animation: musicBar1 1.4s ease-in-out infinite;
    }
    
    .music-bar-2 {
      width: 2px;
      background: white;
      border-radius: 9999px;
      animation: musicBar2 1.1s ease-in-out infinite;
    }
    
    .music-bar-3 {
      width: 2px;
      background: white;
      border-radius: 9999px;
      animation: musicBar3 1.6s ease-in-out infinite;
    }
    
    .music-bar-4 {
      width: 2px;
      background: white;
      border-radius: 9999px;
      animation: musicBar4 1.3s ease-in-out infinite;
    }

    /* Paused Music Bars - Static minimal height */
    .music-bar-paused {
      width: 2px;
      height: 3px;
      background: white;
      border-radius: 9999px;
      opacity: 0.6;
    }
    
    @keyframes musicBar1 {
      0%, 100% { height: 20%; }
      50% { height: 80%; }
    }
    
    @keyframes musicBar2 {
      0%, 100% { height: 40%; }
      25% { height: 90%; }
      75% { height: 30%; }
    }
    
    @keyframes musicBar3 {
      0%, 100% { height: 60%; }
      33% { height: 20%; }
      66% { height: 100%; }
    }
    
    @keyframes musicBar4 {
      0%, 100% { height: 30%; }
      40% { height: 70%; }
      80% { height: 50%; }
    }
  `}</style>
);
