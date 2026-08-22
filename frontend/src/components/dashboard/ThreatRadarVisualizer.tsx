import React, { useEffect, useState } from 'react';
import { Radio, ShieldAlert, Activity, Wifi } from 'lucide-react';
import { Alert } from '../../types';

interface Props {
  alerts: Alert[];
}

export const ThreatRadarVisualizer: React.FC<Props> = ({ alerts }) => {
  const [activeBlips, setActiveBlips] = useState<Array<{ id: string; x: number; y: number; severity: string; name: string }>>([]);

  useEffect(() => {
    // Generate radial coordinates for recent alerts
    const blips = alerts.slice(0, 8).map((a, i) => {
      const angle = (i * (360 / Math.max(alerts.length, 1)) + 45) * (Math.PI / 180);
      const radius = 35 + ((i * 19) % 55); // Percentage distance from center
      const x = 50 + radius * Math.cos(angle) * 0.42;
      const y = 50 + radius * Math.sin(angle) * 0.42;
      return {
        id: a.alert_id,
        x,
        y,
        severity: a.severity,
        name: a.rule_name
      };
    });
    setActiveBlips(blips);
  }, [alerts]);

  return (
    <div className="cyber-panel p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden flex flex-col justify-between">
      <div className="hud-corner-tl" />
      <div className="hud-corner-tr" />
      <div className="hud-corner-bl" />
      <div className="hud-corner-br" />

      {/* Radar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-mono text-xs font-bold tracking-wider text-slate-100 uppercase">
            ACTIVE THREAT RADAR
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
          <Wifi className="w-3 h-3 animate-ping text-cyan-300" />
          <span>SWEEP: 360° ACTIVE</span>
        </div>
      </div>

      {/* Center Tactical Radar Screen */}
      <div className="relative w-full aspect-square max-w-[280px] mx-auto my-3 flex items-center justify-center">
        {/* Concentric Distance Rings */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
        <div className="absolute inset-[18%] rounded-full border border-cyan-500/15 border-dashed" />
        <div className="absolute inset-[38%] rounded-full border border-cyan-500/25" />
        <div className="absolute inset-[58%] rounded-full border border-cyan-500/15" />
        <div className="absolute inset-[78%] rounded-full border border-cyan-500/30 bg-cyan-950/20" />

        {/* Crosshair Lines */}
        <div className="absolute w-full h-[1px] bg-cyan-500/20" />
        <div className="absolute h-full w-[1px] bg-cyan-500/20" />
        <div className="absolute w-full h-[1px] bg-cyan-500/10 rotate-45" />
        <div className="absolute w-full h-[1px] bg-cyan-500/10 -rotate-45" />

        {/* Animated Rotating Radar Sweep Needle */}
        <div className="absolute inset-0 rounded-full radar-sweep animate-radar-spin pointer-events-none" />

        {/* Threat Blips */}
        {activeBlips.map((blip) => {
          const colorClass = 
            blip.severity === 'critical' ? 'bg-red-500 shadow-glow-red' :
            blip.severity === 'high' ? 'bg-orange-500 shadow-glow-amber' :
            blip.severity === 'medium' ? 'bg-amber-400' : 'bg-cyan-400';

          return (
            <div
              key={blip.id}
              style={{ top: `${blip.y}%`, left: `${blip.x}%` }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            >
              <span className={`block w-2.5 h-2.5 rounded-full ${colorClass} animate-pulse`} />
              {/* Tooltip on hover */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-30 bg-[#060913]/95 border border-cyan-500/50 p-2 rounded text-[10px] font-mono text-slate-200 whitespace-nowrap shadow-xl">
                <div className="text-cyan-300 font-bold">{blip.id}</div>
                <div className="text-slate-400">{blip.name}</div>
              </div>
            </div>
          );
        })}

        {/* Center Origin Node */}
        <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-glow-cyan flex items-center justify-center z-10">
          <div className="w-1 h-1 rounded-full bg-slate-950" />
        </div>
      </div>

      {/* Radar Footer Telemetry */}
      <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-[11px] font-mono">
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-slate-400 block text-[9px] uppercase">Detected Blips</span>
          <span className="text-cyan-300 font-bold">{activeBlips.length} Targets</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-slate-400 block text-[9px] uppercase">Grid Zone</span>
          <span className="text-emerald-400 font-bold">ALPHA-SEC-01</span>
        </div>
      </div>
    </div>
  );
};
