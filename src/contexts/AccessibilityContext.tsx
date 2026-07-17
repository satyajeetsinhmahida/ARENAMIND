import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, AccessibilityMode } from '../types/index.js';

interface AccessibilityContextType {
  accessibilityMode: AccessibilityMode;
  setAccessibilityMode: (mode: AccessibilityMode) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  highContrast: boolean;
  setHighContrast: (active: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (active: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessibilityMode, setAccessibilityMode] = useState<AccessibilityMode>(() => {
    return (localStorage.getItem('am_accessibility_mode') as AccessibilityMode) || 'standard';
  });

  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('am_language') as Language) || 'en';
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('am_high_contrast') === 'true';
  });

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    // Check local storage or match media query
    const saved = localStorage.getItem('am_reduced_motion');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Sync state modifications to localStorage
  useEffect(() => {
    localStorage.setItem('am_accessibility_mode', accessibilityMode);
  }, [accessibilityMode]);

  useEffect(() => {
    localStorage.setItem('am_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('am_high_contrast', String(highContrast));
    
    // Toggle contrast class on root HTML node for styling
    if (highContrast) {
      document.documentElement.classList.add('contrast-double');
    } else {
      document.documentElement.classList.remove('contrast-double');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('am_reduced_motion', String(reducedMotion));
  }, [reducedMotion]);

  return (
    <AccessibilityContext.Provider
      value={{
        accessibilityMode,
        setAccessibilityMode,
        language,
        setLanguage,
        highContrast,
        setHighContrast,
        reducedMotion,
        setReducedMotion
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibilityContext = () => {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibilityContext must be used within AccessibilityProvider');
  return context;
};
