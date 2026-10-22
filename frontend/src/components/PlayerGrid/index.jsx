import React from 'react';
import PlayerCard from '../PlayerCard';
import styles from './PlayerGrid.module.css';

export default function PlayerGrid({
  players = [],
  maxCapacity = 8,
  currentUserId,
  onEmptySlotClick
}) {
  const emptySlotsCount = Math.max(0, maxCapacity - players.length);
  const emptySlots = Array.from({ length: emptySlotsCount }, (_, i) => i + players.length + 1);

  return (
    <div className={styles.gridContainer}>
      <div className={styles.gridHeader}>
        <span className={styles.headingText}>PLAYERS</span>
        <span className={styles.counterBadge}>
          {players.length}/{maxCapacity}
        </span>
      </div>

      <div className={styles.grid}>
        {players.map((player, idx) => (
          <PlayerCard
            key={player.id || idx}
            avatarId={player.avatarId ?? idx}
            name={player.nickname || player.name || `Player ${idx + 1}`}
            score={player.score}
            isHost={player.isHost}
            isYou={player.id === currentUserId || player.isYou}
            isGuessed={player.isGuessed}
            isDrawing={player.isDrawing}
          />
        ))}

        {emptySlots.map((slotNum) => (
          <PlayerCard
            key={`empty-${slotNum}`}
            isEmpty={true}
            slotNumber={slotNum}
            onClick={onEmptySlotClick}
          />
        ))}
      </div>
    </div>
  );
}
