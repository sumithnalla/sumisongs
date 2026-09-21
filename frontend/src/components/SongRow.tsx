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
      className={`group flex items-center justify-between px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-theme-card-hover cursor-pointer transition-colors text-sm border-b border-theme-subtle/50 ${
        isCurrent ? 'bg-theme-card shadow-sm font-semibold' : ''
      }`}
    >
      {/* Left: Index & Play Button & Title */}
      <div className="flex items-center gap-2.5 sm:gap-4 flex-1 min-w-0 pr-2 sm:pr-4">
        {/* Index or Play icon */}
        <div className="w-5 sm:w-6 text-center text-xs text-theme-secondary group-hover:hidden shrink-0">
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
          className="w-5 sm:w-6 hidden group-hover:flex items-center justify-center text-theme-primary shrink-0"
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Cover thumbnail */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-theme-elevated shrink-0 overflow-hidden flex items-center justify-center border border-theme-subtle shadow-sm">
          {song.cover_url ? (
            <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <Music className="w-4 h-4 sm:w-5 sm:h-5 text-theme-muted" />
          )}
        </div>

        {/* Title & Artist */}
        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-xs sm:text-sm truncate ${isCurrent ? 'text-[#1db954]' : 'text-theme-primary'}`}>
            {song.title}
          </p>
          <p className="text-[11px] sm:text-xs text-theme-secondary truncate">{song.artist}</p>
        </div>
      </div>

      {/* Album */}
      <div className="hidden md:block w-1/4 text-xs text-theme-secondary truncate pr-4">
        {song.album || 'Single'}
      </div>

      {/* Duration & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button
          onClick={handleLikeClick}
          className={`p-1.5 transition-colors ${
            isLiked
              ? 'text-[#1db954]'
              : 'text-theme-muted group-hover:text-theme-secondary hover:text-theme-primary'
          }`}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        <span className="text-[11px] sm:text-xs text-theme-secondary font-mono w-9 sm:w-10 text-right">
          {formatDuration(song.duration)}
        </span>

        {/* Options Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="p-1.5 text-theme-secondary hover:text-theme-primary rounded-lg hover:bg-theme-card transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-1 w-44 rounded-xl bg-theme-surface border border-theme-medium shadow-2xl py-1 z-40 text-xs text-theme-primary animate-in fade-in zoom-in-95 duration-100"
            >
              {onAddToPlaylist && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onAddToPlaylist(song);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-theme-card flex items-center gap-2 text-theme-primary transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#1db954]" />
                  <span>Add to playlist</span>
                </button>
              )}

              {onRemoveFromPlaylist && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRemoveFromPlaylist(song.id);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-theme-card flex items-center gap-2 text-theme-secondary hover:text-theme-primary transition-colors"
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
                  className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-500 flex items-center gap-2 transition-colors border-t border-theme-subtle"
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
