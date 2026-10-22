import React from 'react';
import styles from './TurnStatus.module.css';

export default function TurnStatus({
  role = 'guesser', // 'drawer' | 'guesser'
  drawerName = 'Kavin',
  secretWord = '',
  wordCategory = ''
}) {
  const isDrawer = role === 'drawer';

  return (
    <div className={`${styles.statusContainer} ${isDrawer ? styles.drawerMode : styles.guesserMode}`}>
      <div className={styles.badgeLabel}>
        {isDrawer ? (
          <>🎨 YOU ARE DRAWING</>
        ) : (
          <>🎨 {drawerName} IS DRAWING</>
        )}
      </div>

      {isDrawer && secretWord && (
        <div className={styles.wordDisplay}>
          <span className={styles.secretWord}>{secretWord}</span>
          {wordCategory && <span className={styles.category}>({wordCategory})</span>}
        </div>
      )}
    </div>
  );
}
