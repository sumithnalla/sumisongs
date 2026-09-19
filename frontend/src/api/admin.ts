import { apiClient } from './client';
import { User, AdminStats } from '../types';

export interface CreateUserData {
  username: string;
  password: string;
  display_name: string;
  role: 'user' | 'admin';
}

export interface UpdateUserData {
  display_name?: string;
  role?: 'user' | 'admin';
  is_active?: boolean;
}

export const adminApi = {
  getUsers: async (page = 1, limit = 50): Promise<{ users: User[]; total: number; page: number; pages: number }> => {
    const response = await apiClient.get<{ users: User[]; total: number; page: number; pages: number }>('/admin/users', {
      params: { page, limit },
    });
    return response.data;
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await apiClient.post<User>('/admin/users', data);
    return response.data;
  },

  updateUser: async (id: string, updates: UpdateUserData): Promise<User> => {
    const response = await apiClient.put<User>(`/admin/users/${id}`, updates);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`);
  },

  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get<AdminStats>('/admin/stats');
    return response.data;
  },
};
