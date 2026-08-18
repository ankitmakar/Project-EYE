import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  Play,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Code,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { detectionsApi } from '../api/detections';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { Modal } from '../components/common/Modal';
import { DetectionRule } from '../types';

export const Detections: React.FC = () => {
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modals
  const [inspectRule, setInspectRule] = useState<DetectionRule | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testLogInput, setTestLogInput] = useState('');
  const [testResults, setTestResults] = useState<any | null>(null);
  const [testingRule, setTestingRule] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await detectionsApi.getRules();
      setRules(data);
    } catch (err) {
      console.error('Failed to fetch rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (ruleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await detectionsApi.toggleRule(ruleId);
      setRules(rules.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const handleRunRuleTest = async () => {
    if (!inspectRule || !testLogInput.trim()) return;
    setTestingRule(true);
    setTestResults(null);
    try {
      const res = await detectionsApi.testRule(inspectRule.yaml_content, [testLogInput]);
      setTestResults(res);
    } catch (err: any) {
      setTestResults({ error: err.message || err });
    } finally {
      setTestingRule(false);
    }
  };

  const filteredRules = rules.filter((r) => {
    if (selectedCategory && r.category !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.rule_id.toLowerCase().includes(q) ||
        (r.mitre_technique && r.mitre_technique.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            DETECTION RULES & MITRE ATT&CK MATRIX
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Declarative YAML detection rules with sliding thresholds and adversarial technique mapping.
          </p>
        </div>

        <button
          onClick={fetchRules}
          className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Filter & Search */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rule ID, name, MITRE technique..."
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-400"
          >
            <option value="">All Categories</option>
            <option value="authentication">Authentication</option>
            <option value="endpoint">Endpoint</option>
            <option value="web">Web Attacks</option>
            <option value="network">Network</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Active Rules: <span className="text-cyan-400 font-bold">{rules.filter((r) => r.enabled).length}</span> / {rules.length}
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} className="h-44 bg-slate-800/40 rounded-xl animate-pulse" />
          ))
        ) : filteredRules.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 font-mono text-xs">
            No detection rules found matching query.
          </div>
        ) : (
          filteredRules.map((rule) => (
            <div
              key={rule.id}
              onClick={() => {
                setInspectRule(rule);
                setTestLogInput('');
                setTestResults(null);
              }}
              className="p-5 rounded-xl border border-slate-800/80 bg-[#0f172a]/80 backdrop-blur-md hover:border-slate-600 transition-all cursor-pointer flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={rule.severity} size="sm" />
                    <span className="text-[11px] font-mono text-slate-400 uppercase">
                      {rule.category}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleToggle(rule.id, e)}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {rule.enabled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500">
                        <ToggleLeft className="w-5 h-5" />
                        Disabled
                      </span>
                    )}
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-100 font-mono mb-1.5 group-hover:text-cyan-300 transition-colors">
                  {rule.name}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed font-sans">
                  {rule.description || 'Deterministic rule evaluation logic.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="text-cyan-400 font-bold">{rule.rule_id}</span>
                <span className="truncate max-w-[140px] text-slate-400">
                  {rule.mitre_technique || 'T1078'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rule Inspection & YAML Viewer Modal */}
      {inspectRule && (
        <Modal
          isOpen={!!inspectRule}
          onClose={() => setInspectRule(null)}
          title={`Detection Rule Definition: ${inspectRule.rule_id}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-mono">{inspectRule.name}</h3>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Category: <strong className="text-slate-200">{inspectRule.category}</strong> | Confidence: <strong className="text-cyan-400">{(inspectRule.confidence * 100).toFixed(0)}%</strong>
                </div>
              </div>
              <SeverityBadge severity={inspectRule.severity} />
            </div>

            {/* YAML Content */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-cyan-400" />
                Declarative YAML Definition
              </label>
              <div className="p-3 bg-black/95 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 whitespace-pre overflow-x-auto max-h-56">
                {inspectRule.yaml_content}
              </div>
            </div>

            {/* Dry-Run Sandbox */}
            <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
              <span className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-cyan-400" />
                Dry-Run Rule Sandbox (Test Sample Log)
              </span>
              <input
                type="text"
                value={testLogInput}
                onChange={(e) => setTestLogInput(e.target.value)}
                placeholder="Paste sample log payload to test against this rule..."
                className="w-full px-3 py-2 bg-black/70 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleRunRuleTest}
                disabled={testingRule || !testLogInput.trim()}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold rounded transition-colors disabled:opacity-50"
              >
                {testingRule ? 'Evaluating...' : 'Test Log Against Rule'}
              </button>

              {testResults && (
                <div className="p-3 bg-black/80 rounded border border-slate-800 text-xs font-mono text-emerald-400">
                  <pre>{JSON.stringify(testResults, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
