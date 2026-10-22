import React, { useState } from 'react';
import Home from '../pages/Home';
import PrivateLobby from '../pages/PrivateLobby';
import GamePage from '../pages/Game';
import GameOverPage from '../pages/GameOver';
import Logo from '../components/Logo';
import ClayButton from '../components/ClayButton';
import ClayInput from '../components/ClayInput';
import Modal from '../components/Modal';
import Avatar, { AVATAR_LIST } from '../components/Avatar';
import PlayerGrid from '../components/PlayerGrid';
import Canvas from '../components/Canvas';
import DrawingToolbar from '../components/DrawingToolbar';
import { useToast } from '../components/Toast';
import { MOCK_PLAYERS, MOCK_RULES } from '../mocks/ui01.mock';
import styles from './DevPreviewShell.module.css';

/**
 * DevPreviewShell — Detached development workbench & prototype toolbar
 * Only mounted when '?dev=true' is present in URL.
 */
export default function DevPreviewShell({
  currentUser,
  onSaveUser,
  activeRoomCode,
  finalRoomData
}) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('home');
  const [viewportMode, setViewportMode] = useState('fluid');

  // Interactive showcase state
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState(false);
  const [activeTool, setActiveTool] = useState('brush');
  const [activeColor, setActiveColor] = useState('#3D3A5C');
  const [activeSize, setActiveSize] = useState(8);

  return (
    <div className={styles.devContainer}>
      <header className={styles.topHeader}>
        <div className={styles.logoWrap}>
          <Logo size="sm" showTagline={false} />
          <span className={styles.phaseTag}>Dev Mode: {activeTab}</span>
        </div>

        <div className={styles.navGroup}>
          <div className={styles.tabButtons}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'home' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('home')}
            >
              🏠 Home
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'private_lobby' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('private_lobby')}
            >
              👑 Lobby
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'game' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('game')}
            >
              🎨 Gameplay
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'game_over' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('game_over')}
            >
              🏆 Game Over
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'showcase' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('showcase')}
            >
              🎨 Workbench
            </button>
          </div>

          <div className={styles.viewportSelector}>
            <span className={styles.viewLabel}>Viewport:</span>
            <button
              className={`${styles.viewBtn} ${viewportMode === 'fluid' ? styles.activeView : ''}`}
              onClick={() => setViewportMode('fluid')}
            >
              Responsive
            </button>
            <button
              className={`${styles.viewBtn} ${viewportMode === '320' ? styles.activeView : ''}`}
              onClick={() => setViewportMode('320')}
            >
              📱 320px
            </button>
            <button
              className={`${styles.viewBtn} ${viewportMode === '768' ? styles.activeView : ''}`}
              onClick={() => setViewportMode('768')}
            >
              📱 768px
            </button>
            <button
              className={`${styles.viewBtn} ${viewportMode === '1024' ? styles.activeView : ''}`}
              onClick={() => setViewportMode('1024')}
            >
              💻 1024px
            </button>
          </div>
        </div>
      </header>

      <div
        className={styles.stageOuter}
        style={{
          maxWidth:
            viewportMode === '320'
              ? '320px'
              : viewportMode === '768'
              ? '768px'
              : viewportMode === '1024'
              ? '1024px'
              : '100%'
        }}
      >
        {activeTab === 'home' && (
          <Home
            currentUser={currentUser}
            onSaveUser={onSaveUser}
            onCreatePrivate={() => setActiveTab('private_lobby')}
            onJoinRoom={() => setActiveTab('private_lobby')}
          />
        )}

        {activeTab === 'private_lobby' && (
          <PrivateLobby
            roomCode={activeRoomCode || 'AB7KQ'}
            currentUser={currentUser}
            onBackToHome={() => setActiveTab('home')}
            onStartGame={() => setActiveTab('game')}
          />
        )}

        {activeTab === 'game' && (
          <GamePage
            currentUser={currentUser}
            onBackToHome={() => setActiveTab('home')}
            onGameOver={() => setActiveTab('game_over')}
          />
        )}

        {activeTab === 'game_over' && (
          <GameOverPage
            gameMode="private"
            roomCode={activeRoomCode || 'AB7KQ'}
            currentUserId={currentUser?.id || 'p1'}
            players={finalRoomData?.players}
            onPlayAgain={() => setActiveTab('private_lobby')}
            onBackToHome={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'showcase' && (
          <main className={styles.mainGrid}>
            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>1. Logo & Brand</h2>
              <div className={styles.componentBox}>
                <Logo size="lg" />
              </div>
            </section>

            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>2. Buttons & Inputs</h2>
              <div className={styles.buttonsFlex}>
                <ClayButton variant="primary" onClick={() => addToast('Primary click', '🎨')}>
                  Create Private Room
                </ClayButton>
                <ClayButton variant="secondary" onClick={() => addToast('Secondary click', '🏠')}>
                  Join Room
                </ClayButton>
                <ClayButton variant="ghost" onClick={() => setModalOpen(true)}>
                  Open Modal
                </ClayButton>
                <ClayButton variant="mint" onClick={() => addToast('Start Game', '🟢')}>
                  Start Game
                </ClayButton>
              </div>
              <div className={styles.inputsStack}>
                <ClayInput
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter nickname"
                  maxLength={20}
                  error={inputError}
                  errorMessage={inputError ? 'Please enter a valid nickname' : ''}
                />
              </div>
            </section>

            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>3. Avatars & Badges</h2>
              <div className={styles.avatarGrid}>
                {AVATAR_LIST.map((av) => (
                  <div key={av.id} className={styles.avatarItem}>
                    <Avatar avatarId={av.id} size="md" />
                    <span className={styles.avatarName}>{av.name}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>4. PlayerGrid</h2>
              <PlayerGrid players={MOCK_PLAYERS} maxCapacity={MOCK_RULES.maxCapacity} currentUserId="p1" />
            </section>

            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>5. Canvas & Toolbar</h2>
              <DrawingToolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                activeColor={activeColor}
                onColorChange={setActiveColor}
                activeSize={activeSize}
                onSizeChange={setActiveSize}
              />
              <div className={styles.canvasFrame}>
                <Canvas interactive={true} tool={activeTool} color={activeColor} size={activeSize} />
              </div>
            </section>
          </main>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Workbench Modal"
        subtitle="UI-01 Component Test"
      >
        <p className="drawo-body">Modal component from design system.</p>
      </Modal>
    </div>
  );
}
