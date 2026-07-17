import React, { useState } from 'react';
import { ActionCard as CardType, ActionResponse } from '../../types/index.js';
import { RISK_COLORS } from '../../lib/constants.js';

interface ActionCardProps {
  card: CardType;
  onRespond: (id: string, response: ActionResponse) => void;
  onInspectTrace?: (traceId: string) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  card,
  onRespond,
  onInspectTrace
}) => {
  const [expanded, setExpanded] = useState(false);

  const getUrgencyStyles = (urg: string): string => {
    switch (urg) {
      case 'CRITICAL': return 'bg-purple-600 text-white border-purple-500 font-bold animate-pulse';
      case 'HIGH': return 'bg-red-500/10 border-red-500/30 text-red-400 font-bold';
      case 'MEDIUM': return 'bg-amber/10 border-amber/30 text-amber font-medium';
      default: return 'bg-teal/10 border-teal/30 text-teal';
    }
  };

  const getStatusColor = (status: string): string => {
    if (status === 'accepted') return 'text-green-400 font-bold';
    if (status === 'dismissed') return 'text-gray-500';
    if (status === 'snoozed') return 'text-amber font-bold';
    return 'text-teal animate-pulse';
  };

  return (
    <div
      className={`glass border rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 ${
        card.status !== 'pending' ? 'opacity-65' : ''
      } ${expanded ? 'border-teal/30 shadow-lg' : 'border-white/5'}`}
    >
      
      {/* Title & badge */}
      <div
        className="flex items-start justify-between cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col gap-1.5 max-w-[80%]">
          <div className="flex gap-2 items-center flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[8px] tracking-wide border uppercase ${getUrgencyStyles(card.urgency)}`}>
              {card.urgency}
            </span>
            <span className="text-[10px] font-mono text-gray-500">Zone: {card.zoneId}</span>
          </div>
          <h4 className="font-bold text-white text-xs font-outfit leading-snug">{card.title}</h4>
        </div>
        
        <span className="text-gray-400 self-center text-xs">{expanded ? '▼' : '▶'}</span>
      </div>

      {/* Expanded detailed specifications */}
      {expanded && (
        <div className="flex flex-col gap-3 text-xs border-t border-white/5 pt-3 animate-fade-in">
          
          {/* Signal list */}
          <div className="flex flex-col gap-1 text-[10px]">
            <span className="text-[9px] text-teal font-semibold uppercase tracking-wider">Telemetry Inputs</span>
            {card.triggeringSignals.map((sig, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white/2 p-2 rounded border border-white/5 font-mono text-gray-300">
                <span>Sensor: {sig.metric}</span>
                <span>Value: <strong className="text-white">{sig.value}%</strong></span>
              </div>
            ))}
          </div>

          {/* Primary recommendation instruction */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-teal font-semibold uppercase tracking-wider">Primary Recommendation</span>
            <div className="p-2.5 bg-teal/5 border border-teal/20 rounded-lg text-white font-medium">
              👉 {card.recommendedAction}
            </div>
          </div>

          {/* Confidence Indicator Bar */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] text-gray-400">
              <span>Commander Confidence Score</span>
              <span className="font-mono">{Math.round(card.confidence * 100)}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-teal rounded-full"
                style={{ width: `${card.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Core reasoning chain paragraph */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-gold font-semibold uppercase tracking-wider">Reasoning Chain</span>
            <p className="text-gray-300 leading-relaxed bg-white/2 p-2.5 border border-white/5 rounded-lg text-[10px]">
              {card.reasoning}
            </p>
          </div>

          {/* Alternative routes list */}
          <div className="flex flex-col gap-1 text-[10px] text-gray-400">
            <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">Alternative Protocols</span>
            {card.alternativeActions.map((alt, idx) => (
              <div key={idx}>• {alt}</div>
            ))}
          </div>

          {/* Direct link inspect trace reasoning block */}
          {card.agentTraceId && onInspectTrace && (
            <button
              onClick={() => onInspectTrace(card.agentTraceId!)}
              className="text-[9px] text-teal font-mono tracking-wider uppercase hover:underline text-left cursor-pointer mt-1"
            >
              🔍 Inspect Multi-Agent Reason Trace
            </button>
          )}

        </div>
      )}

      {/* Decision actions bar */}
      <div className="flex justify-between items-center border-t border-white/5 pt-3">
        <div className="text-[10px] text-gray-500">
          Status: <span className={getStatusColor(card.status)}>{card.status.toUpperCase()}</span>
        </div>

        {card.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={() => onRespond(card.id, 'snoozed')}
              className="px-2.5 py-1.5 rounded bg-white/5 border border-white/8 text-[10px] font-semibold text-gray-300 hover:text-white cursor-pointer transition-all duration-150"
            >
              Snooze
            </button>
            <button
              onClick={() => onRespond(card.id, 'dismissed')}
              className="px-2.5 py-1.5 rounded bg-red-950/20 border border-red-500/20 text-[10px] font-semibold text-red-400 hover:bg-red-900/30 cursor-pointer transition-all duration-150"
            >
              Dismiss
            </button>
            <button
              onClick={() => onRespond(card.id, 'accepted')}
              className="px-3 py-1.5 rounded bg-teal text-navy text-[10px] font-bold font-outfit hover:scale-105 cursor-pointer transition-all duration-150"
            >
              Accept Action
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
