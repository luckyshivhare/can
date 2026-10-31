import React, { useState, useEffect } from 'react';
import { Shield, Radio, Terminal, Cpu, AlertTriangle, Play, Pause, RefreshCw } from 'lucide-react';
import { SimulationState, IDSModelStatus, VehicleTelemetry } from '../types/can';

interface TopBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  simulationState: SimulationState;
  modelStatus: IDSModelStatus;
  telemetry: VehicleTelemetry;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onResetSimulation: () => void;
  onOpenPythonGuide: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  simulationState,
  modelStatus,
  telemetry,
  onStartSimulation,
  onStopSimulation,
  onResetSimulation,
  onOpenPythonGuide
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' UTC' + (now.getTimezoneOffset() <= 0 ? '+' : '-') + Math.abs(Math.floor(now.getTimezoneOffset() / 60)).toString().padStart(2, '0')
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isThreatActive = simulationState.activeAttack !== 'none' || telemetry.spoofDetected || telemetry.brakeOverrideDetected;

  return (
    <header className="sticky top-0 z-40 bg-[#070b16]/95 backdrop-blur-md border-b border-slate-800/80">
      {/* Primary Top Bar Contract: 3 zones */}
      <div className="flex items-center justify-between gap-8 px-6 py-3 max-w-[1720px] mx-auto">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-wider text-white font-mono uppercase">
                CAV-SHIELD
              </span>
              <span className="text-[10px] tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                SOC v2.4
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Autonomous Vehicle Intrusion Detection
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {[
            { id: 'overview', label: 'SOC Overview' },
            { id: 'can_monitor', label: 'CAN Traffic' },
            { id: 'attack_lab', label: 'Attack Simulator' },
            { id: 'alerts', label: 'Security Alerts' },
            { id: 'telemetry', label: 'Vehicle Telemetry' },
            { id: 'api_docs', label: 'Python IDS Integration' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                currentTab === item.id
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Quick Action & Python Model Status */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenPythonGuide}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded border transition-all ${
              modelStatus.isConnected
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300'
            }`}
            title="Click to view Python connector API"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {modelStatus.isConnected ? 'PYTHON IDS: CONNECTED' : 'PYTHON IDS: STANDBY'}
            </span>
            <span className="sm:hidden font-mono text-[10px]">
              {modelStatus.isConnected ? 'IDS: ON' : 'IDS: OFF'}
            </span>
          </button>

          {simulationState.isRunning ? (
            <button
              onClick={onStopSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-colors whitespace-nowrap shrink-0"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Stop Sim</span>
            </button>
          ) : (
            <button
              onClick={onStartSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Sim</span>
            </button>
          )}

          <button
            onClick={onResetSimulation}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded border border-slate-800 hover:bg-slate-800/60 transition-colors"
            title="Reset Simulation Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-status operational ribbon */}
      <div className="bg-[#040810] border-t border-slate-800/60 px-6 py-1.5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 max-w-[1720px] mx-auto text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            {/* System Status */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono text-[11px]">SYSTEM:</span>
              {isThreatActive ? (
                <span className="inline-flex items-center gap-1.5 text-rose-400 font-mono font-semibold tracking-wider text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  THREAT DETECTED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono font-medium text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ACTIVE MONITORING
                </span>
              )}
            </div>

            <span className="text-slate-700">|</span>

            {/* Simulation Status */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono text-[11px]">SIMULATION:</span>
              <span className="font-mono text-[11px] text-slate-300">
                {simulationState.activeAttack !== 'none' ? (
                  <span className="text-rose-400 font-semibold uppercase">
                    INJECTING {simulationState.activeAttack.replace('_', ' ')}
                  </span>
                ) : simulationState.isRunning ? (
                  <span className="text-cyan-400">NORMAL TRAFFIC (30 Hz)</span>
                ) : (
                  <span className="text-amber-400">PAUSED</span>
                )}
              </span>
            </div>

            <span className="text-slate-700">|</span>

            {/* Simulated Data Badge - Explicitly required */}
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-semibold">
                SIMULATED DATA
              </span>
              <span className="text-slate-500 text-[11px] hidden md:inline">
                (CAN bus telemetry synthetically generated for hackathon testbench)
              </span>
            </div>
          </div>

          {/* Time & Telemetry quick glance */}
          <div className="flex items-center gap-4 font-mono text-[11px] text-slate-400">
            <span className="hidden sm:inline">
              BUS: <span className="text-cyan-300">{telemetry.busStatus}</span>
            </span>
            <span className="text-slate-300">{timeStr}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
