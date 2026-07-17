import React from 'react';
import { StadiumMap } from '../shared/StadiumMap.js';
import { ZoneStatus } from '../../types/index.js';
import { RISK_COLORS } from '../../lib/constants.js';

interface HeatMapProps {
  zones: Map<string, ZoneStatus>;
  onZoneSelect: (zoneId: string) => void;
}

export const HeatMap: React.FC<HeatMapProps> = ({ zones, onZoneSelect }) => {
  return (
    <div className="flex flex-col h-full gap-4">
      
      {/* Legend markers */}
      <div className="flex justify-between items-center bg-white/2 p-3 border border-white/5 rounded-xl text-[10px] text-gray-400">
        <span className="font-semibold text-white">Zone Capacity Heat Map</span>
        <div className="flex gap-4">
          <div className="flex gap-1.5 items-center">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS.LOW }} />
            <span>&lt; 60%</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS.MEDIUM }} />
            <span>60% - 80%</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS.HIGH }} />
            <span>80% - 90%</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS.CRITICAL }} />
            <span>&gt; 90%</span>
          </div>
        </div>
      </div>

      {/* Actual SVG Stadium map variant */}
      <div className="flex-1 glass rounded-2xl relative flex items-center justify-center p-2">
        <StadiumMap
          zones={zones}
          onZoneClick={onZoneSelect}
          variant="ops"
          className="w-full max-w-[800px] border-none"
        />
      </div>

    </div>
  );
};
