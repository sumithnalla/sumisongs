import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopNav } from '../components/TopNav';
import { GlobalPlayer } from '../components/GlobalPlayer';
import { QueuePanel } from '../components/QueuePanel';
import { PlaylistModal } from '../components/PlaylistModal';
import { AddToPlaylistModal } from '../components/AddToPlaylistModal';
import { playlistsApi } from '../api/playlists';
import { Song } from '../types';

export const AppLayout: React.FC = () => {
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(null);

  const handleCreatePlaylist = async (data: { name: string; description?: string; is_public: boolean }) => {
    await playlistsApi.createPlaylist(data);
    // Reload or window event to refresh playlists list
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-black text-white">
      {/* Upper area: Sidebar + Main Content + Queue Panel */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onCreatePlaylist={() => setIsPlaylistModalOpen(true)} />

        <div className="flex-1 flex flex-col min-w-0 bg-[#121212] overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-y-auto relative">
            <Outlet context={{ openAddToPlaylist: (song: Song) => setSongToAddToPlaylist(song) }} />
          </main>
        </div>

        <QueuePanel />
      </div>

      {/* Persistent Bottom Playback Bar */}
      <GlobalPlayer />

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
