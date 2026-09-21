import React, { useEffect, useState } from 'react';
import { Shield, Users, Music, ListMusic, PlayCircle, Plus, Trash2, Check, X, AlertTriangle } from 'lucide-react';
import { adminApi, CreateUserData } from '../api/admin';
import { User, AdminStats } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(1, 50),
      ]);
      setStats(statsRes);
      setUsers(usersRes.users);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-16 text-center text-[#888]">
        <Shield className="w-16 h-16 mx-auto mb-3 text-[#ff6b6b]" />
        <h2 className="text-2xl font-bold text-white mb-1">Access Denied</h2>
        <p className="text-sm">You must have administrator privileges to view this page.</p>
      </div>
    );
  }

  const handleToggleActive = async (targetUser: User) => {
    try {
      const updated = await adminApi.updateUser(targetUser.id, {
        is_active: !targetUser.is_active,
      });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user status');
    }
  };

  const handleRoleChange = async (targetUser: User, nextRole: 'user' | 'admin') => {
    try {
      const updated = await adminApi.updateUser(targetUser.id, {
        role: nextRole,
      });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      alert('You cannot delete your own admin account.');
      return;
    }

    if (confirm(`Permanently delete user "${targetUser.username}" and all their playlists/history?`)) {
      try {
        await adminApi.deleteUser(targetUser.id);
        setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete user');
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      const created = await adminApi.createUser({
        username: newUsername.trim(),
        password: newPassword,
        display_name: newDisplayName.trim() || (newUsername.includes('@') ? newUsername.split('@')[0] : newUsername.trim()),
        role: newRole,
      });
      setUsers((prev) => [created, ...prev]);
      setIsCreateOpen(false);
      setNewUsername('');
      setNewPassword('');
      setNewDisplayName('');
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || 'Failed to create user');
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#1db954] mb-1">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-primary tracking-tight">System Overview</h1>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1db954] text-black font-bold text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-theme-card border border-theme-subtle flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-theme-secondary uppercase tracking-wider font-semibold">Users</p>
              <p className="text-xl sm:text-2xl font-black text-theme-primary">{stats.users}</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-theme-card border border-theme-subtle flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#1db954]/10 flex items-center justify-center text-[#1db954] shrink-0">
              <Music className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-theme-secondary uppercase tracking-wider font-semibold">Songs</p>
              <p className="text-xl sm:text-2xl font-black text-theme-primary">{stats.songs}</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-theme-card border border-theme-subtle flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
              <ListMusic className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-theme-secondary uppercase tracking-wider font-semibold">Playlists</p>
              <p className="text-xl sm:text-2xl font-black text-theme-primary">{stats.playlists}</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-theme-card border border-theme-subtle flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
              <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-theme-secondary uppercase tracking-wider font-semibold">Total Plays</p>
              <p className="text-xl sm:text-2xl font-black text-theme-primary">{stats.total_plays}</p>
            </div>
          </div>
        </div>
      )}

      {/* User Management Table */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-theme-primary mb-3 sm:mb-4">User Accounts ({users.length})</h2>
        <div className="bg-theme-card rounded-2xl border border-theme-subtle overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-theme-secondary">
              <thead className="bg-theme-elevated text-xs uppercase font-semibold text-theme-secondary border-b border-theme-subtle">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5">User</th>
                  <th className="px-4 sm:px-6 py-3.5">Role</th>
                  <th className="px-4 sm:px-6 py-3.5">Status</th>
                  <th className="px-4 sm:px-6 py-3.5">Created</th>
                  <th className="px-4 sm:px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-subtle">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-theme-card-hover transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <p className="font-semibold text-theme-primary truncate max-w-xs">{u.username}</p>
                        <p className="text-xs text-theme-muted">{u.display_name || 'No display name'}</p>
                      </td>

                      <td className="px-4 sm:px-6 py-4">
                        {isSelf ? (
                          <span className="text-xs font-bold text-[#1db954] uppercase bg-[#1db954]/10 px-2 py-0.5 rounded">
                            {u.role} (You)
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value as 'user' | 'admin')}
                            className="bg-theme-elevated text-theme-primary border border-theme-subtle rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#1db954]"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.is_active
                              ? 'bg-[#1db954]/10 text-[#1db954]'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.is_active ? 'bg-[#1db954]' : 'bg-red-400'
                            }`}
                          />
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-[#888]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">
                        {!isSelf && (
                          <>
                            <button
                              onClick={() => handleToggleActive(u)}
                              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                u.is_active
                                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                  : 'bg-[#1db954]/10 text-[#1db954] hover:bg-[#1db954]/20'
                              }`}
                            >
                              {u.is_active ? 'Disable' : 'Enable'}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded text-[#ff6b6b] hover:bg-red-500/10 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#282828] rounded-xl border border-[#3e3e3e] shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold">Create New User Account</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-[#b3b3b3] hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-1">
                  Email / Username *
                </label>
                <input
                  type="email"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="user@example.com"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#3e3e3e] text-white placeholder-[#777] border border-transparent focus:border-[#1db954] focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 rounded-lg bg-[#3e3e3e] text-white placeholder-[#777] border border-transparent focus:border-[#1db954] focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 rounded-lg bg-[#3e3e3e] text-white placeholder-[#777] border border-transparent focus:border-[#1db954] focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
                  className="w-full px-3 py-2 rounded-lg bg-[#3e3e3e] text-white border border-transparent focus:border-[#1db954] focus:outline-none text-sm"
                >
                  <option value="user">Standard User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#3e3e3e]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-[#b3b3b3] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full text-xs font-bold bg-[#1db954] text-black hover:scale-105 active:scale-95 transition-all"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
