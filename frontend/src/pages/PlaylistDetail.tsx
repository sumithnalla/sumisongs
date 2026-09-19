import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Play, ListMusic, Edit2, Trash2, Music } from 'lucide-react';
import { playlistsApi } from '../api/playlists';
import { Playlist, Song } from '../types';
import { SongRow } from '../components/SongRow';
import { PlaylistModal } from '../components/PlaylistModal';
import { usePlayer } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';

export const PlaylistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openAddToPlaylist } = useOutletContext<{ openAddToPlaylist: (song: Song) => void }>();
  const { playSong } = usePlayer();
  const { user, isAdmin } = useAuth();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchPlaylist = async () => {
    if (!id) return;
    try {
      const data = await playlistsApi.getPlaylist(id);
      setPlaylist(data);
    } catch (err: any) {
      console.error('Failed to load playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-8 text-center text-[#888]">
        <p className="text-xl font-bold text-white">Playlist not found</p>
      </div>
    );
  }

  const isOwner = user?.id === playlist.owner_id;
  const canModify = isOwner || isAdmin;

  const totalDuration = playlist.songs.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalMins = Math.floor(totalDuration / 60);

  const handleEdit = async (data: { name: string; description?: string; is_public: boolean }) => {
    if (!id) return;
    const updated = await playlistsApi.updatePlaylist(id, data);
    setPlaylist((prev) => (prev ? { ...prev, ...updated } : prev));
  };

  const handleDelete = async () => {
    if (!id) return;
    if (confirm(`Delete playlist "${playlist.name}"?`)) {
      try {
        await playlistsApi.deletePlaylist(id);
        navigate('/library');
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete playlist');
      }
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (!id) return;
    try {
      await playlistsApi.removeSong(id, songId);
      setPlaylist((prev) =>
        prev ? { ...prev, songs: prev.songs.filter((s) => s.id !== songId) } : null
      );
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove song');
    }
  };

  return (
    <div className="pb-16">
      {/* Header Banner */}
      <div className="p-8 pb-6 bg-gradient-to-b from-[#333333] via-[#1a1a1a] to-[#121212] flex items-end gap-6 shadow-2xl">
        <div className="w-52 h-52 rounded-xl bg-[#282828] shadow-2xl flex items-center justify-center shrink-0 overflow-hidden">
          {playlist.cover_url ? (
            <img src={playlist.cover_url} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <ListMusic className="w-24 h-24 text-[#777]" />
          )}
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            {playlist.is_public ? 'Public Playlist' : 'Private Playlist'}
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight truncate">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-xs text-[#b3b3b3] line-clamp-2 max-w-xl">{playlist.description}</p>
          )}
          <p className="text-sm text-[#b3b3b3]">
            <span className="text-white font-semibold">User</span> • {playlist.songs.length} songs
            {totalDuration > 0 && `, about ${totalMins} min`}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-8 py-4 flex items-center gap-4">
        {playlist.songs.length > 0 && (
          <button
            onClick={() => playSong(playlist.songs[0], playlist.songs)}
            className="w-14 h-14 rounded-full bg-[#1db954] hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center text-black"
            title="Play Playlist"
          >
            <Play className="w-7 h-7 fill-black ml-1" />
          </button>
        )}

        {canModify && (
          <>
            <button
              onClick={() => setIsEditOpen(true)}
              className="p-3 rounded-full hover:bg-[#282828] text-[#b3b3b3] hover:text-white transition-colors"
              title="Edit details"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-3 rounded-full hover:bg-[#282828] text-[#ff6b6b] hover:text-red-400 transition-colors"
              title="Delete playlist"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Songs Table */}
      <div className="px-8">
        {playlist.songs.length > 0 ? (
          <div className="bg-[#181818]/50 rounded-xl p-2 border border-[#222222]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#282828] text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider">
              <div className="flex items-center gap-4 flex-1">
                <span className="w-6 text-center">#</span>
                <span>Title</span>
              </div>
              <span className="hidden md:block w-1/4">Album</span>
              <span className="w-16 text-right">Time</span>
            </div>

            <div className="mt-1 space-y-0.5">
              {playlist.songs.map((song, idx) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={idx}
                  allSongs={playlist.songs}
                  onAddToPlaylist={openAddToPlaylist}
                  onRemoveFromPlaylist={canModify ? handleRemoveSong : undefined}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-[#888]">
            <Music className="w-16 h-16 mx-auto mb-2 opacity-30" />
            <p className="text-lg font-bold text-white mb-1">Let's find something for your playlist</p>
            <p className="text-xs text-[#888]">Browse songs and use the 'Add to playlist' menu option.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <PlaylistModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEdit}
        initialData={{
          name: playlist.name,
          description: playlist.description,
          is_public: playlist.is_public,
        }}
        title="Edit Playlist Details"
      />
    </div>
  );
};
