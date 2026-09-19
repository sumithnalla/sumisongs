import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login({ username: username.trim(), password });
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Quick seed logins for pair-programming convenience
  const fillCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#1e1e1e] via-[#121212] to-black flex flex-col items-center justify-center p-6 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 cursor-pointer">
        <div className="w-12 h-12 rounded-full bg-[#1db954] flex items-center justify-center shadow-xl shadow-[#1db954]/30">
          <Music className="w-7 h-7 text-black fill-current" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Spotify</h1>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#181818] rounded-2xl border border-[#282828] shadow-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Log in to continue</h2>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-2">
              Email or Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="name@domain.com"
                className="w-full px-4 py-3 pl-11 rounded-lg bg-[#242424] text-white placeholder-[#666] border border-[#333] focus:border-[#1db954] focus:outline-none text-sm transition-all"
                required
              />
              <Mail className="w-5 h-5 text-[#888] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pl-11 rounded-lg bg-[#242424] text-white placeholder-[#666] border border-[#333] focus:border-[#1db954] focus:outline-none text-sm transition-all"
                required
              />
              <Lock className="w-5 h-5 text-[#888] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full font-bold text-sm bg-[#1db954] text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mt-6 shadow-lg shadow-[#1db954]/25 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Log In'}
          </button>
        </form>

        {/* Fast-fill quick demo accounts */}
        <div className="mt-8 pt-6 border-t border-[#282828]">
          <p className="text-xs text-[#888] text-center mb-3 font-semibold uppercase tracking-wider">
            Quick Fill Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => fillCredentials('sumithnalla0607@gmail.com', 'SN06072006')}
              className="px-3 py-2 rounded-lg bg-[#242424] hover:bg-[#2d2d2d] text-xs font-medium text-[#e0e0e0] border border-[#333] transition-colors text-left"
            >
              <span className="block font-bold text-white">Standard User</span>
              <span className="text-[10px] text-[#888] truncate block">sumithnalla0607...</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('sumithofficial2@gmail.com', 'sumith0FF_1104')}
              className="px-3 py-2 rounded-lg bg-[#242424] hover:bg-[#2d2d2d] text-xs font-medium text-[#e0e0e0] border border-[#333] transition-colors text-left"
            >
              <span className="block font-bold text-[#1db954]">Admin User</span>
              <span className="text-[10px] text-[#888] truncate block">sumithofficial2...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
