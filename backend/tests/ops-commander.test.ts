import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpsCommanderAgent } from '../src/agents/ops-commander.js';
import { AgentOrchestrator } from '../src/agents/orchestrator.js';
import { CrowdIntelEvent } from '../src/types/index.js';
import { initDb } from '../src/db/store.js';

// Setup database mocking/in-memory for tests
beforeEach(() => {
  initDb(':memory:');
});

describe('OpsCommanderAgent Unit Tests', () => {
  let agent: OpsCommanderAgent;
  let mockOrchestrator: any;

  beforeEach(() => {
    mockOrchestrator = {
      generateResponse: vi.fn().mockResolvedValue({
        response: "Enriched operations recommendation logic.",
        traceId: "test-trace-uuid"
      }),
      logTrace: vi.fn()
    };
    agent = new OpsCommanderAgent(mockOrchestrator as any);
  });

  const createIntelEvent = (riskLevel: 'HIGH' | 'CRITICAL', isAnomaly: boolean = false): CrowdIntelEvent => ({
    id: 'intel-uuid',
    timestamp: new Date().toISOString(),
    zone_id: 'Gate-C',
    riskLevel,
    etaToThreshold: 12,
    currentOccupancyPercent: 88,
    trendDirection: 'rising',
    rateOfChange: 4.5,
    recommendedAction: 'Open overflow barriers.',
    reasoning: 'Steady gate surge.',
    isAnomaly
  });

  it('should construct ActionCard with correct urgency and properties', async () => {
    const intel = createIntelEvent('HIGH');
    const card = await agent.processEvent(intel);

    expect(card).not.toBeNull();
    expect(card.urgency).toBe('HIGH');
    expect(card.zoneId).toBe('Gate-C');
    expect(card.status).toBe('pending');
    expect(card.recommendedAction).toBe('Open overflow barriers.');
    expect(card.confidence).toBe(0.85);
    expect(card.reasoning).toBe("Enriched operations recommendation logic.");
  });

  it('should transition status and log decisions on staff responses', async () => {
    const intel = createIntelEvent('CRITICAL');
    const card = await agent.processEvent(intel);
    
    agent.respondToAction(card.id, 'accepted', 'chief_officer');

    const feed = agent.getActionFeed();
    const updatedCard = feed.find(c => c.id === card.id);
    
    expect(updatedCard?.status).toBe('accepted');
    expect(updatedCard?.respondedBy).toBe('chief_officer');
    expect(updatedCard?.respondedAt).toBeDefined();
  });
});
