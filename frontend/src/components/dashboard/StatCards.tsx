import React from 'react';
import { Activity, BellRing, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { SOCMetrics } from '../../types';

interface Props {
  metrics: SOCMetrics | null;
  loading: boolean;
}

export const StatCards: React.FC<Props> = ({ metrics, loading }) => {
  const isElevated = (metrics?.open_incidents ?? 0) > 0;

  const cards = [
    {
      title: 'TELEMETRY INGESTION',
      value: metrics ? metrics.total_events.toLocaleString() : '0',
      change: 'Active Stream: 120 evt/s',
      icon: Activity,
      textColor: 'text-eye-primary',
      borderColor: 'border-eye-primary/30',
      softBg: 'bg-eye-primary-soft',
      glowShadow: 'hover:shadow-glow-primary',
    },
    {
      title: 'SECURITY ALERTS QUEUE',
      value: metrics ? metrics.total_alerts.toString() : '0',
      change: 'Requiring L1/L2 Triage',
      icon: BellRing,
      textColor: 'text-eye-warning',
      borderColor: 'border-eye-warning/30',
      softBg: 'bg-eye-warning-soft',
      glowShadow: 'hover:shadow-glow-warning',
    },
    {
      title: 'ACTIVE INCIDENT CHAINS',
      value: metrics ? metrics.open_incidents.toString() : '0',
      change: 'Correlated Campaigns',
      icon: Flame,
      textColor: 'text-eye-danger',
      borderColor: 'border-eye-danger/30',
      softBg: 'bg-eye-danger-soft',
      glowShadow: 'hover:shadow-glow-danger',
    },
    {
      title: 'PLATFORM DEFCON STATUS',
      value: isElevated ? 'DEFCON 2 (ELEVATED)' : 'DEFCON 5 (OPTIMAL)',
      change: 'Prompt Shield Active',
      icon: isElevated ? ShieldAlert : CheckCircle2,
      textColor: isElevated ? 'text-eye-danger' : 'text-eye-success',
      borderColor: isElevated ? 'border-eye-danger/50' : 'border-eye-success/30',
      softBg: isElevated ? 'bg-eye-danger-soft' : 'bg-eye-success-soft',
      glowShadow: isElevated ? 'shadow-glow-danger' : 'hover:shadow-glow-success',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`liquid-glass-card p-5 border ${c.borderColor} ${c.glowShadow} overflow-hidden group transition-all duration-300`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono font-bold tracking-widest text-eye-muted uppercase">
              {c.title}
            </span>
            <div className={`p-2 rounded-xl bg-black/40 border border-white/10 ${c.textColor} shadow-inner`}>
              <c.icon className="w-4 h-4" />
            </div>
          </div>

          <div className="text-2xl font-bold font-mono text-slate-100 mb-1 tracking-tight">
            {loading ? (
              <span className="animate-pulse inline-block w-20 h-7 bg-white/10 rounded" />
            ) : (
              c.value
            )}
          </div>

          <div className="text-[11px] text-eye-muted font-mono flex items-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-eye-primary animate-pulse" />
            {c.change}
          </div>
        </div>
      ))}
    </div>
  );
};
