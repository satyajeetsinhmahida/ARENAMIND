import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TICKER_ITEMS = [
  '⚡ CROWD INTEL ACTIVE',
  '🏟️ METLIFE STADIUM — 82,500 CAPACITY',
  '🤖 4 AI AGENTS ONLINE',
  '🌍 FIFA WORLD CUP 2026',
  '📡 REAL-TIME TELEMETRY STREAMING',
  '🔒 WCAG AA ACCESSIBLE',
  '🚀 ARENAMIND v1.0 DEPLOYED',
  '⚡ CROWD INTEL ACTIVE',
  '🏟️ METLIFE STADIUM — 82,500 CAPACITY',
  '🤖 4 AI AGENTS ONLINE',
  '🌍 FIFA WORLD CUP 2026',
  '📡 REAL-TIME TELEMETRY STREAMING',
  '🔒 WCAG AA ACCESSIBLE',
  '🚀 ARENAMIND v1.0 DEPLOYED',
];

const AGENTS = [
  { id: 'A1', name: 'Fan Concierge',      color: '#00D4FF', icon: '💬', desc: 'RAG-powered conversational AI for 82,500 fans' },
  { id: 'A2', name: 'Crowd Intelligence', color: '#00FF88', icon: '📊', desc: 'Linear regression trend forecaster & anomaly detector' },
  { id: 'A3', name: 'Ops Commander',      color: '#FFB800', icon: '⚡', desc: 'Priority action dispatch to stadium staff' },
  { id: 'A4', name: 'Safety & Access',    color: '#FF3366', icon: '🚨', desc: 'Evacuation coordinator & SOS response engine' },
];

const STATS = [
  { value: '82,500',  label: 'Fan Capacity',    suffix: '',   color: '#00D4FF' },
  { value: '90',      label: 'KB Indexed',       suffix: ' chunks', color: '#00FF88' },
  { value: '4',       label: 'AI Agents',        suffix: '',   color: '#A855F7' },
  { value: '<200',    label: 'Response Time',    suffix: 'ms', color: '#FFB800' },
];

