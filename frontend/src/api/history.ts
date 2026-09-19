import { apiClient } from './client';
import { HistoryItem, Song } from '../types';

export const historyApi = {
  getHistory: async (limit = 50): Promise<{ history: HistoryItem[]; total: number }> => {
    const response = await apiClient.get<{ history: HistoryItem[]; total: number }>('/history', {
      params: { limit },
    });
    return response.data;
  },

  getRecentlyPlayed: async (limit = 10): Promise<{ songs: Song[] }> => {
    const response = await apiClient.get<{ songs: Song[] }>('/history/recently-played', {
      params: { limit },
    });
    return response.data;
  },

  recordPlay: async (songId: string, secondsPlayed: number, completed = false): Promise<void> => {
    await apiClient.post('/history', {
      song_id: songId,
      seconds_played: secondsPlayed,
      completed,
    });
  },
};
