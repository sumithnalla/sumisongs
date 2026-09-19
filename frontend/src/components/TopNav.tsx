import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, User as UserIcon, LogOut, Shield, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const TopNav: React.FC = () => {
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
    <header className="h-16 px-8 flex items-center justify-between bg-[#121212]/80 backdrop-blur-md sticky top-0 z-20 border-b border-[#222222]">
      {/* Navigation history controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors"
          title="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate(1)}
          className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors"
          title="Go forward"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/upload')}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-white hover:scale-105 active:scale-95 transition-all shadow"
        >
          <Upload className="w-4 h-4" />
          <span>Upload</span>
        </button>

        {/* User profile dropdown button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-black/70 hover:bg-[#282828] border border-[#333333] transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-[#333333] flex items-center justify-center text-white">
              <UserIcon className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-white max-w-[120px] truncate">
              {user?.username.split('@')[0]}
            </span>
            {isAdmin && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1db954] text-black uppercase">
                Admin
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg bg-[#282828] border border-[#3e3e3e] shadow-2xl py-1 z-50">
              <div className="px-4 py-3 border-b border-[#3e3e3e]">
                <p className="text-xs text-[#b3b3b3]">Signed in as</p>
                <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-[#1db954]/20 text-[#1db954] font-medium uppercase">
                  {user?.role}
                </span>
              </div>

              {isAdmin && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/admin');
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#e0e0e0] hover:bg-[#383838] flex items-center gap-2.5 transition-colors"
                >
                  <Shield className="w-4 h-4 text-[#1db954]" />
                  <span>Admin Console</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-[#ff6b6b] hover:bg-[#383838] flex items-center gap-2.5 transition-colors"
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
