import React from 'react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading your music...',
  fullScreen = true,
}) => {
  return (
    <div
      className={`${
        fullScreen ? 'fixed inset-0 z-50' : 'w-full h-full min-h-[300px]'
      } bg-theme-base flex flex-col items-center justify-center p-6 text-theme-primary transition-colors duration-300 select-none`}
    >
      {/* Background ambient radial glow */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-[#1db954]/10 blur-3xl pointer-events-none -z-10 animate-pulse" />

      {/* Brand Mascot / Logo with pulsing glow */}
      <div className="relative mb-6">
        <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-[#1db954] to-emerald-400 opacity-30 blur-md animate-pulse" />
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden p-0.5 bg-gradient-to-b from-[#1db954] to-emerald-600 shadow-xl shadow-[#1db954]/25">
          <img
            src="/android-chrome-192x192.png"
            alt="SumiSongs"
            className="w-full h-full object-cover rounded-full bg-theme-surface"
          />
        </div>
      </div>

      {/* Brand Title */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-theme-primary flex items-center justify-center gap-1.5">
          <span>SumiSongs</span>
        </h1>
        <p className="text-xs sm:text-sm text-theme-secondary font-medium tracking-wide">
          {message}
        </p>
      </div>

      {/* Modern animated equalizer sound bars */}
      <div className="flex items-center gap-1.5 mt-6 h-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="w-1 bg-[#1db954] rounded-full animate-bounce"
            style={{
              height: `${12 + (i % 3) * 6}px`,
              animationDuration: `${0.6 + i * 0.15}s`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
