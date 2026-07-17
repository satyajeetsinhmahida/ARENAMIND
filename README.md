# ArenaMind — Multi-Agent GenAI Operations Layer for FIFA World Cup 2026 Stadiums

ArenaMind is an operations layer for FIFA World Cup 2026 stadiums that serves two audiences from one shared intelligence core:
- **Fans**: A real-time conversational concierge for wayfinding, seating, food, schedules, and accessibility support.
- **Stadium Operations Staff**: A live command dashboard that turns real-time signals into prioritized, actionable recommendations.

The insight driving the design: **fan experience and stadium operations are the same problem viewed from two sides.** A crowd bottleneck is simultaneously a fan-experience failure and an ops failure. ArenaMind solves both with one underlying system instead of two disconnected tools.

---

## 1. Feature → Problem Statement Mapping

| Feature | Operations Benefit | Fan Experience Benefit | Problem Statement Alignment |
| :--- | :--- | :--- | :--- |
| **Interactive Heat Map** | Staff see live crowd loads across gates, sections, and concourses instantly. | Diverts fans away from heavy sections before bottlenecks occur. | *"Optimize stadium operations..."* |
| **RAG-Grounded Fan Chat** | Resolves FAQs autonomously, reducing the load on guest services booths. | Real-time wayfinding, menus, schedules in 4 languages. | *"Enhance fan experience through intelligent assistance..."* |
| **Crowd Intel agent** | Predicts bottlenecks 15–30 mins ahead using linear extrapolation logic. | Prevents crowd crush incidents at security checks. | *"Real-time signals and analytics..."* |
| **Ops Commander cards** | Prioritizes operational dispatches (e.g. open secondary gate). | Shortens queues by rebalancing line distributions. | *"Intelligent, real-time assistance..."* |
| **Safety panic button** | Instantly alerts Stadium Command with location logs. | Always-on SOS panic trigger for safety escalations. | *"Safety & Accessibility optimization..."* |
| **Multi-format layout toggles** | Simplifies translations of emergency alerts. | Renders simplified-text & screen-reader variants in real-time. | *"Accessibility compliance (WCAG 2.1 AA)..."* |

---

## 2. System Architecture

ArenaMind features four cooperating AI agents running on a shared context layer:
1. **Agent 1 — Fan Concierge Agent**: Grounded wayfinding concierge helper supporting 4 languages (EN/ES/FR/AR) and accessibility layout toggles.
2. **Agent 2 — Crowd Intelligence Agent**: Sliding window crowd load analyst forecasting bottleneck risks.
3. **Agent 3 — Operations Commander Agent**: Decisive recommendations priority engine displaying trigger signals and reasoning chains.
4. **Agent 4 — Safety & Accessibility Agent**: Evacuation advisor translating SOS panic alerts instantly.

The agents share a single **LLM Orchestration module** (`agents/orchestrator.ts`) wrapping the Google Gemini API with system prompts stored in `/prompts/*.md`. If no API key is provided, the orchestrator gracefully degrades to local rule-based templates, keeping the full demo operational.

---

## 3. Local Installation & Run Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
1. Clone the project and navigate to the root directory.
2. Install monorepo workspace dependencies:
   ```bash
   npm install
   ```
3. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```
4. (Optional) Provide your Google Gemini API key:
   Edit `.env` and set `GEMINI_API_KEY=your_api_key_here`. If left blank, the app runs in simulation mode.

### Running the App
Start both the backend server and frontend development server simultaneously:
```bash
npm run dev
```

The system will start:
- Frontend Client: [http://localhost:5173](http://localhost:5173) (Routes: `/fan` and `/ops`)
- Backend API Server: `http://localhost:3001`
- WebSocket Server: `ws://localhost:3001/ws`

---

## 4. Test Suite Execution

Run all unit, integration, and accessibility tests across the monorepo:
```bash
npm run test
```
This runs:
- `crowd-intelligence.test.ts` (Risk thresholds, regression calculations)
- `ops-commander.test.ts` (Urgency prioritization, database logs)
- `integration.test.ts` (Full pipeline mock telemetry → Ops recommendation card)
- `accessibility.test.ts` (Axe-core WCAG compliance scans)

---

## 5. Judge Demo Script (3-Minute Walkthrough)

### 0:00 - 0:30 | The Vision
- "Every crowd bottleneck is both a fan-experience failure and an operations failure. ArenaMind solves both sides from one shared intelligence core, aligning with the FIFA World Cup 2026 smart stadium goals."
- Open the Fan Concierge UI (`/fan`). Point out the interactive MetLife Stadium map and the floating top nav showing the current Pre-Match phase.

### 0:30 - 1:15 | The Fan Experience (A1 & A4)
- Type in the Chat panel: *"Where can I buy a burger?"* or select the **Quick Action** pill *"🍕 Find Food"*.
- See the immediate response details from Stand-1 (Corner Kick Burgers) showing prices, allergens, and halal flags grounded from our RAG knowledge base.
- Toggle **Simplified Language** in the accessibility settings (♿ button). Ask the same question. Note the response rewrites into short, basic sentences.
- Click **SOS Panic Button** on the bottom left. Select *Medical incident* and type *Section 110, Row 5*. Click dispatch. Show the safety broadcast popping up.

### 1:15 - 2:15 | Command Center & Anomaly Detection (A2 & A3)
- Navigate to the Operations Dashboard (`/ops`). Point out the 3-column layout. The heat map colors are changing as turnstile events stream over WebSockets.
- Wait for the **Gate C Malfunction Anomaly** to trigger. The simulator sets Gate C capacity to 0.
- In the right-hand panel, see a new **Critical Alert Card** slide in: *🚨 ANOMALY: Gate C Surge Detected!*.
- Expand the card: Point out the triggering signals (Gate C load at 90%), primary recommendation (*Open bypass channels*), and the **Reasoning Chain** showing the linear trend.
- Click the **Agent Trace** tab. Show the animated pipeline node chain updating: `Data Input → Crowd Intel → Ops Commander` with input prompts and reasoning traces.
- Click **Accept Action** on the alert.

### 2:15 - 3:00 | Audit & Conclusion
- Switch to the **Audit Log** tab. Show the logged decision entry: *"Operations_Commander clicked accepted on: Gate C Surge Detected!"*. Explain that this logs staff choices directly to the SQLite audit log database.
- Conclude: "One underlying system, serving fans and staff together, ensuring safe, accessible, and optimized operations for the world's biggest tournament."

---

## 6. What a Production Version Would Add
- **Real Sensor Integrations**: Hooking simulator telemetry endpoints to physical IoT turnstile ticket feeds, Point-of-Sale (POS) API totals, and computer vision camera feeds.
- **Enterprise Databases**: Migrating local SQLite storage to high-availability PostgreSQL for multi-terminal sync.
- **Auth & Permissions**: Adding JWT-based security constraints separating fan public routes from ops controls.
- **Scalability**: Deploying the Node.js backend using Docker containers on Kubernetes cluster nodes to handle tournament spikes of 80,000+ simultaneous users.
