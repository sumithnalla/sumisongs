import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Heart, Play, Music } from 'lucide-react';
import { likesApi } from '../api/likes';
import { Song } from '../types';
import { SongRow } from '../components/SongRow';
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
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Header Banner */}
      <div className="p-8 pb-6 bg-gradient-to-b from-indigo-800 via-indigo-950 to-[#121212] flex items-end gap-6 shadow-2xl">
        <div className="w-48 h-48 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl flex items-center justify-center shrink-0">
          <Heart className="w-24 h-24 text-white fill-white drop-shadow-md" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-white">Playlist</span>
          <h1 className="text-5xl font-black text-white tracking-tight">Liked Songs</h1>
          <p className="text-sm text-[#b3b3b3]">
            <span className="text-white font-semibold">{user?.username}</span> • {songs.length} songs
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-8 py-4 flex items-center gap-6">
        {songs.length > 0 && (
          <button
            onClick={() => playSong(songs[0], songs)}
            className="w-14 h-14 rounded-full bg-[#1db954] hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center text-black"
            title="Play Liked Songs"
          >
            <Play className="w-7 h-7 fill-black ml-1" />
          </button>
        )}
      </div>

      {/* Songs Table */}
      <div className="px-8">
        {songs.length > 0 ? (
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
          <div className="text-center py-20 text-[#888]">
            <Music className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="text-xl font-bold text-white mb-1">Songs you like will appear here</p>
            <p className="text-sm text-[#888]">Save songs by tapping the heart icon on any track.</p>
          </div>
        )}
      </div>
    </div>
  );
};
