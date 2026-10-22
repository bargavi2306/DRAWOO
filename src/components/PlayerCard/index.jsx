import React from 'react';
import Avatar from '../Avatar';
import styles from './PlayerCard.module.css';

export default function PlayerCard({
  isEmpty = false,
  avatarId = 0,
  name = '',
  score = 0,
  isHost = false,
  isYou = false,
  isGuessed = false,
  isDrawing = false,
  onClick,
  slotNumber
}) {
  if (isEmpty) {
    return (
      <div className={`${styles.cardContainer} ${styles.emptyCard}`} onClick={onClick}>
        <div className={styles.plusIcon}>+</div>
        <span className={styles.emptyText}>
          {slotNumber ? `Slot ${slotNumber}` : 'Empty'}
        </span>
      </div>
    );
  }

  return (
    <div className={`${styles.cardContainer} ${isYou ? styles.youCard : ''}`}>
      {isHost && (
        <div className={styles.crownBadge} title="Room Host">
          👑
        </div>
      )}

      <div className={styles.avatarArea}>
        <Avatar
          avatarId={avatarId}
          size="md"
          isGuessed={isGuessed}
          isDrawing={isDrawing}
        />
      </div>

      <div className={styles.infoArea}>
        <div className={styles.nameRow}>
          <span className={styles.name} title={name}>
            {name}
          </span>
        </div>

        <div className={styles.badgeRow}>
          {isYou && <span className={styles.youBadge}>You</span>}
          {score !== undefined && score !== null && (
            <span className={styles.scoreText}>{score} pts</span>
          )}
        </div>
      </div>
    </div>
  );
}
