import React, { useState } from 'react';
import { useCanBus } from './hooks/useCanBus';
import { TopBar } from './components/TopBar';
import { KpiCards } from './components/KpiCards';
import { TrafficChart } from './components/TrafficChart';
import { TrafficDistribution } from './components/TrafficDistribution';
import { VehicleTelemetryHud } from './components/VehicleTelemetryHud';
import { AlertsTable } from './components/AlertsTable';
import { SimulationControls } from './components/SimulationControls';
import { IdsModelStatusCard } from './components/IdsModelStatusCard';
import { CanBusTrafficMonitor } from './components/CanBusTrafficMonitor';
import { PythonIntegrationView } from './components/PythonIntegrationView';
import { EventHistorySection } from './components/EventHistorySection';
import {
  LayoutDashboard,
  Radio,
  Flame,
  ShieldAlert,
  Navigation,
  Code,
  History,
  Activity,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const {
    simulationState,
    telemetry,
    modelStatus,
    recentFrames,
    recentAlerts,
    trafficHistory,
    attackDistribution,
    startTraffic,
    stopSimulation,
    resetSimulation,
    injectAttack,
    clearAttack,
    togglePythonMock,
    ingestManualFrame
  } = useCanBus();

  const navItems = [
    { id: 'overview', label: 'SOC Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'can_monitor', label: 'CAN Traffic Stream', icon: <Radio className="w-4 h-4" /> },
    { id: 'attack_lab', label: 'Attack Simulator', icon: <Flame className="w-4 h-4" /> },
    { id: 'alerts', label: 'Security Alerts', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'telemetry', label: 'Vehicle HUD', icon: <Navigation className="w-4 h-4" /> },
    { id: 'history', label: 'Event History', icon: <History className="w-4 h-4" /> },
    { id: 'api_docs', label: 'Python IDS Integration', icon: <Code className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 bg-tech-grid flex flex-col">
      {/* Top Bar Header */}
      <TopBar
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        simulationState={simulationState}
        modelStatus={modelStatus}
        telemetry={telemetry}
        onStartSimulation={startTraffic}
        onStopSimulation={stopSimulation}
        onResetSimulation={resetSimulation}
        onOpenPythonGuide={() => setActiveTab('api_docs')}
      />

      {/* Main Body with Sidebar + Content Viewport */}
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/80 bg-[#070b16]/90 p-4 space-y-6 shrink-0">
          <div>
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block px-3 mb-2">
              Navigation
            </span>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono rounded-md transition-colors ${
                    activeTab === item.id
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)] font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span className={activeTab === item.id ? 'text-cyan-400' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Connected Vehicle Quick Summary */}
          <div className="mt-auto pt-4 border-t border-slate-800/80 font-mono text-xs space-y-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
              Test Vehicle Info
            </span>
            <div className="bg-[#091020] p-2.5 rounded border border-slate-800/60 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Platform:</span>
                <span className="text-slate-200">CAV-Alpha-IV</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CAN Bus:</span>
                <span className="text-cyan-300">ISO 11898-2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Autopilot:</span>
                <span className="text-emerald-400">{telemetry.autonomousMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Model Source:</span>
                <span className={modelStatus.isConnected ? 'text-emerald-400' : 'text-amber-400'}>
                  {modelStatus.isConnected ? 'Python Real' : 'Simulated'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
          {/* TAB 1: SOC OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 1. KPI Cards */}
              <KpiCards simulationState={simulationState} />

              {/* 2. Simulation Controls Lab Quick Bar */}
              <SimulationControls
                simulationState={simulationState}
                onStart={startTraffic}
                onStop={stopSimulation}
                onReset={resetSimulation}
                onInject={injectAttack}
                onClearAttack={clearAttack}
                onManualInject={ingestManualFrame}
              />

              {/* 3. Real-Time CAN Traffic Chart */}
              <TrafficChart
                history={trafficHistory}
                isRunning={simulationState.isRunning}
                activeAttack={simulationState.activeAttack}
              />

              {/* 4. Normal vs Malicious Traffic + Attack Distribution */}
              <TrafficDistribution
                simulationState={simulationState}
                attackDistribution={attackDistribution}
              />

              {/* 5. Vehicle Telemetry HUD */}
              <VehicleTelemetryHud telemetry={telemetry} />

              {/* 6. Recent Security Alerts Table */}
              <AlertsTable alerts={recentAlerts} />

              {/* 7. IDS & Random Forest Model Status */}
              <IdsModelStatusCard
                modelStatus={modelStatus}
                onToggleMockPython={togglePythonMock}
                onOpenPythonDocs={() => setActiveTab('api_docs')}
              />
            </div>
          )}

          {/* TAB 2: RAW CAN TRAFFIC STREAM */}
          {activeTab === 'can_monitor' && (
            <div className="space-y-6">
              <CanBusTrafficMonitor
                frames={recentFrames}
                isRunning={simulationState.isRunning}
                onTogglePause={() => (simulationState.isRunning ? stopSimulation() : startTraffic())}
              />
              <SimulationControls
                simulationState={simulationState}
                onStart={startTraffic}
                onStop={stopSimulation}
                onReset={resetSimulation}
                onInject={injectAttack}
                onClearAttack={clearAttack}
                onManualInject={ingestManualFrame}
              />
            </div>
          )}

          {/* TAB 3: ATTACK SIMULATOR */}
          {activeTab === 'attack_lab' && (
            <div className="space-y-6">
              <SimulationControls
                simulationState={simulationState}
                onStart={startTraffic}
                onStop={stopSimulation}
                onReset={resetSimulation}
                onInject={injectAttack}
                onClearAttack={clearAttack}
                onManualInject={ingestManualFrame}
              />
              <TrafficChart
                history={trafficHistory}
                isRunning={simulationState.isRunning}
                activeAttack={simulationState.activeAttack}
              />
              <TrafficDistribution
                simulationState={simulationState}
                attackDistribution={attackDistribution}
              />
            </div>
          )}

          {/* TAB 4: SECURITY ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <AlertsTable alerts={recentAlerts} isFullView={true} />
            </div>
          )}

          {/* TAB 5: VEHICLE TELEMETRY HUD */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              <VehicleTelemetryHud telemetry={telemetry} />
              <SimulationControls
                simulationState={simulationState}
                onStart={startTraffic}
                onStop={stopSimulation}
                onReset={resetSimulation}
                onInject={injectAttack}
                onClearAttack={clearAttack}
                onManualInject={ingestManualFrame}
              />
            </div>
          )}

          {/* TAB 6: EVENT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <EventHistorySection alerts={recentAlerts} />
            </div>
          )}

          {/* TAB 7: PYTHON IDS INTEGRATION */}
          {activeTab === 'api_docs' && (
            <div className="space-y-6">
              <PythonIntegrationView
                modelStatus={modelStatus}
                onToggleMockPython={togglePythonMock}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
