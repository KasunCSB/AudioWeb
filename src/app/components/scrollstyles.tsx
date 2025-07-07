'use client';

/**
 * ScrollStyles Component
 * 
 * Provides global CSS styles to hide scrollbars across all browsers while maintaining
 * scrolling functionality. This ensures a clean, modern UI without visible scrollbars.
 * 
 * Applied globally at the layout level to ensure consistent behavior across:
 * - Home page content
 * - About popup
 * - Contact/Support popup
 * - Player components
 * - Any other scrollable content
 */
export const ScrollStyles = () => (
  <style jsx global>{`
    /* 
     * Universal scrollbar hiding for all elements
     * - scrollbar-width: none (Firefox)
     * - -ms-overflow-style: none (Internet Explorer/Edge)
     * - ::-webkit-scrollbar { display: none } (Chrome, Safari, Opera)
     */
    * {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    *::-webkit-scrollbar {
      display: none;
    }

    /* 
     * Explicit scrollbar hiding for root elements
     * Ensures html and body elements have hidden scrollbars
     */
    html, body {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    html::-webkit-scrollbar, body::-webkit-scrollbar {
      display: none;
    }

    /* 
     * Common HTML elements that might have scrollable content
     * Covers most semantic and layout elements
     */
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

    /* 
     * Custom scrollbar utility classes
     * These classes can be applied to specific elements that need scrolling
     * All variants hide the scrollbar completely while maintaining scroll functionality
     */
    
    /* Standard custom scrollbar class - most commonly used */
    .custom-scrollbar {
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .custom-scrollbar::-webkit-scrollbar {
      display: none;
    }

    /* Enhanced scrollbar for special cases */
    .custom-scrollbar-enhanced {
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .custom-scrollbar-enhanced::-webkit-scrollbar {
      display: none;
    }

    /* Thin scrollbar variant */
    .custom-scrollbar-thin {
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .custom-scrollbar-thin::-webkit-scrollbar {
      display: none;
    }

    /* Invisible scrollbar (explicitly named for clarity) */
    .custom-scrollbar-invisible {
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .custom-scrollbar-invisible::-webkit-scrollbar {
      display: none;
    }

    /* Auto-hide scrollbar - used by main page content */
    .custom-scrollbar-auto {
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .custom-scrollbar-auto::-webkit-scrollbar {
      display: none;
    }

    /* 
     * Mobile touch scrolling optimization
     * Ensures smooth scrolling experience on touch devices
     */
    .custom-scrollbar,
    .custom-scrollbar-enhanced,
    .custom-scrollbar-thin,
    .custom-scrollbar-invisible,
    .custom-scrollbar-auto {
      -webkit-overflow-scrolling: touch;
    }

    /* 
     * Flex container scrolling fix
     * For scrollable content within flexbox layouts
     * Commonly used in popup components and player interfaces
     */
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
  `}</style>
);
