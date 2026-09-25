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
import { Logo } from './Logo';

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
        ? 'text-theme-primary bg-theme-card shadow-sm font-bold'
        : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-card/60'
    }`;

  return (
    <aside className="hidden md:flex w-64 bg-theme-base flex-col h-full shrink-0 border-r border-theme-subtle select-none">
      {/* App Logo */}
      <div className="p-6 cursor-pointer" onClick={() => navigate('/')}>
        <Logo size="lg" showText textSize="text-xl font-extrabold tracking-tight" />
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
          <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-600 to-purple-400 flex items-center justify-center shadow-sm">
            <Heart className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span>Liked Songs</span>
        </NavLink>
        <NavLink to="/history" className={navItemClass}>
          <History className="w-5 h-5 text-theme-secondary" />
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

      <div className="mx-4 my-4 border-t border-theme-subtle" />

      {/* Playlists Header */}
      <div className="px-5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-theme-secondary">
        <span>Playlists</span>
        <button
          onClick={onCreatePlaylist}
          title="Create Playlist"
          className="text-theme-secondary hover:text-theme-primary transition-colors p-1"
        >
          <PlusSquare className="w-4 h-4 text-[#1db954]" />
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
                  ? 'text-theme-primary font-bold bg-theme-card'
                  : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-card/50'
              }`
            }
          >
            {pl.name}
          </NavLink>
        ))}
        {playlists.length === 0 && (
          <div className="px-3 py-4 text-xs text-theme-muted italic">
            No playlists yet. Click '+' to create one.
          </div>
        )}
      </div>
    </aside>
  );
};
