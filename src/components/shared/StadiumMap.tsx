import React, { useState } from 'react';
import { ZoneStatus } from '../../types/index.js';
import { STADIUM_ZONES_COORDINATES, RISK_COLORS } from '../../lib/constants.js';

interface StadiumMapProps {
  zones: Map<string, ZoneStatus>;
  onZoneClick?: (zoneId: string) => void;
  variant: 'fan' | 'ops';
  className?: string;
}

export const StadiumMap: React.FC<StadiumMapProps> = ({
  zones,
  onZoneClick,
  variant,
  className = ''
}) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Helper resolving background fill color based on capacity risk metrics
  const getZoneColor = (zoneId: string, status?: ZoneStatus): string => {
    if (variant === 'fan') {
      // Fan variant is slightly more muted, prioritizing navigation highlight
      if (hoveredZone === zoneId) return 'rgba(0, 212, 170, 0.45)'; // Teal accent on hover
      if (status?.riskLevel === 'CRITICAL') return 'rgba(147, 51, 234, 0.25)';
      if (status?.riskLevel === 'HIGH') return 'rgba(239, 68, 68, 0.25)';
      return 'rgba(255, 255, 255, 0.05)';
    }

    // Command dashboard gets clear heat mapping colors
    if (!status) return 'rgba(255, 255, 255, 0.06)';
    const percent = status.occupancyPercent;

    if (percent >= 90) return 'rgba(147, 51, 234, 0.7)'; // Critical Purple
    if (percent >= 80) return 'rgba(239, 68, 68, 0.75)'; // High Red
    if (percent >= 60) return 'rgba(245, 158, 11, 0.7)';  // Medium Amber
    return 'rgba(34, 197, 94, 0.6)';                      // Low Green
  };

  return (
    <div className={`relative w-full aspect-[4/3] glass-dark rounded-2xl border border-white/5 p-4 overflow-hidden select-none ${className}`}>
      
      {/* Stadium Oval SVG representation */}
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full"
        aria-label="Interactive Stadium Map Layout"
        role="img"
      >
        <defs>
          <radialGradient id="field-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f3d24" />
            <stop offset="100%" stopColor="#061e12" />
          </radialGradient>
        </defs>

        {/* Outer Stadium Ring boundary */}
        <ellipse
          cx="400"
          cy="300"
          rx="380"
          ry="270"
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="6"
        />

        {/* Mid Stadium Ring boundary */}
        <ellipse
          cx="400"
          cy="300"
          rx="300"
          ry="210"
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="2"
        />

        {/* Inner Pitch (Green Field) */}
        <ellipse
          cx="400"
          cy="300"
          rx="180"
          ry="110"
          fill="url(#field-glow)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="2"
        />
        {/* Field lines */}
        <line x1="400" y1="190" x2="400" y2="410" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2" />
        <ellipse cx="400" cy="300" rx="35" ry="25" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2" />

        {/* Render Zones */}
        {Object.entries(STADIUM_ZONES_COORDINATES).map(([id, coord]) => {
          const status = zones.get(id);
          const px = (coord.x / 100) * 800;
          const py = (coord.y / 100) * 600;

          // Determine shape/radius based on type
          let element: React.ReactNode;
          const fill = getZoneColor(id, status);

          const isCritical = status?.riskLevel === 'CRITICAL';

          if (coord.type === 'gate') {
            // Render gates as external capsule loops
            element = (
              <rect
                x={px - 22}
                y={py - 12}
                width="44"
                height="24"
                rx="6"
                fill={fill}
                stroke={hoveredZone === id ? '#00D4AA' : 'rgba(255, 255, 255, 0.25)'}
                strokeWidth={hoveredZone === id ? 2 : 1.2}
                className={`transition-all duration-200 cursor-pointer ${isCritical ? 'critical-pulse' : ''}`}
                onClick={() => onZoneClick?.(id)}
                onMouseEnter={() => setHoveredZone(id)}
                onMouseLeave={() => setHoveredZone(null)}
                aria-label={`Gate entryway: ${coord.label}`}
                role="button"
              />
            );
          } else if (coord.type === 'seating') {
            // Render major seating blocks as curved segments
            element = (
              <rect
                x={px - 45}
                y={py - 25}
                width="90"
                height="50"
                rx="8"
                fill={fill}
                stroke={hoveredZone === id ? '#00D4AA' : 'rgba(255, 255, 255, 0.1)'}
                strokeWidth={hoveredZone === id ? 2 : 1}
                className="transition-all duration-200 cursor-pointer"
                onClick={() => onZoneClick?.(id)}
                onMouseEnter={() => setHoveredZone(id)}
                onMouseLeave={() => setHoveredZone(null)}
                aria-label={`Seating Section: ${coord.label}`}
                role="button"
              />
            );
          } else if (coord.type === 'concession' || coord.type === 'restroom') {
            // Render stands and restrooms as small circles
            element = (
              <circle
                cx={px}
                cy={py}
                r={15}
                fill={fill}
                stroke={hoveredZone === id ? '#00D4AA' : 'rgba(255, 255, 255, 0.15)'}
                strokeWidth={hoveredZone === id ? 2 : 1}
                className="transition-all duration-200 cursor-pointer"
                onClick={() => onZoneClick?.(id)}
                onMouseEnter={() => setHoveredZone(id)}
                onMouseLeave={() => setHoveredZone(null)}
                aria-label={`${coord.type === 'restroom' ? 'Restroom' : 'Concessions'}: ${coord.label}`}
                role="button"
              />
            );
          } else {
            // Concourse nodes
            element = (
              <ellipse
                cx={px}
                cy={py}
                rx="60"
                ry="30"
                fill={fill}
                stroke={hoveredZone === id ? '#00D4AA' : 'rgba(255, 255, 255, 0.05)'}
                strokeWidth={hoveredZone === id ? 1.8 : 1}
                className="transition-all duration-200 cursor-pointer"
                onClick={() => onZoneClick?.(id)}
                onMouseEnter={() => setHoveredZone(id)}
                onMouseLeave={() => setHoveredZone(null)}
                aria-label={`Concourse Zone: ${coord.label}`}
                role="button"
              />
            );
          }

          return (
            <g key={id}>
              {element}
              {/* Text labels on SVG */}
              <text
                x={px}
                y={coord.type === 'gate' ? py + 4 : py + 3}
                fill="#ffffff"
                fontSize={coord.type === 'gate' || coord.type === 'concession' || coord.type === 'restroom' ? "10" : "11"}
                fontWeight="500"
                textAnchor="middle"
                className="pointer-events-none fill-white opacity-85 select-none"
              >
                {coord.type === 'concession' && id.includes('-') ? id.split('-')[1] : coord.label.split(' ').pop()}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Render hover tooltips dynamically */}
      {hoveredZone && zones.has(hoveredZone) && (
        <div
          className="absolute glass-dark rounded-lg p-3 text-xs border border-white/10 shadow-xl pointer-events-none animate-fade-in"
          style={{
            left: `${STADIUM_ZONES_COORDINATES[hoveredZone].x}%`,
            top: `${STADIUM_ZONES_COORDINATES[hoveredZone].y - 12}%`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-semibold text-white mb-1">
            {STADIUM_ZONES_COORDINATES[hoveredZone].label}
          </div>
          <div className="flex gap-2 justify-between">
            <span className="text-gray-400">Occupancy:</span>
            <span className={`font-semibold ${zones.get(hoveredZone)!.occupancyPercent >= 80 ? 'text-red-400 font-bold' : 'text-green-400'}`}>
              {zones.get(hoveredZone)!.occupancyPercent}%
            </span>
          </div>
          <div className="flex gap-2 justify-between mt-0.5">
            <span className="text-gray-400">Risk Level:</span>
            <span className="font-semibold text-white">
              {zones.get(hoveredZone)!.riskLevel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
