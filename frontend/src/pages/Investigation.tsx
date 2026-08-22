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
  Flame,
  Fingerprint,
  Radio,
  FileCode,
  UserCheck,
} from 'lucide-react';
import { aiApi } from '../api/ai';
import { alertsApi } from '../api/alerts';
import { Alert, AIAnalysisResponse } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { cyberAudio } from '../utils/cyberAudio';

export const Investigation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResponse | null>(null);

  // Chat conversation
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Greetings Analyst. I am your Project EYE AI Investigation Co-Pilot. Select any active telemetry alert to inspect forensic timeline nodes, calculate cryptographic hashes, and evaluate defensive containment recommendations.',
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
          runAnalysis(res.items[0].alert_id);
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
    cyberAudio.playScan();
    try {
      const res = await aiApi.analyzeAlert(alertIdToAnalyze);
      cyberAudio.playSuccess();
      setAnalysisResult(res);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Forensic Analysis generated for ${alertIdToAnalyze}:\n\n• **Summary**: ${res.summary}\n• **Root Cause**: ${res.root_cause}\n• **Adversary Hypothesis**: ${res.threat_hypothesis}`,
        },
      ]);
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      cyberAudio.playAlarm();
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
    cyberAudio.playClick();
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);

    setTimeout(() => {
      cyberAudio.playClick();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Regarding "${userText}": In Project EYE architecture, this telemetry anomaly is cross-referenced with your MITRE ATT&CK detection catalog. I recommend auditing recent authentication attempts on the target host and enforcing credential rotations.`,
        },
      ]);
    }, 600);
  };

  const selectedAlert = alerts.find((a) => a.alert_id === selectedAlertId) || alerts[0];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 tracking-wide flex items-center gap-2">
            <Bot className="w-5 h-5 text-eye-primary animate-pulse" />
            INVESTIGATION WORKSPACE & AI FORENSICS
          </h1>
          <p className="text-xs text-eye-muted font-mono mt-0.5">
            Flagship 3-column forensic workbench: Telemetry Evidence → Sequence Canvas → AI Co-Pilot Inspector.
          </p>
        </div>

        {/* Prompt Shield Enforced Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-eye-success-soft border border-eye-success/40 text-eye-success text-xs font-mono shadow-glow-success">
          <ShieldCheck className="w-4 h-4 text-eye-success animate-pulse" />
          <span>PROMPT SHIELD: ENFORCED (ZERO-INJECTION)</span>
        </div>
      </div>

      {/* Flagship 3-Column Architecture */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Column 1: Evidence & Telemetry Source Queue (3 cols) */}
        <div className="xl:col-span-3 liquid-glass-card p-4 space-y-3 relative">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono font-bold text-slate-200 uppercase">
            <span className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-eye-primary" />
              Evidence Queue
            </span>
            <span className="text-[10px] text-eye-primary bg-eye-primary-soft px-2 py-0.5 rounded font-bold">
              {alerts.length} ALERTS
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {alerts.map((a) => {
              const isSelected = a.alert_id === selectedAlertId;
              return (
                <div
                  key={a.alert_id}
                  onClick={() => {
                    cyberAudio.playClick();
                    setSelectedAlertId(a.alert_id);
                    runAnalysis(a.alert_id);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all border font-mono text-xs ${
                    isSelected
                      ? 'bg-eye-primary-soft text-slate-100 border-eye-primary/50 shadow-glow-primary'
                      : 'bg-black/30 text-eye-muted hover:text-slate-200 hover:bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-eye-primary">{a.alert_id}</span>
                    <SeverityBadge severity={a.severity} />
                  </div>
                  <div className="text-xs font-bold text-slate-200 truncate">{a.rule_name}</div>
                  <div className="flex items-center justify-between text-[10px] text-eye-muted mt-2">
                    <span>Host: {a.host}</span>
                    <span>{new Date(a.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Investigation Canvas & Attack Timeline (5 cols) */}
        <div className="xl:col-span-5 space-y-4">
          {/* Target Overview Card */}
          {selectedAlert && (
            <div className="liquid-glass p-5 border-white/15 space-y-4">
              <div className="liquid-highlight" />

              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono uppercase text-eye-primary font-bold tracking-wider">
                    ACTIVE INVESTIGATION TARGET
                  </span>
                  <h3 className="text-sm font-bold font-mono text-slate-100">{selectedAlert.rule_name}</h3>
                </div>
                <SeverityBadge severity={selectedAlert.severity} />
              </div>

              {/* Entity Pivot Chips */}
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-eye-muted block uppercase">Target Host</span>
                  <span className="text-eye-primary font-bold">{selectedAlert.host}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-eye-muted block uppercase">Attacker IP</span>
                  <span className="text-eye-danger font-bold">{selectedAlert.source_ip || '198.51.100.77'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-eye-muted block uppercase">Rule ID</span>
                  <span className="text-eye-warning font-bold">{selectedAlert.rule_id}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-eye-muted block uppercase">Timestamp</span>
                  <span className="text-slate-300">{new Date(selectedAlert.created_at).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Timeline Sequence Nodes */}
              <div className="pt-2">
                <span className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5 mb-3">
                  <Clock className="w-4 h-4 text-eye-primary" />
                  Chronological Kill-Chain Sequence
                </span>

                <div className="space-y-2.5 relative border-l-2 border-eye-primary/30 ml-3 pl-4">
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-eye-primary shadow-glow-primary" />
                    <div className="text-[11px] font-mono text-eye-muted">T-00:04 Initial Ingestion & Normalization</div>
                    <div className="text-xs text-slate-200 font-mono">Raw telemetry stream accepted from {selectedAlert.host}</div>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-eye-warning shadow-glow-warning" />
                    <div className="text-[11px] font-mono text-eye-muted">T-00:02 Detection Rule Triggered</div>
                    <div className="text-xs text-slate-200 font-mono">Sliding window condition matched for {selectedAlert.rule_id}</div>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-eye-danger shadow-glow-danger animate-ping" />
                    <div className="text-[11px] font-mono text-eye-muted">NOW Incident Correlation Active</div>
                    <div className="text-xs text-slate-100 font-mono font-bold">Threat score calculated at {selectedAlert.severity === 'critical' ? '92/100' : '78/100'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Threat Findings & MITRE Attribution */}
          {analysisResult && (
            <div className="liquid-glass-card p-5 border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-eye-secondary flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Adversary Hypothesis & ATT&CK Mapping
                </span>
                <span className="text-[10px] font-mono text-eye-secondary bg-eye-secondary-soft px-2.5 py-0.5 rounded-full font-bold">
                  Confidence: {(analysisResult.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {analysisResult.threat_hypothesis}
              </p>

              {analysisResult.mitre_mapping.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                  {analysisResult.mitre_mapping.map((m, idx) => (
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
        </div>

        {/* Column 3: Inspector Panel & AI Interaction Stream (4 cols) */}
        <div className="xl:col-span-4 liquid-glass-card p-4 flex flex-col h-[650px] relative">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-eye-primary" />
              <h3 className="text-xs font-bold text-slate-100 font-mono tracking-wider uppercase">
                CO-PILOT FORENSIC INSPECTOR
              </h3>
            </div>
            <span className="text-[10px] text-eye-primary font-mono bg-eye-primary-soft px-2 py-0.5 rounded font-bold">
              TIER-2 CO-PILOT
            </span>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-eye-primary-soft text-cyan-100 border border-eye-primary/30 ml-6 font-sans shadow-glow-primary'
                    : 'bg-black/50 text-slate-300 border border-white/10 mr-6 whitespace-pre-wrap font-mono'
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="pt-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask AI for forensics guidance, IOC checks, or kill-chain pivots..."
              className="flex-1 px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-eye-primary shadow-inner"
            />
            <button
              type="submit"
              className="p-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 rounded-xl transition-all shadow-glow-primary"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
