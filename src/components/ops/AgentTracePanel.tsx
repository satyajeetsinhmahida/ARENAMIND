import React from 'react';
import { AgentTrace } from '../shared/AgentTrace.js';

export const AgentTracePanel: React.FC = () => {
  return (
    <div className="flex flex-col h-full gap-4 text-xs">
      
      {/* Header controls */}
      <div className="flex justify-between items-center pb-2 border-b border-white/5">
        <div className="flex flex-col">
          <h4 className="font-bold text-white text-sm font-outfit">Live Agent trace pipeline</h4>
          <span className="text-[9px] text-gray-500 font-mono">Telemetry &rarr; Crowd Intel &rarr; Ops Commander</span>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed bg-white/2 p-2.5 border border-white/5 rounded-xl">
        This panel visualizes the real-time reasoning trace step output from the GenAI agent layers as sensors register crowd occupancy shifts.
      </p>

      {/* Render vertical trace cards */}
      <div className="flex-1 overflow-hidden">
        <AgentTrace maxVisible={15} />
      </div>

    </div>
  );
};
