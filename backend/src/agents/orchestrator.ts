import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AgentId, AgentTraceStep, AgentTrace } from '../types/index.js';

let apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenerativeAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenerativeAI(apiKey);
    console.log('Gemini API initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini API:', err);
  }
} else {
  console.warn('GEMINI_API_KEY environment variable is not set. ArenaMind will run in fallback simulation mode.');
}

// In-memory trace logs for the UI agent trace panel
const traceLogs = new Map<string, AgentTrace>();
const traceSteps: AgentTraceStep[] = [];

/**
 * Shared orchestrator managing Gemini LLM calls, prompt templates, and reasoning chains.
 */
export class AgentOrchestrator {
  private promptsDir: string;

  constructor(promptsDir: string) {
    this.promptsDir = path.resolve(promptsDir);
  }

  /**
   * Retrieves an agent prompt file from the filesystem.
   * 
   * @param agentId ID of the agent
   * @returns Prompts text
   */
  private getSystemPrompt(agentId: AgentId): string {
    const filePath = path.join(this.promptsDir, `${agentId}.md`);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    console.warn(`Prompt file not found: ${filePath}. Using empty prompt.`);
    return '';
  }

  /**
   * Records a trace step for the UI visualization.
   * 
   * @param agentId Processing Agent
   * @param action Description of what was processed
   * @param input Data passed to the agent
   * @param output Formatted response
   * @param durationMs Execution time
   * @param metadata Supporting tags
   * @param traceId Optional existing trace group ID
   * @returns The generated/passed traceId
   */
  public logTrace(
    agentId: AgentId,
    action: string,
    input: string,
    output: string,
    durationMs: number,
    metadata?: Record<string, unknown>,
    traceId?: string
  ): string {
    const stepId = uuidv4();
    const tid = traceId || uuidv4();
    const timestamp = new Date().toISOString();

    const step: AgentTraceStep = {
      id: stepId,
      timestamp,
      agentId,
      action,
      input,
      output,
      durationMs,
      metadata
    };

    traceSteps.push(step);
    if (traceSteps.length > 500) traceSteps.shift();

    let trace = traceLogs.get(tid);
    if (!trace) {
      trace = {
        traceId: tid,
        steps: [],
        startTime: timestamp
      };
      traceLogs.set(tid, trace);
    }
    trace.steps.push(step);
    trace.endTime = timestamp;

    // Broadcast trace via callback or event (handled at server level)
    if ((global as any).broadcastWS) {
      (global as any).broadcastWS('agent:trace', step);
    }

    return tid;
  }

  /**
   * Queries Gemini with system instructions and user chat messages.
   * 
   * @param agentId The querying agent
   * @param userMessage Message content
   * @param history Prior message history (optional)
   * @param context RAG search results or raw telemetry logs
   * @param traceId Associated trace chain ID
   * @returns Generated text output
   */
  public async generateResponse(
    agentId: AgentId,
    userMessage: string,
    history: { role: 'user' | 'model'; parts: string }[] = [],
    context: string = '',
    traceId?: string
  ): Promise<{ response: string; traceId: string }> {
    const startTime = Date.now();
    const systemInstruction = this.getSystemPrompt(agentId);

    const fullPrompt = `
SYSTEM INSTRUCTIONS:
${systemInstruction}

CONTEXT DATA:
${context}

USER MESSAGE:
${userMessage}
`;

    let responseText = '';
    let usedModel = 'rule-based-fallback';

    if (ai) {
      try {
        usedModel = 'gemini-1.5-flash';
        const model = ai.getGenerativeModel({ model: usedModel });
        const result = await model.generateContent(fullPrompt);
        responseText = result.response.text();
      } catch (err: any) {
        console.error(`Gemini API Error for agent ${agentId}:`, err);
        responseText = this.fallbackLocalResponse(agentId, userMessage, context);
      }
    } else {
      responseText = this.fallbackLocalResponse(agentId, userMessage, context);
    }

    const duration = Date.now() - startTime;
    const tid = this.logTrace(
      agentId,
      `Generate response using model: ${usedModel}`,
      userMessage,
      responseText,
      duration,
      { contextSize: context.length, model: usedModel },
      traceId
    );

    return { response: responseText, traceId: tid };
  }

