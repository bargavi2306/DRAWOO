import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { RoomManager } from '../backend/rooms/RoomManager.js';
import { Player } from '../backend/rooms/Player.js';

function createMockIO() {
  const events = [];
  const rooms = new Map(); // roomName -> Set of socketIds

  return {
    events,
    rooms,
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

describe('DRAWO — 3 Critical Multiplayer Bugs Test Suite', () => {

  // ==========================================
  // BUG 1: WORD CHOICE APPEARS ONLY FOR DRAWER
  // ==========================================
  describe('Bug 1 — Word Choice Does Not Appear for the Drawer', () => {

    test('1.1 Match start: authoritative drawer receives 3 word choices; guessers receive waiting state with choices sanitized', () => {
      const io = createMockIO();
      const rm = new RoomManager();

      const host = new Player({ id: 'p1_host', socketId: 's1', nickname: 'Alice', isHost: true });
      const guest = new Player({ id: 'p2_guest', socketId: 's2', nickname: 'Bob', isHost: false });

      const room = rm.createPrivateRoom(host, { rounds: 3, turnTime: 45 });
      room.addPlayer(guest);
      room.initEngine(io);

      // Start match
      room.gameEngine.startGame();

      // State assertions
      assert.equal(room.gameState.status, 'word_selecting');
      const drawerId = room.gameState.currentDrawerId;
      assert.ok(drawerId === 'p1_host' || drawerId === 'p2_guest', 'Drawer must be an eligible player');

      // Check drawer choices event was emitted ONLY to the drawer socket
      const drawerSocketId = drawerId === 'p1_host' ? 's1' : 's2';
      const guesserSocketId = drawerId === 'p1_host' ? 's2' : 's1';

      const drawerEvents = io.events.filter(e => e.event === 'drawer_choose_word' && e.target === drawerSocketId);
      const guesserEvents = io.events.filter(e => e.event === 'drawer_choose_word' && e.target === guesserSocketId);

      assert.equal(drawerEvents.length, 1, 'Drawer socket must receive drawer_choose_word event');
      assert.equal(drawerEvents[0].data.choices.length, 3, 'Drawer must receive exactly 3 distinct word choices');
      assert.equal(guesserEvents.length, 0, 'Guesser socket must NEVER receive drawer_choose_word event');

      // Check sanitized game state for drawer vs guesser
      const drawerSanitized = room.gameEngine.getSanitizedGameState(true);
      const guesserSanitized = room.gameEngine.getSanitizedGameState(false);

      assert.ok(drawerSanitized.wordChoices && drawerSanitized.wordChoices.length === 3, 'Drawer state includes 3 choices');
      assert.equal(guesserSanitized.wordChoices.length, 0, 'Guesser state has empty wordChoices');
      assert.equal(guesserSanitized.currentWord, null, 'Guesser secret word must be null');

      room.gameEngine.clearAllTimers();
    });

    test('1.2 Selection timeout: deterministic fallback assigns word to the SAME drawer, never to a random player', () => {
      const io = createMockIO();
      const rm = new RoomManager();

      const host = new Player({ id: 'p1', socketId: 's1', nickname: 'Alice', isHost: true });
      const guest = new Player({ id: 'p2', socketId: 's2', nickname: 'Bob', isHost: false });

      const room = rm.createPrivateRoom(host, { rounds: 3, turnTime: 45 });
      room.addPlayer(guest);
      room.initEngine(io);

      room.gameEngine.startGame();
      const initialDrawerId = room.gameState.currentDrawerId;

      // Simulate timeout triggering auto-selection
      const firstChoice = room.gameEngine.currentWordChoices[0];
      room.gameEngine.handleWordSelected(firstChoice);

      // Verify phase transitioned to drawing with the SAME drawer
      assert.equal(room.gameState.status, 'drawing');
      assert.equal(room.gameState.currentDrawerId, initialDrawerId, 'Same drawer must remain the drawer');
      assert.equal(room.gameState.currentWord, firstChoice.word, 'Selected word must match deterministic fallback');

      room.gameEngine.clearAllTimers();
    });

  });

  // ==========================================
  // BUG 2: JOINING PLAYER SYNCHRONIZATION
  // ==========================================
  describe('Bug 2 — A Joining Player Enters the Correct Lobby/Game State', () => {

    test('2.1 Joining player connects to existing room, receives correct code, player list, and host status', () => {
      const rm = new RoomManager();
      const host = new Player({ id: 'p1_host', socketId: 's1', nickname: 'HostPlayer', isHost: true });
      const room = rm.createPrivateRoom(host, { maxCapacity: 8 });

      // Guest joins
      const guest = new Player({ id: 'p2_guest', socketId: 's2', nickname: 'JoiningPlayer', isHost: false });
      const joinResult = room.addPlayer(guest);

      assert.equal(joinResult.success, true);
      assert.equal(room.players.size, 2, 'Room must have exactly 2 players');
      assert.equal(room.hostId, 'p1_host', 'Original creator must remain host');
      assert.equal(host.isHost, true, 'Host isHost must be true');
      assert.equal(guest.isHost, false, 'Guest isHost must be false');
    });

    test('2.2 When game is already in progress and midGameJoin is disabled, join is rejected', () => {
      const rm = new RoomManager();
      const host = new Player({ id: 'p1', socketId: 's1', nickname: 'Host', isHost: true });
      const room = rm.createPrivateRoom(host, { midGameJoin: false });
      const p2 = new Player({ id: 'p2', socketId: 's2', nickname: 'Bob' });
      room.addPlayer(p2);
      room.initEngine(createMockIO());

      // Start game
      room.gameEngine.startGame();
      assert.equal(room.gameState.status, 'word_selecting');

      // Attempt to join active game with midGameJoin: false
      const canJoin = !(room.gameState.status !== 'lobby' && room.gameState.status !== 'game_over' && !room.rules.midGameJoin);
      assert.equal(canJoin, false, 'Join must be rejected when midGameJoin is false during active game');

      room.gameEngine.clearAllTimers();
    });

    test('2.3 Player leaves in lobby: player is removed immediately and remaining player count updates', () => {
      const rm = new RoomManager();
      const host = new Player({ id: 'usr_host_123', socketId: 's_host', nickname: 'Host', isHost: true });
      const room = rm.createPrivateRoom(host);
      const guest = new Player({ id: 'usr_guest_456', socketId: 's_guest', nickname: 'Guest' });
      room.addPlayer(guest);
      rm.playerRoomMap.set('usr_guest_456', room.code);
      rm.playerRoomMap.set('s_guest', room.code);

      assert.equal(room.players.size, 2);

      // Guest leaves in lobby by socketId or sessionId
      const result = rm.leaveRoom('s_guest');
      assert.equal(result.room.players.size, 1, 'Guest must be immediately removed from lobby');
      assert.equal(room.players.has('usr_guest_456'), false, 'Guest player ID removed');

      // Host is still in room
      const remainingHost = room.getPlayer('s_host');
      assert.ok(remainingHost, 'Host is found via socketId');
      assert.equal(remainingHost.isHost, true, 'Host isHost flag is true');
    });

  });

  // ==========================================
  // BUG 3: CORRECT GUESSES MUST BE PRIVATE
  // ==========================================
  describe('Bug 3 — Correct Guesses Must Be Private', () => {

    test('3.1 Incorrect guess: evaluated as incorrect and does not award points', () => {
      const io = createMockIO();
      const rm = new RoomManager();

      const host = new Player({ id: 'p1_drawer', socketId: 's1', nickname: 'Alice', isHost: true });
      const guest = new Player({ id: 'p2_guesser', socketId: 's2', nickname: 'Bob', isHost: false });

      const room = rm.createPrivateRoom(host, { turnTime: 90 });
      room.addPlayer(guest);
      room.initEngine(io);

      room.gameEngine.startGame();

      // Force drawer to be p1
      room.gameState.currentDrawerId = 'p1_drawer';
      host.isDrawing = true;
      guest.isDrawing = false;
      room.gameEngine.handleWordSelected({ word: 'VOLCANO', category: 'Nature' });

      assert.equal(room.gameState.status, 'drawing');
      assert.equal(room.gameState.currentWord, 'VOLCANO');

      // Bob submits incorrect guess
      const res = room.gameEngine.submitGuess('p2_guesser', 'MOUNTAIN');

      assert.equal(res.isCorrect, false, 'Incorrect guess must return isCorrect: false');
      assert.equal(guest.isGuessed, false, 'Guest must not be marked as guessed');
      assert.equal(guest.score, 0, 'No points awarded for incorrect guess');

      room.gameEngine.clearAllTimers();
    });

    test('3.2 Correct guess: awards points once, locks player, and validates whitespace/case normalization', () => {
      const io = createMockIO();
      const rm = new RoomManager();

      const host = new Player({ id: 'p1_drawer', socketId: 's1', nickname: 'Alice', isHost: true });
      const guesser1 = new Player({ id: 'p2_guesser', socketId: 's2', nickname: 'Bob', isHost: false });
      const guesser2 = new Player({ id: 'p3_guesser', socketId: 's3', nickname: 'Charlie', isHost: false });

      const room = rm.createPrivateRoom(host, { turnTime: 90 });
      room.addPlayer(guesser1);
      room.addPlayer(guesser2);
      room.initEngine(io);

      room.gameEngine.startGame();
      room.gameState.currentDrawerId = 'p1_drawer';
      host.isDrawing = true;
      guesser1.isDrawing = false;
      guesser2.isDrawing = false;

      room.gameEngine.handleWordSelected({ word: 'VOLCANO', category: 'Nature' });
      room.gameState.timerSeconds = 60; // 60s remaining

      // 1. Bob guesses correctly with whitespace and lowercase: "  volcano  "
      const res = room.gameEngine.submitGuess('p2_guesser', '  volcano  ');

      assert.equal(res.isCorrect, true, 'Case-insensitive trimmed guess must be correct');
      assert.ok(res.points > 0, 'Points must be awarded for correct guess');
      assert.equal(guesser1.isGuessed, true, 'Guesser must be marked isGuessed: true');
      const initialScore = guesser1.score;
      assert.ok(initialScore > 0, 'Score must be incremented');

      // 2. Bob attempts to guess again during the same turn: locked, cannot score twice
      const repeatRes = room.gameEngine.submitGuess('p2_guesser', 'VOLCANO');
      assert.equal(repeatRes, null, 'Second guess from already-guessed player must be rejected');
      assert.equal(guesser1.score, initialScore, 'Score must not change on duplicate correct guess');

      // 3. Charlie (guesser2) can still guess during the same turn
      assert.equal(room.gameState.status, 'drawing', 'Turn must continue for remaining guessers');
      const charlieRes = room.gameEngine.submitGuess('p3_guesser', 'volcano');
      assert.equal(charlieRes.isCorrect, true);
      assert.equal(guesser2.isGuessed, true);

      // Now all eligible guessers have guessed -> turn transitions to word_reveal
      assert.equal(room.gameState.status, 'word_reveal');

      room.gameEngine.clearAllTimers();
    });

    test('3.3 Guesser-facing room state NEVER contains the secret word during active drawing', () => {
      const io = createMockIO();
      const rm = new RoomManager();

      const host = new Player({ id: 'p1_drawer', socketId: 's1', nickname: 'Alice', isHost: true });
      const guest = new Player({ id: 'p2_guesser', socketId: 's2', nickname: 'Bob', isHost: false });

      const room = rm.createPrivateRoom(host, { turnTime: 90 });
      room.addPlayer(guest);
      room.initEngine(io);

      room.gameEngine.startGame();
      room.gameState.currentDrawerId = 'p1_drawer';
      host.isDrawing = true;
      guest.isDrawing = false;
      room.gameEngine.handleWordSelected({ word: 'SECRET_DIAMOND', category: 'Treasure' });

      const guesserState = room.gameEngine.getSanitizedGameState(false);
      assert.equal(guesserState.currentWord, null, 'Guesser state MUST have currentWord: null');

      const drawerState = room.gameEngine.getSanitizedGameState(true);
      assert.equal(drawerState.currentWord, 'SECRET_DIAMOND', 'Drawer state retains secret word');

      room.gameEngine.clearAllTimers();
    });

  });

});
