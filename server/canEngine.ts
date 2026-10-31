import {
  AttackType,
  CanFrame,
  SecurityAlert,
  VehicleTelemetry,
  IDSModelStatus,
  SimulationState,
  TrafficHistoryPoint
} from '../src/types/can.js';

interface EcuDefinition {
  canId: string;
  canIdDecimal: number;
  name: string;
  description: string;
  periodMs: number;
}
const ECU_REGISTRY: Record<string, EcuDefinition> = {
  '0x0120': {
    canId: '0x0120',
    canIdDecimal: 288,
    name: 'SAS',
    description: 'Steering Angle Sensor',
    periodMs: 50
  },
  '0x100': {
    canId: '0x100',
    canIdDecimal: 256,
    name: 'VEHICLE_SPEED',
    description: 'Vehicle Speed',
    periodMs: 30
  },
  '0x101': {
    canId: '0x101',
    canIdDecimal: 257,
    name: 'BRAKE_STATUS',
    description: 'Brake Status',
    periodMs: 50
  },
  '0x102': {
    canId: '0x102',
    canIdDecimal: 258,
    name: 'OBSTACLE_DISTANCE',
    description: 'Obstacle Distance',
    periodMs: 60
  },
  '0x103': {
    canId: '0x103',
    canIdDecimal: 259,
    name: 'ENGINE_RPM',
    description: 'Engine RPM',
    periodMs: 40
  },
  '0x0540': {
    canId: '0x0540',
    canIdDecimal: 1344,
    name: 'BMS_POWER',
    description: 'Battery Management System',
    periodMs: 100
  },
};
function toHexByte(n: number): string {
  return Math.min(255, Math.max(0, Math.floor(n))).toString(16).padStart(2, '0').toUpperCase();
}

function randomHexByte(): string {
  return Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
}

export class CanEngine {
  private isRunning: boolean = true;
  private activeAttack: AttackType = 'none';
  private frameRateHz: number = 30; // 30 frames/sec baseline
  private attackIntensity: number = 5;

  private totalFrames: number = 0;
  private normalFrames: number = 0;
  private attackFrames: number = 0;
  private detectedAttacks: number = 0;

  private frameBuffer: CanFrame[] = [];
  private readonly MAX_FRAME_BUFFER = 200;

  private alerts: SecurityAlert[] = [];
  private readonly MAX_ALERTS = 150;

  private trafficHistory: TrafficHistoryPoint[] = [];
  private readonly MAX_HISTORY_POINTS = 30;

  private currentSecondNormal = 0;
  private currentSecondAttack = 0;

  private telemetry: VehicleTelemetry = {
    speedKmh: 68.4,
    targetSpeedKmh: 70.0,
    rpm: 2350,
    brakePressurePercent: 0,
    obstacleDistanceMeters: 54.2,
    steerAngleDegrees: -1.2,
    gear: 'D',
    batteryPercent: 84,
    autonomousMode: 'AUTOPILOT_L3',
    spoofDetected: false,
    brakeOverrideDetected: false,
    busStatus: 'NOMINAL'
  };

  private pythonModelStatus: IDSModelStatus = {
    isConnected: false, // Disconnected initially - strictly honest
    modelName: 'Awaiting Python Backend (RandomForest / GradientBoosting)',
    modelSource: 'SIMULATED_BASELINE',
    endpoint: '/api/ids/predict-external',
    lastHeartbeat: null,
    accuracy: 98.7,
    precision: 97.9,
    recall: 99.1,
    f1Score: 98.5,
    nEstimators: 100,
    inferenceLatencyMs: 4.2,
    trainedFeatures: [
      'can_id_delta_t',
      'payload_byte_entropy',
      'arbitration_id_int',
      'byte0_speed_derivative',
      'byte2_brake_conflict',
      'rolling_window_frequency_hz'
    ]
  };

  private attackDistribution: Record<string, number> = {
    speed_spoofing: 0,
    invalid_brake: 0,
    fuzzy_attack: 0,
    can_dos: 0
  };

