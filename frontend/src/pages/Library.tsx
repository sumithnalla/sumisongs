import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Heart, Music, ListMusic } from 'lucide-react';
import { playlistsApi } from '../api/playlists';
import { likesApi } from '../api/likes';
import { Playlist } from '../types';
import { PlaylistModal } from '../components/PlaylistModal';

export const Library: React.FC = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedCount, setLikedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plRes, likesRes] = await Promise.all([
          playlistsApi.getPlaylists(),
          likesApi.getLikedSongs().catch(() => ({ total: 0 })),
        ]);
        setPlaylists(plRes.playlists);
        setLikedCount(likesRes.total);
      } catch (err) {
        console.error('Failed to load library:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreate = async (data: { name: string; description?: string; is_public: boolean }) => {
    const created = await playlistsApi.createPlaylist(data);
    setPlaylists((prev) => [created, ...prev]);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-primary tracking-tight">Your Library</h1>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1db954] text-black font-bold text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Liked Songs Special Card */}
        <div
          onClick={() => navigate('/liked')}
          className="col-span-2 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-900 to-[#181818] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-end relative shadow-lg min-h-[160px] sm:min-h-[180px] select-none"
        >
          <div className="absolute top-5 left-5 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center shadow">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-1">Liked Songs</h3>
            <p className="text-xs text-indigo-200">{likedCount} liked songs</p>
          </div>
        </div>

        {/* Playlists Cards */}
        {playlists.map((pl) => (
          <div
            key={pl.id}
            onClick={() => navigate(`/playlist/${pl.id}`)}
            className="group p-3 sm:p-4 rounded-2xl bg-theme-card hover:bg-theme-card-hover border border-theme-subtle transition-all cursor-pointer flex flex-col shadow-sm select-none active:scale-[0.98]"
          >
            <div className="w-full aspect-square rounded-xl bg-theme-elevated mb-3 overflow-hidden flex items-center justify-center shadow-sm border border-theme-subtle">
              {pl.cover_url ? (
                <img src={pl.cover_url} alt={pl.name} className="w-full h-full object-cover" />
              ) : (
                <ListMusic className="w-10 h-10 sm:w-12 sm:h-12 text-theme-muted group-hover:text-[#1db954] transition-colors" />
              )}
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-theme-primary truncate mb-0.5">{pl.name}</h4>
            <p className="text-[11px] sm:text-xs text-theme-secondary truncate">
              By You • {pl.song_count || 0} songs
            </p>
          </div>
        ))}

        {playlists.length === 0 && (
          <div className="col-span-full py-12 text-center text-theme-muted">
            <Music className="w-12 h-12 mx-auto mb-2 opacity-30 text-theme-muted" />
            <p className="font-semibold text-theme-primary">Create your first playlist</p>
            <p className="text-xs text-theme-secondary mt-1">It's easy, tap the button above to get started.</p>
          </div>
        )}
      </div>

      <PlaylistModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};
