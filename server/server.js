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

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
const rawOrigin = process.env.CLIENT_ORIGIN || process.env.CORS_ORIGIN;

// CORS configuration: Require explicit origin in production; permissive in development
let corsOrigin;
if (isProduction) {
  if (!rawOrigin || rawOrigin === '*') {
    console.warn('\n⚠️ [SECURITY WARNING] In production, wildcard CORS is not permitted. Please set CLIENT_ORIGIN to your frontend URL (e.g. https://your-frontend.com).');
    corsOrigin = false;
  } else if (rawOrigin.includes(',')) {
    corsOrigin = rawOrigin.split(',').map(o => o.trim());
  } else {
    corsOrigin = rawOrigin.trim();
  }
} else {
  // Local development default
  corsOrigin = rawOrigin
    ? (rawOrigin.includes(',') ? rawOrigin.split(',').map(o => o.trim()) : rawOrigin.trim())
    : '*';
}

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Initialize Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 20000,
  pingInterval: 10000
});

// Initialize in-memory RoomManager
const roomManager = new RoomManager();

// Wire Socket event handlers
setupSocketHandlers(io, roomManager);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: isProduction ? 'production' : 'development',
    activeRooms: roomManager.rooms.size,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🎨 DRAWO Realtime Server Running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🌍 Mode: ${isProduction ? 'Production' : 'Development'}`);
  console.log(`🔒 CORS Origin: ${corsOrigin}`);
  console.log(`=================================`);
});

// Graceful server shutdown on process signals
const shutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Gracefully stopping DRAWO server...`);
  io.emit('chat_event', {
    id: Date.now(),
    type: 'system',
    event: 'server_shutdown',
    text: '⚠️ Server is restarting. Reconnecting shortly...'
  });

  io.close(() => {
    httpServer.close(() => {
      console.log('✅ DRAWO server stopped cleanly.');
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.error('⚠️ Forcing server shutdown after timeout.');
    process.exit(1);
  }, 5000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
