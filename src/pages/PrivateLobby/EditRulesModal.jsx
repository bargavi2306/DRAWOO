import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import ClayInput from '../../components/ClayInput';
import ClayButton from '../../components/ClayButton';
import { useToast } from '../../components/Toast';
import styles from './EditRulesModal.module.css';

export default function EditRulesModal({
  isOpen,
  onClose,
  initialRules,
  onSaveRules
}) {
  const { addToast } = useToast();

  const [rounds, setRounds] = useState(initialRules?.rounds ?? 5);
  const [turnTime, setTurnTime] = useState(initialRules?.turnTime ?? 90);
  const [maxCapacity, setMaxCapacity] = useState(initialRules?.maxCapacity ?? 8);
  const [difficulty, setDifficulty] = useState(initialRules?.difficulty ?? 'Medium');
  const [language, setLanguage] = useState(initialRules?.language ?? 'English');
  const [customWordsEnabled, setCustomWordsEnabled] = useState(initialRules?.customWords ?? false);
  const [hintsEnabled, setHintsEnabled] = useState(initialRules?.hints ?? true);
  const [midGameJoinEnabled, setMidGameJoinEnabled] = useState(initialRules?.midGameJoin ?? true);

  // Custom words list state
  const [customWords, setCustomWords] = useState(initialRules?.customWordsList || ['Dinosaur', 'Pizza', 'Spacecraft']);
  const [newWordInput, setNewWordInput] = useState('');

  useEffect(() => {
    if (initialRules) {
      setRounds(initialRules.rounds ?? 5);
      setTurnTime(initialRules.turnTime ?? 90);
      setMaxCapacity(initialRules.maxCapacity ?? 8);
      setDifficulty(initialRules.difficulty ?? 'Medium');
      setLanguage(initialRules.language ?? 'English');
      setCustomWordsEnabled(initialRules.customWords ?? false);
      setHintsEnabled(initialRules.hints ?? true);
      setMidGameJoinEnabled(initialRules.midGameJoin ?? true);
      setCustomWords(initialRules.customWordsList || ['Dinosaur', 'Pizza', 'Spacecraft']);
    }
  }, [initialRules, isOpen]);

  const handleAddCustomWord = (e) => {
    if (e) e.preventDefault();
    const trimmed = newWordInput.trim();
    if (!trimmed) return;

    if (customWords.length >= 50) {
      addToast('Maximum 50 custom words allowed', '⚠️', 'warning');
      return;
    }

    if (customWords.some(w => w.toLowerCase() === trimmed.toLowerCase())) {
      addToast('Word already in list', '⚠️', 'warning');
      return;
    }

    setCustomWords(prev => [...prev, trimmed]);
    setNewWordInput('');
  };

  const handleRemoveCustomWord = (index) => {
    setCustomWords(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Custom words validation (§0.5 / §0.6 / UI Spec §0.5): Must have at least 3 custom words if custom mode is ON
    if (customWordsEnabled && customWords.length < 3) {
      addToast('Please add at least 3 custom words, or turn off Custom Words.', '⚠️', 'warning');
      return;
    }

    onSaveRules({
      rounds,
      turnTime,
      maxCapacity,
      difficulty,
      language,
      customWords: customWordsEnabled,
      hints: hintsEnabled,
      midGameJoin: midGameJoinEnabled,
      customWordsList: customWords
    });

    addToast('Game settings updated! ⚙️', '✅', 'info');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Game Rules ⚙️"
      subtitle="Host settings for this private room"
      showCloseButton={true}
      maxWidth="540px"
    >
      <div className={styles.rulesForm}>
        {/* Rounds Stepper */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelGroup}>
            <span className={styles.icon}>🔄</span>
            <span className={styles.fieldTitle}>Rounds</span>
          </div>
          <div className={styles.stepper}>
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => setRounds(Math.max(1, rounds - 1))}
            >
              −
            </button>
            <span className={styles.stepVal}>{rounds}</span>
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => setRounds(Math.min(10, rounds + 1))}
            >
              +
            </button>
          </div>
        </div>

        {/* Turn Time Dropdown */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelGroup}>
            <span className={styles.icon}>⏱️</span>
            <span className={styles.fieldTitle}>Turn Time</span>
          </div>
          <select
            value={turnTime}
            onChange={(e) => setTurnTime(Number(e.target.value))}
            className={styles.selectInput}
          >
            <option value={30}>30 seconds</option>
            <option value={45}>45 seconds</option>
            <option value={60}>60 seconds</option>
            <option value={90}>90 seconds</option>
            <option value={120}>120 seconds</option>
            <option value={180}>180 seconds</option>
          </select>
        </div>

        {/* Difficulty Dropdown */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelGroup}>
            <span className={styles.icon}>🎯</span>
            <span className={styles.fieldTitle}>Difficulty</span>
          </div>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className={styles.selectInput}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="All">All Difficulties</option>
          </select>
        </div>

        {/* Player Capacity Stepper (2 to 15) */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelGroup}>
            <span className={styles.icon}>👥</span>
            <span className={styles.fieldTitle}>Player Capacity</span>
          </div>
          <div className={styles.stepper}>
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => setMaxCapacity(Math.max(2, maxCapacity - 1))}
            >
              −
            </button>
            <span className={styles.stepVal}>{maxCapacity} players</span>
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => setMaxCapacity(Math.min(15, maxCapacity + 1))}
            >
              +
            </button>
          </div>
        </div>

        {/* Language */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelGroup}>
            <span className={styles.icon}>🌐</span>
            <span className={styles.fieldTitle}>Word Language</span>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={styles.selectInput}
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
          </select>
        </div>

        {/* Toggles */}
        <div className={styles.toggleRow}>
          <span className={styles.fieldTitle}>💡 Show Hints</span>
          <button
            type="button"
            className={`${styles.toggleSwitch} ${hintsEnabled ? styles.toggleOn : ''}`}
            onClick={() => setHintsEnabled(!hintsEnabled)}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        <div className={styles.toggleRow}>
          <span className={styles.fieldTitle}>🚪 Allow Mid-game Join</span>
          <button
            type="button"
            className={`${styles.toggleSwitch} ${midGameJoinEnabled ? styles.toggleOn : ''}`}
            onClick={() => setMidGameJoinEnabled(!midGameJoinEnabled)}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        <div className={styles.toggleRow}>
          <span className={styles.fieldTitle}>📝 Custom Words</span>
          <button
            type="button"
            className={`${styles.toggleSwitch} ${customWordsEnabled ? styles.toggleOn : ''}`}
            onClick={() => setCustomWordsEnabled(!customWordsEnabled)}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        {/* Custom Words Sub-panel */}
        {customWordsEnabled && (
          <div className={styles.customWordsPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Custom Words List</span>
              <span className={styles.panelCount}>{customWords.length} / 50 words</span>
            </div>

            <form onSubmit={handleAddCustomWord} className={styles.addWordRow}>
              <ClayInput
                value={newWordInput}
                onChange={(e) => setNewWordInput(e.target.value)}
                placeholder="Add custom word…"
                maxLength={30}
              />
              <ClayButton
                type="submit"
                variant="primary"
                size="sm"
                disabled={!newWordInput.trim()}
              >
                + Add
              </ClayButton>
            </form>

            {customWords.length < 3 && (
              <span className={styles.wordWarning}>
                ⚠️ Minimum 3 custom words required when Custom Words is ON
              </span>
            )}

            <div className={styles.chipsWrap}>
              {customWords.map((word, idx) => (
                <span key={idx} className={styles.wordChip}>
                  {word}
                  <button
                    type="button"
                    className={styles.removeChipBtn}
                    onClick={() => handleRemoveCustomWord(idx)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className={styles.footerActions}>
          <ClayButton variant="ghost" onClick={onClose}>
            Cancel
          </ClayButton>
          <ClayButton variant="primary" onClick={handleSave}>
            Save Changes
          </ClayButton>
        </div>
      </div>
    </Modal>
  );
}
