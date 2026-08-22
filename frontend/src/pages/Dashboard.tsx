import React, { useEffect, useState } from 'react';
import { RefreshCw, Play, Shield, Activity, Terminal, Zap, Radio, Network } from 'lucide-react';
import { StatCards } from '../components/dashboard/StatCards';
import { DashboardCharts } from '../components/dashboard/Charts';
import { LiveAlertFeed } from '../components/dashboard/LiveAlertFeed';
import { TopTargets } from '../components/dashboard/TopTargets';
import { ThreatRadarVisualizer } from '../components/dashboard/ThreatRadarVisualizer';
import { AttackGraphVisualizer } from '../components/dashboard/AttackGraphVisualizer';
import { alertsApi } from '../api/alerts';
import { eventsApi } from '../api/events';
import { Alert, SOCMetrics } from '../types';
import { cyberAudio } from '../utils/cyberAudio';

interface Props {
  onOpenSimulator: () => void;
}

export const Dashboard: React.FC<Props> = ({ onOpenSimulator }) => {
  const [metrics, setMetrics] = useState<SOCMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const [m, a] = await Promise.all([
        eventsApi.getMetrics(),
        alertsApi.getAlerts({ limit: 12 }),
      ]);
      setMetrics(m);
      setAlerts(a.items);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Title & Tactical Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 tracking-wide flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            CYBER DEFENSE OPERATIONS COMMAND CENTER
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time telemetry ingestion, deterministic threat detection, and AI co-pilot status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              cyberAudio.playScan();
              fetchData(true);
            }}
            disabled={refreshing}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-slate-400 hover:text-cyan-300 transition-colors shadow-inner"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={() => {
              cyberAudio.playAlarm();
              onOpenSimulator();
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-glow-red"
          >
            <Play className="w-3.5 h-3.5 fill-current animate-pulse" />
            Attack Simulator Lab
          </button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <StatCards metrics={metrics} loading={loading} />

      {/* Futuristic Visual Row: Tactical Threat Radar + Interactive Attack Topology Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <ThreatRadarVisualizer alerts={alerts} />
        </div>
        <div className="lg:col-span-8">
          <AttackGraphVisualizer alerts={alerts} />
        </div>
      </div>

      {/* Telemetry Charts */}
      <DashboardCharts metrics={metrics} />

      {/* Live Alerts & Top Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveAlertFeed alerts={alerts} loading={loading} />
        <TopTargets alerts={alerts} />
      </div>
    </div>
  );
};
