import React from 'react';
import styles from './Logo.module.css';

export default function Logo({ size = 'md', showTagline = true }) {
  return (
    <div className={`${styles.logoContainer} ${styles[size]}`}>
      <div className={styles.wordmark}>
        <span className={styles.paletteIcon}>🎨</span>
        <span className={styles.title}>Drawo</span>
        <span className={styles.crown}>👑</span>
      </div>
      {showTagline && (
        <div className={styles.tagline}>
          Draw. Guess. Win.
        </div>
      )}
    </div>
  );
}
