import React, { useState, useEffect } from 'react';
import Logo from '../../components/Logo';
import ClayCard from '../../components/ClayCard';
import ClayButton from '../../components/ClayButton';
import Avatar from '../../components/Avatar';
import ConfettiBurst from './ConfettiBurst';
import { MOCK_GAMEOVER_RESULTS } from '../../mocks/gameOver.mock';
import styles from './GameOver.module.css';

export default function GameOverPage({
  gameMode = 'private',
  roomCode = 'AB7KQ',
  currentUserId = 'p1',
  players = MOCK_GAMEOVER_RESULTS.players,
  winner: serverWinner = null,
  winnerMessage: serverWinnerMessage = null,
  onPlayAgain,
  onBackToHome
}) {
  const [activePlayers, setActivePlayers] = useState(players || []);

  useEffect(() => {
    if (players && players.length > 0) {
      setActivePlayers(players);
    }
  }, [players]);

  // Sort players by total cumulative score descending
  const sorted = [...activePlayers].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Determine authoritative winner
  let winner = null;
  if (serverWinner) {
    if (typeof serverWinner === 'string') {
      winner = sorted.find((p) => p.id === serverWinner) || {
        id: serverWinner,
        nickname: 'Winner',
        score: 0
      };
    } else {
      winner = serverWinner;
    }
  } else {
    winner = sorted[0] || null;
  }

  const isCurrentPlayer = (player) => {
    if (!player) return false;
    if (player.isYou) return true;
    if (currentUserId && (player.id === currentUserId || player.socketId === currentUserId)) {
      return true;
    }
    return false;
  };

  // Find current user rank & status
  const userIndex = sorted.findIndex(isCurrentPlayer);
  const userRank = userIndex !== -1 ? userIndex + 1 : null;
  const userIsWinner = Boolean(winner && isCurrentPlayer(winner));
  const winnerName = winner?.nickname || winner?.name || 'Winner';
  const winnerScore = winner?.score ?? 0;

  const getPersonalMessage = () => {
    if (serverWinnerMessage) {
      return serverWinnerMessage;
    }
    if (userIsWinner || userRank === 1) {
      return '🏆 VICTORY! Incredible drawing skills!';
    }
    if (userRank === 2 || userRank === 3) {
      return '🥈 So close! Great game!';
    }
    if (userRank && userRank >= 4) {
      return '💜 Better luck next time! That was fun!';
    }
    return `🎉 Congratulations to ${winnerName}!`;
  };

  const handlePlayAgainClick = () => {
    if (onPlayAgain) {
      onPlayAgain('private');
    }
  };

  // Prepare Podium lists based on available player counts
  const renderPodium = () => {
    if (sorted.length === 0) return null;

    if (sorted.length === 1) {
      return (
        <div className={styles.podiumContainer}>
          <PodiumColumn player={sorted[0]} rank={1} isCenter={true} isCurrentPlayer={isCurrentPlayer} />
        </div>
      );
    }

    if (sorted.length === 2) {
      return (
        <div className={styles.podiumContainer}>
          <PodiumColumn player={sorted[0]} rank={1} isCenter={true} isCurrentPlayer={isCurrentPlayer} />
          <PodiumColumn player={sorted[1]} rank={2} isCenter={false} isCurrentPlayer={isCurrentPlayer} />
        </div>
      );
    }

    // 3 or more players: Olympic podium style [2nd (left), 1st (center), 3rd (right)]
    return (
      <div className={styles.podiumContainer}>
        <PodiumColumn player={sorted[1]} rank={2} isCenter={false} isCurrentPlayer={isCurrentPlayer} />
        <PodiumColumn player={sorted[0]} rank={1} isCenter={true} isCurrentPlayer={isCurrentPlayer} />
        <PodiumColumn player={sorted[2]} rank={3} isCenter={false} isCurrentPlayer={isCurrentPlayer} />
      </div>
    );
  };

  // Players ranked 4th and below
  const lowerRankedPlayers = sorted.length > 3 ? sorted.slice(3) : [];

  return (
    <div className={styles.gameOverPage}>
      {/* Short celebratory confetti burst from both sides */}
      <ConfettiBurst />

      {/* Top Bar with brand logo */}
      <header className={styles.topBar}>
        <Logo size="sm" showTagline={false} />
      </header>

      {/* Main Container */}
      <main className={styles.centerContainer}>
        {/* Mascot Winner Header */}
        <div className={styles.mascotWrap}>
          <img
            src="/assets/mascot_winner.png"
            alt="Cheering mascot"
            className={styles.mascotImg}
          />
        </div>

        <ClayCard variant="cream" className={styles.gameOverCard}>
          {/* Heading */}
          <div className={styles.headingArea}>
            <h1 className={styles.title}>🎉 GAME OVER!</h1>
            <p className={styles.subtitle}>Here are the final results</p>
          </div>

          {/* Winner Spotlight Card */}
          <div className={styles.winnerSpotlight}>
            <div className={styles.crownWrapper}>
              <span className={styles.winnerCrown} aria-hidden="true">👑</span>
              <Avatar avatarId={winner?.avatarId ?? 0} size="lg" />
            </div>

            <div className={styles.winnerInfo}>
              {userIsWinner ? (
                <span className={`${styles.winnerBadge} ${styles.winnerBadgeYou}`}>
                  🏆 YOU WON!
                </span>
              ) : (
                <span className={styles.winnerBadge}>
                  👑 1ST PLACE WINNER
                </span>
              )}

              <div className={styles.winnerNameRow}>
                <h2 className={styles.winnerName} title={winnerName}>
                  {winnerName}
                </h2>
              </div>

              <div className={styles.winnerScorePill}>
                <span>⭐</span>
                <span>{`${winnerScore.toLocaleString()} total pts`}</span>
              </div>
            </div>
          </div>

          {/* Personal Victory / Consolation Banner */}
          <div className={styles.messageBanner}>
            {getPersonalMessage()}
          </div>

          {/* Overall Leaderboard Section */}
          <section className={styles.leaderboardSection} aria-label="Final Leaderboard">
            <div className={styles.leaderboardHeader}>
              <h3 className={styles.leaderboardTitle}>
                <span>🏆</span>
                <span>Overall Leaderboard</span>
              </h3>
              <span className={styles.playerCountBadge}>
                {`${sorted.length} ${sorted.length === 1 ? 'Player' : 'Players'}`}
              </span>
            </div>

            {/* Top Podium */}
            {renderPodium()}

            {/* Lower-ranked Players (Rank 4+) */}
            {lowerRankedPlayers.length > 0 && (
              <div className={styles.lowerRankList}>
                {lowerRankedPlayers.map((player, idx) => {
                  const rank = idx + 4;
                  const isYou = isCurrentPlayer(player);
                  const displayName = player.nickname || player.name || `Player ${rank}`;
                  const score = player.score ?? 0;

                  return (
                    <div
                      key={player.id || idx}
                      className={`${styles.lowerRankRow} ${isYou ? styles.lowerRankYouRow : ''}`}
                    >
                      <span className={styles.lowerRankNum}>{`#${rank}`}</span>

                      <div className={styles.lowerPlayerInfo}>
                        <Avatar avatarId={player.avatarId ?? (idx + 3)} size="sm" />
                        <div className={styles.lowerNameGroup}>
                          <span className={styles.lowerPlayerName} title={displayName}>
                            {displayName}
                          </span>
                          {isYou && <span className={styles.lowerYouPill}>You</span>}
                        </div>
                      </div>

                      <span className={styles.lowerScore}>
                        {`${score.toLocaleString()} pts`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Action Buttons */}
          <div className={styles.actionsRow}>
            <div className={styles.actionBtnWrapper}>
              <ClayButton
                variant="primary"
                size="lg"
                onClick={handlePlayAgainClick}
                icon="🔄"
                fullWidth
                aria-label="Play again in Private Lobby"
              >
                Play Again (Private Lobby)
              </ClayButton>
            </div>

            <div className={styles.actionBtnWrapper}>
              <ClayButton
                variant="secondary"
                size="lg"
                onClick={onBackToHome}
                icon="🏠"
                fullWidth
                aria-label="Back to home screen"
              >
                Back to Home
              </ClayButton>
            </div>
          </div>
        </ClayCard>
      </main>
    </div>
  );
}

// Subcomponent for individual podium column
function PodiumColumn({ player, rank, isCenter = false, isCurrentPlayer }) {
  if (!player) return null;

  const isYou = isCurrentPlayer(player);
  const displayName = player.nickname || player.name || `Player ${rank}`;
  const score = player.score ?? 0;

  const rankPillClass =
    rank === 1
      ? styles.rankPillGold
      : rank === 2
      ? styles.rankPillSilver
      : styles.rankPillBronze;

  const pedestalClass =
    rank === 1
      ? styles.pedestalFirst
      : rank === 2
      ? styles.pedestalSecond
      : styles.pedestalThird;

  const colClass =
    rank === 1
      ? styles.podiumFirst
      : rank === 2
      ? styles.podiumSecond
      : styles.podiumThird;

  const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';

  return (
    <div className={`${styles.podiumColumn} ${colClass}`}>
      <div className={styles.podiumAvatarWrap}>
        {rank === 1 && <span className={styles.podiumCrown} aria-hidden="true">👑</span>}
        <Avatar
          avatarId={player.avatarId ?? (rank - 1)}
          size={rank === 1 ? 'md' : 'sm'}
          className={rank === 1 ? styles.podiumGlow : ''}
        />
      </div>

      <span className={`${styles.rankPill} ${rankPillClass}`}>
        <span>{medalEmoji}</span>
        <span>{rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}</span>
      </span>

      <span className={styles.podiumName} title={displayName}>
        {displayName}
      </span>

      {isYou && <span className={styles.podiumYouPill}>You</span>}

      <span className={styles.podiumScore}>
        {`${score.toLocaleString()} pts`}
      </span>

      <div className={`${styles.pedestal} ${pedestalClass}`}>
        {rank}
      </div>
    </div>
  );
}
