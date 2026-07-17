import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage.js';
import { VoiceInput } from './VoiceInput.js';
import { QuickActions } from './QuickActions.js';
import { AgentTrace } from '../shared/AgentTrace.js';
import { useChat } from '../../hooks/useChat.js';
import { useAccessibilityContext } from '../../contexts/AccessibilityContext.js';

interface ChatPanelProps {
  onClose?: () => void;
  initialQuery?: string | null;
  onClearQuery?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onClose, initialQuery, onClearQuery }) => {
  const { language } = useAccessibilityContext();
  const { messages, isTyping, sendMessage, clearHistory } = useChat();
  const [inputText, setInputText] = useState('');
  const [activeTraceId, setActiveTraceId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery) {
      sendMessage(initialQuery);
      if (onClearQuery) onClearQuery();
    }
  }, [initialQuery]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);


  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div
      className="relative flex flex-col h-full text-white shadow-2xl animate-slide-in-right z-30"
      style={{
        background: 'linear-gradient(180deg, rgba(7,15,32,0.97) 0%, rgba(2,8,23,0.98) 100%)',
        borderLeft: '1px solid rgba(0,212,255,0.12)',
      }}
    >
      {/* Panel Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          background: 'linear-gradient(90deg, rgba(0,212,255,0.06), transparent)',
          borderBottom: '1px solid rgba(0,212,255,0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.06))',
              border: '1px solid rgba(0,212,255,0.3)',
              boxShadow: '0 0 16px rgba(0,212,255,0.2)',
            }}
          >
            🤖
          </div>
          <div>
            <h3 className="font-outfit font-bold text-sm text-white leading-none">Stadium Concierge</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="live-dot w-1.5 h-1.5" />
              <span className="font-mono text-[9px] tracking-widest" style={{ color: 'rgba(0,212,255,0.7)' }}>
                A1 · RAG · GEMINI AI
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearHistory}
            className="px-2.5 py-1.5 rounded-lg font-mono text-[9px] text-gray-500 hover:text-gray-300 transition-colors border border-white/5 hover:border-white/10 cursor-pointer"
            aria-label="Clear chat history"
          >
            Clear
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer text-xs"
              aria-label="Close Chat Panel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl animate-float"
              style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.04))',
                border: '1px solid rgba(0,212,255,0.2)',
                boxShadow: '0 0 40px rgba(0,212,255,0.1)',
              }}
            >
              ⚽
            </div>
            <div>
              <h4 className="font-outfit font-bold text-base text-white mb-2">Welcome to MetLife Stadium!</h4>
              <p className="text-xs text-gray-500 max-w-[220px] leading-relaxed">
                Your AI concierge is online. Ask me about wayfinding, food, schedules, or accessibility services.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-[240px]">
              {['Where is Section 110?', 'Show me the food menu', 'Nearest restrooms?'].map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left px-3 py-2.5 rounded-xl font-mono text-[10px] text-cyan-400 cursor-pointer transition-all duration-200 hover:border-cyan-500/30"
                  style={{
                    background: 'rgba(0,212,255,0.05)',
                    border: '1px solid rgba(0,212,255,0.12)',
                  }}
                >
                  {q} →
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onTraceClick={tid => setActiveTraceId(tid)}
            />
          ))
        )}

        {isTyping && (
          <div
            className="flex items-center gap-3 p-3 rounded-2xl rounded-tl-sm self-start max-w-[180px]"
            style={{
              background: 'linear-gradient(135deg, rgba(13,30,53,0.9), rgba(7,15,32,0.95))',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex gap-1 items-center h-5">
              <div className="wave-bar" style={{ animationDuration: '0.7s' }} />
              <div className="wave-bar" style={{ animationDuration: '0.8s' }} />
              <div className="wave-bar" style={{ animationDuration: '0.6s' }} />
              <div className="wave-bar" style={{ animationDuration: '0.9s' }} />
              <div className="wave-bar" style={{ animationDuration: '0.7s' }} />
            </div>
            <span className="font-mono text-[9px] text-gray-500">thinking...</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-t border-white/5">
        <QuickActions onActionClick={query => sendMessage(query)} />
      </div>

      {/* Input Dock */}
      <div
        className="px-4 py-3 flex gap-2 items-center"
        style={{ borderTop: '1px solid rgba(0,212,255,0.08)', background: 'rgba(0,0,0,0.2)' }}
      >
        <VoiceInput
          language={language}
          onTranscriptComplete={voiceText => setInputText(voiceText)}
        />

        <input
          type="text"
          placeholder="Ask anything about the stadium..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 px-3 py-2.5 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          aria-label="Type inquiry here"
          onFocus={e => {
            e.currentTarget.style.border = '1px solid rgba(0,212,255,0.3)';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(0,212,255,0.1)';
          }}
          onBlur={e => {
            e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />

        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer transition-all duration-200 disabled:opacity-30"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.3), rgba(0,212,255,0.12))',
            border: '1px solid rgba(0,212,255,0.4)',
            color: '#00D4FF',
          }}
          aria-label="Send message"
        >
          ↑
        </button>
      </div>

      {/* Agent Trace Overlay */}
      {activeTraceId && (
        <div
          className="absolute inset-0 z-50 p-5 flex flex-col gap-4 animate-fade-in"
          style={{ background: 'rgba(2,8,23,0.97)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
            <div>
              <div className="font-mono text-[9px] text-cyan-400/60 uppercase tracking-widest mb-0.5">AI Reasoning Pipeline</div>
              <h4 className="font-outfit font-bold text-white text-sm">Agent Trace Chain</h4>
            </div>
            <button
              onClick={() => setActiveTraceId(null)}
              className="font-mono text-[10px] text-gray-500 hover:text-white cursor-pointer transition-colors"
            >
              ✕ Close
            </button>
          </div>
          <p className="text-[10px] text-gray-600 leading-relaxed">
            This visualizes how your query flowed through the multi-agent GenAI pipeline in real-time.
          </p>
          <AgentTrace maxVisible={5} />
        </div>
      )}
    </div>
  );
};
