import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Users, Key, Shield, Plus, Check } from 'lucide-react';
import { apiClient } from '../api/client';
import { User } from '../types';
import { Modal } from '../components/common/Modal';

export const Settings: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Modal
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'soc_analyst' | 'viewer'>('soc_analyst');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<User[]>('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.post('/users', {
        email: newUserEmail,
        username: newUsername,
        password: newPassword,
        role: newUserRole,
      });
      setShowCreateUser(false);
      setNewUserEmail('');
      setNewUsername('');
      setNewPassword('');
      fetchUsers();
    } catch (err) {
      console.error('Failed to create user:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 tracking-wide flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            SOC PLATFORM ADMINISTRATION
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Role-Based Access Control (RBAC), ingestion keys, and security hardening configurations.
          </p>
        </div>

        <button
          onClick={() => setShowCreateUser(true)}
          className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-glow-blue"
        >
          <Plus className="w-4 h-4" />
          Add Analyst Account
        </button>
      </div>

      {/* User Management Section */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#0f172a]/80 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          Authorized SOC Personnel & Roles
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-3 text-slate-200 font-bold">{u.username}</td>
                  <td className="py-3 px-3 text-slate-400">{u.email}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-400 font-semibold text-[11px]">ACTIVE</span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Security Environment Variables */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#0f172a]/80 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Key className="w-4 h-4 text-cyan-400" />
          Telemetry Ingestion & Integration Keys
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-slate-400 mb-1">Pre-Shared Collector API Key</div>
            <div className="text-cyan-400 font-bold truncate">eye-collector-pre-shared-auth-key-2026</div>
          </div>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-slate-400 mb-1">AI Provider Engine</div>
            <div className="text-emerald-400 font-bold">Built-in SOC Heuristic (Active)</div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal isOpen={showCreateUser} onClose={() => setShowCreateUser(false)} title="Register SOC Analyst">
        <form onSubmit={handleCreateUser} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
              placeholder="analyst.tier2@eye.security"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Username</label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
              placeholder="tier2_analyst"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Temporary Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Assigned Role</label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
            >
              <option value="soc_analyst">SOC Analyst</option>
              <option value="admin">Administrator</option>
              <option value="viewer">Security Auditor (Viewer)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-colors shadow-glow-blue disabled:opacity-50"
          >
            {creating ? 'Registering...' : 'Create Account'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
