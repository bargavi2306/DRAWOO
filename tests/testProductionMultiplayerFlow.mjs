import { io } from 'socket.io-client';
import assert from 'node:assert/strict';

const BACKEND_URL = 'https://drawoo.onrender.com';

async function testFullMultiplayerFlow() {
  console.log('=== DRAWO: PRODUCTION MULTIPLAYER FLOW VERIFICATION ===');
  console.log(`Backend URL: ${BACKEND_URL}`);

  const hostSession = 'usr_device1_' + Date.now();
  const friendSession = 'usr_device2_' + Date.now();

  const host = io(BACKEND_URL, { transports: ['websocket', 'polling'], forceNew: true });
  const friend = io(BACKEND_URL, { transports: ['websocket', 'polling'], forceNew: true });

  try {
    // 1. Both devices connect
    await Promise.all([
      new Promise((res, rej) => { host.on('connect', res); host.on('connect_error', rej); }),
      new Promise((res, rej) => { friend.on('connect', res); friend.on('connect_error', rej); })
    ]);
    console.log(`✔ Step 1: Both devices connected (Host: ${host.id}, Friend: ${friend.id})`);

    // 2. Host creates private room
    const createRes = await new Promise((res) => {
      host.emit('create_private_room', {
        nickname: 'AliceHost',
        avatarId: 2,
        rules: { rounds: 2, turnTime: 45 },
        sessionId: hostSession
      }, res);
    });

    assert.ok(createRes.success, 'Host room creation succeeded');
    const roomCode = createRes.roomCode;
    console.log(`✔ Step 2: Room created with code "${roomCode}"`);

    // 3. Friend joins room using the room code
    const joinRes = await new Promise((res) => {
      friend.emit('join_room', {
        roomCode,
        nickname: 'BobFriend',
        avatarId: 5,
        sessionId: friendSession
      }, res);
    });

    assert.ok(joinRes.success, 'Friend join succeeded');
    console.log(`✔ Step 3: Friend successfully joined room "${roomCode}"`);

    // Track active room state on both
    let latestRoomState = null;
    host.on('room_state_updated', (data) => { latestRoomState = data; });
    friend.on('room_state_updated', (data) => { latestRoomState = data; });

    // 4. Host starts the game
    const wordChoicesPromise = new Promise((res) => {
      host.on('drawer_choose_word', res);
    });

    host.emit('start_game');
    const wordChoices = await wordChoicesPromise;
    assert.ok(wordChoices.choices.length === 3, 'Drawer received 3 word choices');
    console.log(`✔ Step 4: Match started! Word choices: ${wordChoices.choices.map(c => c.word).join(', ')}`);

    // 5. Drawer selects first word
    const chosenWord = wordChoices.choices[0];
    const drawingPhasePromise = new Promise((res) => {
      const checkStatus = (data) => {
        if (data?.gameState?.status === 'drawing') {
          host.off('room_state_updated', checkStatus);
          friend.off('room_state_updated', checkStatus);
          res(data);
        }
      };
      host.on('room_state_updated', checkStatus);
      friend.on('room_state_updated', checkStatus);
    });

    host.emit('drawer_select_word', { wordItem: chosenWord });
    const drawingState = await drawingPhasePromise;
    console.log(`✔ Step 5: Status is "drawing" (Secret word masked for guessers: ${drawingState.gameState.wordPattern})`);

    // 6. Drawer draws a stroke
    const strokeReceivedPromise = new Promise((res) => {
      friend.on('draw_stroke_received', res);
    });

    host.emit('draw_stroke', {
      tool: 'pen',
      color: '#FF5733',
      size: 4,
      points: [{ x: 10, y: 10 }, { x: 20, y: 20 }]
    });

    const receivedStroke = await strokeReceivedPromise;
    assert.equal(receivedStroke.color, '#FF5733', 'Guesser received stroke in real-time');
    console.log('✔ Step 6: Real-time drawing stroke delivered across devices');

    // 7. Guesser submits correct guess
    const correctGuessPromise = new Promise((res) => {
      friend.on('guess_correct_private', res);
    });

    friend.emit('submit_guess', { text: chosenWord.word });
    const correctRes = await correctGuessPromise;
    assert.ok(correctRes.points > 0, 'Guesser earned points');
    console.log(`✔ Step 7: Guesser guessed "${chosenWord.word}" and earned ${correctRes.points} points`);

    // Clean up
    host.disconnect();
    friend.disconnect();
    console.log('\n🎉 ALL PRODUCTION MULTIPLAYER VERIFICATION STEPS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    host.disconnect();
    friend.disconnect();
    process.exit(1);
  }
}

testFullMultiplayerFlow();
