import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  BellRing,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Bot,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import { alertsApi } from '../api/alerts';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Alert } from '../types';
import { cyberAudio } from '../utils/cyberAudio';

export const Alerts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Alert for Details Modal
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [analystNote, setAnalystNote] = useState<string>('');
  const [savingNote, setSavingNote] = useState<boolean>(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await alertsApi.getAlerts({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        limit: 50,
      });
      setAlerts(res.items);
      setTotal(res.total);

      // Check if URL has ?id=
      const urlId = searchParams.get('id');
      if (urlId) {
        const match = res.items.find((a) => a.id === urlId || a.alert_id === urlId);
        if (match) {
          setSelectedAlert(match);
          setAnalystNote(match.analyst_notes || '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter]);

  const handleSelectAlert = (alert: Alert) => {
    cyberAudio.playClick();
    setSelectedAlert(alert);
    setAnalystNote(alert.analyst_notes || '');
    setSearchParams({ id: alert.alert_id });
  };

  const handleCloseModal = () => {
    setSelectedAlert(null);
    setSearchParams({});
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedAlert) return;
    cyberAudio.playClick();
    try {
      const updated = await alertsApi.updateAlert(selectedAlert.id, { status: newStatus });
      setSelectedAlert(updated);
      setAlerts(alerts.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedAlert) return;
    setSavingNote(true);
    cyberAudio.playClick();
    try {
      const updated = await alertsApi.updateAlert(selectedAlert.id, { analyst_notes: analystNote });
      setSelectedAlert(updated);
      setAlerts(alerts.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedAlert) return;
    cyberAudio.playAlarm();
    try {
      const inc = await alertsApi.escalateAlert(selectedAlert.id, {
        title: `Incident: ${selectedAlert.rule_name} on ${selectedAlert.host}`,
        severity: selectedAlert.severity,
      });
      navigate(`/incidents?id=${inc.incident_id}`);
    } catch (err) {
      console.error('Failed to escalate alert:', err);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.alert_id.toLowerCase().includes(q) ||
      a.rule_name.toLowerCase().includes(q) ||
      a.host.toLowerCase().includes(q) ||
      (a.source_ip && a.source_ip.includes(q)) ||
      (a.username && a.username.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 tracking-wide flex items-center gap-2">
            <BellRing className="w-5 h-5 text-eye-warning animate-pulse" />
            SECURITY ALERTS QUEUE
          </h1>
          <p className="text-xs text-eye-muted font-mono mt-0.5">
            Deterministic detection rule triggers requiring analyst triage and investigation.
          </p>
        </div>

        <button
          onClick={() => {
            cyberAudio.playScan();
            fetchAlerts();
          }}
          className="p-2.5 bg-black/40 border border-white/10 hover:border-eye-primary/50 rounded-xl text-eye-muted hover:text-eye-primary transition-colors shadow-inner"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-eye-primary' : ''}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="liquid-glass-card p-4 border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-eye-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alert ID, rule, host, IP, user..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-eye-primary"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-eye-primary"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-eye-primary"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="text-xs font-mono text-eye-muted">
          Showing <span className="text-slate-100 font-bold">{filteredAlerts.length}</span> of {total} alerts
        </div>
      </div>

      {/* Alerts Table */}
      <div className="liquid-glass-card border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-white/10 text-eye-muted uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Detection Rule</th>
                <th className="py-3 px-4">Target Host</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-eye-muted">
                    Loading security alerts...
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-eye-muted">
                    No alerts found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => handleSelectAlert(alert)}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <SeverityBadge severity={alert.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-bold text-eye-primary">{alert.alert_id}</td>
                    <td className="py-3 px-4 text-slate-200 font-semibold max-w-xs truncate">
                      {alert.rule_name}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{alert.host}</td>
                    <td className="py-3 px-4 text-eye-muted">{alert.source_ip || '-'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className="py-3 px-4 text-eye-muted whitespace-nowrap">
                      {new Date(alert.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAlert(alert);
                        }}
                        className="px-2.5 py-1 bg-black/40 hover:bg-white/10 text-slate-200 rounded-lg border border-white/10 text-[11px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <Modal
          isOpen={!!selectedAlert}
          onClose={handleCloseModal}
          title={`Alert Inspection: ${selectedAlert.alert_id}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-black/50 border border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge severity={selectedAlert.severity} />
                  <StatusBadge status={selectedAlert.status} />
                </div>
                <h2 className="text-base font-bold text-slate-100 font-mono">
                  {selectedAlert.rule_name}
                </h2>
                <div className="text-xs text-eye-muted font-mono mt-1">
                  Host: <strong className="text-slate-200">{selectedAlert.host}</strong> | Source: <strong className="text-slate-200">{selectedAlert.source}</strong> | Confidence: <strong className="text-eye-primary">{(selectedAlert.confidence * 100).toFixed(0)}%</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/investigation?alert_id=${selectedAlert.alert_id}`)}
                  className="px-3 py-1.5 bg-eye-primary-soft hover:bg-eye-primary/30 text-eye-primary border border-eye-primary/40 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 shadow-glow-primary"
                >
                  <Bot className="w-4 h-4" />
                  AI Co-Pilot
                </button>
                <button
                  onClick={handleEscalate}
                  className="px-3 py-1.5 bg-eye-danger-soft hover:bg-eye-danger/30 text-eye-danger border border-eye-danger/40 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 shadow-glow-danger"
                >
                  <Flame className="w-4 h-4" />
                  Escalate
                </button>
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-mono uppercase text-eye-muted mb-2 font-bold">
                Update Triage Status
              </label>
              <div className="flex flex-wrap gap-2">
                {['new', 'acknowledged', 'investigating', 'resolved', 'closed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase border transition-all ${
                      selectedAlert.status === st
                        ? 'bg-eye-primary-soft border-eye-primary text-eye-primary shadow-glow-primary font-bold'
                        : 'bg-black/30 border-white/10 text-eye-muted hover:bg-white/5'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Raw Evidence Payload Viewer */}
            <div>
              <label className="block text-xs font-mono uppercase text-eye-muted mb-2 font-bold">
                Evidence Payload (Forensic Metadata)
              </label>
              <div className="p-3 bg-black/80 rounded-xl border border-white/10 font-mono text-xs text-eye-success overflow-x-auto max-h-56">
                <pre>{JSON.stringify(selectedAlert.evidence, null, 2)}</pre>
              </div>
            </div>

            {/* Analyst Notes Editor */}
            <div>
              <label className="block text-xs font-mono uppercase text-eye-muted mb-2 font-bold">
                Analyst Investigation Notes
              </label>
              <textarea
                value={analystNote}
                onChange={(e) => setAnalystNote(e.target.value)}
                rows={3}
                placeholder="Add investigation findings, root cause notes, or action rationale..."
                className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-eye-primary"
              />
              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 rounded-xl text-xs font-mono transition-colors"
              >
                {savingNote ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
