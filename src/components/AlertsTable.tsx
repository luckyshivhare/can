import React, { useState } from 'react';
import { SecurityAlert } from '../types/can';
import { ShieldAlert, AlertTriangle, CheckCircle, Search, Filter, ChevronRight, X, Download } from 'lucide-react';

interface AlertsTableProps {
  alerts: SecurityAlert[];
  isFullView?: boolean;
}

export const AlertsTable: React.FC<AlertsTableProps> = ({ alerts, isFullView = false }) => {
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredAlerts = alerts.filter((a) => {
    const matchesSearch =
      a.canId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.attackName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.payload.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.detectionMethod.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || a.attackType === filterType;
    return matchesSearch && matchesType;
  });

  const displayList = isFullView ? filteredAlerts : filteredAlerts.slice(0, 10);

  const exportAlerts = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(alerts, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `cav_shield_security_alerts_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const headers = ['Timestamp', 'CAN_ID', 'Attack_Type', 'Confidence_Pct', 'Detection_Method', 'Payload', 'Details', 'Mitigation'];
      const rows = alerts.map((a) => [
        new Date(a.timestamp).toISOString(),
        a.canId,
        a.attackType,
        a.confidence,
        `"${a.detectionMethod}"`,
        `"${a.payload}"`,
        `"${a.details.replace(/"/g, '""')}"`,
        `"${a.mitigationAction.replace(/"/g, '""')}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `cav_shield_alerts_${Date.now()}.csv`);
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
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
            {isFullView ? 'Comprehensive Security Alerts & Forensic Log' : 'Recent Security Alerts'}
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/70 border border-rose-800/40 text-rose-300 font-mono">
            {alerts.length} Incidents Logged
          </span>
        </div>

        {/* Filter and Export Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search CAN ID, payload..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-[#060a14] border border-slate-800 rounded font-mono text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44"
            />
          </div>

          {/* Filter type dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1 bg-[#060a14] border border-slate-800 rounded font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Attacks</option>
            <option value="speed_spoofing">Speed Spoofing</option>
            <option value="invalid_brake">Invalid Brake</option>
            <option value="fuzzy_attack">Fuzzy Attack</option>
            <option value="can_dos">CAN DoS</option>
          </select>

          {/* Export buttons */}
          <button
            onClick={() => exportAlerts('csv')}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded font-mono text-xs text-slate-300 transition-colors"
            title="Export CSV for Hackathon Report"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => exportAlerts('json')}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded font-mono text-xs text-slate-300 transition-colors"
            title="Export JSON"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-[#070d1a]">
              <th className="py-2.5 px-3 uppercase text-[11px] font-medium">Timestamp</th>
              <th className="py-2.5 px-3 uppercase text-[11px] font-medium">CAN ID</th>
              <th className="py-2.5 px-3 uppercase text-[11px] font-medium">Hex Payload</th>
              <th className="py-2.5 px-3 uppercase text-[11px] font-medium">Attack Type</th>
              <th className="py-2.5 px-3 uppercase text-[11px] font-medium text-right">Confidence</th>
              <th className="py-2.5 px-3 uppercase text-[11px] font-medium">Detection Method</th>
              <th className="py-2.5 px-3 uppercase text-[11px] font-medium text-center">Triage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {displayList.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500">
                  No security alerts matching current filter. Normal CAN arbitration nominal.
                </td>
              </tr>
            ) : (
              displayList.map((alert) => {
                const date = new Date(alert.timestamp);
                const timeStr = date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
                  '.' + date.getMilliseconds().toString().padStart(3, '0');

                return (
                  <tr
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap tabular-nums">
                      {timeStr}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-bold text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-800/30">
                        {alert.canId}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-300 font-mono tracking-wider max-w-[200px] truncate">
                      {alert.payload}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-slate-200 font-medium">
                        {alert.attackName}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className={`font-bold tabular-nums ${
                        alert.confidence >= 98
                          ? 'text-rose-400'
                          : alert.confidence >= 90
                          ? 'text-amber-400'
                          : 'text-cyan-300'
                      }`}>
                        {alert.confidence.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`text-[11px] ${
                        alert.detectionMethod === 'External Python IDS'
                          ? 'text-emerald-400 font-semibold'
                          : 'text-slate-400'
                      }`}>
                        {alert.detectionMethod}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="text-cyan-400 group-hover:translate-x-0.5 inline-flex items-center transition-transform">
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Forensic Drawer Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="cyber-panel w-full max-w-2xl rounded-lg border border-slate-700 p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedAlert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-rose-400 font-mono text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>FORENSIC INCIDENT INVESTIGATION // {selectedAlert.id}</span>
            </div>

            <h2 className="text-lg font-bold text-white font-mono">
              {selectedAlert.attackName}
            </h2>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-[#070d1a] p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">CAN ID</span>
                <span className="text-rose-400 font-bold text-sm">{selectedAlert.canId}</span>
              </div>
              <div className="bg-[#070d1a] p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Confidence</span>
                <span className="text-cyan-300 font-bold text-sm">{selectedAlert.confidence}%</span>
              </div>
              <div className="bg-[#070d1a] p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Severity</span>
                <span className="text-rose-400 font-bold text-sm uppercase">{selectedAlert.severity}</span>
              </div>
              <div className="bg-[#070d1a] p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Detection Engine</span>
                <span className="text-emerald-400 font-bold text-xs truncate block">{selectedAlert.detectionMethod}</span>
              </div>
            </div>

            {/* Decoded Byte Matrix */}
            <div className="border border-slate-800 rounded bg-[#060a14] p-3 space-y-2">
              <span className="text-xs font-mono text-slate-400 block">
                Raw 8-Byte CAN Data Payload (Hex Disassembly):
              </span>
              <div className="grid grid-cols-8 gap-1.5 font-mono text-center">
                {selectedAlert.payload.split(' ').map((byte, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-700/60 p-2 rounded">
                    <span className="text-[10px] text-slate-500 block">B{idx}</span>
                    <span className="text-cyan-300 font-bold text-xs">{byte}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attack Details */}
            <div className="space-y-1 font-mono text-xs">
              <span className="text-slate-400 font-semibold block">Anomalous Signature Analysis:</span>
              <p className="bg-[#070d1a] p-3 rounded border border-slate-800 text-slate-200 leading-relaxed text-[11px]">
                {selectedAlert.details}
              </p>
            </div>

            {/* Recommended Mitigation */}
            <div className="space-y-1 font-mono text-xs">
              <span className="text-emerald-400 font-semibold block">Automotive Mitigation & Fail-Safe Response:</span>
              <p className="bg-emerald-950/20 p-3 rounded border border-emerald-500/30 text-emerald-200 leading-relaxed text-[11px]">
                {selectedAlert.mitigationAction}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono text-xs transition-colors"
              >
                Close Forensics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
