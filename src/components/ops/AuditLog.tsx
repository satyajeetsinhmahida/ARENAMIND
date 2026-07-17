import React, { useEffect, useState } from 'react';
import { AuditLogEntry } from '../../types/index.js';

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/audit');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Poll logs every 10 seconds
    const timer = setInterval(fetchLogs, 10000);
    return () => clearInterval(timer);
  }, []);

  const getResponseColor = (resp: string): string => {
    if (resp === 'accepted') return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (resp === 'dismissed') return 'text-gray-400 bg-white/5 border-white/8';
    return 'text-amber bg-amber/10 border-amber/20';
  };

  return (
    <div className="flex flex-col h-full gap-4 text-xs">
      
      {/* Header controls */}
      <div className="flex justify-between items-center pb-2 border-b border-white/5">
        <h4 className="font-bold text-white text-sm font-outfit">Operations Audit Log</h4>
        <button
          onClick={fetchLogs}
          className="px-2 py-1 rounded border border-white/5 text-[10px] text-gray-400 hover:text-white cursor-pointer"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Audit grid list */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            No decisions logged yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="glass p-3 border border-white/5 rounded-xl flex flex-col gap-2 font-mono text-[10px] text-gray-300 leading-relaxed"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white uppercase tracking-wider text-[9px] text-teal">
                    Role: {log.staffRole}
                  </span>
                  <span className="text-gray-500 text-[8px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div>{log.notes}</div>

                <div className="flex gap-2 items-center mt-1">
                  <span className="text-gray-500 text-[9px]">Decision:</span>
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-semibold ${getResponseColor(log.response)}`}>
                    {log.response.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
