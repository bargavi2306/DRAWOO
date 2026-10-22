import { io } from 'socket.io-client';

function getSocketUrl() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin;
  }
  return 'http://localhost:4000';
}

const SOCKET_URL = getSocketUrl();

class SocketService {
  constructor() {
    this.socket = null;
    this.currentRoomState = null;
    this.currentWordChoices = null;
  }

  getSessionId() {
    try {
      let sid = sessionStorage.getItem('drawo_session_id');
      if (!sid) {
        sid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem('drawo_session_id', sid);
      }
      return sid;
    } catch {
      return 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    }
  }

  init() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('[SocketClient] Connected with ID:', this.socket.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[SocketClient] Disconnected:', reason);
      });

      // Maintain latest room state and word choices in memory
      this.socket.on('room_state_updated', (data) => {
        this.currentRoomState = data;
        if (data?.gameState?.wordChoices && data.gameState.wordChoices.length > 0) {
          this.currentWordChoices = {
            choices: data.gameState.wordChoices,
            timeoutSeconds: data.gameState.timerSeconds || 20
          };
        } else if (data?.gameState?.status !== 'word_selecting') {
          this.currentWordChoices = null;
        }
      });

      this.socket.on('drawer_choose_word', (payload) => {
        this.currentWordChoices = payload;
      });
    }

    if (!this.socket.connected) {
      this.socket.connect();
    }
    return this.socket;
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  getRoomState() {
    return this.currentRoomState;
  }

  getWordChoices() {
    return this.currentWordChoices;
  }

  createPrivateRoom(nickname, avatarId, rules = {}, sessionId = null) {
    this.init();
    const sid = sessionId || this.getSessionId();
    return new Promise((resolve) => {
      this.socket.emit('create_private_room', { nickname, avatarId, rules, sessionId: sid }, (res) => {
        if (res && res.roomState) {
          this.currentRoomState = res.roomState;
        }
        resolve(res);
      });
    });
  }

  joinPrivateRoom(roomCode, nickname, avatarId, sessionId = null) {
    this.init();
    const sid = sessionId || this.getSessionId();
    return new Promise((resolve) => {
      this.socket.emit('join_room', { roomCode, nickname, avatarId, sessionId: sid }, (res) => {
        if (res && res.roomState) {
          this.currentRoomState = res.roomState;
        }
        resolve(res);
      });
    });
  }

  reconnectRoom(roomCode, playerId) {
    this.init();
    return new Promise((resolve) => {
      this.socket.emit('reconnect_room', { roomCode, playerId }, (res) => {
        if (res && res.roomState) {
          this.currentRoomState = res.roomState;
        }
        resolve(res);
      });
    });
  }

  updateRules(rules) {
    if (this.socket) {
      this.socket.emit('update_rules', { rules });
    }
  }

  startGame() {
    if (this.socket) {
      this.socket.emit('start_game');
    }
  }

  drawerSelectWord(wordItem) {
    if (this.socket) {
      this.socket.emit('drawer_select_word', { wordItem });
    }
  }

  drawStroke(strokeData) {
    if (this.socket) {
      this.socket.emit('draw_stroke', strokeData);
    }
  }

  clearCanvas() {
    if (this.socket) {
      this.socket.emit('clear_canvas');
    }
  }

  submitGuess(text) {
    if (this.socket) {
      this.socket.emit('submit_guess', { text });
    }
  }

  leaveRoom() {
    this.currentRoomState = null;
    this.currentWordChoices = null;
    if (this.socket) {
      this.socket.emit('leave_room');
    }
  }

  // Event Subscriptions with cleanup functions and instant cache replay
  onRoomStateUpdated(callback) {
    if (!this.socket) this.init();
    this.socket.on('room_state_updated', callback);
    if (this.currentRoomState) {
      callback(this.currentRoomState);
    }
    return () => {
      if (this.socket) this.socket.off('room_state_updated', callback);
    };
  }

  onDrawerChooseWord(callback) {
    if (!this.socket) this.init();
    this.socket.on('drawer_choose_word', callback);
    if (this.currentWordChoices) {
      callback(this.currentWordChoices);
    }
    return () => {
      if (this.socket) this.socket.off('drawer_choose_word', callback);
    };
  }

  onGuessCorrectPrivate(callback) {
    if (!this.socket) this.init();
    this.socket.on('guess_correct_private', callback);
    return () => {
      if (this.socket) this.socket.off('guess_correct_private', callback);
    };
  }

  onDrawStrokeReceived(callback) {
    if (!this.socket) this.init();
    this.socket.on('draw_stroke_received', callback);
    return () => {
      if (this.socket) this.socket.off('draw_stroke_received', callback);
    };
  }

  onClearCanvasReceived(callback) {
    if (!this.socket) this.init();
    this.socket.on('clear_canvas_received', callback);
    return () => {
      if (this.socket) this.socket.off('clear_canvas_received', callback);
    };
  }

  onChatMessage(callback) {
    if (!this.socket) this.init();
    this.socket.on('chat_message', callback);
    return () => {
      if (this.socket) this.socket.off('chat_message', callback);
    };
  }

  onChatEvent(callback) {
    if (!this.socket) this.init();
    this.socket.on('chat_event', callback);
    return () => {
      if (this.socket) this.socket.off('chat_event', callback);
    };
  }

  onTimerTick(callback) {
    if (!this.socket) this.init();
    this.socket.on('timer_tick', callback);
    return () => {
      if (this.socket) this.socket.off('timer_tick', callback);
    };
  }

  onHintRevealed(callback) {
    if (!this.socket) this.init();
    this.socket.on('hint_revealed', callback);
    return () => {
      if (this.socket) this.socket.off('hint_revealed', callback);
    };
  }
}

export const socketService = new SocketService();
