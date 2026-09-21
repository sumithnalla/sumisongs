import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MoreVertical,
  Share2,
  Check,
  CheckCircle2,
  Laptop2,
  Pencil,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { likesApi } from '../api/likes';
import { EditSongModal } from './EditSongModal';

export const GlobalPlayer: React.FC = () => {
  const navigate = useNavigate();
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
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [nowPlayingMenuOpen, setNowPlayingMenuOpen] = useState<boolean>(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [lyricsExpanded, setLyricsExpanded] = useState<boolean>(false);

  const nowPlayingMenuRef = useRef<HTMLDivElement>(null);
  const desktopMenuRef = useRef<HTMLDivElement>(null);

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

  // Click outside to close now playing dropdown menu
  useEffect(() => {
    if (!nowPlayingMenuOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (nowPlayingMenuRef.current && !nowPlayingMenuRef.current.contains(e.target as Node)) {
        setNowPlayingMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [nowPlayingMenuOpen]);

  // Click outside for desktop menu
  useEffect(() => {
    if (!desktopMenuOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target as Node)) {
        setDesktopMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [desktopMenuOpen]);

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

  const handleShare = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentSong) return;
    const songUrl = `${window.location.origin}/song/${currentSong.id}`;
    navigator.clipboard.writeText(songUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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
              <div className="w-10 h-10 rounded-lg bg-theme-card shrink-0 overflow-hidden flex items-center justify-center shadow-sm border border-theme-subtle">
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

      {/* ── MOBILE FULLSCREEN NOW PLAYING MODAL (Matches user screenshot 2) ────────────────── */}
      {isMobileModalOpen && currentSong && (
        <div className="md:hidden fixed inset-0 z-50 bg-gradient-to-b from-[#3a2012] via-[#21140e] to-[#120a06] text-white flex flex-col p-6 overflow-y-auto animate-in slide-in-from-bottom duration-250 select-none">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setIsMobileModalOpen(false)}
              className="p-2 -ml-2 rounded-full text-white/80 hover:text-white transition-colors"
              aria-label="Collapse now playing"
            >
              <ChevronDown className="w-7 h-7" />
            </button>

            <div className="flex flex-col items-center text-center px-4">
              <span className="text-[11px] uppercase tracking-widest text-white/60 font-medium">
                Playing from Playlist
              </span>
              <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[220px]">
                {currentSong.album || 'My Library'}
              </span>
            </div>

            {/* Three Dots Menu on Now Playing Screen */}
            <div className="relative" ref={nowPlayingMenuRef}>
              <button
                onClick={() => setNowPlayingMenuOpen((prev) => !prev)}
                className="p-2 -mr-2 rounded-full text-white/80 hover:text-white transition-colors"
                aria-label="Options"
              >
                <MoreVertical className="w-6 h-6" />
              </button>

              {nowPlayingMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#282828] border border-white/10 shadow-2xl py-1 z-50 text-xs text-white">
                  <button
                    onClick={() => {
                      setNowPlayingMenuOpen(false);
                      setIsMobileModalOpen(false);
                      navigate(`/song/${currentSong.id}`);
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-sky-400" />
                    <span>View song screen</span>
                  </button>

                  <button
                    onClick={() => {
                      setNowPlayingMenuOpen(false);
                      setIsEditModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-amber-400" />
                    <span>Edit song details</span>
                  </button>

                  <button
                    onClick={() => {
                      setNowPlayingMenuOpen(false);
                      handleShare();
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-[#1db954]" />
                    <span>Copy song link</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Large Square Album Artwork */}
          <div className="w-full aspect-square max-w-[320px] mx-auto rounded-xl bg-black/40 overflow-hidden shadow-2xl flex items-center justify-center mb-7 border border-white/10">
            {currentSong.cover_url ? (
              <img
                src={currentSong.cover_url}
                alt={currentSong.title}
                className="w-full h-full object-cover shadow-inner"
              />
            ) : (
              <Music className="w-24 h-24 text-white/40" />
            )}
          </div>

          {/* Track Title, Artist & Verified/Liked Status Button (Matching Screenshot 2) */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex flex-col min-w-0 pr-3">
              <h2
                onClick={() => {
                  setIsMobileModalOpen(false);
                  navigate(`/song/${currentSong.id}`);
                }}
                className="text-xl sm:text-2xl font-black text-white tracking-tight truncate cursor-pointer hover:underline"
              >
                {currentSong.title}
              </h2>
              <p className="text-sm sm:text-base text-white/70 truncate mt-0.5 font-medium">
                {currentSong.artist}
              </p>
            </div>

            {/* Green circular checkmark button (Screenshot 2 icon) */}
            <button
              onClick={(e) => handleToggleLike(e)}
              className="p-1 transition-transform active:scale-125 shrink-0"
              aria-label="Save song"
            >
              {isLiked ? (
                <div className="w-8 h-8 rounded-full bg-[#1db954] flex items-center justify-center shadow-lg shadow-[#1db954]/30">
                  <Check className="w-5 h-5 text-black stroke-[3]" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-white/40 flex items-center justify-center hover:border-white">
                  <Heart className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          </div>

          {/* Scrubber Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer outline-none"
              style={{
                background: `linear-gradient(to right, #ffffff ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`,
              }}
            />
            <div className="flex items-center justify-between text-xs text-white/60 mt-1.5 font-mono">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Transport Controls Row (Matching Screenshot 2) */}
          <div className="flex items-center justify-between px-2 mb-6">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`p-2 transition-colors ${
                isShuffle ? 'text-[#1db954]' : 'text-white/60 hover:text-white'
              }`}
            >
              <Shuffle className="w-6 h-6" />
            </button>

            {/* Previous */}
            <button
              onClick={previousSong}
              className="p-2 text-white active:scale-90 transition-transform"
            >
              <SkipBack className="w-8 h-8 fill-current" />
            </button>

            {/* Large White Circular Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-black" />
              ) : (
                <Play className="w-8 h-8 fill-black ml-1" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextSong}
              className="p-2 text-white active:scale-90 transition-transform"
            >
              <SkipForward className="w-8 h-8 fill-current" />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              className={`p-2 transition-colors ${
                repeatMode !== 'off' ? 'text-[#1db954]' : 'text-white/60 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-6 h-6" />
              ) : (
                <Repeat className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Bottom Utility Icons Row (Device, Share, Queue from Screenshot 2) */}
          <div className="flex items-center justify-between px-2 mb-5 text-white/70">
            <button
              onClick={() => {}}
              className="hover:text-white transition-colors"
              title="Current device"
            >
              <Laptop2 className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-6">
              <button
                onClick={handleShare}
                className="hover:text-white transition-colors relative"
                title="Share track"
              >
                {copiedLink ? <Check className="w-5 h-5 text-[#1db954]" /> : <Share2 className="w-5 h-5" />}
              </button>

              <button
                onClick={() => {
                  setIsMobileModalOpen(false);
                  toggleQueue();
                }}
                className={`hover:text-white transition-colors ${
                  isQueueOpen ? 'text-[#1db954]' : ''
                }`}
                title="Queue"
              >
                <ListMusic className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lyrics Preview Drawer (Matching Screenshot 2) */}
          <div
            onClick={() => setLyricsExpanded((prev) => !prev)}
            className="rounded-2xl bg-[#522915] p-5 shadow-2xl border border-white/10 cursor-pointer relative overflow-hidden transition-all mt-auto"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white tracking-wide">Lyrics preview</h3>
              <span className="text-[11px] font-semibold text-white/60">
                {lyricsExpanded ? 'Tap to collapse' : 'Tap to expand'}
              </span>
            </div>

            <div className={`space-y-1 text-white/90 text-sm font-semibold transition-all ${lyricsExpanded ? '' : 'max-h-20 overflow-hidden'}`}>
              <p className="text-white text-base">♫ {currentSong.title}</p>
              <p className="text-white/80">{currentSong.artist}</p>
              <p className="text-white/70">Playing in high-fidelity 320kbps MP3</p>
              {lyricsExpanded && (
                <>
                  <p className="text-white/60 pt-2">Full lyrics synchronized with Cloudflare stream</p>
                  <p className="text-white/50">Lossless audio cached at the edge</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP PLAYBACK BAR (>= md) ────────────────────────── */}
      <footer className="hidden md:flex h-24 bg-theme-player border-t border-theme-subtle px-4 items-center justify-between z-30 select-none transition-colors">
        {/* Left: Song Info */}
        <div className="flex items-center gap-3 w-1/4 min-w-[200px]">
          {currentSong ? (
            <>
              <div
                onClick={() => navigate(`/song/${currentSong.id}`)}
                className="w-14 h-14 rounded-lg bg-theme-card shrink-0 overflow-hidden flex items-center justify-center shadow-md border border-theme-subtle cursor-pointer hover:scale-105 transition-transform"
                title="View song screen"
              >
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

              <div className="flex flex-col min-w-0 pr-1">
                <span
                  onClick={() => navigate(`/song/${currentSong.id}`)}
                  className="text-sm font-semibold text-theme-primary truncate hover:underline cursor-pointer"
                  title="View song screen"
                >
                  {currentSong.title}
                </span>
                <span
                  onClick={() => navigate(`/song/${currentSong.id}`)}
                  className="text-xs text-theme-secondary truncate hover:underline cursor-pointer"
                >
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

              {/* Desktop 3-dots Menu */}
              <div className="relative" ref={desktopMenuRef}>
                <button
                  onClick={() => setDesktopMenuOpen((prev) => !prev)}
                  className="p-1.5 text-theme-secondary hover:text-theme-primary rounded hover:bg-theme-card transition-colors"
                  title="More song actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {desktopMenuOpen && (
                  <div className="absolute left-0 bottom-full mb-2 w-44 rounded-xl bg-theme-surface border border-theme-medium shadow-2xl py-1 z-50 text-xs text-theme-primary">
                    <button
                      onClick={() => {
                        setDesktopMenuOpen(false);
                        navigate(`/song/${currentSong.id}`);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-theme-card flex items-center gap-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                      <span>View song screen</span>
                    </button>
                    <button
                      onClick={() => {
                        setDesktopMenuOpen(false);
                        setIsEditModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-theme-card flex items-center gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit song details</span>
                    </button>
                    <button
                      onClick={() => {
                        setDesktopMenuOpen(false);
                        handleShare();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-theme-card flex items-center gap-2"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#1db954]" />
                      <span>Share song link</span>
                    </button>
                  </div>
                )}
              </div>
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
        <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px]">
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
              title={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
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

      {/* Global Edit Song Modal */}
      <EditSongModal
        song={currentSong}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
};
