import Link from "next/link";

interface BackButtonProps {
  asPage: boolean;
  onClose?: () => void;
}

export const BackButton: React.FC<BackButtonProps> = ({ asPage, onClose }) => {
  if (asPage) {
    return (
      <Link 
        href="/"
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white shadow transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/30 mobile-no-select touch-target"
        style={{ backdropFilter: 'blur(4px)' }}
      >
        <span className="text-lg sm:text-xl">←</span>
        <span className="text-sm sm:text-base">Back to Home</span>
      </Link>
    );
  }

  return (
    <button 
      onClick={onClose}
      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white shadow transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/30 mobile-no-select touch-target"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <span className="text-lg sm:text-xl">←</span>
      <span className="text-sm sm:text-base">Back to Home</span>
    </button>
  );
};
