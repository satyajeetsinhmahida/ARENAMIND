import { EmergencyBroadcast, Language, AccessibilityMode } from '../types/index.js';
import { AgentOrchestrator } from './orchestrator.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Safety & Accessibility Agent
 * 
 * Handles stadium safety concerns, emergency broadcasts, and instant
 * multi-format translation of alerts for accessibility clients.
 */
export class SafetyAgent {
  private orchestrator: AgentOrchestrator;
  private broadcasts = new Map<string, EmergencyBroadcast>();

  constructor(orchestrator: AgentOrchestrator) {
    this.orchestrator = orchestrator;
  }

  /**
   * Triggers an emergency broadcast across all zones and formats.
   * 
   * @param type Safety alert category (evacuation, weather, medical, security)
   * @param affectedZones List of zone IDs affected by the emergency
   * @param baseMessage Standard English emergency instruction text
   * @returns Populated EmergencyBroadcast object
   */
  public async generateBroadcast(
    type: 'evacuation' | 'shelter' | 'medical' | 'weather' | 'security',
    affectedZones: string[],
    baseMessage: string
  ): Promise<EmergencyBroadcast> {
    const broadcastId = uuidv4();
    const timestamp = new Date().toISOString();

    const languages: Language[] = ['en', 'es', 'fr', 'ar'];
    const messages: EmergencyBroadcast['messages'] = [];

    // Pre-written translations for fallback/speed in emergencies
    const fallbackTemplates: Record<Language, { standard: string; simplified: string; screenReader: string }> = {
      en: {
        standard: `🚨 SAFETY ALERT: An emergency has occurred. Please proceed to the nearest exit gate immediately. Do not use elevators.`,
        simplified: `🚨 PLEASE LEAVE NOW. Walk to the nearest exit gate. Do not use lifts. Follow helpers.`,
        screenReader: `ALERT: Emergency evacuation in progress. Walk directly to the nearest marked exit gate. Escalators and lifts are turned off. Security personnel will assist you.`
      },
      es: {
        standard: `🚨 ALERTA DE SEGURIDAD: Ha ocurrido una emergencia. Por favor, diríjase a la puerta de salida más cercana de inmediato. No use los ascensores.`,
        simplified: `🚨 SALGA AHORA. Camine hacia la salida más cercana. No use ascensores. Siga a los guías.`,
        screenReader: `ALERTA: Evacuación de emergencia en progreso. Diríjase a la puerta de salida marcada más cercana. Los ascensores están apagados. El personal de seguridad le ayudará.`
      },
      fr: {
        standard: `🚨 ALERTE DE SÉCURITÉ: Une urgence est survenue. Veuillez vous diriger immédiatement vers la porte de sortie la plus proche. N'utilisez pas les ascenseurs.`,
        simplified: `🚨 PARTEZ MAINTENANT. Marchez vers la sortie la plus proche. N'utilisez pas les ascenseurs. Suivez les guides.`,
        screenReader: `ALERTE: Évacuation d'urgence en cours. Marchez vers la sortie la plus proche. Les ascenseurs sont désactivés. Les agents de sécurité vont vous guider.`
      },
      ar: {
        standard: `🚨 تنبيه سلامة: حدثت حالة طوارئ. يرجى التوجه إلى أقرب بوابة خروج على الفور. لا تستخدم المصاعد.`,
        simplified: `🚨 غادر الآن. توجه إلى أقرب بوابة خروج. لا تستخدم المصاعد. اتبع المنظمين.`,
        screenReader: `تنبيه: إخلاء طوارئ قيد التنفيذ. توجه مباشرة إلى أقرب بوابة خروج. المصاعد متوقفة. سيساعدك رجال الأمن.`
      }
    };

    // Attempt GenAI translations for each language
    for (const lang of languages) {
      if (lang === 'en') {
        // Build English versions using standard rules
        messages.push({
          language: 'en',
          standard: baseMessage,
          simplified: this.simplifyText(baseMessage),
          screenReader: this.makeScreenReaderFriendly(baseMessage)
        });
      } else {
        try {
          const prompt = `Translate this emergency alert into ${lang.toUpperCase()}: "${baseMessage}". Generate 3 formats separated by [SEP]: 1. Standard translation, 2. Simplified vocabulary (max 2 short sentences), 3. Screen-reader instructions (logical direction details).`;
          
          const result = await this.orchestrator.generateResponse(
            'safety-accessibility',
            prompt,
            [],
            `Translate alert standard text.`
          );

          const parts = result.response.split('[SEP]');
          messages.push({
            language: lang,
            standard: parts[0]?.trim() || fallbackTemplates[lang].standard,
            simplified: parts[1]?.trim() || fallbackTemplates[lang].simplified,
            screenReader: parts[2]?.trim() || fallbackTemplates[lang].screenReader
          });
        } catch (err) {
          // Fall back to template translations in case of error
          messages.push({
            language: lang,
            standard: fallbackTemplates[lang].standard,
            simplified: fallbackTemplates[lang].simplified,
            screenReader: fallbackTemplates[lang].screenReader
          });
        }
      }
    }

    const broadcast: EmergencyBroadcast = {
      id: broadcastId,
      timestamp,
      type,
      affectedZones,
      messages,
      severity: 'emergency',
      isActive: true
    };

    this.broadcasts.set(broadcastId, broadcast);

    // Broadcast new emergency via WebSocket
    if ((global as any).broadcastWS) {
      (global as any).broadcastWS('broadcast:emergency', broadcast);
    }

    return broadcast;
  }

