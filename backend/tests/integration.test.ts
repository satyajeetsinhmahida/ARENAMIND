import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrowdIntelligenceAgent } from '../src/agents/crowd-intelligence.js';
import { OpsCommanderAgent } from '../src/agents/ops-commander.js';
import { TelemetryEvent } from '../src/types/index.js';
import { initDb } from '../src/db/store.js';

beforeEach(() => {
  initDb(':memory:');
});

describe('ArenaMind Backend Integration Tests', () => {
  let crowdAgent: CrowdIntelligenceAgent;
  let opsAgent: OpsCommanderAgent;
  let mockOrchestrator: any;

  beforeEach(() => {
    mockOrchestrator = {
      generateResponse: vi.fn().mockResolvedValue({
        response: "Enriched operations recommendation logic.",
        traceId: "test-trace-uuid"
      })
    };
    crowdAgent = new CrowdIntelligenceAgent();
    opsAgent = new OpsCommanderAgent(mockOrchestrator);
  });

  it('should run end-to-end telemetry event pipeline and generate Ops recommendation', async () => {
    // 1. Simulate sequential telemetry updates of a gate congestion surge
    const surgeTelemetry1: TelemetryEvent = {
      timestamp: new Date().toISOString(),
      zone_id: "Gate-C",
      type: "turnstile_count",
      value: 300,
      capacity: 1000
    };

    const surgeTelemetry2: TelemetryEvent = {
      timestamp: new Date().toISOString(),
      zone_id: "Gate-C",
      type: "turnstile_count",
      value: 650,
      capacity: 1000
    };

    const surgeTelemetrySpike: TelemetryEvent = {
      timestamp: new Date().toISOString(),
      zone_id: "Gate-C",
      type: "turnstile_count",
      value: 920, // Hits 92% capacity (CRITICAL risk + rising trend)
      capacity: 1000
    };

    // 2. Feed telemetry events to Crowd Intelligence (Agent 2)
    crowdAgent.processTelemetry(surgeTelemetry1);
    crowdAgent.processTelemetry(surgeTelemetry2);
    const intelEvent = crowdAgent.processTelemetry(surgeTelemetrySpike);

    // Assert that Crowd Intelligence flagged a warning event
    expect(intelEvent).not.toBeNull();
    expect(intelEvent?.riskLevel).toBe('CRITICAL');
    expect(intelEvent?.zone_id).toBe('Gate-C');
    expect(intelEvent?.currentOccupancyPercent).toBe(92);

    // 3. Forward the generated intelligence event to Ops Commander (Agent 3)
    const actionCard = await opsAgent.processEvent(intelEvent!);

    // Assert that Ops Commander produced a prioritized Action Card
    expect(actionCard).toBeDefined();
    expect(actionCard.urgency).toBe('CRITICAL');
    expect(actionCard.zoneId).toBe('Gate-C');
    expect(actionCard.status).toBe('pending');
    expect(actionCard.triggeringSignals[0].value).toBe(92);
    
    // Assert recommendation options exist
    expect(actionCard.recommendedAction).toContain('open secondary');
    expect(actionCard.alternativeActions.length).toBeGreaterThan(1);
  });
});
