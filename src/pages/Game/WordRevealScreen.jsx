import React, { useEffect } from 'react';
import Logo from '../../components/Logo';
import ClayCard from '../../components/ClayCard';
import styles from './WordRevealScreen.module.css';

export default function WordRevealScreen({
  scenario = 'all_guessed', // 'all_guessed' | 'timer_expired' | 'disconnected'
  word = 'ELEPHANT',
  emoji = '🐘',
  category = 'Animals',
  onFinish
}) {
  // ~2-second presentation duration (§8.6 Amendment)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const getScenarioContent = () => {
    if (scenario === 'timer_expired') {
      return {
        icon: '⏰',
        title: "TIME'S UP!",
        subtitle: 'The round timer ran out before everyone guessed.'
      };
    }
    if (scenario === 'disconnected' || scenario === 'drawer_disconnected') {
      return {
        icon: '⚠️',
        title: 'DRAWER DISCONNECTED',
        subtitle: 'The drawer lost connection. Moving to turn results.'
      };
    }
    return {
      icon: '🎉',
      title: 'ALL PLAYERS GUESSED!',
      subtitle: 'Everyone got the secret word!'
    };
  };

  const content = getScenarioContent();

  return (
    <div className={styles.revealPage}>
      <header className={styles.topBar}>
        <Logo size="sm" showTagline={false} />
      </header>

      <main className={styles.centerContainer}>
        <ClayCard variant="cream" className={styles.revealCard}>
          <div className={styles.iconSpotlight}>
            <span className={styles.scenarioIcon}>{content.icon}</span>
          </div>

          <h1 className={styles.title}>{content.title}</h1>
          <p className={styles.subtitle}>{content.subtitle}</p>

          <div className={styles.wordRevealBox}>
            <span className={styles.revealLabel}>THE WORD WAS</span>
            <div className={styles.wordRow}>
              <span className={styles.wordEmoji}>{emoji}</span>
              <span className={styles.wordText}>{word}</span>
            </div>
            {category && <span className={styles.categoryBadge}>{category}</span>}
          </div>

          <div className={styles.loadingBarTrack}>
            <div className={styles.loadingBarFill} />
          </div>
        </ClayCard>
      </main>
    </div>
  );
}