  private intervalTimer: NodeJS.Timeout | null = null;
  private historyTimer: NodeJS.Timeout | null = null;
  private lastHeartbeatCheckTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.seedInitialHistory();
    this.startEngine();
  }

  private seedInitialHistory() {
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const t = now - i * 1000;
      const d = new Date(t);
      this.trafficHistory.push({
        timeStr: d.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
        timestamp: t,
        normalRate: Math.floor(25 + Math.random() * 8),
        attackRate: 0,
        totalRate: Math.floor(25 + Math.random() * 8)
      });
    }
  }

  public startEngine() {
    if (this.intervalTimer) return;
    this.isRunning = true;

    // Tick for CAN frame generation (every 1000 / frameRateHz)
    const tickIntervalMs = Math.max(20, Math.floor(1000 / this.frameRateHz));
    this.intervalTimer = setInterval(() => {
      this.step();
    }, tickIntervalMs);

    // Tick for 1-second rolling history aggregations
    this.historyTimer = setInterval(() => {
      this.aggregateHistory();
    }, 1000);

    // Heartbeat check for Python backend
    this.lastHeartbeatCheckTimer = setInterval(() => {
      if (this.pythonModelStatus.isConnected && this.pythonModelStatus.lastHeartbeat) {
        if (Date.now() - this.pythonModelStatus.lastHeartbeat > 20000) {
          // Timeout after 20s of no heartbeat from Python
          this.pythonModelStatus.isConnected = false;
          this.pythonModelStatus.modelSource = 'SIMULATED_BASELINE';
          this.pythonModelStatus.modelName = 'RandomForest (Disconnected - Simulation Fallback)';
        }
      }
    }, 5000);
  }

  public stopEngine() {
    this.isRunning = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  public resetSimulation() {
    this.totalFrames = 0;
    this.normalFrames = 0;
    this.attackFrames = 0;
    this.detectedAttacks = 0;
    this.activeAttack = 'none';
    this.frameBuffer = [];
    this.alerts = [];
    this.attackDistribution = {
      speed_spoofing: 0,
      invalid_brake: 0,
      fuzzy_attack: 0,
      can_dos: 0
    };
    this.telemetry = {
      speedKmh: 68.4,
      targetSpeedKmh: 70.0,
      rpm: 2350,
      brakePressurePercent: 0,
      obstacleDistanceMeters: 54.2,
      steerAngleDegrees: -1.2,
      gear: 'D',
      batteryPercent: 84,
      autonomousMode: 'AUTOPILOT_L3',
      spoofDetected: false,
      brakeOverrideDetected: false,
      busStatus: 'NOMINAL'
    };
    this.trafficHistory = [];
    this.seedInitialHistory();
  }

  public injectAttack(type: AttackType, intensity: number = 5) {
    this.activeAttack = type;
    this.attackIntensity = intensity;
    if (!this.isRunning) {
      this.startEngine();
    }
  }

  public clearAttack() {
    this.activeAttack = 'none';
    this.telemetry.spoofDetected = false;
    this.telemetry.brakeOverrideDetected = false;
    this.telemetry.busStatus = 'NOMINAL';
    if (this.telemetry.autonomousMode === 'EMERGENCY_BRAKE' || this.telemetry.autonomousMode === 'SAFE_STOP') {
      this.telemetry.autonomousMode = 'AUTOPILOT_L3';
    }
  }

  private step() {
    if (!this.isRunning) return;

    // 1. Generate normal frame or attack frame
    const shouldInjectAttack = this.activeAttack !== 'none';
    
    // In DoS mode, inject multiple burst frames
    const burstCount = this.activeAttack === 'can_dos' ? Math.min(8, this.attackIntensity * 2) : 1;

    for (let i = 0; i < burstCount; i++) {
      if (shouldInjectAttack) {
        // High probability of attack frame during active injection
        if (Math.random() < 0.75 + this.attackIntensity * 0.02) {
          this.generateAttackFrame(this.activeAttack);
        } else {
          this.generateNormalFrame();
        }
      } else {
        this.generateNormalFrame();
      }
    }

    // 2. Smoothly update telemetry based on nominal driving physics
    this.updateNominalTelemetry();
  }

  private updateNominalTelemetry() {
    if (this.activeAttack === 'none') {
      // Normal gentle vehicle drift around cruise target
      const deltaSpeed = (this.telemetry.targetSpeedKmh - this.telemetry.speedKmh) * 0.05 + (Math.random() - 0.5) * 0.4;
      this.telemetry.speedKmh = Math.max(0, Math.min(180, +(this.telemetry.speedKmh + deltaSpeed).toFixed(1)));
      this.telemetry.rpm = Math.floor(1800 + (this.telemetry.speedKmh / 120) * 2200 + (Math.random() - 0.5) * 60);
      this.telemetry.steerAngleDegrees = +((Math.sin(Date.now() / 4000) * 3.5) + (Math.random() - 0.5) * 0.4).toFixed(1);
      
      // Obstacle varies realistically
      const distNoise = (Math.random() - 0.5) * 0.8;
      this.telemetry.obstacleDistanceMeters = Math.max(15, Math.min(95, +(this.telemetry.obstacleDistanceMeters + distNoise).toFixed(1)));
      this.telemetry.brakePressurePercent = 0;
      this.telemetry.spoofDetected = false;
      this.telemetry.brakeOverrideDetected = false;
      this.telemetry.busStatus = 'NOMINAL';
    }
  }

  private generateNormalFrame() {
    this.totalFrames++;
    this.normalFrames++;
    this.currentSecondNormal++;

    const ecuKeys = Object.keys(ECU_REGISTRY);
    const chosenKey = ecuKeys[Math.floor(Math.random() * ecuKeys.length)];
    const ecu = ECU_REGISTRY[chosenKey];

let bytes: number[] = [];

switch (chosenKey) {
  case '0x100': { // Vehicle Speed
    const speed = Math.max(
      0,
      Math.min(255, Math.floor(this.telemetry.speedKmh))
    );
    bytes = [speed, 0, 0, 0];
    break;
  }

  case '0x101': { // Brake Status
    bytes = [0, 0, 0, 0]; // 0 = Released
    break;
  }

  case '0x102': { // Obstacle Distance (cm)
    const distanceCm = Math.max(
      0,
      Math.min(65535, Math.floor(this.telemetry.obstacleDistanceMeters * 100))
    );
    bytes = [
      (distanceCm >> 8) & 0xff,
      distanceCm & 0xff,
      0,
      0
    ];
    break;
  }

  case '0x103': { // Engine RPM
    const rpm = Math.max(
      0,
      Math.min(65535, Math.floor(this.telemetry.rpm))
    );
    bytes = [
      (rpm >> 8) & 0xff,
      rpm & 0xff,
      0,
      0
    ];
    break;
  }

  case '0x0120': { // Steering
    const steerInt = Math.floor(
      (this.telemetry.steerAngleDegrees + 90) * 10
    );
    bytes = [
      (steerInt >> 8) & 0xff,
      steerInt & 0xff,
      0,
      1,
      0x24,
      0x55,
      0x11,
      0x02
    ];
    break;
  }

  case '0x0540': { // Battery Management
    bytes = [
      this.telemetry.batteryPercent,
      0x64,
      0x0E,
      0x32,
      0x01,
      0x12,
      0x00,
      0x55
    ];
    break;
  }

  default:
    bytes = [0, 0, 0, 0];
}


    const payload = bytes.map(toHexByte).join(' ');
    const frame: CanFrame = {
      id: `frame_${this.totalFrames}_${Date.now()}`,
      canId: ecu.canId,
      canIdDecimal: ecu.canIdDecimal,
      dlc: 8,
      payload,
      rawBytes: bytes,
      timestamp: Date.now(),
      ecuSource: ecu.name,
      isAttack: false,
      isSimulated: true,
      anomalyScore: +(0.01 + Math.random() * 0.05).toFixed(3)
    };

    this.pushFrame(frame);
  }

  private generateAttackFrame(attackType: AttackType) {
    this.totalFrames++;
    this.attackFrames++;
    this.detectedAttacks++;
    this.currentSecondAttack++;
    this.attackDistribution[attackType] = (this.attackDistribution[attackType] || 0) + 1;

    let canId = '0x100';
    let canIdDec = 580;
    let ecuSource = 'COMPROMISED_ECU';
    let bytes: number[] = [];
    let alertDetails = '';
    let attackName = '';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'high';
    let mitigation = '';
    let anomalyScore = 0.94;

    switch (attackType) {
      case 'speed_spoofing': {
        attackName = 'Speed Sensor Spoofing';
        canId = '0x100';
        canIdDec = 580;
        ecuSource = 'SPOOFED_WSS';
        severity = 'critical';
        // Injected impossible erratic speed: 198 km/h or 0 km/h drop while engine RPM is nominal
        const spoofedSpeed = Math.random() > 0.5 ? 198.5 : 0.0;
        const speedVal = Math.floor(spoofedSpeed * 100);
        bytes = [(speedVal >> 8) & 0xff, speedVal & 0xff, 0xFF, 0xFE, 0xDE, 0xAD, 0xBE, 0xEF];
        alertDetails = `Illegal velocity delta: reported ${spoofedSpeed} km/h inconsistent with powertrain ECM (RPM: ${this.telemetry.rpm})`;
        mitigation = 'Isolate CAN ID 0x100, fallback to wheel speed estimator & GPS IMU odometry';
        anomalyScore = 0.982;

        this.telemetry.speedKmh = spoofedSpeed;
        this.telemetry.spoofDetected = true;
        this.telemetry.autonomousMode = 'MANUAL_OVERRIDE';
        break;
      }
      case 'invalid_brake': {
        attackName = 'Malicious Brake Actuation Injection';
        canId = '0x101';
        canIdDec = 800;
        ecuSource = 'INJECTED_EBCM';
        severity = 'critical';
        // Commanded 99% emergency brake override without driver/ADAS input
        bytes = [0x63, 0x63, 0x01, 0xFF, 0x88, 0x99, 0x00, 0xFA];
        alertDetails = `Hostile deceleration packet: 99% hydraulic brake clamping command detected while throttle open (speed: ${this.telemetry.speedKmh} km/h)`;
        mitigation = 'Reject command, assert EBCM authentication signature check, trigger safe pullover';
        anomalyScore = 0.995;

        this.telemetry.brakePressurePercent = 99;
        this.telemetry.brakeOverrideDetected = true;
        this.telemetry.autonomousMode = 'EMERGENCY_BRAKE';
        break;
      }
      case 'fuzzy_attack': {
        attackName = 'Fuzzy CAN ID / Payload Injection';
        // Random arbitary ID between 0x001 and 0x7FF
        const randId = Math.floor(1 + Math.random() * 0x7fe);
        canId = `0x${randId.toString(16).padStart(4, '0').toUpperCase()}`;
        canIdDec = randId;
        ecuSource = 'UNKNOWN_OBD_INJECTOR';
        severity = 'medium';
        bytes = [
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256)
        ];
        alertDetails = `High payload Shannon entropy (H > 7.82) with unmapped arbitration ID ${canId}`;
        mitigation = 'Enable hardware CAN firewall filter, drop unregistered DLC frames';
        anomalyScore = 0.895;
        this.telemetry.busStatus = 'HIGH_LOAD';
        break;
      }
      case 'can_dos': {
        attackName = 'CAN Bus DoS (Arbitration Starvation)';
        // 0x0000 has highest priority on CAN bus (dominant zeros always win arbitration)
        canId = '0x0000';
        canIdDec = 0;
        ecuSource = 'ROGUE_BUS_DOMINATOR';
        severity = 'critical';
        bytes = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        alertDetails = `Dominant zero-ID flood monopolizing CAN TX buffer. Bus utilization > 94% (starvation of safety-critical ECUs)`;
        mitigation = 'Engage bus tranceiver error passive state, throttle transmission queue';
        anomalyScore = 0.999;
        this.telemetry.busStatus = 'CORRUPTED';
        this.telemetry.autonomousMode = 'SAFE_STOP';
        break;
      }
      default:
        bytes = [0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0x00, 0x00, 0x00];
    }

    const payload = bytes.map(toHexByte).join(' ');

    const frame: CanFrame = {
      id: `attack_${this.totalFrames}_${Date.now()}`,
      canId,
      canIdDecimal: canIdDec,
      dlc: 8,
      payload,
      rawBytes: bytes,
      timestamp: Date.now(),
      ecuSource,
      isAttack: true,
      attackType,
      isSimulated: true,
      anomalyScore
    };

    this.pushFrame(frame);

    // Create a structured security alert
    // Note: If pythonModelStatus.isConnected is true, attribution is External Python IDS,
    // otherwise it is honestly marked as Simulated Heuristic or Random Forest Baseline.
    const detectionMethod = this.pythonModelStatus.isConnected
      ? 'External Python IDS'
      : 'Random Forest (Baseline Sim)';

    const alert: SecurityAlert = {
      id: `alt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      canId,
      payload,
      attackType,
      attackName,
      confidence: +(anomalyScore * 100).toFixed(1),
      detectionMethod,
      severity,
      details: alertDetails,
      mitigationAction: mitigation,
      isSimulated: !this.pythonModelStatus.isConnected,
      status: 'ACTIVE'
    };

    this.alerts.unshift(alert);
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts.pop();
    }
  }

  private pushFrame(frame: CanFrame) {
    this.frameBuffer.unshift(frame);
    if (this.frameBuffer.length > this.MAX_FRAME_BUFFER) {
      this.frameBuffer.pop();
    }
  }

  private aggregateHistory() {
    const now = Date.now();
    const d = new Date(now);
    const timeStr = d.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });

    this.trafficHistory.push({
      timeStr,
      timestamp: now,
      normalRate: this.currentSecondNormal,
      attackRate: this.currentSecondAttack,
      totalRate: this.currentSecondNormal + this.currentSecondAttack
    });

    if (this.trafficHistory.length > this.MAX_HISTORY_POINTS) {
      this.trafficHistory.shift();
    }

    // Reset counters for next second
    this.currentSecondNormal = 0;
    this.currentSecondAttack = 0;
  }

  // EXTERNAL PYTHON IDS INTEGRATION METHODS
  public ingestExternalFrame(raw: {
    canId: string;
    payload: string;
    dlc?: number;
    timestamp?: number;
    ecuSource?: string;
  }): CanFrame {
    this.totalFrames++;
    const isIdKnown = raw.canId in ECU_REGISTRY;
    const canIdDec = parseInt(raw.canId, 16) || 0;

    // Convert hex payload string to bytes
    const cleanPayload = raw.payload.replace(/\s+/g, '').toUpperCase();
    const bytes: number[] = [];
    for (let i = 0; i < cleanPayload.length; i += 2) {
      bytes.push(parseInt(cleanPayload.substr(i, 2), 16) || 0);
    }

    const frame: CanFrame = {
      id: `ext_${Date.now()}_${this.totalFrames}`,
      canId: raw.canId.startsWith('0x') ? raw.canId : `0x${raw.canId}`,
      canIdDecimal: canIdDec,
      dlc: raw.dlc || bytes.length || 8,
      payload: bytes.map(toHexByte).join(' '),
      rawBytes: bytes,
      timestamp: raw.timestamp || Date.now(),
      ecuSource: raw.ecuSource || (isIdKnown ? ECU_REGISTRY[raw.canId].name : 'EXTERNAL_STREAM'),
      isAttack: false,
      isSimulated: false
    };

    // this.normalFrames++;
    // this.currentSecondNormal++;
    this.pushFrame(frame);
    return frame;
  }

  public recordExternalPrediction(data: {
    canId: string;
    payload: string;
    isAttack: boolean;
    attackType?: AttackType | string;
    confidence: number;
    details?: string;
    modelName?: string;
  }) {
    // Mark python model as active
    this.pythonModelStatus.isConnected = true;
    this.pythonModelStatus.modelSource = 'EXTERNAL_PYTHON_BACKEND';
    this.pythonModelStatus.lastHeartbeat = Date.now();
    if (data.modelName) {
      this.pythonModelStatus.modelName = data.modelName;
    }

    if (data.isAttack) {
      this.detectedAttacks++;
      this.attackFrames++;
      this.currentSecondAttack++;
      const attackType = (data.attackType as AttackType) || 'fuzzy_attack';
      this.attackDistribution[attackType] = (this.attackDistribution[attackType] || 0) + 1;

      const alert: SecurityAlert = {
        id: `ext_alt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        timestamp: Date.now(),
        canId: data.canId.startsWith('0x') ? data.canId : `0x${data.canId}`,
        payload: data.payload,
        attackType,
        attackName: `External Detection: ${attackType.replace('_', ' ').toUpperCase()}`,
        confidence: Math.round(data.confidence * (data.confidence <= 1 ? 100 : 1)),
        detectionMethod: 'External Python IDS',
        severity: data.confidence > 0.9 ? 'critical' : 'high',
        details: data.details || `External ML Model classified CAN frame ${data.canId} as malicious with ${data.confidence * 100}% certainty`,
        mitigationAction: 'Alert logged from verified Python Random Forest pipeline',
        isSimulated: false,
        status: 'ACTIVE'
      };

      this.alerts.unshift(alert);
      if (this.alerts.length > this.MAX_ALERTS) {
        this.alerts.pop();
      }
    }
  }

  public recordHeartbeat(data: Partial<IDSModelStatus>) {
    this.pythonModelStatus.isConnected = true;
    this.pythonModelStatus.modelSource = 'EXTERNAL_PYTHON_BACKEND';
    this.pythonModelStatus.lastHeartbeat = Date.now();
    if (data.modelName) this.pythonModelStatus.modelName = data.modelName;
    if (data.accuracy !== undefined) this.pythonModelStatus.accuracy = data.accuracy;
    if (data.precision !== undefined) this.pythonModelStatus.precision = data.precision;
    if (data.recall !== undefined) this.pythonModelStatus.recall = data.recall;
    if (data.f1Score !== undefined) this.pythonModelStatus.f1Score = data.f1Score;
    if (data.nEstimators !== undefined) this.pythonModelStatus.nEstimators = data.nEstimators;
    if (data.inferenceLatencyMs !== undefined) this.pythonModelStatus.inferenceLatencyMs = data.inferenceLatencyMs;
    return this.pythonModelStatus;
  }

  public disconnectExternalModel() {
    this.pythonModelStatus.isConnected = false;
    this.pythonModelStatus.modelSource = 'SIMULATED_BASELINE';
    this.pythonModelStatus.modelName = 'RandomForest (Disconnected - Standby)';
    this.pythonModelStatus.lastHeartbeat = null;
  }

  public getSnapshot() {
    const total = this.normalFrames + this.attackFrames;
    const detectionRate = total > 0
      ? +((this.detectedAttacks / Math.max(1, this.attackFrames)) * 100).toFixed(1)
      : 98.7;

    const simulationState: SimulationState = {
      isRunning: this.isRunning,
      activeAttack: this.activeAttack,
      frameRateHz: this.frameRateHz,
      attackIntensity: this.attackIntensity,
      totalFrames: this.totalFrames,
      normalFrames: this.normalFrames,
      attackFrames: this.attackFrames,
      detectionRate: Math.min(100, Math.max(0, detectionRate))
    };

    return {
      simulationState,
      telemetry: this.telemetry,
      modelStatus: this.pythonModelStatus,
      recentFrames: this.frameBuffer.slice(0, 50),
      recentAlerts: this.alerts.slice(0, 50),
      trafficHistory: this.trafficHistory,
      attackDistribution: this.attackDistribution
    };
  }

  public setTelemetry(patch: Partial<VehicleTelemetry>) {
    this.telemetry = { ...this.telemetry, ...patch };
    return this.telemetry;
  }
}

export const canEngine = new CanEngine();
