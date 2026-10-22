export const MOCK_TURN_RESULTS = {
  word: 'ELEPHANT',
  emoji: '🐘',
  category: 'Animals',
  scenario: 'all_guessed', // 'all_guessed' | 'timer_expired' | 'disconnected'
  nextDrawer: {
    id: 'p2',
    name: 'Kavin',
    avatarId: 1
  },
  players: [
    {
      id: 'p1',
      name: 'You',
      avatarId: 0,
      isYou: true,
      turnPoints: 1042,
      score: 2450,
      breakdown: { base: 1000, timeBonus: 42, drawerBonus: 0 }
    },
    {
      id: 'p2',
      name: 'Kavin',
      avatarId: 1,
      isDrawer: true,
      turnPoints: 500,
      score: 2100,
      breakdown: { base: 0, timeBonus: 0, drawerBonus: 500 }
    },
    {
      id: 'p3',
      name: 'Priya',
      avatarId: 2,
      turnPoints: 850,
      score: 1850,
      breakdown: { base: 800, timeBonus: 50, drawerBonus: 0 }
    },
    {
      id: 'p4',
      name: 'Rahul',
      avatarId: 7,
      turnPoints: 0,
      score: 1200,
      breakdown: { base: 0, timeBonus: 0, drawerBonus: 0 }
    }
  ]
};
