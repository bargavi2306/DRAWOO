/**
 * GameEngine — Authoritative game state engine & turn coordinator (Human-only)
 */

import { WordManager } from './WordManager.js';
import { ScoreManager } from './ScoreManager.js';
import { TurnManager } from './TurnManager.js';

export class GameEngine {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.wordManager = new WordManager();
    this.turnManager = new TurnManager(room);
    this.turnGuesserScores = new Map(); // playerID -> turnScore
    this.transitionTimeout = null;
    this.isTransitioning = false;
  }

  /**
   * Clear all active timers and pending transition callbacks
   */
  clearAllTimers() {
    this.turnManager.stopTimer();

    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
  }

  /**
   * Reset game engine and room state back to private lobby
   */
  resetToLobby() {
    this.clearAllTimers();
    this.isTransitioning = false;
    this.room.gameState.status = 'lobby';
    this.room.gameState.currentDrawerId = null;
    this.room.gameState.currentWord = null;
    this.room.gameState.currentWordCategory = null;
    this.room.gameState.currentWordDifficulty = null;
    this.room.gameState.wordPattern = null;
    this.room.gameState.revealedLetters = 0;
    this.room.gameState.turnEndReason = null;
    this.room.gameState.winner = null;
    this.room.gameState.winnerMessage = null;
    this.room.gameState.currentRound = 1;
    this.room.gameState.isFinalTurn = false;
    this.currentWordChoices = null;
    this.turnGuesserScores.clear();
    this.room.currentTurnStrokes = [];
    this.room.currentTurnStrokes = [];

    for (const player of this.room.players.values()) {
      player.score = 0;
      player.turnPoints = 0;
      player.isGuessed = false;
      player.isDrawing = false;
    }

    this.broadcastRoomState();
  }

  /**
   * Start a new game
   */
  startGame() {
    this.clearAllTimers();
    this.isTransitioning = false;
    this.room.gameState.status = 'lobby'; // Reset from game_over if needed

    // Reset used words for genuinely new game
    this.wordManager.resetUsedWords();
    this.room.currentTurnStrokes = [];

    // Reset scores & flags
    for (const player of this.room.players.values()) {
      player.score = 0;
      player.turnPoints = 0;
      player.isGuessed = false;
      player.isDrawing = false;
    }

    // Initialize rounds from authoritative room rules
    const rounds = Number(this.room.rules.rounds) || 5;
    this.turnManager.init(rounds);

    this.startTurn();
  }

  /**
   * Begin next drawing turn
   */
  startTurn() {
    if (this.room.gameState.status === 'game_over') return;

    this.clearAllTimers();
    this.isTransitioning = false;

    // Check remaining connected human players: at least 2 are required to play
    if (this.checkSingleHumanRemains()) return;

    // Check if the current round needs advancing or game is complete
    if (this.turnManager.isRoundComplete()) {
      if (this.turnManager.isGameComplete()) {
        this.endGame('rounds_completed');
        return;
      }
      const advanced = this.turnManager.advanceRound();
      if (!advanced) {
        this.endGame('rounds_completed');
        return;
      }
    }

    let drawerId = this.turnManager.getNextDrawerId();
    if (!drawerId) {
      if (this.turnManager.isGameComplete()) {
        this.endGame('rounds_completed');
        return;
      } else {
        const advanced = this.turnManager.advanceRound();
        if (!advanced) {
          this.endGame('rounds_completed');
          return;
        }
        drawerId = this.turnManager.getNextDrawerId();
        if (!drawerId) {
          this.endGame('no_drawers');
          return;
        }
      }
    }

    const drawerPlayer = this.room.players.get(drawerId);
    if (!drawerPlayer || drawerPlayer.isConnected === false) {
      // Player missing or disconnected, remove and skip safely
      this.turnManager.removePlayerFromTurnOrder(drawerId);
      this.startTurn();
      return;
    }

    // Set state for word selection phase
    this.room.gameState.currentDrawerId = drawerId;
    this.room.gameState.status = 'word_selecting';
    this.room.gameState.currentWord = null;
    this.room.gameState.currentWordCategory = null;
    this.room.gameState.currentWordDifficulty = null;
    this.room.gameState.wordPattern = null;
    this.room.gameState.revealedLetters = 0;
    this.room.gameState.turnEndReason = null;
    this.turnGuesserScores.clear();
    this.room.currentTurnStrokes = [];

    // Reset turn flags
    for (const player of this.room.players.values()) {
      player.isDrawing = player.id === drawerId;
      player.isGuessed = false;
      player.turnPoints = 0;
    }

    // Generate 3 distinct word choices
    this.currentWordChoices = this.wordManager.getWordChoices(this.room.rules);
    const wordChoices = this.currentWordChoices;

    // Broadcast state to all (secret word sanitized for guessers; choices included for drawer)
    this.broadcastRoomState();

    // Human drawer selection timer (20s)
    if (this.io && drawerPlayer.socketId) {
      this.io.to(drawerPlayer.socketId).emit('drawer_choose_word', {
        choices: wordChoices,
        timeoutSeconds: 20
      });
    }

    this.turnManager.startTimer(
      20,
      (sec) => {
        if (this.io) {
          this.io.to(this.room.code).emit('timer_tick', { seconds: sec });
        }
      },
      () => {
        // Drawer departure check prior to auto-selecting word
        const currentDrawer = this.room.players.get(drawerId);
        if (!currentDrawer || currentDrawer.isConnected === false) {
          this.handlePlayerPermanentlyLeft(drawerId);
          return;
        }
        // Timeout: auto-select first word for THIS SAME DRAWER (deterministic fallback)
        this.handleWordSelected(this.currentWordChoices ? this.currentWordChoices[0] : wordChoices[0]);
      }
    );
  }

  /**
   * Authoritative word selection transition
   */
  handleWordSelected(wordItem) {
    if (this.room.gameState.status !== 'word_selecting' || this.room.gameState.status === 'game_over') {
      return;
    }

    if (this.checkSingleHumanRemains()) return;

    this.clearAllTimers();

    const selectedWord = (wordItem && wordItem.word) ? wordItem.word : 'DRAWO';
    const category = (wordItem && wordItem.category) ? wordItem.category : 'General';
    const difficulty = (wordItem && wordItem.difficulty) ? wordItem.difficulty : 'easy';

    // Mark word as used for the game
    this.wordManager.markWordUsed(selectedWord);

    this.room.gameState.currentWord = selectedWord;
    this.room.gameState.currentWordCategory = category;
    this.room.gameState.currentWordDifficulty = difficulty;
    this.room.gameState.status = 'drawing';
    this.room.gameState.revealedLetters = 0;
    this.room.gameState.wordPattern = this.wordManager.createMask(selectedWord, 0);

    this.broadcastRoomState();

    const turnTime = Number(this.room.rules.turnTime) || 90;

    // Start turn drawing timer
    this.turnManager.startTimer(
      turnTime,
      (sec) => {
        if (this.io) {
          this.io.to(this.room.code).emit('timer_tick', { seconds: sec });
        }

        // Progressive hint reveal at half-time
        if (
          this.room.rules.hints &&
          sec === Math.floor(turnTime / 2) &&
          this.room.gameState.revealedLetters === 0
        ) {
          this.room.gameState.revealedLetters = 1;
          this.room.gameState.wordPattern = this.wordManager.createMask(selectedWord, 1);
          if (this.io) {
            this.io.to(this.room.code).emit('hint_revealed', {
              pattern: this.room.gameState.wordPattern,
              revealedCount: 1
            });
          }
        }
      },
      () => {
        // Turn timer expired
        this.endTurn('timer_expired');
      }
    );
  }

  /**
   * Submit and evaluate guess
   */
  submitGuess(playerId, guessText) {
    if (this.room.gameState.status !== 'drawing') return null;

    const player = this.room.players.get(playerId);
    if (!player || player.isDrawing || player.isGuessed) return null;

    const secret = this.room.gameState.currentWord;
    if (!secret) return null;

    const cleanGuess = String(guessText || '').trim().toLowerCase();
    const cleanSecret = String(secret || '').trim().toLowerCase();

    if (cleanGuess === cleanSecret) {
      player.isGuessed = true;

      const remainingTime = this.room.gameState.timerSeconds;
      const scoreData = ScoreManager.calculateGuesserScore(
        remainingTime,
        this.room.rules.turnTime
      );

      player.turnPoints = scoreData.totalTurnPoints;
      player.score += scoreData.totalTurnPoints;
      this.turnGuesserScores.set(playerId, scoreData.totalTurnPoints);

      // Check if all non-drawing eligible guessers have guessed
      const guessers = Array.from(this.room.players.values()).filter(
        p => !p.isDrawing && p.isConnected !== false
      );
      const allGuessed = guessers.length > 0 && guessers.every(p => p.isGuessed);

      if (allGuessed) {
        this.endTurn('all_guessed');
      }

      return { isCorrect: true, points: scoreData.totalTurnPoints };
    }

    return { isCorrect: false };
  }

  /**
   * Authoritative turn-ending function
   * Guards against duplicate calls or calls after game over
   */
  endTurn(reason = 'all_guessed') {
    if (this.room.gameState.status !== 'drawing' && this.room.gameState.status !== 'word_selecting') {
      return; // Turn already ended or game over! Guard against duplicate calls
    }

    if (this.checkSingleHumanRemains()) return;

    this.clearAllTimers();

    // Mark current drawer as having drawn in this round
    const drawerId = this.room.gameState.currentDrawerId;
    if (drawerId) {
      this.turnManager.markDrawerCompleted(drawerId);
    }

    this.room.gameState.status = 'word_reveal';
    this.room.gameState.turnEndReason = reason;

    // Calculate drawer bonus score if at least one guesser got it
    if (drawerId && reason !== 'drawer_disconnected') {
      const drawer = this.room.players.get(drawerId);
      if (drawer) {
        const guesserPts = Array.from(this.turnGuesserScores.values());
        const drawerScore = ScoreManager.calculateDrawerScore(guesserPts);
        drawer.turnPoints = drawerScore.totalTurnPoints;
        drawer.score += drawerScore.totalTurnPoints;
      }
    }

    // Check if this was the last turn of the entire game
    this.room.gameState.isFinalTurn = this.turnManager.isGameComplete();

    this.broadcastRoomState();

    // 2.5s Word Reveal -> Turn Results
    this.transitionTimeout = setTimeout(() => {
      this.showTurnResults();
    }, 2500);
  }

  /**
   * Transition to Turn Results Screen (Screen 12)
   */
  showTurnResults() {
    if (this.room.gameState.status !== 'word_reveal') return;

    if (this.checkSingleHumanRemains()) return;

    this.room.gameState.status = 'turn_results';
    this.room.gameState.isFinalTurn = this.turnManager.isGameComplete();
    this.broadcastRoomState();

    // 4s countdown -> advance to next turn or game over
    this.transitionTimeout = setTimeout(() => {
      this.advanceAfterTurnResults();
    }, 4000);
  }

  /**
   * Decides whether to start next turn, advance round, or end game
   */
  advanceAfterTurnResults() {
    if (this.room.gameState.status !== 'turn_results') return;

    if (this.checkSingleHumanRemains()) return;

    if (this.turnManager.isGameComplete()) {
      this.endGame('rounds_completed');
    } else {
      this.startTurn();
    }
  }

  /**
   * End complete game and trigger Final Game Over Screen (Screen 13)
   */
  endGame(reason = 'rounds_completed', designatedWinner = null) {
    if (this.room.gameState.status === 'game_over') return;

    this.clearAllTimers();

    // Clear any pending player disconnect timers
    for (const p of this.room.players.values()) {
      if (p.disconnectTimer) {
        clearTimeout(p.disconnectTimer);
        p.disconnectTimer = null;
      }
    }

    this.room.gameState.status = 'game_over';
    this.room.gameState.gameOverReason = reason;

    if (reason === 'single_human_remains' && designatedWinner) {
      this.room.gameState.winner = {
        id: designatedWinner.id,
        nickname: designatedWinner.nickname,
        avatarId: designatedWinner.avatarId,
        score: designatedWinner.score
      };
      this.room.gameState.winnerMessage = "🏆 You win! You're the last player remaining.";
    } else {
      const sorted = this.getPlayersList().sort((a, b) => (b.score || 0) - (a.score || 0));
      const topPlayer = sorted[0];
      if (topPlayer) {
        this.room.gameState.winner = {
          id: topPlayer.id,
          nickname: topPlayer.nickname,
          avatarId: topPlayer.avatarId,
          score: topPlayer.score
        };
        this.room.gameState.winnerMessage = "🏆 VICTORY! Incredible drawing skills!";
      }
    }

    this.broadcastRoomState();
  }

  /**
   * Handle player permanently leaving during game
   */
  handlePlayerPermanentlyLeft(playerId) {
    if (this.room.gameState.status === 'lobby' || this.room.gameState.status === 'game_over') {
      return;
    }

    const humanPlayers = Array.from(this.room.players.values()).filter(
      p => p.isConnected !== false
    );

    // If only one human remains, end game immediately and declare remaining human the winner
    if (humanPlayers.length <= 1) {
      if (humanPlayers.length === 1) {
        this.endGame('single_human_remains', humanPlayers[0]);
      } else {
        this.endGame('no_players');
      }
      return;
    }

    const wasDrawer = this.room.gameState.currentDrawerId === playerId;
    const currentStatus = this.room.gameState.status;

    // Update turn rotation
    this.turnManager.removePlayerFromTurnOrder(playerId);

    // If the departed player was the active drawer
    if (wasDrawer) {
      if (currentStatus === 'word_selecting') {
        // Active drawer left during word selection phase:
        // 1 & 2. Cancel current selection timer & invalidate pending timeout callback
        this.clearAllTimers();

        // 3 & 4. Do not award any points (no guess bonus, no time bonus, no drawer bonus)
        this.turnGuesserScores.clear();
    this.room.currentTurnStrokes = [];
        for (const player of this.room.players.values()) {
          player.turnPoints = 0;
          player.isGuessed = false;
          player.isDrawing = false;
        }
        this.room.gameState.currentWord = null;
        this.room.gameState.turnEndReason = null;
        this.room.gameState.currentDrawerId = null;

        // 6 & 7 & 8. Skip departed player's unfinished turn directly to next eligible player
        this.startTurn();
        return;
      }

      if (currentStatus === 'drawing') {
        this.endTurn('drawer_disconnected');
        return;
      }
    } else {
      // If guesser left during drawing phase, check if all remaining guessers have guessed
      if (currentStatus === 'drawing') {
        const guessers = Array.from(this.room.players.values()).filter(
          p => !p.isDrawing && p.isConnected !== false
        );
        if (guessers.length > 0 && guessers.every(p => p.isGuessed)) {
          this.endTurn('all_guessed');
        }
      }
    }
  }

  /**
   * Role-sanitized game state (Guesser NEVER receives secret word)
   */
  getSanitizedGameState(isDrawer = false) {
    if (this.room.gameState.status === 'word_selecting') {
      return {
        ...this.room.gameState,
        currentWord: null,
        wordChoices: isDrawer ? (this.currentWordChoices || []) : []
      };
    }

    if (this.room.gameState.status === 'drawing' && !isDrawer) {
      return {
        ...this.room.gameState,
        currentWord: null,
        wordChoices: []
      };
    }
    return this.room.gameState;
  }

  /**
   * Get all connected human players
   */
  getConnectedHumanPlayers() {
    return Array.from(this.room.players.values()).filter(
      p => p.isConnected !== false
    );
  }

  /**
   * Check if single human player remains and trigger win
   */
  checkSingleHumanRemains() {
    const humanPlayers = this.getConnectedHumanPlayers();
    if (humanPlayers.length <= 1) {
      if (humanPlayers.length === 1) {
        this.endGame('single_human_remains', humanPlayers[0]);
      } else {
        this.endGame('no_players');
      }
      return true;
    }
    return false;
  }

  /**
   * Build client-facing sanitized room payload
   */
  buildRoomPayload(isDrawer = false, playersList = null) {
    return {
      code: this.room.code,
      type: 'private',
      hostId: this.room.hostId,
      capacity: this.room.capacity,
      rules: this.room.rules,
      gameState: this.getSanitizedGameState(isDrawer),
      players: playersList || this.getPlayersList()
    };
  }

  /**
   * Broadcast state to all players with role-based secrecy (pre-calculated for 15+ player scale)
   */
  broadcastRoomState() {
    if (!this.io) return;
    const playersList = this.getPlayersList();
    const currentDrawerId = this.room.gameState.currentDrawerId;

    // Fast-path: pre-build drawer and guesser payloads once instead of in a loop
    const guesserPayload = this.buildRoomPayload(false, playersList);
    const drawerPayload = currentDrawerId ? this.buildRoomPayload(true, playersList) : guesserPayload;

    for (const player of this.room.players.values()) {
      if (player.socketId && player.isConnected !== false) {
        const payload = (player.id === currentDrawerId) ? drawerPayload : guesserPayload;
        this.io.to(player.socketId).emit('room_state_updated', payload);
      }
    }
  }

  getPlayersList() {
    return Array.from(this.room.players.values()).map(p => ({
      id: p.id,
      nickname: p.nickname,
      avatarId: p.avatarId,
      isHost: p.isHost,
      score: p.score,
      turnPoints: p.turnPoints,
      isGuessed: p.isGuessed,
      isDrawing: p.isDrawing,
      isConnected: p.isConnected
    }));
  }
}
