export type AttackType =
  | 'none'
  | 'speed_spoofing'
  | 'invalid_brake'
  | 'fuzzy_attack'
  | 'can_dos';

export interface CanFrame {
  id: string;
  canId: string; // e.g. '0x100'
  canIdDecimal: number;
  dlc: number; // 0-8
  payload: string; // e.g. '00 45 A2 00 12 00 00 00'
  rawBytes: number[];
  timestamp: number;
  ecuSource: string; // e.g. 'ECM', 'TCM', 'BCM', 'ADAS_RADAR'
  isAttack: boolean;
  attackType?: AttackType;
  isSimulated: boolean;
  anomalyScore?: number;
}

export interface SecurityAlert {
  id: string;
  timestamp: number;
  canId: string;
  payload: string;
  attackType: AttackType | string;
  attackName: string;
  confidence: number; // e.g. 98.4
  detectionMethod: 'Simulated Heuristic' | 'Random Forest (Baseline Sim)' | 'External Python IDS';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  mitigationAction: string;
  isSimulated: boolean;
  status: 'ACTIVE' | 'MITIGATED' | 'ANALYZING';
}

export interface VehicleTelemetry {
  speedKmh: number;
  targetSpeedKmh: number;
  rpm: number;
  brakePressurePercent: number;
  obstacleDistanceMeters: number;
  steerAngleDegrees: number;
  gear: 'P' | 'R' | 'N' | 'D';
  batteryPercent: number;
  autonomousMode: 'AUTOPILOT_L3' | 'MANUAL_OVERRIDE' | 'EMERGENCY_BRAKE' | 'SAFE_STOP';
  spoofDetected: boolean;
  brakeOverrideDetected: boolean;
  busStatus: 'NOMINAL' | 'HIGH_LOAD' | 'BUS_OFF_WARNING' | 'CORRUPTED';
}

export interface IDSModelStatus {
  isConnected: boolean; // TRUE only if real Python IDS sent heartbeat recently!
  modelName: string; // e.g. 'RandomForestClassifier (v1.2.0)'
  modelSource: 'SIMULATED_BASELINE' | 'EXTERNAL_PYTHON_BACKEND';
  endpoint: string;
  lastHeartbeat: number | null;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  nEstimators: number;
  inferenceLatencyMs: number;
  trainedFeatures: string[];
}

export interface SimulationState {
  isRunning: boolean;
  activeAttack: AttackType;
  frameRateHz: number;
  attackIntensity: number; // 1 to 10
  totalFrames: number;
  normalFrames: number;
  attackFrames: number;
  detectionRate: number;
}

export interface TrafficHistoryPoint {
  timeStr: string;
  timestamp: number;
  normalRate: number;
  attackRate: number;
  totalRate: number;
}
