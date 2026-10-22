import React, { useState, useEffect } from 'react';
import Logo from '../../components/Logo';
import ClayCard from '../../components/ClayCard';
import PlayerGrid from '../../components/PlayerGrid';
import GameRules from '../../components/GameRules';
import EditRulesModal from './EditRulesModal';
import { socketService } from '../../services/socket';
import { useToast } from '../../components/Toast';
import styles from './PrivateLobby.module.css';

export default function PrivateLobby({
  roomCode = 'AB7KQ',
  currentUser,
  initialData = null,
  onBackToHome,
  onStartGame
}) {
  const { addToast } = useToast();
  const socketId = socketService.getSocketId();
  const sessionId = socketService.getSessionId();

  // Room state from initial props, cached socket service, or subscription
  const [roomData, setRoomData] = useState(() => initialData || socketService.getRoomState() || null);
  const [editRulesOpen, setEditRulesOpen] = useState(false);

  useEffect(() => {
    const unsub = socketService.onRoomStateUpdated((data) => {
      setRoomData(data);

      // If game has started on server, transition to gameplay
      if (data.gameState && data.gameState.status !== 'lobby') {
        if (onStartGame) onStartGame();
      }
    });

    const unsubChat = socketService.onChatEvent((eventMsg) => {
      if (eventMsg.event === 'leave') {
        addToast(eventMsg.text, '🚪', 'info');
      } else if (eventMsg.event === 'join') {
        addToast(eventMsg.text, '👋', 'info');
      }
    });

    return () => {
      unsub();
      unsubChat();
    };
  }, [onStartGame, addToast]);

  const rules = roomData?.rules || {
    rounds: 5,
    turnTime: 90,
    maxCapacity: 8,
    language: 'English',
    customWords: false,
    hints: true,
    midGameJoin: true,
    customWordsList: ['Dinosaur', 'Pizza', 'Spacecraft']
  };

  const players = (roomData?.players && roomData.players.length > 0)
    ? roomData.players
    : [
        {
          id: currentUser?.id || sessionId || socketId || 'p1',
          nickname: currentUser?.nickname || 'Player',
          avatarId: currentUser?.avatarId ?? 0,
          score: 0,
          isHost: false
        }
      ];

  const hostId = roomData?.hostId;
  const isHost = Boolean(
    hostId && (
      hostId === socketId ||
      hostId === sessionId ||
      (currentUser?.id && hostId === currentUser.id)
    )
  );

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(roomCode);
    addToast(`Room code ${roomCode} copied! 📋`, '✨', 'info');
  };

  const handleSaveRules = (updatedRules) => {
    socketService.updateRules(updatedRules);
    addToast('Lobby rules updated!', '✨', 'info');
  };

  const handleStartGameClick = () => {
    if (players.length < 2) {
      addToast('Need at least 2 players to start.', '⚠️', 'warning');
      return;
    }
    socketService.startGame();
    addToast('Starting Game… 🎨', '🚀', 'info');
  };

  const hasLeftRef = React.useRef(false);
  const handleLeave = () => {
    if (hasLeftRef.current) return;
    hasLeftRef.current = true;
    socketService.leaveRoom();
    onBackToHome();
  };

  return (
    <div className={styles.lobbyContainer}>
      {/* Top Navigation & Header */}
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={handleLeave}
          title="Leave room and return home"
        >
          <span className={styles.backArrow}>‹</span>
        </button>

        <div className={styles.centerLogo}>
          <Logo size="sm" showTagline={false} />
        </div>

        {/* Room Code Badge */}
        <div className={styles.roomCodeBadge}>
          <span className={styles.codeLabel}>Room:</span>
          <span className={styles.codeText}>{roomCode}</span>
          <button
            type="button"
            className={styles.copyBtn}
            onClick={handleCopyCode}
            title="Copy room code"
          >
            Copy
          </button>
        </div>
      </header>

      {/* Main Lobby Layout */}
      <main className={styles.mainContent}>
        <div className={styles.gridColumns}>
          {/* Left Column: Player Grid & Start Action */}
          <div className={styles.playerColumn}>
            <ClayCard variant="cream" className={styles.playersCard}>
              <PlayerGrid
                players={players.map(p => ({ ...p, name: p.nickname || p.name }))}
                maxCapacity={rules.maxCapacity}
                currentUserId={currentUser?.id || sessionId || socketId}
                onEmptySlotClick={() => addToast(`Share room code ${roomCode} to invite friends!`, '🔑', 'info')}
              />

              {/* Start Game Button at Bottom of Lobby Card */}
              <div className={styles.startArea}>
                {isHost ? (
                  <>
                    <button
                      type="button"
                      className={styles.startGameBtn}
                      onClick={handleStartGameClick}
                      disabled={players.length < 2}
                    >
                      Start Game
                    </button>
                    {players.length < 2 && (
                      <span className={styles.startNotice}>
                        Waiting for at least 2 players to start
                      </span>
                    )}
                  </>
                ) : (
                  <div className={styles.waitingNotice}>
                    ⏳ Waiting for host to start the game…
                  </div>
                )}
              </div>
            </ClayCard>
          </div>

          {/* Right Column: Game Rules Summary */}
          <div className={styles.rulesColumn}>
            <GameRules
              rules={rules}
              isHost={isHost}
              onEditRules={() => setEditRulesOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Edit Rules Modal */}
      <EditRulesModal
        isOpen={editRulesOpen}
        onClose={() => setEditRulesOpen(false)}
        initialRules={rules}
        onSaveRules={handleSaveRules}
      />
    </div>
  );
}
