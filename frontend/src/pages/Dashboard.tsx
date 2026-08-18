import React, { useEffect, useState } from 'react';
import { RefreshCw, Play, Shield, Activity, Terminal } from 'lucide-react';
import { StatCards } from '../components/dashboard/StatCards';
import { DashboardCharts } from '../components/dashboard/Charts';
import { LiveAlertFeed } from '../components/dashboard/LiveAlertFeed';
import { TopTargets } from '../components/dashboard/TopTargets';
import { alertsApi } from '../api/alerts';
import { eventsApi } from '../api/events';
import { Alert, SOCMetrics } from '../types';

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
        alertsApi.getAlerts({ limit: 10 }),
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
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 tracking-wide flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            SECURITY OPERATIONS COMMAND CENTER
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time telemetry ingestion, deterministic threat detection, and AI co-pilot status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={onOpenSimulator}
            className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-glow-red"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Live Attack Simulator
          </button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <StatCards metrics={metrics} loading={loading} />

      {/* Main Visual Charts */}
      <DashboardCharts metrics={metrics} />

      {/* Live Alerts & Top Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveAlertFeed alerts={alerts} loading={loading} />
        <TopTargets alerts={alerts} />
      </div>
    </div>
  );
};
