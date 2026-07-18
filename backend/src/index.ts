// import express from 'express';
// import { createServer } from 'http';
// import { WebSocketServer } from 'ws';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import path from 'path';
// import { fileURLToPath } from 'url';

// // Configure environment variables first
// dotenv.config();

// import { initDb } from './db/store.js';
// import { initKnowledgeBase } from './rag/knowledge-base.js';
// import { AgentOrchestrator } from './agents/orchestrator.js';
// import { FanConciergeAgent } from './agents/fan-concierge.js';
// import { CrowdIntelligenceAgent } from './agents/crowd-intelligence.js';
// import { OpsCommanderAgent } from './agents/ops-commander.js';
// import { SafetyAgent } from './agents/safety-accessibility.js';
// import { SimulatorEngine } from './simulator/engine.js';
// import { initWSHandlers, broadcastToChannel } from './api/ws-handlers.js';
// import { initRoutes } from './api/routes.js';
// import { requestLogger } from './api/middleware.js';

// // Resolve project directories under ESM
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const rootDir = path.resolve(__dirname, '..');

// const dbPath = process.env.DB_PATH || path.join(rootDir, 'data', 'arenamind.db');
// const kbDir = path.join(rootDir, 'knowledge-base');
// const promptsDir = path.join(rootDir, 'prompts');
// const port = Number(process.env.PORT) || 3001;

// async function bootstrap() {
//   console.log('--- ArenaMind Stadium Operations Layer Bootstrapping ---');

//   // 1. Initialize SQLite database
//   initDb(dbPath);
//   console.log(`SQLite database store running at: ${dbPath}`);

//   // 2. Initialize RAG Knowledge base
//   initKnowledgeBase(kbDir);

//   // 3. Initialize Shared LLM orchestrator
//   const orchestrator = new AgentOrchestrator(promptsDir);

//   // 4. Initialize agents
//   const fanAgent = new FanConciergeAgent(orchestrator);
//   const crowdIntelAgent = new CrowdIntelligenceAgent();
//   const opsCommanderAgent = new OpsCommanderAgent(orchestrator);
//   const safetyAgent = new SafetyAgent(orchestrator);

//   // 5. Initialize telemetry simulator
//   const simInterval = Number(process.env.SIMULATOR_INTERVAL_MS) || 3000;
//   const simulator = new SimulatorEngine(kbDir, simInterval);

//   // 6. Setup Express App
//   const app = express();
  
//   // Enable CORS
//   app.use(cors({
//     origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//     credentials: true
//   }));
  
//   app.use(express.json());
//   app.use(requestLogger);

//   // Bind API routes
//   const apiRouter = initRoutes(simulator, fanAgent, opsCommanderAgent, safetyAgent);
//   app.use('/api', apiRouter);

//   // Serve static assets in production if needed
//   // app.use(express.static(path.join(rootDir, 'public')));

//   // Create HTTP Server
//   const server = createServer(app);

//   // 7. Setup WebSocket Server upgrading express routes
//   const wss = new WebSocketServer({ noServer: true });
//   initWSHandlers(wss);

//   server.on('upgrade', (request, socket, head) => {
//     const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    
//     if (pathname === '/ws') {
//       wss.handleUpgrade(request, socket, head, (ws) => {
//         wss.emit('connection', ws, request);
//       });
//     } else {
//       socket.destroy();
//     }
//   });

//   // 8. Connect Simulator Events to Agent Processing
//   simulator.on('telemetry', (event) => {
//     // Broadcast raw telemetry logs to clients (maps)
//     broadcastToChannel('telemetry', event);

//     // Pass turnstile events through Crowd Intel analyzer (Agent 2)
//     const intelEvent = crowdIntelAgent.processTelemetry(event);
//     if (intelEvent) {
//       // Broadcast crowd intelligence alert
//       broadcastToChannel('crowd:event', intelEvent);

//       // Route alert immediately to Ops Commander (Agent 3) to generate action recommendation
//       opsCommanderAgent.processEvent(intelEvent).catch(err => {
//         console.error('Ops Commander failed to generate action card:', err);
//       });
//     }
//   });

//   simulator.on('phase_change', (payload) => {
//     broadcastToChannel('phase', payload);
//   });

//   // Start telemetry simulator
//   simulator.start();

//   // Start listening
//   server.listen(port, () => {
//     console.log(`ArenaMind Server successfully listening on port ${port}`);
//     console.log(`WebSocket endpoint enabled at ws://localhost:${port}/ws`);
//   });

