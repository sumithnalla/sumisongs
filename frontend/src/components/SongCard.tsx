import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Music, MoreVertical, Pencil, ExternalLink } from 'lucide-react';
import { Song } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { EditSongModal } from './EditSongModal';

interface SongCardProps {
  song: Song;
  allSongs?: Song[];
  onSongUpdated?: (updated: Song) => void;
}

export const SongCard: React.FC<SongCardProps> = ({ song, allSongs, onSongUpdated }) => {
  const navigate = useNavigate();
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
  const [songData, setSongData] = useState<Song>(song);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSongData(song);
  }, [song]);

  // Click outside to close dropdown
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

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(songData, allSongs);
    }
  };

  const handleUpdated = (updated: Song) => {
    setSongData(updated);
    if (onSongUpdated) onSongUpdated(updated);
  };

  return (
    <>
      <div
        onClick={handlePlay}
        className="group p-3 sm:p-4 rounded-xl bg-theme-card hover:bg-theme-card-hover border border-theme-subtle transition-all duration-200 cursor-pointer flex flex-col relative select-none shadow-sm active:scale-[0.98]"
      >
        {/* Cover Image Container */}
        <div className="w-full aspect-square rounded-lg bg-theme-elevated mb-3 relative shadow-md">
          {/* Scoped overflow hidden for cover image only */}
          <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center">
            {songData.cover_url ? (
              <img
                src={songData.cover_url}
                alt={songData.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-theme-elevated flex items-center justify-center">
                <Music className="w-10 h-10 text-theme-muted" />
              </div>
            )}
          </div>

          {/* 3-Dots Menu Trigger on Card */}
          <div className="absolute top-2 right-2 z-20" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all shadow-md active:scale-90"
              aria-label="Song options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Desktop Dropdown Menu */}
            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="hidden sm:block absolute right-0 mt-1 w-44 rounded-xl bg-theme-surface border border-theme-medium shadow-2xl py-1 z-40 text-xs text-theme-primary animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(`/song/${songData.id}`);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-theme-card flex items-center gap-2 text-theme-primary transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>View song screen</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setEditModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-theme-card flex items-center gap-2 text-theme-primary transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit song details</span>
                </button>
              </div>
            )}
          </div>

          {/* Floating Play Button */}
          <button
            onClick={handlePlay}
            className={`absolute bottom-2 right-2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1db954] shadow-xl flex items-center justify-center text-black transition-all duration-250 hover:scale-110 active:scale-95 z-10 ${
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
        <h3
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/song/${songData.id}`);
          }}
          className={`font-bold text-xs sm:text-sm truncate mb-0.5 hover:underline ${
            isCurrent ? 'text-[#1db954]' : 'text-theme-primary'
          }`}
          title="Click to view song page"
        >
          {songData.title}
        </h3>
        <p className="text-[11px] sm:text-xs text-theme-secondary truncate">{songData.artist}</p>
      </div>

      {/* Mobile Action Sheet (Fixed at bottom of screen, Spotify Mobile style) */}
      {menuOpen && (
        <div
          className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-theme-surface border-t border-theme-subtle rounded-t-2xl p-5 pb-8 space-y-4 animate-in slide-in-from-bottom duration-250 shadow-2xl"
          >
            {/* Grab Handle */}
            <div className="w-10 h-1 bg-theme-medium rounded-full mx-auto -mt-1 mb-2" />

            {/* Song Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-theme-subtle">
              <div className="w-12 h-12 rounded-lg bg-theme-elevated overflow-hidden shrink-0 flex items-center justify-center">
                {songData.cover_url ? (
                  <img src={songData.cover_url} alt={songData.title} className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-6 h-6 text-theme-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-theme-primary truncate">{songData.title}</h4>
                <p className="text-xs text-theme-secondary truncate">{songData.artist}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate(`/song/${songData.id}`);
                }}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-theme-card active:bg-theme-card text-sm font-medium text-theme-primary transition-colors text-left"
              >
                <ExternalLink className="w-5 h-5 text-sky-400" />
                <span>View song screen</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  setEditModalOpen(true);
                }}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-theme-card active:bg-theme-card text-sm font-medium text-theme-primary transition-colors text-left"
              >
                <Pencil className="w-5 h-5 text-amber-400" />
                <span>Edit song details</span>
              </button>
            </div>

            <button
              onClick={() => setMenuOpen(false)}
              className="w-full py-3 rounded-xl bg-theme-card hover:bg-theme-card-hover font-semibold text-xs text-theme-secondary uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Song Modal */}
      <EditSongModal
        song={songData}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onUpdated={handleUpdated}
      />
    </>
  );
};
