import React, { useState } from 'react';
import Logo from '../../components/Logo';
import RoundIndicator from '../../components/RoundIndicator';
import Timer from '../../components/Timer';
import ClayCard from '../../components/ClayCard';
import LeaveModal from '../../components/LeaveModal';
import { useToast } from '../../components/Toast';
import { MOCK_WORD_CHOICES } from '../../mocks/wordSelect.mock';
import styles from './DrawerWordSelect.module.css';

export default function DrawerWordSelect({
  currentRound = 1,
  totalRounds = 3,
  choices,
  words = MOCK_WORD_CHOICES,
  timerSeconds = 20,
  onSelectWord,
  onLeaveGame
}) {
  const { addToast } = useToast();
  const [selectedWord, setSelectedWord] = useState(null);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const wordList = (choices && choices.length > 0) ? choices : words;

  const handleWordClick = (wordItem) => {
    if (selectedWord) return;
    setSelectedWord(wordItem);
    addToast(`You chose "${wordItem.word}"! 🎨`, '🎉', 'info');
    if (onSelectWord) onSelectWord(wordItem);
  };

  const getDifficultyColor = (diff) => {
    const d = String(diff || '').toLowerCase();
    if (d === 'easy') return '#5BB89A';
    if (d === 'hard') return '#E84040';
    return '#F5C842';
  };

  return (
    <div className={styles.selectPage}>
      {/* Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Logo size="sm" showTagline={false} />
          <RoundIndicator currentRound={currentRound} totalRounds={totalRounds} />
        </div>

        <div className={styles.topBarCenter}>
          <span className={styles.topBadge}>🎨 YOUR TURN TO DRAW</span>
        </div>

        <div className={styles.topBarRight}>
          <Timer seconds={timerSeconds} urgentThreshold={5} />
          <button
            className={styles.leaveBtn}
            onClick={() => setLeaveModalOpen(true)}
            title="Leave game"
          >
            🚪
          </button>
        </div>
      </header>

      {/* Main Choice Section */}
      <main className={styles.centerContainer}>
        <ClayCard variant="cream" className={styles.choiceCard}>
          <h1 className={styles.title}>YOUR TURN! 🎨</h1>
          <p className={styles.subtitle}>Choose a word to draw (only visible to you)</p>

          <div className={styles.wordsGrid}>
            {wordList.map((item, idx) => {
              const isSelected = selectedWord?.word === item.word;

              return (
                <ClayCard
                  key={item.word || idx}
                  variant="lavender"
                  interactive={!selectedWord}
                  onClick={() => handleWordClick(item)}
                  className={`${styles.wordTile} ${isSelected ? styles.selectedTile : ''}`}
                >
                  <span className={styles.wordEmoji}>{item.emoji || '🎨'}</span>
                  <span className={styles.wordLabel}>{item.word}</span>
                  <div className={styles.diffTag}>
                    <span
                      className={styles.diffDot}
                      style={{ backgroundColor: getDifficultyColor(item.difficulty) }}
                    />
                    <span className={styles.diffText}>{item.difficulty}</span>
                  </div>
                </ClayCard>
              );
            })}
          </div>

          <div className={styles.footerNotice}>
            ⏱️ {timerSeconds}s remaining to choose… (auto-selects word 1 if timer expires)
          </div>
        </ClayCard>
      </main>

      {/* Leave Modal */}
      <LeaveModal
        isOpen={leaveModalOpen}
        onStay={() => setLeaveModalOpen(false)}
        onLeave={() => {
          setLeaveModalOpen(false);
          if (onLeaveGame) onLeaveGame();
        }}
      />
    </div>
  );
}
