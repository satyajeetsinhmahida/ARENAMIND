import React from 'react';
import { useAccessibilityContext } from '../../contexts/AccessibilityContext.js';
import { Language } from '../../types/index.js';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useAccessibilityContext();

  const options: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' }
  ];

  return (
    <div
      className="flex items-center gap-1 glass rounded-lg p-1 border border-white/5"
      role="toolbar"
      aria-label="Select Interface Language"
    >
      {options.map((opt) => {
        const isActive = language === opt.code;
        return (
          <button
            key={opt.code}
            onClick={() => setLanguage(opt.code)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all duration-200 ${
              isActive
                ? 'bg-teal text-navy shadow-lg font-bold font-outfit'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
            aria-label={`Switch language to ${opt.label}`}
            aria-pressed={isActive}
          >
            <span>{opt.flag}</span>
            <span className="hidden sm:inline">{opt.label.substring(0, 3)}</span>
          </button>
        );
      })}
    </div>
  );
};
