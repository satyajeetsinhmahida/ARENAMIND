import React, { useState, useEffect, useRef } from 'react';
import { AgentTraceStep, AgentTrace as TraceType } from '../../types/index.js';
import { useWebSocket } from '../../hooks/useWebSocket.js';

interface AgentTraceProps {
  maxVisible?: number;
  compact?: boolean;
}

export const AgentTrace: React.FC<AgentTraceProps> = ({
  maxVisible = 10,
  compact = false
}) => {
  const [traces, setTraces] = useState<AgentTraceStep[]>([]);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to live trace stream updates from server
  useWebSocket('agent:trace', (step: AgentTraceStep) => {
    setTraces(prev => {
      const next = [step, ...prev];
      if (next.length > 50) next.pop(); // Enforce layout history buffer
      return next;
    });

    // Auto expand the latest incoming step
    setExpandedStepId(step.id);
  });

  useEffect(() => {
    // Scroll container to top when new step arrives
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [traces]);

  const getAgentColor = (agentId: string): string => {
    switch (agentId) {
      case 'fan-concierge': return 'border-teal/30 text-teal bg-teal/5';
      case 'crowd-intelligence': return 'border-amber/30 text-amber bg-amber/5';
      case 'ops-commander': return 'border-red-400/30 text-red-400 bg-red-400/5';
      case 'safety-accessibility': return 'border-purple-400/30 text-purple-400 bg-purple-400/5';
      default: return 'border-white/10 text-white bg-white/5';
    }
  };

  const getAgentLabel = (agentId: string): string => {
    switch (agentId) {
      case 'fan-concierge': return 'Fan Concierge Agent';
      case 'crowd-intelligence': return 'Crowd Intelligence Agent';
      case 'ops-commander': return 'Ops Commander Agent';
      case 'safety-accessibility': return 'Safety & Accessibility Agent';
      default: return 'Stadium Operations Agent';
    }
  };

  if (traces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border border-white/5 bg-white/2 rounded-xl text-xs text-gray-500">
        <div className="animate-pulse mb-2">📡 Waiting for live operations signals...</div>
        <div>Simulator activity will trigger agent logic.</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-4 overflow-y-auto max-h-[500px] pr-2 ${compact ? 'max-h-[300px]' : ''}`}
    >
      {traces.slice(0, maxVisible).map((step, idx) => {
        const isExpanded = expandedStepId === step.id;
        const colorClasses = getAgentColor(step.agentId);
        const label = getAgentLabel(step.agentId);

        return (
          <div
            key={step.id}
            className="relative flex flex-col glass rounded-xl border border-white/5 p-3 text-xs animate-fade-in transition-all duration-200"
          >
            {/* Thread line linking nodes */}
            {idx < traces.length - 1 && (
              <div className="absolute left-6 bottom-[-24px] w-0.5 h-6 border-l border-dashed border-white/10" />
            )}

            {/* Header info */}
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
            >
              <div className="flex items-center gap-3">
                {/* Node indicator */}
                <div className={`flex items-center justify-center w-6 h-6 rounded-full border ${colorClasses} font-semibold font-mono text-[10px]`}>
                  {step.agentId === 'fan-concierge' ? 'A1' : step.agentId === 'crowd-intelligence' ? 'A2' : step.agentId === 'ops-commander' ? 'A3' : 'A4'}
                </div>
                <div>
                  <div className="font-semibold text-white font-outfit">{label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{step.action}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-gray-500">{step.durationMs}ms</span>
                <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
              </div>
            </div>

            {/* Expanded Reasoning Trace Details */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-2 animate-fade-in text-[11px]">
                <div className="flex flex-col gap-1">
                  <div className="text-[9px] font-semibold text-teal uppercase tracking-wider">Input Prompt / Telemetry</div>
                  <pre className="p-2 glass-light rounded-lg font-mono text-[10px] text-gray-300 max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {step.input}
                  </pre>
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="text-[9px] font-semibold text-gold uppercase tracking-wider">Agent Reasoning Output</div>
                  <div className="p-2 glass-light rounded-lg text-gray-100 bg-white/2">
                    {step.output}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
