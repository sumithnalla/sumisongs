import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  ListMusic,
  Heart,
  Music,
} from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { likesApi } from '../api/likes';

export const GlobalPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    progress,
    duration,
    isShuffle,
    repeatMode,
    isQueueOpen,
    togglePlay,
    nextSong,
    previousSong,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleQueue,
  } = usePlayer();

  const [isLiked, setIsLiked] = useState<boolean>(false);

  // Check like status when current song changes
  useEffect(() => {
    if (!currentSong) {
      setIsLiked(false);
      return;
    }
    const checkLiked = async () => {
      try {
        const { is_liked } = await likesApi.checkLike(currentSong.id);
        setIsLiked(is_liked);
      } catch {
        setIsLiked(false);
      }
    };
    checkLiked();
  }, [currentSong]);

  const handleToggleLike = async () => {
    if (!currentSong) return;
    try {
      if (isLiked) {
        await likesApi.unlikeSong(currentSong.id);
        setIsLiked(false);
      } else {
        await likesApi.likeSong(currentSong.id);
        setIsLiked(true);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  return (
    <footer className="h-24 bg-[#181818] border-t border-[#282828] px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Song Info */}
      <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
        {currentSong ? (
          <>
            <div className="w-14 h-14 rounded bg-[#282828] shrink-0 overflow-hidden flex items-center justify-center shadow">
              {currentSong.cover_url ? (
                <img
                  src={currentSong.cover_url}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-7 h-7 text-[#b3b3b3]" />
              )}
            </div>
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-sm font-semibold text-white truncate hover:underline cursor-pointer">
                {currentSong.title}
              </span>
              <span className="text-xs text-[#b3b3b3] truncate hover:underline cursor-pointer">
                {currentSong.artist}
              </span>
            </div>
            <button
              onClick={handleToggleLike}
              className={`p-1.5 transition-colors ${
                isLiked ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
              }`}
              title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 text-xs text-[#727272]">
            <div className="w-14 h-14 rounded bg-[#242424] flex items-center justify-center">
              <Music className="w-6 h-6 text-[#555]" />
            </div>
            <span>No song selected</span>
          </div>
        )}
      </div>

      {/* Center: Playback Controls & Scrubber */}
      <div className="flex flex-col items-center gap-2 max-w-[700px] w-2/4">
        <div className="flex items-center gap-6">
          <button
            onClick={toggleShuffle}
            className={`transition-colors relative p-1 ${
              isShuffle ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
            {isShuffle && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full" />}
          </button>

          <button
            onClick={previousSong}
            disabled={!currentSong}
            className="text-[#b3b3b3] hover:text-white disabled:opacity-40 transition-colors p-1"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            disabled={!currentSong}
            className="w-9 h-9 rounded-full bg-white hover:scale-105 active:scale-95 transition-transform flex items-center justify-center text-black shadow-lg disabled:opacity-40"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-black" />
            ) : (
              <Play className="w-5 h-5 fill-black ml-0.5" />
            )}
          </button>

          <button
            onClick={nextSong}
            disabled={!currentSong}
            className="text-[#b3b3b3] hover:text-white disabled:opacity-40 transition-colors p-1"
            title="Next"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`transition-colors relative p-1 ${
              repeatMode !== 'off' ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            {repeatMode !== 'off' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full" />
            )}
          </button>
        </div>

        {/* Scrubber Progress Bar */}
        <div className="w-full flex items-center gap-2 text-[11px] text-[#a7a7a7] font-mono">
          <span className="w-10 text-right">{formatTime(progress)}</span>
          <div className="relative flex-1 group py-1 flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              disabled={!currentSong}
              className="w-full h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer group-hover:h-1.5 transition-all outline-none"
              style={{
                background: `linear-gradient(to right, #1db954 ${progressPercent}%, #4d4d4d ${progressPercent}%)`,
              }}
            />
          </div>
          <span className="w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Queue & Volume */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[180px]">
        <button
          onClick={toggleQueue}
          className={`p-2 rounded hover:bg-[#282828] transition-colors ${
            isQueueOpen ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
          }`}
          title="Queue"
        >
          <ListMusic className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 w-32 group">
          <button
            onClick={toggleMute}
            className="text-[#b3b3b3] hover:text-white transition-colors p-1"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-[#ff6b6b]" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer group-hover:h-1.5 transition-all outline-none"
            style={{
              background: `linear-gradient(to right, #1db954 ${volumePercent}%, #4d4d4d ${volumePercent}%)`,
            }}
          />
        </div>
      </div>
    </footer>
  );
};