  /**
   * Helper rewriting warnings into simplified sentences.
   */
  private simplifyText(text: string): string {
    if (text.toLowerCase().includes('evacuate') || text.toLowerCase().includes('exit')) {
      return "🚨 EMERGENCY. LEAVE NOW. Walk to the nearest exit gate. Do not run. Follow instructions.";
    }
    if (text.toLowerCase().includes('heat') || text.toLowerCase().includes('temperature')) {
      return "⚠️ EXTREME HEAT. Drink free water at all concessions. Rest in shaded sections.";
    }
    return `🚨 SAFETY NOTICE: Proceed to exit paths. Watch helpers.`;
  }

  /**
   * Helper removing icons/emojis and structuring routes for screen-reader text-to-speech.
   */
  private makeScreenReaderFriendly(text: string): string {
    // Remove typical visual icons
    let clean = text.replace(/🚨|⚠️|🛑|📢/g, '').trim();
    return `ATTENTION: Safety notice update. ${clean} Elevators are deactivated. Access ramp paths are open. Security stewards are active on the concourse to guide you.`;
  }

  /**
   * Acknowledges emergency panic triggers, creating immediate Ops and client responses.
   */
  public handlePanic(sessionId: string, location: string, reason: string): { broadcast: EmergencyBroadcast; acknowledgment: string } {
    console.log(`PANIC BUTTON PRESSED. Session: ${sessionId}, Zone: ${location}, Reason: ${reason}`);

    // Create a local alert event on the Ops commander dashboard
    if ((global as any).broadcastWS) {
      (global as any).broadcastWS('ops:action', {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        title: `🚨 EMERGENCY: SOS Panic Flag in ${location}!`,
        description: `A fan has triggered the SOS Panic assistance option in ${location}. Reason stated: ${reason}.`,
        urgency: 'CRITICAL',
        triggeringSignals: [{
          source: "Safety Agent",
          metric: "SOS_panic_button",
          value: 1,
          threshold: 0,
          zone_id: location
        }],
        recommendedAction: `Dispatch emergency responders to Section/Zone: ${location} immediately. Contact medical/security coordinators.`,
        alternativeActions: [
          `Activate camera feed over ${location}`,
          `Call local field responders to check Section: ${location}`
        ],
        confidence: 1.0,
        reasoning: `User pressed emergency help button directly in the fan interface, identifying location: ${location}.`,
        status: 'pending',
        zoneId: location
      });
    }

    // Instantly generate a broadcast to return to the fan
    const evacuationMsg = `Medical/Security dispatch in progress to Section ${location}. Please remain calm and wait for helpers to arrive.`;
    
    // We mock the return structure for speed
    const broadcast: EmergencyBroadcast = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'medical',
      affectedZones: [location],
      messages: [
        {
          language: 'en',
          standard: evacuationMsg,
          simplified: "HELP IS COMING. Stay where you are. Wait for helpers.",
          screenReader: "ALERT: Emergency response team dispatched to your location. Please remain seated and wait for staff to assist you."
        }
      ],
      severity: 'critical',
      isActive: true
    };

    return {
      broadcast,
      acknowledgment: evacuationMsg
    };
  }
}
