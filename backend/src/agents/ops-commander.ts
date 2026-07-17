import { CrowdIntelEvent, ActionCard, UrgencyLevel, TriggeringSignal } from '../types/index.js';
import { AgentOrchestrator } from './orchestrator.js';
import { saveActionResponse } from '../db/store.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Operations Commander Agent
 * 
 * Staff-facing coordinator that converts Crowd Intelligence warnings
 * and anomalies into actionable cards with clear reasoning chains.
 */
export class OpsCommanderAgent {
  private orchestrator: AgentOrchestrator;
  private pendingActions = new Map<string, ActionCard>();

  constructor(orchestrator: AgentOrchestrator) {
    this.orchestrator = orchestrator;
  }

  /**
   * Processes a Crowd Intelligence alert, generating a prioritized action card.
   * 
   * @param intelEvent Warning details from Agent 2
   * @returns Populated ActionCard
   */
  public async processEvent(intelEvent: CrowdIntelEvent): Promise<ActionCard> {
    const cardId = uuidv4();
    const urgency = this.mapRiskToUrgency(intelEvent.riskLevel);
    
    // Build triggering metrics
    const signal: TriggeringSignal = {
      source: "Crowd Intelligence Agent",
      metric: "occupancy_percent",
      value: intelEvent.currentOccupancyPercent,
      threshold: 80,
      zone_id: intelEvent.zone_id
    };

    // Standard structural values
    const title = intelEvent.isAnomaly
      ? `🚨 ANOMALY: ${intelEvent.zone_id} Surge Detected!`
      : `⚠️ Density Alert: ${intelEvent.zone_id} Bottleneck Warning`;

    const description = intelEvent.isAnomaly
      ? `Simulated IoT camera streams and turnstile counts show an exponential spike in traffic rate at ${intelEvent.zone_id}. This represents a potential crowd bottleneck.`
      : `Congestion is steadily rising at ${intelEvent.zone_id}. Occupancy is currently at ${intelEvent.zone_id} capacity threshold.`;

    const alternativeActions = [
      `Broadcast PA announcements diverting incoming fans away from ${intelEvent.zone_id}`,
      `Dispatch operations marshals to manually guide pedestrian traffic flows`,
      `Snooze this alert for 5 minutes while monitoring queue telemetry`
    ];

    const confidence = intelEvent.isAnomaly ? 0.94 : 0.85;

    // Use LLM to enrich reasoning chain if available, else fall back to template
    let reasoning = intelEvent.reasoning;
    let agentTraceId: string | undefined;

    try {
      const llmInput = `
Alert Event Details:
- Zone: ${intelEvent.zone_id}
- Occupancy: ${intelEvent.currentOccupancyPercent}%
- Trend: ${intelEvent.trendDirection}
- Rate of change: ${intelEvent.rateOfChange}/sec
- Primary recommendation: ${intelEvent.recommendedAction}
`;

      const result = await this.orchestrator.generateResponse(
        'ops-commander',
        `Evaluate this alert and write a concise, professional operations reasoning paragraph for stadium commanders. Explain which telemetry patterns led to this warning.`,
        [],
        llmInput
      );
      reasoning = result.response;
      agentTraceId = result.traceId;
    } catch (err) {
      console.warn('Ops commander LLM enrichment failed, using local reasoning template.');
      reasoning = `Based on telemetry logs, occupancy at ${intelEvent.zone_id} is rising steadily. Standard operations guidelines suggest activating overflow gates and rebalancing lanes to reduce wait times.`;
    }

    const actionCard: ActionCard = {
      id: cardId,
      timestamp: new Date().toISOString(),
      title,
      description,
      urgency,
      triggeringSignals: [signal],
      recommendedAction: intelEvent.recommendedAction,
      alternativeActions,
      confidence,
      reasoning,
      status: 'pending',
      zoneId: intelEvent.zone_id,
      agentTraceId
    };

    // Save in pending action map
    this.pendingActions.set(cardId, actionCard);

    // Broadcast new action card via WebSocket
    if ((global as any).broadcastWS) {
      (global as any).broadcastWS('ops:action', actionCard);
    }

    return actionCard;
  }

  /**
   * Logs a staff decision (accept/dismiss/snooze) and saves it to the database logs.
   * 
   * @param id Action card ID
   * @param response Staff choice
   * @param staffRole Logged role of the command staff member
   */
  public respondToAction(id: string, response: 'accepted' | 'dismissed' | 'snoozed', staffRole: string): void {
    const card = this.pendingActions.get(id);
    if (!card) {
      console.warn(`Action Card ${id} not found in pending feed.`);
      return;
    }

    card.status = response;
    card.respondedAt = new Date().toISOString();
    card.respondedBy = staffRole;

    // Save to SQLite audit log
    saveActionResponse({
      id: uuidv4(),
      actionCardId: id,
      staffRole,
      response,
      notes: `Staff clicked ${response} on recommendation card: "${card.title}"`,
      timestamp: card.respondedAt
    });

    // Broadcast updated action card
    if ((global as any).broadcastWS) {
      (global as any).broadcastWS('ops:action_update', card);
    }
  }

  /**
   * Maps CrowdIntel risk categories into operations Urgency levels.
   */
  private mapRiskToUrgency(risk: intelEvent['riskLevel']): UrgencyLevel {
    if (risk === 'CRITICAL') return 'CRITICAL';
    if (risk === 'HIGH') return 'HIGH';
    if (risk === 'MEDIUM') return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Returns current pending operations feed.
   */
  public getActionFeed(): ActionCard[] {
    return Array.from(this.pendingActions.values());
  }
}
