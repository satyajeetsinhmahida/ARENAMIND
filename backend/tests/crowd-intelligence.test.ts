import { describe, it, expect, beforeEach } from 'vitest';
import { CrowdIntelligenceAgent } from '../src/agents/crowd-intelligence.js';
import { TelemetryEvent } from '../src/types/index.js';

describe('CrowdIntelligenceAgent Unit Tests', () => {
  let agent: CrowdIntelligenceAgent;

  beforeEach(() => {
    agent = new CrowdIntelligenceAgent();
  });

  const createEvent = (value: number, capacity: number = 1000): TelemetryEvent => ({
    timestamp: new Date().toISOString(),
    zone_id: 'Section-120',
    type: 'turnstile_count',
    value,
    capacity
  });

  it('should evaluate low risk occupancy correctly', () => {
    const event = createEvent(400); // 40%
    const intelEvent = agent.processTelemetry(event);
    expect(intelEvent).toBeNull(); // Alerts trigger >= 80% or anomaly
  });

  it('should trigger alert at HIGH threshold (>= 80%)', () => {
    const event = createEvent(820); // 82%
    const intelEvent = agent.processTelemetry(event);
    
    expect(intelEvent).not.toBeNull();
    expect(intelEvent?.riskLevel).toBe('HIGH');
    expect(intelEvent?.currentOccupancyPercent).toBe(82);
    expect(intelEvent?.isAnomaly).toBe(false);
  });

  it('should trigger alert at CRITICAL threshold (>= 90%)', () => {
    const event = createEvent(910); // 91%
    const intelEvent = agent.processTelemetry(event);
    
    expect(intelEvent).not.toBeNull();
    expect(intelEvent?.riskLevel).toBe('CRITICAL');
    expect(intelEvent?.currentOccupancyPercent).toBe(91);
  });

  it('should calculate rising trend direction', () => {
    agent.processTelemetry(createEvent(100));
    agent.processTelemetry(createEvent(200));
    const finalEvent = agent.processTelemetry(createEvent(800)); // Ramped up to 80%
    
    expect(finalEvent).not.toBeNull();
    expect(finalEvent?.trendDirection).toBe('rising');
  });

  it('should detect rate-of-change anomaly spikes correctly', () => {
    // Populate sliding window with small changes
    agent.processTelemetry(createEvent(100));
    agent.processTelemetry(createEvent(105));
    agent.processTelemetry(createEvent(110));
    agent.processTelemetry(createEvent(115));
    // Trigger exponential spike
    const spikeEvent = createEvent(500); // Massive acceleration surge
    const intelEvent = agent.processTelemetry(spikeEvent);

    expect(intelEvent).not.toBeNull();
    expect(intelEvent?.isAnomaly).toBe(true);
    expect(intelEvent?.reasoning).toContain('acceleration');
  });
});
