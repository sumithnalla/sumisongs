import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search as SearchIcon, X, Music } from 'lucide-react';
import { searchApi } from '../api/search';
import { Song } from '../types';
import { SongRow } from '../components/SongRow';
import { songsApi } from '../api/songs';

const GENRES = [
  { name: 'Pop', color: 'from-pink-600 to-rose-500' },
  { name: 'Hip-Hop', color: 'from-orange-600 to-amber-500' },
  { name: 'Electronic', color: 'from-blue-600 to-cyan-500' },
  { name: 'Synthwave', color: 'from-purple-600 to-fuchsia-500' },
  { name: 'Lo-Fi', color: 'from-teal-600 to-emerald-500' },
  { name: 'Indie', color: 'from-yellow-600 to-amber-600' },
  { name: 'Rock', color: 'from-red-600 to-orange-700' },
  { name: 'Chillout', color: 'from-indigo-600 to-blue-700' },
];

export const Search: React.FC = () => {
  const { openAddToPlaylist } = useOutletContext<{ openAddToPlaylist: (song: Song) => void }>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { songs } = await searchApi.search(query.trim());
        setResults(songs);
        setSearched(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleGenreClick = async (genreName: string) => {
    setQuery(genreName);
  };

  const handleDeleteSong = async (songId: string) => {
    if (confirm('Are you sure you want to delete this song?')) {
      try {
        await songsApi.deleteSong(songId);
        setResults((prev) => prev.filter((s) => s.id !== songId));
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete song');
      }
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      {/* Search Input */}
      <div className="max-w-xl relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to play? (title, artist, genre...)"
          className="w-full px-4 sm:px-5 py-3 sm:py-3.5 pl-11 sm:pl-12 pr-10 rounded-full bg-theme-card text-theme-primary placeholder-theme-muted border border-theme-subtle focus:border-[#1db954] focus:bg-theme-elevated focus:outline-none text-xs sm:text-sm transition-all shadow-md"
          autoFocus
        />
        <SearchIcon className="w-5 h-5 text-theme-muted absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2" />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content: Results or Genre Browse */}
      {query.trim() ? (
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-theme-primary mb-3 sm:mb-4">
            {loading ? 'Searching...' : `Search results for "${query}"`}
          </h2>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="bg-theme-card/70 rounded-2xl p-2 sm:p-3 border border-theme-subtle shadow-sm">
              {results.map((song, idx) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={idx}
                  allSongs={results}
                  onDelete={handleDeleteSong}
                  onAddToPlaylist={openAddToPlaylist}
                />
              ))}
            </div>
          ) : searched ? (
            <div className="text-center py-16 text-theme-muted">
              <Music className="w-12 h-12 mx-auto mb-3 opacity-30 text-theme-muted" />
              <p className="text-base font-semibold text-theme-primary">No results found for "{query}"</p>
              <p className="text-xs text-theme-secondary mt-1">
                Please make sure your words are spelled correctly or try different keywords.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-theme-primary mb-3 sm:mb-4">Browse All Genres</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {GENRES.map((g) => (
              <div
                key={g.name}
                onClick={() => handleGenreClick(g.name)}
                className={`h-28 sm:h-36 rounded-2xl bg-gradient-to-br ${g.color} p-3.5 sm:p-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md flex flex-col justify-between overflow-hidden relative select-none`}
              >
                <span className="text-base sm:text-xl font-extrabold text-white tracking-wide">{g.name}</span>
                <Music className="w-12 h-12 sm:w-16 sm:h-16 text-white/20 absolute -right-2 -bottom-2 rotate-12" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
