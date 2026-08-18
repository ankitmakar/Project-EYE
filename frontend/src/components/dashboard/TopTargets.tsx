import React from 'react';
import { Server, Globe, Shield, UserX } from 'lucide-react';
import { Alert } from '../../types';

interface Props {
  alerts: Alert[];
}

export const TopTargets: React.FC<Props> = ({ alerts }) => {
  // Aggregate top attacked hosts
  const hostCounts = alerts.reduce<Record<string, number>>((acc, a) => {
    acc[a.host] = (acc[a.host] || 0) + 1;
    return acc;
  }, {});

  const topHosts = Object.entries(hostCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Aggregate top attacking IPs
  const ipCounts = alerts.reduce<Record<string, number>>((acc, a) => {
    if (a.source_ip) acc[a.source_ip] = (acc[a.source_ip] || 0) + 1;
    return acc;
  }, {});

  const topIPs = Object.entries(ipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Top Attacked Hosts */}
      <div className="p-5 rounded-xl border border-slate-800/80 bg-[#0f172a]/70 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 font-mono tracking-wide">
            TOP ATTACKED ASSETS
          </h3>
        </div>

        {topHosts.length === 0 ? (
          <div className="text-xs text-slate-400 font-mono py-4 text-center">No host attack activity</div>
        ) : (
          <div className="space-y-2.5">
            {topHosts.map(([host, count], idx) => (
              <div
                key={host}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 font-mono text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                    #{idx + 1}
                  </span>
                  <span className="text-slate-200 font-semibold">{host}</span>
                </div>
                <div className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 text-[11px]">
                  {count} {count === 1 ? 'alert' : 'alerts'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Attacker IPs */}
      <div className="p-5 rounded-xl border border-slate-800/80 bg-[#0f172a]/70 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-bold text-slate-100 font-mono tracking-wide">
            TOP ADVERSARY SOURCE IPs
          </h3>
        </div>

        {topIPs.length === 0 ? (
          <div className="text-xs text-slate-400 font-mono py-4 text-center">No external threat IPs logged</div>
        ) : (
          <div className="space-y-2.5">
            {topIPs.map(([ip, count], idx) => (
              <div
                key={ip}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 font-mono text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-[10px]">
                    #{idx + 1}
                  </span>
                  <span className="text-slate-200 font-semibold">{ip}</span>
                </div>
                <div className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 text-[11px]">
                  {count} {count === 1 ? 'trigger' : 'triggers'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
