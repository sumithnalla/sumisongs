import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; is_public: boolean }) => Promise<void>;
  initialData?: { name: string; description?: string; is_public?: boolean };
  title?: string;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = 'Create Playlist',
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [isPublic, setIsPublic] = useState(initialData?.is_public ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Playlist name is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), is_public: isPublic });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save playlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#282828] rounded-xl border border-[#3e3e3e] shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-1 text-[#b3b3b3] hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#b3b3b3] mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Playlist"
              className="w-full px-3 py-2 rounded-lg bg-[#3e3e3e] text-white placeholder-[#777] border border-transparent focus:border-[#1db954] focus:outline-none text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#b3b3b3] mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add an optional description"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[#3e3e3e] text-white placeholder-[#777] border border-transparent focus:border-[#1db954] focus:outline-none text-sm resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded text-[#1db954] focus:ring-0 cursor-pointer"
            />
            <label htmlFor="isPublic" className="text-xs text-[#b3b3b3] cursor-pointer select-none">
              Make this playlist public
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#3e3e3e]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-bold text-[#b3b3b3] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-full text-xs font-bold bg-[#1db954] text-black hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
