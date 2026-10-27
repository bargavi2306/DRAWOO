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
let allowedOrigins;
if (isProduction) {
  if (!rawOrigin || rawOrigin === '*') {
    console.warn('\n⚠️ [SECURITY WARNING] In production, wildcard CORS is not permitted. Please set CLIENT_ORIGIN to your frontend URL (e.g. https://your-frontend.com).');
    allowedOrigins = [];
  } else if (rawOrigin.includes(',')) {
    allowedOrigins = rawOrigin.split(',').map(o => o.trim().replace(/\/+$/, ''));
  } else {
    allowedOrigins = [rawOrigin.trim().replace(/\/+$/, '')];
  }
} else {
  allowedOrigins = rawOrigin
    ? (rawOrigin.includes(',') ? rawOrigin.split(',').map(o => o.trim().replace(/\/+$/, '')) : [rawOrigin.trim().replace(/\/+$/, '')])
    : ['*'];
}

const checkOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (!isProduction && allowedOrigins.includes('*')) return callback(null, true);

  const clean = origin.replace(/\/+$/, '');
  const isAllowed = allowedOrigins.some(allowed => {
    if (allowed === clean || allowed === '*') return true;
    if (allowed.startsWith('*.')) {
      try {
        const u = new URL(clean);
        return u.hostname.endsWith(allowed.slice(1));
      } catch {
        return false;
      }
    }
    return false;
  });

  // Always allow deployed production frontend and Vercel preview environments
  if (isAllowed || clean === 'https://drawoo.vercel.app' || clean.endsWith('.vercel.app')) {
    return callback(null, true);
  }
  console.warn(`🔒 [CORS Blocked] Unauthorized origin attempted connection: ${origin}`);
  return callback(null, false);
};

app.use(cors({
  origin: checkOrigin,
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Initialize Socket.IO server with explicit dual transport support
const io = new Server(httpServer, {
  cors: {
    origin: checkOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 1e6, // 1MB payload ceiling prevents memory overload
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
  console.log(`🔒 Allowed Origins: ${allowedOrigins.join(', ')}`);
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

// Process-level crash prevention under heavy multiplayer load
process.on('uncaughtException', (err) => {
  console.error('💥 [CRASH PREVENTION] Uncaught exception safely captured:', err?.message || err);
  if (err?.stack) console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 [CRASH PREVENTION] Unhandled promise rejection safely captured:', reason);
});
