import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket.js';
import { TelemetryEvent, ZoneStatus, MatchPhase } from '../types/index.js';

/**
 * Custom hook to subscribe to live simulation telemetry,
 * tracking capacity percentages, trends, and match phases.
 */
export function useSimulator() {
  const [zoneStatuses, setZoneStatuses] = useState<Map<string, ZoneStatus>>(new Map());
  const [currentPhase, setCurrentPhase] = useState<MatchPhase>('pre_match');
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryEvent[]>([]);

  // Fetch baseline zones status on mount
  useEffect(() => {
    fetch('/api/zones')
      .then(res => res.json())
      .then((data: ZoneStatus[]) => {
        const initialMap = new Map<string, ZoneStatus>();
        for (const status of data) {
          initialMap.set(status.zone_id, status);
        }
        setZoneStatuses(initialMap);
      })
      .catch(err => console.warn('Failed to load initial zone statuses:', err));
  }, []);

  // Subscribe to live telemetry streaming channel
  useWebSocket('simulator:telemetry', (event: TelemetryEvent) => {
    // Append to history stack (limit to last 100)
    setTelemetryHistory(prev => {
      const next = [...prev, event];
      if (next.length > 100) next.shift();
      return next;
    });

    // Update specific zone status
    setZoneStatuses(prev => {
      const next = new Map(prev);
      const prevStatus = next.get(event.zone_id);
      
      let occupancyPercent = 0;
      let riskLevel: any = 'LOW';

      if (event.type === 'turnstile_count') {
        occupancyPercent = (event.value / event.capacity) * 100;
        if (occupancyPercent >= 90) riskLevel = 'CRITICAL';
        else if (occupancyPercent >= 80) riskLevel = 'HIGH';
        else if (occupancyPercent >= 60) riskLevel = 'MEDIUM';
      } else if (prevStatus) {
        occupancyPercent = prevStatus.occupancyPercent;
        riskLevel = prevStatus.riskLevel;
      }

      next.set(event.zone_id, {
        zone_id: event.zone_id,
        occupancyPercent: Math.round(occupancyPercent),
        riskLevel,
        trend: prevStatus && occupancyPercent > prevStatus.occupancyPercent ? 'rising' : 'stable',
        etaToThreshold: prevStatus ? prevStatus.etaToThreshold : null,
        lastUpdated: new Date().toISOString()
      });

      return next;
    });
  });

  // Subscribe to match phase timeline updates
  useWebSocket('simulator:phase', (payload: { phase: MatchPhase }) => {
    setCurrentPhase(payload.phase);
  });

  /**
   * Helper translating MatchPhase code into formatted strings.
   */
  const getPhaseLabel = (): string => {
    switch (currentPhase) {
      case 'pre_match': return 'Pre-Match (Warmup)';
      case 'first_half': return 'First Half';
      case 'halftime': return 'Halftime Interval';
      case 'second_half': return 'Second Half';
      case 'post_match': return 'Full Time (Exiting)';
      default: return 'Live operations';
    }
  };

  return {
    zoneStatuses,
    currentPhase,
    phaseLabel: getPhaseLabel(),
    telemetryHistory
  };
}
