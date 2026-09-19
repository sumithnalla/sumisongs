import { apiClient } from './client';
import { Song } from '../types';

export const likesApi = {
  getLikedSongs: async (): Promise<{ songs: Song[]; total: number }> => {
    const response = await apiClient.get<{ songs: Song[]; total: number }>('/likes');
    return response.data;
  },

  likeSong: async (songId: string): Promise<void> => {
    await apiClient.post(`/likes/${songId}`);
  },

  unlikeSong: async (songId: string): Promise<void> => {
    await apiClient.delete(`/likes/${songId}`);
  },

  checkLike: async (songId: string): Promise<{ is_liked: boolean }> => {
    const response = await apiClient.get<{ is_liked: boolean }>(`/likes/${songId}/check`);
    return response.data;
  },
};
