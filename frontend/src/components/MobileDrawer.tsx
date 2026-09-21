import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  X,
  Music,
  PlusSquare,
  History,
  Upload,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { playlistsApi } from '../api/playlists';
import { Playlist } from '../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlaylist: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  onCreatePlaylist,
}) => {
  const { user, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchPlaylists = async () => {
        try {
          const { playlists: data } = await playlistsApi.getPlaylists();
          setPlaylists(data);
        } catch (e) {
          console.error('Failed to load playlists in drawer:', e);
        }
      };
      fetchPlaylists();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-4/5 max-w-xs bg-theme-surface h-full shadow-2xl flex flex-col z-10 border-r border-theme-subtle animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-4 border-b border-theme-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1db954] flex items-center justify-center shadow">
              <Music className="w-5 h-5 text-black fill-current" />
            </div>
            <span className="font-bold text-lg text-theme-primary">Spotify</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-card transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-theme-subtle bg-theme-card/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1db954]/20 border border-[#1db954]/30 flex items-center justify-center text-[#1db954] font-bold">
            <UserIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-theme-primary truncate">
              {user?.display_name || user?.username?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-theme-muted truncate">{user?.username}</p>
          </div>
          {isAdmin && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#1db954] text-black uppercase">
              Admin
            </span>
          )}
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Theme Mode Toggle Row */}
          <div className="p-2.5 rounded-xl bg-theme-card border border-theme-subtle flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-theme-primary">
              {isDark ? (
                <Moon className="w-4 h-4 text-purple-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-[#1db954] text-black active:scale-95 shadow-sm"
            >
              Switch to {isDark ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="space-y-1">
            <button
              onClick={() => handleNavigate('/upload')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-theme-primary hover:bg-theme-card transition-colors text-left"
            >
              <Upload className="w-4 h-4 text-[#1db954]" />
              <span>Upload Music</span>
            </button>

            <button
              onClick={() => handleNavigate('/history')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-theme-primary hover:bg-theme-card transition-colors text-left"
            >
              <History className="w-4 h-4 text-theme-secondary" />
              <span>Listening History</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => handleNavigate('/admin')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-theme-primary hover:bg-theme-card transition-colors text-left"
              >
                <ShieldCheck className="w-4 h-4 text-[#1db954]" />
                <span>Admin Console</span>
              </button>
            )}
          </div>

          {/* Playlists */}
          <div className="pt-2 border-t border-theme-subtle">
            <div className="flex items-center justify-between px-3 py-1 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-theme-secondary">
                Playlists
              </span>
              <button
                onClick={() => {
                  onClose();
                  onCreatePlaylist();
                }}
                className="p-1 text-theme-secondary hover:text-theme-primary transition-colors"
                title="Create Playlist"
              >
                <PlusSquare className="w-4 h-4 text-[#1db954]" />
              </button>
            </div>

            <div className="space-y-0.5">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleNavigate(`/playlist/${playlist.id}`)}
                  className="w-full text-left px-3 py-2 text-xs text-theme-secondary hover:text-theme-primary hover:bg-theme-card rounded-md truncate transition-colors block"
                >
                  {playlist.name}
                </button>
              ))}
              {playlists.length === 0 && (
                <p className="text-xs text-theme-muted px-3 py-2 italic">
                  No playlists yet. Tap + to create one!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-t border-theme-subtle">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
