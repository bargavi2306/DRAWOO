import React from 'react';
import Modal from '../Modal';
import ClayButton from '../ClayButton';
import styles from './KickedModal.module.css';

export default function KickedModal({ isOpen = false, onClose, onBackToHome }) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="REMOVED FROM ROOM"
      showCloseButton={false}
      maxWidth="420px"
    >
      <div className={styles.container}>
        <div className={styles.iconWrap}>
          <span className={styles.icon}>⚡</span>
        </div>
        <div className={styles.textStack}>
          <h3 className={styles.heading}>You were removed from the room.</h3>
          <p className={styles.message}>
            The host removed you from the game session.
          </p>
        </div>
        <div className={styles.actions}>
          <ClayButton variant="primary" size="md" onClick={onBackToHome || onClose}>
            🏠 BACK TO HOME
          </ClayButton>
        </div>
      </div>
    </Modal>
  );
}
