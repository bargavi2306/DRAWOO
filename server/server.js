/**
 * DRAWO Multiplayer Backend Server Entry Point
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './rooms/RoomManager.js';
import { setupSocketHandlers } from './socket/socketHandler.js';

const app = express();
const httpServer = createServer(app);

// CORS configuration for local development or production environment
const CORS_ORIGIN = process.env.CLIENT_ORIGIN || process.env.CORS_ORIGIN || '*';

app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST']
}));

app.use(express.json());

// Initialize Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST']
  }
});

// Initialize in-memory RoomManager
const roomManager = new RoomManager();

// Wire Socket event handlers
setupSocketHandlers(io, roomManager);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: roomManager.rooms.size,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🎨 DRAWO Realtime Server Running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`=================================`);
});
