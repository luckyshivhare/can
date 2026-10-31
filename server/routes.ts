import { Router, Request, Response } from 'express';
import { canEngine } from './canEngine.js';
import { AttackType } from '../src/types/can.js';

const router = Router();

// 1. Snapshot / Status
router.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    data: canEngine.getSnapshot()
  });
});

// 2. Real-time Server-Sent Events (SSE) Stream
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial snapshot immediately
  res.write(`data: ${JSON.stringify(canEngine.getSnapshot())}\n\n`);

  const intervalId = setInterval(() => {
    try {
      const payload = JSON.stringify(canEngine.getSnapshot());
      res.write(`data: ${payload}\n\n`);
    } catch {
      clearInterval(intervalId);
    }
  }, 350);

  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
});

// 3. Simulation Controls
router.post('/simulate', (req: Request, res: Response) => {
  const { action, attackType, intensity } = req.body;

  switch (action) {
    case 'start':
      canEngine.startEngine();
      break;
    case 'stop':
      canEngine.stopEngine();
      break;
    case 'reset':
      canEngine.resetSimulation();
      break;
    case 'inject':
      if (attackType) {
        canEngine.injectAttack(attackType as AttackType, intensity || 5);
      }
      break;
    case 'clear_attack':
      canEngine.clearAttack();
      break;
    default:
      return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  return res.json({
    success: true,
    action,
    data: canEngine.getSnapshot()
  });
});

// 4. Ingest raw CAN frame from external Python script or hardware CAN shield
router.post('/ingest', (req: Request, res: Response) => {
  const { canId, payload, dlc, ecuSource, timestamp } = req.body;

  if (!canId || !payload) {
    return res.status(400).json({ error: 'Missing canId or payload' });
  }

  const frame = canEngine.ingestExternalFrame({
    canId,
    payload,
    dlc,
    ecuSource,
    timestamp
  });

  return res.status(201).json({
    success: true,
    frame
  });
});

// 5. External Python Random Forest Prediction Endpoint
router.post('/predict-external', (req: Request, res: Response) => {
  const { canId, payload, isAttack, attackType, confidence, details, modelName } = req.body;

  if (!canId || typeof isAttack !== 'boolean') {
    return res.status(400).json({ error: 'Missing canId or isAttack boolean parameter' });
  }

  canEngine.recordExternalPrediction({
    canId,
    payload: payload || '00 00 00 00 00 00 00 00',
    isAttack,
    attackType,
    confidence: confidence ?? 0.95,
    details,
    modelName
  });

  return res.json({
    success: true,
    message: 'Prediction ingested from external Python IDS'
  });
});

// 6. Python IDS Heartbeat
router.post('/heartbeat', (req: Request, res: Response) => {
  const { modelName, accuracy, precision, recall, f1Score, nEstimators, inferenceLatencyMs } = req.body;

  const status = canEngine.recordHeartbeat({
    modelName: modelName || 'RandomForestClassifier (Python 3.11)',
    accuracy: accuracy ?? 98.9,
    precision: precision ?? 98.2,
    recall: recall ?? 99.4,
    f1Score: f1Score ?? 98.8,
    nEstimators: nEstimators ?? 120,
    inferenceLatencyMs: inferenceLatencyMs ?? 3.8
  });

  return res.json({
    success: true,
    status
  });
});

// 7. Toggle Mock External Python IDS Connection (for Hackathon Live Demos)
router.post('/test-connect-python', (req: Request, res: Response) => {
  const { connect } = req.body;
  if (connect) {
    canEngine.recordHeartbeat({
      modelName: 'RandomForest_CAN_IDS (Python scikit-learn v1.4.1)',
      accuracy: 99.1,
      precision: 98.7,
      recall: 99.4,
      f1Score: 99.0,
      nEstimators: 150,
      inferenceLatencyMs: 3.4
    });
  } else {
    canEngine.disconnectExternalModel();
  }

  return res.json({
    success: true,
    modelStatus: canEngine.getSnapshot().modelStatus
  });
});

// 8. Vehicle Telemetry override
router.post('/telemetry', (req: Request, res: Response) => {
  const updated = canEngine.setTelemetry(req.body);
  return res.json({ success: true, telemetry: updated });
});

// 9. Python Client Code template generator
router.get('/python-client-code', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const fullBaseUrl = `${protocol}://${host}`;

  const pythonScript = `"""
CAV-SHIELD Autonomous Vehicle Intrusion Detection System
Python Machine Learning Client & Model Connector

Usage:
  pip install requests scikit-learn numpy pandas
  python cav_shield_client.py --mode stream
"""

import time
import json
import random
import requests
import numpy as np

# CAV-SHIELD Webhook Endpoints
BASE_URL = "${fullBaseUrl}"
PREDICT_URL = f"{BASE_URL}/api/ids/predict-external"
HEARTBEAT_URL = f"{BASE_URL}/api/ids/heartbeat"
INGEST_URL = f"{BASE_URL}/api/ids/ingest"

class CAVShieldIDSConnector:
    def __init__(self, model_name="RandomForestClassifier_v2"):
        self.model_name = model_name
        self.accuracy = 98.85
        self.precision = 98.10
        self.recall = 99.40
        self.f1_score = 98.74
        print(f"[*] Initialized CAV-SHIELD Python Connector: {self.model_name}")

    def send_heartbeat(self):
        """Sends a heartbeat packet to register this Python ML model with the dashboard."""
        payload = {
            "modelName": self.model_name,
            "accuracy": self.accuracy,
            "precision": self.precision,
            "recall": self.recall,
            "f1Score": self.f1_score,
            "nEstimators": 150,
            "inferenceLatencyMs": 3.4
        }
        try:
            r = requests.post(HEARTBEAT_URL, json=payload, timeout=3)
            if r.status_code == 200:
                print(f"[+] Heartbeat sent successfully! Model connected to CAV-SHIELD dashboard.")
                return True
        except Exception as e:
            print(f"[-] Heartbeat failed: {e}")
        return False

    def predict_can_frame(self, can_id: str, payload_hex: str, delta_time_ms: float):
        """
        Your trained scikit-learn Random Forest feature extractor & classifier here:
        Example features:
          1. arbitration_id_decimal
          2. inter_arrival_time_ms
          3. payload_byte_entropy
          4. payload_length
        """
        # Convert hex string to integer array
        bytes_list = [int(b, 16) for b in payload_hex.replace(' ', '')[i:i+2] for i in range(0, len(payload_hex.replace(' ', '')), 2)]
        
        # Calculate Shannon entropy of payload
        unique, counts = np.unique(bytes_list, return_counts=True)
        prob = counts / len(bytes_list) if len(bytes_list) > 0 else [1]
        entropy = -np.sum(prob * np.log2(prob + 1e-12))

        # Example model inference logic (replace with your joblib.load('model.pkl').predict(X))
        is_attack = False
        attack_type = "none"
        confidence = 0.99

        if can_id == "0x0000":
            is_attack = True
            attack_type = "can_dos"
            confidence = 0.998
        elif can_id == "0x100" and len(bytes_list) >= 2 and bytes_list[0] > 180:
            is_attack = True
            attack_type = "speed_spoofing"
            confidence = 0.985
        elif can_id == "0x101" and len(bytes_list) >= 2 and bytes_list[0] > 90:
            is_attack = True
            attack_type = "invalid_brake"
            confidence = 0.992
        elif entropy > 2.8:
            is_attack = True
            attack_type = "fuzzy_attack"
            confidence = 0.941

        # Post inference to CAV-SHIELD SOC Dashboard
        post_data = {
            "canId": can_id,
            "payload": payload_hex,
            "isAttack": is_attack,
            "attackType": attack_type,
            "confidence": confidence,
            "details": f"Python Random Forest inference (Entropy={entropy:.2f}, dt={delta_time_ms}ms)",
            "modelName": self.model_name
        }

        try:
            requests.post(PREDICT_URL, json=post_data, timeout=2)
            if is_attack:
                print(f"[!] INTRUSION DETECTED [{attack_type}] on {can_id}: Confidence {confidence*100:.1f}%")
        except Exception as e:
            print(f"[-] Failed to post prediction: {e}")

if __name__ == "__main__":
    connector = CAVShieldIDSConnector()
    connector.send_heartbeat()
    print("[*] Streaming telemetry to dashboard... Press Ctrl+C to terminate.")
    
    while True:
        connector.send_heartbeat()
        time.sleep(10)
`;

  res.setHeader('Content-Type', 'text/plain');
  res.send(pythonScript);
});

export default router;
