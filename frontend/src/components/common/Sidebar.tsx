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
  Eye,
  Zap,
  Activity
} from 'lucide-react';

interface Props {
  onOpenSimulator: () => void;
}

export const Sidebar: React.FC<Props> = ({ onOpenSimulator }) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/alerts', label: 'Alerts Queue', icon: BellRing },
    { to: '/incidents', label: 'Incidents', icon: Flame },
    { to: '/events', label: 'Telemetry Logs', icon: Terminal },
    { to: '/investigation', label: 'AI Co-Pilot', icon: Bot },
    { to: '/detections', label: 'Detection Rules', icon: ShieldCheck },
    { to: '/reports', label: 'SOC Reports', icon: BarChart3 },
    { to: '/audit-logs', label: 'Audit Trail', icon: History },
    { to: '/settings', label: 'System Admin', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0c1222]/90 backdrop-blur-md border-r border-slate-800/80 flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-glow-blue">
          <Eye className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-bold tracking-wider text-slate-100 font-mono text-base">
            PROJECT <span className="text-cyan-400 glow-cyan">EYE</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            SOC-in-a-Box v1.0
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
          Analyst Console
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-glow-blue'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Live Simulation Quick-Action Panel */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="bg-gradient-to-r from-red-950/40 to-slate-900/60 p-3 rounded-lg border border-red-500/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-300 mb-1.5">
            <Zap className="w-3.5 h-3.5 text-red-400 animate-bounce" />
            Attack Simulator
          </div>
          <p className="text-[11px] text-slate-400 mb-2.5 leading-relaxed">
            Inject live cyber telemetry to test real-time detection & correlation.
          </p>
          <button
            onClick={onOpenSimulator}
            className="w-full py-1.5 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 shadow-glow-red"
          >
            <Activity className="w-3.5 h-3.5" />
            Simulate Attack
          </button>
        </div>
      </div>
    </aside>
  );
};
