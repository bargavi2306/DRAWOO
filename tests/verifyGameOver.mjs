import { createServer } from 'vite';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';

async function runTests() {
  const server = await createServer({
    root: 'frontend',
    server: { middlewareMode: true },
    appType: 'custom'
  });

  try {
    const mod = await server.ssrLoadModule('/src/pages/GameOver/index.jsx');
    const GameOverPage = mod.default;

    console.log('Testing Scenario 1: 1 Player (Solo victory)');
    {
      const players = [{ id: 'p1', name: 'SoleWinner', avatarId: 0, score: 3200, isYou: true }];
      const html = renderToString(React.createElement(GameOverPage, {
        players,
        currentUserId: 'p1',
        gameMode: 'private'
      }));
      assert.ok(html.includes('SoleWinner'), 'Contains winner name');
      assert.ok(html.includes('YOU WON!'), 'Contains YOU WON! badge');
      assert.ok(html.includes('3,200 total pts'), 'Contains formatted score');
      assert.ok(html.includes('1 Player'), 'Shows 1 Player badge');
      assert.ok(!html.includes('2nd'), 'Does not show 2nd place on podium');
      console.log('✔ Passed Scenario 1');
    }

    console.log('Testing Scenario 2: 2 Players (Dual podium)');
    {
      const players = [
        { id: 'p1', name: 'WinnerOne', avatarId: 0, score: 4500, isYou: true },
        { id: 'p2', name: 'RunnerUp', avatarId: 1, score: 2800, isYou: false }
      ];
      const html = renderToString(React.createElement(GameOverPage, {
        players,
        currentUserId: 'p1',
        gameMode: 'public'
      }));
      assert.ok(html.includes('WinnerOne'), '1st place on podium');
      assert.ok(html.includes('RunnerUp'), '2nd place on podium');
      assert.ok(html.includes('4,500 total pts'), '1st place formatted score');
      assert.ok(html.includes('2,800 pts'), '2nd place formatted score');
      assert.ok(html.includes('2 Players'), 'Shows 2 Players');
      assert.ok(!html.includes('3rd'), 'Does not show 3rd place on podium');
      console.log('✔ Passed Scenario 2');
    }

    console.log('Testing Scenario 3: 3 Players (Full Olympic podium)');
    {
      const players = [
        { id: 'p1', nickname: 'GoldStar', avatarId: 0, score: 5000, isYou: false },
        { id: 'p2', nickname: 'SilverFox', avatarId: 1, score: 4000, isYou: true },
        { id: 'p3', nickname: 'BronzeBear', avatarId: 2, score: 2500, isYou: false }
      ];
      const html = renderToString(React.createElement(GameOverPage, {
        players,
        currentUserId: 'p2',
        gameMode: 'private'
      }));
      assert.ok(html.includes('GoldStar'), '1st place in spotlight');
      assert.ok(html.includes('SilverFox'), '2nd place on podium');
      assert.ok(html.includes('BronzeBear'), '3rd place on podium');
      assert.ok(html.includes('1ST PLACE WINNER'), 'Shows 1st place badge when user is not winner');
      assert.ok(html.includes('So close! Great game!'), 'Consolation message for 2nd place user');
      assert.ok(html.includes('You'), 'Identifies current player as You');
      console.log('✔ Passed Scenario 3');
    }

    console.log('Testing Scenario 4: 8+ Players (Podium + Lower Rank Rows)');
    {
      const players = [
        { id: 'p1', nickname: 'Alice', avatarId: 0, score: 9000 },
        { id: 'p2', nickname: 'Bob', avatarId: 1, score: 7500 },
        { id: 'p3', nickname: 'Charlie', avatarId: 2, score: 6200 },
        { id: 'p4', nickname: 'David', avatarId: 3, score: 5100 },
        { id: 'p5', nickname: 'Emma', avatarId: 4, score: 4300 },
        { id: 'p6', nickname: 'Frank', avatarId: 5, score: 3200 },
        { id: 'p7', nickname: 'Grace', avatarId: 6, score: 2100 },
        { id: 'p8', nickname: 'Henry', avatarId: 7, score: 1400 },
        { id: 'p9', nickname: 'Isabella', avatarId: 8, score: 900, isYou: true }
      ];
      const html = renderToString(React.createElement(GameOverPage, {
        players,
        currentUserId: 'p9',
        gameMode: 'public'
      }));
      assert.ok(html.includes('Alice'), 'Podium contains 1st');
      assert.ok(html.includes('Bob'), 'Podium contains 2nd');
      assert.ok(html.includes('Charlie'), 'Podium contains 3rd');
      assert.ok(html.includes('#4'), 'Lower rank #4 rendered');
      assert.ok(html.includes('#9'), 'Lower rank #9 rendered');
      assert.ok(html.includes('David'), 'Lower player David rendered');
      assert.ok(html.includes('Isabella'), 'Lower player Isabella rendered');
      assert.ok(html.includes('9 Players'), 'Leaderboard shows 9 Players');
      assert.ok(html.includes('Better luck next time!'), 'Consolation message for rank #9 user');
      console.log('✔ Passed Scenario 4');
    }

    console.log('Testing Scenario 5: Long Nicknames & Large Score Format');
    {
      const players = [
        { id: 'p1', nickname: 'SuperUltraMegaLongPlayerNicknameThatCouldOverflow', avatarId: 0, score: 1250450, isYou: true },
        { id: 'p2', nickname: 'Short', avatarId: 1, score: 0 }
      ];
      const html = renderToString(React.createElement(GameOverPage, {
        players,
        currentUserId: 'p1'
      }));
      assert.ok(html.includes('SuperUltraMegaLongPlayerNicknameThatCouldOverflow'));
      assert.ok(html.includes('1,250,450 total pts'));
      console.log('✔ Passed Scenario 5');
    }

    console.log('Testing Scenario 6: Human Winner (Non-user)');
    {
      const players = [
        { id: 'p2', nickname: 'TopPlayer', avatarId: 4, score: 6000 },
        { id: 'p1', nickname: 'HumanPlayer', avatarId: 0, score: 4000, isYou: true }
      ];
      const html = renderToString(React.createElement(GameOverPage, {
        players,
        currentUserId: 'p1',
        winner: players[0]
      }));
      assert.ok(html.includes('TopPlayer'));
      assert.ok(html.includes('So close! Great game!'));
      console.log('✔ Passed Scenario 6');
    }

    console.log('Testing Scenario 7: Play Again Button');
    {
      const priv = renderToString(React.createElement(GameOverPage, { gameMode: 'private' }));
      assert.ok(priv.includes('Play Again (Private Lobby)'));
      console.log('✔ Passed Scenario 7');
    }

    console.log('\n🎉 ALL GAME OVER SCENARIOS VERIFIED SUCCESSFULLY!');
  } finally {
    await server.close();
  }
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
