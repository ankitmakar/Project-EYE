import React from 'react';

interface Props {
  severity: string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<Props> = ({ severity, size = 'md' }) => {
  const sev = (severity || 'info').toLowerCase();
  
  let colorStyles = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  let dotColor = 'bg-blue-400';

  if (sev === 'critical') {
    colorStyles = 'bg-red-500/15 text-red-400 border-red-500/40 shadow-glow-red animate-pulse';
    dotColor = 'bg-red-400';
  } else if (sev === 'high') {
    colorStyles = 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    dotColor = 'bg-orange-400';
  } else if (sev === 'medium') {
    colorStyles = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    dotColor = 'bg-amber-400';
  } else if (sev === 'low') {
    colorStyles = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    dotColor = 'bg-emerald-400';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 uppercase tracking-wider rounded-md border ${sizeClass} ${colorStyles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {severity}
    </span>
  );
};
