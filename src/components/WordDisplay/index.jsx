import React from 'react';
import styles from './WordDisplay.module.css';

export default function WordDisplay({
  wordPattern = 'E _ E _ _ _ _ _', // e.g., "E _ E _ _ _ _ _" or "H O T   D O G"
  secretWord = 'ELEPHANT',
  revealedCount = 0
}) {
  // If wordPattern contains multi-word separator (double space or explicit word split), split by words
  // e.g. "E _ E _ _ _ _ _" -> single word
  // e.g. "H O T  /  D O G" -> multi word

  const isMultiWord = secretWord.includes(' ');
  const words = secretWord.split(' ');

  // Parse pattern into word groups
  const patternWords = wordPattern.split('  '); // double space splits words

  return (
    <div className={styles.displayContainer}>
      <div className={styles.wordsWrapper}>
        {words.map((word, wordIdx) => {
          const currentPatternWord = patternWords[wordIdx] || Array(word.length).fill('_').join(' ');
          const letters = currentPatternWord.split(' ');

          return (
            <div key={wordIdx} className={styles.wordGroup}>
              {letters.map((char, charIdx) => {
                const isRevealed = char !== '_';
                return (
                  <div
                    key={charIdx}
                    className={`${styles.tile} ${isRevealed ? styles.revealedTile : styles.blankTile}`}
                  >
                    {isRevealed ? char : ''}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className={styles.metaInfo}>
        <span className={styles.letterCountBadge}>
          {isMultiWord
            ? `${words.length} words (${words.map(w => w.length).join(', ')} letters)`
            : `${secretWord.length} letters`}
        </span>
        {revealedCount > 0 && (
          <span className={styles.hintBadge}>
            💡 {revealedCount} hint{revealedCount > 1 ? 's' : ''} revealed
          </span>
        )}
      </div>
    </div>
  );
}
