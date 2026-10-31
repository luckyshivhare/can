import React from 'react';
import { Gauge, Disc, Shield, AlertTriangle, Compass, Navigation } from 'lucide-react';
import { VehicleTelemetry } from '../types/can';

interface VehicleTelemetryHudProps {
  telemetry: VehicleTelemetry;
}

export const VehicleTelemetryHud: React.FC<VehicleTelemetryHudProps> = ({ telemetry }) => {
  const {
    speedKmh,
    rpm,
    brakePressurePercent,
    obstacleDistanceMeters,
    steerAngleDegrees,
    autonomousMode,
    spoofDetected,
    brakeOverrideDetected,
    gear,
    batteryPercent
  } = telemetry;

  // Calculate speed needle rotation (0 to 220 km/h mapped to -120deg to +120deg)
  const speedNormalized = Math.min(220, Math.max(0, speedKmh));
  const speedAngle = -120 + (speedNormalized / 220) * 240;

  // Calculate RPM needle rotation (0 to 8000 RPM mapped to -120deg to +120deg)
  const rpmNormalized = Math.min(8000, Math.max(0, rpm));
  const rpmAngle = -120 + (rpmNormalized / 8000) * 240;

  // Radar obstacle proximity color
  const isObstacleClose = obstacleDistanceMeters < 30;
  const isObstacleCritical = obstacleDistanceMeters < 15;

  return (
    <div className="cyber-panel p-5 rounded-lg border border-slate-800 space-y-5">
      {/* HUD Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
            Autonomous Vehicle Telemetry & Drive HUD
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/40 text-cyan-300 font-mono">
            CAN Bus Decoded State
          </span>
        </div>

        {/* Autonomous Mode State */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">DRIVE MODE:</span>
          <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold tracking-wider uppercase border ${
            autonomousMode === 'AUTOPILOT_L3'
              ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              : autonomousMode === 'EMERGENCY_BRAKE'
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
              : autonomousMode === 'SAFE_STOP'
              ? 'bg-amber-950/80 border-amber-500 text-amber-300'
              : 'bg-slate-900 border-slate-700 text-slate-300'
          }`}>
            {autonomousMode.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Main Cockpit Instruments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. SPEEDOMETER */}
        <div className={`p-4 rounded-lg border flex flex-col items-center justify-between relative overflow-hidden transition-all ${
          spoofDetected
            ? 'bg-rose-950/30 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
            : 'bg-[#091020]/80 border-slate-800'
        }`}>
          <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>VEHICLE SPEED</span>
            </span>
            <span className="text-[10px] text-slate-500">ECU 0x100</span>
          </div>

          {/* Speed Dial SVG */}
          <div className="relative w-36 h-36 flex items-center justify-center my-1">
            <svg className="w-full h-full" viewBox="0 0 120 120">
              {/* Outer dial track */}
              <circle
                cx="60"
                cy="60"
                r="46"
                stroke="#1e293b"
                strokeWidth="6"
                fill="none"
                strokeDasharray="210 360"
                strokeDashoffset="-75"
                strokeLinecap="round"
              />
              {/* Speed arc */}
              <circle
                cx="60"
                cy="60"
                r="46"
                stroke={spoofDetected ? '#ef4444' : '#06b6d4'}
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${(speedNormalized / 220) * 210} 360`}
                strokeDashoffset="-75"
                strokeLinecap="round"
                className="transition-all duration-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
              />
              {/* Needle */}
              <g transform={`rotate(${speedAngle} 60 60)`}>
                <line
                  x1="60"
                  y1="60"
                  x2="60"
                  y2="20"
                  stroke={spoofDetected ? '#ef4444' : '#38bdf8'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="60" cy="60" r="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              </g>
            </svg>

            {/* Speed Readout Centered */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4 font-mono">
              <span className={`text-2xl font-black tabular-nums tracking-tighter ${
                spoofDetected ? 'text-rose-400 animate-pulse' : 'text-white'
              }`}>
                {speedKmh.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400">km/h</span>
            </div>
          </div>

          {/* Spoof warning banner */}
          <div className="w-full text-center text-xs font-mono pt-2 border-t border-slate-800/80">
            {spoofDetected ? (
              <span className="text-rose-400 font-bold inline-flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3" /> SPEED SPOOF ALERT
              </span>
            ) : (
              <span className="text-slate-400">Target: 70.0 km/h · Gear: {gear}</span>
            )}
          </div>
        </div>

        {/* 2. ENGINE RPM */}
        <div className="p-4 rounded-lg bg-[#091020]/80 border border-slate-800 flex flex-col items-center justify-between relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>ENGINE RPM</span>
            </span>
            <span className="text-[10px] text-slate-500">ECU 0x103</span>
          </div>

          {/* RPM Dial SVG */}
          <div className="relative w-36 h-36 flex items-center justify-center my-1">
            <svg className="w-full h-full" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="46"
                stroke="#1e293b"
                strokeWidth="6"
                fill="none"
                strokeDasharray="210 360"
                strokeDashoffset="-75"
                strokeLinecap="round"
              />
              <circle
                cx="60"
                cy="60"
                r="46"
                stroke="#3b82f6"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${(rpmNormalized / 8000) * 210} 360`}
                strokeDashoffset="-75"
                strokeLinecap="round"
                className="transition-all duration-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]"
              />
              <g transform={`rotate(${rpmAngle} 60 60)`}>
                <line
                  x1="60"
                  y1="60"
                  x2="60"
                  y2="20"
                  stroke="#60a5fa"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="60" cy="60" r="4" fill="#0f172a" stroke="#60a5fa" strokeWidth="2" />
              </g>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4 font-mono">
              <span className="text-2xl font-black text-white tabular-nums tracking-tighter">
                {Math.round(rpm)}
              </span>
              <span className="text-[10px] text-slate-400">RPM (x1000)</span>
            </div>
          </div>

          <div className="w-full text-center text-xs font-mono pt-2 border-t border-slate-800/80 text-slate-400">
            Throttle State: Nominal
          </div>
        </div>

        {/* 3. BRAKE PRESSURE & OVERRIDE */}
        <div className={`p-4 rounded-lg border flex flex-col justify-between relative overflow-hidden transition-all ${
          brakeOverrideDetected || brakePressurePercent > 50
            ? 'bg-rose-950/30 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
            : 'bg-[#091020]/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-rose-400" />
              <span>BRAKE STATE</span>
            </span>
            <span className="text-[10px] text-slate-500">ECU 0x101</span>
          </div>

          <div className="flex flex-col items-center justify-center my-auto py-2">
            <div className="text-3xl font-black font-mono text-white tabular-nums tracking-tight">
              {brakePressurePercent}%
            </div>
            <span className="text-xs font-mono text-slate-400 mt-0.5">
              Hydraulic Actuation
            </span>

            {/* Vertical/Horizontal Brake Bar */}
            <div className="w-full h-3 rounded bg-slate-900 border border-slate-800 mt-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded ${
                  brakePressurePercent > 50
                    ? 'bg-rose-500 shadow-[0_0_10px_#ef4444]'
                    : brakePressurePercent > 20
                    ? 'bg-amber-400'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.max(2, brakePressurePercent)}%` }}
              />
            </div>
          </div>

          <div className="w-full text-center text-xs font-mono pt-2 border-t border-slate-800/80">
            {brakeOverrideDetected ? (
              <span className="text-rose-400 font-bold inline-flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3" /> ILLEGAL BRAKE INJECTION
              </span>
            ) : (
              <span className="text-emerald-400">ABS Normal · No Force Clamp</span>
            )}
          </div>
        </div>

        {/* 4. OBSTACLE DISTANCE & RADAR RING */}
        <div className="p-4 rounded-lg bg-[#091020]/80 border border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>OBSTACLE RADAR</span>
            </span>
            <span className="text-[10px] text-slate-500">ECU 0x102</span>
          </div>

          {/* Concentric Radar Circles */}
          <div className="relative w-full h-28 flex items-center justify-center my-1">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Outer ring */}
              <div className="w-24 h-24 rounded-full border border-cyan-500/20" />
              {/* Mid ring */}
              <div className="w-16 h-16 rounded-full border border-cyan-500/30" />
              {/* Inner ring */}
              <div className={`w-8 h-8 rounded-full border ${isObstacleCritical ? 'border-rose-500 bg-rose-500/20 animate-ping' : 'border-cyan-500/40'}`} />
              {/* Radar sweep line */}
              <div className="absolute w-24 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-spin origin-center opacity-40" />
            </div>

            {/* Distance center readout */}
            <div className="z-10 flex flex-col items-center justify-center font-mono bg-[#091020]/90 px-3 py-1 rounded border border-slate-800">
              <span className={`text-xl font-extrabold tabular-nums ${
                isObstacleCritical
                  ? 'text-rose-400 animate-pulse'
                  : isObstacleClose
                  ? 'text-amber-400'
                  : 'text-cyan-300'
              }`}>
                {obstacleDistanceMeters.toFixed(1)} m
              </span>
              <span className="text-[10px] text-slate-400">LiDAR Horizon</span>
            </div>
          </div>

          <div className="w-full text-center text-xs font-mono pt-2 border-t border-slate-800/80 text-slate-400">
            Collision Safety Margin: Nominal
          </div>
        </div>
      </div>

      {/* Auxiliary Telemetry Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#060a14] p-3 rounded border border-slate-800/60 font-mono text-xs">
        <div className="flex items-center justify-between px-2">
          <span className="text-slate-500">Steering Angle:</span>
          <span className="text-slate-200 tabular-nums">{steerAngleDegrees > 0 ? `+${steerAngleDegrees}°` : `${steerAngleDegrees}°`}</span>
        </div>
        <div className="flex items-center justify-between px-2">
          <span className="text-slate-500">HV Battery SoC:</span>
          <span className="text-emerald-400 tabular-nums">{batteryPercent}%</span>
        </div>
        <div className="flex items-center justify-between px-2">
          <span className="text-slate-500">CAN Protocol:</span>
          <span className="text-cyan-300">ISO 11898 2.0B</span>
        </div>
        <div className="flex items-center justify-between px-2">
          <span className="text-slate-500">Bus Errors:</span>
          <span className="text-slate-300 tabular-nums">{brakeOverrideDetected || spoofDetected ? 'Passive Flag' : '0 TEC/REC'}</span>
        </div>
      </div>
    </div>
  );
};
