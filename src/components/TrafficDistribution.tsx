import React from 'react';
import { PieChart, AlertOctagon, Zap, ShieldX, Gauge, Sliders } from 'lucide-react';
import { SimulationState } from '../types/can';

interface TrafficDistributionProps {
  simulationState: SimulationState;
  attackDistribution: Record<string, number>;
}

export const TrafficDistribution: React.FC<TrafficDistributionProps> = ({
  simulationState,
  attackDistribution
}) => {
  const { totalFrames, normalFrames, attackFrames } = simulationState;

  const normalPct = totalFrames > 0 ? (normalFrames / totalFrames) * 100 : 100;
  const attackPct = totalFrames > 0 ? (attackFrames / totalFrames) * 100 : 0;

  // Donut geometry
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const normalOffset = 0;
  const attackStroke = (attackPct / 100) * circumference;
  const normalStroke = circumference - attackStroke;

  const attackLabels: Record<string, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
    speed_spoofing: {
      label: 'Speed Spoofing',
      icon: <Gauge className="w-3.5 h-3.5 text-amber-400" />,
      color: 'bg-amber-500',
      desc: 'CAN ID 0x0244 velocity override'
    },
    invalid_brake: {
      label: 'Invalid Brake Actuation',
      icon: <ShieldX className="w-3.5 h-3.5 text-rose-500" />,
      color: 'bg-rose-500',
      desc: 'CAN ID 0x0320 99% hydraulic clamp'
    },
    fuzzy_attack: {
      label: 'Fuzzy Payload Injection',
      icon: <Sliders className="w-3.5 h-3.5 text-purple-400" />,
      color: 'bg-purple-500',
      desc: 'High-entropy random ID bursts'
    },
    can_dos: {
      label: 'CAN DoS (Zero Starvation)',
      icon: <Zap className="w-3.5 h-3.5 text-red-500" />,
      color: 'bg-red-600',
      desc: 'Dominant 0x0000 bus flood'
    }
  };

  const totalAttacksInDist = Object.values(attackDistribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 4. Normal vs Malicious Traffic Visualization */}
      <div className="lg:col-span-5 cyber-panel p-5 rounded-lg border border-slate-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PieChart className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
              Traffic Integrity Ratio
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Volumetric breakdown of clean vs anomalous CAN bus arbitration frames
          </p>
        </div>

        {/* Circular Donut Visualizer */}
        <div className="flex items-center justify-center gap-8 py-2">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke="#1e293b"
                strokeWidth="14"
                fill="none"
              />
              {/* Normal stroke */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke="#06b6d4"
                strokeWidth="14"
                fill="none"
                strokeDasharray={`${normalStroke} ${circumference}`}
                strokeDashoffset={normalOffset}
                className="transition-all duration-500"
              />
              {/* Attack stroke */}
              {attackFrames > 0 && (
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="#ef4444"
                  strokeWidth="14"
                  fill="none"
                  strokeDasharray={`${attackStroke} ${circumference}`}
                  strokeDashoffset={-normalStroke}
                  className="transition-all duration-500"
                />
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center font-mono">
              <span className="text-2xl font-extrabold text-white tabular-nums tracking-tighter">
                {normalPct.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase">
                Clean Traffic
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 font-mono text-xs">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block shadow-[0_0_6px_#06b6d4]" />
                <span className="text-slate-300 font-medium">Nominal CAN</span>
              </div>
              <span className="text-slate-400 text-[11px] pl-4 tabular-nums">
                {normalFrames.toLocaleString()} msgs ({normalPct.toFixed(1)}%)
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block shadow-[0_0_6px_#ef4444]" />
                <span className="text-rose-400 font-medium">Adversarial</span>
              </div>
              <span className="text-slate-400 text-[11px] pl-4 tabular-nums">
                {attackFrames.toLocaleString()} msgs ({attackPct.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-3 mt-3 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>CAN Bus Bandwidth</span>
          <span className="text-cyan-300">500 kbps (High Speed)</span>
        </div>
      </div>

      {/* 5. Attack Distribution Chart */}
      <div className="lg:col-span-7 cyber-panel p-5 rounded-lg border border-slate-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
                Threat Classification Distribution
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/40 text-rose-300 font-mono">
              {attackFrames} Total Detected
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Taxonomy of simulated attacks injected across powertrain and autonomous drive ECUs
          </p>
        </div>

        <div className="space-y-3.5 my-1">
          {Object.entries(attackLabels).map(([key, meta]) => {
            const count = attackDistribution[key] || 0;
            const pct = Math.round((count / totalAttacksInDist) * 100);

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    {meta.icon}
                    <span className="text-slate-200 font-medium">{meta.label}</span>
                    <span className="text-slate-500 text-[10px] hidden sm:inline">({meta.desc})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 tabular-nums">{count} incidents</span>
                    <span className="text-white font-semibold w-10 text-right tabular-nums">{pct}%</span>
                  </div>
                </div>

                {/* Progress track */}
                <div className="w-full h-2 rounded bg-slate-900 border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${meta.color} transition-all duration-500 rounded-sm`}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-800/80 pt-3 mt-3 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>IDS Multi-Class Model</span>
          <span className="text-slate-300">Supervised Random Forest (4 Classes)</span>
        </div>
      </div>
    </div>
  );
};
