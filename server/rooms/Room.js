/**
 * Room model — In-memory private room container for human players
 */

import { GameEngine } from '../game/GameEngine.js';

export class Room {
  constructor({
    code,
    type = 'private',
    hostId,
    capacity = 8,
    rules = {}
  }) {
    this.code = code.toUpperCase();
    this.type = 'private'; // Exclusively private rooms
    this.hostId = hostId;
    this.capacity = Math.min(15, Math.max(2, Number(capacity) || 8));
    this.players = new Map(); // playerID -> Player instance
    this.createdAt = Date.now();

    const initialRounds = Math.min(10, Math.max(1, Number(rules.rounds) || 5));

    // Game rules with standard defaults
    this.rules = {
      rounds: initialRounds,
      turnTime: Number(rules.turnTime) || 90,
      difficulty: rules.difficulty || 'mixed',
      maxCapacity: Math.min(15, Math.max(2, Number(rules.maxCapacity) || this.capacity)),
      customWords: Boolean(rules.customWords),
      customWordsList: Array.isArray(rules.customWordsList) ? rules.customWordsList : [],
      hints: rules.hints !== undefined ? rules.hints : true,
      midGameJoin: rules.midGameJoin !== undefined ? rules.midGameJoin : true
    };

    // Game State
    this.gameState = {
      status: 'lobby', // 'lobby' | 'word_selecting' | 'drawing' | 'word_reveal' | 'turn_results' | 'game_over'
      currentRound: 1,
      totalRounds: initialRounds,
      currentDrawerId: null,
      currentWord: null,
      currentWordCategory: null,
      currentWordDifficulty: null,
      wordPattern: null,
      revealedLetters: 0,
      timerSeconds: 0,
      turnEndReason: null,
      isFinalTurn: false,
      winner: null,
      winnerMessage: null
    };

    this.gameEngine = null;
  }

  initEngine(io) {
    this.gameEngine = new GameEngine(this, io);
  }

  getPlayer(idOrSocketId) {
    if (!idOrSocketId) return null;
    if (this.players.has(idOrSocketId)) {
      return this.players.get(idOrSocketId);
    }
    for (const player of this.players.values()) {
      if (player.id === idOrSocketId || player.socketId === idOrSocketId) {
        return player;
      }
    }
    return null;
  }

  addPlayer(player) {
    if (this.players.has(player.id)) return { success: false, reason: 'already_joined' };

    // Capacity checks (2–15 players)
    if (this.players.size >= this.rules.maxCapacity) {
      return { success: false, reason: 'room_full' };
    }

    this.players.set(player.id, player);

    // If first player, assign as host
    if (!this.hostId) {
      player.isHost = true;
      this.hostId = player.id;
    } else if (this.players.size === 1) {
      player.isHost = true;
      this.hostId = player.id;
    }

    return { success: true };
  }

  removePlayer(idOrSocketId) {
    const player = this.getPlayer(idOrSocketId);
    if (!player) return null;

    this.players.delete(player.id);

    // Host transfer if host left
    if (player.isHost && this.players.size > 0) {
      const remainingHumans = Array.from(this.players.values()).filter(p => p.isConnected !== false);
      if (remainingHumans.length > 0) {
        remainingHumans[0].isHost = true;
        this.hostId = remainingHumans[0].id;
      }
    }

    return player;
  }

  updateRules(newRules = {}) {
    if (this.gameState.status !== 'lobby') return false;

    if (newRules.rounds !== undefined) {
      const rounds = Math.min(10, Math.max(1, Number(newRules.rounds)));
      this.rules.rounds = rounds;
      this.gameState.totalRounds = rounds;
    }
    if (newRules.turnTime !== undefined) this.rules.turnTime = Number(newRules.turnTime);
    if (newRules.difficulty !== undefined) this.rules.difficulty = newRules.difficulty;
    if (newRules.maxCapacity !== undefined) {
      const cap = Math.min(15, Math.max(2, Number(newRules.maxCapacity)));
      this.rules.maxCapacity = cap;
      this.capacity = cap;
    }
    if (newRules.customWords !== undefined) this.rules.customWords = Boolean(newRules.customWords);
    if (newRules.customWordsList !== undefined) this.rules.customWordsList = newRules.customWordsList;
    if (newRules.hints !== undefined) this.rules.hints = Boolean(newRules.hints);
    if (newRules.midGameJoin !== undefined) this.rules.midGameJoin = Boolean(newRules.midGameJoin);

    return true;
  }
}
