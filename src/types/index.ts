export type TelemetryType =
  | 'turnstile_count'
  | 'queue_length'
  | 'restroom_occupancy'
  | 'temp_weather'
  | 'medical_alert'
  | 'gate_status';

export interface TelemetryEvent {
  timestamp: string;
  zone_id: string;
  type: TelemetryType;
  value: number;
  capacity: number;
  metadata?: Record<string, unknown>;
}

export type MatchPhase =
  | 'pre_match'
  | 'first_half'
  | 'halftime'
  | 'second_half'
  | 'post_match';

export type ZoneType =
  | 'gate'
  | 'seating'
  | 'concourse'
  | 'concession'
  | 'restroom'
  | 'vip'
  | 'medical'
  | 'exit';

export interface StadiumZone {
  id: string;
  name: string;
  type: ZoneType;
  capacity: number;
  currentOccupancy: number;
  adjacentZones: string[];
  accessible: boolean;
  coordinates: { x: number; y: number };
  level: number;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ZoneStatus {
  zone_id: string;
  occupancyPercent: number;
  riskLevel: RiskLevel;
  trend: 'rising' | 'stable' | 'falling';
  etaToThreshold: number | null;
  lastUpdated: string;
}

export type AgentId =
  | 'fan-concierge'
  | 'crowd-intelligence'
  | 'ops-commander'
  | 'safety-accessibility';

export interface AgentTraceStep {
  id: string;
  timestamp: string;
  agentId: AgentId;
  action: string;
  input: string;
  output: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

export interface AgentTrace {
  traceId: string;
  steps: AgentTraceStep[];
  startTime: string;
  endTime?: string;
  triggerEvent?: string;
}

export interface CrowdIntelEvent {
  id: string;
  timestamp: string;
  zone_id: string;
  riskLevel: RiskLevel;
  etaToThreshold: number;
  currentOccupancyPercent: number;
  trendDirection: 'rising' | 'stable' | 'falling';
  rateOfChange: number;
  recommendedAction: string;
  reasoning: string;
  isAnomaly: boolean;
}

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionResponse = 'accepted' | 'dismissed' | 'snoozed';

export interface ActionCard {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  urgency: UrgencyLevel;
  triggeringSignals: TriggeringSignal[];
  recommendedAction: string;
  alternativeActions: string[];
  confidence: number;
  reasoning: string;
  status: 'pending' | ActionResponse;
  respondedAt?: string;
  respondedBy?: string;
  zoneId: string;
  agentTraceId?: string;
}

export interface TriggeringSignal {
  source: string;
  metric: string;
  value: number;
  threshold: number;
  zone_id: string;
}

export type Language = 'en' | 'es' | 'fr' | 'ar';
export type AccessibilityMode = 'standard' | 'simplified' | 'screen-reader';

export interface ChatMessage {
  id: string;
  timestamp: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language: Language;
  accessibilityMode: AccessibilityMode;
  metadata?: {
    ragSources?: string[];
    agentTraceId?: string;
    isEmergency?: boolean;
  };
}

export interface EmergencyBroadcast {
  id: string;
  timestamp: string;
  type: 'evacuation' | 'shelter' | 'medical' | 'weather' | 'security';
  affectedZones: string[];
  messages: {
    language: Language;
    standard: string;
    simplified: string;
    screenReader: string;
  }[];
  severity: 'warning' | 'critical' | 'emergency';
  isActive: boolean;
}

export interface KnowledgeChunk {
  id: string;
  source: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
  language: Language;
}

export interface RAGResult {
  chunk: KnowledgeChunk;
  score: number;
}

export type WSMessageType =
  | 'simulator:telemetry'
  | 'simulator:phase'
  | 'agent:trace'
  | 'crowd:event'
  | 'ops:action'
  | 'ops:action_update'
  | 'chat:stream'
  | 'chat:complete'
  | 'broadcast:emergency'
  | 'zone:status'
  | 'client:subscribe'
  | 'client:chat'
  | 'client:emergency'
  | 'client:action_respond';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionCardId: string;
  staffRole: string;
  response: ActionResponse;
  notes?: string;
}
