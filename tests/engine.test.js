import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Room } from '../server/rooms/Room.js';
import { Player } from '../server/rooms/Player.js';
import { RoomManager } from '../server/rooms/RoomManager.js';
import { WordManager, WORD_DICTIONARY } from '../server/game/WordManager.js';
import { TurnManager } from '../server/game/TurnManager.js';
import { GameEngine } from '../server/game/GameEngine.js';

function createMockIO() {
  const events = [];
  return {
    events,
    to: (target) => ({
      emit: (event, data) => {
        events.push({ target, event, data });
      }
    }),
    emit: (event, data) => {
      events.push({ target: 'all', event, data });
    }
  };
}

describe('DRAWO Game Engine - Bug Fixes & Regression Test Suite', () => {

  // Test 1: Two players, 5 rounds: exactly 10 drawing turns, then game over
  test('1. Two players, 5 rounds: exactly 10 drawing turns, then game over', () => {
    const io = createMockIO();
    const room = new Room({
      code: 'TEST1',
      type: 'private',
      hostId: 'p1',
      rules: { rounds: 5, turnTime: 30 }
    });
    room.addPlayer(new Player({ id: 'p1', socketId: 's1', nickname: 'Alice', isHost: true }));
    room.addPlayer(new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' }));
    room.initEngine(io);

    const engine = room.gameEngine;
    engine.startGame();

    let turnsCount = 0;
    const maxSafety = 50;

    while (room.gameState.status !== 'game_over' && turnsCount < maxSafety) {
      if (room.gameState.status === 'word_selecting') {
        engine.handleWordSelected({ word: `WORD_${turnsCount}`, category: 'Test', difficulty: 'easy' });
      } else if (room.gameState.status === 'drawing') {
        turnsCount += 1;
        engine.endTurn('timer_expired');
      } else if (room.gameState.status === 'word_reveal') {
        engine.showTurnResults();
      } else if (room.gameState.status === 'turn_results') {
        engine.advanceAfterTurnResults();
      }
    }

    assert.equal(turnsCount, 10, 'Exactly 10 drawing turns must be executed for 2 players across 5 rounds');
    assert.equal(room.gameState.status, 'game_over', 'Game must end in game_over state');
    assert.equal(room.gameState.currentRound, 5, 'Final round must be 5');
  });

  // Test 2: Three players, 5 rounds: exactly 15 drawing turns, then game over
  test('2. Three players, 5 rounds: exactly 15 drawing turns, then game over', () => {
    const io = createMockIO();
    const room = new Room({
      code: 'TEST2',
      type: 'private',
      hostId: 'p1',
      rules: { rounds: 5, turnTime: 30 }
    });
    room.addPlayer(new Player({ id: 'p1', socketId: 's1', nickname: 'Alice', isHost: true }));
    room.addPlayer(new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' }));
    room.addPlayer(new Player({ id: 'p3', socketId: 's3', nickname: 'Charlie' }));
    room.initEngine(io);

    const engine = room.gameEngine;
    engine.startGame();

    let turnsCount = 0;
    const maxSafety = 50;

    while (room.gameState.status !== 'game_over' && turnsCount < maxSafety) {
      if (room.gameState.status === 'word_selecting') {
        engine.handleWordSelected({ word: `WORD_${turnsCount}`, category: 'Test', difficulty: 'easy' });
      } else if (room.gameState.status === 'drawing') {
        turnsCount += 1;
        engine.endTurn('all_guessed');
      } else if (room.gameState.status === 'word_reveal') {
        engine.showTurnResults();
      } else if (room.gameState.status === 'turn_results') {
        engine.advanceAfterTurnResults();
      }
    }

    assert.equal(turnsCount, 15, 'Exactly 15 drawing turns must be executed for 3 players across 5 rounds');
    assert.equal(room.gameState.status, 'game_over', 'Game must end in game_over state');
  });

  // Test 3: Each eligible player draws once per round
  test('3. Each eligible player draws once per round', () => {
    const io = createMockIO();
    const room = new Room({
      code: 'TEST3',
      type: 'private',
      hostId: 'p1',
      rules: { rounds: 3, turnTime: 30 }
    });
    room.addPlayer(new Player({ id: 'p1', socketId: 's1', nickname: 'Alice' }));
    room.addPlayer(new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' }));
    room.initEngine(io);

    const engine = room.gameEngine;
    engine.startGame();

    const drawersPerRound = { 1: [], 2: [], 3: [] };

    while (room.gameState.status !== 'game_over') {
      const currentR = room.gameState.currentRound;
      if (room.gameState.status === 'word_selecting') {
        drawersPerRound[currentR].push(room.gameState.currentDrawerId);
        engine.handleWordSelected({ word: 'TEST', category: 'General', difficulty: 'easy' });
      } else if (room.gameState.status === 'drawing') {
        engine.endTurn('timer_expired');
      } else if (room.gameState.status === 'word_reveal') {
        engine.showTurnResults();
      } else if (room.gameState.status === 'turn_results') {
        engine.advanceAfterTurnResults();
      }
    }

    assert.deepEqual(drawersPerRound[1].sort(), ['p1', 'p2'].sort(), 'Round 1 must have exactly p1 and p2 draw once');
    assert.deepEqual(drawersPerRound[2].sort(), ['p1', 'p2'].sort(), 'Round 2 must have exactly p1 and p2 draw once');
    assert.deepEqual(drawersPerRound[3].sort(), ['p1', 'p2'].sort(), 'Round 3 must have exactly p1 and p2 draw once');
  });

  // Test 4: Repeated turn-end events cannot skip players, award duplicate scores, or increase round count incorrectly
  test('4. Repeated turn-end events cannot skip players, award duplicate scores, or increase round count incorrectly', () => {
    const io = createMockIO();
    const room = new Room({
      code: 'TEST4',
      type: 'private',
      hostId: 'p1',
      rules: { rounds: 3, turnTime: 30 }
    });
    const p1 = new Player({ id: 'p1', socketId: 's1', nickname: 'Alice' });
    const p2 = new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' });
    room.addPlayer(p1);
    room.addPlayer(p2);
    room.initEngine(io);

    const engine = room.gameEngine;
    engine.startGame();

    // Drawer chooses word
    engine.handleWordSelected({ word: 'ELEPHANT', category: 'Animals', difficulty: 'easy' });

    // p2 guesses correctly
    const guessResult1 = engine.submitGuess('p2', 'ELEPHANT');
    assert.equal(guessResult1.isCorrect, true);
    const scoreAfterFirstGuess = p2.score;

    // p2 attempts duplicate guess during same turn
    const guessResult2 = engine.submitGuess('p2', 'ELEPHANT');
    assert.equal(guessResult2, null, 'Second guess from already-scored player must be rejected');
    assert.equal(p2.score, scoreAfterFirstGuess, 'Score must not duplicate');

    // Call endTurn multiple times in rapid succession
    engine.endTurn('all_guessed');
    engine.endTurn('timer_expired');
    engine.endTurn('all_guessed');

    assert.equal(room.gameState.status, 'word_reveal', 'State should be word_reveal and not corrupted by duplicate endTurn calls');
    assert.equal(room.gameState.currentRound, 1, 'Current round must still be 1');
  });

  // Test 5: Every word-choice set contains 3 distinct options
  test('5. Every word-choice set contains 3 distinct options', () => {
    const wm = new WordManager();

    // Test with standard dictionary
    for (let i = 0; i < 50; i++) {
      const choices = wm.getWordChoices({ difficulty: 'mixed' });
      assert.equal(choices.length, 3, 'Must produce exactly 3 choices');
      const uniqueWords = new Set(choices.map(c => c.word.toUpperCase()));
      assert.equal(uniqueWords.size, 3, 'All 3 choices must be distinct');
    }

    // Test with small custom words list (e.g. only 1 or 2 custom words)
    const smallCustom = wm.getWordChoices({ customWords: true, customWordsList: ['TACO'] });
    assert.equal(smallCustom.length, 3, 'Must supply safe fallback to 3 choices even with 1 custom word');
    const uniqueCustom = new Set(smallCustom.map(c => c.word.toUpperCase()));
    assert.equal(uniqueCustom.size, 3, 'All 3 choices must be distinct with fallback');
  });

  // Test 6: Previously used words are avoided until the available pool is exhausted
  test('6. Previously used words are avoided until the available pool is exhausted', () => {
    const wm = new WordManager();
    const customList = ['CAT', 'DOG', 'BIRD', 'FISH', 'LION', 'BEAR'];
    const rules = { customWords: true, customWordsList: customList };

    // Turn 1
    const set1 = wm.getWordChoices(rules);
    assert.equal(set1.length, 3);
    const chosenWord1 = set1[0].word;
    wm.markWordUsed(chosenWord1);

    // Turn 2
    const set2 = wm.getWordChoices(rules);
    assert.equal(set2.some(w => w.word === chosenWord1), false, 'Chosen word 1 must not be offered in turn 2');
    const chosenWord2 = set2[0].word;
    wm.markWordUsed(chosenWord2);

    // Turn 3
    const set3 = wm.getWordChoices(rules);
    assert.equal(set3.some(w => w.word === chosenWord1), false, 'Chosen word 1 must not be offered in turn 3');
    assert.equal(set3.some(w => w.word === chosenWord2), false, 'Chosen word 2 must not be offered in turn 3');
  });

  // Test 7: A player explicitly leaves during gameplay: if one human remains, that human wins immediately
  test('7. A player explicitly leaves during gameplay: if one human remains, that human wins immediately', () => {
    const io = createMockIO();
    const rm = new RoomManager();
    const p1 = new Player({ id: 'p1', socketId: 's1', nickname: 'Alice', isHost: true });
    const p2 = new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' });

    const room = rm.createPrivateRoom(p1, { rounds: 5 });
    room.addPlayer(p2);
    room.initEngine(io);

    const engine = room.gameEngine;
    engine.startGame();

    assert.equal(room.gameState.status, 'word_selecting');

    // Alice explicitly leaves
    rm.leaveRoom('p1');

    assert.equal(room.gameState.status, 'game_over', 'Game must end immediately when only 1 human remains');
    assert.equal(room.gameState.gameOverReason, 'single_human_remains');
    assert.equal(room.gameState.winner.id, 'p2', 'Remaining human (Bob) must be declared the winner');
    assert.match(room.gameState.winnerMessage, /You win! You're the last player remaining/);
  });

  // Test 7b: Private room capacity enforces real human players only (2-15)
  test('7b. Private room capacity enforces real human players only (2-15)', () => {
    const rm = new RoomManager();
    const host = new Player({ id: 'p1', socketId: 's1', nickname: 'Host', isHost: true });
    const room = rm.createPrivateRoom(host, { maxCapacity: 3 });

    assert.equal(room.type, 'private');
    assert.equal(room.capacity, 3);

    const p2 = new Player({ id: 'p2', socketId: 's2', nickname: 'P2' });
    const p3 = new Player({ id: 'p3', socketId: 's3', nickname: 'P3' });
    const p4 = new Player({ id: 'p4', socketId: 's4', nickname: 'P4' });

    assert.equal(room.addPlayer(p2).success, true);
    assert.equal(room.addPlayer(p3).success, true);
    assert.equal(room.addPlayer(p4).success, false, 'Room full when capacity reached');
    assert.equal(room.players.size, 3, 'Only 3 real players in room');
  });

  // Test 8: A player disconnects and reconnects within the grace period: not treated as permanently departed
  test('8. A player disconnects and reconnects within the grace period: not treated as permanently departed', () => {
    const rm = new RoomManager();
    const p1 = new Player({ id: 'p1', socketId: 's1', nickname: 'Alice' });
    const p2 = new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' });

    const room = rm.createPrivateRoom(p1, { rounds: 5 });
    room.addPlayer(p2);
    room.initEngine(createMockIO());

    room.gameEngine.startGame();

    // Alice disconnects unexpectedly
    rm.handleDisconnect('p1');
    assert.equal(p1.isConnected, false, 'Player connection flag should be false during grace period');
    assert.notEqual(room.gameState.status, 'game_over', 'Game must NOT end immediately upon unexpected disconnect');

    // Alice reconnects with new socket ID
    const reconnected = rm.reconnectPlayer('p1', 's1_new');
    assert.ok(reconnected, 'Reconnection should succeed');
    assert.equal(p1.isConnected, true, 'Player connection flag should be restored to true');
    assert.equal(p1.socketId, 's1_new', 'Socket ID should be updated');
    assert.equal(p1.disconnectTimer, null, 'Disconnect timer should be cancelled');
    room.gameEngine.clearAllTimers();
  });

  // Test 9: The final round ends even if a timer callback fires late
  test('9. The final round ends even if a timer callback fires late', () => {
    const io = createMockIO();
    const room = new Room({
      code: 'TEST9',
      type: 'private',
      hostId: 'p1',
      rules: { rounds: 1, turnTime: 30 }
    });
    room.addPlayer(new Player({ id: 'p1', socketId: 's1', nickname: 'Alice' }));
    room.addPlayer(new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' }));
    room.initEngine(io);

    const engine = room.gameEngine;
    engine.startGame();

    // Turn 1 (Alice)
    engine.handleWordSelected({ word: 'APPLE', category: 'Food', difficulty: 'easy' });
    engine.endTurn('all_guessed');
    engine.showTurnResults();
    engine.advanceAfterTurnResults();

    // Turn 2 (Bob) - final turn of Round 1
    engine.handleWordSelected({ word: 'CAT', category: 'Animals', difficulty: 'easy' });
    engine.endTurn('timer_expired');
    engine.showTurnResults();
    engine.advanceAfterTurnResults();

    assert.equal(room.gameState.status, 'game_over', 'Game must be over after final turn of round 1');

    // Simulate late timer callback attempting to end turn or select word after game over
    engine.endTurn('timer_expired');
    engine.handleWordSelected({ word: 'LATE', category: 'Late', difficulty: 'easy' });
    engine.startTurn();

    assert.equal(room.gameState.status, 'game_over', 'Status must stay game_over despite late callbacks');
  });

  // Test 10: After GAME_OVER, no further turn or round can start
  test('10. After GAME_OVER, no further turn or round can start', () => {
    const io = createMockIO();
    const room = new Room({
      code: 'TEST10',
      type: 'private',
      hostId: 'p1',
      rules: { rounds: 2, turnTime: 30 }
    });
    room.addPlayer(new Player({ id: 'p1', socketId: 's1', nickname: 'Alice' }));
    room.addPlayer(new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' }));
    room.initEngine(io);

    const engine = room.gameEngine;
    engine.startGame();

    // Force game over
    engine.endGame('rounds_completed');
    assert.equal(room.gameState.status, 'game_over');

    const roundBefore = room.gameState.currentRound;

    // Attempt invalid transitions
    engine.startTurn();
    engine.advanceAfterTurnResults();
    engine.handleWordSelected({ word: 'INVALID', category: 'Test', difficulty: 'easy' });

    assert.equal(room.gameState.status, 'game_over', 'Status must remain game_over');
    assert.equal(room.gameState.currentRound, roundBefore, 'Round counter must not change');
  });

});
