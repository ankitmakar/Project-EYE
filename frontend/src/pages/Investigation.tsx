import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bot,
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Send,
  HelpCircle,
  Copy,
  Clock,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { aiApi } from '../api/ai';
import { alertsApi } from '../api/alerts';
import { Alert, AIAnalysisResponse } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';

export const Investigation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string>('');
  const [contextNotes, setContextNotes] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResponse | null>(null);

  // Chat conversation
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Greetings Analyst. I am your Project EYE AI Investigation Co-Pilot. Select any active alert to initiate an automated forensic analysis, root-cause explanation, and containment strategy with strict prompt-shield protection.',
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const res = await alertsApi.getAlerts({ limit: 50 });
        setAlerts(res.items);

        const urlAlertId = searchParams.get('alert_id');
        if (urlAlertId) {
          const match = res.items.find((a) => a.alert_id === urlAlertId || a.id === urlAlertId);
          if (match) {
            setSelectedAlertId(match.alert_id);
            runAnalysis(match.alert_id);
          }
        } else if (res.items.length > 0) {
          setSelectedAlertId(res.items[0].alert_id);
        }
      } catch (err) {
        console.error('Failed to load alerts for investigation:', err);
      }
    };
    loadAlerts();
  }, []);

  const runAnalysis = async (alertIdToAnalyze: string) => {
    if (!alertIdToAnalyze) return;
    setAnalyzing(true);
    try {
      const res = await aiApi.analyzeAlert(alertIdToAnalyze, contextNotes || undefined);
      setAnalysisResult(res);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Analysis complete for ${alertIdToAnalyze}:\n\n**Executive Summary**: ${res.summary}\n\n**Root Cause**: ${res.root_cause}\n\n**Adversary Hypothesis**: ${res.threat_hypothesis}`,
        },
      ]);
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `[Error] Investigation co-pilot encountered an error: ${err.message || err}`,
        },
      ]);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim()) return;

    const userText = inputQuestion;
    setInputQuestion('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);

    // Simulated interactive SOC Analyst assistant reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Regarding "${userText}": In Project EYE architecture, this telemetry anomaly is cross-referenced with your MITRE ATT&CK detection catalog. I recommend auditing recent authentication attempts on the target host and enforcing credential rotations.`,
        },
      ]);
    }, 600);
  };

  const selectedAlert = alerts.find((a) => a.alert_id === selectedAlertId);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 tracking-wide flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            AI INVESTIGATION CO-PILOT WORKSPACE
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Prompt-shielded Tier-2 AI analyst for alert summarization, threat hypothesis, and containment guidance.
          </p>
        </div>

        {/* Prompt Shield Status Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>PROMPT SHIELD: ENFORCED</span>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Alert Target & AI Output Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Alert Selector Bar */}
          <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a]/80 backdrop-blur-md space-y-3">
            <label className="block text-xs font-mono uppercase text-slate-400 font-semibold">
              Select Security Alert to Investigate
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedAlertId}
                onChange={(e) => setSelectedAlertId(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
              >
                {alerts.map((a) => (
                  <option key={a.alert_id} value={a.alert_id}>
                    [{a.severity.toUpperCase()}] {a.alert_id} - {a.rule_name} ({a.host})
                  </option>
                ))}
              </select>

              <button
                onClick={() => runAnalysis(selectedAlertId)}
                disabled={analyzing || !selectedAlertId}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-glow-blue disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                {analyzing ? 'Analyzing...' : 'Run Analysis'}
              </button>
            </div>

            {selectedAlert && (
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                <span>Host: <strong className="text-slate-200">{selectedAlert.host}</strong></span>
                <span>IP: <strong className="text-slate-200">{selectedAlert.source_ip || 'N/A'}</strong></span>
                <span>Rule: <strong className="text-cyan-400">{selectedAlert.rule_id}</strong></span>
              </div>
            )}
          </div>

          {/* AI Findings Output */}
          {analysisResult && (
            <div className="space-y-4 animate-fade-in">
              {/* Executive Summary Card */}
              <div className="p-5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Executive Summary & Incident Context
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
                    Confidence: {(analysisResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {analysisResult.summary}
                </p>

                <div className="pt-2 border-t border-cyan-500/20 text-xs text-slate-300 font-mono">
                  <strong className="text-cyan-400">Root Cause: </strong>
                  {analysisResult.root_cause}
                </div>
              </div>

              {/* Threat Hypothesis Card */}
              <div className="p-5 rounded-xl border border-slate-800 bg-[#0f172a]/80 backdrop-blur-md space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Adversary Threat Hypothesis
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {analysisResult.threat_hypothesis}
                </p>

                {/* MITRE Tags */}
                {analysisResult.mitre_mapping.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {analysisResult.mitre_mapping.map((m, idx) => (
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

              {/* Recommended Containment Actions */}
              <div className="p-5 rounded-xl border border-slate-800 bg-[#0f172a]/80 backdrop-blur-md space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Recommended Defensive Actions
                </span>

                <div className="space-y-2">
                  {analysisResult.recommended_actions.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 text-xs font-mono text-slate-200"
                    >
                      <span className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Analyst Co-Pilot Chat (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-slate-800 bg-[#0f172a]/90 backdrop-blur-md flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-100 font-mono tracking-wide">
                ANALYST INTERACTION STREAM
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Isolated Session</span>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl leading-relaxed font-sans ${
                  m.role === 'user'
                    ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30 ml-8'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 mr-8 whitespace-pre-wrap font-mono'
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask AI for forensics guidance, IOC checks, or kill-chain pivots..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