function useCountUp(target: number, duration: number = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

const Orb: React.FC<{ className?: string; delay?: number }> = ({ className = '', delay = 0 }) => (
  <div
    className={`orb absolute pointer-events-none ${className}`}
    style={{ animationDelay: `${delay}s` }}
  />
);

const AgentNode: React.FC<{ agent: typeof AGENTS[0]; index: number; active: boolean }> = ({ agent, index, active }) => (
  <div
    className="flex flex-col items-center gap-3 animate-slide-in-up"
    style={{ animationDelay: `${0.6 + index * 0.15}s`, animationFillMode: 'both', opacity: 0 }}
  >
    <div
      className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500"
      style={{
        background: `linear-gradient(135deg, ${agent.color}22, ${agent.color}08)`,
        border: `1px solid ${agent.color}44`,
        boxShadow: active ? `0 0 24px ${agent.color}55, 0 0 48px ${agent.color}22` : 'none',
      }}
    >
      {agent.icon}
      {active && (
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-blink"
          style={{ background: agent.color, boxShadow: `0 0 8px ${agent.color}` }}
        />
      )}
    </div>
    <div className="text-center">
      <div className="font-mono text-[10px] font-bold mb-0.5" style={{ color: agent.color }}>{agent.id}</div>
      <div className="font-outfit text-xs font-semibold text-white">{agent.name}</div>
      <div className="text-[9px] text-gray-500 max-w-[100px] leading-tight mt-1">{agent.desc}</div>
    </div>
  </div>
);

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeAgent, setActiveAgent] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setActiveAgent(p => (p + 1) % 4), 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-screen min-h-screen bg-hero-gradient bg-grid overflow-hidden flex flex-col">

      {/* Ambient Orbs */}
      <Orb className="orb-cyan w-[600px] h-[600px] -top-48 left-1/2 -translate-x-1/2 animate-orb-pulse opacity-60" delay={0} />
      <Orb className="orb-purple w-[400px] h-[400px] top-1/2 -right-32 animate-orb-pulse opacity-40" delay={1.5} />
      <Orb className="orb-emerald w-[300px] h-[300px] bottom-32 -left-20 animate-orb-pulse opacity-35" delay={3} />

      {/* Ticker Tape */}
      <div className="w-full bg-black/40 border-b border-cyan-500/10 py-2 overflow-hidden z-10">
        <div className="ticker-inner gap-8">
          {TICKER_ITEMS.map((item, i) => (
            <span key={i} className="font-mono text-[10px] text-cyan-400/70 tracking-widest uppercase mx-6">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Top Navigation */}
      <nav className="relative z-20 w-full px-8 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl flex items-center justify-center font-bold font-outfit text-sm"
            style={{ background: 'linear-gradient(135deg, #00D4FF33, #00D4FF11)', border: '1px solid #00D4FF44' }}>
            <span className="text-glow-cyan text-cyan-400 font-black">AM</span>
            <div className="absolute -top-0.5 -right-0.5 live-dot" />
          </div>
          <div>
            <div className="font-outfit font-black text-white text-lg leading-none tracking-tight">ArenaMind</div>
            <div className="font-mono text-[9px] text-cyan-400/60 tracking-widest uppercase">GenAI Stadium Intelligence</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-[10px] text-emerald-400 tracking-wider"
            style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}>
            <div className="live-dot w-1.5 h-1.5" style={{ background: '#00FF88', boxShadow: '0 0 6px #00FF88' }} />
            ALL SYSTEMS OPERATIONAL
          </div>
          <span className="font-mono text-[10px] text-gray-500 px-3 py-1.5 rounded-full border border-white/5">
            FIFA WC 2026
          </span>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-12">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 font-mono text-[11px] font-medium tracking-wider animate-slide-in-up"
          style={{
            background: 'linear-gradient(90deg, rgba(0,212,255,0.12), rgba(168,85,247,0.12))',
            border: '1px solid rgba(0,212,255,0.25)',
            animationDelay: '0.1s', animationFillMode: 'both', opacity: 0
          }}
        >
          <div className="live-dot w-1.5 h-1.5" />
          <span className="text-cyan-400">PromptWars: Challenge 4 — Smart Stadiums & Tournament Operations</span>
        </div>

        {/* Main Headline */}
        <h1
          className="font-outfit font-black text-white leading-none mb-6 animate-slide-in-up"
          style={{
            fontSize: 'clamp(2.8rem, 8vw, 6rem)',
            animationDelay: '0.2s', animationFillMode: 'both', opacity: 0,
            background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(0,212,255,0.9) 50%, #A855F7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ARENAMIND
        </h1>

        <p
          className="font-outfit text-xl md:text-2xl text-gray-300 font-medium mb-3 animate-slide-in-up"
          style={{ animationDelay: '0.3s', animationFillMode: 'both', opacity: 0 }}
        >
          Multi-Agent GenAI Operations Layer
        </p>
        <p
          className="font-inter text-gray-500 text-sm md:text-base max-w-xl mb-12 leading-relaxed animate-slide-in-up"
          style={{ animationDelay: '0.4s', animationFillMode: 'both', opacity: 0 }}
        >
          One shared intelligence core. 82,500 fans served. Full stadium operations commanded.
          Real-time crowd intelligence that solves fan experience and ops failures simultaneously.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 mb-16 animate-slide-in-up"
          style={{ animationDelay: '0.5s', animationFillMode: 'both', opacity: 0 }}
        >
          <button
            id="enter-fan-btn"
            onClick={() => navigate('/fan')}
            className="btn-neon-cyan group relative px-8 py-4 rounded-2xl text-sm font-bold tracking-wide flex items-center gap-3 cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="text-2xl">🏟️</span>
            <div className="text-left">
              <div className="text-cyan-400 font-outfit font-bold">Fan Experience</div>
              <div className="text-[10px] text-cyan-400/60 font-mono">Concierge AI · Voice · Wayfinding</div>
            </div>
          </button>

          <button
            id="enter-ops-btn"
            onClick={() => navigate('/ops')}
            className="group relative px-8 py-4 rounded-2xl text-sm font-bold tracking-wide flex items-center gap-3 cursor-pointer overflow-hidden transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.08))',
              border: '1px solid rgba(168,85,247,0.4)',
            }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(168,85,247,0.04))' }}
            />
            <span className="text-2xl">⚡</span>
            <div className="text-left">
              <div className="text-purple-400 font-outfit font-bold">Operations Center</div>
              <div className="text-[10px] text-purple-400/60 font-mono">Command · Heatmap · Agent Trace</div>
            </div>
          </button>
        </div>

        {/* Stats Row */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 w-full max-w-3xl animate-slide-in-up stagger"
          style={{ animationDelay: '0.55s', animationFillMode: 'both', opacity: 0 }}
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="metric-card p-5 text-center animate-slide-in-up">
              <div
                className="font-outfit font-black text-2xl md:text-3xl leading-none mb-1"
                style={{ color: stat.color, textShadow: `0 0 20px ${stat.color}60` }}
              >
                {stat.value}<span className="text-base font-mono">{stat.suffix}</span>
              </div>
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Agent Pipeline */}
        <div className="w-full max-w-3xl">
          <p className="font-mono text-[10px] text-gray-600 uppercase tracking-widest mb-8">
            — Live Agent Intelligence Pipeline —
          </p>

          <div className="flex items-start justify-center gap-4 md:gap-8">
            {AGENTS.map((agent, i) => (
              <React.Fragment key={agent.id}>
                <AgentNode agent={agent} index={i} active={activeAgent === i} />
                {i < AGENTS.length - 1 && (
                  <div className="flex items-center mt-6 flex-shrink-0">
                    <svg width="40" height="20" viewBox="0 0 40 20">
                      <line x1="0" y1="10" x2="32" y2="10"
                        stroke={activeAgent === i ? AGENTS[i].color : 'rgba(255,255,255,0.1)'}
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        style={{ transition: 'stroke 0.5s ease' }}
                      />
                      <polygon
                        points="32,6 40,10 32,14"
                        fill={activeAgent === i ? AGENTS[i].color : 'rgba(255,255,255,0.1)'}
                        style={{ transition: 'fill 0.5s ease' }}
                      />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full border-t border-white/5 px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="font-mono text-[10px] text-gray-600 tracking-wider">
          ARENAMIND © 2026 · Built for PromptWars Challenge 4 · Google Antigravity
        </div>
        <div className="flex items-center gap-6">
          {['RAG Engine', 'TF-IDF Index', 'SQLite Store', 'WebSocket', 'WCAG AA'].map(tag => (
            <span key={tag} className="font-mono text-[9px] text-gray-600 tracking-wider uppercase">
              {tag}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
