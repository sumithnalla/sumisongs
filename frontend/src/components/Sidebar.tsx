import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  Library,
  Heart,
  History,
  PlusSquare,
  ShieldCheck,
  Music,
  Upload,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { playlistsApi } from '../api/playlists';
import { Playlist } from '../types';

interface SidebarProps {
  onCreatePlaylist: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCreatePlaylist }) => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const { playlists: data } = await playlistsApi.getPlaylists();
        setPlaylists(data);
      } catch (e) {
        console.error('Failed to load playlists:', e);
      }
    };
    fetchPlaylists();
  }, []);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'text-white bg-[#282828]'
        : 'text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a]'
    }`;

  return (
    <aside className="w-64 bg-black flex flex-col h-full shrink-0 border-r border-[#222222] select-none">
      {/* App Logo */}
      <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-10 h-10 rounded-full bg-[#1db954] flex items-center justify-center shadow-lg shadow-[#1db954]/20">
          <Music className="w-6 h-6 text-black fill-current" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">Spotify</span>
      </div>

      {/* Main Navigation */}
      <nav className="px-3 space-y-1">
        <NavLink to="/" end className={navItemClass}>
          <Home className="w-5 h-5" />
          <span>Home</span>
        </NavLink>
        <NavLink to="/search" className={navItemClass}>
          <Search className="w-5 h-5" />
          <span>Search</span>
        </NavLink>
        <NavLink to="/library" className={navItemClass}>
          <Library className="w-5 h-5" />
          <span>Your Library</span>
        </NavLink>
      </nav>

      {/* Secondary Navigation */}
      <div className="mt-6 px-3 space-y-1">
        <NavLink to="/liked" className={navItemClass}>
          <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-600 to-purple-400 flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span>Liked Songs</span>
        </NavLink>
        <NavLink to="/history" className={navItemClass}>
          <History className="w-5 h-5 text-[#b3b3b3]" />
          <span>Listening History</span>
        </NavLink>
        <NavLink to="/upload" className={navItemClass}>
          <Upload className="w-5 h-5 text-[#1db954]" />
          <span>Upload Music</span>
        </NavLink>

        {isAdmin && (
          <NavLink to="/admin" className={navItemClass}>
            <ShieldCheck className="w-5 h-5 text-[#1db954]" />
            <span>Admin Console</span>
          </NavLink>
        )}
      </div>

      <div className="mx-4 my-4 border-t border-[#282828]" />

      {/* Playlists Header */}
      <div className="px-5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#b3b3b3]">
        <span>Playlists</span>
        <button
          onClick={onCreatePlaylist}
          title="Create Playlist"
          className="text-[#b3b3b3] hover:text-white transition-colors p-1"
        >
          <PlusSquare className="w-4 h-4" />
        </button>
      </div>

      {/* Playlist List (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {playlists.map((pl) => (
          <NavLink
            key={pl.id}
            to={`/playlist/${pl.id}`}
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm truncate transition-colors ${
                isActive
                  ? 'text-white font-medium bg-[#1e1e1e]'
                  : 'text-[#a7a7a7] hover:text-white'
              }`
            }
          >
            {pl.name}
          </NavLink>
        ))}
        {playlists.length === 0 && (
          <div className="px-3 py-4 text-xs text-[#727272]">
            No playlists yet. Click '+' to create one.
          </div>
        )}
      </div>
    </aside>
  );
};
