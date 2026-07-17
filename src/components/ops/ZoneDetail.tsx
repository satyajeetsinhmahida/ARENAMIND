import React from 'react';
import { ZoneStatus } from '../../types/index.js';
import { RISK_COLORS } from '../../lib/constants.js';

interface ZoneDetailProps {
  zoneId: string;
  status: ZoneStatus | undefined;
  onClose: () => void;
}

export const ZoneDetail: React.FC<ZoneDetailProps> = ({ zoneId, status, onClose }) => {
  if (!status) return null;

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in text-xs">
      
      {/* Detail header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <div className="flex flex-col">
          <h4 className="font-bold text-white text-sm font-outfit">{zoneId}</h4>
          <span className="text-[9px] text-gray-400">MetLife Stadium Telemetry Node</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Numerical occupancy load */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass p-3 rounded-xl border border-white/5 flex flex-col gap-1">
          <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Occupancy</span>
          <span className="text-xl font-bold font-mono text-white">{status.occupancyPercent}%</span>
        </div>

        <div className="glass p-3 rounded-xl border border-white/5 flex flex-col gap-1">
          <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Risk Level</span>
          <span
            className="text-sm font-bold font-mono px-2 py-0.5 rounded self-start mt-0.5"
            style={{ backgroundColor: `${RISK_COLORS[status.riskLevel]}20`, color: RISK_COLORS[status.riskLevel] }}
          >
            {status.riskLevel}
          </span>
        </div>
      </div>

      {/* Capacity threshold meter bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>Capacity Threshold Load</span>
          <span className="font-mono">{status.occupancyPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${status.occupancyPercent}%`,
              backgroundColor: RISK_COLORS[status.riskLevel]
            }}
          />
        </div>
      </div>

      {/* Adjacencies & routing alternatives */}
      <div className="flex flex-col gap-2 mt-2">
        <span className="text-[9px] text-teal font-semibold uppercase tracking-wider">Adjacency Routes</span>
        <div className="p-2.5 glass-light rounded-lg text-gray-300 font-mono text-[10px] flex flex-wrap gap-1.5">
          {["Concourse-North", "Section-110", "Section-120", "Stand-2"].map(adj => (
            <span key={adj} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/8">
              {adj}
            </span>
          ))}
        </div>
      </div>

      {/* Mock time-series graph representation (required SVG line chart in spec) */}
      <div className="flex flex-col gap-2 mt-2">
        <span className="text-[9px] text-teal font-semibold uppercase tracking-wider">Rolling Capacity Trend (15m)</span>
        <div className="w-full h-28 glass-light border border-white/5 rounded-xl p-2 relative overflow-hidden">
          {/* Trend graph SVG */}
          <svg className="w-full h-full" viewBox="0 0 200 80">
            <polyline
              fill="none"
              stroke="#00D4AA"
              strokeWidth="2"
              points="10,60 30,55 50,68 70,45 90,40 110,35 130,22 150,18 170,12 190,10"
              strokeLinecap="round"
            />
            {/* Limit mark */}
            <line x1="0" y1="18" x2="200" y2="18" stroke="rgba(239, 68, 68, 0.4)" strokeDasharray="3 3" />
          </svg>
        </div>
      </div>

    </div>
  );
};
