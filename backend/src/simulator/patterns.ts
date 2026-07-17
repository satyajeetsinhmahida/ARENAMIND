import { MatchPhase, ZoneType } from '../types/index.js';

interface TelemetryPattern {
  expectedOccupancyPercent: number;
  expectedQueueLength?: number;
  expectedRestroomPercent?: number;
}

/**
 * Baseline patterns representing stadium crowd behavior during various match phases.
 */
export const PHASE_PATTERNS: Record<MatchPhase, Record<ZoneType, TelemetryPattern>> = {
  pre_match: {
    gate: { expectedOccupancyPercent: 65, expectedQueueLength: 25 },
    seating: { expectedOccupancyPercent: 30 },
    concourse: { expectedOccupancyPercent: 40 },
    concession: { expectedOccupancyPercent: 50, expectedQueueLength: 12 },
    restroom: { expectedOccupancyPercent: 35, expectedRestroomPercent: 35 },
    vip: { expectedOccupancyPercent: 45 },
    medical: { expectedOccupancyPercent: 5 },
    exit: { expectedOccupancyPercent: 5 }
  },
  first_half: {
    gate: { expectedOccupancyPercent: 5, expectedQueueLength: 1 },
    seating: { expectedOccupancyPercent: 92 },
    concourse: { expectedOccupancyPercent: 15 },
    concession: { expectedOccupancyPercent: 20, expectedQueueLength: 4 },
    restroom: { expectedOccupancyPercent: 20, expectedRestroomPercent: 20 },
    vip: { expectedOccupancyPercent: 75 },
    medical: { expectedOccupancyPercent: 10 },
    exit: { expectedOccupancyPercent: 2 }
  },
  halftime: {
    gate: { expectedOccupancyPercent: 2, expectedQueueLength: 0 },
    seating: { expectedOccupancyPercent: 45 },
    concourse: { expectedOccupancyPercent: 85 },
    concession: { expectedOccupancyPercent: 95, expectedQueueLength: 35 },
    restroom: { expectedOccupancyPercent: 90, expectedRestroomPercent: 90 },
    vip: { expectedOccupancyPercent: 85 },
    medical: { expectedOccupancyPercent: 15 },
    exit: { expectedOccupancyPercent: 2 }
  },
  second_half: {
    gate: { expectedOccupancyPercent: 2, expectedQueueLength: 0 },
    seating: { expectedOccupancyPercent: 90 },
    concourse: { expectedOccupancyPercent: 12 },
    concession: { expectedOccupancyPercent: 25, expectedQueueLength: 5 },
    restroom: { expectedOccupancyPercent: 25, expectedRestroomPercent: 25 },
    vip: { expectedOccupancyPercent: 80 },
    medical: { expectedOccupancyPercent: 12 },
    exit: { expectedOccupancyPercent: 10 }
  },
  post_match: {
    gate: { expectedOccupancyPercent: 5, expectedQueueLength: 0 },
    seating: { expectedOccupancyPercent: 20 },
    concourse: { expectedOccupancyPercent: 70 },
    concession: { expectedOccupancyPercent: 5, expectedQueueLength: 0 },
    restroom: { expectedOccupancyPercent: 15, expectedRestroomPercent: 15 },
    vip: { expectedOccupancyPercent: 40 },
    medical: { expectedOccupancyPercent: 8 },
    exit: { expectedOccupancyPercent: 95 }
  }
};

/**
 * Returns a value with Gaussian/Normal noise added.
 */
export function addNoise(value: number, variancePercent: number = 10): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2); // Box-Muller transform
  const stdDev = value * (variancePercent / 100);
  const result = value + randStdNormal * stdDev;
  return Math.max(0, Math.round(result));
}

/**
 * Returns a specific multiplier based on zone type or location.
 * Helps represent VIP lounges vs General seats.
 */
export function getZoneMultiplier(zoneId: string): number {
  if (zoneId.includes('VIP')) return 0.6; // Muted density variations
  if (zoneId.includes('Section-120')) return 1.25; // Heavily crowded section
  if (zoneId.includes('Gate-C')) return 1.3; // MetLife main regional train entrance
  return 1.0;
}
