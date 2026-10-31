import React, { useState } from 'react';
import {
  Play,
  Pause,
  RefreshCw,
  Gauge,
  Disc,
  Sliders,
  Zap,
  ShieldCheck,
  Flame,
  Send,
  Check
} from 'lucide-react';
import { AttackType, SimulationState } from '../types/can';

interface SimulationControlsProps {
  simulationState: SimulationState;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onInject: (type: AttackType, intensity: number) => void;
  onClearAttack: () => void;
  onManualInject?: (canId: string, payload: string) => Promise<{ success: boolean }>;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  simulationState,
  onStart,
  onStop,
  onReset,
  onInject,
  onClearAttack,
  onManualInject
}) => {
  const [intensity, setIntensity] = useState<number>(5);
  const [manualCanId, setManualCanId] = useState<string>('0x100');
  const [manualPayload, setManualPayload] = useState<string>('FF 00 24 00 12 00 00 88');
  const [manualSent, setManualSent] = useState<boolean>(false);

  const { isRunning, activeAttack } = simulationState;

  const handleSendManual = async () => {
    if (onManualInject && manualCanId && manualPayload) {
      const res = await onManualInject(manualCanId, manualPayload);
      if (res?.success) {
        setManualSent(true);
        setTimeout(() => setManualSent(false), 2000);
      }
    }
  };

  return (
    <div className="cyber-panel p-5 rounded-lg border border-slate-800 space-y-4">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
            Autonomous Vehicle CAN Attack Simulation Lab
          </h3>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-slate-400">STATUS:</span>
          {activeAttack !== 'none' ? (
            <span className="text-rose-400 font-bold uppercase animate-pulse">
              ADVERSARIAL ATTACK ACTIVE ({activeAttack.replace('_', ' ')})
            </span>
          ) : isRunning ? (
            <span className="text-cyan-400 font-medium">NORMAL CAN BUS TRAFFIC</span>
          ) : (
            <span className="text-slate-500">SIMULATION PAUSED</span>
          )}
        </div>
      </div>

      {/* Primary Lifecycle Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={onStart}
          disabled={isRunning && activeAttack === 'none'}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium rounded transition-all ${
            isRunning && activeAttack === 'none'
              ? 'bg-cyan-950/40 text-cyan-500/60 border border-cyan-800/30 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Start Normal Traffic</span>
        </button>

        <button
          onClick={onStop}
          disabled={!isRunning}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium rounded transition-all ${
            !isRunning
              ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          <Pause className="w-3.5 h-3.5" />
          <span>Stop Simulation</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Simulation</span>
        </button>

        {activeAttack !== 'none' && (
          <button
            onClick={onClearAttack}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 transition-colors shadow-[0_0_10px_rgba(16,185,129,0.2)] ml-auto"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Neutralize & Clear Injected Attack</span>
          </button>
        )}
      </div>

      {/* Adversarial Attack Injection Control Grid */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Adversarial Threat Injections:</span>
          <div className="flex items-center gap-2">
            <span>Burst Intensity: {intensity}/10</span>
            <input
              type="range"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Speed Spoofing */}
          <button
            onClick={() => onInject('speed_spoofing', intensity)}
            className={`p-3 rounded border text-left flex flex-col justify-between transition-all ${
              activeAttack === 'speed_spoofing'
                ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                : 'bg-[#091020] border-slate-800 hover:border-amber-500/40 hover:bg-amber-950/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-amber-300">
                Speed Spoofing
              </span>
              <Gauge className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Injects corrupted velocity frames on CAN ID 0x100 without powertrain RPM correlation.
            </p>
            <div className="mt-3 text-[10px] font-mono text-amber-400/80 flex items-center justify-between">
              <span>ECU: WSS Sensor</span>
              <span className="uppercase font-semibold">Inject &rarr;</span>
            </div>
          </button>

          {/* 2. Invalid Brake */}
          <button
            onClick={() => onInject('invalid_brake', intensity)}
            className={`p-3 rounded border text-left flex flex-col justify-between transition-all ${
              activeAttack === 'invalid_brake'
                ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                : 'bg-[#091020] border-slate-800 hover:border-rose-500/40 hover:bg-rose-950/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-rose-400">
                Invalid Brake
              </span>
              <Disc className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Injects sudden 99% hydraulic pressure command on CAN ID 0x101 while throttle is open.
            </p>
            <div className="mt-3 text-[10px] font-mono text-rose-400/80 flex items-center justify-between">
              <span>ECU: EBCM Module</span>
              <span className="uppercase font-semibold">Inject &rarr;</span>
            </div>
          </button>

          {/* 3. Fuzzy Attack */}
          <button
            onClick={() => onInject('fuzzy_attack', intensity)}
            className={`p-3 rounded border text-left flex flex-col justify-between transition-all ${
              activeAttack === 'fuzzy_attack'
                ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                : 'bg-[#091020] border-slate-800 hover:border-purple-500/40 hover:bg-purple-950/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-purple-400">
                Fuzzy Attack
              </span>
              <Sliders className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Floods bus with random IDs (0x001–0x7FF) and maximum entropy randomized payloads.
            </p>
            <div className="mt-3 text-[10px] font-mono text-purple-400/80 flex items-center justify-between">
              <span>Vector: OBD-II Fuzzing</span>
              <span className="uppercase font-semibold">Inject &rarr;</span>
            </div>
          </button>

          {/* 4. CAN DoS */}
          <button
            onClick={() => onInject('can_dos', intensity)}
            className={`p-3 rounded border text-left flex flex-col justify-between transition-all ${
              activeAttack === 'can_dos'
                ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                : 'bg-[#091020] border-slate-800 hover:border-red-600/40 hover:bg-red-950/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-red-500">
                CAN DoS (Dominant Flood)
              </span>
              <Zap className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Continuous dominant zero-ID (0x0000) frame flood to starve all legitimate ECUs.
            </p>
            <div className="mt-3 text-[10px] font-mono text-red-400/80 flex items-center justify-between">
              <span>Arbitration Starvation</span>
              <span className="uppercase font-semibold">Inject &rarr;</span>
            </div>
          </button>
        </div>
      </div>

      {/* Manual Hex Frame Injection */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="text-xs font-mono text-slate-400 mb-2 flex items-center justify-between">
          <span>Custom Hex Frame Injector (Simulate Hardware CAN Shield / OBD-II dongle):</span>
          <span className="text-[11px] text-cyan-400">POST /api/ids/ingest</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={manualCanId}
            onChange={(e) => setManualCanId(e.target.value)}
            placeholder="CAN ID (e.g. 0x100)"
            className="w-28 px-3 py-1.5 bg-[#060a14] border border-slate-800 rounded font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            value={manualPayload}
            onChange={(e) => setManualPayload(e.target.value)}
            placeholder="8-byte hex payload (e.g. 00 12 FF AA 33 00 00 11)"
            className="flex-1 min-w-[220px] px-3 py-1.5 bg-[#060a14] border border-slate-800 rounded font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleSendManual}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded font-mono text-xs transition-colors whitespace-nowrap shrink-0"
          >
            {manualSent ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Send className="w-3.5 h-3.5" />}
            <span>{manualSent ? 'Injected!' : 'Inject Frame'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
