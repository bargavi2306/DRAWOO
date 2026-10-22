import React, { useEffect } from 'react';
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

  const formatTime = (secs) => {
    if (format === 'seconds') return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${styles.timerPill} ${isUrgent ? styles.urgent : ''} ${isExpired ? styles.expired : ''}`}>
      <span className={styles.clockIcon}>⏱️</span>
      <span className={styles.timeDisplay}>
        {formatTime(Math.max(0, seconds))}
      </span>
    </div>
  );
}
