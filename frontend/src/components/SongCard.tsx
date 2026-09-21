import React from 'react';
import { Play, Pause, Music } from 'lucide-react';
import { Song } from '../types';
import { usePlayer } from '../contexts/PlayerContext';

interface SongCardProps {
  song: Song;
  allSongs?: Song[];
}

export const SongCard: React.FC<SongCardProps> = ({ song, allSongs }) => {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();

  const isCurrent = currentSong?.id === song.id;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, allSongs);
    }
  };

  return (
    <div
      onClick={handlePlay}
      className="group p-3 sm:p-4 rounded-xl bg-theme-card hover:bg-theme-card-hover border border-theme-subtle transition-all duration-200 cursor-pointer flex flex-col relative select-none shadow-sm active:scale-[0.98]"
    >
      {/* Cover Image Container */}
      <div className="w-full aspect-square rounded-lg bg-theme-elevated mb-3 overflow-hidden relative shadow-md flex items-center justify-center">
        {song.cover_url ? (
          <img
            src={song.cover_url}
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-theme-elevated flex items-center justify-center">
            <Music className="w-10 h-10 text-theme-muted" />
          </div>
        )}

        {/* Floating Play Button (always visible on mobile touch or hover on desktop) */}
        <button
          onClick={handlePlay}
          className={`absolute bottom-2 right-2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1db954] shadow-xl flex items-center justify-center text-black transition-all duration-250 hover:scale-110 active:scale-95 ${
            isCurrent && isPlaying
              ? 'opacity-100 translate-y-0 shadow-[#1db954]/40'
              : 'opacity-90 sm:opacity-0 translate-y-0 sm:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
          }`}
          title={isCurrent && isPlaying ? 'Pause' : 'Play'}
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-5 h-5 fill-black" />
          ) : (
            <Play className="w-5 h-5 fill-black ml-0.5" />
          )}
        </button>
      </div>

      {/* Song Details */}
      <h3 className={`font-bold text-xs sm:text-sm truncate mb-0.5 ${isCurrent ? 'text-[#1db954]' : 'text-theme-primary'}`}>
        {song.title}
      </h3>
      <p className="text-[11px] sm:text-xs text-theme-secondary truncate">{song.artist}</p>
    </div>
  );
};
