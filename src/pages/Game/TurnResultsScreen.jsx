import React, { useState, useEffect } from 'react';
import Logo from '../../components/Logo';
import ClayCard from '../../components/ClayCard';
import Avatar from '../../components/Avatar';
import { MOCK_TURN_RESULTS } from '../../mocks/results.mock';
import styles from './TurnResultsScreen.module.css';

export default function TurnResultsScreen({
  results = MOCK_TURN_RESULTS,
  currentUserId,
  isFinalTurn = false,
  onNextTurn
}) {
  const [countdown, setCountdown] = useState(4);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sort players by total cumulative score descending
  const rawPlayers = results.players || [];
  const sortedPlayers = [...rawPlayers].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className={styles.resultsPage}>
      <header className={styles.topBar}>
        <Logo size="sm" showTagline={false} />
      </header>

      <main className={styles.centerContainer}>
        {/* Mascot Header */}
        <div className={styles.mascotWrap}>
          <img
            src="/assets/mascot_winner.png"
            alt="Cheering mascot"
            className={styles.mascotImg}
          />
        </div>

        <ClayCard variant="cream" className={styles.resultsCard}>
          <div className={styles.headerArea}>
            <h1 className={styles.title}>Round Complete!</h1>
            <p className={styles.subtitle}>
              The word was <strong className={styles.wordHighlight}>{results.word} {results.emoji || '🎨'}</strong>
            </p>
          </div>

          {/* Results Table with Score Breakdown */}
          <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
              <span className={styles.rankCol}>#</span>
              <span className={styles.playerCol}>Player</span>
              <span className={styles.turnPtsCol}>Turn Pts</span>
              <span className={styles.totalPtsCol}>Total</span>
            </div>

            <div className={styles.tableBody}>
              {sortedPlayers.map((player, idx) => {
                const isYou = player.id === currentUserId || player.isYou;
                const isExpanded = expandedRow === player.id;
                const breakdown = player.breakdown || {
                  base: player.turnPoints > 0 ? Math.min(800, player.turnPoints) : 0,
                  timeBonus: player.turnPoints > 800 ? player.turnPoints - 800 : 0,
                  drawerBonus: player.isDrawing ? player.turnPoints : 0
                };

                const displayName = player.nickname || player.name || `Player ${idx + 1}`;

                return (
                  <div key={player.id || idx} className={styles.rowGroup}>
                    <div
                      className={`${styles.row} ${isYou ? styles.youRow : ''}`}
                      onClick={() => setExpandedRow(isExpanded ? null : player.id)}
                    >
                      <div className={styles.rankCol}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </div>

                      <div className={styles.playerCol}>
                        <Avatar avatarId={player.avatarId ?? idx} size="sm" />
                        <div className={styles.nameGroup}>
                          <span className={styles.name}>{displayName}</span>
                          {isYou && <span className={styles.youPill}>You</span>}
                          {player.isDrawing && <span className={styles.drawerPill}>Drawer</span>}
                        </div>
                      </div>

                      <div className={styles.turnPtsCol}>
                        {player.turnPoints > 0 ? (
                          <span className={styles.turnGain}>+{player.turnPoints}</span>
                        ) : (
                          <span className={styles.noGain}>+0</span>
                        )}
                        <span className={styles.infoToggleIcon}>{isExpanded ? '▲' : 'ℹ️'}</span>
                      </div>

                      <div className={styles.totalPtsCol}>
                        <span className={styles.totalPoints}>{player.score || 0}</span>
                      </div>
                    </div>

                    {/* Breakdown Detail Dropdown */}
                    {isExpanded && (
                      <div className={styles.breakdownBox}>
                        <span className={styles.breakdownTitle}>Score Breakdown:</span>
                        <div className={styles.breakdownGrid}>
                          <div className={styles.breakdownItem}>
                            <span>Base Points:</span>
                            <strong>+{breakdown.base || 0}</strong>
                          </div>
                          <div className={styles.breakdownItem}>
                            <span>Time Bonus:</span>
                            <strong>+{breakdown.timeBonus || 0}</strong>
                          </div>
                          <div className={styles.breakdownItem}>
                            <span>Drawer Bonus:</span>
                            <strong>+{breakdown.drawerBonus || 0}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Countdown Card */}
          <div className={styles.countdownCard}>
            <span className={styles.nextText}>
              {isFinalTurn
                ? '🏆 Game complete! Loading Final Results…'
                : '🎨 Preparing next turn…'}
            </span>
            <div className={styles.timerPill}>
              {countdown > 0 ? `Next in ${countdown}…` : 'Loading…'}
            </div>
          </div>
        </ClayCard>
      </main>
    </div>
  );
}
