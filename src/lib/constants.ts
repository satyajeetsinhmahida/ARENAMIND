import { StadiumZone } from '../types/index.js';

export const API_BASE = '/api';
export const WS_URL = `ws://${window.location.host}/ws`;

export const COLOR_NAVY = '#0A1628';
export const COLOR_GOLD = '#D4AF37';
export const COLOR_TEAL = '#00D4AA';
export const COLOR_OPS_BG = '#0D1117';

export const RISK_COLORS = {
  LOW: '#22C55E',      // Green
  MEDIUM: '#F59E0B',   // Yellow/Amber
  HIGH: '#EF4444',     // Red
  CRITICAL: '#9333EA'  // Purple/Dark Red
};

// Static definitions of zones for rendering placement coordinates on the SVG map (values as percentages)
export const STADIUM_ZONES_COORDINATES: Record<string, { x: number; y: number; label: string; type: string }> = {
  "Gate-A": { x: 50, y: 10, label: "Gate A", type: "gate" },
  "Gate-B": { x: 82, y: 22, label: "Gate B", type: "gate" },
  "Gate-C": { x: 85, y: 72, label: "Gate C", type: "gate" },
  "Gate-D": { x: 50, y: 88, label: "Gate D", type: "gate" },
  "Gate-E": { x: 15, y: 72, label: "Gate E", type: "gate" },
  "Gate-F": { x: 18, y: 22, label: "Gate F", type: "gate" },
  
  "Concourse-North": { x: 50, y: 25, label: "North Concourse", type: "concourse" },
  "Concourse-East": { x: 70, y: 48, label: "East Concourse", type: "concourse" },
  "Concourse-South": { x: 50, y: 72, label: "South Concourse", type: "concourse" },
  "Concourse-West": { x: 30, y: 48, label: "West Concourse", type: "concourse" },
  
  "Section-100": { x: 50, y: 35, label: "Sec 100", type: "seating" },
  "Section-110": { x: 63, y: 40, label: "Sec 110", type: "seating" },
  "Section-120": { x: 63, y: 57, label: "Sec 120", type: "seating" },
  "Section-130": { x: 37, y: 57, label: "Sec 130", type: "seating" },
  "Section-140": { x: 37, y: 40, label: "Sec 140", type: "seating" },
  
  "Stand-1": { x: 44, y: 20, label: "Burgers", type: "concession" },
  "Stand-2": { x: 74, y: 38, label: "Tacos", type: "concession" },
  "Stand-3": { x: 74, y: 58, label: "Grill", type: "concession" },
  "Stand-4": { x: 44, y: 78, label: "Pizza", type: "concession" },
  "Stand-5": { x: 56, y: 78, label: "Nachos", type: "concession" },
  "Stand-6": { x: 26, y: 38, label: "Brews", type: "concession" },
  "Stand-7": { x: 26, y: 58, label: "Hotdogs", type: "concession" },
  
  "Restroom-N1": { x: 56, y: 20, label: "Restroom N", type: "restroom" },
  "Restroom-E1": { x: 70, y: 30, label: "Restroom E", type: "restroom" },
  "Restroom-S1": { x: 50, y: 81, label: "Restroom S", type: "restroom" },
  "Restroom-W1": { x: 30, y: 64, label: "Restroom W", type: "restroom" },
  
  "VIP-Club": { x: 20, y: 48, label: "VIP Club", type: "vip" },
  "Medical-1": { x: 34, y: 25, label: "First Aid 1", type: "medical" },
  "Medical-2": { x: 66, y: 71, label: "First Aid 2", type: "medical" }
};
