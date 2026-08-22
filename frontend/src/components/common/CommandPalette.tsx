import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  BellRing,
  Flame,
  Bot,
  Layers,
  Globe,
  Terminal,
  ShieldCheck,
  BarChart3,
  History,
  Settings,
  Zap,
  Volume2,
  VolumeX,
  X,
  CornerDownLeft,
} from 'lucide-react';
import { cyberAudio } from '../../utils/cyberAudio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenSimulator: () => void;
}

export const CommandPalette: React.FC<Props> = ({ isOpen, onClose, onOpenSimulator }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    { name: 'Dashboard Overview', icon: LayoutDashboard, path: '/', category: 'Navigation' },
    { name: 'Alerts Queue', icon: BellRing, path: '/alerts', category: 'SOC Operations' },
    { name: 'Incidents & Attack Chains', icon: Flame, path: '/incidents', category: 'SOC Operations' },
    { name: 'AI Investigation Co-Pilot', icon: Bot, path: '/investigation', category: 'Analysis' },
    { name: 'MITRE ATT&CK® Matrix', icon: Layers, path: '/mitre-matrix', category: 'Analysis' },
    { name: 'Threat Intelligence & IOCs', icon: Globe, path: '/threat-intel', category: 'Analysis' },
    { name: 'Telemetry Logs Stream', icon: Terminal, path: '/events', category: 'Telemetry' },
    { name: 'Detection Rules Catalog', icon: ShieldCheck, path: '/detections', category: 'Engineering' },
    { name: 'SOC Reports & Metrics', icon: BarChart3, path: '/reports', category: 'Management' },
    { name: 'Audit Trail Logs', icon: History, path: '/audit-logs', category: 'Governance' },
    { name: 'System Settings', icon: Settings, path: '/settings', category: 'Administration' },
    {
      name: 'Launch Attack Simulator Lab',
      icon: Zap,
      action: () => onOpenSimulator(),
      category: 'Validation',
    },
    {
      name: 'Toggle Cyber Sound FX',
      icon: cyberAudio.getMuted() ? VolumeX : Volume2,
      action: () => cyberAudio.toggleMute(),
      category: 'Preferences',
    },
  ];

  const filtered = actions.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item: typeof actions[0]) => {
    cyberAudio.playClick();
    onClose();
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(filtered.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(filtered.length, 1));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        handleSelect(filtered[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-md animate-fade-in select-none">
      <div
        className="w-full max-w-2xl liquid-glass-modal overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-eye-primary" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to workspace (e.g. Incidents, MITRE, Simulator)..."
            className="flex-1 bg-transparent border-none text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/10">
            ESC to exit
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-slate-400">
              No commands matching "{query}"
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.name}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-eye-primary/15 text-eye-primary border border-eye-primary/40 shadow-glow-primary'
                      : 'text-slate-300 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 ${isSelected ? 'text-eye-primary' : 'text-slate-400'}`} />
                    <span className="font-medium">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-eye-primary animate-pulse" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span className="text-eye-primary glow-cyan">PROJECT EYE HUD</span>
        </div>
      </div>
    </div>
  );
};
