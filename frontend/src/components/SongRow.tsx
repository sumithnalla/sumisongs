import React, { useState } from 'react';
import { Play, Pause, Heart, MoreVertical, Plus, Trash2, Music } from 'lucide-react';
import { Song } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import { likesApi } from '../api/likes';

interface SongRowProps {
  song: Song;
  index: number;
  allSongs?: Song[];
  onDelete?: (songId: string) => void;
  onAddToPlaylist?: (song: Song) => void;
  onRemoveFromPlaylist?: (songId: string) => void;
}

export const SongRow: React.FC<SongRowProps> = ({
  song,
  index,
  allSongs,
  onDelete,
  onAddToPlaylist,
  onRemoveFromPlaylist,
}) => {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
  const { user, isAdmin } = useAuth();
  const [isLiked, setIsLiked] = useState<boolean>(song.is_liked || false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isCurrent = currentSong?.id === song.id;
  const isOwner = user?.id === song.uploaded_by;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, allSongs);
    }
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isLiked) {
        await likesApi.unlikeSong(song.id);
        setIsLiked(false);
      } else {
        await likesApi.likeSong(song.id);
        setIsLiked(true);
      }
    } catch (err) {
      console.error('Failed to toggle like on song:', err);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      onClick={handlePlayClick}
      className={`group flex items-center justify-between px-4 py-2.5 rounded-md hover:bg-[#282828] cursor-pointer transition-colors text-sm ${
        isCurrent ? 'bg-[#202020]' : ''
      }`}
    >
      {/* Left: Index & Play Button & Title */}
      <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
        {/* Index or Play icon */}
        <div className="w-6 text-center text-xs text-[#b3b3b3] group-hover:hidden shrink-0">
          {isCurrent && isPlaying ? (
            <div className="w-3.5 h-3.5 mx-auto flex items-end justify-between">
              <span className="w-0.5 bg-[#1db954] h-full animate-bounce" />
              <span className="w-0.5 bg-[#1db954] h-2/3 animate-bounce delay-75" />
              <span className="w-0.5 bg-[#1db954] h-4/5 animate-bounce delay-150" />
            </div>
          ) : (
            <span className={isCurrent ? 'text-[#1db954] font-bold' : ''}>{index + 1}</span>
          )}
        </div>

        <button
          onClick={handlePlayClick}
          className="w-6 hidden group-hover:flex items-center justify-center text-white shrink-0"
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white ml-0.5" />
          )}
        </button>

        {/* Cover thumbnail */}
        <div className="w-10 h-10 rounded bg-[#2a2a2a] shrink-0 overflow-hidden flex items-center justify-center">
          {song.cover_url ? (
            <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <Music className="w-5 h-5 text-[#888]" />
          )}
        </div>

        {/* Title & Artist */}
        <div className="min-w-0 flex-1">
          <p className={`font-semibold truncate ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>
            {song.title}
          </p>
          <p className="text-xs text-[#b3b3b3] truncate">{song.artist}</p>
        </div>
      </div>

      {/* Album */}
      <div className="hidden md:block w-1/4 text-xs text-[#b3b3b3] truncate pr-4">
        {song.album || 'Single'}
      </div>

      {/* Duration & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={handleLikeClick}
          className={`p-1.5 transition-colors ${
            isLiked ? 'text-[#1db954]' : 'text-transparent group-hover:text-[#b3b3b3] hover:text-white'
          }`}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        <span className="text-xs text-[#b3b3b3] font-mono w-10 text-right">
          {formatDuration(song.duration)}
        </span>

        {/* Options Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="p-1 text-[#b3b3b3] hover:text-white rounded hover:bg-[#333] transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-1 w-48 rounded-lg bg-[#282828] border border-[#3e3e3e] shadow-xl py-1 z-50 text-xs"
            >
              {onAddToPlaylist && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onAddToPlaylist(song);
                  }}
                  className="w-full text-left px-3 py-2 text-white hover:bg-[#383838] flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to playlist</span>
                </button>
              )}

              {onRemoveFromPlaylist && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRemoveFromPlaylist(song.id);
                  }}
                  className="w-full text-left px-3 py-2 text-[#ff6b6b] hover:bg-[#383838] flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove from playlist</span>
                </button>
              )}

              {(isOwner || isAdmin) && onDelete && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(song.id);
                  }}
                  className="w-full text-left px-3 py-2 text-[#ff6b6b] hover:bg-[#383838] flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete song</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
