import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { TelemetryEvent, MatchPhase, StadiumZone, TelemetryType } from '../types/index.js';
import { PHASE_PATTERNS, addNoise, getZoneMultiplier } from './patterns.js';
import { ANOMALIES } from './anomalies.js';

/**
 * Synthetic telemetry simulator that models MetLife stadium sensor inputs.
 * Emits telemetry events periodically, tracking phases and injecting anomalies.
 */
export class SimulatorEngine extends EventEmitter {
  private timer: NodeJS.Timeout | null = null;
  private intervalMs: number;
  private zones: StadiumZone[] = [];
  
  // Simulation clock details (compressed for demo lifecycle)
  private currentPhaseIndex = 0;
  private phasesOrder: MatchPhase[] = ['pre_match', 'first_half', 'halftime', 'second_half', 'post_match'];
  
  // Phase durations in terms of ticks
  private phaseTickDurations: Record<MatchPhase, number> = {
    pre_match: 60,    // ~3 mins at 3s ticks
    first_half: 40,   // ~2 mins
    halftime: 20,     // ~1 min
    second_half: 40,  // ~2 mins
    post_match: 40    // ~2 mins
  };

  private ticksInCurrentPhase = 0;
  private elapsedMinutes = 0;

  constructor(kbDirectory: string, intervalMs: number = 3000) {
    super();
    this.intervalMs = intervalMs;
    
    // Load zone configuration from knowledge base
    const filePath = path.resolve(kbDirectory, 'stadium-zones.json');
    if (fs.existsSync(filePath)) {
      this.zones = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      console.warn(`Simulator could not locate stadium zones file: ${filePath}. Using empty layout.`);
    }
  }

  /**
   * Starts the simulation tick loop.
   */
  public start(): void {
    if (this.timer) return;
    console.log(`Starting telemetry simulator engine. Base tick interval: ${this.intervalMs}ms`);
    
    this.timer = setInterval(() => {
      this.tick();
    }, this.intervalMs);
  }

  /**
   * Stops the simulation loop.
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Runs a single simulation clock tick, updating zones and broadcasting telemetry.
   */
  private tick(): void {
    const phase = this.getCurrentPhase();
    this.ticksInCurrentPhase++;
    
    // Increment elapsed clock minutes roughly (1 min = 20 ticks in this compression)
    if (this.ticksInCurrentPhase % 20 === 0) {
      this.elapsedMinutes++;
    }

    // Check phase transition boundaries
    if (this.ticksInCurrentPhase >= this.phaseTickDurations[phase]) {
      this.advancePhase();
      return;
    }

    const timestamp = new Date().toISOString();
    
    // Check for active anomalies
    const activeAnomalies = ANOMALIES.filter(a => {
      if (a.triggerPhase !== phase) return false;
      const phaseMinutes = Math.floor(this.ticksInCurrentPhase / 20);
      return phaseMinutes >= a.triggerMinute && phaseMinutes < (a.triggerMinute + a.durationMinutes);
    });

    // Process each zone and generate telemetry
    for (const zone of this.zones) {
      const multiplier = getZoneMultiplier(zone.id);
      const pattern = PHASE_PATTERNS[phase][zone.type] || PHASE_PATTERNS[phase]['concourse'];

      // Resolve anomaly rules for this zone
      const zoneAnomalies = activeAnomalies.filter(a => a.affectedZones.includes(zone.id));
      
      let occupancyPercent = pattern.expectedOccupancyPercent;
      let queueLength = pattern.expectedQueueLength || 0;
      let isGateClosed = false;
      let medicalAlertTriggered = false;

      // Apply anomaly multipliers or overrides
      for (const anomaly of zoneAnomalies) {
        for (const effect of anomaly.effects) {
          if (effect.zone_id === zone.id) {
            if (effect.type === 'gate_status' && effect.override === 0) {
              isGateClosed = true;
            }
            if (effect.type === 'queue_length') {
              queueLength = queueLength * (effect.multiplier || 1);
            }
            if (effect.type === 'turnstile_count') {
              occupancyPercent = occupancyPercent * (effect.multiplier || 1);
            }
            if (effect.type === 'medical_alert' && effect.override === 1) {
              medicalAlertTriggered = true;
            }
          }
        }
      }

      // Add noise to simulate real fluctuations
      occupancyPercent = isGateClosed ? 0 : Math.min(100, addNoise(occupancyPercent * multiplier, 8));
      queueLength = isGateClosed ? addNoise(45) : Math.round(addNoise(queueLength * multiplier, 12));

      // Calculate actual occupancy count
      zone.currentOccupancy = Math.round((occupancyPercent / 100) * zone.capacity);

      // Emit telemetry inputs
      const occupancyEvent: TelemetryEvent = {
        timestamp,
        zone_id: zone.id,
        type: 'turnstile_count',
        value: zone.currentOccupancy,
        capacity: zone.capacity
      };
      this.emit('telemetry', occupancyEvent);

      if (zone.type === 'gate' || zone.type === 'concession') {
        const queueEvent: TelemetryEvent = {
          timestamp,
          zone_id: zone.id,
          type: 'queue_length',
          value: queueLength,
          capacity: 50 // Queue limit representation
        };
        this.emit('telemetry', queueEvent);
      }

      if (zone.type === 'restroom') {
        const restroomEvent: TelemetryEvent = {
          timestamp,
          zone_id: zone.id,
          type: 'restroom_occupancy',
          value: Math.round(occupancyPercent), // Restroom occupancy is mapped directly to percent load
          capacity: 100
        };
        this.emit('telemetry', restroomEvent);
      }

      if (medicalAlertTriggered) {
        const medicalEvent: TelemetryEvent = {
          timestamp,
          zone_id: zone.id,
          type: 'medical_alert',
          value: 1,
          capacity: 1
        };
        this.emit('telemetry', medicalEvent);
      }
    }

    // Periodically emit temp/weather telemetry
    const weatherEvent: TelemetryEvent = {
      timestamp,
      zone_id: "Stadium-Wide",
      type: 'temp_weather',
      value: activeAnomalies.some(a => a.id === 'weather-alert') ? addNoise(98, 2) : addNoise(78, 2),
      capacity: 120
    };
    this.emit('telemetry', weatherEvent);
  }

  /**
   * Advances simulation to the next phase on timeline wrap/completion.
   */
  private advancePhase(): void {
    this.ticksInCurrentPhase = 0;
    this.currentPhaseIndex = (this.currentPhaseIndex + 1) % this.phasesOrder.length;
    const nextPhase = this.getCurrentPhase();
    
    console.log(`Simulator advancing to Match Phase: ${nextPhase}`);
    this.emit('phase_change', { phase: nextPhase });
  }

  /**
   * Gets current match phase name.
   */
  public getCurrentPhase(): MatchPhase {
    return this.phasesOrder[this.currentPhaseIndex];
  }

  /**
   * Returns simulated match time formatted as standard string (e.g. "Halftime" or "24'").
   */
  public getMatchTimeString(): string {
    const phase = this.getCurrentPhase();
    if (phase === 'pre_match') return 'Pre-Match (Warmup)';
    if (phase === 'halftime') return 'Halftime Interval';
    if (phase === 'post_match') return 'Full Time (Exiting)';
    
    // Compute pseudo match minute
    const matchMin = this.ticksInCurrentPhase * 2;
    if (phase === 'first_half') return `${matchMin}'`;
    return `${45 + matchMin}'`;
  }

  /**
   * Returns full zone array list.
   */
  public getZonesList(): StadiumZone[] {
    return this.zones;
  }
}
