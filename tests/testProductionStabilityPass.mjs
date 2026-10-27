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

async function runProductionStabilityTests() {
  console.log('=== DRAWO TEST: PRODUCTION STABILITY & CANVAS AUDIT PASS ===\n');

  const host = createClient('user_stab_host');
  const guesser1 = createClient('user_stab_g1');
  const guesser2 = createClient('user_stab_g2');

  try {
    await Promise.all([
      new Promise(r => host.on('connect', r)),
      new Promise(r => guesser1.on('connect', r)),
      new Promise(r => guesser2.on('connect', r))
    ]);

    // 1. Create Private Room
    const createRes = await new Promise(res => {
      host.emit('create_private_room', {
        nickname: 'DrawerHost',
        avatarId: 0,
        rules: { rounds: 2, turnTime: 60 },
        sessionId: host.sessionId
      }, res);
    });
    const roomCode = createRes.roomCode;
    assert.ok(roomCode, 'Room code generated');
    console.log(`✔ Step 1: Created private room ${roomCode}`);

    // 2. Join 2 guessers
    await Promise.all([
      new Promise(res => guesser1.emit('join_room', { roomCode, nickname: 'Guesser1', avatarId: 1, sessionId: guesser1.sessionId }, res)),
      new Promise(res => guesser2.emit('join_room', { roomCode, nickname: 'Guesser2', avatarId: 2, sessionId: guesser2.sessionId }, res))
    ]);
    console.log('✔ Step 2: 2 guessers joined room successfully');

    // 3. Start Game (Register listener first)
    const wordPayloadPromise = new Promise(resolve => {
      host.on('drawer_choose_word', resolve);
    });
    host.emit('start_game');

    const wordPayload = await wordPayloadPromise;
    assert.ok(wordPayload.choices.length === 3, 'Drawer received 3 word choices');
    console.log('✔ Step 3: Game started, drawer received 3 word options');

    // Drawer chooses secret word
    const secretWord = wordPayload.choices[0].word;
    const drawingStatePromise = new Promise(resolve => {
      guesser1.on('room_state_updated', (data) => {
        if (data.gameState?.status === 'drawing') resolve();
      });
    });
    host.emit('drawer_select_word', { wordItem: wordPayload.choices[0] });

    await drawingStatePromise;
    console.log(`✔ Step 4: Status transitioned to 'drawing' with secret word: ${secretWord}`);

    // 4. Test Idempotency: return_to_lobby during drawing must be BLOCKED
    console.log('\nTesting Return to Lobby idempotency during active match...');
    guesser1.emit('return_to_lobby');
    await new Promise(r => setTimeout(r, 200));

    // Verify room is STILL in drawing status (not reset to lobby!)
    let checkState = null;
    await new Promise(res => {
      guesser1.emit('join_room', { roomCode, sessionId: guesser1.sessionId }, (data) => {
        checkState = data.roomState;
        res();
      });
    });
    assert.equal(checkState.gameState.status, 'drawing', 'return_to_lobby during active drawing was correctly blocked');
    console.log('✔ Step 5: return_to_lobby correctly ignored while match is in progress');

    // 5. Test Drawing Stroke Synchronization & History Buffer
    console.log('\nTesting Canvas Drawing, History Buffer & Undo Sync...');
    const strokeReceivedPromise = new Promise(resolve => {
      guesser1.on('draw_stroke_received', resolve);
    });

    const stroke1 = {
      tool: 'brush',
      color: '#3D3A5C',
      size: 7,
      points: [{ x: 100, y: 150 }, { x: 200, y: 250 }]
    };
    host.emit('draw_stroke', stroke1);

    const receivedStroke = await strokeReceivedPromise;
    assert.deepEqual(receivedStroke.points, stroke1.points, 'Guesser received exact stroke');
    console.log('✔ Step 6: Realtime stroke delivered to guesser');

    // Drawer draws a 2nd stroke
    const stroke2 = {
      tool: 'brush',
      color: '#E74C3C',
      size: 14,
      points: [{ x: 300, y: 350 }, { x: 400, y: 450 }]
    };
    host.emit('draw_stroke', stroke2);
    await new Promise(r => setTimeout(r, 100));

    // Test Undo Sync: Drawer emits undo_canvas
    const undoPromise = new Promise(resolve => {
      guesser1.on('undo_canvas_received', resolve);
    });
    host.emit('undo_canvas');

    await undoPromise;
    console.log('✔ Step 7: undo_canvas synchronized to guesser');

    // 6. Test Canvas History Replay for Reconnecting / Late Joining Client
    console.log('\nTesting Canvas History replay on reconnect...');
    const guesser3 = createClient('user_stab_late');
    await new Promise(r => guesser3.on('connect', r));

    const canvasHistoryPromise = new Promise(resolve => {
      guesser3.on('canvas_history', resolve);
    });

    await new Promise(res => {
      guesser3.emit('join_room', {
        roomCode,
        nickname: 'LateJoiner',
        avatarId: 3,
        sessionId: guesser3.sessionId
      }, res);
    });

    const canvasHistoryData = await canvasHistoryPromise;
    assert.ok(canvasHistoryData?.strokes?.length === 1, 'Late joiner received 1 active stroke (stroke 2 was undone)');
    console.log('✔ Step 8: Late joiner received authoritative canvas history replay (1 stroke after undo)');
    guesser3.disconnect();

    // 7. Test Secret Word Privacy & Post-Guess Spoiler Protection
    console.log('\nTesting Chat Spoiler Protection...');

    // A. Drawer attempts to type the secret word in chat
    const drawerWarningPromise = new Promise(resolve => {
      host.on('chat_event', (e) => {
        if (e.event === 'warning' && e.text.includes('drawer cannot reveal')) resolve(true);
      });
    });
    host.emit('submit_guess', { text: `The word is ${secretWord}` });
    const drawerWarned = await drawerWarningPromise;
    assert.equal(drawerWarned, true, 'Drawer was blocked from spoiling secret word in chat');
    console.log('✔ Step 9: Drawer prevented from leaking secret word in chat');

    // B. Guesser 1 guesses correctly
    const guessCorrectPromise = new Promise(resolve => {
      guesser1.on('guess_correct_private', resolve);
    });
    guesser1.emit('submit_guess', { text: secretWord });
    await guessCorrectPromise;
    console.log('✔ Step 10: Guesser 1 scored and marked isGuessed = true');

    // C. Guesser 1 (who already guessed) attempts to type the secret word
    let leakedToGuesser2 = false;
    guesser2.on('chat_message', (msg) => {
      if (msg.text.toLowerCase().includes(secretWord.toLowerCase())) leakedToGuesser2 = true;
    });

    const spoilerWarningPromise = new Promise(resolve => {
      guesser1.on('chat_event', (e) => {
        if (e.event === 'warning' && e.text.includes('Shh')) resolve(true);
      });
    });
    guesser1.emit('submit_guess', { text: `Guys it is ${secretWord} for sure!` });
    const spoilerWarned = await spoilerWarningPromise;
    await new Promise(r => setTimeout(r, 100));

    assert.equal(spoilerWarned, true, 'Post-guess spoiler warning issued to guesser 1');
    assert.equal(leakedToGuesser2, false, 'Secret word was NOT leaked to guesser 2 who has not yet guessed');
    console.log('✔ Step 11: Post-guess spoiler strictly blocked from leaking to other guessers');

    // D. Guesser 1 types a safe message
    const safeMessagePromise = new Promise(resolve => {
      guesser2.on('chat_message', (msg) => {
        if (msg.text === 'Good job drawer!') resolve(true);
      });
    });
    guesser1.emit('submit_guess', { text: 'Good job drawer!' });
    const safeReceived = await safeMessagePromise;
    assert.equal(safeReceived, true, 'Safe chat message from already-guessed player broadcasted');
    console.log('✔ Step 12: Safe chat from already-guessed player successfully broadcasted');

    console.log('\n🎉 ALL PRODUCTION STABILITY & CANVAS AUDIT TESTS PASSED WITH ZERO FAILURES!\n');
  } finally {
    host.disconnect();
    guesser1.disconnect();
    guesser2.disconnect();
  }
}

runProductionStabilityTests().catch(err => {
  console.error('❌ Production Stability Test Failed:', err);
  process.exit(1);
});
