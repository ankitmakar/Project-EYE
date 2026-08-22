import React, { useEffect, useRef, useState } from 'react';
import { Network, ZoomIn, ZoomOut, RotateCcw, Shield, Zap } from 'lucide-react';
import { Alert } from '../../types';

interface Node {
  id: string;
  label: string;
  type: 'attacker' | 'host' | 'user' | 'alert' | 'incident';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Edge {
  source: string;
  target: string;
  color: string;
}

interface Props {
  alerts: Alert[];
}

export const AttackGraphVisualizer: React.FC<Props> = ({ alerts }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particleOffsetRef = useRef<number>(0);

  // Build node-link graph from real telemetry alerts
  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const nodeMap = new Map<string, Node>();

    const addNode = (id: string, label: string, type: Node['type'], color: string, radius = 16) => {
      if (!nodeMap.has(id)) {
        const node: Node = {
          id,
          label,
          type,
          x: 100 + Math.random() * 400,
          y: 60 + Math.random() * 260,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius,
          color,
        };
        nodeMap.set(id, node);
        newNodes.push(node);
      }
      return nodeMap.get(id)!;
    };

    alerts.slice(0, 8).forEach((a) => {
      // 1. Alert Node
      const alertNode = addNode(a.alert_id, a.rule_name.slice(0, 14), 'alert', '#ffb700', 14);

      // 2. Attacker IP Node
      if (a.source_ip) {
        const ipNode = addNode(`ip-${a.source_ip}`, a.source_ip, 'attacker', '#ff0055', 18);
        newEdges.push({ source: ipNode.id, target: alertNode.id, color: 'rgba(255, 0, 85, 0.4)' });
      }

      // 3. Host Node
      if (a.host) {
        const hostNode = addNode(`host-${a.host}`, a.host, 'host', '#00f0ff', 18);
        newEdges.push({ source: alertNode.id, target: hostNode.id, color: 'rgba(0, 240, 255, 0.4)' });
      }

      // 4. User Node
      if (a.username) {
        const userNode = addNode(`user-${a.username}`, a.username, 'user', '#b026ff', 14);
        newEdges.push({ source: alertNode.id, target: userNode.id, color: 'rgba(176, 38, 255, 0.4)' });
      }
    });

    // Central SOC Incident Node if alerts exist
    if (newNodes.length > 0) {
      const incidentNode = addNode('INC-CAMPAIGN-01', 'Multi-Stage Incident', 'incident', '#ff0055', 22);
      newNodes.forEach((n) => {
        if (n.type === 'alert') {
          newEdges.push({ source: n.id, target: incidentNode.id, color: 'rgba(255, 0, 85, 0.6)' });
        }
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [alerts]);

  // Canvas Physics & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localNodes = [...nodes];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid Lines
      ctx.strokeStyle = 'rgba(27, 45, 90, 0.25)';
      ctx.lineWidth = 1;
      const step = 30;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Physics step: simple bounds constraint & gentle separation
      localNodes.forEach((n, i) => {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 30 || n.x > canvas.width - 30) n.vx *= -1;
        if (n.y < 30 || n.y > canvas.height - 30) n.vy *= -1;

        // Repel from other nodes
        for (let j = i + 1; j < localNodes.length; j++) {
          const other = localNodes[j];
          const dx = other.x - n.x;
          const dy = other.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 80) {
            const force = (80 - dist) / 80 * 0.05;
            n.vx -= (dx / dist) * force;
            n.vy -= (dy / dist) * force;
            other.vx += (dx / dist) * force;
            other.vy += (dy / dist) * force;
          }
        }
      });

      const nodeLookup = new Map(localNodes.map((n) => [n.id, n]));
      particleOffsetRef.current = (particleOffsetRef.current + 0.015) % 1;

      // Draw Edges with animated energy pulses
      edges.forEach((edge) => {
        const s = nodeLookup.get(edge.source);
        const t = nodeLookup.get(edge.target);
        if (!s || !t) return;

        ctx.strokeStyle = edge.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();

        // Traveling energy particle
        const px = s.x + (t.x - s.x) * particleOffsetRef.current;
        const py = s.y + (t.y - s.y) * particleOffsetRef.current;
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Nodes
      localNodes.forEach((node) => {
        // Outer Glow Halo
        ctx.fillStyle = node.color + '22';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
        ctx.fill();

        // Inner Circle Node
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Node Label
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.radius + 14);
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [nodes, edges]);

  return (
    <div className="cyber-panel p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden flex flex-col justify-between">
      <div className="hud-corner-tl" />
      <div className="hud-corner-tr" />
      <div className="hud-corner-bl" />
      <div className="hud-corner-br" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-mono text-xs font-bold tracking-wider text-slate-100 uppercase">
            LIVE ATTACK TOPOLOGY GRAPH
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Attacker IP
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Host
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Alert
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> User
          </span>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full h-[280px] bg-[#060913]/90 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={600}
          height={280}
          className="w-full h-full cursor-crosshair"
        />

        {/* HUD Overlay Stats */}
        <div className="absolute bottom-2 left-3 text-[10px] font-mono text-cyan-400/80 bg-slate-950/80 px-2 py-1 rounded border border-cyan-500/20">
          NODE ENTITIES: {nodes.length} | ACTIVE VECTORS: {edges.length}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          Dynamic node force simulation mapping live adversary lateral movement.
        </span>
        <span className="text-emerald-400 text-[11px] font-bold">PHYSICS: 60 FPS</span>
      </div>
    </div>
  );
};
