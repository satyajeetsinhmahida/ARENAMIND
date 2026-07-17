import React, { useState } from 'react';
import { StadiumMap } from '../shared/StadiumMap.js';
import { ChatPanel } from './ChatPanel.js';
import { PanicButton } from './PanicButton.js';
import { LanguageSwitcher } from '../shared/LanguageSwitcher.js';
import { AccessibilityToggle } from './AccessibilityToggle.js';
import { useSimulator } from '../../hooks/useSimulator.js';
import { useNavigate } from 'react-router-dom';

const QUICK_PROMPTS = [
  { icon: '🍔', label: 'Nearest Food' },
  { icon: '🚻', label: 'Restrooms' },
  { icon: '♿', label: 'Accessibility' },
  { icon: '🅿️', label: 'Parking' },
  { icon: '🎟️', label: 'My Seat' },
  { icon: '🏥', label: 'Medical Help' },
];

export const FanApp: React.FC = () => {
  const { zoneStatuses, phaseLabel } = useSimulator();
  const [chatOpen, setChatOpen] = useState(true);
  const [selectedZoneInfo, setSelectedZoneInfo] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleZoneClick = (zoneId: string) => setSelectedZoneInfo(zoneId);

  return (
    <div className="relative w-screen h-screen bg-fan-gradient bg-grid-sm overflow-hidden flex flex-col">

      {/* Ambient background orbs */}
      <div className="orb orb-cyan w-96 h-96 absolute -top-32 -left-16 opacity-20 pointer-events-none" />
      <div className="orb orb-emerald w-72 h-72 absolute bottom-0 right-1/3 opacity-15 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-40 w-full glass-dark border-b border-white/5 px-5 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Back to home */}
          <button
            onClick={() => navigate('/')}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-150 hover:bg-white/5"
            aria-label="Back to home"
          >
            ←
          </button>

          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center font-outfit font-black text-sm"
            style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(0,212,255,0.08))', border: '1px solid rgba(0,212,255,0.35)' }}>
            <span style={{ color: '#00D4FF', textShadow: '0 0 12px rgba(0,212,255,0.8)' }}>AM</span>
            <div className="live-dot absolute -top-0.5 -right-0.5" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-sm font-black font-outfit text-white leading-none tracking-tight">
              ArenaMind <span className="font-mono text-cyan-400">Fan</span>
            </h1>
            <span className="text-[9px] font-mono tracking-widest uppercase mt-0.5" style={{ color: 'rgba(0,212,255,0.6)' }}>
              Your Personal Stadium Concierge
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Match Phase */}
          <div
            className="px-3 py-1.5 rounded-full font-mono text-[9px] font-bold tracking-wider"
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,136,0.12), rgba(0,255,136,0.04))',
              border: '1px solid rgba(0,255,136,0.25)',
              color: '#00FF88',
            }}
          >
            <span className="animate-blink mr-1">●</span>
            {phaseLabel}
          </div>

          <LanguageSwitcher />
          <AccessibilityToggle />

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="flex sm:hidden w-9 h-9 rounded-lg items-center justify-center border border-white/10 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-400 transition-all duration-200"
            aria-label="Toggle Concierge Panel"
          >
            💬
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative flex overflow-hidden">

        {/* Stadium Map Area */}
        <div className="flex-1 h-full p-5 flex flex-col items-center justify-center relative">

          {/* Top label */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
            <div className="glass-card rounded-xl px-3 py-2">
              <div className="font-outfit font-bold text-white text-sm">MetLife Stadium</div>
              <div className="font-mono text-[9px] text-gray-500 mt-0.5">East Rutherford, NJ · 82,500 capacity</div>
            </div>

            <div className="flex flex-col gap-1">
              {[
                { color: '#00FF88', label: 'Clear' },
                { color: '#FFB800', label: 'Moderate' },
                { color: '#FF7800', label: 'Busy' },
                { color: '#FF3366', label: 'Critical' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                  <span className="font-mono text-[8px] text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stadium Map */}
          <StadiumMap
            zones={zoneStatuses}
            onZoneClick={handleZoneClick}
            variant="fan"
            className="max-w-[800px] drop-shadow-2xl"
          />

          {/* Zone selected popup */}
          {selectedZoneInfo && (
            <div
              className="absolute bottom-5 left-5 max-w-xs glass-card rounded-2xl p-4 animate-slide-in-up"
              style={{ border: '1px solid rgba(0,212,255,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-mono text-[9px] text-cyan-400 uppercase tracking-widest mb-0.5">Zone Selected</div>
                  <h4 className="font-outfit font-bold text-white text-sm">{selectedZoneInfo}</h4>
                </div>
                <button
                  onClick={() => setSelectedZoneInfo(null)}
                  className="text-gray-500 hover:text-white w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 transition-all text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Ask the ArenaMind concierge for directions, crowd status, or services near <strong className="text-white">{selectedZoneInfo}</strong>.
              </p>
              <button
                onClick={() => { setChatOpen(true); setSelectedZoneInfo(null); }}
                className="mt-3 w-full py-2 rounded-xl btn-neon-cyan text-[10px] tracking-wider cursor-pointer"
              >
                Ask Concierge →
              </button>
            </div>
          )}

          {/* Quick action pills at bottom */}
          {!selectedZoneInfo && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 flex-wrap px-4 z-10">
              {QUICK_PROMPTS.map(qp => (
                <button
                  key={qp.label}
                  onClick={() => setChatOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] text-gray-400 hover:text-white transition-all duration-200 cursor-pointer"
                  style={{
                    background: 'rgba(7,15,32,0.8)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <span>{qp.icon}</span>
                  <span>{qp.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Panel Drawer */}
        {chatOpen && (
          <div className="w-full sm:w-[400px] md:w-[440px] h-full flex-shrink-0 z-30 animate-slide-in-right">
            <ChatPanel onClose={() => setChatOpen(false)} />
          </div>
        )}
      </main>

      {/* SOS Panic Button */}
      <PanicButton sessionId={crypto.randomUUID()} />
    </div>
  );
};

export default FanApp;
