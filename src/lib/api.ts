import { ActionCard, ActionResponse, AuditLogEntry, ZoneStatus } from '../types/index.js';
import { API_BASE } from './constants.js';

/**
 * REST Client helper utility queries for the stadium operations server.
 */
export const api = {
  
  /**
   * Fetches active operations action cards feed.
   */
  async getActions(): Promise<ActionCard[]> {
    const res = await fetch(`${API_BASE}/actions`);
    if (!res.ok) throw new Error('Failed to load actions');
    return res.json();
  },

  /**
   * Submits staff response to recommendations.
   */
  async respondToAction(id: string, response: ActionResponse, staffRole: string): Promise<void> {
    const res = await fetch(`${API_BASE}/actions/${id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response, staffRole })
    });
    if (!res.ok) throw new Error('Failed to submit response');
  },

  /**
   * Fetches full audit decision log.
   */
  async getAuditLog(): Promise<AuditLogEntry[]> {
    const res = await fetch(`${API_BASE}/audit`);
    if (!res.ok) throw new Error('Failed to load audit logs');
    return res.json();
  },

  /**
   * Fetches static list of stadium zone status capacity numbers.
   */
  async getZones(): Promise<ZoneStatus[]> {
    const res = await fetch(`${API_BASE}/zones`);
    if (!res.ok) throw new Error('Failed to load zone list');
    return res.json();
  }
};
