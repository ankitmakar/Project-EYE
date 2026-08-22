import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, ArrowRight, AlertCircle, Shield, CheckCircle2 } from 'lucide-react';
import { authApi } from '../api/auth';
import { User } from '../types';
import { cyberAudio } from '../utils/cyberAudio';
import { EyeLogo } from '../components/common/EyeLogo';
import { LiquidBackground } from '../components/common/LiquidBackground';

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
    cyberAudio.playScan();

    try {
      const res = await authApi.login(username, password);
      localStorage.setItem('eye_access_token', res.access_token);
      localStorage.setItem('eye_user', JSON.stringify(res.user));
      cyberAudio.playSuccess();
      onLoginSuccess(res.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
      cyberAudio.playAlarm();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = (u: string, p: string) => {
    cyberAudio.playClick();
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#05070d] flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Atmospheric Liquid Morphism Background */}
      <LiquidBackground />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center z-10">
        {/* Left Side: Brand Statement & Eye Symbol (5 cols) */}
        <div className="md:col-span-5 space-y-6 text-center md:text-left">
          <div className="flex justify-center md:justify-start">
            <EyeLogo size={64} showWordmark={true} />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-100 font-sans leading-tight">
              Autonomous Detection & Forensic Intelligence
            </h2>
            <p className="text-xs text-eye-muted leading-relaxed">
              Real-time multi-stage attack correlation, MITRE ATT&CK mapping, and explainable threat scoring in a unified SOC-in-a-box workbench.
            </p>
          </div>

          <div className="hidden md:block space-y-2 pt-2 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-eye-success shrink-0" />
              <span>Zero-Trust Ingestion & Log Normalization</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-eye-primary shrink-0" />
              <span>Sliding-Window Behavioral Correlation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-eye-secondary shrink-0" />
              <span>Cryptographic Chain-of-Custody Hashes</span>
            </div>
          </div>
        </div>

        {/* Right Side: Liquid Glass Login Panel (7 cols) */}
        <div className="md:col-span-7 liquid-glass p-8 border border-white/15 shadow-2xl relative">
          <div className="liquid-highlight" />

          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-100 font-mono tracking-wide flex items-center gap-2">
              <Shield className="w-4 h-4 text-eye-primary" />
              SECURITY OPERATOR AUTHENTICATION
            </h3>
            <p className="text-xs text-eye-muted mt-1">
              Enter your authorized credentials or select a role profile.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-eye-danger-soft border border-eye-danger/40 text-eye-danger text-xs font-mono flex items-center gap-2 shadow-glow-danger">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                Analyst Identity
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-eye-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-eye-primary transition-colors shadow-inner"
                  placeholder="analyst@eye.security"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                Master Security Key
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-eye-muted absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-eye-primary transition-colors shadow-inner"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-mono font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-glow-primary disabled:opacity-50"
            >
              {loading ? 'Authenticating Credentials...' : 'Access Command Console'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Role Profiles */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="text-[10px] font-mono uppercase text-eye-muted mb-2 text-center tracking-wider">
              Select Demo Persona (Pre-Configured RBAC)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSwitch('admin@eye.security', 'EyeAdmin2026!Secure')}
                className="py-1.5 px-2 bg-black/30 hover:bg-white/5 border border-white/10 hover:border-eye-primary rounded-xl text-[10px] font-mono text-eye-primary transition-all truncate font-medium"
              >
                Admin L3
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('analyst@eye.security', 'EyeAnalyst2026!Secure')}
                className="py-1.5 px-2 bg-black/30 hover:bg-white/5 border border-white/10 hover:border-eye-success rounded-xl text-[10px] font-mono text-eye-success transition-all truncate font-medium"
              >
                Analyst L1
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('viewer@eye.security', 'EyeViewer2026!Secure')}
                className="py-1.5 px-2 bg-black/30 hover:bg-white/5 border border-white/10 hover:border-eye-warning rounded-xl text-[10px] font-mono text-eye-warning transition-all truncate font-medium"
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
