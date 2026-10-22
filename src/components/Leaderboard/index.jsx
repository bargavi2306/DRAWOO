import React from 'react';
import Avatar from '../Avatar';
import styles from './Leaderboard.module.css';

export default function Leaderboard({
  players = [],
  currentUserId,
  showDrawer = true, // drawer must not be ranked during their drawing turn if false
  compact = false,
  showTurnPoints = true,
  title = 'Leaderboard'
}) {
  // Filter out drawer if showDrawer is false
  const activePlayers = showDrawer ? players : players.filter(p => !p.isDrawing);

  // Sort players by total score descending
  const sortedPlayers = [...activePlayers].sort((a, b) => (b.score || 0) - (a.score || 0));

  const getRankBadge = (index) => {
    if (index === 0) return <span className={styles.goldRank}>🥇</span>;
    if (index === 1) return <span className={styles.silverRank}>🥈</span>;
    if (index === 2) return <span className={styles.bronzeRank}>🥉</span>;
    return <span className={styles.numRank}>{index + 1}</span>;
  };

  return (
    <div className={`${styles.leaderboardCard} ${compact ? styles.compact : ''}`}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.playerList}>
        {sortedPlayers.map((player, idx) => {
          const isYou = player.id === currentUserId || player.isYou;

          return (
            <div
              key={player.id || idx}
              className={`${styles.playerRow} ${isYou ? styles.youRow : ''} ${player.isGuessed ? styles.guessedRow : ''}`}
            >
              <div className={styles.rankCol}>
                {getRankBadge(idx)}
              </div>

              <div className={styles.avatarCol}>
                <Avatar
                  avatarId={player.avatarId ?? idx}
                  size="sm"
                  isGuessed={player.isGuessed}
                  isDrawing={player.isDrawing}
                />
              </div>

              <div className={styles.nameCol}>
                <div className={styles.nameLine}>
                  <span className={styles.name} title={player.nickname || player.name || 'Player'}>
                    {player.nickname || player.name || 'Player'}
                  </span>
                  {isYou && <span className={styles.youPill}>You</span>}
                </div>
                {player.isHost && <span className={styles.hostLabel}>👑 Host</span>}
              </div>

              <div className={styles.scoreCol}>
                <span className={styles.totalPoints}>
                  {player.score || 0}
                </span>
                {showTurnPoints && player.turnPoints > 0 && (
                  <span className={styles.turnPoints}>
                    +{player.turnPoints}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
