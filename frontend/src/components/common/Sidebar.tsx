import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BellRing,
  Flame,
  Terminal,
  Bot,
  ShieldCheck,
  BarChart3,
  History,
  Settings,
  Zap,
  Activity,
  Layers,
  Globe,
} from 'lucide-react';
import { EyeLogo } from './EyeLogo';
import { cyberAudio } from '../../utils/cyberAudio';

interface Props {
  onOpenSimulator: () => void;
}

export const Sidebar: React.FC<Props> = ({ onOpenSimulator }) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/alerts', label: 'Alerts Queue', icon: BellRing },
    { to: '/incidents', label: 'Incidents & Chains', icon: Flame },
    { to: '/events', label: 'Telemetry Logs', icon: Terminal },
    { to: '/investigation', label: 'AI Investigation Co-Pilot', icon: Bot },
    { to: '/mitre-matrix', label: 'MITRE ATT&CK Matrix', icon: Layers },
    { to: '/threat-intel', label: 'Threat Intel & IOCs', icon: Globe },
    { to: '/detections', label: 'Detection Rules', icon: ShieldCheck },
    { to: '/reports', label: 'SOC Reports', icon: BarChart3 },
    { to: '/audit-logs', label: 'Audit Trail', icon: History },
    { to: '/settings', label: 'System Admin', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#05070d]/85 backdrop-blur-2xl border-r border-white/10 flex flex-col h-screen select-none relative z-20">
      {/* Brand Header with Custom EYE Logo */}
      <div className="h-16 px-4 flex items-center border-b border-white/10">
        <EyeLogo size={34} showWordmark={true} />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase text-eye-primary/70 tracking-widest font-semibold">
          COMMAND MODULES
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => cyberAudio.playClick()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all duration-200 relative group ${
                isActive
                  ? 'bg-eye-primary-soft text-eye-primary border border-eye-primary/40 shadow-glow-primary font-bold'
                  : 'text-eye-muted hover:text-slate-100 hover:bg-white/5 hover:border-white/10 border border-transparent'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0 group-hover:text-eye-primary transition-colors" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Live Simulation Quick-Action Panel */}
      <div className="p-3 border-t border-white/10 bg-black/40">
        <div className="liquid-glass-card p-3 border-eye-danger/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-eye-danger">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-eye-danger animate-pulse" />
              Attack Lab
            </span>
            <span className="text-[9px] bg-eye-danger-soft text-eye-danger px-1.5 py-0.5 rounded border border-eye-danger/30 font-mono">
              LAB 1-8
            </span>
          </div>
          <p className="text-[10px] text-eye-muted leading-relaxed">
            Inject controlled attack telemetry to test detections & incident correlation.
          </p>
          <button
            onClick={() => {
              cyberAudio.playScan();
              onOpenSimulator();
            }}
            className="w-full py-2 px-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 shadow-glow-danger"
          >
            <Activity className="w-3.5 h-3.5" />
            Launch Lab Engine
          </button>
        </div>
      </div>
    </aside>
  );
};
