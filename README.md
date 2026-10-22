# DRAWO 🎨 — Realtime Multiplayer Drawing & Guessing Game

DRAWO is a production-quality, human-only realtime multiplayer drawing and guessing game built with React, Node.js, and Socket.IO, featuring a pastel claymorphism visual aesthetic.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, Vite 6, CSS Modules with Claymorphic Design System
* **Backend**: Node.js, Express 5, Socket.IO 4
* **State & Networking**: Authoritative server-driven in-memory room management (`Map`-backed sessions, no external database required)
* **Testing**: Node.js Built-in Test Runner (`node --test`), Vite SSR Verification Suites

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend Realtime Server (Port 4000)
```bash
npm run server
```
Server runs at `http://localhost:4000`. Health check available at `http://localhost:4000/health`.

### 3. Start the Frontend Dev Server (Port 3000)
In a separate terminal:
```bash
npm run dev
```
Client runs at `http://localhost:3000`.

---

## 🧪 Running Tests

### Automated Test Suites
Run the core test suite (27 tests covering GameEngine, TurnManager, WordManager, 3-Bug Multiplayer, and Player Departures):
```bash
npm test
```

### Integration & SSR Verification
```bash
# Socket.IO integration test with active server:
node tests/integrationPrivateRooms.mjs

# SSR Game Over podium verification (7 scenarios):
node tests/verifyGameOver.mjs

# SSR Clean Home & Viewport verification:
node tests/verifyCleanApp.mjs

# Complete 12-flow live multiplayer smoke test:
node tests/manualMultiplayerSmoke.mjs
```

---

## 📦 Production Build

Compile optimized production assets into `dist/`:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

---

## 🌐 Environment Variables

See `.env.example`:
* `PORT`: Backend port (default `4000`)
* `CLIENT_ORIGIN`: Allowed CORS origin for frontend (default `*` in dev)
* `VITE_SOCKET_URL`: Socket server URL for frontend (default `http://localhost:4000`)

---

## 🔒 Game Invariants & Multiplayer Rules

1. **Private Rooms Only**: Public matchmaking and bots are completely eliminated.
2. **Authoritative Server**: Server controls roles, word choices, turn rotation, scoring, and timers.
3. **Word Secrecy**: The secret word is strictly masked (`null`) for all guessers and never leaked in socket room broadcasts.
4. **Scoring Integrity**: Base points (800) + time bonus calculated authoritatively; drawer receives 25% bonus; departures award zero points.
5. **Round Limits**: The configured number of rounds is strictly enforced with automatic Game Over spotlight transition.
