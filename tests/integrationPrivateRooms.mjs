import { io } from 'socket.io-client';
import assert from 'node:assert/strict';

const SERVER_URL = 'http://localhost:4000';

function createClient() {
  return io(SERVER_URL, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
  });
}

async function runIntegrationTest() {
  console.log('--- DRAWO Human-Only Private Multiplayer Integration Test ---');

  const client1 = createClient();
  const client2 = createClient();

  await new Promise((resolve) => client1.on('connect', resolve));
  await new Promise((resolve) => client2.on('connect', resolve));
  console.log('✔ Connected both clients to server');

  let latestState1 = null;
  let latestState2 = null;

  client1.on('room_state_updated', (data) => {
    latestState1 = data;
  });
  client2.on('room_state_updated', (data) => {
    latestState2 = data;
  });

  try {
    // 1. Create Private Room
    const createRes = await new Promise((resolve) => {
      client1.emit('create_private_room', {
        nickname: 'Alice',
        avatarId: 0,
        rules: { rounds: 2, turnTime: 30, maxCapacity: 4 }
      }, resolve);
    });

    assert.ok(createRes.success, 'Private room creation succeeded');
    const roomCode = createRes.roomCode;
    console.log(`✔ Created private room: ${roomCode}`);

    // 2. Join Private Room with Player 2
    const joinRes = await new Promise((resolve) => {
      client2.emit('join_room', {
        roomCode,
        nickname: 'Bob',
        avatarId: 1
      }, resolve);
    });

    assert.ok(joinRes.success, 'Player 2 joined room');
    console.log('✔ Player 2 joined successfully');

    // 3. Verify Obsolete socket event 'add_bot' is blocked
    const botRes = await new Promise((resolve) => {
      client1.emit('add_bot', resolve);
    });
    assert.equal(botRes.success, false, 'add_bot must be rejected');
    assert.equal(botRes.reason, 'unsupported');
    console.log('✔ Verified add_bot socket event is rejected as unsupported');

    // 4. Verify Obsolete socket event 'join_public_match' is blocked
    const publicRes = await new Promise((resolve) => {
      client2.emit('join_public_match', { nickname: 'Charlie' }, resolve);
    });
    assert.equal(publicRes.success, false, 'join_public_match must be rejected');
    assert.equal(publicRes.reason, 'unsupported');
    console.log('✔ Verified join_public_match is rejected as unsupported');

    // Wait a brief moment for room sync
    await new Promise((r) => setTimeout(r, 100));

    assert.ok(latestState1, 'client1 received room state');
    assert.equal(latestState1.players.length, 2, 'Exactly 2 real players in room');
    assert.equal(latestState1.type, 'private');
    assert.equal(latestState1.hasBot, undefined, 'hasBot property is removed');
    console.log('✔ Room state validated (2 real humans, 0 bots)');

    // 5. Start Game
    const wordSelectPromise = new Promise((resolve) => {
      client1.on('room_state_updated', (data) => {
        if (data.gameState && data.gameState.status === 'word_selecting') {
          resolve(data);
        }
      });
    });

    client1.emit('start_game');
    const wordSelectState = await wordSelectPromise;
    console.log(`✔ Game started in word_selecting phase (Round ${wordSelectState.gameState.currentRound}/${wordSelectState.gameState.totalRounds})`);
    assert.ok(wordSelectState.gameState.currentDrawerId, 'Active drawer assigned');

    // Identify drawer client and guesser client
    const drawerClient = wordSelectState.gameState.currentDrawerId === latestState1.players[0].id ? client1 : client2;
    const guesserClient = drawerClient === client1 ? client2 : client1;

    // Drawer chooses word
    const drawingPromise = new Promise((resolve) => {
      guesserClient.on('room_state_updated', (data) => {
        if (data.gameState && data.gameState.status === 'drawing') {
          resolve(data);
        }
      });
    });

    drawerClient.emit('drawer_select_word', { wordItem: { word: 'SUNSHINE', category: 'Nature', difficulty: 'easy' } });
    const drawingState = await drawingPromise;
    console.log('✔ Active drawing phase started');

    // Security check: Guesser should NOT receive the secret word
    assert.equal(drawingState.gameState.currentWord, null, 'Secret word masked for guesser');

    // Guesser submits correct guess
    const correctGuessPromise = new Promise((resolve) => {
      guesserClient.on('guess_correct_private', resolve);
    });

    guesserClient.emit('submit_guess', { text: 'SUNSHINE' });
    const correctGuessData = await correctGuessPromise;
    console.log(`✔ Correct guess awarded to ${correctGuessData.nickname || 'Guesser'} (+${correctGuessData.points} pts)`);
    assert.ok(correctGuessData.points > 0, 'Points awarded to guesser');

    console.log('\n🎉 INTEGRATION TEST PASSED SUCCESSFULLY!');
  } finally {
    client1.disconnect();
    client2.disconnect();
  }
}

runIntegrationTest().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
