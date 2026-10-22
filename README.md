# DRAWO 🎨 — Realtime Multiplayer Drawing & Guessing Game

DRAWO is a production-quality, human-only realtime multiplayer drawing and guessing game built with React, Node.js, and Socket.IO, featuring a pastel claymorphism visual aesthetic.

> **Deployment Status**: The application is **deployment-ready** with full production environment support, strict CORS controls, and automated verification suites. It is currently configured for local/self-hosted deployment; no public production URL has been provisioned yet.

---

## 🛠️ Tech Stack & Architecture

* **Frontend**: React 19, Vite 6, CSS Modules with Claymorphic Design System
* **Backend**: Node.js, Express 5, Socket.IO 4
* **State & Networking**: Authoritative server-driven in-memory room management (`Map`-backed sessions, no external database required)
* **Testing**: Node.js Built-in Test Runner (`node --test`), Vite SSR Verification Suites, Realtime Socket Integration Tests

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
* Node.js v18+ (tested on Node v20/v24)
* npm v9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Backend Realtime Server (Port 4000)
```bash
npm run server
```
Server runs at `http://localhost:4000`. Health check endpoint: `http://localhost:4000/health`.

### 4. Start the Frontend Dev Server (Port 3000)
In a separate terminal window:
```bash
npm run dev
```
Client runs at `http://localhost:3000`.

---

## 🌐 Environment Variables

See `.env.example` for reference templates:

| Variable | Target Service | Default (Dev) | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend | `4000` | Port for the Express + Socket.IO HTTP server |
| `NODE_ENV` | Backend | `development` | Set to `production` when deployed |
| `CLIENT_ORIGIN` | Backend | `*` (dev) | **Required in production**. Allowed frontend origin (e.g. `https://drawo.vercel.app` or comma-separated list). Wildcard is blocked in production. |
| `VITE_SOCKET_URL` | Frontend | `http://localhost:4000` | Socket server URL for client connection (e.g. `https://drawo-api.up.railway.app`) |

---

## ☁️ Production Deployment Guide

### A. Backend Deployment (Node.js Container / Persistent Process)
> **IMPORTANT**: The backend requires a persistent Node.js environment supporting long-lived WebSocket connections (e.g. **Railway**, **Render Web Service**, **Fly.io**, or a Linux VPS). Serverless function platforms (AWS Lambda, Vercel Serverless) are not supported because games run in-memory.

1. **Deploy to Platform**: Connect the repository to your hosting provider.
2. **Build & Start Commands**:
   * Build Command: `npm install`
   * Start Command: `node server/server.js` (or `npm run server`)
3. **Set Environment Variables**:
   * `NODE_ENV=production`
   * `PORT=4000` (or leave default assigned by host)
   * `CLIENT_ORIGIN=https://your-frontend-domain.com`
4. **Verify Health**:
   * Navigate to `https://your-backend-domain.com/health` to confirm `{ "status": "ok", "environment": "production" }`.

### B. Frontend Deployment (Static Hosting)
> Can be hosted on any static hosting provider (e.g. **Vercel**, **Netlify**, **Cloudflare Pages**, or **Render Static Site**).

1. **Build & Output Settings**:
   * Build Command: `npm run build`
   * Output Directory: `dist`
2. **Set Environment Variables**:
   * `VITE_SOCKET_URL=https://your-backend-domain.com` (must be configured at build time)
3. **HTTPS / WSS Requirement**:
   * Both frontend and backend must use HTTPS/WSS when deployed publicly to prevent browser mixed-content security blocks.

---

## 🧪 Automated Testing & Verification

Run the complete verification pipeline before deploying:

```bash
# 1. Run core unit and regression test suite (27 tests):
npm test

# 2. Compile production bundle:
npm run build

# 3. Verify Socket.IO private rooms & bot rejection (requires active server):
node tests/integrationPrivateRooms.mjs

# 4. Verify clean SSR viewport and no development toolbar:
node tests/verifyCleanApp.mjs

# 5. Verify Game Over Olympic podium and score breakdown (7 scenarios):
node tests/verifyGameOver.mjs

# 6. Run full 12-flow live multiplayer smoke test:
node tests/manualMultiplayerSmoke.mjs
```

---

## 🔒 Game Invariants & Rules

1. **Private Rooms Only**: Public matchmaking and bots have been permanently eliminated.
2. **Authoritative Server**: Server controls roles, word choices, turn rotation, scoring, and timers. Clients cannot dictate score or turn status.
3. **Word Secrecy**: The secret word is strictly masked (`null`) for all guessers and never leaked in socket room broadcasts.
4. **Scoring Integrity**: Base points (800) + time bonus calculated authoritatively; drawer receives 25% bonus; departures award zero points.
5. **Round Limits**: Configured number of rounds is strictly enforced with automatic Game Over spotlight transition.
6. **Instant Victory**: If an opponent leaves and only one human remains in an active match, that player is awarded the win immediately.

---

## ⚠️ Known Architecture Limitations

* **In-Memory State**: Active rooms and game sessions are held in server memory. If the backend process restarts or crashes, active room states are lost and players must create or join a new room.
* **Single-Instance Deployment**: Designed as a single-instance backend. Horizontal scaling across multiple nodes would require a Redis adapter for Socket.IO pub/sub, which is intentionally excluded to keep the stack lightweight.
