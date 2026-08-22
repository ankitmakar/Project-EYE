import React, { useEffect, useState } from 'react';
import { ShieldAlert, Search, Hash, Globe, Database, CheckCircle2, AlertTriangle, Fingerprint, RefreshCw } from 'lucide-react';
import { threatIntelApi, IOCItem } from '../api/threatIntel';
import { cyberAudio } from '../utils/cyberAudio';

export const ThreatIntel: React.FC = () => {
  const [iocs, setIocs] = useState<IOCItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [enrichResult, setEnrichResult] = useState<any | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Evidence Hasher State
  const [evidenceText, setEvidenceText] = useState('');
  const [hashResult, setHashResult] = useState<any | null>(null);

  const fetchIocs = async () => {
    try {
      const data = await threatIntelApi.getIocs();
      setIocs(data);
    } catch (err) {
      console.error('Failed to fetch IOCs:', err);
    }
  };

  useEffect(() => {
    fetchIocs();
  }, []);

  const handleEnrichSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoadingSearch(true);
    cyberAudio.playScan();
    try {
      const data = await threatIntelApi.enrichIoc(searchQuery);
      setEnrichResult(data);
      cyberAudio.playSuccess();
    } catch (err) {
      console.error('Enrichment failed:', err);
      cyberAudio.playAlarm();
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleCalculateHash = async () => {
    if (!evidenceText.trim()) return;
    cyberAudio.playClick();
    try {
      const data = await threatIntelApi.computeEvidenceHash(evidenceText);
      setHashResult(data);
      cyberAudio.playSuccess();
    } catch (err) {
      console.error('Hash calculation failed:', err);
      cyberAudio.playAlarm();
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 tracking-wide flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400 animate-pulse" />
            THREAT INTELLIGENCE & FORENSICS REPOSITORY
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            IOC reputation feeds, attribution telemetry, and cryptographic digital forensics evidence verification.
          </p>
        </div>

        <button
          onClick={() => {
            cyberAudio.playScan();
            fetchIocs();
          }}
          className="p-2.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-slate-400 hover:text-cyan-300 transition-colors shadow-inner"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Top Split: Live IOC Enrichment Search + Hash Verifier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: IOC Enrichment (7 cols) */}
        <div className="lg:col-span-7 cyber-panel p-5 rounded-2xl border border-slate-800/80 space-y-4 relative">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-mono font-bold text-slate-100 uppercase">
            <Search className="w-4 h-4 text-cyan-400" />
            Live Indicator of Compromise (IOC) Enrichment
          </div>

          <form onSubmit={handleEnrichSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search IP (198.51.100.77), Domain (c2.darknet...), or SHA-256 hash..."
              className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400 shadow-inner"
            />
            <button
              type="submit"
              disabled={loadingSearch}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs rounded-xl transition-all shadow-glow-cyan disabled:opacity-50"
            >
              {loadingSearch ? 'Enriching...' : 'Enrich IOC'}
            </button>
          </form>

          {enrichResult && (
            <div className="p-4 rounded-xl bg-[#060913]/90 border border-cyan-500/40 space-y-2.5 animate-fade-in font-mono text-xs shadow-glow-cyan/20">
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 font-bold">{enrichResult.indicator}</span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                  enrichResult.reputation === 'malicious' ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-glow-red' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {enrichResult.reputation} ({enrichResult.score}/100)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px] pt-2 border-t border-slate-800">
                <div>Threat Actor: <strong className="text-slate-100">{enrichResult.threat_actor}</strong></div>
                <div>Malware Family: <strong className="text-slate-100">{enrichResult.malware_family}</strong></div>
                <div>Confidence: <strong className="text-cyan-300">{(enrichResult.confidence * 100).toFixed(0)}%</strong></div>
                <div>Sources: <strong className="text-slate-100">{enrichResult.sources?.join(', ')}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Forensic Evidence Hash Calculator (5 cols) */}
        <div className="lg:col-span-5 cyber-panel p-5 rounded-2xl border border-slate-800/80 space-y-4 relative">
          <div className="hud-corner-tl" style={{ borderColor: '#00ff9d' }} />
          <div className="hud-corner-tr" style={{ borderColor: '#00ff9d' }} />
          <div className="hud-corner-bl" style={{ borderColor: '#00ff9d' }} />
          <div className="hud-corner-br" style={{ borderColor: '#00ff9d' }} />

          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-mono font-bold text-slate-100 uppercase">
            <Fingerprint className="w-4 h-4 text-emerald-400" />
            Digital Forensics Evidence Hasher
          </div>

          <textarea
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
            placeholder="Paste raw log payload, command blob, or memory string to calculate SHA-256 chain-of-custody checksum..."
            rows={3}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-400 resize-none shadow-inner"
          />

          <button
            onClick={handleCalculateHash}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-mono font-bold text-xs rounded-xl transition-all shadow-glow-emerald"
          >
            Compute Cryptographic Hash
          </button>

          {hashResult && (
            <div className="p-3.5 bg-[#060913]/90 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[10px] text-slate-300">
              <div>
                <span className="text-slate-500 uppercase block">SHA-256 Checksum:</span>
                <span className="text-emerald-400 break-all font-bold">{hashResult.sha256}</span>
              </div>
              <div className="pt-1 flex items-center justify-between text-slate-400 text-[9px]">
                <span>MD5: {hashResult.md5}</span>
                <span>Size: {hashResult.byte_size} bytes</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Known Threat Indicators Table */}
      <div className="cyber-panel p-5 rounded-2xl border border-slate-800/80 space-y-3 relative">
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />

        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="font-mono text-xs font-bold uppercase text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            Active Threat Intelligence Catalog
          </span>
          <span className="text-[10px] font-mono text-slate-400">Total Indicators: {iocs.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <th className="pb-2.5">Indicator</th>
                <th className="pb-2.5">Type</th>
                <th className="pb-2.5">Threat Actor / Campaign</th>
                <th className="pb-2.5">Malware Family</th>
                <th className="pb-2.5">Score</th>
                <th className="pb-2.5">Reputation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
              {iocs.map((ioc, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="py-2.5 font-bold text-cyan-400">{ioc.indicator}</td>
                  <td className="py-2.5 uppercase text-slate-400 text-[10px]">{ioc.type}</td>
                  <td className="py-2.5 text-slate-200">{ioc.threat_actor || 'APT Unclassified'}</td>
                  <td className="py-2.5 text-slate-300">{ioc.malware_family || 'Generic C2'}</td>
                  <td className="py-2.5 font-bold text-amber-400">{ioc.score}/100</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ioc.reputation === 'malicious' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {ioc.reputation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
