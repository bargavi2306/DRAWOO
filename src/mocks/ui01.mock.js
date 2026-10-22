export const MOCK_PLAYERS = [
  { id: 'p1', name: 'You', avatarId: 0, score: 320, turnPoints: 120, isHost: true, isYou: true, isGuessed: false, isDrawing: true },
  { id: 'p2', name: 'Kavin', avatarId: 1, score: 280, turnPoints: 90, isHost: false, isYou: false, isGuessed: true, isDrawing: false },
  { id: 'p3', name: 'Priya', avatarId: 2, score: 250, turnPoints: 110, isHost: false, isYou: false, isGuessed: false, isDrawing: false },
  { id: 'p4', name: 'Rahul', avatarId: 7, score: 180, turnPoints: 0, isHost: false, isYou: false, isGuessed: true, isDrawing: false },
  { id: 'p5', name: 'Sneha', avatarId: 10, score: 120, turnPoints: 80, isHost: false, isYou: false, isGuessed: false, isDrawing: false },
  { id: 'p6', name: 'Arjun', avatarId: 6, score: 90, turnPoints: 0, isHost: false, isYou: false, isGuessed: false, isDrawing: false },
  { id: 'p7', name: 'Meera', avatarId: 4, score: 150, turnPoints: 50, isHost: false, isYou: false, isGuessed: false, isDrawing: false }
];

export const MOCK_CHAT_MESSAGES = [
  { id: 'm1', senderId: 'p2', senderName: 'Kavin', avatarId: 1, text: 'elephant?' },
  { id: 'm2', senderId: 'p5', senderName: 'Sneha', avatarId: 10, text: 'elephant!' },
  { id: 'm3', type: 'system', isCorrect: true, text: 'Rahul guessed the word!' },
  { id: 'm4', senderId: 'p3', senderName: 'Priya', avatarId: 2, text: 'so cuteee' },
  { id: 'm5', senderId: 'p6', senderName: 'Arjun', avatarId: 6, text: 'big animal?' },
  { id: 'm6', senderId: 'p1', senderName: 'You', avatarId: 0, isYou: true, text: '🐘 ❤️' }
];

export const MOCK_RULES = {
  rounds: 3,
  turnTime: 60,
  difficulty: 'Medium',
  language: 'English',
  customWords: true,
  hints: true,
  midGameJoin: true,
  maxCapacity: 8
};
