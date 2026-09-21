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
  ChevronDown,
  Maximize2,
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
  const [isMobileModalOpen, setIsMobileModalOpen] = useState<boolean>(false);

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

  const handleToggleLike = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
    <>
      {/* ── MOBILE FLOATING MINI PLAYER (< md) ───────────────────── */}
      {currentSong && (
        <div className="md:hidden fixed bottom-[56px] left-2 right-2 z-30 select-none">
          <div
            onClick={() => setIsMobileModalOpen(true)}
            className="relative bg-theme-surface/95 backdrop-blur-md rounded-xl p-2 pl-2.5 flex items-center justify-between border border-theme-medium shadow-2xl overflow-hidden cursor-pointer"
          >
            {/* Top Micro-Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-theme-subtle">
              <div
                className="h-full bg-[#1db954] transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Left: Thumbnail + Track Info */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              <div className="w-10 h-10 rounded-lg bg-theme-card shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
                {currentSong.cover_url ? (
                  <img
                    src={currentSong.cover_url}
                    alt={currentSong.title}
                    className={`w-full h-full object-cover ${isPlaying ? 'animate-pulse' : ''}`}
                  />
                ) : (
                  <Music className="w-5 h-5 text-theme-secondary" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-theme-primary truncate">
                  {currentSong.title}
                </span>
                <span className="text-[11px] text-theme-secondary truncate">
                  {currentSong.artist}
                </span>
              </div>
            </div>

            {/* Right: Like, Play/Pause, Next */}
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => handleToggleLike(e)}
                className={`p-2 transition-colors ${
                  isLiked ? 'text-[#1db954]' : 'text-theme-secondary hover:text-theme-primary'
                }`}
                aria-label="Like song"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-md active:scale-90 transition-transform"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-black" />
                ) : (
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                )}
              </button>

              <button
                onClick={nextSong}
                className="p-2 text-theme-secondary hover:text-theme-primary transition-colors active:scale-90"
                aria-label="Next song"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE FULLSCREEN NOW PLAYING MODAL ────────────────── */}
      {isMobileModalOpen && currentSong && (
        <div className="md:hidden fixed inset-0 z-50 bg-theme-surface flex flex-col p-6 overflow-y-auto animate-in slide-in-from-bottom duration-250 select-none">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setIsMobileModalOpen(false)}
              className="p-2 rounded-full text-theme-secondary hover:text-theme-primary bg-theme-card"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[11px] uppercase tracking-widest text-theme-secondary font-bold">
                Playing from Library
              </span>
              <span className="text-xs font-semibold text-theme-primary truncate max-w-[200px]">
                {currentSong.album || 'Spotify Clone'}
              </span>
            </div>
            <button
              onClick={toggleQueue}
              className={`p-2 rounded-full ${
                isQueueOpen ? 'text-[#1db954] bg-[#1db954]/10' : 'text-theme-secondary bg-theme-card'
              }`}
            >
              <ListMusic className="w-5 h-5" />
            </button>
          </div>

          {/* Large Album Art */}
          <div className="w-full aspect-square max-w-sm mx-auto rounded-2xl bg-theme-card overflow-hidden shadow-2xl flex items-center justify-center mb-8 border border-theme-subtle">
            {currentSong.cover_url ? (
              <img
                src={currentSong.cover_url}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="w-24 h-24 text-theme-muted" />
            )}
          </div>

          {/* Song Meta + Like */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col min-w-0 pr-4">
              <h2 className="text-xl font-extrabold text-theme-primary truncate">
                {currentSong.title}
              </h2>
              <p className="text-sm text-theme-secondary truncate mt-0.5">
                {currentSong.artist}
              </p>
            </div>
            <button
              onClick={(e) => handleToggleLike(e)}
              className={`p-2 transition-transform active:scale-125 ${
                isLiked ? 'text-[#1db954]' : 'text-theme-secondary'
              }`}
            >
              <Heart className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Scrubber */}
          <div className="mb-6">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1.5 bg-theme-medium rounded-lg appearance-none cursor-pointer outline-none"
              style={{
                background: `linear-gradient(to right, #1db954 ${progressPercent}% , var(--border-medium) ${progressPercent}%)`,
              }}
            />
            <div className="flex items-center justify-between text-xs text-theme-secondary mt-2 font-mono">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center justify-between px-2 mb-8">
            <button
              onClick={toggleShuffle}
              className={`p-2 transition-colors ${
                isShuffle ? 'text-[#1db954]' : 'text-theme-secondary'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              onClick={previousSong}
              className="p-2 text-theme-primary active:scale-90 transition-transform"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-black" />
              ) : (
                <Play className="w-8 h-8 fill-black ml-1" />
              )}
            </button>

            <button
              onClick={nextSong}
              className="p-2 text-theme-primary active:scale-90 transition-transform"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>

            <button
              onClick={toggleRepeat}
              className={`p-2 transition-colors ${
                repeatMode !== 'off' ? 'text-[#1db954]' : 'text-theme-secondary'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-5 h-5" />
              ) : (
                <Repeat className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Volume Row */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-theme-card border border-theme-subtle">
            <button onClick={toggleMute} className="text-theme-secondary">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-red-400" />
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
              className="w-full h-1 bg-theme-medium rounded-lg appearance-none cursor-pointer outline-none"
              style={{
                background: `linear-gradient(to right, #1db954 ${volumePercent}%, var(--border-medium) ${volumePercent}%)`,
              }}
            />
          </div>
        </div>
      )}

      {/* ── DESKTOP PLAYBACK BAR (>= md) ────────────────────────── */}
      <footer className="hidden md:flex h-24 bg-theme-player border-t border-theme-subtle px-4 items-center justify-between z-30 select-none transition-colors">
        {/* Left: Song Info */}
        <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
          {currentSong ? (
            <>
              <div className="w-14 h-14 rounded-lg bg-theme-card shrink-0 overflow-hidden flex items-center justify-center shadow-md border border-theme-subtle">
                {currentSong.cover_url ? (
                  <img
                    src={currentSong.cover_url}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="w-7 h-7 text-theme-muted" />
                )}
              </div>
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-sm font-semibold text-theme-primary truncate hover:underline cursor-pointer">
                  {currentSong.title}
                </span>
                <span className="text-xs text-theme-secondary truncate hover:underline cursor-pointer">
                  {currentSong.artist}
                </span>
              </div>
              <button
                onClick={(e) => handleToggleLike(e)}
                className={`p-1.5 transition-colors ${
                  isLiked ? 'text-[#1db954]' : 'text-theme-secondary hover:text-theme-primary'
                }`}
                title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 text-xs text-theme-muted">
              <div className="w-14 h-14 rounded bg-theme-card flex items-center justify-center">
                <Music className="w-6 h-6 text-theme-muted" />
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
                isShuffle ? 'text-[#1db954]' : 'text-theme-secondary hover:text-theme-primary'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
              {isShuffle && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full" />
              )}
            </button>

            <button
              onClick={previousSong}
              disabled={!currentSong}
              className="text-theme-secondary hover:text-theme-primary disabled:opacity-40 transition-colors p-1"
              title="Previous"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!currentSong}
              className="w-9 h-9 rounded-full bg-[#1db954] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center text-black shadow-lg disabled:opacity-40"
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
              className="text-theme-secondary hover:text-theme-primary disabled:opacity-40 transition-colors p-1"
              title="Next"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={toggleRepeat}
              className={`transition-colors relative p-1 ${
                repeatMode !== 'off'
                  ? 'text-[#1db954]'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
              {repeatMode !== 'off' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full" />
              )}
            </button>
          </div>

          {/* Scrubber Progress Bar */}
          <div className="w-full flex items-center gap-2 text-[11px] text-theme-secondary font-mono">
            <span className="w-10 text-right">{formatTime(progress)}</span>
            <div className="relative flex-1 group py-1 flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={progress}
                onChange={(e) => seek(Number(e.target.value))}
                disabled={!currentSong}
                className="w-full h-1 bg-theme-medium rounded-lg appearance-none cursor-pointer group-hover:h-1.5 transition-all outline-none"
                style={{
                  background: `linear-gradient(to right, #1db954 ${progressPercent}%, var(--border-medium) ${progressPercent}%)`,
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
            className={`p-2 rounded-lg hover:bg-theme-card transition-colors ${
              isQueueOpen ? 'text-[#1db954]' : 'text-theme-secondary hover:text-theme-primary'
            }`}
            title="Queue"
          >
            <ListMusic className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 w-32 group">
            <button
              onClick={toggleMute}
              className="text-theme-secondary hover:text-theme-primary transition-colors p-1"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-red-400" />
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
              className="w-full h-1 bg-theme-medium rounded-lg appearance-none cursor-pointer group-hover:h-1.5 transition-all outline-none"
              style={{
                background: `linear-gradient(to right, #1db954 ${volumePercent}%, var(--border-medium) ${volumePercent}%)`,
              }}
            />
          </div>
        </div>
      </footer>
    </>
  );
};
