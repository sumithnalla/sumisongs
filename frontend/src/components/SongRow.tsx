import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Heart,
  MoreVertical,
  Plus,
  Trash2,
  Music,
  Pencil,
  ExternalLink,
} from 'lucide-react';
import { Song } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import { likesApi } from '../api/likes';
import { EditSongModal } from './EditSongModal';

interface SongRowProps {
  song: Song;
  index: number;
  allSongs?: Song[];
  onDelete?: (songId: string) => void;
  onAddToPlaylist?: (song: Song) => void;
  onRemoveFromPlaylist?: (songId: string) => void;
  onSongUpdated?: (updatedSong: Song) => void;
}

export const SongRow: React.FC<SongRowProps> = ({
  song,
  index,
  allSongs,
  onDelete,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onSongUpdated,
}) => {
  const navigate = useNavigate();
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
  const { user, isAdmin } = useAuth();
  const [songData, setSongData] = useState<Song>(song);
  const [isLiked, setIsLiked] = useState<boolean>(song.is_liked || false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Keep local state in sync if prop changes
  useEffect(() => {
    setSongData(song);
    setIsLiked(song.is_liked || false);
  }, [song]);

  // Click outside to close dropdown menu bugfix
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const isCurrent = currentSong?.id === songData.id;
  const isOwner = user?.id === songData.uploaded_by;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(songData, allSongs);
    }
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isLiked) {
        await likesApi.unlikeSong(songData.id);
        setIsLiked(false);
      } else {
        await likesApi.likeSong(songData.id);
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

  const handleSongUpdated = (updated: Song) => {
    setSongData(updated);
    if (onSongUpdated) {
      onSongUpdated(updated);
    }
  };

  return (
    <>
      <div
        onClick={handlePlayClick}
        className={`group flex items-center justify-between px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-theme-card-hover cursor-pointer transition-colors text-sm border-b border-theme-subtle/50 relative ${
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
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/song/${songData.id}`);
            }}
            title="View song screen"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-theme-elevated shrink-0 overflow-hidden flex items-center justify-center border border-theme-subtle shadow-sm hover:scale-105 transition-transform"
          >
            {songData.cover_url ? (
              <img src={songData.cover_url} alt={songData.title} className="w-full h-full object-cover" />
            ) : (
              <Music className="w-4 h-4 sm:w-5 sm:h-5 text-theme-muted" />
            )}
          </div>

          {/* Title & Artist */}
          <div className="min-w-0 flex-1">
            <p
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/song/${songData.id}`);
              }}
              className={`font-semibold text-xs sm:text-sm truncate hover:underline ${
                isCurrent ? 'text-[#1db954]' : 'text-theme-primary'
              }`}
              title="Click to view song page"
            >
              {songData.title}
            </p>
            <p className="text-[11px] sm:text-xs text-theme-secondary truncate">{songData.artist}</p>
          </div>
        </div>

        {/* Album */}
        <div className="hidden md:block w-1/4 text-xs text-theme-secondary truncate pr-4">
          {songData.album || 'Single'}
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
            {formatDuration(songData.duration)}
          </span>

          {/* Options Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              aria-label="More options"
              className="p-1.5 text-theme-secondary hover:text-theme-primary rounded-lg hover:bg-theme-card transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-1 w-48 rounded-xl bg-theme-surface border border-theme-medium shadow-2xl py-1 z-40 text-xs text-theme-primary animate-in fade-in zoom-in-95 duration-100"
              >
                {/* Dedicated Song Screen */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(`/song/${songData.id}`);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-theme-card flex items-center gap-2.5 text-theme-primary transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>View song screen</span>
                </button>

                {/* Edit details */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setEditModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-theme-card flex items-center gap-2.5 text-theme-primary transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit song details</span>
                </button>

                {/* Add to playlist */}
                {onAddToPlaylist && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onAddToPlaylist(songData);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-theme-card flex items-center gap-2.5 text-theme-primary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#1db954]" />
                    <span>Add to playlist</span>
                  </button>
                )}

                {/* Remove from playlist */}
                {onRemoveFromPlaylist && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onRemoveFromPlaylist(songData.id);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-theme-card flex items-center gap-2.5 text-theme-secondary hover:text-theme-primary transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove from playlist</span>
                  </button>
                )}

                {/* Delete song */}
                {(isOwner || isAdmin) && onDelete && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(songData.id);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-500 flex items-center gap-2.5 transition-colors border-t border-theme-subtle"
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

      {/* Edit Modal */}
      <EditSongModal
        song={songData}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onUpdated={handleSongUpdated}
      />
    </>
  );
};