  /**
   * Generates a streaming response for fan chat.
   * 
   * @param agentId Agent requesting stream
   * @param userMessage Message content
   * @param context RAG chunks
   * @param onChunk Callback for each received token
   * @param traceId Current trace sequence ID
   * @returns Complete accumulated response string
   */
  public async generateStream(
    agentId: AgentId,
    userMessage: string,
    context: string = '',
    onChunk: (token: string) => void,
    traceId?: string
  ): Promise<{ response: string; traceId: string }> {
    const startTime = Date.now();
    const systemInstruction = this.getSystemPrompt(agentId);

    const fullPrompt = `
SYSTEM INSTRUCTIONS:
${systemInstruction}

CONTEXT DATA:
${context}

USER MESSAGE:
${userMessage}
`;

    let responseText = '';

    if (ai) {
      try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const streamResult = await model.generateContentStream(fullPrompt);

        for await (const chunk of streamResult.stream) {
          const chunkText = chunk.text();
          responseText += chunkText;
          onChunk(chunkText);
        }
      } catch (err) {
        console.error(`Gemini streaming error for ${agentId}:`, err);
        responseText = this.fallbackLocalResponse(agentId, userMessage, context);
        // Emulate streaming for fallback
        const words = responseText.split(' ');
        for (const word of words) {
          onChunk(word + ' ');
          await new Promise(r => setTimeout(r, 40));
        }
      }
    } else {
      responseText = this.fallbackLocalResponse(agentId, userMessage, context);
      // Emulate streaming for fallback
      const words = responseText.split(' ');
      for (const word of words) {
        onChunk(word + ' ');
        await new Promise(r => setTimeout(r, 40));
      }
    }

    const duration = Date.now() - startTime;
    const tid = this.logTrace(
      agentId,
      'Generate streaming response (completed)',
      userMessage,
      responseText,
      duration,
      { contextSize: context.length, stream: true },
      traceId
    );

    return { response: responseText, traceId: tid };
  }

  /**
   * Rule-based fallback generator for zero API key operations.
   */
  private fallbackLocalResponse(agentId: AgentId, userMessage: string, context: string): string {
    const query = userMessage.toLowerCase();

    if (agentId === 'fan-concierge') {
      // Basic keyword routing based on RAG context
      if (query.includes('burger') || query.includes('food') || query.includes('eat') || query.includes('menu')) {
        return "🍔 You can find **Corner Kick Burgers** at concession stand **Stand-1** near the North Concourse (adjacent to Gate A). They serve Classic Cheeseburgers ($14.50), Beyond Plant-Based Burgers ($15.50), and Garlic Fries ($8.00). All menu items are prepared halal.";
      }
      if (query.includes('restroom') || query.includes('toilet') || query.includes('bathroom')) {
        return "🚻 The nearest restrooms are **Restroom-N1** (North Concourse, near Stand-1) and **Restroom-E1** (East Concourse, near Section 110). Both are fully accessible (ADA) equipped with baby-changing tables.";
      }
      if (query.includes('bag') || query.includes('backpack') || query.includes('purse')) {
        return "👜 MetLife Stadium operates a strict Clear Bag Policy. You can bring clear bags up to **12\" x 6\" x 12\"** or a small hand clutch (up to **4.5\" x 6.5\"**). Backpacks, luggage, and large briefcases are prohibited. Medical/diaper bags are subject to search at Gate A or E.";
      }
      if (query.includes('train') || query.includes('rail') || query.includes('transit')) {
        return "🚆 You can take the Meadowlands Rail Line from Secaucus Junction directly to the Meadowlands Sports Complex station right outside **Gate C** (MetLife Gate). Trains run starting 3 hours before kick-off and run for 2 hours post-match.";
      }
      if (query.includes('parking') || query.includes('car')) {
        return "🚗 Pre-purchased digital permits are required for all vehicles. Permits cost $40 and cash is not accepted at lot entrances. Accessible (ADA) parking is located in Lots E, F, and G close to Gates A and B.";
      }
      if (query.includes('lost') || query.includes('wallet') || query.includes('phone')) {
        return "📦 During the match, please report to the Guest Services booths inside **Gate A** or **Gate C** for lost items. All unclaimed items are logged at Stadium Operations and can be checked online post-match.";
      }
      
      // Extract from RAG context text block directly if possible
      if (context && context.includes('A:')) {
        // Try parsing out Q & A
        const lines = context.split('\n');
        const aLine = lines.find(l => l.startsWith('A:'));
        if (aLine) return aLine.substring(2).trim();
      }

      return "👋 Welcome to ArenaMind Stadium Concierge! I'm here to help you navigate MetLife Stadium. You can ask me about wayfinding (restrooms, sections), concession menus, gate access, parking, or stadium entry policies. How can I help you today?";
    }

    if (agentId === 'ops-commander') {
      return "⚠️ Ops Commander Action Recommendation: Open secondary gates and rebalance line routing based on telemetry thresholds.";
    }

    if (agentId === 'safety-accessibility') {
      return "🚨 EMERGENCY BROADCAST: Please follow the exit pathways toward the nearest exit gate calmly. Do not use elevators.";
    }

    return "System running nominal operations. No action required.";
  }

  /**
   * Retrieves all trace histories.
   */
  public getTraceLogs(): AgentTrace[] {
    return Array.from(traceLogs.values());
  }

  /**
   * Retrieves a specific trace by ID.
   */
  public getTrace(id: string): AgentTrace | undefined {
    return traceLogs.get(id);
  }
}
