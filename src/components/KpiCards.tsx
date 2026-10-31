import React from 'react';
import { Activity, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { SimulationState } from '../types/can';

interface KpiCardsProps {
  simulationState: SimulationState;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ simulationState }) => {
  const { totalFrames, normalFrames, attackFrames, detectionRate, isRunning, activeAttack } = simulationState;
  
  const normalPercentage = totalFrames > 0 ? ((normalFrames / totalFrames) * 100).toFixed(1) : '100.0';
  const attackPercentage = totalFrames > 0 ? ((attackFrames / totalFrames) * 100).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total CAN Frames */}
      <div className="cyber-panel p-5 rounded-lg border border-slate-800 relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Total CAN Frames</span>
          <Activity className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-mono text-white tabular-nums tracking-tight">
            {totalFrames.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-cyan-400/80">
            {isRunning ? '~30 msg/s' : '0 msg/s'}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
          <span>Bus arbitration load</span>
          <span className="text-slate-300">ISO 11898-2</span>
        </div>
      </div>

      {/* 2. Normal Frames */}
      <div className="cyber-panel p-5 rounded-lg border border-slate-800 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Normal Frames</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-mono text-emerald-400 tabular-nums tracking-tight">
            {normalFrames.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-emerald-500/80">
            {normalPercentage}%
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
          <span>Verified nominal ECUs</span>
          <span className="text-emerald-400">Passed CRC</span>
        </div>
      </div>

      {/* 3. Detected Attacks */}
      <div className={`cyber-panel p-5 rounded-lg relative overflow-hidden transition-all ${
        activeAttack !== 'none' || attackFrames > 0
          ? 'border-rose-500/40 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
          : 'border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Detected Attacks</span>
          <ShieldAlert className={`w-4 h-4 ${attackFrames > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-mono text-rose-400 tabular-nums tracking-tight">
            {attackFrames.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-rose-400/80">
            {attackPercentage}% of traffic
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
          <span>Active injection</span>
          <span className={activeAttack !== 'none' ? 'text-rose-400 font-bold uppercase animate-pulse' : 'text-slate-400'}>
            {activeAttack !== 'none' ? activeAttack.replace('_', ' ') : 'None'}
          </span>
        </div>
      </div>

      {/* 4. Detection Rate */}
      <div className="cyber-panel p-5 rounded-lg border border-slate-800 relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">IDS Detection Rate</span>
          <Cpu className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-mono text-cyan-300 tabular-nums tracking-tight">
            {detectionRate.toFixed(1)}%
          </span>
          <span className="text-xs font-mono text-slate-400">
            F1: 0.985
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
          <span>Classifier inference</span>
          <span className="text-cyan-400">~3.8 ms</span>
        </div>
      </div>
    </div>
  );
};
