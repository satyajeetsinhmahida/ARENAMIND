import React, { useEffect, useState } from 'react';
import { HeatMap } from './HeatMap.js';
import { ActionFeed } from './ActionFeed.js';
import { AgentTracePanel } from './AgentTracePanel.js';
import { AuditLog } from './AuditLog.js';
import { ZoneDetail } from './ZoneDetail.js';
import { useSimulator } from '../../hooks/useSimulator.js';
import { useWebSocket } from '../../hooks/useWebSocket.js';
import { ActionCard, ActionResponse } from '../../types/index.js';
import { RISK_COLORS } from '../../lib/constants.js';
import { useNavigate } from 'react-router-dom';

const AGENT_CHAIN = [
  { id: 'A1', label: 'Fan', color: '#00D4FF' },
  { id: 'A2', label: 'Crowd', color: '#00FF88' },
  { id: 'A3', label: 'Ops', color: '#FFB800' },
  { id: 'A4', label: 'Safety', color: '#FF3366' },
];

export const OpsApp: React.FC = () => {
  const { zoneStatuses, phaseLabel } = useSimulator();
  const navigate = useNavigate();

  const [actionCards, setActionCards] = useState<ActionCard[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'trace' | 'audit'>('feed');
  const [matchMinutes, setMatchMinutes] = useState(0);
  const [activeAgent, setActiveAgent] = useState(0);
  const [lastAlert, setLastAlert] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/actions')
      .then(res => res.json())
      .then((data: ActionCard[]) => setActionCards(data))
      .catch(err => console.warn('Failed to load initial ops action cards:', err));

    const timer = setInterval(() => setMatchMinutes(prev => prev + 1), 15000);
    const agentTimer = setInterval(() => setActiveAgent(p => (p + 1) % 4), 1600);
    return () => { clearInterval(timer); clearInterval(agentTimer); };
  }, []);

  useWebSocket('ops:action', (card: ActionCard) => {
    setActionCards(prev => {
      if (prev.some(c => c.id === card.id)) return prev;
      return [card, ...prev];
    });
    setLastAlert(card.urgency);
    setTimeout(() => setLastAlert(null), 3000);

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(card.urgency === 'CRITICAL' ? 880 : 660, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {}
  });

  useWebSocket('ops:action_update', (card: ActionCard) => {
    setActionCards(prev => prev.map(c => c.id === card.id ? card : c));
  });

  const handleActionResponse = async (id: string, response: ActionResponse) => {
    try {
      const res = await fetch(`/api/actions/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response, staffRole: 'Operations_Commander' }),
      });
      if (res.ok) {
        setActionCards(prev => prev.map(c =>
          c.id === id ? { ...c, status: response, respondedAt: new Date().toISOString(), respondedBy: 'Operations_Commander' } : c
        ));
      }
    } catch (err) {
      console.error('Failed to submit staff action response:', err);
    }
  };

  const getCount = (urg: string) => actionCards.filter(c => c.status === 'pending' && c.urgency === urg).length;
  const criticalCount = getCount('CRITICAL');
  const highCount = getCount('HIGH');
  const totalOccupancy = zoneStatuses.size > 0
    ? Math.round([...zoneStatuses.values()].reduce((s, z) => s + z.occupancyPercent, 0) / zoneStatuses.size)
    : 0;

  const TABS = [
    { code: 'feed',  label: '⚡ Actions',   color: '#FFB800' },
    { code: 'trace', label: '🤖 Agents',    color: '#00D4FF' },
    { code: 'audit', label: '📋 Audit Log', color: '#A855F7' },
  ];

  return (
    <div className="relative w-screen h-screen bg-ops-gradient bg-grid overflow-hidden flex flex-col font-sans">

      {/* Ambient orbs */}
      <div className="orb orb-cyan w-96 h-96 absolute top-0 right-0 opacity-10 pointer-events-none translate-x-1/2 -translate-y-1/2" />
      <div className="orb orb-purple w-72 h-72 absolute bottom-0 left-0 opacity-10 pointer-events-none -translate-x-1/2 translate-y-1/2" />

      {/* Alert Flash */}
      {lastAlert === 'CRITICAL' && (
        <div className="absolute inset-0 pointer-events-none z-50 animate-fade-in"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255,51,102,0.05) 0%, transparent 70%)' }}
        />
      )}

      {/* Top Navigation */}
      <header className="relative z-40 w-full glass-dark border-b border-white/5 px-5 py-3 flex justify-between items-center">

        {/* Left: Logo + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-150 hover:bg-white/5"
            aria-label="Back to home"
          >
            ←
          </button>

          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center font-outfit font-black text-sm"
            style={{ background: 'linear-gradient(135deg, rgba(255,184,0,0.2), rgba(255,184,0,0.06))', border: '1px solid rgba(255,184,0,0.3)' }}>
            <span style={{ color: '#FFB800', textShadow: '0 0 12px rgba(255,184,0,0.8)' }}>AM</span>
            <div className="live-dot-red absolute -top-0.5 -right-0.5" />
          </div>

          <div>
            <h1 className="text-sm font-black font-outfit text-white leading-none tracking-tight">
              ArenaMind <span className="font-mono text-amber-400">Command Center</span>
            </h1>
            <span className="text-[9px] font-mono tracking-widest uppercase mt-0.5 text-amber-400/50">
              MetLife Stadium Operations · Real-Time
            </span>
          </div>
        </div>

        {/* Center: Agent Pipeline */}
        <div className="hidden md:flex items-center gap-1">
          {AGENT_CHAIN.map((ag, i) => (
            <React.Fragment key={ag.id}>
              <div
                className="px-2 py-1 rounded-lg font-mono text-[9px] font-bold transition-all duration-400"
                style={{
                  background: activeAgent === i ? `${ag.color}18` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeAgent === i ? ag.color + '50' : 'rgba(255,255,255,0.05)'}`,
                  color: activeAgent === i ? ag.color : '#3D4F6E',
                  textShadow: activeAgent === i ? `0 0 10px ${ag.color}` : 'none',
                  boxShadow: activeAgent === i ? `0 0 12px ${ag.color}25` : 'none',
                }}
              >
                {ag.id}
              </div>
              {i < 3 && <span className="text-[8px] text-gray-700 mx-0.5">→</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Right: Status metrics */}
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <div className="badge-critical animate-pulse-red px-3 py-1.5 flex items-center gap-1.5">
              🚨 {criticalCount} CRITICAL
            </div>
          )}
          {highCount > 0 && (
            <div className="badge-high px-3 py-1.5 flex items-center gap-1.5">
              ⚠️ {highCount} HIGH
            </div>
          )}
          <div
            className="px-3 py-1.5 rounded-full font-mono text-[9px] font-bold tracking-wider"
            style={{
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.2)',
              color: '#00D4FF',
            }}
          >
            <span className="animate-blink mr-1">●</span>
            {phaseLabel}
          </div>
          <div className="font-mono text-[9px] text-gray-600 px-2">
            {String(matchMinutes).padStart(2, '0')}:{String(0).padStart(2, '0')}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 w-full flex overflow-hidden">

        {/* LEFT PANEL (18%): Zone Index */}
        <aside className="w-[18%] min-w-[160px] h-full border-r border-white/5 flex flex-col overflow-hidden">
          <div className="px-3 py-3 border-b border-white/5">
            <div className="font-mono text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">Stadium Nodes</div>
            <div className="font-outfit font-bold text-white text-xs">
              {zoneStatuses.size} Zones · Avg {totalOccupancy}%
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
            {Array.from(zoneStatuses.values()).map(zone => (
              <button
                key={zone.zone_id}
                onClick={() => setSelectedZoneId(zone.zone_id)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                  selectedZoneId === zone.zone_id
                    ? 'border-cyan-500/30 bg-cyan-500/5'
                    : 'border-white/4 bg-white/1 hover:border-white/10 hover:bg-white/3'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[10px] font-bold text-white">{zone.zone_id}</span>
                  <span
                    className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={{
                      background: `${RISK_COLORS[zone.riskLevel]}18`,
                      color: RISK_COLORS[zone.riskLevel],
                      border: `1px solid ${RISK_COLORS[zone.riskLevel]}40`,
                    }}
                  >
                    {zone.occupancyPercent}%
                  </span>
                </div>
                <div
                  className="w-full h-1 rounded-full overflow-hidden bg-white/5"
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${zone.occupancyPercent}%`,
                      background: RISK_COLORS[zone.riskLevel],
                      boxShadow: `0 0 6px ${RISK_COLORS[zone.riskLevel]}`,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER (47%): Heatmap */}
        <section className="flex-1 h-full flex flex-col overflow-hidden border-r border-white/5">
          <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
            <div>
              <div className="font-mono text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">Live Crowd Density</div>
              <div className="font-outfit font-bold text-white text-xs">Stadium Heatmap</div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="live-dot" />
              <span className="font-mono text-[9px] text-emerald-400">STREAMING</span>
            </div>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center">
            <HeatMap zones={zoneStatuses} onZoneSelect={setSelectedZoneId} />
          </div>
        </section>

        {/* RIGHT PANEL (35%): Tabs */}
        <section className="w-[35%] min-w-[280px] h-full flex flex-col overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-white/5 bg-black/20">
            {TABS.map(tab => (
              <button
                key={tab.code}
                onClick={() => setActiveTab(tab.code as any)}
                className={`flex-1 py-3 text-center font-mono text-[9px] uppercase tracking-widest font-bold cursor-pointer border-b-2 transition-all duration-200 ${
                  activeTab === tab.code ? 'bg-white/2' : 'hover:text-gray-300 hover:bg-white/1'
                }`}
                style={{
                  borderBottomColor: activeTab === tab.code ? tab.color : 'transparent',
                  color: activeTab === tab.code ? tab.color : '#3D4F6E',
                  textShadow: activeTab === tab.code ? `0 0 10px ${tab.color}60` : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab body */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'feed' && (
              <div className="h-full overflow-y-auto p-3">
                <ActionFeed
                  cards={actionCards}
                  onRespond={handleActionResponse}
                  onInspectTrace={() => setActiveTab('trace')}
                />
              </div>
            )}
            {activeTab === 'trace' && (
              <div className="h-full overflow-y-auto p-3">
                <AgentTracePanel />
              </div>
            )}
            {activeTab === 'audit' && (
              <div className="h-full overflow-y-auto p-3">
                <AuditLog />
              </div>
            )}

            {/* Zone detail overlay */}
            {selectedZoneId && (
              <div className="absolute inset-0 z-40 animate-fade-in"
                style={{ background: 'rgba(2,8,23,0.95)', backdropFilter: 'blur(20px)' }}>
                <ZoneDetail
                  zoneId={selectedZoneId}
                  status={zoneStatuses.get(selectedZoneId)}
                  onClose={() => setSelectedZoneId(null)}
                />
              </div>
            )}
          </div>

          {/* Bottom status bar */}
          <div className="border-t border-white/5 px-4 py-2 flex justify-between items-center bg-black/20">
            <span className="font-mono text-[9px] text-gray-700">
              {actionCards.filter(c => c.status === 'pending').length} pending actions
            </span>
            <span className="font-mono text-[9px] text-gray-700">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default OpsApp;
