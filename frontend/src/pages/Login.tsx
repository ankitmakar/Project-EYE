import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Shield, Lock, User as UserIcon, ArrowRight, AlertCircle } from 'lucide-react';
import { authApi } from '../api/auth';
import { User } from '../types';

interface Props {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<Props> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin@eye.security');
  const [password, setPassword] = useState('EyeAdmin2026!Secure');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await authApi.login(username, password);
      localStorage.setItem('eye_access_token', res.access_token);
      localStorage.setItem('eye_user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Cyber Glow Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 text-cyan-400 mb-4 shadow-glow-blue">
            <Eye className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-slate-100 font-mono">
            PROJECT <span className="text-cyan-400 glow-cyan">EYE</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono tracking-widest mt-1 uppercase">
            SOC-in-a-Box Command Console
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider mb-2">
                Analyst Identity (Email or Username)
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                  placeholder="analyst@eye.security"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 shadow-glow-blue disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Access SOC Console'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="text-[11px] font-mono uppercase text-slate-400 mb-2.5 text-center">
              Quick Role Switcher (Pre-Configured)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSwitch('admin@eye.security', 'EyeAdmin2026!Secure')}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-cyan-400 transition-colors truncate"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('analyst@eye.security', 'EyeAnalyst2026!Secure')}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-emerald-400 transition-colors truncate"
              >
                Analyst
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('viewer@eye.security', 'EyeViewer2026!Secure')}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-amber-400 transition-colors truncate"
              >
                Auditor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
