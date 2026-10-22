import React, { useState, useEffect, useRef } from 'react';
import Logo from '../../components/Logo';
import RoundIndicator from '../../components/RoundIndicator';
import Timer from '../../components/Timer';
import TurnStatus from '../../components/TurnStatus';
import WordDisplay from '../../components/WordDisplay';
import Canvas from '../../components/Canvas';
import Chat from '../../components/Chat';
import Leaderboard from '../../components/Leaderboard';
import LeaveModal from '../../components/LeaveModal';
import { socketService } from '../../services/socket';
import { useToast } from '../../components/Toast';
import styles from './GuesserGameplay.module.css';

export default function GuesserGameplay({
  currentRound = 1,
  totalRounds = 3,
  drawerName = 'Kavin',
  secretWord = 'ELEPHANT',
  wordPattern = 'E _ E _ _ _ _ _',
  revealedCount = 0,
  initialPlayers = [],
  initialMessages = [],
  timerSeconds = 60,
  currentUserId,
  onSendMessage,
  onLeaveGame
}) {
  const { addToast } = useToast();
  const canvasRef = useRef(null);

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  // Subscribe to remote socket drawing strokes & clear commands
  useEffect(() => {
    const unsubStroke = socketService.onDrawStrokeReceived((strokeData) => {
      if (canvasRef.current && canvasRef.current.drawRemoteStroke) {
        canvasRef.current.drawRemoteStroke(strokeData);
      }
    });

    const unsubClear = socketService.onClearCanvasReceived(() => {
      if (canvasRef.current && canvasRef.current.clear) {
        canvasRef.current.clear();
      }
    });

    return () => {
      unsubStroke();
      unsubClear();
    };
  }, []);

  const sessionId = socketService.getSessionId();
  const socketId = socketService.getSocketId();
  const me = initialPlayers.find(p => p.id === currentUserId || p.id === sessionId || p.socketId === socketId || p.isYou);
  const isGuessed = Boolean(me?.isGuessed);

  return (
    <div className={styles.gameplayPage}>
      {/* Top Header Bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Logo size="sm" showTagline={false} />
          <RoundIndicator currentRound={currentRound} totalRounds={totalRounds} />
        </div>

        <div className={styles.topBarCenter}>
          <TurnStatus role="guesser" drawerName={drawerName} />
        </div>

        <div className={styles.topBarRight}>
          <Timer seconds={timerSeconds} urgentThreshold={10} />
          <button
            className={styles.leaveBtn}
            onClick={() => setLeaveModalOpen(true)}
            title="Leave game"
          >
            🚪
          </button>
        </div>
      </header>

      {/* Secret Word Blanks Header */}
      <div className={styles.wordHeaderSection}>
        <WordDisplay
          wordPattern={wordPattern}
          secretWord={secretWord}
          revealedCount={revealedCount}
        />
      </div>

      {/* Main 3-Column Grid */}
      <main className={styles.gameGrid}>
        {/* Left Column: Live Leaderboard */}
        <aside className={styles.leftCol}>
          <Leaderboard
            players={initialPlayers}
            currentUserId={currentUserId}
            showDrawer={true}
            title="Standings"
          />
        </aside>

        {/* Center Column: Read-Only Canvas */}
        <section className={styles.centerCol}>
          <div className={styles.canvasWrapper}>
            <Canvas ref={canvasRef} interactive={false} />
          </div>
        </section>

        {/* Right Column: Chat Panel + Guess Input */}
        <aside className={styles.rightCol}>
          <Chat
            messages={initialMessages}
            role="guesser"
            isGuessed={isGuessed}
            onSendMessage={onSendMessage}
            currentUserId={currentUserId}
          />
        </aside>
      </main>

      {/* Leave Confirmation Modal */}
      <LeaveModal
        isOpen={leaveModalOpen}
        onStay={() => setLeaveModalOpen(false)}
        onLeave={() => {
          setLeaveModalOpen(false);
          if (onLeaveGame) onLeaveGame();
        }}
      />
    </div>
  );
}
