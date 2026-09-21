export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  username: string;
  display_name?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration: number; // in seconds
  audio_url: string;
  cover_url?: string;
  plays?: number;
  play_count?: number;
  uploaded_by?: string;
  created_at?: string;
  is_liked?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  owner_id: string;
  is_public: boolean;
  songs: Song[];
  song_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface HistoryItem {
  id: string;
  user_id: string;
  song_id: string;
  song?: Song;
  seconds_played: number;
  completed: boolean;
  played_at: string;
}

export interface AdminStats {
  users: number;
  songs: number;
  playlists: number;
  total_plays: number;
}
