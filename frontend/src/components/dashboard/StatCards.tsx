import React from 'react';
import { Activity, BellRing, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { SOCMetrics } from '../../types';

interface Props {
  metrics: SOCMetrics | null;
  loading: boolean;
}

export const StatCards: React.FC<Props> = ({ metrics, loading }) => {
  const cards = [
    {
      title: 'TOTAL INGESTED EVENTS',
      value: metrics ? metrics.total_events.toLocaleString() : '0',
      change: '+14.2% / hr',
      icon: Activity,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/20',
      bgGlow: 'bg-cyan-500/5',
    },
    {
      title: 'ACTIVE SECURITY ALERTS',
      value: metrics ? metrics.total_alerts.toString() : '0',
      change: 'Requiring Triage',
      icon: BellRing,
      color: 'text-orange-400',
      borderColor: 'border-orange-500/20',
      bgGlow: 'bg-orange-500/5',
    },
    {
      title: 'OPEN INCIDENTS',
      value: metrics ? metrics.open_incidents.toString() : '0',
      change: 'Active Campaigns',
      icon: Flame,
      color: 'text-red-400',
      borderColor: 'border-red-500/20',
      bgGlow: 'bg-red-500/5',
    },
    {
      title: 'SOC THREAT LEVEL',
      value: (metrics?.open_incidents ?? 0) > 0 ? 'ELEVATED' : 'NORMAL',
      change: 'Prompt Shield Active',
      icon: ShieldAlert,
      color: (metrics?.open_incidents ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400',
      borderColor: (metrics?.open_incidents ?? 0) > 0 ? 'border-red-500/30' : 'border-emerald-500/20',
      bgGlow: (metrics?.open_incidents ?? 0) > 0 ? 'bg-red-500/10 shadow-glow-red' : 'bg-emerald-500/5',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`p-5 rounded-xl border ${c.borderColor} ${c.bgGlow} bg-[#0f172a]/70 backdrop-blur-md relative overflow-hidden group transition-all duration-200 hover:border-slate-600`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
              {c.title}
            </span>
            <div className={`p-2 rounded-lg bg-slate-900/60 border border-slate-800 ${c.color}`}>
              <c.icon className="w-4 h-4" />
            </div>
          </div>

          <div className="text-2xl font-bold font-mono text-slate-100 mb-1 tracking-tight">
            {loading ? (
              <span className="animate-pulse inline-block w-16 h-7 bg-slate-800 rounded" />
            ) : (
              c.value
            )}
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            {c.change}
          </div>
        </div>
      ))}
    </div>
  );
};
