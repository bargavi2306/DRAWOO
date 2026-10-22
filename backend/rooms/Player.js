/**
 * Player model — In-memory representation of a connected human player
 * IMPORTANT: ID is socket/session ID (NEVER nickname)
 */

export class Player {
  constructor({
    id,
    socketId,
    nickname = 'Guest',
    avatarId = 0,
    isHost = false
  }) {
    this.id = id; // Unique ID (socket ID or UUID)
    this.socketId = socketId || id;
    this.nickname = nickname.slice(0, 20); // Max 20 chars
    this.avatarId = Number(avatarId) || 0;
    this.isHost = Boolean(isHost);

    // Gameplay state
    this.score = 0;
    this.turnPoints = 0;
    this.isGuessed = false;
    this.isDrawing = false;
    this.isConnected = true;
    this.joinedAt = Date.now();
  }
}
