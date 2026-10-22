import { io } from 'socket.io-client';
import assert from 'node:assert/strict';

const SERVER_URL = 'http://127.0.0.1:4000';

function createClient(sessionId) {
  const client = io(SERVER_URL, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
  });
  client.sessionId = sessionId;
  return client;
}

async function runReturnToLobbyTest() {
  console.log('=== DRAWO TEST: RETURN TO LOBBY / PLAY AGAIN AFTER MATCH ===\n');

  const client1 = createClient('user_lobby_1');
  const client2 = createClient('user_lobby_2');

  try {
    await Promise.all([
      new Promise(r => client1.on('connect', r)),
      new Promise(r => client2.on('connect', r))
    ]);

    // 1. Create Room
    const createRes = await new Promise(res => {
      client1.emit('create_private_room', {
        nickname: 'HostLobby',
        avatarId: 0,
        rules: { rounds: 1, turnTime: 20 },
        sessionId: client1.sessionId
      }, res);
    });
    const roomCode = createRes.roomCode;

    // 2. Join Room
    await new Promise(res => {
      client2.emit('join_room', {
        roomCode,
        nickname: 'GuestLobby',
        avatarId: 1,
        sessionId: client2.sessionId
      }, res);
    });

    console.log(`✔ Room ${roomCode} created with 2 players`);

    // 3. Start Game
    client1.emit('start_game');
    await new Promise(r => setTimeout(r, 200));

    // Force game over state via server endGame (e.g. simulate match completion)
    const gameOverState = await new Promise(resolve => {
      client1.on('room_state_updated', (data) => {
        if (data.gameState?.status === 'game_over') {
          resolve(data);
        }
      });
      // Player 2 leaves to trigger lone human win and immediate game over
      client2.emit('leave_room');
    });

    assert.equal(gameOverState.gameState.status, 'game_over', 'Game status reached game_over');
    console.log('✔ Match completed, room is in game_over status');

    // 4. Test Return to Lobby
    console.log('\n4. Emitting return_to_lobby...');
    const lobbyResetStatePromise = new Promise(resolve => {
      client1.on('room_state_updated', (data) => {
        if (data.gameState?.status === 'lobby') {
          resolve(data);
        }
      });
    });

    client1.emit('return_to_lobby');
    const resetState = await lobbyResetStatePromise;

    assert.equal(resetState.gameState.status, 'lobby', 'Room status successfully reset to lobby');
    assert.equal(resetState.gameState.currentDrawerId, null, 'Drawer reset to null');
    assert.equal(resetState.gameState.currentWord, null, 'Word reset to null');
    assert.equal(resetState.gameState.winner, null, 'Winner reset to null');
    console.log('✔ Server room successfully reset to lobby with cleared game state');

    // 5. Verify guest can re-join and host can start new match
    await new Promise(res => {
      client2.emit('join_room', {
        roomCode,
        nickname: 'GuestLobby',
        avatarId: 1,
        sessionId: client2.sessionId
      }, res);
    });

    const newMatchPromise = new Promise(resolve => {
      client1.on('room_state_updated', (data) => {
        if (data.gameState?.status === 'word_selecting') {
          resolve(data);
        }
      });
    });

    client1.emit('start_game');
    const newMatchState = await newMatchPromise;
    assert.equal(newMatchState.gameState.status, 'word_selecting', 'New match started cleanly from lobby');
    console.log('✔ Host successfully started a brand new match from the lobby!');

    console.log('\n🎉 ALL RETURN TO LOBBY / PLAY AGAIN TESTS PASSED!');
  } finally {
    client1.disconnect();
    client2.disconnect();
  }
}

runReturnToLobbyTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  });