//   // Handle graceful shutdowns
//   process.on('SIGTERM', () => {
//     console.log('SIGTERM signal received. Shutting down gracefully...');
//     simulator.stop();
//     server.close(() => {
//       console.log('Express/WebSocket server stopped.');
//       process.exit(0);
//     });
//   });
// }

// bootstrap().catch(err => {
//   console.error('Bootstrapping error:', err);
//   process.exit(1);
// });
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure environment variables first
dotenv.config();

import { initDb } from './db/store.js';
import { initKnowledgeBase } from './rag/knowledge-base.js';
import { AgentOrchestrator } from './agents/orchestrator.js';
import { FanConciergeAgent } from './agents/fan-concierge.js';
import { CrowdIntelligenceAgent } from './agents/crowd-intelligence.js';
import { OpsCommanderAgent } from './agents/ops-commander.js';
import { SafetyAgent } from './agents/safety-accessibility.js';
import { SimulatorEngine } from './simulator/engine.js';
import { initWSHandlers, broadcastToChannel } from './api/ws-handlers.js';
import { initRoutes } from './api/routes.js';
import { requestLogger } from './api/middleware.js';

// Resolve project directories under ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dbPath = process.env.DB_PATH || path.join(rootDir, 'data', 'arenamind.db');
const kbDir = path.join(rootDir, 'knowledge-base');
const promptsDir = path.join(rootDir, 'prompts');
const port = Number(process.env.PORT) || 3001;

async function bootstrap() {
  console.log('--- ArenaMind Stadium Operations Layer Bootstrapping ---');

  // 1. Initialize SQLite database
  initDb(dbPath);
  console.log(`SQLite database store running at: ${dbPath}`);

  // 2. Initialize RAG Knowledge base
  initKnowledgeBase(kbDir);

  // 3. Initialize Shared LLM orchestrator
  const orchestrator = new AgentOrchestrator(promptsDir);

  // 4. Initialize agents
  const fanAgent = new FanConciergeAgent(orchestrator);
  const crowdIntelAgent = new CrowdIntelligenceAgent();
  const opsCommanderAgent = new OpsCommanderAgent(orchestrator);
  const safetyAgent = new SafetyAgent(orchestrator);

  // 5. Initialize telemetry simulator
  const simInterval = Number(process.env.SIMULATOR_INTERVAL_MS) || 3000;
  const simulator = new SimulatorEngine(kbDir, simInterval);

  // 6. Setup Express App
  const app = express();
  
  // Enable CORS
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }));
  
  app.use(express.json());
  app.use(requestLogger);

  // Bind API routes
  const apiRouter = initRoutes(simulator, fanAgent, opsCommanderAgent, safetyAgent);
  app.use('/api', apiRouter);

  // Serve the built frontend (Vite output lives in the repo root's dist/ folder)
  const frontendDist = path.join(rootDir, '..', 'dist');
  app.use(express.static(frontendDist));

  // SPA fallback: any GET that isn't /api/* or /ws gets index.html so
  // React Router can handle client-side routes like /fan and /ops on refresh
  app.get(/^(?!\/api|\/ws).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });

  // Create HTTP Server
  const server = createServer(app);

  // 7. Setup WebSocket Server upgrading express routes
  const wss = new WebSocketServer({ noServer: true });
  initWSHandlers(wss);

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // 8. Connect Simulator Events to Agent Processing
  simulator.on('telemetry', (event) => {
    // Broadcast raw telemetry logs to clients (maps)
    broadcastToChannel('telemetry', event);

    // Pass turnstile events through Crowd Intel analyzer (Agent 2)
    const intelEvent = crowdIntelAgent.processTelemetry(event);
    if (intelEvent) {
      // Broadcast crowd intelligence alert
      broadcastToChannel('crowd:event', intelEvent);

      // Route alert immediately to Ops Commander (Agent 3) to generate action recommendation
      opsCommanderAgent.processEvent(intelEvent).catch(err => {
        console.error('Ops Commander failed to generate action card:', err);
      });
    }
  });

  simulator.on('phase_change', (payload) => {
    broadcastToChannel('phase', payload);
  });

  // Start telemetry simulator
  simulator.start();

  // Start listening
  server.listen(port, () => {
    console.log(`ArenaMind Server successfully listening on port ${port}`);
    console.log(`WebSocket endpoint enabled at ws://localhost:${port}/ws`);
  });

  // Handle graceful shutdowns
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Shutting down gracefully...');
    simulator.stop();
    server.close(() => {
      console.log('Express/WebSocket server stopped.');
      process.exit(0);
    });
  });
}

bootstrap().catch(err => {
  console.error('Bootstrapping error:', err);
  process.exit(1);
});

