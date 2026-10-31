import React, { useState } from 'react';
import { CanFrame } from '../types/can';
import { Radio, Search, Pause, Play, ShieldAlert, CheckCircle, Terminal } from 'lucide-react';

interface CanBusTrafficMonitorProps {
  frames: CanFrame[];
  isRunning: boolean;
  onTogglePause: () => void;
}

export const CanBusTrafficMonitor: React.FC<CanBusTrafficMonitorProps> = ({
  frames,
  isRunning,
  onTogglePause
}) => {
  const [filterId, setFilterId] = useState<string>('all');
  const [searchHex, setSearchHex] = useState<string>('');

  const filteredFrames = frames.filter((f) => {
    const matchesFilter = filterId === 'all' || f.canId === filterId;
    const matchesSearch =
      searchHex === '' ||
      f.payload.toLowerCase().includes(searchHex.toLowerCase()) ||
      f.ecuSource.toLowerCase().includes(searchHex.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="cyber-panel p-5 rounded-lg border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
            CAN Bus Frame Transceiver & Traffic Stream
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/40 text-cyan-300 font-mono">
            High Speed 500 kbps
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search payload or ECU..."
              value={searchHex}
              onChange={(e) => setSearchHex(e.target.value)}
              className="pl-8 pr-3 py-1 bg-[#060a14] border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44"
            />
          </div>

          <select
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
            className="px-2.5 py-1 bg-[#060a14] border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All CAN IDs</option>
            <option value="0x103">0x103 (ECM Engine RPM)</option>
            <option value="0x100">0x100 (WSS Speed)</option>
            <option value="0x101">0x101 (EBCM Brake)</option>
            <option value="0x102">0x102 (ADAS LiDAR)</option>
            <option value="0x0120">0x0120 (SAS Steer)</option>
            <option value="0x0000">0x0000 (Dominant DoS)</option>
          </select>

          <button
            onClick={onTogglePause}
            className={`flex items-center gap-1.5 px-3 py-1 rounded border transition-colors ${
              isRunning
                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'bg-cyan-950 border-cyan-500/50 text-cyan-300'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Freeze Stream' : 'Resume'}</span>
          </button>
        </div>
      </div>

      {/* Frame Table */}
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead className="sticky top-0 bg-[#070d1a] border-b border-slate-800 z-10">
            <tr className="text-slate-400">
              <th className="py-2 px-3 uppercase text-[11px] font-medium">Time (ms)</th>
              <th className="py-2 px-3 uppercase text-[11px] font-medium">CAN ID</th>
              <th className="py-2 px-3 uppercase text-[11px] font-medium">DLC</th>
              <th className="py-2 px-3 uppercase text-[11px] font-medium">Payload Data (Hex)</th>
              <th className="py-2 px-3 uppercase text-[11px] font-medium">ECU Node</th>
              <th className="py-2 px-3 uppercase text-[11px] font-medium">Integrity Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredFrames.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500">
                  Awaiting CAN bus packets...
                </td>
              </tr>
            ) : (
              filteredFrames.map((frame) => {
                const date = new Date(frame.timestamp);
                const timeStr = date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
                  '.' + date.getMilliseconds().toString().padStart(3, '0');

                return (
                  <tr
                    key={frame.id}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      frame.isAttack ? 'bg-rose-950/20 text-rose-200' : 'text-slate-300'
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-400 tabular-nums whitespace-nowrap">
                      {timeStr}
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`font-bold px-1.5 py-0.5 rounded border ${
                        frame.isAttack
                          ? 'bg-rose-950/60 border-rose-500 text-rose-400 font-mono shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                          : 'bg-cyan-950/40 border-cyan-800/40 text-cyan-300'
                      }`}>
                        {frame.canId}
                      </span>
                    </td>

                    <td className="py-2 px-3 text-slate-400 tabular-nums whitespace-nowrap">
                      {frame.dlc}
                    </td>

                    <td className="py-2 px-3 font-mono tracking-wider whitespace-nowrap">
                      {frame.payload.split(' ').map((byte, idx) => (
                        <span
                          key={idx}
                          className={`inline-block mr-1.5 ${
                            frame.isAttack ? 'text-rose-300 font-bold' : 'text-slate-200'
                          }`}
                        >
                          {byte}
                        </span>
                      ))}
                    </td>

                    <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                      <span className="text-[11px] text-slate-300">{frame.ecuSource}</span>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">
                      {frame.isAttack ? (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-[11px] uppercase">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>ANOMALOUS ({frame.attackType?.replace('_', ' ')})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>NOMINAL</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-slate-500 border-t border-slate-800/80 pt-3">
        <span>Displaying latest {filteredFrames.length} captured frames in rolling ring buffer</span>
        <span className="text-cyan-400">Ring Buffer Capacity: 200 msgs</span>
      </div>
    </div>
  );
};
