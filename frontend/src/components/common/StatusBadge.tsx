import React from 'react';

interface Props {
  status: string;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  const st = (status || 'new').toLowerCase();
  
  let styles = 'bg-slate-700/40 text-slate-300 border-slate-600/40';

  if (st === 'new' || st === 'open') {
    styles = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-glow-blue';
  } else if (st === 'acknowledged') {
    styles = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40';
  } else if (st === 'investigating') {
    styles = 'bg-amber-500/15 text-amber-300 border-amber-500/40';
  } else if (st === 'contained') {
    styles = 'bg-purple-500/15 text-purple-300 border-purple-500/40';
  } else if (st === 'resolved' || st === 'closed') {
    styles = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border uppercase tracking-wider ${styles}`}>
      {status}
    </span>
  );
};
