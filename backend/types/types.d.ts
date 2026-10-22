/**
 * DRAWO Multiplayer Server Types & Interfaces (Human-only Private Rooms)
 */

export interface Player {
  id: string; // Socket/session ID (NEVER nickname)
  socketId: string;
  nickname: string;
  avatarId: number; // 0..11
  isHost: boolean;
  score: number; // Cumulative total score
  turnPoints: number; // Score earned in current turn
  isGuessed: boolean; // Correct guess status in current turn
  isDrawing: boolean; // Current active drawer status
  isConnected: boolean;
  joinedAt: number;
}

export interface GameSettings {
  rounds: number; // 1-10
  turnTime: number; // 30, 45, 60, 75, 90, 120, 150, 180 seconds
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  maxCapacity: number; // 2-15
  customWords: boolean;
  customWordsList: string[];
  hints: boolean;
  midGameJoin: boolean;
}

export type GameStatus =
  | 'lobby'
  | 'word_selecting'
  | 'drawing'
  | 'word_reveal'
  | 'turn_results'
  | 'game_over';

export interface WordState {
  word: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  emoji?: string;
}

export interface ScoreBreakdown {
  basePoints: number;
  timeBonus: number;
  drawerBonus: number;
  totalTurnPoints: number;
}

export interface TurnState {
  currentRound: number;
  totalRounds: number;
  drawerId: string | null;
  word: string | null;
  wordCategory: string | null;
  wordPattern: string | null;
  revealedCount: number;
  timerSeconds: number;
  scenario: 'all_guessed' | 'timer_expired' | 'drawer_disconnected' | null;
}

export interface GameState {
  status: GameStatus;
  currentRound: number;
  totalRounds: number;
  currentDrawerId: string | null;
  currentWord: string | null;
  currentWordCategory: string | null;
  currentWordDifficulty: string | null;
  wordPattern: string | null;
  revealedLetters: number;
  timerSeconds: number;
  turnEndReason: 'all_guessed' | 'timer_expired' | 'drawer_disconnected' | null;
}

export interface Room {
  code: string; // 5-character uppercase code (e.g., AB7KQ)
  type: 'private';
  hostId: string;
  players: Map<string, Player>;
  capacity: number;
  rules: GameSettings;
  gameState: GameState;
  createdAt: number;
}
