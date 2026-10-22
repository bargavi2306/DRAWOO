import React from 'react';
import ClayCard from '../ClayCard';
import styles from './GameRules.module.css';

export default function GameRules({
  rules = {
    rounds: 5,
    turnTime: 90,
    difficulty: 'Medium',
    language: 'English',
    customWords: false,
    hints: true,
    midGameJoin: true,
    maxCapacity: 8
  },
  isHost = false,
  onEditRules
}) {
  const ruleItems = [
    { label: 'Rounds', value: `${rules.rounds}` },
    { label: 'Timer per turn', value: `${rules.turnTime}s` },
    { label: 'Word language', value: rules.language || 'English' },
    { label: 'Custom words', value: rules.customWords ? 'On' : 'Off' },
    { label: 'Allow mid-game join', value: rules.midGameJoin ? 'On' : 'Off' },
    { label: 'Show hints', value: rules.hints ? 'On' : 'Off' }
  ];

  return (
    <ClayCard variant="cream" className={styles.rulesCard}>
      <div className={styles.header}>
        <h3 className={styles.title}>Game Rules</h3>
        {isHost && (
          <button
            type="button"
            className={styles.editBtn}
            onClick={onEditRules}
            title="Edit Game Rules"
          >
            <span>✏️</span>
            <span>Edit</span>
          </button>
        )}
      </div>

      <div className={styles.rulesList}>
        {ruleItems.map((item, idx) => (
          <div key={idx} className={styles.ruleRow}>
            <span className={styles.ruleLabel}>{item.label}</span>
            <span className={styles.ruleValue}>{item.value}</span>
          </div>
        ))}
      </div>

      <div className={styles.shareBanner}>
        <span className={styles.shareIcon}>💡</span>
        <span>Share the room code with friends to let them join!</span>
      </div>
    </ClayCard>
  );
}
