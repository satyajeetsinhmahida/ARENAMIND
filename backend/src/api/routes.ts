import { Router, Request, Response } from 'express';
import { FanConciergeAgent } from '../agents/fan-concierge.js';
import { OpsCommanderAgent } from '../agents/ops-commander.js';
import { SafetyAgent } from '../agents/safety-accessibility.js';
import { getAuditLog } from '../db/store.js';
import { searchKnowledge } from '../rag/knowledge-base.js';
import { SimulatorEngine } from '../simulator/engine.js';
import { chatRateLimiter, sanitizeInput } from './middleware.js';
import { Language, AccessibilityMode } from '../types/index.js';

let simulator: SimulatorEngine;
let fanAgent: FanConciergeAgent;
let opsAgent: OpsCommanderAgent;
let safetyAgent: SafetyAgent;

/**
 * Initializes and wires Express controllers to agents.
 */
export function initRoutes(
  simInstance: SimulatorEngine,
  fanInstance: FanConciergeAgent,
  opsInstance: OpsCommanderAgent,
  safetyInstance: SafetyAgent
): Router {
  simulator = simInstance;
  fanAgent = fanInstance;
  opsAgent = opsInstance;
  safetyAgent = safetyInstance;

  const router = Router();

  // ─── Fan Concierge Chat (Streaming SSE) ──────────────────────────────────────────

  router.post('/chat', chatRateLimiter, sanitizeInput, async (req: Request, res: Response) => {
    const { message, sessionId, language, accessibilityMode } = req.body;

    if (!message || !sessionId) {
      res.status(400).json({ error: "Missing message or sessionId body parameter." });
      return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      await fanAgent.handleMessage(
        message,
        sessionId,
        (language as Language) || 'en',
        (accessibilityMode as AccessibilityMode) || 'standard',
        (token: string) => {
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }
      );
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      console.error('Error handling fan agent chat stream:', err);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate response." })}\n\n`);
      res.end();
    }
  });

  // ─── Safety SOS Panic Alert ──────────────────────────────────────────────────────

  router.post('/emergency', sanitizeInput, async (req: Request, res: Response) => {
    const { message, location, sessionId } = req.body;

    if (!location || !sessionId) {
      res.status(400).json({ error: "Missing location or sessionId parameters." });
      return;
    }

    try {
      const result = safetyAgent.handlePanic(sessionId, location, message || "SOS assistance request.");
      res.status(200).json(result);
    } catch (err) {
      console.error('Error handling safety panic:', err);
      res.status(500).json({ error: "Emergency trigger failed." });
    }
  });

  // ─── Ops Action Cards ────────────────────────────────────────────────────────────

  router.get('/actions', (req: Request, res: Response) => {
    try {
      res.status(200).json(opsAgent.getActionFeed());
    } catch (err) {
      res.status(500).json({ error: "Failed to load actions." });
    }
  });

  router.post('/actions/:id/respond', sanitizeInput, (req: Request, res: Response) => {
    // const { id } = req.params;
    const id = req.params.id as string;
    const { response, staffRole } = req.body;

    if (!response || !staffRole) {
      res.status(400).json({ error: "Missing response or staffRole body parameters." });
      return;
    }

    try {
      opsAgent.respondToAction(id, response, staffRole);
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to log decision." });
    }
  });

  // ─── Audit Log ──────────────────────────────────────────────────────────────────

  router.get('/audit', (req: Request, res: Response) => {
    try {
      res.status(200).json(getAuditLog());
    } catch (err) {
      res.status(500).json({ error: "Failed to load audit logs." });
    }
  });

  // ─── Zone Status ─────────────────────────────────────────────────────────────────

  router.get('/zones', (req: Request, res: Response) => {
    try {
      const zones = simulator.getZonesList();
      const statuses = zones.map(z => {
        const occupancyPercent = (z.currentOccupancy / z.capacity) * 100;
        let risk: any = 'LOW';
        if (occupancyPercent >= 90) risk = 'CRITICAL';
        else if (occupancyPercent >= 80) risk = 'HIGH';
        else if (occupancyPercent >= 60) risk = 'MEDIUM';

        return {
          zone_id: z.id,
          occupancyPercent: Math.round(occupancyPercent),
          riskLevel: risk,
          trend: 'stable', // Simple fallback status
          etaToThreshold: null,
          lastUpdated: new Date().toISOString()
        };
      });
      res.status(200).json(statuses);
    } catch (err) {
      res.status(500).json({ error: "Failed to load zone list." });
    }
  });

  // ─── Knowledge RAG Search ────────────────────────────────────────────────────────
  router.get('/knowledge', sanitizeInput, (req: Request, res: Response) => {
  const rawQuery = req.query.q;

  if (typeof rawQuery !== "string") {
    res.status(400).json({
      error: "Missing q search query parameter."
    });
    return;
  }

  try {
    const results = searchKnowledge(rawQuery, 5);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({
      error: "Failed to execute similarity search."
    });
  }
});
  // ─── Manual Broadcast Trigger ─────────────────────────────────────────────────────

  router.post('/broadcast', sanitizeInput, async (req: Request, res: Response) => {
    const { type, affectedZones, message } = req.body;

    if (!type || !affectedZones || !message) {
      res.status(400).json({ error: "Missing type, affectedZones, or message parameters." });
      return;
    }

    try {
      const broadcast = await safetyAgent.generateBroadcast(type, affectedZones, message);
      res.status(200).json(broadcast);
    } catch (err) {
      console.error('Failed to issue manual broadcast:', err);
      res.status(500).json({ error: "Manual broadcast failed." });
    }
  });

  return router;
}
