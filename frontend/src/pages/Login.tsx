import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { Logo } from '../components/Logo';

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
    <div className="min-h-screen w-full bg-theme-base flex flex-col items-center justify-center p-4 sm:p-6 select-none relative transition-colors duration-300">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      {/* Brand Header */}
      <div className="mb-6 sm:mb-8">
        <Logo size="lg" showText textSize="text-3xl font-black tracking-tight" />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-theme-surface rounded-2xl border border-theme-subtle shadow-2xl p-6 sm:p-8 text-theme-primary transition-colors">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-theme-primary">Log in to continue</h2>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-2">
              Email or Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="name@domain.com"
                className="w-full px-4 py-3 pl-11 rounded-lg bg-theme-elevated text-theme-primary placeholder-theme-muted border border-theme-subtle focus:border-[#1db954] focus:outline-none text-sm transition-all"
                required
              />
              <Mail className="w-5 h-5 text-theme-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pl-11 rounded-lg bg-theme-elevated text-theme-primary placeholder-theme-muted border border-theme-subtle focus:border-[#1db954] focus:outline-none text-sm transition-all"
                required
              />
              <Lock className="w-5 h-5 text-theme-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
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
        <div className="mt-8 pt-6 border-t border-theme-subtle">
          <p className="text-xs text-theme-muted text-center mb-3 font-semibold uppercase tracking-wider">
            Quick Fill Demo Accounts
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => fillCredentials('sumithnalla0607@gmail.com', 'SN06072006')}
              className="px-3 py-2.5 rounded-lg bg-theme-elevated hover:bg-theme-hover text-xs font-medium text-theme-primary border border-theme-subtle transition-colors text-left"
            >
              <span className="block font-bold text-theme-primary">Standard User</span>
              <span className="text-[10px] text-theme-muted truncate block">sumithnalla0607...</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('sumithofficial2@gmail.com', 'SN06072006')}
              className="px-3 py-2.5 rounded-lg bg-theme-elevated hover:bg-theme-hover text-xs font-medium text-theme-primary border border-theme-subtle transition-colors text-left"
            >
              <span className="block font-bold text-[#1db954]">Admin User</span>
              <span className="text-[10px] text-theme-muted truncate block">sumithofficial2...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
