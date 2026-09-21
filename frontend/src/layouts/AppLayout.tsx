import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopNav } from '../components/TopNav';
import { GlobalPlayer } from '../components/GlobalPlayer';
import { QueuePanel } from '../components/QueuePanel';
import { PlaylistModal } from '../components/PlaylistModal';
import { AddToPlaylistModal } from '../components/AddToPlaylistModal';
import { MobileNav } from '../components/MobileNav';
import { MobileDrawer } from '../components/MobileDrawer';
import { playlistsApi } from '../api/playlists';
import { Song } from '../types';

export const AppLayout: React.FC = () => {
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleCreatePlaylist = async (data: { name: string; description?: string; is_public: boolean }) => {
    await playlistsApi.createPlaylist(data);
    // Reload or window event to refresh playlists list
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-theme-base text-theme-primary transition-colors">
      {/* Upper area: Desktop Sidebar + Main Content + Queue Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar (hidden on mobile) */}
        <Sidebar onCreatePlaylist={() => setIsPlaylistModalOpen(true)} />

        <div className="flex-1 flex flex-col min-w-0 bg-theme-surface overflow-hidden transition-colors">
          <TopNav onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)} />
          <main className="flex-1 overflow-y-auto relative pb-36 md:pb-6">
            <Outlet context={{ openAddToPlaylist: (song: Song) => setSongToAddToPlaylist(song) }} />
          </main>
        </div>

        <QueuePanel />
      </div>

      {/* Persistent Bottom Playback Bar (desktop bottom bar + mobile floating mini-player) */}
      <GlobalPlayer />

      {/* Mobile Bottom Navigation Bar (md:hidden) */}
      <MobileNav onOpenDrawer={() => setIsMobileDrawerOpen(true)} />

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onCreatePlaylist={() => setIsPlaylistModalOpen(true)}
      />

      {/* Global Playlist Modals */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        onSubmit={handleCreatePlaylist}
      />

      <AddToPlaylistModal
        song={songToAddToPlaylist}
        isOpen={!!songToAddToPlaylist}
        onClose={() => setSongToAddToPlaylist(null)}
      />
    </div>
  );
};
