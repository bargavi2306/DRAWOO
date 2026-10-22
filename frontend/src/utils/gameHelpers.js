/**
 * Shared Game Utilities & Helpers for DRAWO Frontend
 */

/**
 * Determine if a player entity represents the current client
 */
export function isCurrentUser(player, currentUserId, socketId, sessionId) {
  if (!player) return false;
  if (player.isYou) return true;
  const pId = player.id;
  const pSocket = player.socketId;
  return Boolean(
    (currentUserId && pId === currentUserId) ||
    (socketId && (pId === socketId || pSocket === socketId)) ||
    (sessionId && (pId === sessionId || pSocket === sessionId))
  );
}

/**
 * Determine if the current client is the authoritative drawer
 */
export function isCurrentDrawer(gameState, currentUserId, socketId, sessionId) {
  if (!gameState || !gameState.currentDrawerId) return false;
  const drawerId = gameState.currentDrawerId;
  return Boolean(
    (currentUserId && drawerId === currentUserId) ||
    (socketId && drawerId === socketId) ||
    (sessionId && drawerId === sessionId)
  );
}

/**
 * Format score with commas and 'pts' suffix (e.g. 1,200 pts)
 */
export function formatScore(score) {
  const num = Number(score || 0);
  return `${num.toLocaleString()} pts`;
}

/**
 * Format raw seconds to MM:SS string
 */
export function formatTimer(secs) {
  const s = Math.max(0, Math.floor(Number(secs) || 0));
  const m = Math.floor(s / 60);
  const remSec = s % 60;
  return `${m.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;
}

/**
 * Get claymorphic pastel color for word difficulty
 */
export function getDifficultyColor(diff) {
  const d = String(diff || '').toLowerCase();
  if (d === 'easy') return '#5BB89A'; // Mint
  if (d === 'hard') return '#E84040'; // Coral Red
  return '#F5C842'; // Yellow/Gold (medium default)
}
