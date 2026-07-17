import { useEffect } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext.js';
import { WSMessageType } from '../types/index.js';

/**
 * Custom hook to subscribe to specific WebSocket channel messages.
 * 
 * @param type Channel Type (e.g. 'simulator:telemetry', 'ops:action')
 * @param callback Callback triggered when message is received
 */
export function useWebSocket(type: WSMessageType, callback: (payload: any) => void) {
  const ws = useWebSocketContext();

  useEffect(() => {
    const unsubscribe = ws.subscribe(type, callback);
    return () => {
      unsubscribe();
    };
  }, [type, callback, ws]);

  return { sendMessage: ws.sendMessage, isConnected: ws.isConnected };
}
