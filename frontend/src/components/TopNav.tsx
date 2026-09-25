import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  LogOut,
  Shield,
  Upload,
  Menu,
  Music,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';

interface TopNavProps {
  onOpenMobileDrawer?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenMobileDrawer }) => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 px-4 sm:px-8 flex items-center justify-between bg-theme-nav backdrop-blur-md sticky top-0 z-20 border-b border-theme-subtle transition-colors select-none">
      {/* Left controls: Mobile drawer toggle / Desktop arrows */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onOpenMobileDrawer && (
          <button
            onClick={onOpenMobileDrawer}
            className="md:hidden p-2 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-card transition-colors"
            title="Open Menu"
            aria-label="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Mobile brand badge */}
        <div
          className="md:hidden flex items-center cursor-pointer ml-1"
          onClick={() => navigate('/')}
        >
          <Logo size="sm" showText textSize="font-bold text-base tracking-tight text-theme-primary" />
        </div>

        {/* Desktop navigation history controls */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-theme-card hover:bg-theme-card-hover flex items-center justify-center text-theme-secondary hover:text-theme-primary transition-colors border border-theme-subtle"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 rounded-full bg-theme-card hover:bg-theme-card-hover flex items-center justify-center text-theme-secondary hover:text-theme-primary transition-colors border border-theme-subtle"
            title="Go forward"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Dark / Light Mode Toggle */}
        <ThemeToggle />

        <button
          onClick={() => navigate('/upload')}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#1db954] hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#1db954]/20"
        >
          <Upload className="w-4 h-4" />
          <span>Upload</span>
        </button>

        {/* User profile dropdown button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center justify-center w-9 h-9 sm:w-auto sm:h-9 sm:px-2.5 rounded-full bg-theme-card hover:bg-theme-card-hover border border-theme-subtle transition-all shadow-sm active:scale-95"
            aria-label="User profile options"
          >
            <div className="w-7 h-7 rounded-full bg-[#1db954]/20 text-[#1db954] flex items-center justify-center font-bold shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline-block ml-2 text-xs sm:text-sm font-semibold text-theme-primary max-w-[100px] sm:max-w-[120px] truncate">
              {user?.display_name || (user?.username ? user.username.split('@')[0] : 'User')}
            </span>
            {isAdmin && (
              <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1db954] text-black uppercase shrink-0">
                Admin
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-theme-surface border border-theme-medium shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-theme-subtle">
                <p className="text-xs text-theme-secondary">Signed in as</p>
                <p className="text-sm font-semibold text-theme-primary truncate">
                  {user?.username || user?.display_name || 'User'}
                </p>
                <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-[#1db954]/20 text-[#1db954] font-semibold uppercase">
                  {user?.role || 'user'}
                </span>
              </div>

              {isAdmin && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/admin');
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-theme-primary hover:bg-theme-card flex items-center gap-2.5 transition-colors"
                >
                  <Shield className="w-4 h-4 text-[#1db954]" />
                  <span>Admin Console</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/upload');
                }}
                className="md:hidden w-full text-left px-4 py-2.5 text-sm text-theme-primary hover:bg-theme-card flex items-center gap-2.5 transition-colors"
              >
                <Upload className="w-4 h-4 text-[#1db954]" />
                <span>Upload Music</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
