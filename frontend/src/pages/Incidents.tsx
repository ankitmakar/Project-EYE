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
} from 'lucide-react';
import { incidentsApi } from '../api/incidents';
import { aiApi } from '../api/ai';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Incident } from '../types';

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
    try {
      const aiRes = await aiApi.investigateIncident(selectedIncident.id);
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
            <Flame className="w-5 h-5 text-red-400" />
            INCIDENT CORRELATION & CAMPAIGNS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Multi-stage cyber attack campaigns grouping correlated detection alerts and automated timelines.
          </p>
        </div>

        <button
          onClick={fetchIncidents}
          className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} className="h-44 bg-slate-800/40 rounded-xl animate-pulse" />
          ))
        ) : incidents.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 font-mono text-xs">
            No active incidents detected.
          </div>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident.id}
              onClick={() => loadIncidentDetail(incident.id)}
              className="p-5 rounded-xl border border-slate-800/80 bg-[#0f172a]/80 backdrop-blur-md hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={incident.severity} size="sm" />
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {incident.incident_id}
                    </span>
                  </div>
                  <StatusBadge status={incident.status} />
                </div>

                <h3 className="text-sm font-bold text-slate-100 font-mono mb-2 group-hover:text-cyan-300 transition-colors line-clamp-2">
                  {incident.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed font-sans">
                  {incident.description || 'Automated multi-stage incident correlation.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                  {incident.alerts_count || 0} Correlated Alerts
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(incident.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
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
          title={`Incident Command: ${selectedIncident.incident_id}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <SeverityBadge severity={selectedIncident.severity} />
                  <StatusBadge status={selectedIncident.status} />
                </div>
                <h2 className="text-base font-bold text-slate-100 font-mono">
                  {selectedIncident.title}
                </h2>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  Lead Analyst: <strong className="text-slate-200">{selectedIncident.lead_analyst?.full_name || 'Unassigned'}</strong> | Created: <strong className="text-slate-200">{new Date(selectedIncident.created_at).toLocaleString()}</strong>
                </div>
              </div>

              {/* AI Co-Pilot Button */}
              <button
                onClick={handleRunAIIncidentInvestigation}
                disabled={runningAI}
                className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-2 shadow-glow-blue disabled:opacity-50"
              >
                <Bot className="w-4 h-4" />
                {runningAI ? 'Analyzing Campaign...' : 'Run AI Incident Investigation'}
              </button>
            </div>

            {/* Status Update Buttons */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
                Update Incident Status
              </label>
              <div className="flex flex-wrap gap-2">
                {['open', 'investigating', 'contained', 'resolved', 'closed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(st)}
                    className={`px-3 py-1 rounded text-xs font-mono uppercase border transition-all ${
                      selectedIncident.status === st
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-glow-blue'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Attack Timeline */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                Attack Sequence Timeline
              </h4>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
                {selectedIncident.timeline_summary || 'Multi-stage timeline reconstruction in progress.'}
              </div>
            </div>

            {/* Correlated Alerts Chain */}
            {selectedIncident.alerts && selectedIncident.alerts.length > 0 && (
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-orange-400" />
                  Correlated Alerts Chain ({selectedIncident.alerts.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedIncident.alerts.map((a: any) => (
                    <div
                      key={a.alert_id}
                      className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={a.severity} size="sm" />
                        <span className="font-bold text-cyan-400">{a.alert_id}</span>
                        <span className="text-slate-200">{a.rule_name}</span>
                      </div>
                      <span className="text-slate-400">{a.host}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Investigation Findings */}
            {selectedIncident.ai_analysis && selectedIncident.ai_analysis.summary && (
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono text-cyan-300">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    AI Investigation Findings
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {selectedIncident.ai_analysis.prompt_shield_status || 'Prompt Shield Active'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {selectedIncident.ai_analysis.summary}
                </p>

                {selectedIncident.ai_analysis.mitre_mapping && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedIncident.ai_analysis.mitre_mapping.map((m: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-cyan-400 text-[10px] font-mono rounded"
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
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Analyst Incident Notes
              </h4>

              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto mb-3">
                {selectedIncident.analyst_notes || 'No notes added yet.'}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type investigation update, containment action, or forensic note..."
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleAddNote}
                  disabled={addingNote || !newNote.trim()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-mono font-semibold transition-colors disabled:opacity-50"
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
