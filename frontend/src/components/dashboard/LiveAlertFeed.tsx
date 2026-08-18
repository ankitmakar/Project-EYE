import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, ShieldAlert, Clock } from 'lucide-react';
import { Alert } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';

interface Props {
  alerts: Alert[];
  loading: boolean;
}

export const LiveAlertFeed: React.FC<Props> = ({ alerts, loading }) => {
  const navigate = useNavigate();

  return (
    <div className="p-5 rounded-xl border border-slate-800/80 bg-[#0f172a]/70 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
          <h3 className="text-sm font-bold text-slate-100 font-mono tracking-wide">
            LIVE DETECTION ALERT STREAM
          </h3>
        </div>
        <button
          onClick={() => navigate('/alerts')}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 bg-slate-800/40 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-slate-400 font-mono text-xs">
          No security alerts generated in the current window.
        </div>
      ) : (
        <div className="space-y-2.5">
          {alerts.slice(0, 5).map((alert) => (
            <div
              key={alert.id}
              onClick={() => navigate(`/alerts?id=${alert.id}`)}
              className="p-3 rounded-lg border border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/50 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <SeverityBadge severity={alert.severity} size="sm" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-100 truncate font-mono">
                    {alert.rule_name}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 truncate">
                    <span>Host: <strong className="text-slate-300">{alert.host}</strong></span>
                    {alert.source_ip && (
                      <>
                        <span>•</span>
                        <span>IP: <strong className="text-slate-300">{alert.source_ip}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={alert.status} />
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
