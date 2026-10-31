import React from 'react';
import { Cpu, CheckCircle2, AlertCircle, Link2, ExternalLink, Terminal, ShieldCheck } from 'lucide-react';
import { IDSModelStatus } from '../types/can';

interface IdsModelStatusCardProps {
  modelStatus: IDSModelStatus;
  onToggleMockPython: (connect: boolean) => void;
  onOpenPythonDocs: () => void;
}

export const IdsModelStatusCard: React.FC<IdsModelStatusCardProps> = ({
  modelStatus,
  onToggleMockPython,
  onOpenPythonDocs
}) => {
  const {
    isConnected,
    modelName,
    modelSource,
    endpoint,
    accuracy,
    precision,
    recall,
    f1Score,
    nEstimators,
    inferenceLatencyMs,
    trainedFeatures
  } = modelStatus;

  return (
    <div className="cyber-panel p-5 rounded-lg border border-slate-800 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
            Intrusion Detection System & Random Forest Model
          </h3>
        </div>

        {/* Live State Badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              PYTHON BACKEND CONNECTED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              STANDBY: SIMULATED BASELINE MODEL ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Connection Honest Transparency Banner */}
      {!isConnected ? (
        <div className="bg-slate-900/90 border border-amber-500/30 p-3.5 rounded-md text-xs font-mono text-slate-300 space-y-1">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>EXTERNAL PYTHON RANDOM FOREST: NOT CONNECTED</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            The dashboard is currently running on the internal high-speed simulated CAN heuristic engine.
            To feed live predictions from your scikit-learn Python model, stream predictions to{' '}
            <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">{endpoint}</code>.
          </p>
        </div>
      ) : (
        <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-md text-xs font-mono text-slate-300 space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>EXTERNAL PYTHON MODEL VERIFIED & STREAMING</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Active Model: <span className="text-white font-bold">{modelName}</span> · Heartbeat synchronized. Real-time classification active.
          </p>
        </div>
      )}

      {/* Model Performance Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#070d1a] p-3 rounded border border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase block">Model Accuracy</span>
          <span className="text-xl font-bold font-mono text-cyan-300 tabular-nums">
            {accuracy.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">Stratified 5-Fold</span>
        </div>

        <div className="bg-[#070d1a] p-3 rounded border border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase block">Precision</span>
          <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
            {precision.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">Low False-Positive</span>
        </div>

        <div className="bg-[#070d1a] p-3 rounded border border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase block">Recall / Sensitivity</span>
          <span className="text-xl font-bold font-mono text-blue-400 tabular-nums">
            {recall.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">Adversarial Catch</span>
        </div>

        <div className="bg-[#070d1a] p-3 rounded border border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase block">Inference Latency</span>
          <span className="text-xl font-bold font-mono text-purple-400 tabular-nums">
            {inferenceLatencyMs} ms
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">{nEstimators} Decision Trees</span>
        </div>
      </div>

      {/* Trained Feature Vectors */}
      <div className="border border-slate-800/80 rounded bg-[#060a14] p-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span>Random Forest Feature Vector Pipeline (CAN Arbitration & Payload Features):</span>
          <span className="text-cyan-400">{trainedFeatures.length} Extracted Features</span>
        </div>
        <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
          {trainedFeatures.map((f, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Integration Quick Controls & Demo Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPythonDocs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>View Python Integration Layer & Sample Script</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </button>
        </div>

        {/* Hackathon Evaluator Toggle */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Hackathon Demo Helper:</span>
          {isConnected ? (
            <button
              onClick={() => onToggleMockPython(false)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors"
            >
              Disconnect Python Mock
            </button>
          ) : (
            <button
              onClick={() => onToggleMockPython(true)}
              className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-500/50 hover:bg-emerald-900/60 text-emerald-300 transition-colors"
            >
              Simulate Python Client Heartbeat
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
