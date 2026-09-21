import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, Music, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { songsApi } from '../api/songs';

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.mp3')) {
        setError('Only MP3 audio files are supported.');
        return;
      }
      setAudioFile(file);
      setError(null);

      // Pre-fill title if empty
      if (!title) {
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(baseName);
      }
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setError('Please select an MP3 audio file.');
      return;
    }
    if (!title.trim() || !artist.trim()) {
      setError('Title and Artist are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('title', title.trim());
      formData.append('artist', artist.trim());
      if (album.trim()) formData.append('album', album.trim());
      if (genre.trim()) formData.append('genre', genre.trim());
      if (coverFile) formData.append('cover', coverFile);

      await songsApi.uploadSong(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload song');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 pb-24">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-primary tracking-tight">Upload Music</h1>
        <p className="text-xs sm:text-sm text-theme-secondary mt-1">
          Share your tracks with high-fidelity streaming
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-[#1db954]/10 border border-[#1db954]/30 flex items-center gap-3 text-[#1db954] text-xs sm:text-sm font-semibold">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>Song uploaded successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        {/* Audio File Drop Zone */}
        <div>
          <label className="block text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-2">
            MP3 Audio File *
          </label>
          <div
            onClick={() => audioInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
              audioFile
                ? 'border-[#1db954] bg-[#1db954]/5'
                : 'border-theme-medium hover:border-[#1db954] bg-theme-card'
            }`}
          >
            <input
              ref={audioInputRef}
              type="file"
              accept=".mp3,audio/mpeg"
              onChange={handleAudioChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-theme-elevated flex items-center justify-center mb-3">
              {audioFile ? (
                <Music className="w-6 h-6 text-[#1db954]" />
              ) : (
                <UploadIcon className="w-6 h-6 text-theme-muted" />
              )}
            </div>
            {audioFile ? (
              <div className="text-center">
                <p className="text-sm font-bold text-theme-primary truncate max-w-xs sm:max-w-sm">{audioFile.name}</p>
                <p className="text-xs text-theme-secondary mt-1">
                  {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • Tap to replace
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-semibold text-theme-primary">Tap or drag MP3 file here</p>
                <p className="text-xs text-theme-muted mt-1">Up to 50MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Metadata Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Blinding Lights"
              required
              className="w-full px-4 py-3 rounded-xl bg-theme-card text-theme-primary placeholder-theme-muted border border-theme-subtle focus:border-[#1db954] focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-2">
              Artist *
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. The Weeknd"
              required
              className="w-full px-4 py-3 rounded-xl bg-theme-card text-theme-primary placeholder-theme-muted border border-theme-subtle focus:border-[#1db954] focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-2">
              Album
            </label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              placeholder="e.g. After Hours"
              className="w-full px-4 py-3 rounded-xl bg-theme-card text-theme-primary placeholder-theme-muted border border-theme-subtle focus:border-[#1db954] focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-2">
              Genre
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g. Synthwave"
              className="w-full px-4 py-3 rounded-xl bg-theme-card text-theme-primary placeholder-theme-muted border border-theme-subtle focus:border-[#1db954] focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Cover Art Picker */}
        <div>
          <label className="block text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-2">
            Cover Art (optional)
          </label>
          <div className="flex items-center gap-4">
            <div
              onClick={() => coverInputRef.current?.click()}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-theme-card border border-theme-medium hover:border-[#1db954] flex items-center justify-center cursor-pointer overflow-hidden relative shrink-0"
            >
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
              {coverPreview ? (
                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-7 h-7 sm:w-8 sm:h-8 text-theme-muted" />
              )}
            </div>
            <div className="text-xs text-theme-secondary">
              <p className="font-semibold text-theme-primary">Square JPG or PNG</p>
              <p>Recommended size: 500x500 px. Max 5MB.</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading || !audioFile}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#1db954] text-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#1db954]/20 disabled:opacity-40"
          >
            {loading ? 'Uploading song...' : 'Publish Song'}
          </button>
        </div>
      </form>
    </div>
  );
};
