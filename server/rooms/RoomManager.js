/**
 * RoomManager — Manages in-memory private room creation, lookup, and player sessions
 */

import { Room } from './Room.js';

export class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> Room instance
    this.playerRoomMap = new Map(); // playerId or socketId -> roomCode
  }

  /**
   * Generate unique 5-character uppercase room code
   */
  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  /**
   * Create a new Private Room
   */
  createPrivateRoom(hostPlayer, rules = {}) {
    const code = this.generateCode();
    const capacity = Math.min(25, Math.max(2, Number(rules.maxCapacity) || 8));

    const room = new Room({
      code,
      type: 'private',
      hostId: hostPlayer.id,
      capacity,
      rules
    });

    room.addPlayer(hostPlayer);
    this.rooms.set(code, room);
    this.playerRoomMap.set(hostPlayer.id, code);
    if (hostPlayer.socketId) {
      this.playerRoomMap.set(hostPlayer.socketId, code);
    }

    return room;
  }

  /**
   * Get room by code
   */
  getRoom(code) {
    if (!code) return null;
    return this.rooms.get(code.toUpperCase()) || null;
  }

  /**
   * Get room for player ID or socket ID
   */
  getRoomForPlayer(id) {
    if (!id) return null;
    const code = this.playerRoomMap.get(id);
    return code ? this.getRoom(code) : null;
  }

  /**
   * Handle socket disconnect with 30-second grace period before permanent removal
   */
  handleDisconnect(playerId, onGraceExpired) {
    const room = this.getRoomForPlayer(playerId);
    if (!room) return null;

    const player = room.getPlayer(playerId);
    if (!player) return null;

    player.isConnected = false;

    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
    }

    player.disconnectTimer = setTimeout(() => {
      // 30s grace expired -> remove player permanently
      this.leaveRoom(player.id);
      if (typeof onGraceExpired === 'function') {
        onGraceExpired();
      }
    }, 30000);

    return { room, player };
  }

  /**
   * Handle player reconnecting within grace period
   */
  reconnectPlayer(playerId, newSocketId) {
    const room = this.getRoomForPlayer(playerId);
    if (!room) return null;

    const player = room.getPlayer(playerId);
    if (!player) return null;

    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = null;
    }

    // Clean up old socket map
    if (player.socketId && player.socketId !== newSocketId) {
      this.playerRoomMap.delete(player.socketId);
    }

    player.socketId = newSocketId;
    player.isConnected = true;
    this.playerRoomMap.set(newSocketId, room.code);
    this.playerRoomMap.set(player.id, room.code);

    return { room, player };
  }

  /**
   * Explicit leave: immediately removes player permanently
   */
  leaveRoom(playerId) {
    const room = this.getRoomForPlayer(playerId);
    if (!room) return null;

    const player = room.getPlayer(playerId);
    if (player && player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = null;
    }

    room.removePlayer(playerId);
    this.playerRoomMap.delete(playerId);
    if (player) {
      this.playerRoomMap.delete(player.id);
      if (player.socketId) {
        this.playerRoomMap.delete(player.socketId);
      }
    }

    // Inform GameEngine of permanent departure
    if (room.gameEngine && player) {
      room.gameEngine.handlePlayerPermanentlyLeft(player.id);
    }

    // If no human players remain in room, clean up room
    if (room.players.size === 0) {
      if (room.gameEngine) {
        room.gameEngine.clearAllTimers();
      }
      this.rooms.delete(room.code);
    }

    return { room, player };
  }
}
