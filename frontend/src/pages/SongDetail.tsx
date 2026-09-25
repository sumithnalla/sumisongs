import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Play,
  Pause,
  Heart,
  Plus,
  Pencil,
  Share2,
  Music,
  Clock,
  Calendar,
  Headphones,
  Disc,
  User,
  ArrowLeft,
  Check,
  Radio,
  FileText,
} from 'lucide-react';
import { songsApi } from '../api/songs';
import { likesApi } from '../api/likes';
import { Song } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { SongRow } from '../components/SongRow';
import { EditSongModal } from '../components/EditSongModal';
import { LoadingScreen } from '../components/LoadingScreen';

export const SongDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openAddToPlaylist } = useOutletContext<{ openAddToPlaylist: (song: Song) => void }>();
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();

  const [song, setSong] = useState<Song | null>(null);
  const [relatedSongs, setRelatedSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lyricsExpanded, setLyricsExpanded] = useState(false);

  const fetchSongDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const songData = await songsApi.getSong(id);
      setSong(songData);
      setIsLiked(songData.is_liked || false);

      // Fetch other songs for recommended / artist queue
      const all = await songsApi.getSongs(1, 15);
      setRelatedSongs(all.songs.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to load song details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongDetails();
  }, [id]);

  const isCurrent = currentSong?.id === song?.id;

  const handlePlaySong = () => {
    if (!song) return;
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, [song, ...relatedSongs]);
    }
  };

  const handleLike = async () => {
    if (!song) return;
    try {
      if (isLiked) {
        await likesApi.unlikeSong(song.id);
        setIsLiked(false);
      } else {
        await likesApi.likeSong(song.id);
        setIsLiked(true);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Recently added';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recently added';
    }
  };

  if (loading) {
    return <LoadingScreen fullScreen={false} message="Loading song details..." />;
  }

  if (!song) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-elevated flex items-center justify-center">
          <Music className="w-8 h-8 text-theme-muted" />
        </div>
        <h2 className="text-xl font-bold text-theme-primary mb-2">Song not found</h2>
        <p className="text-xs text-theme-secondary mb-6">This song may have been deleted or does not exist.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-full bg-[#1db954] text-black font-bold text-xs hover:scale-105 transition-transform"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-12">
      {/* Back button row */}
      <div className="px-4 sm:px-8 pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-theme-secondary hover:text-theme-primary transition-colors py-1.5 px-3 rounded-full bg-theme-card border border-theme-subtle hover:bg-theme-card-hover"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="px-4 sm:px-8 py-6 flex flex-col md:flex-row items-center md:items-end gap-6 bg-gradient-to-b from-theme-card/70 via-theme-surface to-theme-surface border-b border-theme-subtle/50 transition-colors">
        {/* Cover Artwork */}
        <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-2xl bg-theme-elevated shadow-2xl shadow-black/50 overflow-hidden shrink-0 flex items-center justify-center border border-theme-subtle relative group">
          {song.cover_url ? (
            <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-theme-elevated flex items-center justify-center">
              <Music className="w-20 h-20 text-theme-muted" />
            </div>
          )}

          {/* Quick Play overlay button on art */}
          <button
            onClick={handlePlaySong}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            title={isCurrent && isPlaying ? 'Pause' : 'Play'}
          >
            <div className="w-14 h-14 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform">
              {isCurrent && isPlaying ? (
                <Pause className="w-6 h-6 fill-black" />
              ) : (
                <Play className="w-6 h-6 fill-black ml-1" />
              )}
            </div>
          </button>
        </div>

        {/* Hero Metadata */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-widest uppercase bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30">
              Track
            </span>
            {song.genre && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium text-theme-secondary bg-theme-elevated border border-theme-subtle">
                {song.genre}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-theme-primary tracking-tight mb-3 line-clamp-2">
            {song.title}
          </h1>

          {/* Artist & Details Subtitle */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1 text-xs sm:text-sm text-theme-secondary">
            <span className="font-bold text-theme-primary flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#1db954]" />
              {song.artist}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Disc className="w-3.5 h-3.5" />
              {song.album || 'Single'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(song.created_at)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(song.duration)}
            </span>
          </div>

          {/* Stream Count Indicator */}
          <div className="mt-3 flex items-center gap-2 text-xs text-theme-muted">
            <Headphones className="w-3.5 h-3.5" />
            <span>{(song.play_count || 0).toLocaleString()} streams</span>
          </div>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="px-4 sm:px-8 py-5 flex flex-wrap items-center gap-3 sm:gap-4 border-b border-theme-subtle/50 bg-theme-surface/50">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlaySong}
          className="w-14 h-14 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl shadow-[#1db954]/30 hover:scale-105 active:scale-95 transition-all"
          title={isCurrent && isPlaying ? 'Pause' : 'Play'}
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-7 h-7 fill-black" />
          ) : (
            <Play className="w-7 h-7 fill-black ml-1" />
          )}
        </button>

        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`p-3 rounded-full border border-theme-subtle hover:bg-theme-card transition-all ${
            isLiked ? 'text-[#1db954] border-[#1db954]/40 bg-[#1db954]/10' : 'text-theme-secondary hover:text-theme-primary'
          }`}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        {/* Add to Playlist */}
        <button
          onClick={() => openAddToPlaylist(song)}
          className="px-4 py-2.5 rounded-full border border-theme-subtle bg-theme-card hover:bg-theme-card-hover text-xs font-bold text-theme-primary flex items-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4 text-[#1db954]" />
          <span>Add to playlist</span>
        </button>

        {/* Edit Song Details */}
        <button
          onClick={() => setIsEditOpen(true)}
          className="px-4 py-2.5 rounded-full border border-theme-subtle bg-theme-card hover:bg-theme-card-hover text-xs font-bold text-theme-primary flex items-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <Pencil className="w-4 h-4 text-amber-400" />
          <span>Edit song</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="p-3 rounded-full border border-theme-subtle hover:bg-theme-card text-theme-secondary hover:text-theme-primary transition-all active:scale-95"
          title="Copy link to track"
        >
          {copiedLink ? <Check className="w-5 h-5 text-[#1db954]" /> : <Share2 className="w-5 h-5" />}
        </button>

        {copiedLink && (
          <span className="text-xs text-[#1db954] font-semibold animate-in fade-in">
            Link copied to clipboard!
          </span>
        )}
      </div>

      {/* Body: Two columns layout */}
      <div className="px-4 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Lyrics Preview Card & Recommended Tracks */}
        <div className="lg:col-span-2 space-y-8">
          {/* Lyrics Preview Card (Styled after Spotify Mobile screenshot) */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/40 via-amber-900/20 to-theme-card border border-amber-500/20 shadow-xl relative overflow-hidden transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Lyrics preview</h3>
              </div>
              <button
                onClick={() => setLyricsExpanded((prev) => !prev)}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4"
              >
                {lyricsExpanded ? 'Show less' : 'Show full lyrics'}
              </button>
            </div>

            {/* Lyrics content lines */}
            <div className={`space-y-3 font-medium transition-all ${lyricsExpanded ? '' : 'max-h-36 overflow-hidden'}`}>
              <p className="text-lg sm:text-xl font-bold text-white/95 leading-relaxed">
                ♫ {song.title} — {song.artist}
              </p>
              <p className="text-base sm:text-lg text-white/80 leading-relaxed">
                Listening to the rhythm, feeling the frequency...
              </p>
              <p className="text-base sm:text-lg text-white/70 leading-relaxed">
                {song.album ? `From the album "${song.album}"` : 'Studio Master Recording'}
              </p>
              <p className="text-base sm:text-lg text-white/60 leading-relaxed">
                Streamed directly with high-fidelity lossless playback.
              </p>
              {lyricsExpanded && (
                <>
                  <p className="text-base text-white/50 leading-relaxed">
                    Synced lyrics available in the live player view.
                  </p>
                  <p className="text-base text-white/40 leading-relaxed">
                    Audio powered by Cloudflare CDN and GridFS.
                  </p>
                </>
              )}
            </div>

            {/* Subtle bottom fade if not expanded */}
            {!lyricsExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            )}
          </div>

          {/* Recommended / More Tracks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-theme-primary">More tracks to discover</h2>
              <span className="text-xs text-theme-secondary">{relatedSongs.length} available</span>
            </div>

            <div className="space-y-1">
              {relatedSongs.slice(0, 8).map((relSong, idx) => (
                <SongRow
                  key={relSong.id}
                  song={relSong}
                  index={idx}
                  allSongs={[song, ...relatedSongs]}
                  onAddToPlaylist={openAddToPlaylist}
                  onSongUpdated={(updated) => {
                    setRelatedSongs((prev) =>
                      prev.map((s) => (s.id === updated.id ? updated : s))
                    );
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Audio & Metadata Info Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-theme-card border border-theme-subtle shadow-md space-y-4">
            <h3 className="text-sm font-bold text-theme-primary uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#1db954]" />
              <span>Track Metadata</span>
            </h3>

            <div className="divide-y divide-theme-subtle text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-theme-secondary">Title</span>
                <span className="font-semibold text-theme-primary">{song.title}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-theme-secondary">Artist</span>
                <span className="font-semibold text-theme-primary">{song.artist}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-theme-secondary">Album</span>
                <span className="font-semibold text-theme-primary">{song.album || 'Single'}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-theme-secondary">Genre</span>
                <span className="font-semibold text-theme-primary">{song.genre || 'Music'}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-theme-secondary">Duration</span>
                <span className="font-mono font-semibold text-theme-primary">{formatDuration(song.duration)}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-theme-secondary">Play count</span>
                <span className="font-semibold text-theme-primary">{(song.play_count || 0).toLocaleString()}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-theme-secondary">Format</span>
                <span className="font-mono font-semibold text-emerald-400">MP3 320kbps</span>
              </div>
            </div>

            <button
              onClick={() => setIsEditOpen(true)}
              className="w-full py-2.5 rounded-xl border border-theme-subtle bg-theme-elevated hover:bg-theme-hover text-xs font-bold text-theme-primary flex items-center justify-center gap-2 transition-colors mt-2"
            >
              <Pencil className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Track Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditSongModal
        song={song}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onUpdated={(updated) => setSong(updated)}
      />
    </div>
  );
};
