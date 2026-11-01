
import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Download,
  Play,
  CheckCircle2,
  AlertCircle,
  Code
} from 'lucide-react';
import { IDSModelStatus } from '../types/can';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const apiUrl = (path: string) => API_BASE_URL + path;

interface PythonIntegrationViewProps {
  modelStatus: IDSModelStatus;
  onToggleMockPython: (connect: boolean) => void;
}

export const PythonIntegrationView: React.FC<PythonIntegrationViewProps> = ({
  modelStatus,
  onToggleMockPython
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [testSent, setTestSent] = useState<boolean>(false);

  const samplePythonCode = `"""
CAV-SHIELD Autonomous Vehicle IDS — Python Integration Client
Connects your trained Random Forest model to the CAV-SHIELD dashboard.
"""

import time
import requests

DASHBOARD_URL = "https://can-shield-api.onrender.com"
HEARTBEAT_ENDPOINT = f"{DASHBOARD_URL}/api/ids/heartbeat"
PREDICT_ENDPOINT = f"{DASHBOARD_URL}/api/ids/predict-external"
INGEST_ENDPOINT = f"{DASHBOARD_URL}/api/ids/ingest"

class CAVShieldBridge:
    def __init__(self, model_name="RandomForestClassifier_CAN_v2"):
        self.model_name = model_name
        self.accuracy = 98.85
        self.precision = 98.10
        self.recall = 99.40
        self.f1_score = 98.74

    def register_model(self):
        payload = {
            "modelName": self.model_name,
            "accuracy": self.accuracy,
            "precision": self.precision,
            "recall": self.recall,
            "f1Score": self.f1_score,
            "nEstimators": 100,
            "inferenceLatencyMs": 3.8
        }
        res = requests.post(HEARTBEAT_ENDPOINT, json=payload, timeout=10)
        if res.status_code == 200:
            print("[+] Python model registered with CAV-SHIELD!")

    def push_prediction(self, can_id, payload_hex, is_attack,
                        attack_type="fuzzy_attack", confidence=0.98, details=""):
        body = {
            "canId": can_id,
            "payload": payload_hex,
            "isAttack": is_attack,
            "attackType": attack_type,
            "confidence": confidence,
            "details": details or f"Detected by {self.model_name}",
            "modelName": self.model_name
        }
        requests.post(PREDICT_ENDPOINT, json=body, timeout=10)

if __name__ == "__main__":
    bridge = CAVShieldBridge()
    bridge.register_model()
    print("[*] Sending periodic heartbeats every 10 seconds. Press Ctrl+C to exit.")

    while True:
        bridge.register_model()
        time.sleep(10)
`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(samplePythonCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Clipboard error:', error);
    }
  };

  const downloadScript = () => {
    const blob = new Blob([samplePythonCode], {
      type: 'text/plain;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cav_shield_client.py';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const sendTestInference = async () => {
    try {
      const response = await fetch(apiUrl('/api/ids/predict-external'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canId: '0x100',
          payload: 'FF FF 00 00 12 45 88 99',
          isAttack: true,
          attackType: 'speed_spoofing',
          confidence: 0.992,
          details: 'Test inference pushed from Python API integration workbench',
          modelName: 'Python_RandomForest_v2'
        })
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (error) {
      console.error('Test inference failed:', error);
      setTestSent(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="cyber-panel p-6 rounded-lg border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                External Python IDS Integration Layer
              </h2>
              <p className="text-xs text-slate-400">
                Integration for scikit-learn Random Forest, PyTorch, and XGBoost models
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {modelStatus.isConnected ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-mono text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>CONNECTED: {modelStatus.modelName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>STANDBY: SIMULATED BASELINE ACTIVE</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#060a14] p-4 rounded border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
          <p className="leading-relaxed">
            <span className="text-cyan-400 font-bold">INDEPENDENT DETECTION ARCHITECTURE:</span>{' '}
            The dashboard is decoupled from the detection engine and supports synthetic CAN traffic
            and external Python predictions.
          </p>
          <p className="leading-relaxed text-slate-400">
            The Python client registers its model through{' '}
            <code className="text-cyan-300">/api/ids/heartbeat</code> and sends predictions to the backend.
          </p>
        </div>
      </div>

      <div className="cyber-panel p-6 rounded-lg border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>REST API Endpoints Specification</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-[#070d1a]">
                <th className="py-2.5 px-3 uppercase">Method</th>
                <th className="py-2.5 px-3 uppercase">Endpoint</th>
                <th className="py-2.5 px-3 uppercase">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-2.5 px-3 text-cyan-400 font-bold">POST</td>
                <td className="py-2.5 px-3 text-white">/api/ids/heartbeat</td>
                <td className="py-2.5 px-3 text-slate-300">Registers Python model</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-rose-400 font-bold">POST</td>
                <td className="py-2.5 px-3 text-white">/api/ids/predict-external</td>
                <td className="py-2.5 px-3 text-slate-300">Sends intrusion predictions</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-emerald-400 font-bold">POST</td>
                <td className="py-2.5 px-3 text-white">/api/ids/ingest</td>
                <td className="py-2.5 px-3 text-slate-300">Ingests CAN frames</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-blue-400 font-bold">GET</td>
                <td className="py-2.5 px-3 text-white">/api/ids/stream</td>
                <td className="py-2.5 px-3 text-slate-300">Live event stream</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-purple-400 font-bold">GET</td>
                <td className="py-2.5 px-3 text-white">/api/ids/status</td>
                <td className="py-2.5 px-3 text-slate-300">Dashboard status</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="cyber-panel p-6 rounded-lg border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
              Ready-to-Use Python Client Script
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Copy or download the Python integration script.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-mono text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Python Code'}</span>
            </button>

            <button
              onClick={downloadScript}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-mono text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Script</span>
            </button>
          </div>
        </div>

        <div className="relative rounded-lg bg-[#040711] border border-slate-800 p-4 overflow-x-auto max-h-[380px]">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            <code>{samplePythonCode}</code>
          </pre>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <button
              onClick={sendTestInference}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/70 border border-rose-500/50 hover:bg-rose-900/60 text-rose-300 rounded font-mono text-xs"
            >
              <Play className="w-3 h-3" />
              <span>{testSent ? 'Inference Dispatched!' : 'Dispatch Test Python Inference'}</span>
            </button>
            <span className="text-[11px] font-mono text-slate-500">
              Sends a test prediction to the backend.
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span>Model State Toggle:</span>
            {modelStatus.isConnected ? (
              <button
                onClick={() => onToggleMockPython(false)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600"
              >
                Disconnect Model
              </button>
            ) : (
              <button
                onClick={() => onToggleMockPython(true)}
                className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-500/50 hover:bg-emerald-900/60 text-emerald-300"
              >
                Connect Python Model Mock
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
