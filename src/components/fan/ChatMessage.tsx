import React from 'react';
import { ChatMessage as MsgType } from '../../types/index.js';

interface ChatMessageProps {
  message: MsgType;
  onTraceClick?: (traceId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onTraceClick }) => {
  const isUser = message.role === 'user';
  
  // Format based on accessibility settings
  const getBubbleClasses = (): string => {
    let base = "max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed animate-fade-in ";
    
    if (message.accessibilityMode === 'simplified') {
      base += "text-sm md:text-base leading-loose tracking-wide "; // Larger fonts
    }

    if (isUser) {
      base += "bg-teal/15 text-white border border-teal/15 self-end rounded-tr-none";
    } else {
      base += "glass text-gray-100 self-start rounded-tl-none";
    }

    return base;
  };

  /**
   * Extremely simple markdown parser rendering bold **text** and bullets.
   */
  const formatContent = (text: string): React.ReactNode => {
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      let content: React.ReactNode = line;

      // Handle bold formats (**text**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      if (boldRegex.test(line)) {
        const parts = line.split(boldRegex);
        content = parts.map((part, pIdx) => (
          pIdx % 2 === 1 ? <strong key={pIdx} className="text-white font-semibold">{part}</strong> : part
        ));
      }

      // Handle list items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={lIdx} className="ml-4 list-disc mt-1 text-gray-300">
            {line.trim().substring(2)}
          </li>
        );
      }

      // Handle numbered lists
      const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <div key={lIdx} className="ml-3 font-mono font-medium text-teal mt-1">
            {numMatch[1]}. <span className="font-sans text-gray-300 font-normal">{numMatch[2]}</span>
          </div>
        );
      }

      return (
        <p key={lIdx} className={line.trim() === '' ? 'h-2' : 'mt-1 text-gray-200'}>
          {content}
        </p>
      );
    });
  };

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1.5`}>
      
      {/* Bubble Box */}
      <div className={getBubbleClasses()}>
        {formatContent(message.content)}

        {/* Render RAG retrieval source indicators */}
        {!isUser && message.metadata?.ragSources && message.metadata.ragSources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-white/5">
            <span className="text-[9px] text-teal font-semibold font-mono tracking-wider uppercase self-center mr-1">
              Grounded Sources:
            </span>
            {message.metadata.ragSources.map((src, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-white/5 border border-white/8 text-[9px] text-gray-400 select-none"
              >
                {src.replace('accessibility-', '').replace('policy-', '').replace('gate-', 'Gate ').replace('concession-', 'Stand ')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Timestamp and Trace button */}
      <div className="flex gap-2 text-[9px] text-gray-500 px-1 font-mono">
        <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        
        {!isUser && message.metadata?.agentTraceId && onTraceClick && (
          <button
            onClick={() => onTraceClick(message.metadata!.agentTraceId!)}
            className="text-teal hover:underline cursor-pointer"
            aria-label="Inspect AI reasoning trace for this response"
          >
            • Inspect Trace
          </button>
        )}
      </div>
    </div>
  );
};
