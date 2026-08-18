import React, { useEffect, useState } from 'react';
import {
  Terminal,
  Search,
  RefreshCw,
  Play,
  FileCode,
  Calendar,
  Layers,
  Server,
} from 'lucide-react';
import { eventsApi } from '../api/events';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { Modal } from '../components/common/Modal';
import { SecurityEvent } from '../types';

interface Props {
  onOpenSimulator: () => void;
}

export const Events: React.FC<Props> = ({ onOpenSimulator }) => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [hostFilter, setHostFilter] = useState('');

  // Raw Event Viewer Modal
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventsApi.getEvents({
        search: search || undefined,
        source: sourceFilter || undefined,
        severity: severityFilter || undefined,
        host: hostFilter || undefined,
        limit: 100,
      });
      setEvents(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [sourceFilter, severityFilter, hostFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 tracking-wide flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            TELEMETRY LOG STREAM EXPLORER
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Normalized Common Event Schema (v1.0) with raw payload retention and live forensic search.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchEvents}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={onOpenSimulator}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-glow-red"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Inject Event
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="p-4 rounded-xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Query Bar */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Query logs (message, command, raw payload)..."
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Source Select */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-400"
          >
            <option value="">All Sources</option>
            <option value="linux-auth">Linux Auth</option>
            <option value="nginx">Nginx Web</option>
            <option value="windows">Windows Event</option>
            <option value="syslog">Syslog</option>
            <option value="custom">Custom JSON</option>
          </select>

          {/* Severity Select */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-400"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>

          <button
            type="submit"
            className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-mono font-bold transition-all shadow-glow-blue"
          >
            Query
          </button>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Total Logs: <span className="text-slate-100 font-bold">{total}</span>
        </div>
      </form>

      {/* Events Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Host</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Normalized Message</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Querying telemetry events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No telemetry events matched the query.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={event.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
                        {event.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-cyan-300 font-semibold">{event.host}</td>
                    <td className="py-3 px-4 text-slate-400">{event.event_type}</td>
                    <td className="py-3 px-4 text-slate-200 max-w-md truncate font-sans text-xs">
                      {event.message}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                        className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                      >
                        <FileCode className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Event Detail Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={`Telemetry Log Inspector: ${selectedEvent.event_id}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            {/* Header info */}
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
              <div>Host: <strong className="text-cyan-400">{selectedEvent.host}</strong> | Source: <strong className="text-slate-100">{selectedEvent.source}</strong></div>
              <div>Source IP: <strong className="text-slate-100">{selectedEvent.source_ip || 'N/A'}</strong> | User: <strong className="text-slate-100">{selectedEvent.username || 'N/A'}</strong></div>
              <div>Timestamp: <strong className="text-slate-100">{new Date(selectedEvent.timestamp).toUTCString()}</strong></div>
            </div>

            {/* Raw Log Payload */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                Raw Log Payload (Untampered)
              </label>
              <div className="p-3 bg-black/90 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                {selectedEvent.raw_event}
              </div>
            </div>

            {/* Normalized Metadata JSON */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                Normalized Schema Metadata
              </label>
              <div className="p-3 bg-black/90 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto max-h-48">
                <pre>{JSON.stringify(selectedEvent.meta_info, null, 2)}</pre>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
