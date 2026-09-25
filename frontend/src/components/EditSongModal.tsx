import React, { useState, useEffect } from 'react';
import { X, Music, User, Disc, Tag, Image, Loader2, Check } from 'lucide-react';
import { Song } from '../types';
import { songsApi } from '../api/songs';
import { usePlayer } from '../contexts/PlayerContext';

interface EditSongModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updatedSong: Song) => void;
}

export const EditSongModal: React.FC<EditSongModalProps> = ({
  song,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { updateCurrentSongMetadata } = usePlayer();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (song) {
      setTitle(song.title || '');
      setArtist(song.artist || '');
      setAlbum(song.album || '');
      setGenre(song.genre || '');
      setCoverUrl(song.cover_url || '');
      setError(null);
      setSavedSuccess(false);
    }
  }, [song]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !song) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      setError('Title and Artist are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload: Partial<Song> = {
        title: title.trim(),
        artist: artist.trim(),
        album: album.trim() || undefined,
        genre: genre.trim() || undefined,
        cover_url: coverUrl.trim() || undefined,
      };

      const updated = await songsApi.updateSong(song.id, payload);

      // Successfully saved to database
      setSavedSuccess(true);

      // Safe update of player state in real time
      try {
        updateCurrentSongMetadata({
          id: song.id,
          title: updated?.title || payload.title,
          artist: updated?.artist || payload.artist,
          album: updated?.album || payload.album,
          genre: updated?.genre || payload.genre,
          cover_url: updated?.cover_url || payload.cover_url,
        });
      } catch (playerErr) {
        console.warn('Player metadata update warning:', playerErr);
      }

      // Safe trigger of parent update callback
      try {
        if (onUpdated && updated) {
          onUpdated(updated);
        }
      } catch (callbackErr) {
        console.warn('Parent onUpdated warning:', callbackErr);
      }

      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      console.error('Error updating song:', err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to update song details. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-theme-surface border border-theme-subtle rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-subtle">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-[#1db954]" />
            <h2 className="text-lg font-bold text-theme-primary">Edit Song Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-card transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Song details updated successfully!</span>
            </div>
          )}

          {/* Cover Preview & Cover URL Row */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-theme-elevated border border-theme-subtle overflow-hidden shrink-0 flex items-center justify-center shadow-md">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Music className="w-8 h-8 text-theme-muted" />
              )}
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-1.5">
                Cover Art URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 pl-9 rounded-lg bg-theme-elevated text-theme-primary placeholder-theme-muted border border-theme-subtle focus:border-[#1db954] focus:outline-none text-xs transition-all"
                />
                <Image className="w-4 h-4 text-theme-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-1.5">
              Song Title <span className="text-[#1db954]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Song title"
                required
                className="w-full px-3 py-2 pl-9 rounded-lg bg-theme-elevated text-theme-primary placeholder-theme-muted border border-theme-subtle focus:border-[#1db954] focus:outline-none text-sm transition-all"
              />
              <Music className="w-4 h-4 text-theme-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Artist */}
          <div>
            <label className="block text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-1.5">
              Artist <span className="text-[#1db954]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist name"
                required
                className="w-full px-3 py-2 pl-9 rounded-lg bg-theme-elevated text-theme-primary placeholder-theme-muted border border-theme-subtle focus:border-[#1db954] focus:outline-none text-sm transition-all"
              />
              <User className="w-4 h-4 text-theme-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Album & Genre Two-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-1.5">
                Album
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  placeholder="Album or Single"
                  className="w-full px-3 py-2 pl-9 rounded-lg bg-theme-elevated text-theme-primary placeholder-theme-muted border border-theme-subtle focus:border-[#1db954] focus:outline-none text-sm transition-all"
                />
                <Disc className="w-4 h-4 text-theme-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-1.5">
                Genre
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Pop, Rock, EDM..."
                  className="w-full px-3 py-2 pl-9 rounded-lg bg-theme-elevated text-theme-primary placeholder-theme-muted border border-theme-subtle focus:border-[#1db954] focus:outline-none text-sm transition-all"
                />
                <Tag className="w-4 h-4 text-theme-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-bold text-theme-secondary hover:text-theme-primary hover:bg-theme-card transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-full text-xs font-bold bg-[#1db954] text-black hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#1db954]/25 flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
