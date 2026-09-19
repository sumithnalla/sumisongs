import { apiClient } from './client';
import { Song } from '../types';

export interface SongsResponse {
  songs: Song[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface StreamResponse {
  stream_url: string;
  expires_in: number;
  song_id: string;
}

export const songsApi = {
  getSongs: async (page = 1, limit = 50, sort = 'created_at'): Promise<SongsResponse> => {
    const response = await apiClient.get<SongsResponse>('/songs', {
      params: { page, limit, sort },
    });
    return response.data;
  },

  getSong: async (id: string): Promise<Song> => {
    const response = await apiClient.get<Song>(`/songs/${id}`);
    return response.data;
  },

  getStreamUrl: async (id: string): Promise<StreamResponse> => {
    const response = await apiClient.get<StreamResponse>(`/songs/${id}/stream`);
    return response.data;
  },

  uploadSong: async (formData: FormData): Promise<Song> => {
    const response = await apiClient.post<Song>('/songs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteSong: async (id: string): Promise<void> => {
    await apiClient.delete(`/songs/${id}`);
  },
};
