import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Song } from '../types';
import { songsApi } from '../api/songs';
import { historyApi } from '../api/history';

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  progress: number;
  duration: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  queue: Song[];
  queueIndex: number;
  isQueueOpen: boolean;
  playSong: (song: Song, newQueue?: Song[]) => Promise<void>;
  togglePlay: () => void;
  nextSong: () => void;
  previousSong: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleQueue: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  // Track seconds played for history
  const secondsPlayedRef = useRef<number>(0);
  const playStartRef = useRef<number>(0);

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = volume;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      secondsPlayedRef.current += 0.25;
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      recordPlayHistory(true);
      handleNextTrack();
    };

    const handleError = (e: Event) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []);

  // Record history to backend
  const recordPlayHistory = async (completed = false) => {
    if (currentSong && secondsPlayedRef.current > 5) {
      try {
        await historyApi.recordPlay(currentSong.id, Math.round(secondsPlayedRef.current), completed);
      } catch (err) {
        console.warn('Failed to record play history:', err);
      }
    }
  };

  const playSong = async (song: Song, newQueue?: Song[]) => {
    if (!audioRef.current) return;

    // Record history for previous song
    await recordPlayHistory(false);
    secondsPlayedRef.current = 0;
    playStartRef.current = Date.now();

    try {
      // Get stream URL from backend
      const { stream_url } = await songsApi.getStreamUrl(song.id);
      
      let finalUrl = stream_url;
      // If relative URL returned (e.g. /api/songs/123/audio), make it absolute or relative to origin
      if (stream_url.startsWith('/')) {
        finalUrl = stream_url;
      }

      audioRef.current.src = finalUrl;
      audioRef.current.load();
      await audioRef.current.play();

      setCurrentSong(song);
      setIsPlaying(true);
      setProgress(0);
      setDuration(song.duration || 0);

      if (newQueue && newQueue.length > 0) {
        setQueue(newQueue);
        const idx = newQueue.findIndex((s) => s.id === song.id);
        setQueueIndex(idx !== -1 ? idx : 0);
      } else if (!queue.some((s) => s.id === song.id)) {
        setQueue((prev) => [...prev, song]);
        setQueueIndex(queue.length);
      }
    } catch (err) {
      console.error('Error playing song:', err);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error('Playback resume failed:', e);
      });
    }
  };

  const handleNextTrack = () => {
    if (repeatMode === 'one' && currentSong) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    if (queue.length === 0) return;

    let nextIndex: number;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
    }

    setQueueIndex(nextIndex);
    playSong(queue[nextIndex]);
  };

  const nextSong = () => {
    handleNextTrack();
  };

  const previousSong = () => {
    if (!audioRef.current) return;

    // If more than 3 seconds played, restart the song
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }

    if (queue.length === 0) return;

    let prevIndex: number;
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * queue.length);
    } else {
      prevIndex = queueIndex - 1;
      if (prevIndex < 0) {
        prevIndex = repeatMode === 'all' ? queue.length - 1 : 0;
      }
    }

    setQueueIndex(prevIndex);
    playSong(queue[prevIndex]);
  };

  const seek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setProgress(seconds);
    }
  };

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clamped;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.volume = nextMuted ? 0 : volume;
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleQueue = () => {
    setIsQueueOpen((prev) => !prev);
  };

  const addToQueue = (song: Song) => {
    setQueue((prev) => [...prev, song]);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex((prev) => prev - 1);
    }
  };

  const clearQueue = () => {
    setQueue(currentSong ? [currentSong] : []);
    setQueueIndex(0);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        volume,
        isMuted,
        progress,
        duration,
        isShuffle,
        repeatMode,
        queue,
        queueIndex,
        isQueueOpen,
        playSong,
        togglePlay,
        nextSong,
        previousSong,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        toggleQueue,
        addToQueue,
        removeFromQueue,
        clearQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
