/**
 * socketHandler — Socket.IO real-time multiplayer event registry (Human-only Private Rooms)
 */

import { Player } from '../rooms/Player.js';

export function setupSocketHandlers(io, roomManager) {
  io.on('connection', (socket) => {
    // Helper: broadcast full room state
    const syncRoom = (room) => {
      if (!room) return;
      if (!room.gameEngine) {
        room.initEngine(io);
      }
      room.gameEngine.broadcastRoomState();
    };

    // Helper: build sanitized client-facing room payload
    const buildRoomPayload = (room, playerId) => {
      const isDrawer = playerId === room.gameState.currentDrawerId;
      const sanitizedState = room.gameEngine.getSanitizedGameState(isDrawer);
      return {
        code: room.code,
        type: 'private',
        hostId: room.hostId,
        capacity: room.capacity,
        rules: room.rules,
        gameState: sanitizedState,
        players: room.gameEngine.getPlayersList()
      };
    };

    /**
     * 1. CREATE PRIVATE ROOM
     */
    socket.on('create_private_room', ({ nickname, avatarId, rules, sessionId }, callback) => {
      const playerId = sessionId || socket.id;
      const player = new Player({
        id: playerId,
        socketId: socket.id,
        nickname: nickname || 'Host',
        avatarId: avatarId ?? 0,
        isHost: true
      });

      const room = roomManager.createPrivateRoom(player, rules);
      room.initEngine(io);
      socket.join(room.code);

      const roomPayload = buildRoomPayload(room, player.id);

      if (typeof callback === 'function') {
        callback({ success: true, roomCode: room.code, playerId: player.id, roomState: roomPayload });
      }

      syncRoom(room);
    });

    /**
     * 2. JOIN PRIVATE ROOM
     */
    socket.on('join_room', ({ roomCode, nickname, avatarId, sessionId }, callback) => {
      const code = (roomCode || '').toUpperCase().trim();
      const room = roomManager.getRoom(code);

      if (!room) {
        if (typeof callback === 'function') {
          callback({ success: false, reason: 'not_found', message: 'Room not found' });
        }
        return;
      }

      // Check if mid-game join is disabled and game is already active
      if (
        room.gameState &&
        room.gameState.status !== 'lobby' &&
        room.gameState.status !== 'game_over' &&
        !room.rules.midGameJoin
      ) {
        if (typeof callback === 'function') {
          callback({
            success: false,
            reason: 'game_in_progress',
            message: 'Match is already in progress and mid-game join is disabled for this room.'
          });
        }
        return;
      }

      const playerId = sessionId || socket.id;

      // Check if player is reconnecting
      if (room.players.has(playerId)) {
        roomManager.reconnectPlayer(playerId, socket.id);
        socket.join(room.code);

        const roomPayload = buildRoomPayload(room, playerId);

        if (typeof callback === 'function') {
          callback({ success: true, roomCode: room.code, playerId, reconnected: true, roomState: roomPayload });
        }
        syncRoom(room);
        return;
      }

      const player = new Player({
        id: playerId,
        socketId: socket.id,
        nickname: nickname || 'Guest',
        avatarId: avatarId ?? 0,
        isHost: false
      });

      const result = room.addPlayer(player);
      if (!result.success) {
        if (typeof callback === 'function') {
          callback({
            success: false,
            reason: result.reason,
            message: result.reason === 'room_full' ? 'Room is full' : 'Cannot join room'
          });
        }
        return;
      }

      roomManager.playerRoomMap.set(socket.id, room.code);
      roomManager.playerRoomMap.set(player.id, room.code);
      socket.join(room.code);

      const roomPayload = buildRoomPayload(room, player.id);

      if (typeof callback === 'function') {
        callback({ success: true, roomCode: room.code, playerId: player.id, roomState: roomPayload });
      }

      io.to(room.code).emit('chat_event', {
        id: Date.now(),
        type: 'system',
        event: 'join',
        text: `👋 ${player.nickname} joined the room`
      });

      syncRoom(room);
    });

    /**
     * 3. RECONNECT TO ROOM
     */
    socket.on('reconnect_room', ({ roomCode, playerId }, callback) => {
      const code = (roomCode || '').toUpperCase().trim();
      const room = roomManager.getRoom(code);

      if (!room || !room.players.has(playerId)) {
        if (typeof callback === 'function') {
          callback({ success: false, reason: 'expired' });
        }
        return;
      }

      roomManager.reconnectPlayer(playerId, socket.id);
      socket.join(room.code);

      if (typeof callback === 'function') {
        callback({ success: true, roomCode: room.code, playerId });
      }

      const player = room.players.get(playerId);
      io.to(room.code).emit('chat_event', {
        id: Date.now(),
        type: 'system',
        event: 'reconnect',
        text: `⚡ ${player?.nickname || 'Player'} reconnected!`
      });

      syncRoom(room);
    });

    /**
     * 4. OBSOLETE PUBLIC MATCHMAKING (Validation guard)
     */
    socket.on('join_public_match', (_data, callback) => {
      if (typeof callback === 'function') {
        callback({
          success: false,
          reason: 'unsupported',
          message: 'Public matchmaking is disabled. Please create or join a private room.'
        });
      }
    });

    /**
     * 5. UPDATE ROOM RULES (Host only)
     */
    socket.on('update_rules', ({ rules }) => {
      const room = roomManager.getRoomForPlayer(socket.id);
      if (!room) return;

      const player = room.getPlayer(socket.id);
      const isHost = (player && player.isHost) || room.hostId === player?.id || room.hostId === socket.id;
      if (!isHost) return;

      room.updateRules(rules);
      syncRoom(room);
    });

    /**
     * 6. OBSOLETE ADD BOT (Validation guard)
     */
    socket.on('add_bot', (callback) => {
      if (typeof callback === 'function') {
        callback({
          success: false,
          reason: 'unsupported',
          message: 'Bots have been removed from DRAWO.'
        });
      }
    });

    /**
     * 7. START GAME (Host only)
     */
    socket.on('start_game', () => {
      const room = roomManager.getRoomForPlayer(socket.id);
      if (!room) return;

      const player = room.getPlayer(socket.id);
      const isHost = (player && player.isHost) || room.hostId === player?.id || room.hostId === socket.id;
      if (!isHost) return;

      if (room.players.size < 2) return;
      if (room.gameState.status !== 'lobby') return; // Cannot restart running game

      if (!room.gameEngine) {
        room.initEngine(io);
      }

      room.gameEngine.startGame();
    });

    /**
     * 8. DRAWER CHOOSE WORD
     */
    socket.on('drawer_select_word', ({ wordItem }) => {
      const room = roomManager.getRoomForPlayer(socket.id);
      if (!room || !room.gameEngine) return;

      const player = room.getPlayer(socket.id);
      const isDrawer = player && room.gameState.currentDrawerId === player.id;

      if (isDrawer && room.gameState.status === 'word_selecting') {
        room.gameEngine.handleWordSelected(wordItem);
      }
    });

    /**
     * 9. REAL-TIME CANVAS DRAWING SYNC
     */
    socket.on('draw_stroke', (strokeData) => {
      const room = roomManager.getRoomForPlayer(socket.id);
      if (!room) return;

      const player = room.getPlayer(socket.id);
      const isDrawer = player && room.gameState.currentDrawerId === player.id;

      if (isDrawer && room.gameState.status === 'drawing') {
        socket.to(room.code).emit('draw_stroke_received', strokeData);
      }
    });

    socket.on('clear_canvas', () => {
      const room = roomManager.getRoomForPlayer(socket.id);
      if (!room) return;

      const player = room.getPlayer(socket.id);
      const isDrawer = player && room.gameState.currentDrawerId === player.id;

      if (isDrawer && room.gameState.status === 'drawing') {
        socket.to(room.code).emit('clear_canvas_received');
      }
    });

    /**
     * 10. SUBMIT GUESS
     */
    socket.on('submit_guess', ({ text }) => {
      const room = roomManager.getRoomForPlayer(socket.id);
      if (!room || !room.gameEngine) return;

      const player = room.getPlayer(socket.id);
      if (!player) return;

      const cleanText = String(text || '').trim();
      if (!cleanText) return;

      // Authoritative evaluation first BEFORE any broadcast!
      const guessResult = room.gameEngine.submitGuess(player.id, cleanText);

      if (guessResult && guessResult.isCorrect) {
        // CORRECT GUESS:
        // 1. Send private event ONLY to the guesser's socket:
        socket.emit('guess_correct_private', {
          points: guessResult.points,
          message: "🎉 You've guessed the word!"
        });

        // 2. Broadcast generic notification to room WITHOUT the secret word:
        io.to(room.code).emit('chat_event', {
          id: Date.now(),
          type: 'system',
          event: 'correct',
          isCorrect: true,
          text: `🎉 ${player.nickname} guessed the word! (+${guessResult.points} pts)`
        });

        // 3. Sync room state so all clients update scores without revealing word
        syncRoom(room);
      } else {
        // INCORRECT GUESS:
        // Broadcast message to shared chat normally
        io.to(room.code).emit('chat_message', {
          id: Date.now(),
          senderId: player.id,
          senderName: player.nickname,
          avatarId: player.avatarId,
          text: cleanText
        });
      }
    });

    /**
     * 11. EXPLICIT LEAVE ROOM (immediate permanent departure)
     */
    socket.on('leave_room', () => {
      const room = roomManager.getRoomForPlayer(socket.id);
      if (!room) return;

      const player = room.getPlayer(socket.id);
      const playerId = player ? player.id : socket.id;
      const nick = player ? player.nickname : 'Player';

      const result = roomManager.leaveRoom(playerId);
      socket.leave(room.code);

      if (result && result.room) {
        io.to(room.code).emit('chat_event', {
          id: Date.now(),
          type: 'system',
          event: 'leave',
          text: `${nick} left the room.`
        });
        syncRoom(result.room);
      }
    });

    /**
     * 12. UNEXPECTED SOCKET DISCONNECT (triggers 30s grace period)
     */
    socket.on('disconnect', (_reason) => {
      const room = roomManager.getRoomForPlayer(socket.id);
      if (!room) return;

      const player = room.getPlayer(socket.id);
      if (!player) return;

      const nick = player.nickname || 'Player';
      const isGameActive =
        room.gameState &&
        room.gameState.status !== 'lobby' &&
        room.gameState.status !== 'game_over';

      if (isGameActive) {
        // Count how many other connected human players remain
        const remainingConnected = Array.from(room.players.values()).filter(
          p => p.id !== player.id && p.isConnected !== false
        );

        // If only 1 (or 0) connected player remains in an active game, end immediately!
        if (remainingConnected.length <= 1) {
          roomManager.leaveRoom(player.id);
          io.to(room.code).emit('chat_event', {
            id: Date.now(),
            type: 'system',
            event: 'leave',
            text: `${nick} left the game.`
          });
          syncRoom(room);
          return;
        }

        // If active drawer disconnects during word selection with >1 remaining players, remove immediately so others can proceed
        if (
          room.gameState.status === 'word_selecting' &&
          room.gameState.currentDrawerId === player.id
        ) {
          roomManager.leaveRoom(player.id);
          io.to(room.code).emit('chat_event', {
            id: Date.now(),
            type: 'system',
            event: 'leave',
            text: `${nick} left the game.`
          });
          syncRoom(room);
          return;
        }
      } else {
        // In lobby: immediately remove player permanently and inform all remaining players
        roomManager.leaveRoom(player.id);
        io.to(room.code).emit('chat_event', {
          id: Date.now(),
          type: 'system',
          event: 'leave',
          text: `${nick} left the lobby.`
        });
        syncRoom(room);
        return;
      }

      roomManager.handleDisconnect(player.id, () => {
        io.to(room.code).emit('chat_event', {
          id: Date.now(),
          type: 'system',
          event: 'leave',
          text: `${nick} left the game.`
        });
        syncRoom(room);
      });

      io.to(room.code).emit('chat_event', {
        id: Date.now(),
        type: 'system',
        event: 'disconnect',
        text: `📡 ${nick} disconnected (reconnect grace: 30s)`
      });

      syncRoom(room);
    });
  });
}
