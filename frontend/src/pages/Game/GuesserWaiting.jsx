import React from 'react';
import Logo from '../../components/Logo';
import RoundIndicator from '../../components/RoundIndicator';
import Avatar from '../../components/Avatar';
import ClayCard from '../../components/ClayCard';
import { MOCK_DRAWER_INFO } from '../../mocks/wordSelect.mock';
import styles from './GuesserWaiting.module.css';

export default function GuesserWaiting({
  currentRound = 1,
  totalRounds = 3,
  drawer = MOCK_DRAWER_INFO,
  timerSeconds = 20,
  onDrawerSelected,
  onLeaveGame
}) {
  const drawerName = drawer.nickname || drawer.name || 'Drawer';

  return (
    <div className={styles.waitingPage}>
      {/* Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Logo size="sm" showTagline={false} />
          <RoundIndicator currentRound={currentRound} totalRounds={totalRounds} />
        </div>

        <div className={styles.topBarCenter}>
          <span className={styles.topBadge}>👀 GET READY TO GUESS</span>
        </div>

        <div className={styles.topBarRight}>
          <span className={styles.timerPlaceholder}>⏱️ {timerSeconds}s</span>
          <button
            className={styles.leaveBtn}
            onClick={onLeaveGame}
            title="Leave game"
          >
            🚪
          </button>
        </div>
      </header>

      {/* Main Guesser Waiting Card */}
      <main className={styles.centerContainer}>
        <ClayCard variant="cream" className={styles.waitingCard}>
          <div className={styles.iconBounceWrap}>
            <span className={styles.bouncePalette}>🎨</span>
          </div>

          <div className={styles.drawerSpotlight}>
            <Avatar avatarId={drawer.avatarId ?? 0} size="lg" isDrawing={true} />
            <h1 className={styles.headline}>{drawerName} is choosing…</h1>
            <p className={styles.subtext}>
              Waiting for {drawerName} to pick a secret word
            </p>
          </div>

          <div className={styles.pulseDotsRow}>
            <span className={styles.pulseDot} />
            <span className={styles.pulseDot} />
            <span className={styles.pulseDot} />
          </div>

          <div className={styles.mintBadge}>
            Get ready to guess! 👀
          </div>

          <div className={styles.secrecyAssurance}>
            ✅ Secrecy Enforced: No word choices, no letter blanks, no hints, and no guess input shown until word is selected.
          </div>
        </ClayCard>
      </main>
    </div>
  );
}
