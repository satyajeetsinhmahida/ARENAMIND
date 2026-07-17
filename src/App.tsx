import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WebSocketProvider } from './contexts/WebSocketContext.js';
import { AccessibilityProvider } from './contexts/AccessibilityContext.js';
import { LandingPage } from './components/LandingPage.js';
import { FanApp } from './components/fan/FanApp.js';
import { OpsApp } from './components/ops/OpsApp.js';

export const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <WebSocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Stunning landing page at root */}
            <Route path="/" element={<LandingPage />} />
            {/* Fan concierge experience */}
            <Route path="/fan" element={<FanApp />} />
            {/* Operations command center */}
            <Route path="/ops" element={<OpsApp />} />
            {/* Catch-all fallback to landing */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </BrowserRouter>
      </WebSocketProvider>
    </AccessibilityProvider>
  );
};

export default App;
