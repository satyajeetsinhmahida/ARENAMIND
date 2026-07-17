import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { WSMessage, WSMessageType } from '../types/index.js';

// Map storing active client connections and their channel subscriptions
const activeClients = new Map<WebSocket, Set<string>>();

/**
 * Initializes WebSocket server handlers.
 * 
 * @param wss The active WebSocketServer instance
 */
export function initWSHandlers(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    console.log(`New WebSocket client connected from ${req.socket.remoteAddress}`);
    
    // Default subscription channels
    const subscriptions = new Set<string>(['telemetry', 'ops', 'chat', 'trace', 'broadcast']);
    activeClients.set(ws, subscriptions);

    ws.on('message', (message: string) => {
      try {
        const parsed = JSON.parse(message) as WSMessage<any>;
        
        if (parsed.type === 'client:subscribe') {
          const channels = parsed.payload.channels as string[];
          subscriptions.clear();
          for (const ch of channels) {
            subscriptions.add(ch);
          }
          console.log(`Client updated channel subscriptions: ${channels.join(', ')}`);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message from client:', err);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected.');
      activeClients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('WebSocket client connection error:', err);
      activeClients.delete(ws);
    });
  });

  // Attach global broadcasting hook for simple cross-module events
  (global as any).broadcastWS = (channel: string, payload: any) => {
    broadcastToChannel(channel, payload);
  };
}

/**
 * Broadcasts an event payload to all clients subscribed to a specific channel.
 * 
 * @param channel Channel name (e.g. telemetry, ops, trace, broadcast)
 * @param payload TelemetryEvent, ActionCard, TraceStep etc.
 */
export function broadcastToChannel(channel: string, payload: any): void {
  let wsType: WSMessageType = 'simulator:telemetry';

  if (channel === 'telemetry') wsType = 'simulator:telemetry';
  else if (channel === 'phase') wsType = 'simulator:phase';
  else if (channel === 'ops') wsType = 'ops:action';
  else if (channel === 'ops_update') wsType = 'ops:action_update';
  else if (channel === 'trace') wsType = 'agent:trace';
  else if (channel === 'broadcast') wsType = 'broadcast:emergency';
  else if (channel === 'zone_status') wsType = 'zone:status';

  const wsMessage: WSMessage = {
    type: wsType,
    payload,
    timestamp: new Date().toISOString()
  };

  const serialized = JSON.stringify(wsMessage);

  for (const [ws, subs] of activeClients.entries()) {
    if (ws.readyState === WebSocket.OPEN && subs.has(channel)) {
      try {
        ws.send(serialized);
      } catch (err) {
        console.error('Error sending WS message to client:', err);
      }
    }
  }
}
