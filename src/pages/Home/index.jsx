import React, { useState } from 'react';
import Logo from '../../components/Logo';
import ClayCard from '../../components/ClayCard';
import Avatar from '../../components/Avatar';
import PlayerSetupModal from './PlayerSetupModal';
import JoinRoomModal from './JoinRoomModal';
import SettingsModal from './SettingsModal';
import { useToast } from '../../components/Toast';
import styles from './Home.module.css';

export default function Home({
  currentUser,
  onSaveUser,
  onCreatePrivate,
  onJoinRoom
}) {
  const { addToast } = useToast();

  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'private' | 'join'

  const handleAction = (actionType) => {
    if (!currentUser || !currentUser.nickname) {
      setPendingAction(actionType);
      setSetupModalOpen(true);
      return;
    }
    executeAction(actionType);
  };

  const executeAction = (actionType) => {
    if (actionType === 'private') {
      addToast('Creating Private Lobby…', '🏠', 'info');
      if (onCreatePrivate) onCreatePrivate();
    } else if (actionType === 'join') {
      setJoinModalOpen(true);
    }
  };

  const handleSaveIdentity = (identity) => {
    onSaveUser(identity);
    addToast(`Welcome, ${identity.nickname}! ✨`, '🎉', 'info');

    if (pendingAction) {
      const act = pendingAction;
      setPendingAction(null);
      executeAction(act);
    }
  };

  const handleJoinSuccess = (roomCode, initialRoomState = null) => {
    addToast(`Joined room ${roomCode}! 🔑`, '🎉', 'info');
    if (onJoinRoom) onJoinRoom(roomCode, initialRoomState);
  };

  return (
    <div className={styles.homeContainer}>
      {/* Background Decorative Cloud Doodles */}
      <div className={styles.cloud1} aria-hidden="true">☁️</div>
      <div className={styles.cloud2} aria-hidden="true">☁️</div>
      <div className={styles.sparkle1} aria-hidden="true">✨</div>
      <div className={styles.sparkle2} aria-hidden="true">⭐</div>

      {/* Top Utility Header */}
      <header className={styles.topBar}>
        {currentUser ? (
          <button
            type="button"
            className={styles.profileBadge}
            onClick={() => setSetupModalOpen(true)}
            title="Edit profile & avatar"
          >
            <Avatar avatarId={currentUser.avatarId} size="xs" shape="circle" />
            <span className={styles.profileName}>{currentUser.nickname}</span>
            <span className={styles.editPencil}>✏️</span>
          </button>
        ) : (
          <button
            type="button"
            className={styles.setupBtn}
            onClick={() => setSetupModalOpen(true)}
          >
            <span>👤</span>
            <span>Pick Profile</span>
          </button>
        )}

        <button
          type="button"
          className={styles.settingsGear}
          onClick={() => setSettingsModalOpen(true)}
          aria-label="Game Settings"
          title="Game Settings"
        >
          ⚙️
        </button>
      </header>

      {/* Central Content Column */}
      <main className={styles.centerColumn}>
        {/* Large Logo */}
        <div className={styles.logoBox}>
          <Logo size="lg" showTagline={true} />
        </div>

        {/* Hero Character Illustration Scene */}
        <div className={styles.heroScene}>
          <div className={styles.heroAvatarWrap}>
            <img
              src="/assets/mascot_home.png"
              alt="Drawo Mascot"
              className={styles.heroAvatarImg}
            />
          </div>
          <div className={styles.sloganBanner}>
            Same People • New Drawings • Bigger Laughs! ♡
          </div>
        </div>

        {/* Action Panel Clay Card */}
        <div className={styles.cardWrapper}>
          <ClayCard variant="cream" className={styles.actionPanel}>
            {/* CREATE PRIVATE ROOM */}
            <button
              type="button"
              className={`${styles.actionButton} ${styles.primaryBtn}`}
              onClick={() => handleAction('private')}
            >
              <div className={styles.iconCircle}>
                <span className={styles.iconPlus}>+</span>
              </div>
              <div className={styles.btnTextGroup}>
                <span className={styles.btnTitle}>Create Private Room</span>
                <span className={styles.btnSub}>Play with friends (2 - 15 players)</span>
              </div>
            </button>

            {/* JOIN A ROOM */}
            <button
              type="button"
              className={`${styles.actionButton} ${styles.secondaryBtn}`}
              onClick={() => handleAction('join')}
            >
              <div className={`${styles.iconCircle} ${styles.secondaryIconCircle}`}>
                <span className={styles.iconArrow}>→</span>
              </div>
              <div className={styles.btnTextGroup}>
                <span className={styles.btnTitle}>Join a Room</span>
                <span className={styles.btnSub}>Enter a 5-digit room code</span>
              </div>
            </button>
          </ClayCard>
        </div>
      </main>

      {/* Modals */}
      <PlayerSetupModal
        isOpen={setupModalOpen}
        onClose={() => {
          setSetupModalOpen(false);
          setPendingAction(null);
        }}
        onSaveIdentity={handleSaveIdentity}
        initialIdentity={currentUser}
      />

      <JoinRoomModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        currentUser={currentUser}
        onJoinSuccess={handleJoinSuccess}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}
