import React from 'react';
import { ActionCard } from './ActionCard.js';
import { ActionCard as CardType, ActionResponse } from '../../types/index.js';

interface ActionFeedProps {
  cards: CardType[];
  onRespond: (id: string, response: ActionResponse) => void;
  onInspectTrace?: (traceId: string) => void;
}

export const ActionFeed: React.FC<ActionFeedProps> = ({
  cards,
  onRespond,
  onInspectTrace
}) => {
  
  // Separate and prioritize pending action items
  const pending = cards.filter(c => c.status === 'pending');
  const resolved = cards.filter(c => c.status !== 'pending');

  const criticalCount = pending.filter(c => c.urgency === 'CRITICAL').length;

  return (
    <div className="flex flex-col h-full gap-4 text-xs">
      
      {/* Header Info */}
      <div className="flex justify-between items-center pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-white text-sm font-outfit">Action Recommendation Feed</h4>
          {criticalCount > 0 && (
            <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-bounce">
              {criticalCount} Critical Alert{criticalCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <span className="text-[10px] text-gray-500 font-mono">
          Pending: {pending.length}
        </span>
      </div>

      {/* Cards list queue */}
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3.5 scrollbar-thin">
        {pending.length === 0 && resolved.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
            <span className="text-3xl">✅</span>
            <h5 className="font-semibold text-white">All Systems Nominal</h5>
            <p className="text-gray-500 text-[10px] max-w-xs">
              No crowd bottleneck or safety anomalies currently flagged by Crowd Intelligence.
            </p>
          </div>
        ) : (
          <>
            {/* 1. Pending Alerts */}
            {pending.map((card) => (
              <ActionCard
                key={card.id}
                card={card}
                onRespond={onRespond}
                onInspectTrace={onInspectTrace}
              />
            ))}

            {/* 2. Divider log header */}
            {resolved.length > 0 && (
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-4 pb-1 border-b border-white/5">
                Completed Actions ({resolved.length})
              </div>
            )}

            {/* 3. Resolved alerts logs */}
            {resolved.map((card) => (
              <ActionCard
                key={card.id}
                card={card}
                onRespond={onRespond}
                onInspectTrace={onInspectTrace}
              />
            ))}
          </>
        )}
      </div>

    </div>
  );
};
