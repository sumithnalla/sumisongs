import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Heart, Play, Music } from 'lucide-react';
import { likesApi } from '../api/likes';
import { Song } from '../types';
import { SongRow } from '../components/SongRow';
import { LoadingScreen } from '../components/LoadingScreen';
import { usePlayer } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';

export const LikedSongs: React.FC = () => {
  const { openAddToPlaylist } = useOutletContext<{ openAddToPlaylist: (song: Song) => void }>();
  const { playSong } = usePlayer();
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiked = async () => {
      try {
        const data = await likesApi.getLikedSongs();
        // Mark all as liked
        const withLiked = data.songs.map((s) => ({ ...s, is_liked: true }));
        setSongs(withLiked);
      } catch (err) {
        console.error('Failed to load liked songs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLiked();
  }, []);

  if (loading) {
    return <LoadingScreen fullScreen={false} message="Loading your liked songs..." />;
  }

  return (
    <div className="pb-16">
      {/* Header Banner */}
      <div className="p-4 sm:p-8 pb-6 bg-gradient-to-b from-indigo-800/90 via-indigo-950/80 to-theme-surface flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 shadow-xl text-center sm:text-left">
        <div className="w-28 h-28 sm:w-44 sm:h-44 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl flex items-center justify-center shrink-0">
          <Heart className="w-14 h-14 sm:w-20 sm:h-20 text-white fill-white drop-shadow-md" />
        </div>
        <div className="flex flex-col gap-1 sm:gap-2">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-300">Playlist</span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">Liked Songs</h1>
          <p className="text-xs sm:text-sm text-indigo-200">
            <span className="text-white font-semibold">{user?.username}</span> • {songs.length} songs
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-4 sm:px-8 py-3 sm:py-4 flex items-center gap-6">
        {songs.length > 0 && (
          <button
            onClick={() => playSong(songs[0], songs)}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1db954] hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center text-black"
            title="Play Liked Songs"
          >
            <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-black ml-0.5 sm:ml-1" />
          </button>
        )}
      </div>

      {/* Songs Table */}
      <div className="px-3 sm:px-8">
        {songs.length > 0 ? (
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
              {songs.map((song, idx) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={idx}
                  allSongs={songs}
                  onAddToPlaylist={openAddToPlaylist}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 sm:py-20 text-theme-muted">
            <Music className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 opacity-30 text-theme-muted" />
            <p className="text-lg sm:text-xl font-bold text-theme-primary mb-1">Songs you like will appear here</p>
            <p className="text-xs sm:text-sm text-theme-secondary">Save songs by tapping the heart icon on any track.</p>
          </div>
        )}
      </div>
    </div>
  );
};
