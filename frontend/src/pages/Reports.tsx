import React, { useEffect, useState } from 'react';
import { BarChart3, Download, RefreshCw, Shield, FileText, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../api/client';

export const Reports: React.FC = () => {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/reports/summary');
      setReport(res.data);
    } catch (err) {
      console.error('Failed to fetch summary report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project_eye_soc_report_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 tracking-wide flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            SOC EXECUTIVE SUMMARY & AUDIT REPORTS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Operational security metrics, top attack vectors, and exportable forensic posture.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={handleExportJSON}
            disabled={!report}
            className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-glow-blue disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-xl bg-slate-800/40 animate-pulse" />
      ) : report ? (
        <div className="space-y-6">
          {/* Executive Metrics Overview */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0f172a]/80 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
              Executive SOC Health Assessment
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-xs font-mono text-slate-400">Total Telemetry Ingested</div>
                <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                  {report.executive_metrics.total_telemetry_events}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-xs font-mono text-slate-400">Alerts Detected</div>
                <div className="text-2xl font-bold font-mono text-orange-400 mt-1">
                  {report.executive_metrics.total_alerts_generated}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-xs font-mono text-slate-400">Correlated Incidents</div>
                <div className="text-2xl font-bold font-mono text-red-400 mt-1">
                  {report.executive_metrics.total_incidents}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-xs font-mono text-slate-400">Threat Posture</div>
                <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                  {report.executive_metrics.soc_threat_level}
                </div>
              </div>
            </div>
          </div>

          {/* Top Threat Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-slate-800 bg-[#0f172a]/80 backdrop-blur-md">
              <h4 className="text-xs font-bold font-mono uppercase text-slate-300 mb-3">
                Top Targeted Infrastructure Assets
              </h4>
              <div className="space-y-2">
                {report.top_attacked_hosts.map((h: any, idx: number) => (
                  <div key={idx} className="flex justify-between p-2 rounded bg-slate-900/60 font-mono text-xs">
                    <span className="text-slate-200">{h.host}</span>
                    <span className="text-red-400 font-bold">{h.alert_count} alerts</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-[#0f172a]/80 backdrop-blur-md">
              <h4 className="text-xs font-bold font-mono uppercase text-slate-300 mb-3">
                Top Triggered Security Rules
              </h4>
              <div className="space-y-2">
                {report.top_triggered_rules.map((r: any, idx: number) => (
                  <div key={idx} className="flex justify-between p-2 rounded bg-slate-900/60 font-mono text-xs">
                    <span className="text-slate-200">{r.rule_name}</span>
                    <span className="text-cyan-400 font-bold">{r.alert_count} hits</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
