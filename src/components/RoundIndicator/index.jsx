import React from 'react';
import styles from './RoundIndicator.module.css';

export default function RoundIndicator({ currentRound = 1, totalRounds = 3 }) {
  return (
    <div className={styles.roundPill}>
      <span className={styles.roundIcon}>🔄</span>
      <span className={styles.roundText}>
        Round {currentRound} / {totalRounds}
      </span>
    </div>
  );
}
