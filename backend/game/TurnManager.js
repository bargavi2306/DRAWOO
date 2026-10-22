/**
 * TurnManager — Manages round-robin rotation, explicit round tracking, and round timers
 */

export class TurnManager {
  constructor(room) {
    this.room = room;
    this.timerInterval = null;
    this.currentRound = 1;
    this.maxRounds = 5;
    this.turnIndex = 0;
    this.roundDrawers = [];
    this.completedDrawersInRound = new Set();
    this.currentDrawerId = null;
    this.turnCount = 0;
  }

  /**
   * Initialize rounds from room rules
   */
  init(maxRounds = 5) {
    this.currentRound = 1;
    this.maxRounds = Math.max(1, Number(maxRounds) || 5);
    this.turnIndex = 0;
    this.completedDrawersInRound.clear();
    this.currentDrawerId = null;
    this.turnCount = 0;
    this.rebuildRoundDrawers();
    this.room.gameState.currentRound = this.currentRound;
    this.room.gameState.totalRounds = this.maxRounds;
  }

  /**
   * Get eligible player IDs (connected human players)
   */
  getEligiblePlayers() {
    return Array.from(this.room.players.values())
      .filter(p => p.isConnected !== false)
      .map(p => p.id);
  }

  /**
   * Build turn order for the round
   */
  rebuildRoundDrawers() {
    const eligible = this.getEligiblePlayers();
    this.roundDrawers = [...eligible];
  }

  /**
   * Get next player in current round who has not yet drawn
   */
  getNextDrawerId() {
    for (let i = 0; i < this.roundDrawers.length; i++) {
      const pid = this.roundDrawers[i];
      if (!this.completedDrawersInRound.has(pid)) {
        this.currentDrawerId = pid;
        this.turnIndex = i;
        return pid;
      }
    }
    return null;
  }

  /**
   * Mark drawer as completed for this round
   */
  markDrawerCompleted(drawerId) {
    if (drawerId) {
      this.completedDrawersInRound.add(drawerId);
      this.turnCount += 1;
    }
  }

  /**
   * Check if every eligible player in this round has drawn
   */
  isRoundComplete() {
    if (this.roundDrawers.length === 0) return true;
    return this.roundDrawers.every(pid => this.completedDrawersInRound.has(pid));
  }

  /**
   * Check if the entire game is complete
   */
  isGameComplete() {
    return this.isRoundComplete() && this.currentRound >= this.maxRounds;
  }

  /**
   * Advance to the next round if within maxRounds
   */
  advanceRound() {
    if (this.currentRound >= this.maxRounds) {
      return false;
    }
    this.currentRound += 1;
    this.room.gameState.currentRound = this.currentRound;
    this.completedDrawersInRound.clear();
    this.rebuildRoundDrawers();
    this.turnIndex = 0;
    return true;
  }

  /**
   * Safely update turn order when someone leaves
   */
  removePlayerFromTurnOrder(playerId) {
    this.roundDrawers = this.roundDrawers.filter(id => id !== playerId);
    this.completedDrawersInRound.delete(playerId);
    if (this.currentDrawerId === playerId) {
      this.currentDrawerId = null;
    }
  }

  /**
   * Start turn timer with tick and expiration callbacks
   */
  startTimer(durationSeconds, onTick, onExpire) {
    this.stopTimer();

    this.room.gameState.timerSeconds = durationSeconds;
    if (onTick) onTick(durationSeconds);

    this.timerInterval = setInterval(() => {
      this.room.gameState.timerSeconds -= 1;
      const current = this.room.gameState.timerSeconds;

      if (onTick) onTick(current);

      if (current <= 0) {
        this.stopTimer();
        if (onExpire) onExpire();
      }
    }, 1000);

    if (this.timerInterval && typeof this.timerInterval.unref === 'function') {
      this.timerInterval.unref();
    }
  }

  /**
   * Stop active timer
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
