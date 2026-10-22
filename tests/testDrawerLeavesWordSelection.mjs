import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { RoomManager } from '../backend/rooms/RoomManager.js';
import { Player } from '../backend/rooms/Player.js';

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

describe('DRAWO — Drawer Leaving During Word Selection Test Suite', () => {

  test('1. Drawer leaves during word selection: turn is skipped, next player gets choices, no points, no reveal screen', () => {
    const io = createMockIO();
    const roomManager = new RoomManager();

    const p1 = new Player({ id: 'p1', socketId: 's1', nickname: 'Alice', isHost: true });
    const p2 = new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' });
    const p3 = new Player({ id: 'p3', socketId: 's3', nickname: 'Charlie' });

    const room = roomManager.createPrivateRoom(p1, { rounds: 3, turnTime: 30 });
    room.initEngine(io);

    room.addPlayer(p2);
    room.addPlayer(p3);
    roomManager.playerRoomMap.set('p2', room.code);
    roomManager.playerRoomMap.set('s2', room.code);
    roomManager.playerRoomMap.set('p3', room.code);
    roomManager.playerRoomMap.set('s3', room.code);

    const engine = room.gameEngine;
    engine.startGame();

    // Verify initial state: p1 is drawer in word_selecting
    assert.equal(room.gameState.status, 'word_selecting');
    assert.equal(room.gameState.currentDrawerId, 'p1');

    // Clear event history prior to p1 leaving
    io.events.length = 0;

    // p1 leaves during word selection
    roomManager.leaveRoom('p1');

    // 1. Assert game transitioned directly to next player (p2) in word_selecting without reveal/results screens
    assert.equal(room.gameState.status, 'word_selecting', 'Status must directly be word_selecting');
    assert.equal(room.gameState.currentDrawerId, 'p2', 'p2 must now be the active drawer');

    // 2. Assert NO correct_guess or reveal events were emitted
    const correctGuessEvents = io.events.filter(e => e.event === 'correct_guess');
    assert.equal(correctGuessEvents.length, 0, 'No correct_guess event should ever be emitted');

    // 3. Assert NO points awarded to any player
    assert.equal(p2.score, 0, 'No points awarded to p2');
    assert.equal(p3.score, 0, 'No points awarded to p3');
    assert.equal(p2.turnPoints, 0, 'turnPoints must be 0');
    assert.equal(p3.turnPoints, 0, 'turnPoints must be 0');

    // 4. Assert new drawer (p2) received fresh 3 word choices
    const drawerChoicesEvents = io.events.filter(
      e => e.event === 'drawer_choose_word' && e.target === 's2'
    );
    assert.equal(drawerChoicesEvents.length, 1, 'p2 must receive drawer_choose_word event');
    assert.equal(drawerChoicesEvents[0].data.choices.length, 3, 'p2 must receive 3 fresh word choices');
    assert.equal(drawerChoicesEvents[0].data.timeoutSeconds, 20, '20s selection timer for new drawer');

    // 5. Assert p3 (guesser) does NOT receive choices or secret word
    const p3Choices = io.events.filter(e => e.event === 'drawer_choose_word' && e.target === 's3');
    assert.equal(p3Choices.length, 0, 'Guessers must not receive drawer_choose_word event');

    engine.clearAllTimers();
  });

  test('2. Drawer leaves leaving only 1 human player: single human wins immediately', () => {
    const io = createMockIO();
    const roomManager = new RoomManager();

    const p1 = new Player({ id: 'p1', socketId: 's1', nickname: 'Alice', isHost: true });
    const p2 = new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' });

    const room = roomManager.createPrivateRoom(p1, { rounds: 3, turnTime: 30 });
    room.initEngine(io);

    room.addPlayer(p2);
    roomManager.playerRoomMap.set('p2', room.code);
    roomManager.playerRoomMap.set('s2', room.code);

    const engine = room.gameEngine;
    engine.startGame();

    assert.equal(room.gameState.status, 'word_selecting');
    assert.equal(room.gameState.currentDrawerId, 'p1');

    // p1 leaves during word selection
    roomManager.leaveRoom('p1');

    // Game should immediately transition to game_over with p2 as winner
    assert.equal(room.gameState.status, 'game_over', 'Game must end when 1 player remains');
    assert.equal(room.gameState.gameOverReason, 'single_human_remains');
    assert.equal(room.gameState.winner.id, 'p2', 'Remaining player Bob (p2) must be winner');

    engine.clearAllTimers();
  });

  test('3. Drawer leaves at round boundary: round count and limits are strictly preserved', () => {
    const io = createMockIO();
    const roomManager = new RoomManager();

    const p1 = new Player({ id: 'p1', socketId: 's1', nickname: 'Alice', isHost: true });
    const p2 = new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' });
    const p3 = new Player({ id: 'p3', socketId: 's3', nickname: 'Charlie' });

    const room = roomManager.createPrivateRoom(p1, { rounds: 2, turnTime: 30 });
    room.initEngine(io);

    room.addPlayer(p2);
    room.addPlayer(p3);
    roomManager.playerRoomMap.set('p2', room.code);
    roomManager.playerRoomMap.set('s2', room.code);
    roomManager.playerRoomMap.set('p3', room.code);
    roomManager.playerRoomMap.set('s3', room.code);

    const engine = room.gameEngine;
    engine.startGame();

    // Round 1 - Turn 1: p1 selects word and draws
    assert.equal(room.gameState.currentRound, 1);
    assert.equal(room.gameState.currentDrawerId, 'p1');
    engine.handleWordSelected({ word: 'APPLE', category: 'Food' });
    engine.endTurn('all_guessed');
    engine.showTurnResults();
    engine.advanceAfterTurnResults();

    // Round 1 - Turn 2: p2 selects word and draws
    assert.equal(room.gameState.currentRound, 1);
    assert.equal(room.gameState.currentDrawerId, 'p2');
    engine.handleWordSelected({ word: 'BANANA', category: 'Food' });
    engine.endTurn('all_guessed');
    engine.showTurnResults();
    engine.advanceAfterTurnResults();

    // Round 1 - Turn 3: p3 is in word_selecting (last drawer of Round 1)
    assert.equal(room.gameState.currentRound, 1);
    assert.equal(room.gameState.currentDrawerId, 'p3');
    assert.equal(room.gameState.status, 'word_selecting');

    // p3 leaves during word selection
    roomManager.leaveRoom('p3');

    // Round 1 should cleanly finish and advance to Round 2 with remaining players [p1, p2]
    assert.equal(room.gameState.status, 'word_selecting');
    assert.equal(room.gameState.currentRound, 2, 'Must advance to Round 2');
    assert.equal(room.gameState.currentDrawerId, 'p1', 'p1 must be drawer for Round 2 Turn 1');

    // Round 2 - Turn 1: p1 draws
    engine.handleWordSelected({ word: 'CHERRY', category: 'Food' });
    engine.endTurn('all_guessed');
    engine.showTurnResults();
    engine.advanceAfterTurnResults();

    // Round 2 - Turn 2: p2 draws (final turn of game)
    assert.equal(room.gameState.currentRound, 2);
    assert.equal(room.gameState.currentDrawerId, 'p2');
    engine.handleWordSelected({ word: 'DATE', category: 'Food' });
    engine.endTurn('all_guessed');
    engine.showTurnResults();
    engine.advanceAfterTurnResults();

    // Game should be complete after exactly 2 rounds
    assert.equal(room.gameState.status, 'game_over');
    assert.equal(room.gameState.gameOverReason, 'rounds_completed');

    engine.clearAllTimers();
  });

  test('4. Non-drawer leaves during word selection: drawer continues uninterrupted', () => {
    const io = createMockIO();
    const roomManager = new RoomManager();

    const p1 = new Player({ id: 'p1', socketId: 's1', nickname: 'Alice', isHost: true });
    const p2 = new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' });
    const p3 = new Player({ id: 'p3', socketId: 's3', nickname: 'Charlie' });

    const room = roomManager.createPrivateRoom(p1, { rounds: 2, turnTime: 30 });
    room.initEngine(io);

    room.addPlayer(p2);
    room.addPlayer(p3);
    roomManager.playerRoomMap.set('p2', room.code);
    roomManager.playerRoomMap.set('s2', room.code);
    roomManager.playerRoomMap.set('p3', room.code);
    roomManager.playerRoomMap.set('s3', room.code);

    const engine = room.gameEngine;
    engine.startGame();

    assert.equal(room.gameState.status, 'word_selecting');
    assert.equal(room.gameState.currentDrawerId, 'p1');

    // p2 (guesser) leaves while p1 is choosing a word
    roomManager.leaveRoom('p2');

    // p1 must still be drawer in word_selecting!
    assert.equal(room.gameState.status, 'word_selecting');
    assert.equal(room.gameState.currentDrawerId, 'p1');

    // p1 selects word and starts drawing
    engine.handleWordSelected({ word: 'GUITAR', category: 'Music' });
    assert.equal(room.gameState.status, 'drawing');
    assert.equal(room.gameState.currentWord, 'GUITAR');

    engine.clearAllTimers();
  });

  test('5. Pending word-selection timeout callback is invalidated when drawer leaves', () => {
    const io = createMockIO();
    const roomManager = new RoomManager();

    const p1 = new Player({ id: 'p1', socketId: 's1', nickname: 'Alice', isHost: true });
    const p2 = new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' });
    const p3 = new Player({ id: 'p3', socketId: 's3', nickname: 'Charlie' });

    const room = roomManager.createPrivateRoom(p1, { rounds: 2, turnTime: 30 });
    room.initEngine(io);

    room.addPlayer(p2);
    room.addPlayer(p3);
    roomManager.playerRoomMap.set('p2', room.code);
    roomManager.playerRoomMap.set('s2', room.code);
    roomManager.playerRoomMap.set('p3', room.code);
    roomManager.playerRoomMap.set('s3', room.code);

    const engine = room.gameEngine;
    engine.startGame();

    assert.equal(room.gameState.status, 'word_selecting');
    assert.equal(room.gameState.currentDrawerId, 'p1');

    // Drawer leaves
    roomManager.leaveRoom('p1');

    // p2 is now drawer
    assert.equal(room.gameState.status, 'word_selecting');
    assert.equal(room.gameState.currentDrawerId, 'p2');

    // Verify turnManager timer is set for p2 with 20s
    assert.equal(room.gameState.timerSeconds, 20);
    assert.equal(room.gameState.currentDrawerId, 'p2');

    engine.clearAllTimers();
  });

  test('6. Guesser leaves during word selection: drawer is lone player left -> game ends immediately, drawer wins', () => {
    const io = createMockIO();
    const roomManager = new RoomManager();

    const p1 = new Player({ id: 'p1', socketId: 's1', nickname: 'Alice', isHost: true });
    const p2 = new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' });

    const room = roomManager.createPrivateRoom(p1, { rounds: 2, turnTime: 30 });
    room.initEngine(io);

    room.addPlayer(p2);
    roomManager.playerRoomMap.set('p2', room.code);
    roomManager.playerRoomMap.set('s2', room.code);

    const engine = room.gameEngine;
    engine.startGame();

    // Alice is choosing a word, Bob leaves
    assert.equal(room.gameState.status, 'word_selecting');
    assert.equal(room.gameState.currentDrawerId, 'p1');

    roomManager.leaveRoom('p2');

    // Game must end immediately with Alice winning
    assert.equal(room.gameState.status, 'game_over', 'Game must end immediately when only 1 player remains');
    assert.equal(room.gameState.gameOverReason, 'single_human_remains');
    assert.equal(room.gameState.winner.id, 'p1', 'Alice (drawer) must be declared the winner');

    engine.clearAllTimers();
  });

  test('7. Player leaves during drawing phase: lone player left -> game ends immediately', () => {
    const io = createMockIO();
    const roomManager = new RoomManager();

    const p1 = new Player({ id: 'p1', socketId: 's1', nickname: 'Alice', isHost: true });
    const p2 = new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' });

    const room = roomManager.createPrivateRoom(p1, { rounds: 2, turnTime: 30 });
    room.initEngine(io);

    room.addPlayer(p2);
    roomManager.playerRoomMap.set('p2', room.code);
    roomManager.playerRoomMap.set('s2', room.code);

    const engine = room.gameEngine;
    engine.startGame();

    // Alice selects word and begins drawing
    engine.handleWordSelected({ word: 'PIZZA', category: 'Food' });
    assert.equal(room.gameState.status, 'drawing');

    // Bob leaves during drawing phase
    roomManager.leaveRoom('p2');

    // Game must immediately end with Alice winning
    assert.equal(room.gameState.status, 'game_over');
    assert.equal(room.gameState.gameOverReason, 'single_human_remains');
    assert.equal(room.gameState.winner.id, 'p1');

    engine.clearAllTimers();
  });

  test('8. Player leaves during turn results: lone player left -> game ends immediately', () => {
    const io = createMockIO();
    const roomManager = new RoomManager();

    const p1 = new Player({ id: 'p1', socketId: 's1', nickname: 'Alice', isHost: true });
    const p2 = new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' });

    const room = roomManager.createPrivateRoom(p1, { rounds: 2, turnTime: 30 });
    room.initEngine(io);

    room.addPlayer(p2);
    roomManager.playerRoomMap.set('p2', room.code);
    roomManager.playerRoomMap.set('s2', room.code);

    const engine = room.gameEngine;
    engine.startGame();

    engine.handleWordSelected({ word: 'PIZZA', category: 'Food' });
    engine.endTurn('all_guessed');
    engine.showTurnResults();
    assert.equal(room.gameState.status, 'turn_results');

    // Bob leaves during turn results
    roomManager.leaveRoom('p2');

    // Game must immediately end with Alice winning
    assert.equal(room.gameState.status, 'game_over');
    assert.equal(room.gameState.gameOverReason, 'single_human_remains');
    assert.equal(room.gameState.winner.id, 'p1');

    engine.clearAllTimers();
  });

});
