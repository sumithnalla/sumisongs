import { apiClient } from './client';
import { Song } from '../types';

export const searchApi = {
  search: async (query: string, limit = 20): Promise<{ songs: Song[]; total: number; query: string }> => {
    const response = await apiClient.get<{ songs: Song[]; total: number; query: string }>('/search', {
      params: { q: query, limit },
    });
    return response.data;
  },
};
