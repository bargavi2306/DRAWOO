import React, { useEffect } from 'react';
import { formatTimer } from '../../utils/gameHelpers';
import styles from './Timer.module.css';

export default function Timer({
  seconds = 60,
  urgentThreshold = 10,
  onExpire,
  format = 'mm:ss' // 'mm:ss' or 'seconds'
}) {
  const isUrgent = seconds <= urgentThreshold && seconds > 0;
  const isExpired = seconds <= 0;

  useEffect(() => {
    if (seconds === 0 && onExpire) {
      onExpire();
    }
  }, [seconds, onExpire]);

  const displayTime = format === 'seconds'
    ? `${Math.max(0, seconds)}s`
    : formatTimer(Math.max(0, seconds));

  return (
    <div className={`${styles.timerPill} ${isUrgent ? styles.urgent : ''} ${isExpired ? styles.expired : ''}`}>
      <span className={styles.clockIcon}>⏱️</span>
      <span className={styles.timeDisplay}>
        {displayTime}
      </span>
    </div>
  );
}
