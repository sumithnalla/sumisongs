import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Library, Heart, Menu } from 'lucide-react';

interface MobileNavProps {
  onOpenDrawer: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenDrawer }) => {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 py-1 px-3 transition-colors ${
      isActive
        ? 'text-[#1db954] font-bold'
        : 'text-theme-secondary hover:text-theme-primary font-medium'
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-theme-surface/95 backdrop-blur-lg border-t border-theme-subtle flex items-center justify-around py-2 px-1 safe-bottom select-none shadow-2xl">
      <NavLink to="/" end className={navClass}>
        <Home className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Home</span>
      </NavLink>

      <NavLink to="/search" className={navClass}>
        <Search className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Search</span>
      </NavLink>

      <NavLink to="/library" className={navClass}>
        <Library className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Library</span>
      </NavLink>

      <NavLink to="/liked" className={navClass}>
        <Heart className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Liked</span>
      </NavLink>

      <button
        onClick={onOpenDrawer}
        type="button"
        className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-theme-secondary hover:text-theme-primary transition-colors font-medium"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Menu</span>
      </button>
    </nav>
  );
};
