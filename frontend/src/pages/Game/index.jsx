import React, { useState, useEffect, useRef } from 'react';
import DrawerWordSelect from './DrawerWordSelect';
import GuesserWaiting from './GuesserWaiting';
import DrawerGameplay from './DrawerGameplay';
import GuesserGameplay from './GuesserGameplay';
import WordRevealScreen from './WordRevealScreen';
import TurnResultsScreen from './TurnResultsScreen';
import LeaveModal from '../../components/LeaveModal';
import { socketService } from '../../services/socket';
import { useToast } from '../../components/Toast';
import { isCurrentDrawer } from '../../utils/gameHelpers';
import styles from './Game.module.css';

export default function GamePage({
  currentUser,
  initialRoomState = null,
  onBackToHome,
  onGameOver
}) {
  const { addToast } = useToast();
  const socketId = socketService.getSocketId();
  const sessionId = socketService.getSessionId();

  // Full Room State from Socket or initial seed
  const [roomState, setRoomState] = useState(() => initialRoomState || socketService.getRoomState() || null);
  const [wordChoices, setWordChoices] = useState(() => socketService.getWordChoices()?.choices || []);
  const [timerSeconds, setTimerSeconds] = useState(() => roomState?.gameState?.timerSeconds || 20);
  const [messages, setMessages] = useState([]);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  const lastWordChoicePromptRef = useRef(null);

  useEffect(() => {
    // 1. Room State Updates
    const unsubRoom = socketService.onRoomStateUpdated((data) => {
      setRoomState(data);
      if (data?.gameState?.wordChoices && data.gameState.wordChoices.length > 0) {
        setWordChoices(data.gameState.wordChoices);
      }
      if (data?.gameState?.timerSeconds !== undefined) {
        setTimerSeconds(data.gameState.timerSeconds);
      }
      if (data?.gameState?.status && data.gameState.status !== 'word_selecting') {
        lastWordChoicePromptRef.current = null;
      }
      if (data?.gameState?.status === 'game_over') {
        onGameOverRef.current?.(data);
      }
    });

    // 2. Secret Word Choices for Drawer (Sent ONLY to active drawer's socket)
    const unsubChoices = socketService.onDrawerChooseWord(({ choices, timeoutSeconds }) => {
      setWordChoices(choices);
      setTimerSeconds(timeoutSeconds || 20);

      // Single-notification guard per word-selection phase
      const choiceKey = Array.isArray(choices)
        ? choices.map((c) => (c && typeof c === 'object' ? c.word : String(c))).join('|')
        : null;

      if (choiceKey && lastWordChoicePromptRef.current !== choiceKey) {
        lastWordChoicePromptRef.current = choiceKey;
        addToast('🎨 Your turn to draw! Pick a word choice.', '✨', 'info');
      }
    });

    // 3. Timer Ticks
    const unsubTimer = socketService.onTimerTick(({ seconds }) => {
      setTimerSeconds(seconds);
    });

    // 4. Chat Messages & Events
    const unsubChat = socketService.onChatMessage((msg) => {
      setMessages((prev) => [...prev, { ...msg, isYou: msg.senderId === socketId || msg.senderId === sessionId }]);
    });

    const unsubChatEvent = socketService.onChatEvent((eventMsg) => {
      setMessages((prev) => [...prev, eventMsg]);
      if (eventMsg.event === 'leave') {
        addToast(eventMsg.text, '👋', 'info');
      } else if (eventMsg.event === 'correct' || eventMsg.isCorrect) {
        addToast(eventMsg.text, '🟢', 'success');
      }
    });

    // 5. Private Correct Guess Event (Only to this client)
    const unsubPrivateGuess = socketService.onGuessCorrectPrivate(({ points, message }) => {
      addToast(message || `🎉 You've guessed the word! (+${points} pts)`, '🏆', 'success');
    });

    return () => {
      unsubRoom();
      unsubChoices();
      unsubTimer();
      unsubChat();
      unsubChatEvent();
      unsubPrivateGuess();
    };
  }, [socketId, sessionId, addToast]);

  // Immediate transition to Game Over when game ends
  useEffect(() => {
    if (roomState?.gameState?.status === 'game_over') {
      onGameOverRef.current?.(roomState);
    }
  }, [roomState]);

  // Derived state from server
  const gameState = roomState?.gameState || {
    status: 'word_selecting',
    currentRound: 1,
    totalRounds: 5,
    currentDrawerId: null,
    currentWord: null,
    wordPattern: '_ _ _ _ _ _ _ _',
    isFinalTurn: false
  };

  const players = roomState?.players || [];

  // Robust drawer check using centralized helper
  const isDrawer = isCurrentDrawer(gameState, currentUser?.id, socketId, sessionId);

  const drawerPlayer = players.find((p) => p.id === gameState.currentDrawerId) || {
    nickname: 'Player',
    avatarId: 1
  };

  const effectiveWordChoices = (wordChoices && wordChoices.length > 0)
    ? wordChoices
    : (gameState.wordChoices && gameState.wordChoices.length > 0 ? gameState.wordChoices : []);

  // Handlers
  const handleSelectWord = (wordItem) => {
    socketService.drawerSelectWord(wordItem);
  };

  const handleSendMessage = (text) => {
    socketService.submitGuess(text);
  };

  const hasLeftRef = React.useRef(false);
  const handleLeaveGame = () => {
    if (hasLeftRef.current) return;
    hasLeftRef.current = true;
    socketService.leaveRoom();
    if (onBackToHome) onBackToHome();
  };

  const turnStage = gameState.status;

  return (
    <div className={styles.gameContainer}>
      {/* RENDER GAME STAGES */}

      {/* STAGE 1: WORD SELECTING */}
      {turnStage === 'word_selecting' && isDrawer && (
        <DrawerWordSelect
          currentRound={gameState.currentRound}
          totalRounds={gameState.totalRounds}
          choices={effectiveWordChoices}
          timerSeconds={timerSeconds}
          onSelectWord={handleSelectWord}
          onLeaveGame={() => setLeaveModalOpen(true)}
        />
      )}

      {turnStage === 'word_selecting' && !isDrawer && (
        <GuesserWaiting
          currentRound={gameState.currentRound}
          totalRounds={gameState.totalRounds}
          drawer={{ id: drawerPlayer.id, nickname: drawerPlayer.nickname, name: drawerPlayer.nickname, avatarId: drawerPlayer.avatarId }}
          timerSeconds={timerSeconds}
          onLeaveGame={() => setLeaveModalOpen(true)}
        />
      )}

      {/* STAGE 2: ACTIVE DRAWING / GUESSING */}
      {turnStage === 'drawing' && isDrawer && (
        <DrawerGameplay
          currentRound={gameState.currentRound}
          totalRounds={gameState.totalRounds}
          secretWord={gameState.currentWord || 'ELEPHANT'}
          wordCategory={gameState.currentWordCategory || 'Animals'}
          players={players}
          messages={messages}
          timerSeconds={timerSeconds}
          currentUserId={socketId}
          onLeaveGame={() => setLeaveModalOpen(true)}
        />
      )}

      {turnStage === 'drawing' && !isDrawer && (
        <GuesserGameplay
          currentRound={gameState.currentRound}
          totalRounds={gameState.totalRounds}
          drawerName={drawerPlayer.nickname}
          secretWord={gameState.currentWord || ''}
          wordPattern={gameState.wordPattern || '_ _ _ _ _ _ _ _'}
          revealedCount={gameState.revealedLetters || 0}
          initialPlayers={players}
          initialMessages={messages}
          timerSeconds={timerSeconds}
          currentUserId={socketId}
          onSendMessage={handleSendMessage}
          onLeaveGame={() => setLeaveModalOpen(true)}
        />
      )}

      {/* STAGE 3: WORD REVEAL */}
      {turnStage === 'word_reveal' && (
        <WordRevealScreen
          scenario={gameState.turnEndReason || 'all_guessed'}
          word={gameState.currentWord || 'ELEPHANT'}
          emoji="🎨"
          category={gameState.currentWordCategory || 'Animals'}
        />
      )}

      {/* STAGE 4: TURN RESULTS */}
      {turnStage === 'turn_results' && (
        <TurnResultsScreen
          results={{
            word: gameState.currentWord || 'ELEPHANT',
            players: players
          }}
          currentUserId={socketId}
          isFinalTurn={Boolean(gameState.isFinalTurn)}
        />
      )}

      {/* STAGE 5: GAME OVER */}
      {turnStage === 'game_over' && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>🏆 GAME OVER</h2>
          <p>Redirecting to Final Results Spotlight…</p>
        </div>
      )}

      {/* Shared Authoritative Leave Modal */}
      <LeaveModal
        isOpen={leaveModalOpen}
        onStay={() => setLeaveModalOpen(false)}
        onClose={() => setLeaveModalOpen(false)}
        onLeave={() => {
          setLeaveModalOpen(false);
          handleLeaveGame();
        }}
      />
    </div>
  );
}
