import React, { useState } from 'react';
import Modal from '../../components/Modal';
import ClayButton from '../../components/ClayButton';
import styles from './SettingsModal.module.css';

export default function SettingsModal({
  isOpen,
  onClose
}) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings ⚙️"
      subtitle="Audio & Preferences"
      showCloseButton={true}
    >
      <div className={styles.settingsContent}>
        <div className={styles.settingRow}>
          <div className={styles.labelGroup}>
            <span className={styles.icon}>🔊</span>
            <div>
              <span className={styles.settingTitle}>Sound Effects</span>
              <span className={styles.settingDesc}>In-game sound effects & timer alerts</span>
            </div>
          </div>
          <button
            type="button"
            className={`${styles.toggleSwitch} ${soundEnabled ? styles.toggleOn : ''}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.labelGroup}>
            <span className={styles.icon}>🎵</span>
            <div>
              <span className={styles.settingTitle}>Background Music</span>
              <span className={styles.settingDesc}>Lobby & round background music</span>
            </div>
          </div>
          <button
            type="button"
            className={`${styles.toggleSwitch} ${musicEnabled ? styles.toggleOn : ''}`}
            onClick={() => setMusicEnabled(!musicEnabled)}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        <div className={styles.footerAction}>
          <ClayButton
            variant="primary"
            size="md"
            fullWidth={true}
            onClick={onClose}
          >
            Done
          </ClayButton>
        </div>
      </div>
    </Modal>
  );
}
