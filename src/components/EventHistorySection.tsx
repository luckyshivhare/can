import React, { useState } from 'react';
import { SecurityAlert } from '../types/can';
import { History, Download, ShieldAlert, CheckCircle, Search, Filter, Calendar } from 'lucide-react';

interface EventHistorySectionProps {
  alerts: SecurityAlert[];
}

export const EventHistorySection: React.FC<EventHistorySectionProps> = ({ alerts }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filtered = alerts.filter((a) => {
    const matchesSev = filterSeverity === 'all' || a.severity === filterSeverity;
    const matchesText =
      searchTerm === '' ||
      a.attackName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.canId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSev && matchesText;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const highCount = alerts.filter((a) => a.severity === 'high').length;
  const mediumCount = alerts.filter((a) => a.severity === 'medium').length;

  const exportData = (type: 'csv' | 'json') => {
    if (type === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(alerts, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `cav_shield_history_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const headers = ['Timestamp', 'Event_ID', 'CAN_ID', 'Attack_Name', 'Severity', 'Confidence', 'Details'];
      const rows = alerts.map((a) => [
        new Date(a.timestamp).toISOString(),
        a.id,
        a.canId,
        `"${a.attackName}"`,
        a.severity,
        a.confidence,
        `"${a.details.replace(/"/g, '""')}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `cav_shield_history_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  return (
    <div className="cyber-panel p-5 rounded-lg border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
            Forensic Event History & Incident Timeline
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/40 text-cyan-300 font-mono">
            {alerts.length} Total Incidents Logged
          </span>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportData('csv')}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded font-mono text-xs transition-colors"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => exportData('json')}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded font-mono text-xs transition-colors"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Severity Tally Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="bg-[#091020] p-3 rounded border border-rose-500/30 flex items-center justify-between">
          <span className="text-slate-400">Critical Threats</span>
          <span className="text-xl font-bold text-rose-400 tabular-nums">{criticalCount}</span>
        </div>
        <div className="bg-[#091020] p-3 rounded border border-amber-500/30 flex items-center justify-between">
          <span className="text-slate-400">High Risk Attacks</span>
          <span className="text-xl font-bold text-amber-400 tabular-nums">{highCount}</span>
        </div>
        <div className="bg-[#091020] p-3 rounded border border-purple-500/30 flex items-center justify-between">
          <span className="text-slate-400">Medium / Fuzzing</span>
          <span className="text-xl font-bold text-purple-400 tabular-nums">{mediumCount}</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search incident log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1 bg-[#060a14] border border-slate-800 rounded font-mono text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-56"
          />
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span>Filter Severity:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-2.5 py-1 bg-[#060a14] border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            No incident records in current timeline view.
          </div>
        ) : (
          filtered.map((item) => {
            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

            return (
              <div
                key={item.id}
                className="bg-[#070d1a] border border-slate-800 hover:border-slate-700 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors font-mono text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-400 text-[11px]">{timeStr}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-rose-400 font-bold">{item.canId}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-white font-semibold">{item.attackName}</span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                      item.severity === 'critical'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    }`}>
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {item.details}
                  </p>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="text-cyan-300 font-bold block">{item.confidence}% confidence</span>
                  <span className="text-slate-500 text-[10px] block">{item.detectionMethod}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
