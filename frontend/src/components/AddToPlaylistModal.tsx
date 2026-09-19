import React, { useState, useEffect } from 'react';
import { X, Check, Music } from 'lucide-react';
import { Song, Playlist } from '../types';
import { playlistsApi } from '../api/playlists';

interface AddToPlaylistModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ song, isOpen, onClose }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    const fetchPlaylists = async () => {
      try {
        const { playlists: data } = await playlistsApi.getPlaylists();
        setPlaylists(data);
      } catch (err) {
        console.error('Failed to load playlists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, [isOpen]);

  if (!isOpen || !song) return null;

  const handleAdd = async (playlistId: string) => {
    setAddingId(playlistId);
    try {
      await playlistsApi.addSong(playlistId, song.id);
      setAddedIds((prev) => new Set([...prev, playlistId]));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add song to playlist');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#282828] rounded-xl border border-[#3e3e3e] shadow-2xl p-5 text-white animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">Add to Playlist</h2>
          <button onClick={onClose} className="p-1 text-[#b3b3b3] hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#b3b3b3] mb-3 truncate">
          Song: <span className="text-white font-medium">{song.title}</span>
        </p>

        <div className="max-h-60 overflow-y-auto space-y-1 my-2">
          {loading ? (
            <p className="text-xs text-[#777] text-center py-4">Loading playlists...</p>
          ) : playlists.length === 0 ? (
            <p className="text-xs text-[#777] text-center py-4">No playlists found. Create one first!</p>
          ) : (
            playlists.map((pl) => {
              const isAdded = addedIds.has(pl.id);
              return (
                <div
                  key={pl.id}
                  onClick={() => !isAdded && handleAdd(pl.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-sm cursor-pointer transition-colors ${
                    isAdded ? 'bg-[#1db954]/20 text-[#1db954]' : 'hover:bg-[#383838] text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-[#3e3e3e] flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-[#aaa]" />
                    </div>
                    <span className="truncate text-xs font-medium">{pl.name}</span>
                  </div>

                  {isAdded ? (
                    <Check className="w-4 h-4 text-[#1db954]" />
                  ) : (
                    <button
                      disabled={addingId === pl.id}
                      className="text-xs text-[#b3b3b3] hover:text-white font-semibold"
                    >
                      {addingId === pl.id ? 'Adding...' : 'Add'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-[#3e3e3e] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full text-xs font-bold bg-white text-black hover:scale-105 active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
