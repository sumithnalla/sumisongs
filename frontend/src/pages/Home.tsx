import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Play, Sparkles } from 'lucide-react';
import { songsApi } from '../api/songs';
import { historyApi } from '../api/history';
import { Song } from '../types';
import { SongCard } from '../components/SongCard';
import { SongRow } from '../components/SongRow';
import { LoadingScreen } from '../components/LoadingScreen';
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
    return <LoadingScreen fullScreen={false} message="Loading your tracks..." />;
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      {/* Hero Greeting */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-primary tracking-tight">
          {getGreeting()}
        </h1>
        {songs.length > 0 && (
          <button
            onClick={() => playSong(songs[0], songs)}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#1db954] text-black font-bold text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#1db954]/25"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Play All</span>
          </button>
        )}
      </div>

      {/* Quick Play Row / Recently Played - Kept for future restoration per user request */}
      {/*
      {recentlyPlayed.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-theme-primary mb-3 sm:mb-4">
            Recently Played
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
            {recentlyPlayed.map((song, idx) => (
              <div
                key={`${song.id}-${idx}`}
                onClick={() => playSong(song, recentlyPlayed)}
                className="group flex items-center gap-3.5 bg-theme-card hover:bg-theme-card-hover rounded-xl overflow-hidden cursor-pointer transition-all shadow-sm border border-theme-subtle select-none active:scale-[0.99]"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-theme-elevated shrink-0 flex items-center justify-center">
                  {song.cover_url ? (
                    <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-[#1db954]" />
                  )}
                </div>
                <span className="font-bold text-xs sm:text-sm text-theme-primary truncate flex-1 pr-2">
                  {song.title}
                </span>
                <div className="mr-3 w-9 h-9 rounded-full bg-[#1db954] opacity-0 group-hover:opacity-100 shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 shrink-0">
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      */}

      {/* Featured Songs Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-theme-primary">Popular Tracks</h2>
          <span className="text-xs text-theme-secondary font-medium">{songs.length} songs</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {songs.slice(0, 12).map((song) => (
            <SongCard key={song.id} song={song} allSongs={songs} />
          ))}
        </div>
      </div>

      {/* Full Songs Table */}
      <div className="pt-2">
        <h2 className="text-lg sm:text-xl font-bold text-theme-primary mb-3 sm:mb-4">All Music</h2>
        <div className="bg-theme-card/70 rounded-2xl p-2 sm:p-3 border border-theme-subtle shadow-sm">
          {/* Table Header */}
          <div className="flex items-center justify-between px-2 sm:px-4 py-2 border-b border-theme-subtle text-xs font-semibold text-theme-secondary uppercase tracking-wider">
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <span className="w-5 sm:w-6 text-center">#</span>
              <span>Title</span>
            </div>
            <span className="hidden md:block w-1/4">Album</span>
            <span className="w-14 sm:w-16 text-right">Time</span>
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
