import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Play, ListMusic, Edit2, Trash2, Music } from 'lucide-react';
import { playlistsApi } from '../api/playlists';
import { Playlist, Song } from '../types';
import { SongRow } from '../components/SongRow';
import { PlaylistModal } from '../components/PlaylistModal';
import { LoadingScreen } from '../components/LoadingScreen';
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
    return <LoadingScreen fullScreen={false} message="Loading playlist..." />;
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
      <div className="p-4 sm:p-8 pb-6 bg-gradient-to-b from-[#333333]/90 via-theme-elevated/80 to-theme-surface flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 shadow-xl text-center sm:text-left">
        <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-2xl bg-theme-elevated shadow-2xl flex items-center justify-center shrink-0 overflow-hidden border border-theme-subtle">
          {playlist.cover_url ? (
            <img src={playlist.cover_url} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <ListMusic className="w-16 h-16 sm:w-20 sm:h-20 text-theme-muted" />
          )}
        </div>

        <div className="flex flex-col gap-1 sm:gap-2 min-w-0">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-theme-secondary">
            {playlist.is_public ? 'Public Playlist' : 'Private Playlist'}
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-theme-primary tracking-tight truncate">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-xs text-theme-secondary line-clamp-2 max-w-xl">{playlist.description}</p>
          )}
          <p className="text-xs sm:text-sm text-theme-secondary">
            <span className="text-theme-primary font-semibold">User</span> • {playlist.songs.length} songs
            {totalDuration > 0 && `, about ${totalMins} min`}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-4 sm:px-8 py-3 sm:py-4 flex items-center gap-4">
        {playlist.songs.length > 0 && (
          <button
            onClick={() => playSong(playlist.songs[0], playlist.songs)}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1db954] hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center text-black"
            title="Play Playlist"
          >
            <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-black ml-0.5 sm:ml-1" />
          </button>
        )}

        {canModify && (
          <>
            <button
              onClick={() => setIsEditOpen(true)}
              className="p-2.5 rounded-full hover:bg-theme-card text-theme-secondary hover:text-theme-primary transition-colors border border-theme-subtle"
              title="Edit details"
            >
              <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2.5 rounded-full hover:bg-red-500/10 text-red-500 hover:text-red-400 transition-colors border border-red-500/20"
              title="Delete playlist"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}
      </div>

      {/* Songs Table */}
      <div className="px-3 sm:px-8">
        {playlist.songs.length > 0 ? (
          <div className="bg-theme-card/70 rounded-2xl p-2 sm:p-3 border border-theme-subtle shadow-sm">
            <div className="flex items-center justify-between px-2 sm:px-4 py-2 border-b border-theme-subtle text-xs font-semibold text-theme-secondary uppercase tracking-wider">
              <div className="flex items-center gap-3 sm:gap-4 flex-1">
                <span className="w-5 sm:w-6 text-center">#</span>
                <span>Title</span>
              </div>
              <span className="hidden md:block w-1/4">Album</span>
              <span className="w-14 sm:w-16 text-right">Time</span>
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
          <div className="text-center py-16 sm:py-20 text-theme-muted">
            <Music className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 opacity-30 text-theme-muted" />
            <p className="text-lg font-bold text-theme-primary mb-1">Let's find something for your playlist</p>
            <p className="text-xs text-theme-secondary">Browse songs and use the 'Add to playlist' menu option.</p>
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
