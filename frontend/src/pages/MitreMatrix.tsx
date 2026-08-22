import React, { useState } from 'react';
import { ShieldCheck, Layers, ExternalLink, Filter, Zap, CheckCircle2 } from 'lucide-react';

interface Technique {
  id: string;
  name: string;
  covered: boolean;
  ruleId?: string;
  severity?: string;
}

interface Tactic {
  name: string;
  id: string;
  techniques: Technique[];
}

export const MitreMatrix: React.FC = () => {
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);

  const tactics: Tactic[] = [
    {
      name: 'Initial Access',
      id: 'TA0001',
      techniques: [
        { id: 'T1190', name: 'Exploit Public-Facing App', covered: true, ruleId: 'WEB-001 / WEB-002', severity: 'high' },
        { id: 'T1189', name: 'Drive-by Compromise', covered: true, ruleId: 'WEB-003', severity: 'medium' },
        { id: 'T1078', name: 'Valid Accounts', covered: true, ruleId: 'AUTH-003', severity: 'critical' },
        { id: 'T1566', name: 'Phishing', covered: false },
      ],
    },
    {
      name: 'Execution',
      id: 'TA0002',
      techniques: [
        { id: 'T1059.004', name: 'Unix Shell Execution', covered: true, ruleId: 'EXEC-002', severity: 'critical' },
        { id: 'T1059.001', name: 'PowerShell', covered: true, ruleId: 'EXEC-001', severity: 'high' },
        { id: 'T1204', name: 'User Execution', covered: false },
      ],
    },
    {
      name: 'Persistence',
      id: 'TA0003',
      techniques: [
        { id: 'T1053.003', name: 'Cron Job', covered: true, ruleId: 'PERS-001', severity: 'high' },
        { id: 'T1098.004', name: 'SSH Authorized Keys', covered: true, ruleId: 'PERS-002', severity: 'high' },
        { id: 'T1505.003', name: 'Web Shell', covered: true, ruleId: 'WEB-004', severity: 'critical' },
      ],
    },
    {
      name: 'Privilege Escalation',
      id: 'TA0004',
      techniques: [
        { id: 'T1548.003', name: 'Sudo and Sudo Caching', covered: true, ruleId: 'PRIV-001', severity: 'medium' },
        { id: 'T1068', name: 'Exploitation for Privilege', covered: false },
        { id: 'T1548.001', name: 'Setuid and Setgid', covered: true, ruleId: 'PRIV-002', severity: 'critical' },
      ],
    },
    {
      name: 'Defense Evasion',
      id: 'TA0005',
      techniques: [
        { id: 'T1027', name: 'Obfuscated Information', covered: true, ruleId: 'EXEC-001', severity: 'high' },
        { id: 'T1070', name: 'Indicator Removal', covered: false },
        { id: 'T1112', name: 'Modify Registry', covered: false },
      ],
    },
    {
      name: 'Credential Access',
      id: 'TA0006',
      techniques: [
        { id: 'T1110.001', name: 'Password Guessing', covered: true, ruleId: 'AUTH-001', severity: 'high' },
        { id: 'T1110.003', name: 'Password Spraying', covered: true, ruleId: 'AUTH-002', severity: 'high' },
        { id: 'T1003.002', name: 'Security Account Manager', covered: true, ruleId: 'PRIV-002', severity: 'critical' },
      ],
    },
    {
      name: 'Discovery',
      id: 'TA0007',
      techniques: [
        { id: 'T1046', name: 'Network Service Discovery', covered: true, ruleId: 'NET-003', severity: 'medium' },
        { id: 'T1082', name: 'System Information Discovery', covered: false },
      ],
    },
    {
      name: 'Command & Control',
      id: 'TA0011',
      techniques: [
        { id: 'T1071.004', name: 'DNS Tunneling', covered: true, ruleId: 'NET-001', severity: 'high' },
        { id: 'T1071.001', name: 'Web Protocols Beaconing', covered: true, ruleId: 'NET-002', severity: 'high' },
        { id: 'T1105', name: 'Ingress Tool Transfer (LOLBin)', covered: true, ruleId: 'EXEC-003', severity: 'high' },
      ],
    },
    {
      name: 'Impact',
      id: 'TA0040',
      techniques: [
        { id: 'T1486', name: 'Data Encrypted for Impact', covered: true, ruleId: 'FILE-001', severity: 'critical' },
        { id: 'T1485', name: 'Data Destruction', covered: false },
      ],
    },
  ];

  const totalTechniques = tactics.reduce((acc, t) => acc + t.techniques.length, 0);
  const coveredTechniques = tactics.reduce((acc, t) => acc + t.techniques.filter((x) => x.covered).length, 0);
  const coveragePercentage = ((coveredTechniques / totalTechniques) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 tracking-wide flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            MITRE ATT&CK® ENTERPRISE MATRIX NAVIGATOR
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Tactical adversary technique coverage heatmap cross-referenced with Project EYE detection rules.
          </p>
        </div>

        {/* Coverage Meter */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <div className="text-xs font-mono">
            <span className="text-slate-400 block text-[10px] uppercase">Active Matrix Coverage</span>
            <span className="text-cyan-300 font-bold">{coveredTechniques} of {totalTechniques} Techniques ({coveragePercentage}%)</span>
          </div>
        </div>
      </div>

      {/* MITRE ATT&CK Matrix Grid */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-[1200px]">
          {tactics.map((tactic) => (
            <div
              key={tactic.id}
              className="flex-1 min-w-[130px] cyber-panel rounded-xl border border-slate-800/80 p-3 flex flex-col gap-2"
            >
              {/* Tactic Header */}
              <div className="pb-2 border-b border-slate-800 text-center">
                <span className="text-[10px] font-mono text-cyan-400 block font-semibold">{tactic.id}</span>
                <span className="text-xs font-mono font-bold text-slate-200 tracking-tight">{tactic.name}</span>
              </div>

              {/* Techniques List */}
              <div className="space-y-2 flex-1">
                {tactic.techniques.map((tech) => (
                  <div
                    key={tech.id}
                    onClick={() => setSelectedTechnique(tech)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      tech.covered
                        ? 'bg-cyan-500/10 border-cyan-500/40 hover:bg-cyan-500/20 hover:border-cyan-400 text-cyan-200 shadow-glow-blue'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold flex items-center justify-between">
                      <span>{tech.id}</span>
                      {tech.covered && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                    </div>
                    <div className="text-[11px] font-mono mt-1 line-clamp-2 leading-tight">
                      {tech.name}
                    </div>
                    {tech.ruleId && (
                      <div className="mt-1.5 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded inline-block">
                        {tech.ruleId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Technique Inspector */}
      {selectedTechnique && (
        <div className="p-5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-md space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold font-mono text-cyan-300">
                {selectedTechnique.id} — {selectedTechnique.name}
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Coverage Status: <strong className={selectedTechnique.covered ? 'text-emerald-400' : 'text-slate-500'}>{selectedTechnique.covered ? 'ACTIVE DETECTION RULE' : 'UNMAPPED'}</strong>
            </span>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {selectedTechnique.covered
              ? `Project EYE provides automated real-time telemetry detection for ${selectedTechnique.name} (${selectedTechnique.id}) mapped to rule '${selectedTechnique.ruleId}'.`
              : `Technique ${selectedTechnique.id} is documented in MITRE ATT&CK Enterprise matrix and can be added via custom YAML rule.`}
          </p>
        </div>
      )}
    </div>
  );
};
