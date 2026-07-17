import React from 'react';

interface QuickActionsProps {
  onActionClick: (text: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  const actions = [
    { label: "🍕 Find food", query: "Where are the concession stands and what food is available?" },
    { label: "🚻 Nearest Restroom", query: "Where is the nearest restroom to Section 110?" },
    { label: "🚆 Train Schedule", query: "How do I get to the stadium by train and where is the station?" },
    { label: "👜 Clear Bag Policy", query: "What is the bag policy and what size bag can I bring?" },
    { label: "📦 Lost & Found", query: "I lost my wallet, where is the Lost and Found booth located?" },
    { label: "♿ Accessible Restrooms", query: "Where are the accessible restrooms and ADA seating sections?" }
  ];

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-none select-none"
      role="toolbar"
      aria-label="Quick inquiry choices"
    >
      {actions.map((act) => (
        <button
          key={act.label}
          onClick={() => onActionClick(act.query)}
          className="flex-shrink-0 px-3.5 py-2 rounded-full glass border border-white/8 text-xs text-white hover:text-teal hover:border-teal/40 cursor-pointer transition-all duration-200"
          aria-label={`Ask about: ${act.label}`}
        >
          {act.label}
        </button>
      ))}
    </div>
  );
};
