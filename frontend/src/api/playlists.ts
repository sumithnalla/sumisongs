import { apiClient } from './client';
import { Playlist } from '../types';

export interface CreatePlaylistInput {
  name: string;
  description?: string;
  is_public?: boolean;
}

export interface UpdatePlaylistInput {
  name?: string;
  description?: string;
  is_public?: boolean;
}

export const playlistsApi = {
  getPlaylists: async (): Promise<{ playlists: Playlist[] }> => {
    const response = await apiClient.get<{ playlists: Playlist[] }>('/playlists');
    return response.data;
  },

  getPlaylist: async (id: string): Promise<Playlist> => {
    const response = await apiClient.get<Playlist>(`/playlists/${id}`);
    return response.data;
  },

  createPlaylist: async (data: CreatePlaylistInput): Promise<Playlist> => {
    const response = await apiClient.post<Playlist>('/playlists', data);
    return response.data;
  },

  updatePlaylist: async (id: string, data: UpdatePlaylistInput): Promise<Playlist> => {
    const response = await apiClient.put<Playlist>(`/playlists/${id}`, data);
    return response.data;
  },

  deletePlaylist: async (id: string): Promise<void> => {
    await apiClient.delete(`/playlists/${id}`);
  },

  addSong: async (playlistId: string, songId: string): Promise<void> => {
    await apiClient.post(`/playlists/${playlistId}/songs`, { song_id: songId });
  },

  removeSong: async (playlistId: string, songId: string): Promise<void> => {
    await apiClient.delete(`/playlists/${playlistId}/songs/${songId}`);
  },
};
