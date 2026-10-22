import React, { useState, useRef } from 'react';
import Logo from '../../components/Logo';
import RoundIndicator from '../../components/RoundIndicator';
import Timer from '../../components/Timer';
import TurnStatus from '../../components/TurnStatus';
import Canvas from '../../components/Canvas';
import DrawingToolbar from '../../components/DrawingToolbar';
import Chat from '../../components/Chat';
import Leaderboard from '../../components/Leaderboard';
import LeaveModal from '../../components/LeaveModal';
import { socketService } from '../../services/socket';
import { useToast } from '../../components/Toast';
import styles from './DrawerGameplay.module.css';

export default function DrawerGameplay({
  currentRound = 1,
  totalRounds = 3,
  secretWord = 'ELEPHANT',
  wordCategory = 'Animals',
  players = [],
  messages = [],
  timerSeconds = 60,
  currentUserId,
  onLeaveGame,
  onTurnExpire
}) {
  const { addToast } = useToast();

  const [activeTool, setActiveTool] = useState('brush');
  const [activeColor, setActiveColor] = useState('#3D3A5C');
  const [activeSize, setActiveSize] = useState(8);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const canvasRef = useRef(null);

  const handleClearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
      socketService.clearCanvas();
      addToast('Canvas cleared! 🗑️', '✨', 'info');
    }
  };

  const handleUndoCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.undo();
    }
  };

  const handleDrawStroke = (strokeData) => {
    socketService.drawStroke(strokeData);
  };

  return (
    <div className={styles.gameplayPage}>
      {/* Top Header Bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Logo size="sm" showTagline={false} />
          <RoundIndicator currentRound={currentRound} totalRounds={totalRounds} />
        </div>

        <div className={styles.topBarCenter}>
          <TurnStatus
            role="drawer"
            secretWord={secretWord}
            wordCategory={wordCategory}
          />
        </div>

        <div className={styles.topBarRight}>
          <Timer
            seconds={timerSeconds}
            urgentThreshold={10}
            onExpire={() => {
              addToast('Turn timer expired! ⏰', '⚠️', 'warning');
              if (onTurnExpire) onTurnExpire();
            }}
          />
          <button
            className={styles.leaveBtn}
            onClick={() => setLeaveModalOpen(true)}
            title="Leave game"
          >
            🚪
          </button>
        </div>
      </header>

      {/* Main 3-Column Grid */}
      <main className={styles.gameGrid}>
        {/* Left Column: Live Leaderboard */}
        <aside className={styles.leftCol}>
          <Leaderboard
            players={players}
            currentUserId={currentUserId}
            showDrawer={false}
            title="Standings"
          />
        </aside>

        {/* Center Column: Interactive Canvas & Toolbar */}
        <section className={styles.centerCol}>
          <div className={styles.canvasWrapper}>
            <Canvas
              ref={canvasRef}
              interactive={true}
              tool={activeTool}
              color={activeColor}
              size={activeSize}
              onDrawStroke={handleDrawStroke}
            />
          </div>

          <div className={styles.toolbarWrapper}>
            <DrawingToolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              activeColor={activeColor}
              onColorChange={setActiveColor}
              activeSize={activeSize}
              onSizeChange={setActiveSize}
              onUndo={handleUndoCanvas}
              onClear={handleClearCanvas}
            />
          </div>
        </section>

        {/* Right Column: Chat Panel */}
        <aside className={styles.rightCol}>
          <Chat
            messages={messages}
            role="drawer"
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
