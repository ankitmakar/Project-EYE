import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { SOCMetrics } from '../../types';

interface Props {
  metrics: SOCMetrics | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ff0055',
  high: '#f97316',
  medium: '#eab308',
  low: '#10b981',
  info: '#3b82f6',
};

export const DashboardCharts: React.FC<Props> = ({ metrics }) => {
  // Simulated 24-hour time series data
  const timeSeriesData = [
    { time: '00:00', events: 120, alerts: 1 },
    { time: '04:00', events: 80, alerts: 0 },
    { time: '08:00', events: 340, alerts: 2 },
    { time: '12:00', events: 580, alerts: 5 },
    { time: '16:00', events: 720, alerts: 8 },
    { time: '20:00', events: 450, alerts: 4 },
    { time: 'Now', events: 610, alerts: 6 },
  ];

  // Severity Distribution Data
  const severityData = metrics?.severity_breakdown
    ? Object.entries(metrics.severity_breakdown).map(([name, value]) => ({
        name,
        value,
      }))
    : [
        { name: 'critical', value: 2 },
        { name: 'high', value: 5 },
        { name: 'medium', value: 8 },
        { name: 'low', value: 14 },
        { name: 'info', value: 45 },
      ];

  // Source Breakdown Data
  const sourceData = metrics?.source_breakdown
    ? Object.entries(metrics.source_breakdown).map(([name, value]) => ({
        name,
        count: value,
      }))
    : [
        { name: 'linux-auth', count: 42 },
        { name: 'nginx', count: 35 },
        { name: 'windows', count: 18 },
        { name: 'syslog', count: 24 },
        { name: 'custom', count: 12 },
      ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 24-Hour Event Ingestion Rate */}
      <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800/80 bg-[#0f172a]/70 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-mono tracking-wide">
              EVENT INGESTION & THREAT VELOCITY
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Real-time telemetry events vs detection rule alerts
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Ingested Events
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-400" /> Alerts
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff0055" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ff0055" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="events"
                stroke="#00f0ff"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#eventGradient)"
              />
              <Area
                type="monotone"
                dataKey="alerts"
                stroke="#ff0055"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#alertGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Severity Breakdown Donut */}
      <div className="p-5 rounded-xl border border-slate-800/80 bg-[#0f172a]/70 backdrop-blur-md flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100 font-mono tracking-wide mb-1">
            SEVERITY DISTRIBUTION
          </h3>
          <p className="text-xs text-slate-400 font-mono mb-4">
            Categorized risk matrix of current telemetry
          </p>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={SEVERITY_COLORS[entry.name.toLowerCase()] || '#94a3b8'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-2">
          {severityData.map((s, i) => (
            <div key={i} className="text-center p-1.5 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] uppercase font-mono text-slate-400">{s.name}</div>
              <div className="text-xs font-bold font-mono text-slate-100">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
