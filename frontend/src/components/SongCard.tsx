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
      className="group p-4 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all duration-300 cursor-pointer flex flex-col relative select-none"
    >
      {/* Cover Image Container */}
      <div className="w-full aspect-square rounded-md bg-[#282828] mb-4 overflow-hidden relative shadow-lg flex items-center justify-center">
        {song.cover_url ? (
          <img
            src={song.cover_url}
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#333333] to-[#1e1e1e] flex items-center justify-center">
            <Music className="w-12 h-12 text-[#666]" />
          </div>
        )}

        {/* Floating Play Button */}
        <button
          onClick={handlePlay}
          className={`absolute bottom-2 right-2 w-12 h-12 rounded-full bg-[#1db954] shadow-xl flex items-center justify-center text-black transition-all duration-300 hover:scale-110 active:scale-95 ${
            isCurrent && isPlaying
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0'
          }`}
          title={isCurrent && isPlaying ? 'Pause' : 'Play'}
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-6 h-6 fill-black" />
          ) : (
            <Play className="w-6 h-6 fill-black ml-0.5" />
          )}
        </button>
      </div>

      {/* Song Details */}
      <h3 className={`font-bold text-sm truncate mb-1 ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>
        {song.title}
      </h3>
      <p className="text-xs text-[#b3b3b3] truncate">{song.artist}</p>
    </div>
  );
};
