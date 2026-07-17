import { useState, useEffect } from 'react';
import { ChatMessage, Language, AccessibilityMode } from '../types/index.js';
import { useAccessibilityContext } from '../contexts/AccessibilityContext.js';

const SESSION_KEY = 'am_chat_session_id';

/**
 * Custom hook to manage Fan Concierge chat states, history updates, and SSE text streams.
 */
export function useChat() {
  const { language, accessibilityMode } = useAccessibilityContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Restore or generate UUID session
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, sid);
    }
    setSessionId(sid);
  }, []);

  /**
   * Submits a user query to the Fan Concierge REST endpoint and parses the SSE stream response.
   * 
   * @param text Raw query text
   */
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      role: 'user',
      content: text,
      language,
      accessibilityMode
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    const assistantMsgId = crypto.randomUUID();
    let accumulatedContent = '';

    // Create temporary assistant message placeholder
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      timestamp: new Date().toISOString(),
      role: 'assistant',
      content: '',
      language,
      accessibilityMode
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          sessionId,
          language,
          accessibilityMode
        })
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('ReadableStream not supported.');

      let isDone = false;

      while (!isDone) {
        const { value, done } = await reader.read();
        isDone = done;
        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6).trim();
              if (dataStr === '[DONE]') {
                isDone = true;
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.token) {
                  accumulatedContent += parsed.token;
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === assistantMsgId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // Ignore parse errors on raw tokens
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to receive message stream:', err);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMsgId
            ? { ...msg, content: "⚠️ Sorry, I encountered an issue connecting to the stadium core. Please try again or locate nearest staff." }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  /**
   * Resets session and chat history.
   */
  const clearHistory = () => {
    setMessages([]);
    const newSid = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, newSid);
    setSessionId(newSid);
  };

  return {
    messages,
    isTyping,
    sendMessage,
    clearHistory,
    sessionId
  };
}
