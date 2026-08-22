import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, LogOut, Clock, Volume2, VolumeX, Search, Command } from 'lucide-react';
import { User } from '../../types';
import { cyberAudio } from '../../utils/cyberAudio';

interface Props {
  user: User | null;
  onLogout: () => void;
  openIncidentsCount: number;
  onOpenCommandPalette: () => void;
}

export const Navbar: React.FC<Props> = ({
  user,
  onLogout,
  openIncidentsCount,
  onOpenCommandPalette,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [muted, setMuted] = useState(cyberAudio.getMuted());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const isMuted = cyberAudio.toggleMute();
    setMuted(isMuted);
  };

  const isElevated = openIncidentsCount > 0;

  return (
    <header className="h-16 bg-[#060913]/80 backdrop-blur-2xl border-b border-white/10 px-6 flex items-center justify-between z-10 select-none">
      {/* Left: SOC Readiness DEFCON Status */}
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border transition-all ${
            isElevated
              ? 'bg-eye-danger-soft text-eye-danger border-eye-danger/40 shadow-glow-danger animate-eye-pulse'
              : 'bg-eye-success-soft text-eye-success border-eye-success/40 shadow-glow-success'
          }`}
        >
          {isElevated ? (
            <ShieldAlert className="w-4 h-4 text-eye-danger" />
          ) : (
            <Shield className="w-4 h-4 text-eye-success" />
          )}
          <span>DEFCON {isElevated ? '2 - ELEVATED' : '5 - OPTIMAL'}</span>
          <span className="text-[10px] text-eye-muted font-normal">
            ({openIncidentsCount} active {openIncidentsCount === 1 ? 'campaign' : 'campaigns'})
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-eye-muted font-mono">
          <Clock className="w-3.5 h-3.5 text-eye-primary" />
          <span>{utcTime || 'UTC Active'}</span>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <button
        onClick={() => {
          cyberAudio.playClick();
          onOpenCommandPalette();
        }}
        className="hidden sm:flex items-center gap-3 px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-eye-primary/40 text-xs font-mono text-eye-muted hover:text-eye-text transition-all group shadow-inner"
      >
        <Search className="w-3.5 h-3.5 text-eye-primary group-hover:scale-110 transition-transform" />
        <span>Quick search & actions...</span>
        <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-black/40 border border-white/10 rounded text-eye-primary">
          <Command className="w-2.5 h-2.5" /> K
        </kbd>
      </button>

      {/* Right: Audio Control, Authenticated User & Actions */}
      <div className="flex items-center gap-4">
        {/* Sound FX Toggle */}
        <button
          onClick={handleToggleSound}
          title={muted ? 'Enable Cyber Audio FX' : 'Mute Audio FX'}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-eye-primary/40 text-eye-muted hover:text-eye-primary transition-colors"
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-slate-600" />
          ) : (
            <Volume2 className="w-4 h-4 text-eye-primary animate-pulse" />
          )}
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-slate-100">
                {user.full_name || user.username}
              </div>
              <div className="text-[10px] font-mono text-eye-primary uppercase tracking-wider">
                {user.role.replace('_', ' ')}
              </div>
            </div>

            <div className="w-8 h-8 rounded-xl bg-eye-primary-soft border border-eye-primary/40 flex items-center justify-center text-eye-primary font-mono font-bold text-xs shadow-glow-primary">
              {user.username.slice(0, 2).toUpperCase()}
            </div>

            <button
              onClick={() => {
                cyberAudio.playClick();
                onLogout();
              }}
              title="Logout"
              className="p-2 text-eye-muted hover:text-eye-danger hover:bg-eye-danger-soft rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-eye-muted font-mono">Not authenticated</div>
        )}
      </div>
    </header>
  );
};
