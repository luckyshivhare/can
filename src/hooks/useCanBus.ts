import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AttackType,
  CanFrame,
  SecurityAlert,
  VehicleTelemetry,
  IDSModelStatus,
  SimulationState,
  TrafficHistoryPoint
} from '../types/can';

interface DashboardSnapshot {
  simulationState: SimulationState;
  telemetry: VehicleTelemetry;
  modelStatus: IDSModelStatus;
  recentFrames: CanFrame[];
  recentAlerts: SecurityAlert[];
  trafficHistory: TrafficHistoryPoint[];
  attackDistribution: Record<string, number>;
}

const DEFAULT_STATE: DashboardSnapshot = {
  simulationState: {
    isRunning: true,
    activeAttack: 'none',
    frameRateHz: 30,
    attackIntensity: 5,
    totalFrames: 1240,
    normalFrames: 1205,
    attackFrames: 35,
    detectionRate: 98.7
  },
  telemetry: {
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
  },
  modelStatus: {
    isConnected: false,
    modelName: 'RandomForest (Simulation Standby)',
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
  },
  recentFrames: [],
  recentAlerts: [],
  trafficHistory: [],
  attackDistribution: {
    speed_spoofing: 12,
    invalid_brake: 8,
    fuzzy_attack: 10,
    can_dos: 5
  }
};

export function useCanBus() {
  const [data, setData] = useState<DashboardSnapshot>(DEFAULT_STATE);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch once or poll
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/ids/status');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setData(json.data);
          setIsConnected(true);
          setIsError(false);
        }
      }
    } catch {
      setIsError(true);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Setup SSE connection
    if (typeof EventSource !== 'undefined') {
      const es = new EventSource('/api/ids/stream');
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        setIsError(false);
      };

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.simulationState) {
            setData(parsed);
            setIsConnected(true);
            setIsError(false);
          }
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = () => {
        es.close();
        // Fallback to polling if SSE drops
        if (!pollIntervalRef.current) {
          pollIntervalRef.current = setInterval(fetchStatus, 800);
        }
      };

      return () => {
        es.close();
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    } else {
      pollIntervalRef.current = setInterval(fetchStatus, 800);
      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [fetchStatus]);

  // Actions
  const startTraffic = async () => {
    try {
      await fetch('/api/ids/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const stopSimulation = async () => {
    try {
      await fetch('/api/ids/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const resetSimulation = async () => {
    try {
      await fetch('/api/ids/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const injectAttack = async (attackType: AttackType, intensity: number = 5) => {
    try {
      await fetch('/api/ids/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'inject', attackType, intensity })
      });
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const clearAttack = async () => {
    try {
      await fetch('/api/ids/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_attack' })
      });
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const togglePythonMock = async (connect: boolean) => {
    try {
      await fetch('/api/ids/test-connect-python', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connect })
      });
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const ingestManualFrame = async (canId: string, payload: string, ecuSource?: string) => {
    try {
      const res = await fetch('/api/ids/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canId, payload, ecuSource: ecuSource || 'MANUAL_INJECTOR' })
      });
      fetchStatus();
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false };
    }
  };

  return {
    ...data,
    backendConnected: isConnected,
    backendError: isError,
    startTraffic,
    stopSimulation,
    resetSimulation,
    injectAttack,
    clearAttack,
    togglePythonMock,
    ingestManualFrame,
    refresh: fetchStatus
  };
}
