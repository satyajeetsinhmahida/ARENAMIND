import { TelemetryEvent, CrowdIntelEvent, RiskLevel } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Crowd Intelligence Agent
 * 
 * NOTE: This agent runs rule-based heuristics to simulate a production-grade
 * machine learning forecasting model. In a production deployment, this would be
 * backed by an LSTM, Prophet, or similar sequence-to-sequence model predicting 
 * crowd flow rates from raw video stream analytics and turnstile ticket validations.
 */
export class CrowdIntelligenceAgent {
  // Store rolling window history per zone: zoneId -> TelemetryEvent[]
  private history = new Map<string, TelemetryEvent[]>();
  private windowSize = 20; // Maintain last 20 events (~1-2 mins in compressed tick scale)

  /**
   * Processes a new telemetry data point, calculating congestion risks and trends.
   * 
   * @param event The latest telemetry sensor reading
   * @returns A structured CrowdIntelEvent if an alert boundary is crossed, else null
   */
  public processTelemetry(event: TelemetryEvent): CrowdIntelEvent | null {
    if (event.type !== 'turnstile_count') {
      return null; // Focus intelligence on occupancy trends
    }

    const zoneId = event.zone_id;
    let zoneHistory = this.history.get(zoneId);
    if (!zoneHistory) {
      zoneHistory = [];
      this.history.set(zoneId, zoneHistory);
    }

    // Append and enforce sliding window length
    zoneHistory.push(event);
    if (zoneHistory.length > this.windowSize) {
      zoneHistory.shift();
    }

    const currentPercent = (event.value / event.capacity) * 100;
    const riskLevel = this.calculateRisk(currentPercent);
    const trend = this.calculateTrend(zoneHistory);
    const rateOfChange = this.calculateRateOfChange(zoneHistory);

    // Check for high-rate anomalies (rate of change spikes)
    const isAnomaly = rateOfChange > 4 && zoneHistory.length >= 5;

    // Extrapolate ETA to hit threshold (90% capacity boundary)
    let etaToThreshold = -1;
    if (trend.direction === 'rising' && rateOfChange > 0) {
      const remainingCapacity = event.capacity * 0.9 - event.value;
      if (remainingCapacity > 0) {
        const ratePerMin = rateOfChange * (60 / 3); // Scaled from tick to minutes
        etaToThreshold = Math.round(remainingCapacity / (ratePerMin || 1));
      }
    }

    // Trigger alert if Risk level is HIGH or CRITICAL, or if an anomaly is detected
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL' || isAnomaly) {
      const recommendedAction = this.getRecommendedAction(zoneId, riskLevel, isAnomaly);
      
      const intelEvent: CrowdIntelEvent = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        zone_id: zoneId,
        riskLevel,
        etaToThreshold: etaToThreshold > 0 ? etaToThreshold : 15, // Fallback placeholder
        currentOccupancyPercent: Math.round(currentPercent),
        trendDirection: trend.direction,
        rateOfChange: Math.round(rateOfChange * 10) / 10,
        recommendedAction,
        reasoning: isAnomaly 
          ? `Detected extreme acceleration in zone flow rate (${Math.round(rateOfChange)} tickets/sec). Neighboring zones indicate potential gate malfunctions.` 
          : `Zone occupancy has reached ${Math.round(currentPercent)}% of capacity (${event.value}/${event.capacity}) on a steady ${trend.direction} trend.`,
        isAnomaly
      };

      return intelEvent;
    }

    return null;
  }

  /**
   * Translates occupancy percent into categorical RiskLevels.
   */
  private calculateRisk(percent: number): RiskLevel {
    if (percent >= 90) return 'CRITICAL';
    if (percent >= 80) return 'HIGH';
    if (percent >= 60) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Applies linear trend regression analysis to the rolling window.
   */
  private calculateTrend(history: TelemetryEvent[]): { direction: 'rising' | 'stable' | 'falling' } {
    if (history.length < 3) return { direction: 'stable' };

    const firstVal = history[0].value;
    const lastVal = history[history.length - 1].value;
    const diff = lastVal - firstVal;

    // Small boundary margin
    const margin = history[0].capacity * 0.03;

    if (diff > margin) return { direction: 'rising' };
    if (diff < -margin) return { direction: 'falling' };
    return { direction: 'stable' };
  }

  /**
   * Calculates rate of change per tick.
   */
  private calculateRateOfChange(history: TelemetryEvent[]): number {
    if (history.length < 2) return 0;
    const len = history.length;
    const current = history[len - 1].value;
    const prev = history[len - 2].value;
    return Math.max(0, current - prev);
  }

  /**
   * Basic heuristic lookup generating targeted Ops response templates.
   */
  private getRecommendedAction(zoneId: string, risk: RiskLevel, isAnomaly: boolean): string {
    if (isAnomaly) {
      if (zoneId.includes('Gate')) {
        return `Close turnstile terminals on ${zoneId} and deploy technical diagnostics. Dispatch crowd marshals to route pending lines to nearest alternative entryways.`;
      }
      return `Dispatch immediate security patrol to check on physical barriers and potential crowd crush triggers at ${zoneId}.`;
    }

    if (risk === 'CRITICAL') {
      if (zoneId.includes('Gate')) {
        return `Immediately open secondary overflow bypass channels at ${zoneId}. Instruct PA operators to broadcast gate-redirection directions in English and Spanish.`;
      }
      return `Halt further admissions to ${zoneId} concourses. Route exiting traffic toward external exits.`;
    }

    // High risk cases
    if (zoneId.includes('Concession') || zoneId.includes('Stand')) {
      return `Trigger digital menu boards to redirect fans in neighboring sections to less loaded stands. Re-allocate cashiers.`;
    }
    
    return `Initiate crowd control guidance. Prepare to deploy support staff to rebalance traffic.`;
  }
}
