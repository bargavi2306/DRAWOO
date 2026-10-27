import React from 'react';
import styles from './ConnectionBadge.module.css';

export default function ConnectionBadge({ status = 'connected', onClick }) {
  const getLabel = () => {
    switch (status) {
      case 'connected':
        return 'Online';
      case 'connecting':
        return 'Connecting…';
      case 'reconnecting':
        return 'Reconnecting…';
      case 'disconnected':
      default:
        return 'Offline';
    }
  };

  const getStyleClass = () => {
    switch (status) {
      case 'connected':
        return styles.connected;
      case 'connecting':
        return styles.connecting;
      case 'reconnecting':
        return styles.reconnecting;
      case 'disconnected':
      default:
        return styles.disconnected;
    }
  };

  return (
    <div
      className={`${styles.badgeContainer} ${getStyleClass()}`}
      onClick={onClick}
      role="status"
      aria-label={`Server connection status: ${getLabel()}`}
      title={`Server status: ${getLabel()}`}
    >
      <span className={styles.statusDot} aria-hidden="true" />
      <span>{getLabel()}</span>
    </div>
  );
}
