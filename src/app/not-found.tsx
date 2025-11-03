'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center relative px-4"
      style={{
        background: 'rgba(20, 20, 28, 0.92)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='white' fill-opacity='0'/%3E%3Ccircle cx='20' cy='20' r='1' fill='white' fill-opacity='0.04'/%3E%3C/svg%3E")`,
        backgroundBlendMode: 'overlay',
      }}
    >
      <div className="flex flex-col items-center justify-center gap-8 max-w-2xl">
        {/* SVG Illustration */}
        <div className="relative select-none cursor-pointer transition-transform duration-300 hover:scale-105">
          <Image
            className="w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px]"
            width={320}
            height={320}
            sizes="(max-width: 640px) 240px, (max-width: 768px) 280px, 320px"
            alt="Page not found"
            src="/images/not-found.svg"
            priority
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />
        </div>

        {/* Content */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold text-white">
              404
            </h1>
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              Page Not Found
            </h2>
          </div>
          
          <p className="text-sm sm:text-base leading-[150%] text-white/70 max-w-md">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>

          {/* Action Button */}
          <div className="flex flex-row items-center gap-3 mt-2">
            <Link
              href="/"
              className="flex flex-row items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl bg-white border border-white/30 shadow transition-all duration-200 hover:bg-white hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white text-black text-sm md:text-base font-medium"
              style={{ backdropFilter: 'blur(4px)' }}
            >
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
