import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { WSMessage, WSMessageType } from '../types/index.js';

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (type: WSMessageType, payload: any) => void;
  subscribe: (type: WSMessageType, callback: (payload: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const callbacksRef = useRef<Map<WSMessageType, Set<(payload: any) => void>>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const messageQueueRef = useRef<{ type: WSMessageType; payload: any }[]>([]);

  // Batching/Throttling telemetry events to avoid UI lockups (100ms throttling)
  const telemetryBatchRef = useRef<Map<string, any>>(new Map());
 // const telemetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const telemetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = () => {
    // Resolve ws connection URL dynamically
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.port === '5173' ? `${window.location.hostname}:3001` : window.location.host;
    const wsUrl = `${protocol}//${wsHost}/ws`;

    console.log(`Connecting to WebSocket: ${wsUrl}`);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket Connection Opened.');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;

      // Drain message queue if any items buffered while offline
      while (messageQueueRef.current.length > 0) {
        const msg = messageQueueRef.current.shift()!;
        sendMessage(msg.type, msg.payload);
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage;
        
        // Apply throttling to fast-ticking telemetry sensor events
        if (message.type === 'simulator:telemetry') {
          const telemetryData = message.payload as any;
          telemetryBatchRef.current.set(`${telemetryData.zone_id}-${telemetryData.type}`, telemetryData);
          
          if (!telemetryTimeoutRef.current) {
            telemetryTimeoutRef.current = setTimeout(() => {
              const callbacks = callbacksRef.current.get('simulator:telemetry');
              if (callbacks) {
                for (const data of telemetryBatchRef.current.values()) {
                  callbacks.forEach(cb => cb(data));
                }
              }
              telemetryBatchRef.current.clear();
              telemetryTimeoutRef.current = null;
            }, 100);
          }
          return;
        }

        // Standard execution for other channels
        const callbacks = callbacksRef.current.get(message.type);
        if (callbacks) {
          callbacks.forEach(cb => cb(message.payload));
        }
      } catch (err) {
        console.error('WebSocket client failed to parse message:', err);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      socketRef.current = null;
      console.log('WebSocket Connection Closed. Attempting reconnect...');

      // Exponential backoff reconnect
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 15000);
      reconnectAttemptsRef.current++;
      setTimeout(connect, delay);
    };

    socket.onerror = (err) => {
      console.error('WebSocket Error:', err);
      socket.close();
    };
  };

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (telemetryTimeoutRef.current) {
        clearTimeout(telemetryTimeoutRef.current);
      }
    };
  }, []);

  const sendMessage = (type: WSMessageType, payload: any) => {
    const wsMessage: WSMessage = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(wsMessage));
    } else {
      console.warn('WebSocket not connected. Buffering message in queue.');
      messageQueueRef.current.push({ type, payload });
    }
  };

  const subscribe = (type: WSMessageType, callback: (payload: any) => void) => {
    let callbacks = callbacksRef.current.get(type);
    if (!callbacks) {
      callbacks = new Set();
      callbacksRef.current.set(type, callbacks);
    }
    callbacks.add(callback);

    // Return an unsubscribe function
    return () => {
      const currentCallbacks = callbacksRef.current.get(type);
      if (currentCallbacks) {
        currentCallbacks.delete(callback);
        if (currentCallbacks.size === 0) {
          callbacksRef.current.delete(type);
        }
      }
    };
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocketContext must be used within WebSocketProvider');
  return context;
};
