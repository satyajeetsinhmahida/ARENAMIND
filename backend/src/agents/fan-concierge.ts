import { ChatMessage, Language, AccessibilityMode } from '../types/index.js';
import { AgentOrchestrator } from './orchestrator.js';
import { searchKnowledge } from '../rag/knowledge-base.js';
import { saveChatMessage, getChatHistory } from '../db/store.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Fan Concierge Agent
 * 
 * Provides conversational wayfinding, policy, and menu help to fans.
 * Integrates RAG retrieval and accessibility layout formatting.
 */
export class FanConciergeAgent {
  private orchestrator: AgentOrchestrator;

  constructor(orchestrator: AgentOrchestrator) {
    this.orchestrator = orchestrator;
  }

  /**
   * Processes a user chat message, retrieves RAG context, and streams the response.
   * 
   * @param text Raw user message
   * @param sessionId Ephemeral chat session ID
   * @param language Output language selector (en/es/fr/ar)
   * @param mode Layout render instructions (standard/simplified/screen-reader)
   * @param onChunk Stream output callback token handler
   * @returns Complete chat message object
   */
  public async handleMessage(
    text: string,
    sessionId: string,
    language: Language,
    mode: AccessibilityMode,
    onChunk: (token: string) => void
  ): Promise<ChatMessage> {
    const userMsgId = uuidv4();
    const timestamp = new Date().toISOString();

    const userMessage: ChatMessage = {
      id: userMsgId,
      timestamp,
      role: 'user',
      content: text,
      language,
      accessibilityMode: mode
    };

    // Save user message to database
    saveChatMessage(sessionId, userMessage);

    // Retrieve relevant documents using RAG TF-IDF search
    const RAGMatches = searchKnowledge(text, 4);
    const contextContent = RAGMatches.map(m => `[Source: ${m.chunk.source}, Category: ${m.chunk.category}]\nTitle: ${m.chunk.title}\nContent: ${m.chunk.content}`).join('\n\n');
    const sourceIds = RAGMatches.map(m => m.chunk.id);

    // Create system prompt variables based on modes
    const accessibilityContext = `
Current Language: ${language}
Accessibility Mode Active: ${mode}
(If mode is 'simplified', write brief sentences, simple words, max 3 sentences total.)
(If mode is 'screen-reader', format in structured, numbered bullet points with clean header descriptions. Avoid emojis.)
`;

    // Stream from orchestrator
    const responseText = await this.orchestrator.generateStream(
      'fan-concierge',
      text,
      `${contextContent}\n${accessibilityContext}`,
      onChunk
    );

    const assistantMsgId = uuidv4();
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      timestamp: new Date().toISOString(),
      role: 'assistant',
      content: responseText.response,
      language,
      accessibilityMode: mode,
      metadata: {
        ragSources: sourceIds,
        agentTraceId: responseText.traceId
      }
    };

    // Save assistant response to database
    saveChatMessage(sessionId, assistantMessage);

    return assistantMessage;
  }

  /**
   * Retrieves chat history list for the session.
   * 
   * @param sessionId Session token
   */
  public getHistory(sessionId: string): ChatMessage[] {
    return getChatHistory(sessionId);
  }
}
