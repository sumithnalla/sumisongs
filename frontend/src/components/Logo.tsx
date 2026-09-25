import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  textSize?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  textSize = 'text-xl font-bold tracking-tight',
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-7 h-7',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-10 h-10',
    xl: 'w-16 h-16 sm:w-20 sm:h-20',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative rounded-full overflow-hidden shrink-0 ring-2 ring-[#1db954]/40 shadow-sm bg-[#1db954]/10 transition-transform duration-200 ${sizeMap[size]}`}
      >
        <img
          src="/android-chrome-192x192.png"
          alt="SumiSongs Logo"
          className="w-full h-full object-cover select-none"
          loading="eager"
        />
      </div>
      {showText && (
        <span className={`text-theme-primary select-none ${textSize}`}>
          SumiSongs
        </span>
      )}
    </div>
  );
};
