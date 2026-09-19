import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Play, Sparkles } from 'lucide-react';
import { songsApi } from '../api/songs';
import { historyApi } from '../api/history';
import { Song } from '../types';
import { SongCard } from '../components/SongCard';
import { SongRow } from '../components/SongRow';
import { usePlayer } from '../contexts/PlayerContext';

export const Home: React.FC = () => {
  const { openAddToPlaylist } = useOutletContext<{ openAddToPlaylist: (song: Song) => void }>();
  const { playSong } = usePlayer();
  const [songs, setSongs] = useState<Song[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [songsRes, recentRes] = await Promise.all([
          songsApi.getSongs(1, 50),
          historyApi.getRecentlyPlayed(6).catch(() => ({ songs: [] })),
        ]);
        setSongs(songsRes.songs);
        setRecentlyPlayed(recentRes.songs);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleDeleteSong = async (songId: string) => {
    if (confirm('Are you sure you want to delete this song?')) {
      try {
        await songsApi.deleteSong(songId);
        setSongs((prev) => prev.filter((s) => s.id !== songId));
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete song');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 pb-16">
      {/* Hero Greeting */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{getGreeting()}</h1>
        {songs.length > 0 && (
          <button
            onClick={() => playSong(songs[0], songs)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1db954] text-black font-bold text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#1db954]/25"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Play All</span>
          </button>
        )}
      </div>

      {/* Quick Play Row / Recently Played */}
      {recentlyPlayed.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Recently Played</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {recentlyPlayed.map((song) => (
              <div
                key={song.id}
                onClick={() => playSong(song, recentlyPlayed)}
                className="group flex items-center gap-4 bg-[#242424]/70 hover:bg-[#2e2e2e] rounded-md overflow-hidden cursor-pointer transition-all shadow select-none"
              >
                <div className="w-16 h-16 bg-[#333] shrink-0 flex items-center justify-center">
                  {song.cover_url ? (
                    <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-[#1db954]" />
                  )}
                </div>
                <span className="font-bold text-sm text-white truncate flex-1 pr-2">{song.title}</span>
                <div className="mr-4 w-10 h-10 rounded-full bg-[#1db954] opacity-0 group-hover:opacity-100 shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105">
                  <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Songs Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Popular Tracks</h2>
          <span className="text-xs text-[#b3b3b3] font-medium">{songs.length} songs</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {songs.slice(0, 12).map((song) => (
            <SongCard key={song.id} song={song} allSongs={songs} />
          ))}
        </div>
      </div>

      {/* Full Songs Table */}
      <div className="pt-4">
        <h2 className="text-xl font-bold text-white mb-4">All Music</h2>
        <div className="bg-[#181818]/60 rounded-xl p-2 border border-[#222222]">
          {/* Table Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#282828] text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider">
            <div className="flex items-center gap-4 flex-1">
              <span className="w-6 text-center">#</span>
              <span>Title</span>
            </div>
            <span className="hidden md:block w-1/4">Album</span>
            <span className="w-16 text-right">Time</span>
          </div>

          {/* Song Rows */}
          <div className="mt-1 space-y-0.5">
            {songs.map((song, idx) => (
              <SongRow
                key={song.id}
                song={song}
                index={idx}
                allSongs={songs}
                onDelete={handleDeleteSong}
                onAddToPlaylist={openAddToPlaylist}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
