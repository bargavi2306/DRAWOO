import React from 'react';
import ClayCard from '../ClayCard';
import ClayButton from '../ClayButton';
import styles from './DisconnectOverlay.module.css';

export default function DisconnectOverlay({
  isOpen = false,
  onSimulateReconnect
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.container}>
        <ClayCard variant="cream" className={styles.overlayCard}>
          <div className={styles.signalSpotlight}>
            <span className={styles.radarIcon}>📡</span>
            <span className={styles.wave1} />
            <span className={styles.wave2} />
          </div>

          <h2 className={styles.headline}>CONNECTION LOST</h2>
          <p className={styles.bodyText}>
            Trying to reconnect… Your game is still running.
          </p>

          <div className={styles.loadingDotsRow}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>

          <div className={styles.actionRow}>
            <ClayButton
              variant="mint"
              size="md"
              onClick={onSimulateReconnect}
            >
              💚 Simulate Reconnect
            </ClayButton>
          </div>
        </ClayCard>
      </div>
    </div>
  );
}
