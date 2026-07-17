import React, { useState } from 'react';
import { EmergencyBroadcast } from '../../types/index.js';

interface PanicButtonProps {
  sessionId: string;
}

const ALERT_TYPES = [
  { label: '⚕️ Medical Emergency', code: 'Medical concern/injury', color: '#FF3366' },
  { label: '🛡️ Security Threat',   code: 'Security concern/misconduct', color: '#FF3366' },
  { label: '🔥 Fire / Hazard',     code: 'Fire or structural concern', color: '#FF7800' },
  { label: '♿ Mobility / Lost',   code: 'Emergency mobility guidance needed', color: '#FFB800' },
];

export const PanicButton: React.FC<PanicButtonProps> = ({ sessionId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<EmergencyBroadcast | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [locationText, setLocationText] = useState('');

  const handleSubmit = async () => {
    if (!locationText.trim()) {
      alert('Please enter your section and seat so responders can find you.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: selectedReason || 'SOS Emergency Panic Flagged.',
          location: locationText,
          sessionId,
        }),
      });
      if (!res.ok) throw new Error('Emergency API failed');
      const data = await res.json();
      setBroadcastResult(data.broadcast);
    } catch {
      alert('⚠️ Connection failed. Shout for stadium staff immediately.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setBroadcastResult(null);
    setSelectedReason('');
    setLocationText('');
  };

  return (
    <>
      {/* SOS Button */}
      <button
        id="sos-panic-btn"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full flex items-center justify-center font-outfit font-black text-sm text-white cursor-pointer transition-all duration-200 hover:scale-110 animate-pulse-red"
        style={{
          background: 'linear-gradient(135deg, #FF3366, #CC0033)',
          border: '3px solid rgba(255,51,102,0.3)',
          boxShadow: '0 0 30px rgba(255,51,102,0.5), 0 4px 20px rgba(0,0,0,0.5)',
        }}
        aria-label="Trigger SOS Emergency Alert"
      >
        SOS
      </button>

      {/* Emergency Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(13,30,53,0.98), rgba(7,15,32,0.99))',
              border: '1px solid rgba(255,51,102,0.25)',
              boxShadow: '0 0 60px rgba(255,51,102,0.2), 0 20px 60px rgba(0,0,0,0.8)',
            }}
          >
            {/* Modal Header */}
            <div
              className="px-6 py-5"
              style={{
                background: 'linear-gradient(90deg, rgba(255,51,102,0.12), transparent)',
                borderBottom: '1px solid rgba(255,51,102,0.15)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl animate-pulse-red"
                  style={{
                    background: 'rgba(255,51,102,0.15)',
                    border: '1px solid rgba(255,51,102,0.3)',
                  }}
                >
                  🚨
                </div>
                <div>
                  <h3 className="font-outfit font-black text-white text-lg leading-none">Emergency Alert</h3>
                  <p className="font-mono text-[10px] mt-1" style={{ color: 'rgba(255,51,102,0.7)' }}>
                    METLIFE STADIUM · DIRECT DISPATCH
                  </p>
                </div>
              </div>
            </div>

            {!broadcastResult ? (
              <div className="p-6 flex flex-col gap-5">
                <p className="text-xs text-gray-400 leading-relaxed">
                  This immediately alerts the <strong className="text-white">Stadium Operations Command Center</strong> and broadcasts a location-specific emergency response.
                </p>

                {/* Alert Type Grid */}
                <div>
                  <div className="font-mono text-[9px] text-gray-600 uppercase tracking-widest mb-3">Select Emergency Type</div>
                  <div className="grid grid-cols-2 gap-2">
                    {ALERT_TYPES.map(opt => (
                      <button
                        key={opt.code}
                        onClick={() => setSelectedReason(opt.code)}
                        className="p-3 rounded-xl text-xs text-left cursor-pointer transition-all duration-200 font-medium"
                        style={{
                          background: selectedReason === opt.code
                            ? `${opt.color}15`
                            : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${selectedReason === opt.code ? opt.color + '50' : 'rgba(255,255,255,0.06)'}`,
                          color: selectedReason === opt.code ? opt.color : '#9CA3AF',
                          boxShadow: selectedReason === opt.code ? `0 0 12px ${opt.color}20` : 'none',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Input */}
                <div>
                  <label
                    className="font-mono text-[9px] text-gray-600 uppercase tracking-widest block mb-2"
                    htmlFor="sos-location"
                  >
                    Your Section &amp; Seat <span style={{ color: '#FF3366' }}>*Required</span>
                  </label>
                  <input
                    id="sos-location"
                    type="text"
                    placeholder="e.g. Section 110, Row 5, Seat 12"
                    value={locationText}
                    onChange={e => setLocationText(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,51,102,0.15)',
                    }}
                    onFocus={e => { e.currentTarget.style.border = '1px solid rgba(255,51,102,0.5)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(255,51,102,0.15)'; }}
                    onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,51,102,0.15)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3 rounded-xl font-mono text-[10px] text-gray-500 hover:text-white cursor-pointer transition-colors border border-white/5 hover:border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !selectedReason || !locationText.trim()}
                    className="flex-2 flex-grow py-3 rounded-xl font-outfit font-black text-sm text-white cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: loading
                        ? 'rgba(255,51,102,0.3)'
                        : 'linear-gradient(135deg, #FF3366, #CC0033)',
                      boxShadow: '0 0 20px rgba(255,51,102,0.35)',
                    }}
                  >
                    {loading ? '⏳ Dispatching...' : '🚨 DISPATCH NOW'}
                  </button>
                </div>
              </div>
            ) : (
              // Success Screen
              <div className="p-8 flex flex-col items-center text-center gap-5" role="alert">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl animate-pulse-red"
                  style={{
                    background: 'rgba(255,51,102,0.12)',
                    border: '1px solid rgba(255,51,102,0.3)',
                  }}
                >
                  🚨
                </div>

                <div>
                  <h3 className="font-outfit font-black text-2xl text-white mb-2">Emergency Confirmed</h3>
                  <p className="font-mono text-[10px] text-red-400/70 uppercase tracking-widest">Responders Dispatched</p>
                </div>

                <div
                  className="w-full rounded-xl p-4 text-xs text-red-300 leading-relaxed text-left"
                  style={{
                    background: 'rgba(255,51,102,0.08)',
                    border: '1px solid rgba(255,51,102,0.2)',
                  }}
                >
                  {broadcastResult?.messages?.[0]?.standard || 'Emergency response team has been alerted. Help is on the way.'}
                </div>

                <p className="text-[10px] text-gray-500">
                  Responders are navigating to <strong className="text-white">{locationText}</strong>.
                  Stay visible and await assistance.
                </p>

                <button
                  onClick={handleClose}
                  className="px-8 py-3 rounded-xl font-mono text-[10px] text-gray-400 hover:text-white border border-white/10 hover:border-white/20 cursor-pointer transition-all duration-200"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
