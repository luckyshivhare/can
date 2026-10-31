import React, { useState } from 'react';
import { TrafficHistoryPoint } from '../types/can';
import { Activity, ShieldAlert } from 'lucide-react';

interface TrafficChartProps {
  history: TrafficHistoryPoint[];
  isRunning: boolean;
  activeAttack: string;
}

export const TrafficChart: React.FC<TrafficChartProps> = ({ history, isRunning, activeAttack }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Fallback if history is empty
  const points = history.length > 0 ? history : [
    { timeStr: '00:00', timestamp: 0, normalRate: 25, attackRate: 0, totalRate: 25 }
  ];

  const maxVal = Math.max(50, ...points.map((p) => p.totalRate * 1.25));

  const chartWidth = 800;
  const chartHeight = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Generate SVG coordinates
  const getX = (idx: number) => padding.left + (idx / Math.max(1, points.length - 1)) * innerWidth;
  const getY = (val: number) => padding.top + innerHeight - (val / maxVal) * innerHeight;

  // Path generators
  const normalPoints = points.map((p, i) => `${getX(i)},${getY(p.normalRate)}`);
  const totalPoints = points.map((p, i) => `${getX(i)},${getY(p.totalRate)}`);

  const normalLinePath = `M ${normalPoints.join(' L ')}`;
  const normalAreaPath = `${normalLinePath} L ${getX(points.length - 1)},${padding.top + innerHeight} L ${getX(0)},${padding.top + innerHeight} Z`;

  const totalLinePath = `M ${totalPoints.join(' L ')}`;
  const totalAreaPath = `${totalLinePath} L ${getX(points.length - 1)},${padding.top + innerHeight} L ${getX(0)},${padding.top + innerHeight} Z`;

  const currentHoverPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : points[points.length - 1];

  return (
    <div className="cyber-panel p-5 rounded-lg border border-slate-800 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
              Real-Time CAN Bus Traffic Load
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/40 text-cyan-300 font-mono">
              30-Second Rolling Window
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Frame throughput comparison: Nominal ECU broadcast rate vs Adversarial injection load
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1.5 rounded-sm bg-cyan-400 inline-block shadow-[0_0_6px_#06b6d4]" />
            <span className="text-slate-300">Normal Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1.5 rounded-sm bg-rose-500 inline-block shadow-[0_0_6px_#ef4444]" />
            <span className="text-rose-300">Injected Attack</span>
          </div>
          {currentHoverPoint && (
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800 text-slate-400">
              <span>Rate:</span>
              <span className="text-cyan-300 font-semibold tabular-nums">{currentHoverPoint.totalRate} msg/s</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full h-[220px]">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="normalAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="attackAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding.top + innerHeight * (1 - pct);
            const val = Math.round(maxVal * pct);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="rgba(51, 65, 85, 0.3)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="monospace"
                  fill="#64748b"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Vertical Time Markers */}
          {points.map((p, idx) => {
            if (idx % 6 === 0 || idx === points.length - 1) {
              const x = getX(idx);
              return (
                <text
                  key={idx}
                  x={x}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fill="#64748b"
                >
                  {p.timeStr}
                </text>
              );
            }
            return null;
          })}

          {/* Total / Malicious Area (when attack active) */}
          {points.some((p) => p.attackRate > 0) && (
            <>
              <path d={totalAreaPath} fill="url(#attackAreaGrad)" />
              <path
                d={totalLinePath}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              />
            </>
          )}

          {/* Normal Traffic Area */}
          <path d={normalAreaPath} fill="url(#normalAreaGrad)" />
          <path
            d={normalLinePath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeLinecap="round"
            className="drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]"
          />

          {/* Interactive Hover Crosshair */}
          {points.map((p, idx) => {
            const x = getX(idx);
            return (
              <rect
                key={idx}
                x={x - 10}
                y={padding.top}
                width={20}
                height={innerHeight}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(idx)}
                className="cursor-crosshair"
              />
            );
          })}

          {hoverIndex !== null && points[hoverIndex] && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={padding.top + innerHeight}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(points[hoverIndex].totalRate)}
                r="4.5"
                fill="#ffffff"
                stroke="#06b6d4"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverIndex !== null && points[hoverIndex] && (
          <div
            className="absolute top-2 left-16 bg-slate-900/95 border border-slate-700/80 px-3 py-1.5 rounded text-xs font-mono shadow-lg pointer-events-none z-10"
          >
            <div className="text-slate-400 text-[10px] mb-1">{points[hoverIndex].timeStr}</div>
            <div className="flex items-center gap-3">
              <span className="text-cyan-400">Normal: {points[hoverIndex].normalRate} msg/s</span>
              {points[hoverIndex].attackRate > 0 && (
                <span className="text-rose-400 font-bold">Attack: +{points[hoverIndex].attackRate} msg/s</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Indicator */}
      <div className="flex items-center justify-between mt-3 text-xs text-slate-400 font-mono border-t border-slate-800/80 pt-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
          <span>{isRunning ? 'CAN Stream Ingestion: 30 Hz' : 'Stream Paused'}</span>
        </div>
        {activeAttack !== 'none' && (
          <div className="flex items-center gap-1.5 text-rose-400 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 animate-bounce" />
            <span>Adversarial packet surge detected</span>
          </div>
        )}
      </div>
    </div>
  );
};
