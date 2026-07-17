import { AnomalyScenario } from '../types/index.js';

/**
 * List of pre-defined anomaly scenarios injected during simulation ticks.
 */
export const ANOMALIES: AnomalyScenario[] = [
  {
    id: "gate-malfunction",
    name: "Gate C Turnstile System Malfunction",
    description: "Gate C turnstiles lose network connectivity. Capacity drops to 0, creating massive bottleneck and routing overflow crowds to neighboring gates B and D.",
    triggerPhase: "pre_match",
    triggerMinute: 1, // Trigger shortly into the demo
    durationMinutes: 3, // Lasts for 3 simulated minutes
    affectedZones: ["Gate-C", "Gate-B", "Gate-D", "Concourse-East"],
    effects: [
      { zone_id: "Gate-C", type: "gate_status", override: 0 }, // Closed
      { zone_id: "Gate-C", type: "queue_length", multiplier: 3.5 }, // Queue spikes
      { zone_id: "Gate-B", type: "turnstile_count", multiplier: 1.6 }, // Neighboring overflow
      { zone_id: "Gate-D", type: "turnstile_count", multiplier: 1.5 },
      { zone_id: "Concourse-East", type: "turnstile_count", multiplier: 1.4 }
    ]
  },
  {
    id: "medical-emergency",
    name: "Medical Dispatch in Section 110",
    description: "Sudden medical incident (heat exhaustion) flagged in Section 110, requiring medical responder dispatch from Station 1.",
    triggerPhase: "first_half",
    triggerMinute: 1,
    durationMinutes: 2,
    affectedZones: ["Section-110", "Medical-1"],
    effects: [
      { zone_id: "Section-110", type: "medical_alert", override: 1 },
      { zone_id: "Medical-1", type: "turnstile_count", multiplier: 1.8 } // Station dispatch load
    ]
  },
  {
    id: "weather-alert",
    name: "Extreme Heat Warning",
    description: "Sudden temperature spike to 98°F (37°C) triggers shade-zone preferences and concession beverage spikes.",
    triggerPhase: "halftime",
    triggerMinute: 0,
    durationMinutes: 4,
    affectedZones: ["Stand-1", "Stand-3", "Stand-6", "Medical-2"],
    effects: [
      { zone_id: "Stand-1", type: "queue_length", multiplier: 1.8 }, // Beverage queue spikes
      { zone_id: "Stand-3", type: "queue_length", multiplier: 1.7 },
      { zone_id: "Stand-6", type: "queue_length", multiplier: 1.9 },
      { zone_id: "Medical-2", type: "turnstile_count", multiplier: 1.5 } // Minor heat exhaustion
    ]
  }
];
