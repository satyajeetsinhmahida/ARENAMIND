import React, { useState } from 'react';
import { useAccessibilityContext } from '../../contexts/AccessibilityContext.js';
import { AccessibilityMode } from '../../types/index.js';

export const AccessibilityToggle: React.FC = () => {
  const { accessibilityMode, setAccessibilityMode, highContrast, setHighContrast } = useAccessibilityContext();
  const [isOpen, setIsOpen] = useState(false);

  const modes: { code: AccessibilityMode; label: string; desc: string }[] = [
    {
      code: 'standard',
      label: 'Standard Mode',
      desc: 'Default interactive configuration.'
    },
    {
      code: 'simplified',
      label: 'Simplified Language',
      desc: 'Short, clear sentences with basic vocabulary for easy reading.'
    },
    {
      code: 'screen-reader',
      label: 'Screen Reader Optimized',
      desc: 'Structured text headers and clean lists. Disables emoji strings.'
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-9 h-9 rounded-lg border cursor-pointer transition-all duration-200 ${
          accessibilityMode !== 'standard' || highContrast
            ? 'bg-teal border-teal text-navy shadow-lg font-bold'
            : 'border-white/10 text-gray-300 hover:text-white hover:bg-white/5'
        }`}
        aria-label="Toggle Accessibility Preferences panel"
        aria-expanded={isOpen}
      >
        ♿
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 glass-dark border border-white/10 rounded-xl shadow-2xl p-4 z-50 animate-fade-in flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="font-semibold text-white text-xs font-outfit">Accessibility Preferences</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white text-xs"
              aria-label="Close preferences"
            >
              ✕
            </button>
          </div>

          {/* Mode list buttons */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-teal font-semibold uppercase tracking-wider">Interface Mode</span>
            {modes.map((m) => {
              const isActive = accessibilityMode === m.code;
              return (
                <button
                  key={m.code}
                  onClick={() => {
                    setAccessibilityMode(m.code);
                    setIsOpen(false);
                  }}
                  className={`flex flex-col items-start text-left p-2.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'border-teal bg-teal/5 text-teal font-medium'
                      : 'border-transparent text-gray-300 hover:bg-white/5 hover:border-white/5'
                  }`}
                  aria-pressed={isActive}
                >
                  <span className="text-xs font-semibold">{m.label}</span>
                  <span className="text-[9px] text-gray-400 mt-0.5 leading-relaxed">{m.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Additional Contrast Toggles */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">Double Font Contrast</span>
              <span className="text-[9px] text-gray-400 mt-0.5">Increases font visibility limits.</span>
            </div>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-all duration-200 ${
                highContrast ? 'bg-teal' : 'bg-white/10'
              }`}
              aria-checked={highContrast}
              role="switch"
              aria-label="Toggle High Font Contrast"
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-all duration-200 ${
                highContrast ? 'transform translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
