import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, LogOut, UserCheck, Clock } from 'lucide-react';
import { User } from '../../types';

interface Props {
  user: User | null;
  onLogout: () => void;
  openIncidentsCount: number;
}

export const Navbar: React.FC<Props> = ({ user, onLogout, openIncidentsCount }) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isElevated = openIncidentsCount > 0;

  return (
    <header className="h-16 bg-[#0c1222]/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between z-10">
      {/* Left: SOC Operational Readiness Status */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
          isElevated
            ? 'bg-red-500/15 text-red-300 border-red-500/40 animate-pulse'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}>
          {isElevated ? <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> : <Shield className="w-3.5 h-3.5 text-emerald-400" />}
          <span>DEFCON {isElevated ? '2 - ELEVATED' : '5 - NORMAL'}</span>
          <span className="text-[10px] text-slate-400 font-sans">({openIncidentsCount} active incidents)</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{utcTime || 'UTC Live'}</span>
        </div>
      </div>

      {/* Right: Authenticated User & Actions */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-200">
                {user.full_name || user.username}
              </div>
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                {user.role.replace('_', ' ')}
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-mono font-bold text-xs">
              {user.username.slice(0, 2).toUpperCase()}
            </div>

            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/60 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Not authenticated</div>
        )}
      </div>
    </header>
  );
};
