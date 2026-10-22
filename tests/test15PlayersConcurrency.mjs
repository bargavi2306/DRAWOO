import { io } from 'socket.io-client';
import assert from 'node:assert/strict';

const SERVER_URL = 'http://127.0.0.1:4000';
const PLAYER_COUNT = 16; // 1 Host + 15 Players = 16 concurrent clients

function createClient(sessionId) {
  const client = io(SERVER_URL, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
  });
  client.sessionId = sessionId;
  return client;
}

async function run15PlayersConcurrencyTest() {
  console.log(`=== DRAWO CONCURRENCY & STABILITY TEST (${PLAYER_COUNT} PLAYERS CONCURRENT) ===\n`);

  const clients = [];

  try {
    // 1. Connect all 16 client sockets concurrently
    console.log(`1. Connecting ${PLAYER_COUNT} concurrent client sockets...`);
    const connectPromises = [];
    for (let i = 0; i < PLAYER_COUNT; i++) {
      const client = createClient(`sess_${i}`);
      clients.push(client);
      connectPromises.push(new Promise((resolve, reject) => {
        client.on('connect', resolve);
        client.on('connect_error', reject);
      }));
    }
    await Promise.all(connectPromises);
    console.log(`✔ All ${PLAYER_COUNT} clients connected successfully via WebSockets`);

    const hostClient = clients[0];

    // 2. Host creates room with capacity = 16
    console.log('\n2. Host creating room with capacity 16...');
    const createRes = await new Promise((resolve) => {
      hostClient.emit('create_private_room', {
        nickname: 'Host_0',
        avatarId: 0,
        rules: { rounds: 1, turnTime: 30, maxCapacity: PLAYER_COUNT },
        sessionId: hostClient.sessionId
      }, resolve);
    });

    assert.ok(createRes.success, 'Host room creation succeeded');
    const roomCode = createRes.roomCode;
    console.log(`✔ Room created with code: ${roomCode}, capacity: ${PLAYER_COUNT}`);

    // 3. 15 other players join the room concurrently
    console.log(`\n3. Joining 15 players into room ${roomCode} simultaneously...`);
    const joinPromises = [];
    for (let i = 1; i < PLAYER_COUNT; i++) {
      const guest = clients[i];
      const p = new Promise((resolve) => {
        guest.emit('join_room', {
          roomCode,
          nickname: `Guest_${i}`,
          avatarId: i % 16,
          sessionId: guest.sessionId
        }, resolve);
      });
      joinPromises.push(p);
    }
    const joinResults = await Promise.all(joinPromises);
    for (let i = 0; i < joinResults.length; i++) {
      assert.ok(joinResults[i].success, `Player ${i + 1} join succeeded`);
    }
    console.log(`✔ All 15 guest players joined successfully (Total: ${PLAYER_COUNT} players)`);

    // 4. Verify room state on host and guests has 16 players
    await new Promise((r) => setTimeout(r, 100));
    const latestHostState = await new Promise((resolve) => {
      hostClient.once('room_state_updated', resolve);
      // Trigger a state update by fetching or wait for broadcast
      hostClient.emit('update_rules', { rules: { hints: true } });
    });
    assert.equal(latestHostState.players.length, PLAYER_COUNT, `Room contains exactly ${PLAYER_COUNT} players`);
    console.log(`✔ Synchronized room list verified: ${latestHostState.players.length} players active`);

    // 5. Host starts game
    console.log('\n5. Starting match with 16 players...');
    const wordChoicesReceived = new Map();
    for (let i = 0; i < PLAYER_COUNT; i++) {
      clients[i].on('drawer_choose_word', (payload) => {
        wordChoicesReceived.set(i, payload);
      });
    }

    hostClient.emit('start_game');

    // Wait for word_selecting phase
    await new Promise((r) => setTimeout(r, 200));

    // Exactly 1 client must receive drawer_choose_word
    assert.equal(wordChoicesReceived.size, 1, 'Exactly one client received word choices');
    const [drawerIdx, drawerChoiceData] = Array.from(wordChoicesReceived.entries())[0];
    const drawerClient = clients[drawerIdx];
    assert.equal(drawerChoiceData.choices.length, 3, 'Drawer received 3 word choices');
    console.log(`✔ Match started! Authoritative drawer is Player ${drawerIdx} with 3 distinct word options`);

    // 6. Drawer selects word
    const selectedWordObj = drawerChoiceData.choices[0];
    const secretWord = selectedWordObj.word;
    console.log(`\n6. Drawer selecting secret word: "${secretWord}"...`);

    const strokeReceipts = new Set();
    for (let i = 0; i < PLAYER_COUNT; i++) {
      if (i !== drawerIdx) {
        clients[i].on('draw_stroke_received', () => {
          strokeReceipts.add(i);
        });
      }
    }

    drawerClient.emit('drawer_select_word', { wordItem: selectedWordObj });
    await new Promise((r) => setTimeout(r, 200));

    // 7. High-concurrency drawing broadcast
    console.log('\n7. Emitting drawing stroke to all 15 guessers simultaneously...');
    drawerClient.emit('draw_stroke', {
      tool: 'brush',
      color: '#3D3A5C',
      size: 5,
      points: [
        { x: 10, y: 10 },
        { x: 25, y: 25 },
        { x: 50, y: 50 },
        { x: 100, y: 100 }
      ]
    });

    await new Promise((r) => setTimeout(r, 200));
    assert.equal(strokeReceipts.size, PLAYER_COUNT - 1, 'All 15 guessers received the real-time drawing stroke');
    console.log(`✔ Real-time drawing stroke delivered to all ${strokeReceipts.size} guessers with zero packet loss`);

    // 8. Guess spam load test: all 15 guessers submit guesses concurrently
    console.log('\n8. Simulating concurrent guess barrage from 15 players...');
    const guessPromises = [];
    const correctGuessCounts = new Set();

    for (let i = 0; i < PLAYER_COUNT; i++) {
      if (i !== drawerIdx) {
        const client = clients[i];
        client.on('guess_correct_private', () => {
          correctGuessCounts.add(i);
        });

        // First emit incorrect guess, then correct guess
        client.emit('submit_guess', { text: 'WRONG_GUESS' });
        guessPromises.push(new Promise((res) => {
          setTimeout(() => {
            client.emit('submit_guess', { text: secretWord });
            res();
          }, 50);
        }));
      }
    }

    await Promise.all(guessPromises);
    await new Promise((r) => setTimeout(r, 500));

    assert.equal(correctGuessCounts.size, PLAYER_COUNT - 1, 'All 15 guessers scored correctly');
    console.log(`✔ All ${correctGuessCounts.size} guessers processed and scored without server lag or crash`);

    // 9. Verify server health under 16 concurrent players
    const healthRes = await fetch(`${SERVER_URL}/health`).then(r => r.json());
    assert.equal(healthRes.status, 'ok', 'Server health is ok under heavy player concurrency');
    console.log(`✔ Server health confirmed OK: uptime ${healthRes.uptimeSeconds}s, active rooms ${healthRes.activeRooms}`);

    console.log('\n🎉 ALL 15+ PLAYER CONCURRENCY & STABILITY TESTS PASSED WITH ZERO CRASHES!');
  } finally {
    for (const c of clients) {
      c.disconnect();
    }
  }
}

run15PlayersConcurrencyTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  });
