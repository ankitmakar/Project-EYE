import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Flame,
  Search,
  Plus,
  RefreshCw,
  Clock,
  ShieldAlert,
  Bot,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Shield,
  FileText,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import { incidentsApi } from '../api/incidents';
import { aiApi } from '../api/ai';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Incident } from '../types';
import { cyberAudio } from '../utils/cyberAudio';

export const Incidents: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Notes & AI Analysis
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [runningAI, setRunningAI] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await incidentsApi.getIncidents({ limit: 50 });
      setIncidents(res.items);

      const urlId = searchParams.get('id');
      if (urlId) {
        const found = res.items.find((i) => i.id === urlId || i.incident_id === urlId);
        if (found) loadIncidentDetail(found.id);
      }
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadIncidentDetail = async (id: string) => {
    setLoadingDetail(true);
    cyberAudio.playScan();
    try {
      const detail = await incidentsApi.getIncident(id);
      setSelectedIncident(detail);
      setSearchParams({ id: detail.incident_id });
    } catch (err) {
      console.error('Failed to load incident detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedIncident) return;
    cyberAudio.playClick();
    try {
      const updated = await incidentsApi.updateIncident(selectedIncident.id, { status: newStatus as any });
      setSelectedIncident({ ...selectedIncident, ...updated });
      setIncidents(incidents.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)));
    } catch (err) {
      console.error('Failed to update incident status:', err);
    }
  };

  const handleAddNote = async () => {
    if (!selectedIncident || !newNote.trim()) return;
    setAddingNote(true);
    cyberAudio.playClick();
    try {
      const updated = await incidentsApi.addNote(selectedIncident.id, newNote);
      setSelectedIncident({ ...selectedIncident, analyst_notes: updated.analyst_notes });
      setNewNote('');
    } catch (err) {
      console.error('Failed to append note:', err);
    } finally {
      setAddingNote(false);
    }
  };

  const handleRunAIIncidentInvestigation = async () => {
    if (!selectedIncident) return;
    setRunningAI(true);
    cyberAudio.playScan();
    try {
      const aiRes = await aiApi.investigateIncident(selectedIncident.id);
      cyberAudio.playSuccess();
      setSelectedIncident({
        ...selectedIncident,
        ai_analysis: aiRes as any,
        root_cause: aiRes.root_cause,
        mitigation_steps: aiRes.recommended_actions,
      });
    } catch (err) {
      console.error('AI investigation failed:', err);
    } finally {
      setRunningAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 tracking-wide flex items-center gap-2">
            <Flame className="w-5 h-5 text-eye-danger animate-pulse" />
            INCIDENT CORRELATION & ATTACK CAMPAIGNS
          </h1>
          <p className="text-xs text-eye-muted font-mono mt-0.5">
            Multi-stage attack chains grouping correlated detection alerts, timeline points, and calculated risk scores.
          </p>
        </div>

        <button
          onClick={() => {
            cyberAudio.playScan();
            fetchIncidents();
          }}
          className="p-2.5 bg-black/40 border border-white/10 hover:border-eye-primary/50 rounded-xl text-eye-muted hover:text-eye-primary transition-colors shadow-inner"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-eye-primary' : ''}`} />
        </button>
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} className="h-48 liquid-glass-card animate-pulse" />
          ))
        ) : incidents.length === 0 ? (
          <div className="col-span-full text-center py-16 liquid-glass-card border-white/10 text-eye-muted font-mono text-xs">
            No active correlated incidents. Inject attack telemetry via the Attack Simulator to generate live incident chains!
          </div>
        ) : (
          incidents.map((incident) => {
            const risk = incident.ai_analysis?.risk_score ?? 75;
            return (
              <div
                key={incident.id}
                onClick={() => loadIncidentDetail(incident.id)}
                className="liquid-glass-card p-5 border-white/10 hover:border-eye-primary/60 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={incident.severity} size="sm" />
                      <span className="text-xs font-mono font-bold text-eye-primary">
                        {incident.incident_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-eye-danger-soft border border-eye-danger/30 text-eye-danger font-bold">
                        RISK: {risk}/100
                      </span>
                      <StatusBadge status={incident.status} />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 font-mono mb-2 group-hover:text-eye-primary transition-colors line-clamp-2">
                    {incident.title}
                  </h3>

                  <p className="text-xs text-eye-muted line-clamp-2 mb-4 leading-relaxed font-sans">
                    {incident.description || 'Automated multi-stage incident correlation.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-eye-muted">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-eye-warning" />
                    {incident.alerts_count || (incident.alerts ? incident.alerts.length : 0)} Correlated Alerts
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(incident.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <Modal
          isOpen={!!selectedIncident}
          onClose={() => {
            setSelectedIncident(null);
            setSearchParams({});
          }}
          title={`Incident War-Room: ${selectedIncident.incident_id}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <SeverityBadge severity={selectedIncident.severity} />
                  <span className="text-xs font-mono font-bold text-eye-danger bg-eye-danger-soft px-2 py-0.5 rounded border border-eye-danger/30">
                    CALCULATED RISK: {selectedIncident.ai_analysis?.risk_score ?? 80}/100
                  </span>
                  <StatusBadge status={selectedIncident.status} />
                </div>
                <h2 className="text-base font-bold text-slate-100 font-mono">
                  {selectedIncident.title}
                </h2>
                <div className="text-xs text-eye-muted font-mono mt-1">
                  Lead Analyst: <strong className="text-slate-200">{selectedIncident.lead_analyst?.full_name || 'Autonomous Tier-1'}</strong> | Timestamp: <strong className="text-slate-200">{new Date(selectedIncident.created_at).toLocaleString()}</strong>
                </div>
              </div>

              {/* AI Co-Pilot Button */}
              <button
                onClick={handleRunAIIncidentInvestigation}
                disabled={runningAI}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-glow-primary disabled:opacity-50"
              >
                <Bot className="w-4 h-4" />
                {runningAI ? 'Synthesizing Forensics...' : 'Run AI Incident Co-Pilot'}
              </button>
            </div>

            {/* Status Update Buttons */}
            <div>
              <label className="block text-xs font-mono uppercase text-eye-muted mb-2 font-bold">
                Update Incident Lifecycle State
              </label>
              <div className="flex flex-wrap gap-2">
                {['open', 'investigating', 'contained', 'resolved', 'closed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase border transition-all ${
                      selectedIncident.status === st
                        ? 'bg-eye-primary-soft border-eye-primary text-eye-primary shadow-glow-primary font-bold'
                        : 'bg-black/30 border-white/10 text-eye-muted hover:bg-white/5'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Attack Timeline */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5 font-bold">
                <Clock className="w-4 h-4 text-eye-primary" />
                Forensic Attack Sequence Timeline
              </h4>
              <div className="p-3.5 bg-black/50 rounded-xl border border-white/10 text-xs font-mono text-slate-300 leading-relaxed">
                {selectedIncident.timeline_summary || 'Multi-stage timeline reconstruction in progress.'}
              </div>
            </div>

            {/* Correlated Alerts Chain */}
            {selectedIncident.alerts && selectedIncident.alerts.length > 0 && (
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 text-eye-warning" />
                  Correlated Alerts Chain ({selectedIncident.alerts.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedIncident.alerts.map((a: any) => (
                    <div
                      key={a.alert_id}
                      className="p-2.5 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={a.severity} size="sm" />
                        <span className="font-bold text-eye-primary">{a.alert_id}</span>
                        <span className="text-slate-200">{a.rule_name}</span>
                      </div>
                      <span className="text-eye-muted">{a.host}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Investigation Findings */}
            {selectedIncident.ai_analysis && selectedIncident.ai_analysis.summary && (
              <div className="p-4 rounded-xl bg-eye-primary-soft border border-eye-primary/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono text-eye-primary">
                    <Bot className="w-4 h-4 text-eye-primary" />
                    AI Investigation Findings & Root Cause
                  </div>
                  <span className="text-[10px] font-mono text-eye-success bg-eye-success-soft px-2 py-0.5 rounded border border-eye-success/20 font-bold">
                    {selectedIncident.ai_analysis.prompt_shield_status || 'Prompt Shield Active'}
                  </span>
                </div>

                <p className="text-xs text-slate-200 font-sans leading-relaxed">
                  {selectedIncident.ai_analysis.summary}
                </p>

                {selectedIncident.ai_analysis.mitre_mapping && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedIncident.ai_analysis.mitre_mapping.map((m: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-black/40 border border-white/10 text-eye-primary text-[10px] font-mono rounded"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analyst Notes & Discussion */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5 font-bold">
                <MessageSquare className="w-4 h-4 text-eye-muted" />
                Analyst Notes & Actions
              </h4>

              <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto mb-3">
                {selectedIncident.analyst_notes || 'No notes added yet.'}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type containment action, hash verification note, or investigation findings..."
                  className="flex-1 px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-eye-primary"
                />
                <button
                  onClick={handleAddNote}
                  disabled={addingNote || !newNote.trim()}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 rounded-xl text-xs font-mono font-semibold transition-colors disabled:opacity-50"
                >
                  {addingNote ? 'Adding...' : 'Post Note'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
