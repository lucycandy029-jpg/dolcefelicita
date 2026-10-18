import React from 'react';

interface BrandLogoProps {
  variant?: 'compact' | 'full' | 'hero' | 'badge';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ variant = 'compact', className = '' }) => {
  if (variant === 'full' || variant === 'hero') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-white shadow-md border-2 border-[#4a2211]/20 hover:scale-105 transition-transform">
          <img
            src="/logo.svg"
            alt="Felicitá Cookies - Um pedacinho de felicidade em cada mordida"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-0.5 bg-white shadow-sm border border-[#4a2211]/20 ${className}`}>
        <img
          src="/logo.svg"
          alt="Felicitá Cookies"
          className="w-full h-full object-contain rounded-full"
        />
      </div>
    );
  }

  // Compact variant for Header / Navbar
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-11 h-11 rounded-full p-0.5 bg-white shadow-sm border border-[#4a2211]/30 shrink-0 hover:rotate-6 transition-transform">
        <img
          src="/logo.svg"
          alt="Felicitá Cookies"
          className="w-full h-full object-contain rounded-full"
        />
      </div>
      <div className="flex flex-col text-left">
        <span className="text-[17px] font-extrabold text-[#3d1c12] leading-tight tracking-tight font-heading">
          Felicitá
        </span>
        <span className="text-[10px] tracking-widest text-[#7f5347] uppercase font-bold flex items-center gap-1">
          <span className="text-[#9c3e54]">♥</span> COOKIES <span className="text-[#9c3e54]">♥</span>
        </span>
      </div>
    </div>
  );
};
